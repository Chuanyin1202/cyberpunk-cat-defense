// 效能優化補丁 - 覆蓋原始設定
(function() {
    'use strict';
    
    // 等待遊戲初始化
    window.addEventListener('DOMContentLoaded', function() {
        console.log('[Performance] 應用移動設備效能優化...');
        
        // 覆蓋粒子系統設定
        if (window.ParticleSystem) {
            const originalCreate = window.ParticleSystem.prototype.createParticle;
            window.ParticleSystem.prototype.createParticle = function(...args) {
                // 限制粒子數量
                if (this.particles && this.particles.length > MobilePerformanceConfig.rendering.maxParticles) {
                    return;
                }
                return originalCreate.apply(this, args);
            };
        }
        
        // 優化子彈系統
        if (window.BulletSystem) {
            window.BulletSystem.MAX_TRAIL_LENGTH = MobilePerformanceConfig.rendering.bulletTrailLength;
        }
        
        // 優化渲染循環
        if (window.Game && window.Game.prototype.render) {
            const originalRender = window.Game.prototype.render;
            window.Game.prototype.render = function(ctx) {
                // 更新效能監控
                PerformanceMonitor.update();
                
                // 設定 Canvas 優化
                ctx.imageSmoothingEnabled = false;
                ctx.globalAlpha = 1;
                
                // 呼叫原始渲染
                originalRender.call(this, ctx);
            };
        }
        
        // 優化觸控事件
        const touchOptions = { passive: true };
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            if (type.startsWith('touch') && MobilePerformanceConfig.touch.usePassiveListeners) {
                options = options || {};
                if (typeof options === 'object') {
                    options.passive = true;
                } else {
                    options = touchOptions;
                }
            }
            return originalAddEventListener.call(this, type, listener, options);
        };
        
        // 節流函數
        function throttle(func, limit) {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
        
        // 優化遊戲更新頻率
        if (window.requestAnimationFrame) {
            let skipFrame = false;
            const originalRAF = window.requestAnimationFrame;
            
            // 如果 FPS 太低，可以跳過部分幀
            window.requestAnimationFrame = function(callback) {
                if (PerformanceMonitor.fps < 30 && skipFrame) {
                    skipFrame = false;
                    return originalRAF(callback);
                }
                skipFrame = !skipFrame;
                return originalRAF(callback);
            };
        }
        
        // 定期清理記憶體
        setInterval(() => {
            if (window.gc) {
                window.gc();
            }
            
            // 清理未使用的物件
            if (window.Game && window.Game.instance) {
                const game = window.Game.instance;
                
                // 清理離開螢幕的物件
                if (game.enemies) {
                    game.enemies = game.enemies.filter(enemy => {
                        const margin = 200;
                        return enemy.x > -margin && 
                               enemy.x < game.canvas.width + margin &&
                               enemy.y > -margin && 
                               enemy.y < game.canvas.height + margin;
                    });
                }
                
                if (game.particles) {
                    game.particles = game.particles.filter(p => p.life > 0);
                }
            }
        }, MobilePerformanceConfig.memory.garbageCollectionInterval);
        
        console.log('[Performance] 效能優化已應用');
        console.log('[Performance] 配置:', MobilePerformanceConfig);
    });
})();