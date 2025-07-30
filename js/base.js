// 賽博龐克貓咪基地系統 - 核心邏輯
// 負責基地的狀態管理、更新和遊戲邏輯

class CyberpunkCatBase {
    constructor(game) {
        this.game = game;
        this.x = GameConfig.GAME.BASE_X;
        this.y = GameConfig.GAME.BASE_Y;
        this.radius = GameConfig.GAME.BASE_RADIUS;
        
        // 貓咪狀態
        this.emotion = 'happy';
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        
        // 貓咪動態系統
        this.catLookX = 0;
        this.catLookY = 0;
        this.catLookSmoothX = 0;
        this.catLookSmoothY = 0;
        this.catEarAngleLeft = 0;
        this.catEarAngleRight = 0;
        this.catWhiskerWave = 0;
        this.catTailSwing = 0;
        
        // 表情系統
        this.blinkTimer = 0;
        this.isBlinking = false;
        this.meowTimer = 0;
        
        // 攻擊系統
        this.lastAttackTime = 0;
        this.baseAttackCooldown = 780; // 0.78秒 (再降低20%攻擊速度，總計降低44%)
        this.attackCooldown = this.baseAttackCooldown; // 實際攻擊間隔（會被升級影響）
        this.baseAttackRange = this.radius * 3; // 基礎攻擊範圍
        this.attackRange = this.baseAttackRange; // 實際攻擊範圍（會被升級影響）
        
        // 創建渲染器
        this.renderer = new CyberpunkCatBaseRenderer(this);
        
        // 創建彈幕系統
        this.bulletSystem = new BulletSystem(this);
    }

    // 更新基地狀態
    update(deltaTime) {
        // 更新表情基於血量
        this.updateEmotion();
        
        // 更新震動效果
        if (this.shakeTimer > 0) {
            this.shakeTimer -= deltaTime;
            this.shakeIntensity *= 0.95;
        }
        
        // 更新貓咪動態
        this.updateCatDynamics(deltaTime);
        
        // 更新彈幕系統
        this.bulletSystem.update(deltaTime);
        
        // 自動攻擊
        this.autoAttack();
    }

    // 更新表情基於血量和遊戲狀態
    updateEmotion() {
        const healthPercent = this.game.gameState.lives / GameConfig.GAME.INITIAL_LIVES * 100;
        const enemyCount = this.game.enemies.length;
        const streak = this.game.gameState.streak;
        
        // 特殊狀態優先
        if (healthPercent <= 0) {
            this.emotion = 'dead';
            return;
        }
        
        // 連殺時很酷
        if (streak > 10) {
            this.emotion = 'cool';
            return;
        } else if (streak > 5) {
            this.emotion = 'celebrating';
            return;
        }
        
        // 敵人太多時的反應
        if (enemyCount > 15) {
            this.emotion = 'surprised';
            return;
        } else if (enemyCount > 10) {
            this.emotion = 'worried';
            return;
        }
        
        // 沒有敵人時可能會睡覺
        if (enemyCount === 0 && Math.random() < 0.3) {
            this.emotion = 'sleepy';
            return;
        }
        
        // 基於血量的基本表情
        if (healthPercent >= 90) {
            this.emotion = 'happy';
        } else if (healthPercent >= 70) {
            this.emotion = 'normal';
        } else if (healthPercent >= 50) {
            this.emotion = 'worried';
        } else if (healthPercent >= 30) {
            this.emotion = 'hurt';
        } else if (healthPercent >= 10) {
            this.emotion = 'angry';
        } else {
            this.emotion = 'scared';
        }
    }

    // 更新貓咪動態
    updateCatDynamics(deltaTime) {
        const time = Date.now() / 1000;
        const healthPercent = this.game.gameState.lives / GameConfig.GAME.INITIAL_LIVES;
        
        let targetLookX = 0;
        let targetLookY = 0;
        let hasTarget = false;
        
        // 優先追蹤滑鼠
        if (this.game.gameState.mouseX !== null && this.game.gameState.mouseY !== null) {
            const dx = this.game.gameState.mouseX - this.x;
            const dy = this.game.gameState.mouseY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 限制視線範圍
            const maxLookDistance = 20;
            targetLookX = (dx / Math.max(distance, 50)) * maxLookDistance;
            targetLookY = (dy / Math.max(distance, 50)) * maxLookDistance;
            hasTarget = true;
            
            // 當滑鼠靠近時改變表情
            if (distance < 100) {
                this.emotion = 'happy';
            }
        } else {
            // 其次追蹤最近的敵人
            const nearbyEnemies = this.game.enemies.filter(enemy => enemy.active);
            if (nearbyEnemies.length > 0) {
                let nearestEnemy = null;
                let minDistance = Infinity;
                
                for (const enemy of nearbyEnemies) {
                    const distance = Math.sqrt(
                        Math.pow(enemy.x - this.x, 2) + 
                        Math.pow(enemy.y - this.y, 2)
                    );
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestEnemy = enemy;
                    }
                }
                
                if (nearestEnemy) {
                    const dx = nearestEnemy.x - this.x;
                    const dy = nearestEnemy.y - this.y;
                    targetLookX = (dx / minDistance) * 15;
                    targetLookY = (dy / minDistance) * 10;
                    hasTarget = true;
                }
            }
        }
        
        // 如果沒有目標，自然擺動
        if (!hasTarget) {
            targetLookX = Math.sin(time * 0.5) * 2;
            targetLookY = Math.cos(time * 0.3) * 1;
        }
        
        // 平滑過渡到目標視線
        this.catLookX += (targetLookX - this.catLookX) * deltaTime * 5;
        this.catLookY += (targetLookY - this.catLookY) * deltaTime * 5;
        
        // 平滑處理最終輸出
        this.catLookSmoothX += (this.catLookX - this.catLookSmoothX) * deltaTime * 8;
        this.catLookSmoothY += (this.catLookY - this.catLookSmoothY) * deltaTime * 8;
        
        // 根據視線方向調整耳朵
        const lookAngle = Math.atan2(this.catLookY, this.catLookX);
        const baseEarAngle = hasTarget ? -0.1 : 0; // 有目標時耳朵豎起
        this.catEarAngleLeft = baseEarAngle + Math.sin(lookAngle) * 0.15 + Math.sin(time * 2) * 0.1;
        this.catEarAngleRight = baseEarAngle - Math.sin(lookAngle) * 0.15 + Math.cos(time * 2.3) * 0.1;
        
        // 鬍鬚波動 - 有目標時波動更快
        const whiskerSpeed = hasTarget ? 5 : 3;
        this.catWhiskerWave = Math.sin(time * whiskerSpeed) * 0.1;
        
        // 尾巴擺動 - 血量越低擺動越快
        const swingSpeed = healthPercent < 0.3 ? 8 : healthPercent < 0.6 ? 5 : 3;
        this.catTailSwing = Math.sin(time * swingSpeed) * 0.3;
        
        // 眨眼動畫
        this.blinkTimer += deltaTime;
        if (this.blinkTimer > 3 + Math.random() * 2) {
            this.isBlinking = true;
            this.blinkTimer = 0;
        }
        if (this.isBlinking && this.blinkTimer > 0.15) {
            this.isBlinking = false;
        }
        
        // 偶爾 MEOW
        this.meowTimer += deltaTime;
        if (this.meowTimer > 10 + Math.random() * 10) {
            this.meowTimer = 0;
        }
    }

    // 更新攻擊屬性基於升級效果
    updateAttackProperties() {
        if (!this.game.upgradeSystem) return;
        
        const effects = this.game.upgradeSystem.getCachedEffects();
        
        // 更新攻擊冷卻時間（射速提升）
        this.attackCooldown = this.baseAttackCooldown * (effects.fireRateMultiplier || 1);
        
        // 更新攻擊範圍
        this.attackRange = this.baseAttackRange * (effects.rangeMultiplier || 1);
        
        // 計算散射彈數（範圍擴大變成散射效果）
        const multiplier = effects.rangeMultiplier || 1;
        if (multiplier >= 6.0) {
            this.projectileCount = 5; // 4層升級 = 5發
        } else if (multiplier >= 4.5) {
            this.projectileCount = 4; // 3層升級 = 4發
        } else if (multiplier >= 3.0) {
            this.projectileCount = 3; // 2層升級 = 3發
        } else if (multiplier >= 1.5) {
            this.projectileCount = 2; // 1層升級 = 2發
        } else {
            this.projectileCount = 1; // 無升級 = 1發
        }
    }
    
    // 自動攻擊敵人
    autoAttack() {
        // 更新攻擊屬性
        this.updateAttackProperties();
        
        const currentTime = Date.now();
        if (currentTime - this.lastAttackTime < this.attackCooldown) return;

        // 攻擊範圍
        const attackRange = this.attackRange;
        
        // 尋找範圍內的敵人
        const nearbyEnemies = this.game.enemies.filter(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= attackRange && enemy.active;
        });

        if (nearbyEnemies.length > 0) {
            // 根據散射彈數攻擊
            const projectileCount = this.projectileCount || 1;
            
            // 選擇主要目標（最近的敵人）
            const primaryTarget = nearbyEnemies[0];
            const baseAngle = Math.atan2(primaryTarget.y - this.y, primaryTarget.x - this.x);
            
            // 創建散射攻擊
            for (let i = 0; i < projectileCount; i++) {
                let targetAngle = baseAngle;
                
                if (projectileCount > 1) {
                    if (projectileCount % 2 === 1) {
                        // 奇數彈數：中心有一發，其他對稱分布
                        const centerIndex = Math.floor(projectileCount / 2);
                        if (i !== centerIndex) {
                            const spreadAngle = Math.PI / 8; // 22.5度範圍
                            const sideIndex = i < centerIndex ? i - centerIndex : i - centerIndex;
                            targetAngle = baseAngle + sideIndex * (spreadAngle / Math.floor(projectileCount / 2));
                        }
                    } else {
                        // 偶數彈數：對稱分布，無正中心
                        const spreadAngle = Math.PI / 8; // 22.5度範圍
                        const angleStep = spreadAngle / (projectileCount / 2);
                        const side = i < projectileCount / 2 ? -1 : 1;
                        const offset = (i % (projectileCount / 2) + 0.5) * angleStep;
                        targetAngle = baseAngle + side * offset;
                    }
                }
                
                // 發射散射投射物
                this.createScatterProjectile(targetAngle, nearbyEnemies);
            }
            
            this.lastAttackTime = currentTime;
        }
    }
    
    // 創建散射投射物
    createScatterProjectile(angle, nearbyEnemies) {
        // 計算投射物的直線軌跡終點
        const projectileRange = 600; // 投射物飛行距離
        const endX = this.x + Math.cos(angle) * projectileRange;
        const endY = this.y + Math.sin(angle) * projectileRange;
        
        // 創建沿著這個角度飛行的直線投射物
        const scatterProjectile = this.game.projectileManager.createScatterProjectile(
            this.x, this.y, angle, projectileRange, nearbyEnemies, this.game
        );
    }

    // 創建攻擊特效
    createAttackEffect() {
        // 基地發光效果
        for (let i = 0; i < 5; i++) {
            this.game.particleManager.addParticle(
                this.x + (Math.random() - 0.5) * this.radius,
                this.y + (Math.random() - 0.5) * this.radius,
                {
                    vx: (Math.random() - 0.5) * 50,
                    vy: (Math.random() - 0.5) * 50,
                    life: 0.3,
                    color: '#00ffff',
                    size: Math.random() * 3 + 1,
                    type: 'base_attack'
                }
            );
        }
        
        // 創建能量環擴散效果
        this.createEnergyRing();
    }
    
    // 創建能量環擴散效果
    createEnergyRing() {
        if (!this.game.specialEffects) {
            this.game.specialEffects = [];
        }
        
        this.game.specialEffects.push({
            type: 'energy_ring',
            x: this.x,
            y: this.y,
            radius: this.radius,
            maxRadius: this.radius + 100,
            expandSpeed: 200,  // 每秒擴散速度
            alpha: 0.8,
            color: '#00ffff',
            createdTime: Date.now(),
            duration: 0.8  // 持續時間
        });
    }

    // 基地受到傷害
    takeDamage(damage) {
        // 直接造成傷害，移除複雜的攻擊系統依賴
        if (damage > 0) {
            this.shakeTimer = 0.3;
            this.shakeIntensity = Math.min(damage / 5, 10);
            
            // 創建受傷特效
            for (let i = 0; i < 8; i++) {
                this.game.particleManager.addParticle(
                    this.x,
                    this.y,
                    {
                        vx: (Math.random() - 0.5) * 100,
                        vy: (Math.random() - 0.5) * 100,
                        life: 0.5,
                        color: '#ff6666',
                        size: Math.random() * 4 + 2,
                        type: 'damage'
                    }
                );
            }
        }
    }

    // 主要渲染方法 - 委託給渲染器
    render(ctx) {
        this.renderer.render(ctx);
    }
}

// 導出類
window.CyberpunkCatBase = CyberpunkCatBase;