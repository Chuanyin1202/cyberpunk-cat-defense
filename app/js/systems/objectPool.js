// 對象池系統 - 避免頻繁創建銷毀對象以優化性能
// 保持視覺效果不變，但大幅減少垃圾回收負擔

class ResourcePool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.inUse = new Set();
        
        // 預先創建對象
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }
    
    acquire() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        
        this.inUse.add(obj);
        return obj;
    }
    
    release(obj) {
        if (this.inUse.has(obj)) {
            this.inUse.delete(obj);
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }
    
    releaseAll() {
        for (const obj of this.inUse) {
            this.resetFn(obj);
            this.pool.push(obj);
        }
        this.inUse.clear();
    }
    
    getStats() {
        return {
            pooled: this.pool.length,
            inUse: this.inUse.size,
            total: this.pool.length + this.inUse.size
        };
    }
}

// 粒子對象池
class ParticlePool {
    constructor() {
        this.pool = new ResourcePool(
            () => new Particle(0, 0, {}), // 創建真正的 Particle 實例
            (particle) => {
                particle.active = false;
                // 移除不存在的 trail 屬性
                particle.x = particle.y = particle.vx = particle.vy = 0;
                particle.life = particle.maxLife = 0;
                particle.size = 0;
                particle.rotation = particle.rotationSpeed = 0;
                particle.gravity = 0;
                particle.friction = 1;
                particle.glow = particle.fade = false;
                particle.type = 'default';
                particle.color = '#ffffff';
            },
            50 // 初始池大小
        );
    }
    
    acquire() {
        return this.pool.acquire();
    }
    
    release(particle) {
        this.pool.release(particle);
    }
    
    getStats() {
        return this.pool.getStats();
    }
}

// 子彈對象池
class BulletPool {
    constructor() {
        this.pool = new ResourcePool(
            () => ({
                x: 0, y: 0, vx: 0, vy: 0,
                damage: 0, size: 0, color: '#ffffff',
                glow: false, active: false,
                trail: [], lifetime: 0,
                homing: false, target: null,
                piercing: false, spiral: false,
                wave: false, hitEnemies: new Set()
            }),
            (bullet) => {
                bullet.active = false;
                bullet.trail.length = 0;
                bullet.hitEnemies.clear();
                bullet.x = bullet.y = bullet.vx = bullet.vy = 0;
                bullet.damage = bullet.size = bullet.lifetime = 0;
                bullet.homing = bullet.piercing = bullet.spiral = bullet.wave = bullet.glow = false;
                bullet.target = null;
                bullet.color = '#ffffff';
            },
            30 // 初始池大小
        );
    }
    
    acquire() {
        return this.pool.acquire();
    }
    
    release(bullet) {
        this.pool.release(bullet);
    }
    
    getStats() {
        return this.pool.getStats();
    }
}

// 渲染緩存系統 - 緩存頻繁使用的Canvas對象
class RenderCache {
    constructor() {
        this.gradients = new Map();
        this.patterns = new Map();
        this.cachedCanvas = new Map();
        this.lastCleanup = Date.now();
        this.cleanupInterval = 30000; // 30秒清理一次
    }
    
    // 獲取或創建漸變
    getGradient(ctx, key, createFn) {
        if (!this.gradients.has(key)) {
            this.gradients.set(key, createFn(ctx));
        }
        return this.gradients.get(key);
    }
    
    // 獲取或創建離屏canvas
    getCanvas(key, width, height, drawFn) {
        const cacheKey = `${key}_${width}_${height}`;
        
        if (!this.cachedCanvas.has(cacheKey)) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            drawFn(ctx);
            this.cachedCanvas.set(cacheKey, canvas);
        }
        
        return this.cachedCanvas.get(cacheKey);
    }
    
    // 清理過期緩存
    cleanup() {
        const now = Date.now();
        if (now - this.lastCleanup > this.cleanupInterval) {
            // 只清理Pattern緩存，漸變和Canvas可能會重複使用
            this.patterns.clear();
            this.lastCleanup = now;
        }
    }
    
    // 強制清理所有緩存
    clear() {
        this.gradients.clear();
        this.patterns.clear();
        this.cachedCanvas.clear();
    }
    
    getStats() {
        return {
            gradients: this.gradients.size,
            patterns: this.patterns.size,
            cachedCanvas: this.cachedCanvas.size
        };
    }
}

// 批量渲染器 - 將相似的渲染操作批量處理
class BatchRenderer {
    constructor() {
        this.batches = new Map();
        this.currentBatch = null;
    }
    
    startBatch(type, setupFn) {
        this.currentBatch = {
            type,
            setup: setupFn,
            items: []
        };
    }
    
    addToBatch(item) {
        if (this.currentBatch) {
            this.currentBatch.items.push(item);
        }
    }
    
    finishBatch(ctx) {
        if (this.currentBatch && this.currentBatch.items.length > 0) {
            ctx.save();
            this.currentBatch.setup(ctx);
            
            // 批量渲染所有項目
            for (const item of this.currentBatch.items) {
                item.render(ctx);
            }
            
            ctx.restore();
            this.currentBatch = null;
        }
    }
    
    clear() {
        this.batches.clear();
        this.currentBatch = null;
    }
}

// 全局對象池管理器
class ObjectPoolManager {
    constructor() {
        this.particlePool = new ParticlePool();
        this.bulletPool = new BulletPool();
        this.renderCache = new RenderCache();
        this.batchRenderer = new BatchRenderer();
        
        // 性能統計
        this.stats = {
            particlesCreated: 0,
            particlesReused: 0,
            bulletsCreated: 0,
            bulletsReused: 0
        };
    }
    
    update() {
        this.renderCache.cleanup();
    }
    
    getParticle() {
        const particle = this.particlePool.acquire();
        if (particle.active === false) {
            this.stats.particlesReused++;
        } else {
            this.stats.particlesCreated++;
        }
        return particle;
    }
    
    releaseParticle(particle) {
        this.particlePool.release(particle);
    }
    
    getBullet() {
        const bullet = this.bulletPool.acquire();
        if (bullet.active === false) {
            this.stats.bulletsReused++;
        } else {
            this.stats.bulletsCreated++;
        }
        return bullet;
    }
    
    releaseBullet(bullet) {
        this.bulletPool.release(bullet);
    }
    
    getAllStats() {
        return {
            performance: this.stats,
            particles: this.particlePool.getStats(),
            bullets: this.bulletPool.getStats(),
            renderCache: this.renderCache.getStats()
        };
    }
    
    clear() {
        this.renderCache.clear();
        this.batchRenderer.clear();
    }
}

// 導出全局實例
window.ObjectPoolManager = ObjectPoolManager;
window.RenderCache = RenderCache;
window.BatchRenderer = BatchRenderer;

// 創建全局對象池管理器
window.objectPoolManager = new ObjectPoolManager();