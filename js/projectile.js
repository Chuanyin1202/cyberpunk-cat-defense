// 投射物系統
// 基地自動攻擊的彈藥系統

class Projectile {
    constructor(x, y, target) {
        this.x = x;
        this.y = y;
        this.target = target;
        
        const config = GameConfig.PROJECTILES.base_attack;
        this.speed = config.speed;
        this.damage = config.damage;
        this.color = config.color;
        this.size = config.size;
        this.type = config.type;
        
        this.active = true;
        this.trail = []; // 尾跡效果
        this.maxTrailLength = 8;
        
        // 視覺效果
        this.glowIntensity = 1.0;
        this.rotationAngle = 0;
    }

    update(deltaTime) {
        if (!this.active || !this.target || !this.target.active) {
            this.active = false;
            return false;
        }

        // 記錄尾跡
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // 追蹤目標
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) {
            // 命中目標
            this.hitTarget();
            return true;
        }

        // 移動向目標
        const moveSpeed = this.speed * deltaTime;
        this.x += (dx / distance) * moveSpeed;
        this.y += (dy / distance) * moveSpeed;

        // 旋轉動畫
        this.rotationAngle += deltaTime * 10;

        // 發光衰減
        this.glowIntensity *= 0.98;

        return false;
    }

    hitTarget() {
        const killed = this.target.takeDamage(this.damage);
        
        // 創建命中特效
        this.createHitEffect();
        
        this.active = false;
        return killed;
    }

    createHitEffect() {
        // 命中粒子特效
        if (window.game && window.game.particleManager) {
            for (let i = 0; i < 6; i++) {
                window.game.particleManager.addParticle(
                    this.target.x + (Math.random() - 0.5) * 20,
                    this.target.y + (Math.random() - 0.5) * 20,
                    {
                        vx: (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        life: 0.3,
                        color: this.color,
                        size: Math.random() * 3 + 1,
                        type: 'hit'
                    }
                );
            }
        }
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();
        
        // LOD: 根據投射物數量決定渲染品質
        const shouldUseLOD = this.manager && this.manager.projectiles.length > 15;
        
        if (shouldUseLOD) {
            // 簡化渲染
            this.drawSimplified(ctx);
        } else {
            // 完整渲染
            this.drawTrail(ctx);
            this.drawProjectile(ctx);
        }

        ctx.restore();
    }

    drawTrail(ctx) {
        if (this.trail.length < 2) return;

        // 簡化的尾跡渲染
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 5; // 減少發光效果
        ctx.shadowColor = this.color;
        ctx.globalAlpha = 0.6;

        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
    }

    drawProjectile(ctx) {
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotationAngle);

        // 簡化的發光效果
        if (this.glowIntensity > 0.3) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8 * this.glowIntensity; // 減少發光強度
        }

        switch (this.type) {
            case 'laser':
                this.drawLaser(ctx);
                break;
            default:
                this.drawDefault(ctx);
        }
    }
    
    // 簡化渲染模式（LOD）
    drawSimplified(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 簡單白色核心
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    drawLaser(ctx) {
        // 簡化的雷射風格
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        // 簡化的十字光（只在非-LOD模式下）
        if (this.glowIntensity > 0.5) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-this.size, 0);
            ctx.lineTo(this.size, 0);
            ctx.moveTo(0, -this.size);
            ctx.lineTo(0, this.size);
            ctx.stroke();
        }
    }

    drawDefault(ctx) {
        // 基本圓形投射物
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 投射物管理系統
class ProjectileManager {
    constructor(game) {
        this.game = game;
        this.projectiles = [];
        this.updateCounter = 0;
    }

    update(deltaTime) {
        this.updateCounter++;
        
        // 批次處理：每幀只處理部分投射物
        const maxUpdatesPerFrame = GameConfig.PERFORMANCE.PARTICLE_BATCH_SIZE || 20;
        let updatesThisFrame = 0;
        
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            if (updatesThisFrame < maxUpdatesPerFrame) {
                const hit = projectile.update(deltaTime);
                updatesThisFrame++;
            } else {
                // 簡單位置更新
                if (projectile.target && projectile.target.active) {
                    const dx = projectile.target.x - projectile.x;
                    const dy = projectile.target.y - projectile.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 10) {
                        const moveSpeed = projectile.speed * deltaTime;
                        projectile.x += (dx / distance) * moveSpeed;
                        projectile.y += (dy / distance) * moveSpeed;
                    }
                }
            }

            if (!projectile.active) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // 定期清理
        if (this.updateCounter % 120 === 0) {
            this.projectiles = this.projectiles.filter(p => p.active);
        }
    }

    createProjectile(x, y, target) {
        if (this.projectiles.length >= GameConfig.PERFORMANCE.MAX_PROJECTILES) return;

        const projectile = new Projectile(x, y, target);
        projectile.manager = this; // 為 LOD 設定參考
        this.projectiles.push(projectile);
        return projectile;
    }

    render(ctx) {
        // 批次渲染：每幀只渲染部分投射物
        const maxRenderPerFrame = GameConfig.PERFORMANCE.MAX_PROJECTILES || 40;
        const renderCount = Math.min(this.projectiles.length, maxRenderPerFrame);
        
        for (let i = 0; i < renderCount; i++) {
            this.projectiles[i].render(ctx);
        }
    }

    clear() {
        this.projectiles = [];
    }
}

// 導出類
window.Projectile = Projectile;
window.ProjectileManager = ProjectileManager;