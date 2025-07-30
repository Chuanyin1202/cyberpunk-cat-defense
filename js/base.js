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
        this.attackCooldown = 500; // 0.5秒
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

    // 自動攻擊敵人
    autoAttack() {
        const currentTime = Date.now();
        if (currentTime - this.lastAttackTime < this.attackCooldown) return;

        // 基礎攻擊範圍
        const attackRange = this.attackRange;
        
        // 尋找範圍內的敵人
        const nearbyEnemies = this.game.enemies.filter(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= attackRange && enemy.active;
        });

        if (nearbyEnemies.length > 0) {
            // 攻擊最近的敵人
            const target = nearbyEnemies[0];
            
            // 使用基礎投射物攻擊
            this.game.createProjectile(this.x, this.y, target);
            this.lastAttackTime = currentTime;
        }
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