// 渲染管理器
// 統一管理所有渲染相關的邏輯和優化

class RenderManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // 渲染狀態
        this.showSpatialGrid = false;
        this.showPerformanceStats = false;
        this.renderQuality = 'high'; // 'low', 'medium', 'high'
        
        // 渲染優化
        this.frameSkip = 0;
        this.currentFrame = 0;
        
        // 圖層系統
        this.layers = {
            background: 0,
            gameObjects: 1,
            effects: 2,
            ui: 3,
            debug: 4
        };
        
        // 相機系統（未來擴展用）
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1
        };
    }
    
    // 開始渲染幀
    beginFrame() {
        // 清空畫布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 保存初始狀態
        this.ctx.save();
        
        // 應用相機變換（如果需要）
        if (this.camera.zoom !== 1 || this.camera.x !== 0 || this.camera.y !== 0) {
            this.ctx.translate(-this.camera.x, -this.camera.y);
            this.ctx.scale(this.camera.zoom, this.camera.zoom);
        }
        
        // 記錄渲染統計
        if (window.performanceStats) {
            window.performanceStats.recordDrawCall();
        }
    }
    
    // 結束渲染幀
    endFrame() {
        // 恢復初始狀態
        this.ctx.restore();
        
        // 渲染調試資訊
        if (this.showPerformanceStats) {
            this.renderDebugInfo();
        }
        
        this.currentFrame++;
    }
    
    // 渲染背景
    renderBackground(backgroundParticles) {
        // 網格背景
        this.drawGrid();
        
        // 背景粒子
        if (backgroundParticles && backgroundParticles.length > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.5;
            
            backgroundParticles.forEach(particle => {
                this.ctx.fillStyle = '#00ffff';
                this.ctx.fillRect(particle.x, particle.y, 2, particle.size);
            });
            
            this.ctx.restore();
        }
    }
    
    // 繪製網格背景
    drawGrid() {
        const gridSize = 50;
        const gridColor = 'rgba(0, 255, 255, 0.03)';
        
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 0.5;
        
        // 根據渲染質量決定網格密度
        const step = this.renderQuality === 'low' ? gridSize * 2 : gridSize;
        
        // 垂直線
        for (let x = 0; x <= this.canvas.width; x += step) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // 水平線
        for (let y = 0; y <= this.canvas.height; y += step) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    // 渲染遊戲物件
    renderGameObjects(game) {
        // 基地
        if (game.base) {
            game.base.render(this.ctx);
        }
        
        // 敵人
        if (game.enemyManager) {
            this.renderEnemies(game.enemyManager);
        }
        
        // 投射物
        if (game.projectileManager) {
            game.projectileManager.render(this.ctx);
        }
        
        // 子彈系統
        if (game.base && game.base.bulletSystem) {
            game.base.bulletSystem.render(this.ctx);
        }
    }
    
    // 渲染敵人（批次優化）
    renderEnemies(enemyManager) {
        const enemies = enemyManager.enemies;
        const shouldBatch = enemies.length > 20 && this.renderQuality !== 'high';
        
        if (shouldBatch) {
            // 批次渲染模式
            this.ctx.save();
            
            // 按類型分組
            const enemyGroups = new Map();
            enemies.forEach(enemy => {
                if (!enemy.active) return;
                
                if (!enemyGroups.has(enemy.type)) {
                    enemyGroups.set(enemy.type, []);
                }
                enemyGroups.get(enemy.type).push(enemy);
            });
            
            // 批次渲染每種類型
            enemyGroups.forEach((group, type) => {
                this.batchRenderEnemies(group, type);
            });
            
            this.ctx.restore();
        } else {
            // 常規渲染
            enemies.forEach(enemy => {
                if (enemy.active) {
                    enemy.render(this.ctx);
                }
            });
        }
    }
    
    // 批次渲染相同類型的敵人
    batchRenderEnemies(enemies, type) {
        // 這裡可以實現更高效的批次渲染
        // 目前使用簡化版本
        enemies.forEach(enemy => {
            enemy.render(this.ctx);
        });
        
        if (window.performanceStats) {
            window.performanceStats.recordBatchRender(enemies.length);
        }
    }
    
    // 渲染特效
    renderEffects(game) {
        // 粒子效果
        if (game.particleManager) {
            game.particleManager.render(this.ctx);
        }
        
        // 特殊效果
        if (game.specialEffects) {
            this.renderSpecialEffects(game.specialEffects);
        }
    }
    
    // 渲染特殊效果
    renderSpecialEffects(effects) {
        const now = Date.now();
        
        for (let i = effects.length - 1; i >= 0; i--) {
            const effect = effects[i];
            const elapsed = (now - effect.createdTime) / 1000;
            
            if (elapsed >= effect.duration) {
                effects.splice(i, 1);
                continue;
            }
            
            const progress = elapsed / effect.duration;
            
            switch (effect.type) {
                case 'energy_ring':
                    this.renderEnergyRing(effect, progress);
                    break;
            }
        }
    }
    
    // 渲染能量環效果
    renderEnergyRing(effect, progress) {
        const currentRadius = effect.radius + (effect.maxRadius - effect.radius) * progress;
        const alpha = effect.alpha * (1 - progress);
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.strokeStyle = effect.color;
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = effect.color;
        
        this.ctx.beginPath();
        this.ctx.arc(effect.x, effect.y, currentRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    // 渲染 UI
    renderUI(game) {
        // UI 元素通常由 HTML 處理，這裡可以渲染遊戲內 UI
        
        // 渲染虛擬搖桿
        if (game.virtualJoystick && game.virtualJoystick.isActive) {
            game.virtualJoystick.render(this.ctx);
        }
    }
    
    // 渲染調試信息
    renderDebugInfo() {
        // 空間網格
        if (this.showSpatialGrid && window.game && window.game.spatialGrid) {
            window.game.spatialGrid.debugRender(this.ctx);
        }
        
        // 其他調試信息
        if (this.showPerformanceStats) {
            this.renderPerformanceOverlay();
        }
    }
    
    // 渲染性能覆蓋層
    renderPerformanceOverlay() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 80);
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px monospace';
        
        const stats = window.performanceStats ? window.performanceStats.getPerformanceReport() : null;
        if (stats) {
            this.ctx.fillText(`FPS: ${Math.round(stats.fps.current)}`, 20, 30);
            this.ctx.fillText(`Objects: ${stats.objects.enemies + stats.objects.projectiles}`, 20, 50);
            this.ctx.fillText(`Particles: ${stats.objects.particles}`, 20, 70);
        }
        
        this.ctx.restore();
    }
    
    // 設置渲染質量
    setRenderQuality(quality) {
        this.renderQuality = quality;
        
        // 根據質量調整渲染設置
        switch (quality) {
            case 'low':
                this.frameSkip = 2;
                break;
            case 'medium':
                this.frameSkip = 1;
                break;
            case 'high':
                this.frameSkip = 0;
                break;
        }
    }
    
    // 切換空間網格顯示
    toggleSpatialGrid() {
        this.showSpatialGrid = !this.showSpatialGrid;
    }
    
    // 切換性能統計顯示
    togglePerformanceStats() {
        this.showPerformanceStats = !this.showPerformanceStats;
    }
    
    // 檢查是否應該跳過這一幀
    shouldSkipFrame() {
        if (this.frameSkip === 0) return false;
        return this.currentFrame % (this.frameSkip + 1) !== 0;
    }
}

// 導出類
window.RenderManager = RenderManager;