// 投射物系統
// 基地自動攻擊的彈藥系統

class Projectile {
    constructor(x, y, target, game = null, isScatter = false, angle = null, range = null, enemies = null) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.game = game;
        
        // 散射模式參數
        this.isScatter = isScatter;
        this.angle = angle;
        this.range = range;
        this.enemies = enemies;
        this.travelDistance = 0;
        
        const config = GameConfig.PROJECTILES.base_attack;
        this.baseSpeed = config.speed;
        this.baseDamage = config.damage;
        this.color = config.color;
        this.size = config.size;
        this.type = config.type;
        
        // 應用升級效果
        this.applyUpgradeEffects();
        
        this.active = true;
        this.trail = []; // 尾跡效果
        this.maxTrailLength = 8;
        
        // 視覺效果
        this.glowIntensity = 1.0;
        this.rotationAngle = 0;
    }
    
    // 應用升級效果到投射物
    applyUpgradeEffects() {
        if (!this.game || !this.game.upgradeSystem) {
            // 沒有升級系統時使用基礎值
            this.speed = this.baseSpeed;
            this.damage = this.baseDamage;
            return;
        }
        
        const effects = this.game.upgradeSystem.getCachedEffects();
        
        // 應用傷害倍數
        this.damage = this.baseDamage * (effects.damageMultiplier || 1);
        
        // 投射物速度不受射速影響，保持基礎速度
        this.speed = this.baseSpeed;
        
        // 可以在這裡添加其他效果，如暴擊等
        this.criticalChance = effects.criticalChance || 0;
        this.criticalMultiplier = effects.criticalMultiplier || 2.0;
    }

    update(deltaTime) {
        if (!this.active) {
            return false;
        }

        // 記錄尾跡
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        const moveSpeed = this.speed * deltaTime;

        if (this.isScatter) {
            // 散射模式：直線飛行
            this.x += Math.cos(this.angle) * moveSpeed;
            this.y += Math.sin(this.angle) * moveSpeed;
            this.travelDistance += moveSpeed;
            
            // 檢查是否超出範圍
            if (this.travelDistance >= this.range) {
                this.active = false;
                return false;
            }
            
            // 檢查是否命中任何敵人
            if (this.enemies) {
                for (const enemy of this.enemies) {
                    if (!enemy.active) continue;
                    
                    const dx = enemy.x - this.x;
                    const dy = enemy.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 15) { // 命中半徑
                        this.hitScatterTarget(enemy);
                        return true;
                    }
                }
            }
        } else {
            // 追蹤模式：原有邏輯
            if (!this.target || !this.target.active) {
                this.active = false;
                return false;
            }

            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 10) {
                this.hitTarget();
                return true;
            }

            this.x += (dx / distance) * moveSpeed;
            this.y += (dy / distance) * moveSpeed;
        }

        // 旋轉動畫
        this.rotationAngle += deltaTime * 10;

        // 發光衰減
        this.glowIntensity *= 0.98;

        return false;
    }

    hitTarget() {
        let finalDamage = this.damage;
        
        // 檢查暴擊
        if (this.criticalChance > 0 && Math.random() < this.criticalChance) {
            finalDamage *= this.criticalMultiplier;
            
            // 暴擊視覺效果
            this.createCriticalHitEffect();
        }
        
        const killed = this.target.takeDamage(finalDamage);
        
        // 創建命中特效
        this.createHitEffect();
        
        this.active = false;
        return killed;
    }
    
    hitScatterTarget(target) {
        let finalDamage = this.damage;
        
        // 檢查暴擊
        if (this.criticalChance > 0 && Math.random() < this.criticalChance) {
            finalDamage *= this.criticalMultiplier;
            this.createCriticalHitEffect(target);
        }
        
        const killed = target.takeDamage(finalDamage);
        
        // 創建命中特效
        this.createHitEffect(target);
        
        this.active = false;
        return killed;
    }

    createHitEffect(hitTarget = null) {
        // 命中粒子特效
        if (window.game && window.game.particleManager) {
            // 使用傳入的目標或默認目標，如果都沒有則使用投射物當前位置
            const target = hitTarget || this.target || { x: this.x, y: this.y };
            
            for (let i = 0; i < 6; i++) {
                window.game.particleManager.addParticle(
                    target.x + (Math.random() - 0.5) * 20,
                    target.y + (Math.random() - 0.5) * 20,
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
    
    createCriticalHitEffect(hitTarget = null) {
        // 暴擊特效 - 更多粒子和不同顏色
        if (window.game && window.game.particleManager) {
            // 使用傳入的目標或默認目標，如果都沒有則使用投射物當前位置
            const target = hitTarget || this.target || { x: this.x, y: this.y };
            
            for (let i = 0; i < 12; i++) {
                window.game.particleManager.addParticle(
                    target.x + (Math.random() - 0.5) * 30,
                    target.y + (Math.random() - 0.5) * 30,
                    {
                        vx: (Math.random() - 0.5) * 150,
                        vy: (Math.random() - 0.5) * 150,
                        life: 0.5,
                        color: '#ffff00', // 黃色暴擊效果
                        size: Math.random() * 5 + 2,
                        type: 'critical'
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

        const projectile = new Projectile(x, y, target, this.game);
        projectile.manager = this; // 為 LOD 設定參考
        this.projectiles.push(projectile);
        return projectile;
    }
    
    // 創建散射投射物
    createScatterProjectile(x, y, angle, range, enemies, game) {
        if (this.projectiles.length >= GameConfig.PERFORMANCE.MAX_PROJECTILES) return;

        const projectile = new Projectile(x, y, null, game, true, angle, range, enemies);
        projectile.manager = this;
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