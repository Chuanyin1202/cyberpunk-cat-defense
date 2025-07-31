// 賽博龐克貓咪塔防 - 主遊戲類
// 簡化版本，專注於基地防禦和手機觸控

class CyberpunkCatDefense {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // 事件處理器引用（用於清理）
        this.eventHandlers = {};
        this.animationFrameId = null;
        
        // 響應式設計初始化
        this.initResponsiveCanvas();
        
        // 遊戲狀態
        this.gameState = {
            lives: GameConfig.GAME.INITIAL_LIVES,
            gold: GameConfig.GAME.INITIAL_GOLD,
            wave: 1,
            score: 0,
            kills: 0,
            streak: 0,
            isGameOver: false,
            isPaused: false,
            startTime: Date.now(),
            mouseX: null,
            mouseY: null
        };
        
        // 初始化系統
        this.base = new CyberpunkCatBase(this);
        this.enemyManager = new EnemyManager(this);
        this.projectileManager = new ProjectileManager(this);
        this.particleManager = new ParticleManager();
        this.performanceMonitor = new PerformanceMonitor();
        // 手機控制系統已在 mobileControls.js 中自動初始化
        this.touchEnhancer = new TouchEnhancer(this);  // 觸控增強系統
        
        // 創建空間網格系統（優化碰撞檢測）
        this.spatialGrid = new SpatialGrid(GameConfig.CANVAS.WIDTH, GameConfig.CANVAS.HEIGHT, GameConstants.SPATIAL_GRID.CELL_SIZE);
        // 移除未使用的環形技能選單
        // this.radialSkillMenu = new RadialSkillMenu(this);
        this.upgradeSystem = new UpgradeSystem(this);
        
        // 事件總線監聽器參考
        this.eventListeners = [];
        
        // 快捷引用
        this.enemies = this.enemyManager.enemies;
        this.particles = this.particleManager.particles;
        
        // 總計數據
        this.stats = {
            totalEnemiesKilled: 0,
            totalDamageDealt: 0,
            totalGoldEarned: 0,
            totalWavesCompleted: 0
        };
        
        // 背景數據流粒子
        this.backgroundParticles = [];
        this.initBackgroundParticles();
        
        // 控制
        this.lastFrameTime = 0;
        
        // 初始化
        this.init();
    }
    
    // 響應式畫布設定
    initResponsiveCanvas() {
        this.eventHandlers.resize = () => {
            const isMobile = window.innerWidth <= 768;
            const isPortrait = window.innerHeight > window.innerWidth;
            
            // 記錄螢幕狀態
            this.isPortraitMode = isPortrait && isMobile;
            
            // 設定手機渲染縮放係數（直屏時縮小基地）
            this.mobileRenderScale = (this.isPortraitMode) ? 0.75 : 1.0;
            
            // 重置繪圖上下文的變換矩陣
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            
            if (isMobile) {
                // 手機模式：充滿整個螢幕
                this.canvas.style.width = '100vw';
                this.canvas.style.height = '100vh';
                this.canvas.style.position = 'fixed';
                this.canvas.style.top = '0';
                this.canvas.style.left = '0';
                this.canvas.style.zIndex = '1';
                
                // 始終使用標準畫布尺寸，避免破壞遊戲邏輯
                this.canvas.width = GameConfig.CANVAS.WIDTH;
                this.canvas.height = GameConfig.CANVAS.HEIGHT;
                
                // 計算縮放比例
                this.mobileScale = Math.min(
                    window.innerWidth / GameConfig.CANVAS.WIDTH,
                    window.innerHeight / GameConfig.CANVAS.HEIGHT
                );
                
                // 計算居中偏移
                this.mobileOffsetX = (window.innerWidth - GameConfig.CANVAS.WIDTH * this.mobileScale) / 2;
                this.mobileOffsetY = (window.innerHeight - GameConfig.CANVAS.HEIGHT * this.mobileScale) / 2;
                
            } else {
                // 桌面模式：保持清晰度
                const maxWidth = window.innerWidth - (GameConstants.RESPONSIVE?.WINDOW_PADDING || 40);
                const maxHeight = window.innerHeight - (GameConstants.RESPONSIVE?.WINDOW_PADDING || 40);
                
                let scale = Math.min(maxWidth / GameConfig.CANVAS.WIDTH, maxHeight / GameConfig.CANVAS.HEIGHT);
                
                // 設置CSS顯示尺寸
                this.canvas.style.width = (GameConfig.CANVAS.WIDTH * scale) + 'px';
                this.canvas.style.height = (GameConfig.CANVAS.HEIGHT * scale) + 'px';
                this.canvas.style.position = 'relative';
                this.canvas.style.zIndex = 'auto';
                
                // 考慮設備像素比以保持清晰度
                const pixelRatio = window.devicePixelRatio || 1;
                this.canvas.width = GameConfig.CANVAS.WIDTH * pixelRatio;
                this.canvas.height = GameConfig.CANVAS.HEIGHT * pixelRatio;
                
                // 縮放繪圖上下文以匹配設備像素比
                this.ctx.scale(pixelRatio, pixelRatio);
                
                this.mobileScale = 1;
                this.mobileOffsetX = 0;
                this.mobileOffsetY = 0;
                this.isPortraitMode = false;
            }
        };
        
        window.addEventListener('resize', this.eventHandlers.resize);
        this.eventHandlers.resize();
    }
    
    // 初始化遊戲
    init() {
        // 設定全域引用供其他模組使用
        window.currentGame = this;
        
        this.setupEventListeners();
        this.bindEvents();
        this.startGameLoop();
        console.log('🐱 賽博龐克貓咪塔防啟動！');
        
        // 發送遊戲開始事件
        if (window.gameEventBus) {
            window.gameEventBus.emit(GameEvents.GAME_START, {
                timestamp: Date.now(),
                config: GameConfig
            });
        }
    }
    
    // 設置事件總線監聽器
    setupEventListeners() {
        if (!window.gameEventBus) return;
        
        // 敵人死亡事件
        this.eventListeners.push(
            window.gameEventBus.on(GameEvents.ENEMY_DEATH, (data) => {
                this.stats.totalEnemiesKilled++;
                this.stats.totalGoldEarned += data.reward;
            })
        );
        
        // 基地受傷事件
        this.eventListeners.push(
            window.gameEventBus.on(GameEvents.BASE_DAMAGE, (data) => {
                // 可以在這裡添加音效或其他效果
                console.log(`基地受到 ${data.damage} 點傷害`);
            })
        );
        
        // 升級購買事件
        this.eventListeners.push(
            window.gameEventBus.on(GameEvents.UPGRADE_PURCHASE, (data) => {
                console.log(`購買升級: ${data.name}`);
            })
        );
        
        // 分數更新事件
        this.eventListeners.push(
            window.gameEventBus.on(GameEvents.SCORE_UPDATE, (data) => {
                // 可以觸發 UI 動畫等
            })
        );
    }
    
    // 清理所有資源
    cleanup() {
        console.log('🧹 開始清理遊戲資源...');
        
        // 停止動畫循環
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // 清理所有事件監聽器
        this.removeAllEventListeners();
        
        // 清理事件總線監聽器
        if (this.eventListeners && window.gameEventBus) {
            this.eventListeners.forEach(unsubscribe => {
                if (typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            });
            this.eventListeners = [];
        }
        
        // 清理計時器
        if (window.timerManager) {
            window.timerManager.clearAll();
        }
        
        // 清理子系統
        if (this.upgradeSystem && this.upgradeSystem.cleanup) {
            this.upgradeSystem.cleanup();
        }
        // 手機控制系統清理由 mobileControls 自動處理
        if (this.touchEnhancer && this.touchEnhancer.cleanup) {
            this.touchEnhancer.cleanup();
        }
        
        // 清理物件池
        if (window.objectPoolManager) {
            window.objectPoolManager.clear();
        }
        
        // 清理性能統計
        if (window.performanceStats && window.performanceStats.cleanup) {
            window.performanceStats.cleanup();
        }
        
        console.log('✅ 遊戲資源清理完成');
    }
    
    // 移除所有事件監聽器
    removeAllEventListeners() {
        // 移除視窗事件
        if (this.eventHandlers.resize) {
            window.removeEventListener('resize', this.eventHandlers.resize);
        }
        if (this.eventHandlers.blur) {
            window.removeEventListener('blur', this.eventHandlers.blur);
        }
        if (this.eventHandlers.focus) {
            window.removeEventListener('focus', this.eventHandlers.focus);
        }
        
        // 移除文檔事件
        if (this.eventHandlers.touchmoveDoc) {
            document.removeEventListener('touchmove', this.eventHandlers.touchmoveDoc);
        }
        if (this.eventHandlers.touchstartDoc) {
            document.removeEventListener('touchstart', this.eventHandlers.touchstartDoc);
        }
        if (this.eventHandlers.visibilitychange) {
            document.removeEventListener('visibilitychange', this.eventHandlers.visibilitychange);
        }
        
        // 移除畫布事件
        if (this.eventHandlers.touchstart) {
            this.canvas.removeEventListener('touchstart', this.eventHandlers.touchstart);
        }
        if (this.eventHandlers.click) {
            this.canvas.removeEventListener('click', this.eventHandlers.click);
        }
        if (this.eventHandlers.mousemove) {
            this.canvas.removeEventListener('mousemove', this.eventHandlers.mousemove);
        }
        if (this.eventHandlers.touchmove) {
            this.canvas.removeEventListener('touchmove', this.eventHandlers.touchmove);
        }
        if (this.eventHandlers.mouseleave) {
            this.canvas.removeEventListener('mouseleave', this.eventHandlers.mouseleave);
        }
        if (this.eventHandlers.keydown) {
            document.removeEventListener('keydown', this.eventHandlers.keydown);
        }
        
        // 清空事件處理器引用
        this.eventHandlers = {};
    }
    
    // 綁定事件 - 只支援觸控
    bindEvents() {
        // 防止頁面滾動和縮放
        this.eventHandlers.touchmoveDoc = (e) => e.preventDefault();
        this.eventHandlers.touchstartDoc = (e) => e.preventDefault();
        document.addEventListener('touchmove', this.eventHandlers.touchmoveDoc, { passive: false });
        document.addEventListener('touchstart', this.eventHandlers.touchstartDoc, { passive: false });
        
        // 觸控事件
        this.eventHandlers.touchstart = (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleTouch({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        };
        this.canvas.addEventListener('touchstart', this.eventHandlers.touchstart, { passive: false });
        
        // 桌面點擊支援
        this.eventHandlers.click = (e) => {
            this.handleTouch(e);
        };
        this.canvas.addEventListener('click', this.eventHandlers.click);
        
        // 綁定技能按鈕
        this.bindSkillButtons();
        
        // 滑鼠移動追蹤
        this.eventHandlers.mousemove = (e) => {
            this.handleMouseMove(e);
        };
        this.canvas.addEventListener('mousemove', this.eventHandlers.mousemove);
        
        // 觸控移動追蹤
        this.eventHandlers.touchmove = (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.handleMouseMove({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            }
        };
        this.canvas.addEventListener('touchmove', this.eventHandlers.touchmove, { passive: false });
        
        // 滑鼠離開畫布
        this.eventHandlers.mouseleave = () => {
            this.gameState.mouseX = null;
            this.gameState.mouseY = null;
        };
        this.canvas.addEventListener('mouseleave', this.eventHandlers.mouseleave);
        
        // 窗口焦點管理
        this.eventHandlers.blur = () => this.pauseGame();
        this.eventHandlers.focus = () => this.resumeGame();
        window.addEventListener('blur', this.eventHandlers.blur);
        window.addEventListener('focus', this.eventHandlers.focus);
        
        // 視窗可見性變化
        this.eventHandlers.visibilitychange = () => {
            if (document.hidden) {
                this.pauseGame();
            } else {
                this.resumeGame();
            }
        };
        document.addEventListener('visibilitychange', this.eventHandlers.visibilitychange);
        
        // 鍵盤事件（調試功能）
        this.eventHandlers.keydown = (e) => {
            // G 鍵：切換空間網格調試顯示
            if (e.key === 'g' || e.key === 'G') {
                this.debugSpatialGrid = !this.debugSpatialGrid;
                console.log(`空間網格調試: ${this.debugSpatialGrid ? '開啟' : '關閉'}`);
            }
        };
        document.addEventListener('keydown', this.eventHandlers.keydown);
    }
    
    // 初始化背景數據流粒子
    initBackgroundParticles() {
        const particleCount = GameConstants.RENDERING.BACKGROUND_PARTICLE_COUNT;
        for (let i = 0; i < particleCount; i++) {
            this.backgroundParticles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                speed: 20 + Math.random() * 30,  // 垂直速度
                alpha: 0.1 + Math.random() * 0.2,  // 透明度
                char: Math.random() > 0.5 ? '0' : '1',  // 二進制字符
                size: 10 + Math.random() * 5,
                color: '#00ff00'  // 矩陣綠
            });
        }
    }
    
    // 更新背景粒子
    updateBackgroundParticles(deltaTime) {
        for (const particle of this.backgroundParticles) {
            particle.y += particle.speed * deltaTime;
            
            // 重置到頂部
            if (particle.y > this.canvas.height + 20) {
                particle.y = -20;
                particle.x = Math.random() * this.canvas.width;
                particle.char = Math.random() > 0.5 ? '0' : '1';
            }
        }
    }
    
    // 渲染背景粒子
    renderBackgroundParticles(ctx) {
        ctx.save();
        ctx.font = 'monospace';
        
        for (const particle of this.backgroundParticles) {
            ctx.globalAlpha = particle.alpha;
            ctx.fillStyle = particle.color;
            ctx.font = `${particle.size}px monospace`;
            ctx.fillText(particle.char, particle.x, particle.y);
        }
        
        ctx.restore();
    }
    
    // 初始化技能圖標
    initializeSkillIcons() {
        // 電漿彈圖標
        const plasmaCanvas = document.querySelector('#skill-plasma .skill-icon-canvas');
        if (plasmaCanvas) {
            const ctx = plasmaCanvas.getContext('2d');
            this.drawPlasmaIcon(ctx, 28, 28);
        }
        
        // 脈衝波圖標
        const pulseCanvas = document.querySelector('#skill-pulse .skill-icon-canvas');
        if (pulseCanvas) {
            const ctx = pulseCanvas.getContext('2d');
            this.drawPulseIcon(ctx, 28, 28);
        }
    }
    
    // 繪製電漿彈圖標
    drawPlasmaIcon(ctx, cx, cy) {
        ctx.clearRect(0, 0, 56, 56);
        
        // 外層光暈
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, '#00ffff');
        gradient.addColorStop(0.6, '#0088ff');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // 內核
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // 電弧裝飾
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 5;
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            ctx.beginPath();
            ctx.arc(cx, cy, 12, angle, angle + Math.PI / 4);
            ctx.stroke();
        }
    }
    
    // 繪製脈衝波圖標
    drawPulseIcon(ctx, cx, cy) {
        ctx.clearRect(0, 0, 56, 56);
        
        // 繪製三個同心圓環
        const colors = ['#ff00ff', '#00ffff', '#ffffff'];
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = colors[i];
            ctx.lineWidth = 3 - i * 0.5;
            ctx.shadowBlur = 10;
            ctx.shadowColor = colors[i];
            ctx.globalAlpha = 1 - i * 0.3;
            
            ctx.beginPath();
            ctx.arc(cx, cy, 8 + i * 8, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 中心點
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 處理觸控/點擊
    handleTouch(event) {
        if (this.gameState.isGameOver || this.gameState.isPaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = GameConfig.CANVAS.WIDTH / rect.width;
        const scaleY = GameConfig.CANVAS.HEIGHT / rect.height;
        
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        
        
        // 使用觸控增強系統處理
        if (this.touchEnhancer) {
            this.touchEnhancer.handleEnhancedTouch(x, y, 'end');
        }
        
        // 創建觸控特效
        this.particleManager.createTouchEffect(x, y);
        
        // 觸發彈幕系統的特殊攻擊
        if (this.base && this.base.bulletSystem) {
            this.base.bulletSystem.fireSpecialAttack(x, y);
        }
    }
    
    // 處理滑鼠移動
    handleMouseMove(event) {
        // 在手機上禁用滑鼠事件處理，避免與觸控衝突
        if (window.mobileControls && window.mobileControls.isEnabled) {
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = GameConfig.CANVAS.WIDTH / rect.width;
        const scaleY = GameConfig.CANVAS.HEIGHT / rect.height;
        
        this.gameState.mouseX = (event.clientX - rect.left) * scaleX;
        this.gameState.mouseY = (event.clientY - rect.top) * scaleY;
    }
    
    // 處理手機瞄準輸入
    handleMobileControlsInput() {
        if (!window.mobileControls || !mobileControls.isEnabled) return;
        
        // 使用搖桿方向控制
        const attackDir = mobileControls.getAttackDirection();
        
        if (attackDir) {
            // 使用方向計算瞄準點（增加範圍到 350）
            const range = 350;
            const targetX = this.base.x + attackDir.x * range;
            const targetY = this.base.y + attackDir.y * range;
            
            // 確保瞄準點在畫布範圍內
            const clampedX = Math.max(0, Math.min(GameConfig.CANVAS.WIDTH, targetX));
            const clampedY = Math.max(0, Math.min(GameConfig.CANVAS.HEIGHT, targetY));
            
            this.gameState.mouseX = clampedX;
            this.gameState.mouseY = clampedY;
        }
    }
    
    // 綁定技能按鈕
    bindSkillButtons() {
        // 技能系統簡化，移除攻擊系統依賴
        
        // 初始化技能圖標
        this.initializeSkillIcons();
        
        console.log('技能按鈕系統已簡化');
        
    }
    
    // 開始遊戲循環
    startGameLoop() {
        const gameLoop = (currentTime) => {
            if (!this.gameState.isGameOver) {
                // 開始幀統計
                if (window.performanceStats) {
                    window.performanceStats.startFrame();
                }
                
                const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 1/30);
                this.lastFrameTime = currentTime;
                
                if (!this.gameState.isPaused) {
                    this.update(deltaTime);
                } else {
                    // 即使暫停時也需要更新升級UI
                    if (this.upgradeSystem) {
                        this.upgradeSystem.update(deltaTime);
                    }
                }
                
                // 記錄更新時間
                if (window.performanceStats) {
                    window.performanceStats.recordUpdateTime();
                }
                
                this.render();
                this.performanceMonitor.update(currentTime);
                
                // 結束幀統計
                if (window.performanceStats) {
                    window.performanceStats.endFrame();
                }
                
                this.animationFrameId = requestAnimationFrame(gameLoop);
            }
        };
        
        this.lastFrameTime = performance.now();
        this.animationFrameId = requestAnimationFrame(gameLoop);
    }
    
    // 主更新循環
    update(deltaTime) {
        // 更新對象池管理器
        if (window.objectPoolManager) {
            window.objectPoolManager.update();
        }
        
        // 更新背景粒子
        this.updateBackgroundParticles(deltaTime);
        
        // 更新螢幕震動
        if (this.screenShake && this.screenShake.duration > 0) {
            this.screenShake.time += deltaTime;
            if (this.screenShake.time < this.screenShake.duration) {
                // 計算震動偏移
                const progress = this.screenShake.time / this.screenShake.duration;
                const intensity = this.screenShake.intensity * (1 - progress);
                this.shakeOffsetX = (Math.random() - 0.5) * intensity;
                this.shakeOffsetY = (Math.random() - 0.5) * intensity;
            } else {
                this.screenShake.duration = 0;
                this.shakeOffsetX = 0;
                this.shakeOffsetY = 0;
            }
        }
        
        // 更新警告閃爍
        if (this.warningFlash && this.warningFlash.active) {
            this.warningFlash.time += deltaTime;
            if (this.warningFlash.time >= this.warningFlash.duration) {
                this.warningFlash.active = false;
            }
        }
        
        // 更新基地
        this.base.update(deltaTime);
        
        // 更新敵人管理器
        this.enemyManager.update(deltaTime);
        
        // 更新空間網格（用於優化碰撞檢測）
        this.spatialGrid.clear();
        for (const enemy of this.enemyManager.enemies) {
            if (enemy.active) {
                this.spatialGrid.insert(enemy, enemy.x, enemy.y);
            }
        }
        
        // 更新投射物
        this.projectileManager.update(deltaTime);
        
        // 更新粒子
        this.particleManager.update(deltaTime);
        
        // 更新虛擬搖桿
        // 處理手機控制輸入
        this.handleMobileControlsInput();
        
        // 更新觸控增強系統
        if (this.touchEnhancer) {
            this.touchEnhancer.update(deltaTime);
        }
        
        // 更新環形選單
        // 移除環形技能選單更新
        // this.radialSkillMenu.update(deltaTime);
        
        // 更新升級系統
        this.upgradeSystem.update(deltaTime);
        
        // 更新特殊效果
        this.updateSpecialEffects(deltaTime);
        
        // 更新 UI
        this.updateUI();
        
        // 更新技能UI
        this.updateSkillsUI();
        
        // 檢查遊戲結束
        this.checkGameOver();
    }
    
    // 主渲染循環
    render() {
        // 保存畫布狀態
        this.ctx.save();
        
        // 應用螢幕震動
        if (this.shakeOffsetX || this.shakeOffsetY) {
            this.ctx.translate(this.shakeOffsetX || 0, this.shakeOffsetY || 0);
        }
        
        // 清空畫布（使用實際畫布尺寸）
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 渲染背景數據流（最底層）
        this.renderBackgroundParticles(this.ctx);
        
        // 渲染基地（最重要的部分）
        this.base.render(this.ctx);
        
        // 渲染敵人
        this.enemyManager.render(this.ctx);
        
        // 渲染投射物
        this.projectileManager.render(this.ctx);
        
        // 渲染粒子特效
        this.particleManager.render(this.ctx);
        
        // 渲染特殊效果
        this.renderSpecialEffects(this.ctx);
        
        // 渲染環形選單（最上層）
        // 移除環形技能選單渲染
        // this.radialSkillMenu.render(this.ctx);
        
        // 渲染升級系統UI
        this.upgradeSystem.render(this.ctx);
        
        // 渲染觸控增強效果
        if (this.touchEnhancer) {
            this.touchEnhancer.render(this.ctx);
        }
        
        // 調試模式：渲染空間網格（按 G 鍵切換）
        if (this.debugSpatialGrid) {
            this.spatialGrid.debugRender(this.ctx);
        }
        
        // 手機控制UI由 mobileControls 自動渲染
        
        // 恢復畫布狀態（在所有渲染完成後）
        this.ctx.restore();
        
        // 渲染警告閃爍效果（在恢復狀態後，不受震動影響）
        if (this.warningFlash && this.warningFlash.active) {
            this.renderWarningFlash(this.ctx);
        }
    }
    
    // 創建投射物（基地攻擊用）
    createProjectile(x, y, target) {
        return this.projectileManager.createProjectile(x, y, target);
    }
    
    // 創建死亡特效
    createDeathEffect(x, y, color) {
        this.particleManager.createExplosion(x, y, color);
    }
    
    // 更新 UI 顯示
    updateUI() {
        const elements = {
            lives: document.getElementById('lives'),
            gold: document.getElementById('gold'),
            wave: document.getElementById('wave'),
            score: document.getElementById('score'),
            kills: document.getElementById('kills'),
            streak: document.getElementById('streak'),
            level: document.getElementById('level')
        };
        
        if (elements.lives) {
            // 獲取升級後的最大血量
            const maxHealth = this.upgradeSystem ? this.upgradeSystem.getMaxHealth() : GameConfig.GAME.INITIAL_LIVES;
            elements.lives.textContent = `${this.gameState.lives}/${Math.floor(maxHealth)}`;
            
            // 根據血量百分比設置顏色
            const healthPercent = this.gameState.lives / maxHealth;
            if (healthPercent <= 0.2) {
                elements.lives.style.color = '#ff0000';
            } else if (healthPercent <= 0.5) {
                elements.lives.style.color = '#ffff00';
            } else {
                elements.lives.style.color = '#00ff00';
            }
        }
        
        if (elements.gold) elements.gold.textContent = this.gameState.gold;
        if (elements.wave) elements.wave.textContent = this.gameState.wave;
        if (elements.score) elements.score.textContent = this.gameState.score.toLocaleString();
        if (elements.kills) elements.kills.textContent = this.gameState.kills;
        
        // 更新等級顯示
        if (elements.level && this.upgradeSystem && this.upgradeSystem.experienceSystem) {
            const level = this.upgradeSystem.experienceSystem.level;
            const qualityColor = this.upgradeSystem.experienceSystem.getQualityColor();
            elements.level.textContent = level;
            elements.level.style.color = qualityColor;
        }
        
        // 顯示彈幕系統的連擊數
        if (elements.streak) {
            const combo = this.base && this.base.bulletSystem ? this.base.bulletSystem.combo : 0;
            elements.streak.textContent = combo;
            // 根據連擊數設置顏色
            if (combo >= 30) {
                elements.streak.style.color = '#ff00ff';
            } else if (combo >= 15) {
                elements.streak.style.color = '#00ffff';
            } else if (combo >= 5) {
                elements.streak.style.color = '#ffff00';
            } else {
                elements.streak.style.color = '#ffffff';
            }
        }
    }
    
    // 更新技能UI
    updateSkillsUI() {
        // 技能UI已簡化，攻擊系統依賴已移除
        
        // 技能系統已移至升級系統，暫時移除所有技能UI更新
    }
    
    // 更新特殊效果
    updateSpecialEffects(deltaTime) {
        if (!this.specialEffects) {
            this.specialEffects = [];
            return;
        }
        
        const currentTime = Date.now();
        
        // 更新所有特殊效果
        for (let i = this.specialEffects.length - 1; i >= 0; i--) {
            const effect = this.specialEffects[i];
            
            // 檢查效果是否過期
            if (effect.duration && currentTime - effect.createdTime >= effect.duration) {
                this.specialEffects.splice(i, 1);
                continue;
            }
            
            // 根據效果類型更新
            if (effect.radius && effect.pullForce !== undefined) {
                // 量子漩渦效果
                this.updateVortexEffect(effect, deltaTime);
            } else if (effect.slowEffect !== undefined) {
                // 時空裂隙效果
                this.updateRiftEffect(effect, deltaTime);
            } else if (effect.lightningBolts !== undefined) {
                // 離子風暴效果
                this.updateStormEffect(effect, deltaTime);
            }
        }
    }
    
    // 更新量子漩渦效果
    updateVortexEffect(vortex, deltaTime) {
        // 對範圍內的敵人施加吸引力
        for (const enemy of this.enemyManager.enemies) {
            if (!enemy.active) continue;
            
            const dx = vortex.x - enemy.x;
            const dy = vortex.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < vortex.radius && distance > 0) {
                // 計算吸引力（距離越近力量越強）
                const forceStrength = vortex.pullForce * (1 - distance / vortex.radius);
                const forceX = (dx / distance) * forceStrength * deltaTime;
                const forceY = (dy / distance) * forceStrength * deltaTime;
                
                // 應用吸引力到敵人位置
                enemy.x += forceX;
                enemy.y += forceY;
                
                // 持續傷害
                const currentTime = Date.now();
                if (currentTime - vortex.lastTick >= vortex.tickRate) {
                    enemy.takeDamage(vortex.damage);
                    vortex.lastTick = currentTime;
                }
            }
        }
    }
    
    // 更新時空裂隙效果
    updateRiftEffect(rift, deltaTime) {
        // 對範圍內的敵人施加減速效果
        for (const enemy of this.enemyManager.enemies) {
            if (!enemy.active) continue;
            
            const dx = rift.x - enemy.x;
            const dy = rift.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < rift.radius) {
                // 應用減速效果
                if (!enemy.slowedByRift) {
                    enemy.originalSpeed = enemy.speed;
                    enemy.slowedByRift = true;
                }
                enemy.speed = enemy.originalSpeed * rift.slowEffect;
            } else if (enemy.slowedByRift) {
                // 離開範圍，恢復原速
                enemy.speed = enemy.originalSpeed;
                enemy.slowedByRift = false;
            }
        }
    }
    
    // 更新離子風暴效果
    updateStormEffect(storm, deltaTime) {
        const currentTime = Date.now();
        const elapsedTime = currentTime - storm.createdTime;
        
        // 更新閃電持續時間
        for (let i = storm.lightningBolts.length - 1; i >= 0; i--) {
            const bolt = storm.lightningBolts[i];
            bolt.duration -= deltaTime * 1000;
            
            if (bolt.duration <= 0) {
                storm.lightningBolts.splice(i, 1);
            } else {
                // 閃電強度衰減
                bolt.intensity *= 0.95;
            }
        }
    }
    
    // 渲染特殊效果
    renderSpecialEffects(ctx) {
        if (!this.specialEffects) return;
        
        for (const effect of this.specialEffects) {
            ctx.save();
            
            if (effect.radius && effect.pullForce !== undefined) {
                // 渲染量子漩渦
                this.renderVortexEffect(ctx, effect);
            } else if (effect.slowEffect !== undefined) {
                // 渲染時空裂隙
                this.renderRiftEffect(ctx, effect);
            } else if (effect.lightningBolts !== undefined) {
                // 渲染離子風暴
                this.renderStormEffect(ctx, effect);
            } else if (effect.type === 'energy_ring') {
                // 渲染能量環
                this.renderEnergyRing(ctx, effect);
            } else if (effect.type === 'shockwave') {
                // 渲染衝擊波
                this.renderShockwave(ctx, effect);
            } else if (effect.type === 'lightning') {
                // 渲染閃電
                this.renderLightning(ctx, effect);
            } else if (effect.type === 'bullet_pulse') {
                // 渲染子彈脈衝波紋
                this.renderBulletPulse(ctx, effect);
            }
            
            ctx.restore();
        }
    }
    
    // 渲染量子漩渦效果
    renderVortexEffect(ctx, vortex) {
        const time = (Date.now() - vortex.createdTime) / 1000;
        const progress = time / vortex.duration;
        
        // 計算淡入淡出效果
        let fadeAlpha = 1;
        const fadeInDuration = 0.3;  // 0.3秒淡入
        const fadeOutDuration = 0.5; // 0.5秒淡出
        
        if (time < fadeInDuration) {
            // 淡入階段
            fadeAlpha = time / fadeInDuration;
        } else if (progress > 0.8) {
            // 淡出階段（最後20%時間）
            fadeAlpha = (1 - progress) / 0.2;
        }
        
        ctx.save();
        
        // 外圈範圍指示
        ctx.strokeStyle = vortex.color;
        ctx.globalAlpha = 0.3 * fadeAlpha;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(vortex.x, vortex.y, vortex.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 旋轉漩渦
        ctx.translate(vortex.x, vortex.y);
        ctx.rotate(time * 3);
        
        // 多層螺旋
        for (let layer = 0; layer < 4; layer++) {
            ctx.strokeStyle = vortex.color;
            ctx.globalAlpha = (0.8 - layer * 0.15) * fadeAlpha;
            ctx.lineWidth = 3 - layer * 0.5;
            
            ctx.beginPath();
            for (let angle = 0; angle < Math.PI * 6; angle += 0.1) {
                const radius = (angle / (Math.PI * 6)) * (vortex.radius * 0.8 - layer * 5);
                const x = Math.cos(angle + layer) * radius;
                const y = Math.sin(angle + layer) * radius;
                
                if (angle === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
        // 中心發光點
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 1 * fadeAlpha;
        ctx.shadowBlur = 20 * fadeAlpha;
        ctx.shadowColor = vortex.color;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    // 渲染時空裂隙效果
    renderRiftEffect(ctx, rift) {
        const time = (Date.now() - rift.createdTime) / 1000;
        
        // 外圈範圍指示
        ctx.strokeStyle = rift.color;
        ctx.globalAlpha = 0.2;
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(rift.x, rift.y, rift.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 時空扭曲線條
        ctx.strokeStyle = rift.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        
        for (let i = 0; i < 8; i++) {
            const offset = Math.sin(time * 2 + i) * 10;
            const startRadius = 20 + i * 8;
            const endRadius = startRadius + 15;
            
            if (startRadius < rift.radius) {
                ctx.beginPath();
                ctx.arc(rift.x + offset, rift.y + Math.cos(time + i) * 5, 
                       Math.min(startRadius, rift.radius), 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        // 中心扭曲點
        ctx.fillStyle = rift.color;
        ctx.globalAlpha = 0.8;
        ctx.shadowBlur = 15;
        ctx.shadowColor = rift.color;
        ctx.beginPath();
        ctx.arc(rift.x, rift.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 渲染離子風暴效果
    renderStormEffect(ctx, storm) {
        // 渲染所有閃電
        for (const bolt of storm.lightningBolts) {
            ctx.strokeStyle = storm.color;
            ctx.globalAlpha = bolt.intensity;
            ctx.lineWidth = 3 * bolt.intensity;
            ctx.shadowBlur = 20 * bolt.intensity;
            ctx.shadowColor = storm.color;
            
            // 繪製鋸齒狀閃電路徑
            ctx.beginPath();
            ctx.moveTo(bolt.startX, bolt.startY);
            
            const segments = 8;
            const deltaX = (bolt.endX - bolt.startX) / segments;
            const deltaY = (bolt.endY - bolt.startY) / segments;
            
            let currentX = bolt.startX;
            let currentY = bolt.startY;
            
            for (let i = 1; i <= segments; i++) {
                const targetX = bolt.startX + deltaX * i;
                const targetY = bolt.startY + deltaY * i;
                
                // 添加隨機偏移創造鋸齒效果
                const offsetX = (Math.random() - 0.5) * 30 * bolt.intensity;
                const offsetY = (Math.random() - 0.5) * 30 * bolt.intensity;
                
                if (i === segments) {
                    // 最後一段直接連到終點
                    ctx.lineTo(bolt.endX, bolt.endY);
                } else {
                    ctx.lineTo(targetX + offsetX, targetY + offsetY);
                }
            }
            
            ctx.stroke();
            
            // 添加閃電分支
            if (Math.random() < 0.3 * bolt.intensity) {
                const branchX = bolt.startX + deltaX * (2 + Math.random() * 4);
                const branchY = bolt.startY + deltaY * (2 + Math.random() * 4);
                const branchLength = 40 * bolt.intensity;
                const branchAngle = Math.random() * Math.PI * 2;
                
                ctx.globalAlpha = bolt.intensity * 0.6;
                ctx.lineWidth = 2 * bolt.intensity;
                ctx.beginPath();
                ctx.moveTo(branchX, branchY);
                ctx.lineTo(
                    branchX + Math.cos(branchAngle) * branchLength,
                    branchY + Math.sin(branchAngle) * branchLength
                );
                ctx.stroke();
            }
        }
        
        // 在風暴中心創建發光效果
        if (storm.lightningBolts.length > 0) {
            ctx.fillStyle = storm.color;
            ctx.globalAlpha = 0.8;
            ctx.shadowBlur = 30;
            ctx.shadowColor = storm.color;
            ctx.beginPath();
            ctx.arc(storm.x, storm.y, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 渲染能量環效果
    renderEnergyRing(ctx, ring) {
        const time = (Date.now() - ring.createdTime) / 1000;
        const progress = time / ring.duration;
        
        // 計算當前半徑
        ring.radius += ring.expandSpeed * (1/60);  // 假設60fps
        
        // 計算透明度（逐漸淡出）
        const alpha = ring.alpha * (1 - progress);
        
        if (ring.radius < ring.maxRadius && alpha > 0) {
            ctx.strokeStyle = ring.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = ring.color;
            
            // 繪製多層能量環
            for (let i = 0; i < 3; i++) {
                const layerAlpha = alpha * (1 - i * 0.3);
                ctx.globalAlpha = layerAlpha;
                ctx.lineWidth = 3 - i;
                
                ctx.beginPath();
                ctx.arc(ring.x, ring.y, ring.radius - i * 5, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // 添加能量粒子效果
            if (Math.random() < 0.3) {
                const angle = Math.random() * Math.PI * 2;
                const particleX = ring.x + Math.cos(angle) * ring.radius;
                const particleY = ring.y + Math.sin(angle) * ring.radius;
                
                this.particleManager.addParticle(particleX, particleY, {
                    vx: Math.cos(angle) * 50,
                    vy: Math.sin(angle) * 50,
                    life: 0.3,
                    color: ring.color,
                    size: 2,
                    type: 'spark',
                    glow: true,
                    fade: true
                });
            }
        }
    }
    
    // 渲染衝擊波效果
    renderShockwave(ctx, shockwave) {
        const time = (Date.now() - shockwave.createdTime) / 1000;
        const progress = time / shockwave.duration;
        
        // 更新半徑
        shockwave.radius += shockwave.expandSpeed * (1/60);
        
        if (shockwave.radius < shockwave.maxRadius && progress < 1) {
            const alpha = shockwave.alpha * (1 - progress);
            
            ctx.strokeStyle = shockwave.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = shockwave.lineWidth;
            ctx.shadowBlur = 20;
            ctx.shadowColor = shockwave.color;
            
            // 繪製衝擊波圓環
            ctx.beginPath();
            ctx.arc(shockwave.x, shockwave.y, shockwave.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // 內圈光暈
            ctx.globalAlpha = alpha * 0.5;
            ctx.lineWidth = shockwave.lineWidth * 2;
            ctx.beginPath();
            ctx.arc(shockwave.x, shockwave.y, shockwave.radius * 0.9, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // 渲染閃電效果
    renderLightning(ctx, lightning) {
        const time = (Date.now() - lightning.createdTime) / 1000;
        const progress = time / lightning.duration;
        
        if (progress < 1) {
            const alpha = lightning.alpha * (1 - progress);
            
            ctx.strokeStyle = lightning.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = lightning.lineWidth;
            ctx.shadowBlur = 15;
            ctx.shadowColor = lightning.color;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // 繪製主閃電
            ctx.beginPath();
            lightning.points.forEach((point, i) => {
                if (i === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
            
            // 繪製分支閃電
            if (Math.random() < 0.5) {
                const branchIndex = Math.floor(lightning.points.length / 2);
                const branchPoint = lightning.points[branchIndex];
                
                ctx.globalAlpha = alpha * 0.5;
                ctx.lineWidth = lightning.lineWidth * 0.5;
                ctx.beginPath();
                ctx.moveTo(branchPoint.x, branchPoint.y);
                ctx.lineTo(
                    branchPoint.x + (Math.random() - 0.5) * 50,
                    branchPoint.y + (Math.random() - 0.5) * 50
                );
                ctx.stroke();
            }
        }
    }
    
    // 渲染警告閃爍效果
    renderWarningFlash(ctx) {
        if (!this.warningFlash || !this.warningFlash.active) return;
        
        const progress = this.warningFlash.time / this.warningFlash.duration;
        
        // 脈衝閃爍效果
        const pulseSpeed = 10;  // 每秒閃爍10次
        const pulse = Math.sin(this.warningFlash.time * pulseSpeed * Math.PI) * 0.5 + 0.5;
        const alpha = this.warningFlash.alpha * pulse * (1 - progress);
        
        // 全螢幕紅色閃爍
        ctx.save();
        ctx.fillStyle = this.warningFlash.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(0, 0, GameConfig.CANVAS.WIDTH, GameConfig.CANVAS.HEIGHT);
        
        // 邊框強調效果
        ctx.strokeStyle = this.warningFlash.color;
        ctx.globalAlpha = alpha * 2;
        ctx.lineWidth = 5;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.warningFlash.color;
        ctx.strokeRect(5, 5, GameConfig.CANVAS.WIDTH - 10, GameConfig.CANVAS.HEIGHT - 10);
        
        // BOSS 警告文字
        if (pulse > 0.5) {
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = alpha * 3;
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff0066';
            ctx.fillText('⚠ BOSS 來襲 ⚠', GameConfig.CANVAS.WIDTH / 2, GameConfig.CANVAS.HEIGHT / 2);
        }
        
        ctx.restore();
    }
    
    // 渲染子彈脈衝波紋效果
    renderBulletPulse(ctx, pulse) {
        const time = (Date.now() - pulse.createdTime) / 1000;
        const progress = time / pulse.duration;
        
        if (progress >= 1) return;
        
        // 計算當前半徑
        pulse.radius += pulse.expandSpeed * (1/60);  // 假設60fps
        
        // 計算透明度（逐漸淡出）
        const alpha = pulse.alpha * (1 - progress);
        
        if (pulse.radius < pulse.maxRadius && alpha > 0) {
            ctx.strokeStyle = pulse.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = pulse.color;
            
            // 繪製脈衝環
            ctx.beginPath();
            ctx.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // 內層稍小的環
            ctx.globalAlpha = alpha * 0.5;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pulse.x, pulse.y, pulse.radius * 0.8, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // 檢查遊戲結束
    checkGameOver() {
        if (this.gameState.lives <= 0 && !this.gameState.isGameOver) {
            this.gameOver();
        }
    }
    
    // 遊戲結束
    gameOver() {
        this.gameState.isGameOver = true;
        
        // 發送遊戲結束事件
        if (window.gameEventBus) {
            window.gameEventBus.emit(GameEvents.GAME_OVER, {
                finalWave: this.gameState.wave - 1,
                finalScore: this.gameState.score,
                totalKills: this.stats.totalEnemiesKilled,
                totalGoldEarned: this.stats.totalGoldEarned,
                playTime: Math.floor((Date.now() - this.gameState.startTime) / 1000)
            });
        }
        
        // 顯示遊戲結束畫面
        const gameOverDiv = document.getElementById('gameOver');
        const finalWaveSpan = document.getElementById('finalWave');
        const finalScoreSpan = document.getElementById('finalScore');
        
        if (gameOverDiv) gameOverDiv.style.display = 'block';
        if (finalWaveSpan) finalWaveSpan.textContent = this.gameState.wave - 1;
        if (finalScoreSpan) finalScoreSpan.textContent = this.gameState.score.toLocaleString();
        
        // 綁定重新開始按鈕的點擊和觸控事件
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            // 移除舊的事件監聽器（如果有的話）
            restartButton.onclick = null;
            restartButton.ontouchstart = null;
            
            // 使用統一的處理函數，避免重複觸發
            const handleRestart = (e) => {
                e.preventDefault();
                location.reload();
            };
            
            // 同時支援點擊和觸控
            restartButton.addEventListener('click', handleRestart);
            restartButton.addEventListener('touchstart', handleRestart);
        }
        
        console.log(`🎯 遊戲結束！堅持了 ${this.gameState.wave - 1} 波，最終得分：${this.gameState.score}`);
    }
    
    // 暫停遊戲
    pauseGame() {
        if (!this.gameState.isGameOver) {
            this.gameState.isPaused = true;
            console.log('⏸️ 遊戲暫停');
        }
    }
    
    // 恢復遊戲
    resumeGame() {
        if (this.gameState.isPaused && !this.gameState.isGameOver) {
            this.gameState.isPaused = false;
            this.lastFrameTime = performance.now();
            console.log('▶️ 遊戲恢復');
        }
    }
    
    // 重新開始遊戲
    restartGame() {
        // 重置遊戲狀態
        this.gameState = {
            lives: GameConfig.GAME.INITIAL_LIVES,
            gold: GameConfig.GAME.INITIAL_GOLD,
            wave: 1,
            score: 0,
            kills: 0,
            streak: 0,
            isGameOver: false,
            isPaused: false,
            startTime: Date.now()
        };
        
        // 重置所有系統
        this.base = new CyberpunkCatBase(this);
        this.enemyManager = new EnemyManager(this);
        this.projectileManager = new ProjectileManager(this);
        this.particleManager = new ParticleManager();
        // 手機控制系統重置由 mobileControls 自動處理
        this.upgradeSystem.reset();
        
        // 重建空間網格
        this.spatialGrid = new SpatialGrid(GameConfig.CANVAS.WIDTH, GameConfig.CANVAS.HEIGHT, 80);
        
        // 更新引用
        this.enemies = this.enemyManager.enemies;
        this.particles = this.particleManager.particles;
        
        // 隱藏遊戲結束畫面
        const gameOverDiv = document.getElementById('gameOver');
        if (gameOverDiv) gameOverDiv.style.display = 'none';
        
        // 重新開始遊戲循環
        this.startGameLoop();
        
        console.log('🔄 遊戲重新開始');
    }
    
    // 獲取遊戲統計
    getGameStats() {
        return {
            gameState: { ...this.gameState },
            performance: {
                fps: this.performanceMonitor.getFPS(),
                frameTime: this.performanceMonitor.getFrameTime(),
                entities: this.enemies.length + this.projectileManager.projectiles.length + this.particles.length
            },
            systems: {
                enemies: this.enemies.length,
                projectiles: this.projectileManager.projectiles.length,
                particles: this.particles.length
            }
        };
    }
}

// 全域變數和啟動
let game;

// DOM 載入完成後啟動
const domContentLoadedHandler = () => {
    try {
        game = new CyberpunkCatDefense('gameCanvas');
        window.game = game; // 全域訪問
        console.log('🎮 賽博龐克貓咪塔防已準備就緒！');
    } catch (error) {
        console.error('❌ 遊戲初始化失敗:', error);
        
        // 顯示錯誤信息
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 30px;
            border-radius: 15px;
            z-index: 10000;
            text-align: center;
            max-width: 500px;
        `;
        errorDiv.innerHTML = `
            <h2>🚫 載入失敗</h2>
            <p>遊戲初始化時遇到問題：</p>
            <p style="color: #ffcccc; font-family: monospace; margin: 20px 0;">
                ${error.message}
            </p>
            <button onclick="location.reload()" 
                    style="padding: 10px 20px; margin: 10px; cursor: pointer; 
                           background: #ff6666; border: none; color: white; 
                           border-radius: 5px;">
                重新載入
            </button>
        `;
        document.body.appendChild(errorDiv);
    }
};

window.addEventListener('DOMContentLoaded', domContentLoadedHandler);

// 頁面卸載時清理
window.addEventListener('beforeunload', () => {
    if (game && game.cleanup) {
        game.cleanup();
    }
});

// 導出遊戲類
window.CyberpunkCatDefense = CyberpunkCatDefense;