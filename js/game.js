// 賽博龐克貓咪塔防 - 主遊戲類
// 簡化版本，專注於基地防禦和手機觸控

class CyberpunkCatDefense {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
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
        // 移除未使用的環形技能選單
        // this.radialSkillMenu = new RadialSkillMenu(this);
        this.upgradeSystem = new UpgradeSystem(this);
        
        // 快捷引用
        this.enemies = this.enemyManager.enemies;
        this.particles = this.particleManager.particles;
        
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
        const resize = () => {
            const maxWidth = window.innerWidth - 20;
            const maxHeight = window.innerHeight - 20;
            
            let scale = Math.min(maxWidth / GameConfig.CANVAS.WIDTH, maxHeight / GameConfig.CANVAS.HEIGHT);
            
            if (window.innerWidth <= 768) {
                // 手機模式：優化比例
                this.canvas.style.width = maxWidth + 'px';
                this.canvas.style.height = (maxWidth * 0.75) + 'px';
            } else {
                // 桌面模式：保持原比例
                this.canvas.style.width = (GameConfig.CANVAS.WIDTH * scale) + 'px';
                this.canvas.style.height = (GameConfig.CANVAS.HEIGHT * scale) + 'px';
            }
        };
        
        window.addEventListener('resize', resize);
        resize();
    }
    
    // 初始化遊戲
    init() {
        this.bindEvents();
        this.startGameLoop();
        console.log('🐱 賽博龐克貓咪塔防啟動！');
    }
    
    // 綁定事件 - 只支援觸控
    bindEvents() {
        // 防止頁面滾動和縮放
        document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        document.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        
        // 觸控事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleTouch({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }, { passive: false });
        
        // 桌面點擊支援
        this.canvas.addEventListener('click', (e) => {
            this.handleTouch(e);
        });
        
        // 綁定技能按鈕
        this.bindSkillButtons();
        
        // 滑鼠移動追蹤
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        // 觸控移動追蹤
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.handleMouseMove({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            }
        }, { passive: false });
        
        // 滑鼠離開畫布
        this.canvas.addEventListener('mouseleave', () => {
            this.gameState.mouseX = null;
            this.gameState.mouseY = null;
        });
        
        // 窗口焦點管理
        window.addEventListener('blur', () => this.pauseGame());
        window.addEventListener('focus', () => this.resumeGame());
        
        // 視窗可見性變化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseGame();
            } else {
                this.resumeGame();
            }
        });
    }
    
    // 初始化背景數據流粒子
    initBackgroundParticles() {
        const particleCount = 25;
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
        
        // 創建觸控特效
        this.particleManager.createTouchEffect(x, y);
        
        // 觸發彈幕系統的特殊攻擊
        if (this.base && this.base.bulletSystem) {
            this.base.bulletSystem.fireSpecialAttack(x, y);
        }
        
        // 可以在這裡添加其他觸控互動
        // console.log(`觸控位置: ${Math.round(x)}, ${Math.round(y)}`); // 移除頻繁日誌
    }
    
    // 處理滑鼠移動
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = GameConfig.CANVAS.WIDTH / rect.width;
        const scaleY = GameConfig.CANVAS.HEIGHT / rect.height;
        
        this.gameState.mouseX = (event.clientX - rect.left) * scaleX;
        this.gameState.mouseY = (event.clientY - rect.top) * scaleY;
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
                
                requestAnimationFrame(gameLoop);
            }
        };
        
        this.lastFrameTime = performance.now();
        requestAnimationFrame(gameLoop);
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
        
        // 更新投射物
        this.projectileManager.update(deltaTime);
        
        // 更新粒子
        this.particleManager.update(deltaTime);
        
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
        
        // 清空畫布
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(-50, -50, GameConfig.CANVAS.WIDTH + 100, GameConfig.CANVAS.HEIGHT + 100);
        
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
            streak: document.getElementById('streak')
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
        
        // 顯示遊戲結束畫面
        const gameOverDiv = document.getElementById('gameOver');
        const finalWaveSpan = document.getElementById('finalWave');
        const finalScoreSpan = document.getElementById('finalScore');
        
        if (gameOverDiv) gameOverDiv.style.display = 'block';
        if (finalWaveSpan) finalWaveSpan.textContent = this.gameState.wave - 1;
        if (finalScoreSpan) finalScoreSpan.textContent = this.gameState.score.toLocaleString();
        
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
        this.upgradeSystem.reset();
        
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
window.addEventListener('DOMContentLoaded', () => {
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
});

// 導出遊戲類
window.CyberpunkCatDefense = CyberpunkCatDefense;