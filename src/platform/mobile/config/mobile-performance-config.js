// 移動設備效能優化配置
const MobilePerformanceConfig = {
    // 渲染優化
    rendering: {
        targetFPS: 60,
        skipFrames: false,
        useRequestAnimationFrame: true,
        clearBeforeRender: true,
        
        // 降低特效品質以提升效能
        particleQuality: 'low',      // 'high', 'medium', 'low'
        maxParticles: 50,            // 減少粒子數量 (原本可能是 200+)
        bulletTrailLength: 3,        // 減少子彈軌跡長度 (原本是 10)
        glowEffects: false,          // 關閉發光特效
        shadowEffects: false,        // 關閉陰影
        
        // Canvas 優化
        canvasSettings: {
            alpha: false,            // 關閉透明度（如果背景是純色）
            desynchronized: true,    // 降低延遲
            willReadFrequently: false
        }
    },
    
    // 物件池優化
    objectPools: {
        bullets: 100,                // 子彈物件池大小
        particles: 50,               // 粒子物件池大小
        enemies: 30,                 // 敵人物件池大小
        preloadAll: true             // 預先載入所有物件
    },
    
    // 碰撞檢測優化
    collision: {
        useSpatialHash: true,        // 使用空間雜湊優化
        gridSize: 100,               // 網格大小
        skipInvisible: true,         // 跳過不可見物件
        simplifyHitboxes: true       // 簡化碰撞箱
    },
    
    // 音效優化
    audio: {
        enableSounds: true,
        maxSimultaneousSounds: 3,    // 最多同時播放的音效數
        useWebAudioAPI: true,
        preloadAll: true
    },
    
    // 記憶體管理
    memory: {
        garbageCollectionInterval: 5000,  // 5秒執行一次垃圾回收
        clearUnusedTextures: true,
        maxTextureSize: 1024,             // 最大紋理尺寸
        compressTextures: true
    },
    
    // 觸控優化
    touch: {
        throttleInterval: 16,        // 觸控事件節流 (約60fps)
        preventDefaultEvents: true,
        usePassiveListeners: true
    },
    
    // 自適應品質
    adaptiveQuality: {
        enabled: true,
        fpsThreshold: 45,            // FPS 低於此值時降低品質
        checkInterval: 2000,         // 每2秒檢查一次
        autoAdjust: {
            particles: true,
            bulletTrails: true,
            enemyDetails: true,
            backgroundAnimations: true
        }
    }
};

// 效能監控
const MobilePerformanceMonitor = {
    fps: 0,
    frameCount: 0,
    lastTime: performance.now(),
    
    update() {
        const now = performance.now();
        const delta = now - this.lastTime;
        this.frameCount++;
        
        if (delta >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / delta);
            this.frameCount = 0;
            this.lastTime = now;
            
            // 自動調整品質
            if (MobilePerformanceConfig.adaptiveQuality.enabled) {
                this.adjustQuality();
            }
        }
    },
    
    adjustQuality() {
        if (this.fps < MobilePerformanceConfig.adaptiveQuality.fpsThreshold) {
            // 降低品質
            if (MobilePerformanceConfig.rendering.maxParticles > 20) {
                MobilePerformanceConfig.rendering.maxParticles -= 10;
            }
            if (MobilePerformanceConfig.rendering.bulletTrailLength > 1) {
                MobilePerformanceConfig.rendering.bulletTrailLength--;
            }
        } else if (this.fps > 55) {
            // 提升品質
            if (MobilePerformanceConfig.rendering.maxParticles < 50) {
                MobilePerformanceConfig.rendering.maxParticles += 5;
            }
            if (MobilePerformanceConfig.rendering.bulletTrailLength < 3) {
                MobilePerformanceConfig.rendering.bulletTrailLength++;
            }
        }
    }
};

// 導出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MobilePerformanceConfig, MobilePerformanceMonitor };
}