// 彈幕系統 - 自動攻擊和彈幕模式
// 讓遊戲更有彈幕射擊的爽快感

class BulletSystem {
    constructor(base) {
        this.base = base;
        this.game = base.game;
        
        // 彈幕配置 - 賽博龐克風格
        this.bullets = [];
        this.bulletPatterns = {
            basic: {
                fireRate: 100,      // 發射間隔(ms)
                speed: 500,         // 彈幕速度
                damage: 5,          // 傷害 (-50%)
                size: 4,            // 彈幕大小 - 縮小
                color: '#00ffff',   // 電子藍
                glow: true          // 發光效果
            },
            spread: {
                fireRate: 300,
                speed: 400,
                damage: 4,          // 傷害 (-50%)
                size: 3,            // 縮小
                color: '#ff00ff',   // 霓虹粉
                glow: true,
                spreadAngle: Math.PI / 6,  // 扇形角度
                bulletCount: 5             // 每次發射數量
            },
            spiral: {
                fireRate: 50,
                speed: 350,
                damage: 2.5,        // 傷害 (-50%)
                size: 2,            // 縮小
                color: '#00ff88',   // 數位綠
                glow: true,
                spiralSpeed: 5     // 螺旋速度
            },
            ring: {
                fireRate: 800,
                speed: 300,
                damage: 7.5,        // 傷害 (-50%)
                size: 5,            // 縮小
                color: '#ff6600',   // 火焰橙
                glow: true,
                bulletCount: 16    // 環形彈幕數量
            }
        };
        
        // 當前攻擊模式
        this.currentPattern = 'basic';
        this.patternLevel = 1;
        
        // 發射計時器
        this.lastFireTime = {};
        this.spiralAngle = 0;
        
        // 連擊系統
        this.combo = 0;
        this.comboTimer = 0;
        this.comboDecayTime = 2000; // 2秒後連擊歸零
        
        // 特殊攻擊
        this.specialAttackCooldown = 0;
        
        // 能量條系統
        this.energyBar = {
            current: 0,             // 初始能量為0
            max: 100,               // 能量條最大值（簡化為100）
            baseDamagePerPoint: 0.3, // 基礎每點傷害累積能量（進一步降低）
            maxDamagePerHit: 10,    // 單次命中最大能量累積
            autoTriggerThreshold: 100, // 自動觸發閾值
            decayRate: 0.5,         // 能量衰減速度 (每秒)
            lastDamageTime: 0       // 最後造成傷害的時間
        };
    }
    
    // 更新彈幕系統
    update(deltaTime) {
        const currentTime = Date.now();
        
        // 方向性攻擊 - 朝滑鼠方向發射
        this.fireDirectional(currentTime);
        
        // 更新所有彈幕
        this.updateBullets(deltaTime);
        
        // 更新連擊計時
        if (this.combo > 0) {
            this.comboTimer += deltaTime * 1000;
            if (this.comboTimer > this.comboDecayTime) {
                this.combo = 0;
                this.comboTimer = 0;
            }
        }
        
        // 更新特殊攻擊冷卻
        if (this.specialAttackCooldown > 0) {
            this.specialAttackCooldown -= deltaTime * 1000;
        }
        
        // 更新能量條系統
        this.updateEnergyBar(deltaTime);
        
        // 根據連擊數升級攻擊模式
        this.updatePatternByCombo();
    }
    
    // 方向性攻擊 - 朝滑鼠方向發射
    fireDirectional(currentTime) {
        // 檢查是否有滑鼠位置
        if (this.game.gameState.mouseX === null || this.game.gameState.mouseY === null) {
            return; // 沒有滑鼠位置就不攻擊
        }
        
        const pattern = this.bulletPatterns[this.currentPattern];
        
        // 應用射速升級效果
        const upgradeEffects = this.base.game.upgradeSystem ? this.base.game.upgradeSystem.getEffects() : {};
        const fireRateMultiplier = upgradeEffects.fireRateMultiplier || 1.0;
        const adjustedFireRate = pattern.fireRate * fireRateMultiplier;
        
        if (!this.lastFireTime[this.currentPattern]) {
            this.lastFireTime[this.currentPattern] = 0;
        }
        
        if (currentTime - this.lastFireTime[this.currentPattern] >= adjustedFireRate) {
            // 計算朝滑鼠方向的角度
            const dx = this.game.gameState.mouseX - this.base.x;
            const dy = this.game.gameState.mouseY - this.base.y;
            const mouseAngle = Math.atan2(dy, dx);
            
            
            
            this.firePatternDirectional(this.currentPattern, mouseAngle);
            this.lastFireTime[this.currentPattern] = currentTime;
        }
    }
    
    // 發射特定模式的彈幕
    firePattern(patternName) {
        const pattern = this.bulletPatterns[patternName];
        const enemies = this.game.enemies.filter(e => e.active);
        
        switch(patternName) {
            case 'basic':
                this.fireBasic(pattern, enemies);
                break;
            case 'spread':
                this.fireSpread(pattern, enemies);
                break;
            case 'spiral':
                this.fireSpiral(pattern);
                break;
            case 'ring':
                this.fireRing(pattern);
                break;
        }
    }
    
    // 方向性彈幕發射 - 朝指定角度發射
    firePatternDirectional(patternName, angle) {
        const pattern = this.bulletPatterns[patternName];
        
        switch(patternName) {
            case 'basic':
                this.fireBasicDirectional(pattern, angle);
                break;
            case 'spread':
                this.fireSpreadDirectional(pattern, angle);
                break;
            case 'spiral':
                this.fireSpiralDirectional(pattern, angle);
                break;
            case 'ring':
                this.fireRingDirectional(pattern, angle);
                break;
        }
    }
    
    // 基礎攻擊 - 追蹤最近的敵人
    fireBasic(pattern, enemies) {
        if (enemies.length === 0) return;
        
        // 找最近的敵人
        let nearestEnemy = enemies[0];
        let minDistance = Infinity;
        
        enemies.forEach(enemy => {
            const dist = Math.sqrt(
                Math.pow(enemy.x - this.base.x, 2) + 
                Math.pow(enemy.y - this.base.y, 2)
            );
            if (dist < minDistance) {
                minDistance = dist;
                nearestEnemy = enemy;
            }
        });
        
        // 計算角度
        const angle = Math.atan2(
            nearestEnemy.y - this.base.y,
            nearestEnemy.x - this.base.x
        );
        
        // 發射三連發
        for (let i = 0; i < 3; i++) {
            const delay = i * 50;
            if (window.timerManager) {
                window.timerManager.setTimeout(() => {
                    // 從貓咪周圍隨機位置發射
                    const fireAngle = Math.random() * Math.PI * 2;
                    const fireDistance = this.base.radius * 0.8; // 從基地邊緣發射
                    const fireX = this.base.x + Math.cos(fireAngle) * fireDistance;
                    const fireY = this.base.y + Math.sin(fireAngle) * fireDistance;
                    
                    const upgradeEffects = this.base.game.upgradeSystem ? this.base.game.upgradeSystem.getEffects() : {};
                    const damageMultiplier = upgradeEffects.damageMultiplier || 1.0;
                    
                    this.createBullet({
                        x: fireX,
                        y: fireY,
                        angle: angle + (Math.random() - 0.5) * 0.1,
                        speed: pattern.speed + i * 50,
                        damage: pattern.damage * (1 + this.combo * 0.1) * damageMultiplier,
                        size: pattern.size,
                        color: pattern.color,
                        glow: pattern.glow,
                        homing: true,
                        target: nearestEnemy
                    });
                }, delay);
            } else {
                setTimeout(() => {
                    // 從貓咪周圍隨機位置發射
                    const fireAngle = Math.random() * Math.PI * 2;
                    const fireDistance = this.base.radius * 0.8; // 從基地邊緣發射
                    const fireX = this.base.x + Math.cos(fireAngle) * fireDistance;
                    const fireY = this.base.y + Math.sin(fireAngle) * fireDistance;
                    
                    const upgradeEffects = this.base.game.upgradeSystem ? this.base.game.upgradeSystem.getEffects() : {};
                    const damageMultiplier = upgradeEffects.damageMultiplier || 1.0;
                    
                    this.createBullet({
                        x: fireX,
                        y: fireY,
                        angle: angle + (Math.random() - 0.5) * 0.1,
                        speed: pattern.speed + i * 50,
                        damage: pattern.damage * (1 + this.combo * 0.1) * damageMultiplier,
                        size: pattern.size,
                        color: pattern.color,
                        glow: pattern.glow,
                        homing: true,
                        target: nearestEnemy
                    });
                }, delay);
            }
        }
    }
    
    // 扇形攻擊
    fireSpread(pattern, enemies) {
        const baseAngle = enemies.length > 0 ? 
            Math.atan2(enemies[0].y - this.base.y, enemies[0].x - this.base.x) : 
            Math.random() * Math.PI * 2;
        
        const angleStep = pattern.spreadAngle * 2 / (pattern.bulletCount - 1);
        const startAngle = baseAngle - pattern.spreadAngle;
        
        const upgradeEffects = this.base.game.upgradeSystem ? this.base.game.upgradeSystem.getEffects() : {};
        const damageMultiplier = upgradeEffects.damageMultiplier || 1.0;
        
        for (let i = 0; i < pattern.bulletCount; i++) {
            const angle = startAngle + angleStep * i;
            
            // 從貓咪面向目標的方向發射
            const fireDistance = this.base.radius * 0.7;
            const fireX = this.base.x + Math.cos(baseAngle) * fireDistance;
            const fireY = this.base.y + Math.sin(baseAngle) * fireDistance;
            
            this.createBullet({
                x: fireX,
                y: fireY,
                angle: angle,
                speed: pattern.speed,
                damage: pattern.damage * (1 + this.combo * 0.05) * damageMultiplier,
                size: pattern.size,
                color: pattern.color,
                glow: pattern.glow,
                piercing: this.combo > 10  // 連擊10以上穿透
            });
        }
    }
    
    // 螺旋攻擊
    fireSpiral(pattern) {
        this.spiralAngle += pattern.spiralSpeed * 0.1;
        
        const upgradeEffects = this.base.game.upgradeSystem ? this.base.game.upgradeSystem.getEffects() : {};
        const damageMultiplier = upgradeEffects.damageMultiplier || 1.0;
        
        // 雙螺旋
        for (let i = 0; i < 2; i++) {
            const angle = this.spiralAngle + i * Math.PI;
            
            // 從貓咪周圍不同位置發射
            const fireDistance = this.base.radius * 0.6;
            const fireX = this.base.x + Math.cos(angle) * fireDistance;
            const fireY = this.base.y + Math.sin(angle) * fireDistance;
            
            this.createBullet({
                x: fireX,
                y: fireY,
                angle: angle,
                speed: pattern.speed,
                damage: pattern.damage * (1 + this.combo * 0.05) * damageMultiplier,
                size: pattern.size,
                color: pattern.color,
                glow: pattern.glow,
                spiral: true
            });
        }
    }
    
    // 環形攻擊
    fireRing(pattern) {
        const angleStep = (Math.PI * 2) / pattern.bulletCount;
        
        for (let i = 0; i < pattern.bulletCount; i++) {
            const angle = angleStep * i;
            
            // 從貓咪邊緣環形發射
            const fireDistance = this.base.radius * 0.9;
            const fireX = this.base.x + Math.cos(angle) * fireDistance;
            const fireY = this.base.y + Math.sin(angle) * fireDistance;
            
            this.createBullet({
                x: fireX,
                y: fireY,
                angle: angle,
                speed: pattern.speed,
                damage: pattern.damage * (1 + this.combo * 0.1),
                size: pattern.size + Math.sin(Date.now() * 0.01 + i) * 1,
                color: pattern.color,
                glow: pattern.glow,
                wave: true  // 波動效果
            });
        }
    }
    
    // 創建彈幕
    createBullet(config) {
        const vx = Math.cos(config.angle) * config.speed;
        const vy = Math.sin(config.angle) * config.speed;
        
        const bullet = {
            x: config.x,
            y: config.y,
            vx: vx,
            vy: vy,
            damage: config.damage,
            size: config.size,
            color: config.color,
            glow: config.glow,
            active: true,
            lifetime: 0,
            id: Math.random() * 1000, // 用於顏色變化
            lastPulseTime: 0,  // 上次脈衝時間
            
            // 特殊屬性
            homing: config.homing || false,
            target: config.target || null,
            piercing: config.piercing || false,
            spiral: config.spiral || false,
            wave: config.wave || false,
            enhanced: config.enhanced || false,  // 標記是否為大招子彈
            hitEnemies: new Set()
        };
        
        this.bullets.push(bullet);
        
        // 發射特效
        this.createMuzzleFlash(config.x, config.y, config.color);
    }
    
    // 恢復完整的彈幕更新（但簡化批次處理）
    updateBullets(deltaTime) {
        this.updateCounter = (this.updateCounter || 0) + 1;
        
        // 定期清理陣列（每80幀清理一次）
        if (!this.cleanupCounter) this.cleanupCounter = 0;
        this.cleanupCounter++;
        
        if (this.cleanupCounter > 80) {
            this.bullets = this.bullets.filter(bullet => bullet.active);
            this.cleanupCounter = 0;
        }
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            if (!bullet.active) {
                continue;
            }
            
            // 恢復完整更新邏輯
            bullet.lifetime += deltaTime;
            
            // 追蹤彈
            if (bullet.homing && bullet.target && bullet.target.active) {
                const angle = Math.atan2(
                    bullet.target.y - bullet.y,
                    bullet.target.x - bullet.x
                );
                const turnSpeed = 3 * deltaTime;
                const currentAngle = Math.atan2(bullet.vy, bullet.vx);
                const newAngle = this.lerpAngle(currentAngle, angle, turnSpeed);
                
                const speed = Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
                bullet.vx = Math.cos(newAngle) * speed;
                bullet.vy = Math.sin(newAngle) * speed;
            }
            
            // 螺旋彈
            if (bullet.spiral) {
                const perpX = -bullet.vy / Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
                const perpY = bullet.vx / Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
                const spiralForce = Math.sin(bullet.lifetime * 10) * 100;
                bullet.vx += perpX * spiralForce * deltaTime;
                bullet.vy += perpY * spiralForce * deltaTime;
            }
            
            // 波動彈
            if (bullet.wave) {
                bullet.size = bullet.size + Math.sin(bullet.lifetime * 15) * 1;
            }
            
            // 更新位置
            bullet.x += bullet.vx * deltaTime;
            bullet.y += bullet.vy * deltaTime;
            
            // 生成脈衝波紋效果
            this.updateBulletEffects(bullet, deltaTime);
            
            // 檢查邊界
            if (bullet.x < -50 || bullet.x > this.game.canvas.width + 50 ||
                bullet.y < -50 || bullet.y > this.game.canvas.height + 50) {
                bullet.active = false;
                continue;
            }
            
            // 檢查碰撞
            this.checkBulletCollisions(bullet);
        }
        
        // 定期清理無效彈幕
        if (this.updateCounter % 180 === 0) {
            this.bullets = this.bullets.filter(bullet => bullet.active);
        }
    }
    
    // 檢查彈幕碰撞
    checkBulletCollisions(bullet) {
        this.game.enemies.forEach(enemy => {
            if (!enemy.active || bullet.hitEnemies.has(enemy)) return;
            
            const dx = enemy.x - bullet.x;
            const dy = enemy.y - bullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < bullet.size + enemy.size) {
                // 計算最終傷害（包含暴擊）
                let finalDamage = bullet.damage;
                const upgradeEffects = this.base.game.upgradeSystem ? this.base.game.upgradeSystem.getEffects() : {};
                
                // 暴擊檢查
                if (upgradeEffects.criticalChance > 0 && Math.random() < upgradeEffects.criticalChance) {
                    finalDamage *= upgradeEffects.criticalMultiplier || 2.0;
                    // 創建暴擊特效
                    this.createCriticalHitEffect(bullet.x, bullet.y, bullet.color);
                }
                
                // 造成傷害
                enemy.takeDamage(finalDamage);
                bullet.hitEnemies.add(enemy);
                
                // 累積傷害到能量條
                this.addDamageToEnergy(finalDamage);
                
                // 增加連擊
                if (enemy.health <= 0) {
                    this.addCombo();
                }
                
                // 命中特效
                this.createHitEffect(bullet.x, bullet.y, bullet.color);
                
                // 非穿透彈幕消失
                if (!bullet.piercing) {
                    bullet.active = false;
                }
            }
        });
    }
    
    // 增加連擊
    addCombo() {
        this.combo++;
        this.comboTimer = 0;
        
        // 連擊獎勵
        if (this.combo % 10 === 0) {
            this.createComboEffect();
        }
    }
    
    // 根據連擊更新攻擊模式
    updatePatternByCombo() {
        if (this.combo < 5) {
            this.currentPattern = 'basic';
        } else if (this.combo < 15) {
            this.currentPattern = 'spread';
        } else if (this.combo < 30) {
            this.currentPattern = 'spiral';
        } else {
            this.currentPattern = 'ring';
        }
    }
    
    // 能量條系統更新
    updateEnergyBar(deltaTime) {
        const currentTime = Date.now();
        
        // 如果長時間沒有造成傷害，能量開始衰減
        if (currentTime - this.energyBar.lastDamageTime > 3000) { // 3秒後開始衰減
            this.energyBar.current = Math.max(0, this.energyBar.current - this.energyBar.decayRate * deltaTime * 1000);
        }
        
        // 檢查是否達到自動觸發閾值
        if (this.energyBar.current >= this.energyBar.autoTriggerThreshold) {
            this.triggerEnergyAttack();
        }
    }
    
    // 累積傷害到能量條（平衡後期高傷害）
    addDamageToEnergy(damage) {
        // 使用對數縮放來控制高傷害的能量累積
        let energyGain = Math.min(
            this.energyBar.maxDamagePerHit,
            damage * this.energyBar.baseDamagePerPoint * (1 + Math.log10(Math.max(1, damage / 25)))
        );
        
        // 進一步限制：高傷害時使用平方根縮放
        if (damage > 50) {
            energyGain = Math.min(
                this.energyBar.maxDamagePerHit,
                Math.sqrt(damage) * this.energyBar.baseDamagePerPoint * 2
            );
        }
        
        this.energyBar.current = Math.min(
            this.energyBar.max, 
            this.energyBar.current + energyGain
        );
        this.energyBar.lastDamageTime = Date.now();
    }
    
    // 觸發能量攻擊
    triggerEnergyAttack() {
        if (this.specialAttackCooldown > 0) return;
        
        // 重置能量條
        this.energyBar.current = 0;
        this.specialAttackCooldown = 2000; // 增加冷卻時間到2秒
        
        // 自動在滑鼠位置或基地中心觸發華麗攻擊
        let targetX = this.base.x;
        let targetY = this.base.y;
        
        // 如果有滑鼠位置，在滑鼠位置觸發
        if (this.game.gameState.mouseX && this.game.gameState.mouseY) {
            targetX = this.game.gameState.mouseX;
            targetY = this.game.gameState.mouseY;
        }
        
        // 觸發加強版特殊攻擊
        this.fireEnhancedSpecialAttack(targetX, targetY);
        
        // console.log('🔥 能量條滿！自動觸發華麗攻擊！'); // 能量條觸發不頻繁，可保留
    }
    
    // 特殊攻擊 - 點擊位置觸發攻擊
    fireSpecialAttack(x, y) {
        // 更新滑鼠位置讓普通攻擊朝向點擊位置
        this.game.gameState.mouseX = x;
        this.game.gameState.mouseY = y;
        
        // 立即觸發一次攻擊
        this.fireDirectional(Date.now());
    }
    
    // 加強版特殊攻擊 - 能量條觸發
    fireEnhancedSpecialAttack(x, y) {
        // 創建更強大的賽博龐克風格爆炸彈幕
        const patterns = [
            { count: 8, speed: 500, size: 15, color: '#ff00ff', delay: 0, damage: 25 },
            { count: 16, speed: 450, size: 12, color: '#00ffff', delay: 80 },
            { count: 24, speed: 400, size: 10, color: '#00ff88', delay: 160 },
            { count: 32, speed: 350, size: 8, color: '#ffff00', delay: 240 }
        ];
        
        patterns.forEach((pattern, patternIndex) => {
            if (window.timerManager) {
                window.timerManager.setTimeout(() => {
                    for (let i = 0; i < pattern.count; i++) {
                        const angle = (Math.PI * 2 / pattern.count) * i + patternIndex * 0.1;
                        
                        this.createBullet({
                            x: x,
                            y: y,
                            angle: angle + Math.random() * 0.1,
                            speed: pattern.speed,
                            damage: pattern.damage || 20,
                            size: pattern.size,
                            color: pattern.color,
                            glow: true,
                            piercing: true,
                            homing: patternIndex === 0, // 第一波有追蹤能力
                            enhanced: true // 標記為大招子彈
                        });
                    }
                }, pattern.delay);
            } else {
                setTimeout(() => {
                    for (let i = 0; i < pattern.count; i++) {
                        const angle = (Math.PI * 2 / pattern.count) * i + patternIndex * 0.1;
                        
                        this.createBullet({
                            x: x,
                            y: y,
                            angle: angle + Math.random() * 0.1,
                            speed: pattern.speed,
                            damage: pattern.damage || 20,
                            size: pattern.size,
                            color: pattern.color,
                            glow: true,
                            piercing: true,
                            homing: patternIndex === 0, // 第一波有追蹤能力
                            enhanced: true // 標記為大招子彈
                        });
                    }
                }, pattern.delay);
            }
        });
        
        // 強化爆炸特效
        this.createEnhancedExplosionEffect(x, y);
        
        // 數位干擾效果
        this.createDigitalGlitchEffect(x, y);
        
        // 能量波特效
        this.createEnergyWaveEffect(x, y);
    }
    
    // 創建數位干擾效果
    createDigitalGlitchEffect(x, y) {
        // 故障線條
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const length = 50 + Math.random() * 100;
            
            this.game.particleManager.addParticle(x, y, {
                vx: Math.cos(angle) * 1000,
                vy: Math.sin(angle) * 1000,
                life: 0.1,
                color: ['#ff00ff', '#00ffff', '#ffffff'][i % 3],
                size: 2,
                type: 'glitch_line',
                glow: true,
                length: length
            });
        }
    }
    
    // === 視覺效果 ===
    
    createMuzzleFlash(x, y, color) {
        // 簡化槍口閃光（減少粒子數量和生命週期）
        for (let i = 0; i < 2; i++) {
            const angle = (Math.PI * 2 / 2) * i;
            this.game.particleManager.addParticle(x, y, {
                vx: Math.cos(angle) * 100,
                vy: Math.sin(angle) * 100,
                life: 0.1,  // 縮短生命週期
                color: i % 2 === 0 ? '#ffffff' : color,
                size: 2,    // 縮小尺寸
                type: 'cyberpunk_muzzle',
                glow: true,
                fade: true  // 添加淡出效果
            });
        }
        
        // 減少數位碎片
        if (Math.random() < 0.5) {  // 50%機率產生
            this.game.particleManager.addParticle(x, y, {
                vx: (Math.random() - 0.5) * 150,
                vy: (Math.random() - 0.5) * 150,
                life: 0.08,  // 縮短生命週期
                color: color,
                size: 1,     // 縮小尺寸
                type: 'digital_fragment',
                fade: true   // 添加淡出效果
            });
        }
    }
    
    createHitEffect(x, y, color) {
        // 擊中效果 - 使用六邊形
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i + Math.random() * 0.2;
            const speed = 80 + Math.random() * 40;
            
            this.game.particleManager.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.4,
                color: i % 2 === 0 ? color : '#ffffff',
                size: 2 + Math.random(),
                type: 'hit',  // 使用 hit 類型（六邊形）
                glow: true,
                fade: true,
                friction: 0.95
            });
        }
        
        // 中心閃光
        this.game.particleManager.addParticle(x, y, {
            vx: 0,
            vy: 0,
            life: 0.2,
            color: '#ffffff',
            size: 8,
            type: 'hit',
            glow: true,
            fade: true
        });
    }
    
    // 暴擊特效
    createCriticalHitEffect(x, y, color) {
        // 更大的爆炸效果
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i + Math.random() * 0.3;
            const speed = 120 + Math.random() * 80;
            
            this.game.particleManager.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.8,
                color: i % 3 === 0 ? '#ffff00' : (i % 3 === 1 ? color : '#ffffff'),
                size: 3 + Math.random() * 2,
                type: 'hit',  // 暴擊也使用六邊形
                glow: true,
                gravity: 60,
                friction: 0.95
            });
        }
        
        // 暴擊閃光
        this.game.particleManager.addParticle(x, y, {
            vx: 0,
            vy: 0,
            life: 0.3,
            color: '#ffff00',
            size: 15,
            type: 'hit',
            glow: true,
            fade: true
        });
        
        // console.log('暴擊！'); // 移除頻繁日誌
    }
    
    createComboEffect() {
        // 賽博龐克全屏故障效果
        const colors = ['#ff00ff', '#00ffff', '#00ff88'];
        
        // 數位掃描線
        for (let i = 0; i < 3; i++) {
            this.game.particleManager.addParticle(
                this.game.canvas.width / 2,
                i * 200,
                {
                    vx: 0,
                    vy: 300,
                    life: 0.5,
                    color: colors[i % colors.length],
                    size: this.game.canvas.width,
                    type: 'scan_line',
                    glow: true
                }
            );
        }
        
        // 中心脈衝
        this.game.particleManager.addParticle(
            this.base.x,
            this.base.y,
            {
                vx: 0,
                vy: 0,
                life: 0.4,
                color: '#ffffff',
                size: 100,
                type: 'cyber_pulse',
                fade: true,
                glow: true
            }
        );
    }
    
    createExplosionEffect(x, y) {
        // 賽博龐克煙火爆炸
        const colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff6600', '#00ff88'];
        
        // 主要煙火爆炸 - 放射狀火花（減少數量）
        for (let i = 0; i < 6; i++) {  // 進一步減少到6個
            const angle = (Math.PI * 2 / 6) * i + Math.random() * 0.3;
            const speed = 150 + Math.random() * 100;  // 減慢速度
            
            this.game.particleManager.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.2,  // 縮短生命週期 (0.5-0.7秒)
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 2 + Math.random() * 1.5,  // 更小尺寸 (2-3.5)
                type: 'explosion',
                glow: true,
                gravity: 120, // 增加重力，讓火花更快下落
                friction: 0.95 // 增加阻力
            });
        }
        
        // 次要爆炸環 - 更快更亮的火花（減少數量）
        for (let i = 0; i < 4; i++) {  // 減少到4個
            const angle = Math.random() * Math.PI * 2;
            const speed = 250 + Math.random() * 50;  // 減慢速度
            
            this.game.particleManager.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.3,  // 縮短生命週期
                color: '#ffffff',
                size: 2,  // 更小尺寸
                type: 'hit',
                glow: true,
                gravity: 80,
                friction: 0.93
            });
        }
        
        // 中心閃光
        this.game.particleManager.addParticle(x, y, {
            vx: 0,
            vy: 0,
            life: 0.2,  // 縮短生命週期
            color: '#ffffff',
            size: 15,  // 更小的中心愛心
            type: 'hit',
            glow: true,
            fade: true
        });
        
        // 延遲的彩色火花雨（減少數量）
        if (window.timerManager) {
            window.timerManager.setTimeout(() => {
                for (let i = 0; i < 4; i++) {  // 減少到4個
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 80 + Math.random() * 30;  // 減慢速度
                    
                    this.game.particleManager.addParticle(x, y, {
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 30, // 向上發射
                        life: 0.6,  // 縮短生命週期
                        color: colors[Math.floor(Math.random() * colors.length)],
                        size: 1.5 + Math.random() * 0.5,  // 更小尺寸 (1.5-2)
                        type: 'firework_trail',
                        glow: true,
                        gravity: 180,  // 增加重力
                        friction: 0.96  // 增加摩擦
                    });
                }
            }, 80);  // 縮短延遲
        } else {
            setTimeout(() => {
                for (let i = 0; i < 4; i++) {  // 減少到4個
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 80 + Math.random() * 30;  // 減慢速度
                    
                    this.game.particleManager.addParticle(x, y, {
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 30, // 向上發射
                        life: 0.6,  // 縮短生命週期
                        color: colors[Math.floor(Math.random() * colors.length)],
                        size: 1.5 + Math.random() * 0.5,  // 更小尺寸 (1.5-2)
                        type: 'firework_trail',
                        glow: true,
                        gravity: 180,  // 增加重力
                        friction: 0.96  // 增加摩擦
                    });
                }
            }, 80);  // 縮短延遲
        }
    }
    
    // 恢復完整的爆炸特效
    createEnhancedExplosionEffect(x, y) {
        const colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff6600', '#00ff88'];
        
        // 恢復主要煙火爆炸 - 放射狀火花（減少數量）
        for (let i = 0; i < 8; i++) {  // 減少數量
            const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.3;
            const speed = 150 + Math.random() * 100;  // 減慢速度
            
            this.game.particleManager.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.2,  // 縮短生命週期
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 1.5 + Math.random() * 0.5,  // 大幅縮小 (1.5-2)
                type: 'explosion',
                glow: true,
                gravity: 120,
                friction: 0.95
            });
        }
        
        // 恢復次要爆炸環（減少數量）
        for (let i = 0; i < 4; i++) {  // 減少數量
            const angle = Math.random() * Math.PI * 2;
            const speed = 200 + Math.random() * 50;  // 減慢速度
            
            this.game.particleManager.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.3,  // 縮短生命週期
                color: '#ffffff',
                size: 1.5,  // 大幅縮小
                type: 'hit',
                glow: true,
                gravity: 80,
                friction: 0.93
            });
        }
        
        // 恢復中心閃光
        this.game.particleManager.addParticle(x, y, {
            vx: 0,
            vy: 0,
            life: 0.2,  // 縮短生命週期
            color: '#ffffff',
            size: 8,  // 大幅縮小中心愛心
            type: 'hit',
            glow: true,
            fade: true
        });
        
        // 恢復延遲的彩色火花雨（減少數量）
        if (window.timerManager) {
            window.timerManager.setTimeout(() => {
                for (let i = 0; i < 3; i++) {  // 減少到3個
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 60 + Math.random() * 20;  // 大幅減慢
                    
                    this.game.particleManager.addParticle(x, y, {
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 20,
                        life: 0.4,  // 大幅縮短
                        color: colors[Math.floor(Math.random() * colors.length)],
                        size: 1 + Math.random() * 0.5,  // 很小 (1-1.5)
                        type: 'firework_trail',
                        glow: true,
                        gravity: 200,
                        friction: 0.94
                    });
                }
            }, 50);  // 縮短延遲
        } else {
            setTimeout(() => {
                for (let i = 0; i < 3; i++) {  // 減少到3個
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 60 + Math.random() * 20;  // 大幅減慢
                    
                    this.game.particleManager.addParticle(x, y, {
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 20,
                        life: 0.4,  // 大幅縮短
                        color: colors[Math.floor(Math.random() * colors.length)],
                        size: 1 + Math.random() * 0.5,  // 很小 (1-1.5)
                        type: 'firework_trail',
                        glow: true,
                        gravity: 200,
                        friction: 0.94
                    });
                }
            }, 50);  // 縮短延遲
        }
    }
    
    // 能量波特效
    createEnergyWaveEffect(x, y) {
        // 進一步縮小的能量波特效
        for (let wave = 0; wave < 2; wave++) {  // 減少到2個波
            const delay = wave * 30;
            if (window.timerManager) {
                window.timerManager.setTimeout(() => {
                    this.game.particleManager.addParticle(x, y, {
                        vx: 0,
                        vy: 0,
                        life: 0.5,  // 縮短生命週期
                        color: '#ffffff',
                        size: 5 + wave * 8, // 更小：5, 13 像素
                        type: 'energy_wave',
                        glow: true,
                        fade: true,
                        expand: true
                    });
                }, delay);
            } else {
                setTimeout(() => {
                    this.game.particleManager.addParticle(x, y, {
                        vx: 0,
                        vy: 0,
                        life: 0.5,  // 縮短生命週期
                        color: '#ffffff',
                        size: 5 + wave * 8, // 更小：5, 13 像素
                        type: 'energy_wave',
                        glow: true,
                        fade: true,
                        expand: true
                    });
                }, delay);
            }
        }
    }
    
    // 渲染彈幕（高性能批次渲染）
    render(ctx) {
        ctx.save();
        
        const activeBullets = this.bullets.filter(b => b.active);
        const shouldUseLOD = activeBullets.length > 40; // 提高LOD閾值，保持更多特效
        
        // 使用批次渲染器優化
        if (window.objectPoolManager && window.objectPoolManager.batchRenderer) {
            const batchRenderer = window.objectPoolManager.batchRenderer;
            
            if (shouldUseLOD) {
                // LOD模式：批次渲染簡化版本
                batchRenderer.startBatch('bullets_lod', (ctx) => {
                    ctx.globalCompositeOperation = 'screen';
                });
                
                for (const bullet of activeBullets) {
                    batchRenderer.addToBatch({
                        render: (ctx) => this.renderSimplifiedBullet(ctx, bullet)
                    });
                }
                
                batchRenderer.finishBatch(ctx);
            } else {
                // 高品質模式：渲染子彈主體
                batchRenderer.startBatch('bullet_bodies', (ctx) => {
                    ctx.globalCompositeOperation = 'screen';
                });
                
                for (const bullet of activeBullets) {
                    batchRenderer.addToBatch({
                        render: (ctx) => this.renderEnhancedBullet(ctx, bullet)
                    });
                }
                batchRenderer.finishBatch(ctx);
            }
        } else {
            // 回退到原始渲染方式
            ctx.globalCompositeOperation = 'screen';
            for (const bullet of activeBullets) {
                if (shouldUseLOD) {
                    this.renderSimplifiedBullet(ctx, bullet);
                } else {
                    this.renderEnhancedBullet(ctx, bullet);
                }
            }
        }
        
        ctx.restore();
        
        // 恢復連擊數渲染
        if (this.combo > 0) {
            this.renderCyberpunkCombo(ctx);
        }
        
        // 能量條已整合到基地視覺效果中，不再單獨渲染
        // this.renderEnergyBar(ctx);
    }
    
    // 更新子彈特效系統
    updateBulletEffects(bullet, deltaTime) {
        const currentTime = Date.now();
        const bulletCount = this.bullets.filter(b => b.active).length;
        
        // LOD系統：子彈太多時減少特效
        const shouldReduceEffects = bulletCount > 50;
        const shouldDisableEffects = bulletCount > 100;
        
        if (shouldDisableEffects) return; // 極高負載時完全關閉特效
        
        // 脈衝波紋效果
        const baseInterval = bullet.enhanced ? 100 : 200;
        const pulseInterval = shouldReduceEffects ? baseInterval * 2 : baseInterval;
        
        if (currentTime - bullet.lastPulseTime > pulseInterval) {
            this.createBulletPulse(bullet);
            bullet.lastPulseTime = currentTime;
        }
        
        // 粒子推進效果（減少頻率）
        const particleChance = shouldReduceEffects ? 0.5 : 1.0;
        if (Math.random() < particleChance) {
            this.createBulletParticles(bullet, deltaTime);
        }
    }
    
    // 創建子彈脈衝波紋
    createBulletPulse(bullet) {
        if (!this.game.specialEffects) {
            this.game.specialEffects = [];
        }
        
        const maxRadius = bullet.enhanced ? 50 : 30;
        const color = bullet.enhanced ? this.getDynamicColor(bullet) : bullet.color;
        
        this.game.specialEffects.push({
            type: 'bullet_pulse',
            x: bullet.x,
            y: bullet.y,
            radius: bullet.size,
            maxRadius: maxRadius,
            expandSpeed: bullet.enhanced ? 400 : 200,
            alpha: bullet.enhanced ? 0.6 : 0.4,
            color: color,
            createdTime: Date.now(),
            duration: 0.5
        });
    }
    
    // 創建子彈粒子效果
    createBulletParticles(bullet, deltaTime) {
        // 控制粒子生成頻率
        if (Math.random() > (bullet.enhanced ? 0.8 : 0.3)) return;
        
        // 計算子彈後方位置
        const angle = Math.atan2(bullet.vy, bullet.vx);
        const backX = bullet.x - Math.cos(angle) * bullet.size * 2;
        const backY = bullet.y - Math.sin(angle) * bullet.size * 2;
        
        const particleCount = bullet.enhanced ? Math.floor(Math.random() * 3) + 2 : 1;
        
        for (let i = 0; i < particleCount; i++) {
            const spreadAngle = angle + Math.PI + (Math.random() - 0.5) * 0.5;
            const speed = 50 + Math.random() * 50;
            
            this.game.particleManager.addParticle(backX, backY, {
                vx: Math.cos(spreadAngle) * speed,
                vy: Math.sin(spreadAngle) * speed,
                life: 0.3,
                color: bullet.enhanced ? this.getDynamicColor(bullet) : bullet.color,
                size: Math.random() * 2 + 1,
                type: 'bullet_trail',
                glow: true,
                fade: true,
                friction: 0.98
            });
        }
    }
    
    // 獲取動態變化的顏色
    getDynamicColor(bullet) {
        const time = Date.now() * 0.005;
        const bulletId = bullet.id || 0; // 防止 undefined
        const hue = Math.floor((time + bulletId * 100) % 360);
        
        // 確保 hue 是有效數字
        if (isNaN(hue)) {
            return '#ff00ff'; // 回退到固定顏色
        }
        
        return `hsl(${hue}, 100%, 60%)`;
    }
    
    // 增強版子彈渲染
    renderEnhancedBullet(ctx, bullet) {
        ctx.save();
        
        const time = Date.now() * 0.001;
        const pulse = 1 + Math.sin(time * 10 + bullet.x * 0.01) * 0.1;
        const bulletCount = this.bullets.filter(b => b.active).length;
        
        // LOD系統：根據子彈數量調整渲染細節
        const shouldSimplify = bulletCount > 50;
        const shouldUseMinimal = bulletCount > 100;
        
        if (shouldUseMinimal) {
            // 極簡模式：直接調用簡化渲染
            this.renderSimplifiedBullet(ctx, bullet);
            ctx.restore();
            return;
        }
        
        // 獲取子彈顏色
        const bulletColor = bullet.enhanced ? this.getDynamicColor(bullet) : bullet.color;
        
        // 多層光暈效果（可能簡化）
        if (bullet.glow) {
            if (shouldSimplify) {
                // 簡化模式：只渲染一層光暈
                const glowSize = bullet.size * 2.5;
                const gradient = ctx.createRadialGradient(
                    bullet.x, bullet.y, 0,
                    bullet.x, bullet.y, glowSize * pulse
                );
                gradient.addColorStop(0, this.adjustAlpha(bulletColor, 0.6));
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.globalAlpha = 0.4;
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, glowSize * pulse, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // 完整模式：多層光暈
                // 第一層：外層柔和光暈
                const outerSize = bullet.size * 4;
                const outerGradient = ctx.createRadialGradient(
                    bullet.x, bullet.y, 0,
                    bullet.x, bullet.y, outerSize * pulse
                );
                outerGradient.addColorStop(0, this.adjustAlpha(bulletColor, 0.6));
                outerGradient.addColorStop(0.5, this.adjustAlpha(bulletColor, 0.3));
                outerGradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = outerGradient;
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, outerSize * pulse, 0, Math.PI * 2);
                ctx.fill();
                
                // 第二層：中層強光暈
                const midSize = bullet.size * 2.5;
                const midGradient = ctx.createRadialGradient(
                    bullet.x, bullet.y, 0,
                    bullet.x, bullet.y, midSize * pulse
                );
                midGradient.addColorStop(0, this.adjustAlpha(bulletColor, 0.8));
                midGradient.addColorStop(0.7, this.adjustAlpha(bulletColor, 0.2));
                midGradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = midGradient;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(bullet.x, bullet.y, midSize * pulse, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // 子彈主體
        ctx.globalAlpha = 1;
        ctx.fillStyle = bulletColor;
        ctx.shadowBlur = 15;
        ctx.shadowColor = bulletColor;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // 內部旋轉核心（僅在非簡化模式下渲染）
        if (!shouldSimplify) {
            this.renderBulletCore(ctx, bullet, pulse, time);
        }
        
        // 大招子彈的特殊效果（僅在完整模式下渲染）
        if (bullet.enhanced && !shouldSimplify) {
            this.renderEnhancedEffects(ctx, bullet, pulse, time);
        }
        
        ctx.restore();
    }
    
    // 渲染子彈核心
    renderBulletCore(ctx, bullet, pulse, time) {
        ctx.save();
        
        ctx.translate(bullet.x, bullet.y);
        const rotation = time * (bullet.enhanced ? 10 : 3);
        ctx.rotate(rotation);
        
        // 白色核心光芒
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffffff';
        
        if (bullet.enhanced) {
            // 大招子彈：複雜八芒星
            this.drawStar(ctx, 0, 0, 8, bullet.size * 0.6 * pulse, bullet.size * 0.3 * pulse);
        } else {
            // 普通子彈：簡單十字
            const coreSize = bullet.size * 0.4 * pulse;
            ctx.fillRect(-coreSize, -coreSize * 0.3, coreSize * 2, coreSize * 0.6);
            ctx.fillRect(-coreSize * 0.3, -coreSize, coreSize * 0.6, coreSize * 2);
        }
        
        ctx.restore();
    }
    
    // 渲染大招特殊效果
    renderEnhancedEffects(ctx, bullet, pulse, time) {
        // 能量電弧
        if (Math.random() < 0.3) {
            ctx.save();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.lineCap = 'round';
            
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const startRadius = bullet.size * pulse;
                const endRadius = startRadius + 10 + Math.random() * 10;
                
                ctx.beginPath();
                ctx.moveTo(
                    bullet.x + Math.cos(angle) * startRadius,
                    bullet.y + Math.sin(angle) * startRadius
                );
                ctx.lineTo(
                    bullet.x + Math.cos(angle) * endRadius + (Math.random() - 0.5) * 5,
                    bullet.y + Math.sin(angle) * endRadius + (Math.random() - 0.5) * 5
                );
                ctx.stroke();
            }
            ctx.restore();
        }
    }
    
    // 繪製星形
    drawStar(ctx, x, y, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        const step = Math.PI / spikes;
        
        ctx.beginPath();
        ctx.moveTo(x, y - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            const outerX = x + Math.cos(rot) * outerRadius;
            const outerY = y + Math.sin(rot) * outerRadius;
            ctx.lineTo(outerX, outerY);
            rot += step;
            
            const innerX = x + Math.cos(rot) * innerRadius;
            const innerY = y + Math.sin(rot) * innerRadius;
            ctx.lineTo(innerX, innerY);
            rot += step;
        }
        
        ctx.lineTo(x, y - outerRadius);
        ctx.closePath();
        ctx.fill();
    }
    
    // 簡化的彈幕渲染（LOD模式）
    renderSimplifiedBullet(ctx, bullet) {
        ctx.save();
        
        // 最簡單的彈幕渲染
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 簡單的白色核心
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    
    // 渲染賽博龐克風格連擊數
    renderCyberpunkCombo(ctx) {
        ctx.save();
        
        // 使用UI適配系統獲取配置
        if (!window.uiAdapter) {
            // 如果UI適配系統未載入，使用原始配置
            this.renderFallbackCombo(ctx);
            return;
        }
        
        const textConfig = window.uiAdapter.getModuleConfig('textEffects', ctx.canvas).combo;
        const comboAlpha = 1 - (this.comboTimer / this.comboDecayTime) * 0.5;
        const glitchOffset = Math.random() * 2 - 1;
        const time = Date.now() * 0.001;
        
        // 背景數據流
        ctx.globalAlpha = comboAlpha * 0.3;
        ctx.font = '12px "Courier New", monospace';
        ctx.fillStyle = '#00ff88';
        const dataText = '01101011 ' + this.combo.toString(2).padStart(8, '0');
        ctx.fillText(dataText, textConfig.centerX, textConfig.centerY - 20);
        
        // 主連擊顯示 - 故障效果
        ctx.globalAlpha = comboAlpha;
        
        // 陰影層
        ctx.font = `bold ${textConfig.fontSize}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        
        // 多層故障效果
        const colors = ['#ff00ff', '#00ffff', '#ffff00'];
        colors.forEach((color, i) => {
            ctx.globalAlpha = comboAlpha * (1 - i * 0.2);
            ctx.fillStyle = color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = color;
            
            const offsetX = glitchOffset * (i + 1) * 2;
            const offsetY = textConfig.centerY + Math.sin(time * 10 + i) * 5;
            
            ctx.fillText(
                `[${this.combo}] COMBO!`, 
                textConfig.centerX + offsetX, 
                offsetY
            );
        });
        
        // 連擊等級 - 賽博龐克風格
        const levelTextY = textConfig.centerY + 40;
        if (this.combo >= 30) {
            this.renderGlitchText(ctx, 'CYBER OVERDRIVE', textConfig.centerX, levelTextY, '#ff00ff', comboAlpha);
        } else if (this.combo >= 15) {
            this.renderGlitchText(ctx, 'NEON SURGE', textConfig.centerX, levelTextY, '#00ffff', comboAlpha);
        } else if (this.combo >= 5) {
            this.renderGlitchText(ctx, 'DIGITAL FLOW', textConfig.centerX, levelTextY, '#00ff88', comboAlpha);
        }
        
        ctx.restore();
    }
    
    // 備用COMBO渲染（如果UI適配系統未載入）
    renderFallbackCombo(ctx) {
        const comboAlpha = 1 - (this.comboTimer / this.comboDecayTime) * 0.5;
        const glitchOffset = Math.random() * 2 - 1;
        const time = Date.now() * 0.001;
        
        // 使用原始的固定位置
        ctx.globalAlpha = comboAlpha;
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ffff';
        ctx.fillText(`[${this.combo}] COMBO!`, this.game.canvas.width / 2, 100);
        ctx.restore();
    }
    
    // 故障文字效果
    renderGlitchText(ctx, text, x, y, color, alpha) {
        ctx.save();
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.textAlign = 'center';
        
        // 故障層
        for (let i = 0; i < 3; i++) {
            ctx.globalAlpha = alpha * (0.5 - i * 0.1);
            ctx.fillStyle = i === 0 ? color : (i === 1 ? '#ffffff' : '#000000');
            
            const glitchX = x + (Math.random() - 0.5) * 4;
            const glitchY = y + (Math.random() - 0.5) * 2;
            
            ctx.fillText(text, glitchX, glitchY);
        }
        
        // 掃描線
        if (Math.random() < 0.5) {
            ctx.globalAlpha = alpha * 0.3;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - 100, y);
            ctx.lineTo(x + 100, y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    // 工具方法：角度插值
    lerpAngle(from, to, t) {
        let diff = to - from;
        
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        
        return from + diff * t;
    }
    
    // 工具方法：調整顏色透明度
    adjustAlpha(color, alpha) {
        // 處理 HSL 顏色
        if (color.startsWith('hsl(')) {
            const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            if (hslMatch) {
                const [, h, s, l] = hslMatch;
                return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
            }
        }
        
        // 處理 hex 顏色
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            
            // 檢查是否有效
            if (isNaN(r) || isNaN(g) || isNaN(b)) {
                return `rgba(255, 255, 255, ${alpha})`; // 回退到白色
            }
            
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        
        // 回退情況
        return `rgba(255, 255, 255, ${alpha})`;
    }
    
    // === 方向性攻擊方法 ===
    
    // 基礎方向性攻擊
    fireBasicDirectional(pattern, angle) {
        const upgradeEffects = this.base.game.upgradeSystem ? this.base.game.upgradeSystem.getEffects() : {};
        const damageMultiplier = upgradeEffects.damageMultiplier || 1.0;
        
        // 計算散射彈數（和基地攻擊使用相同邏輯）
        const multiplier = upgradeEffects.rangeMultiplier || 1;
        let projectileCount = 1;
        if (multiplier >= 6.0) {
            projectileCount = 5; // 4層升級 = 5發
        } else if (multiplier >= 4.5) {
            projectileCount = 4; // 3層升級 = 4發
        } else if (multiplier >= 3.0) {
            projectileCount = 3; // 2層升級 = 3發
        } else if (multiplier >= 1.5) {
            projectileCount = 2; // 1層升級 = 2發
        }
        
        // 計算從貓咪邊緣發射的位置
        const fireDistance = this.base.radius * 0.8;
        const fireX = this.base.x + Math.cos(angle) * fireDistance;
        const fireY = this.base.y + Math.sin(angle) * fireDistance;
        
        // 檢查角度和位置
        const dx = this.game.gameState.mouseX - this.base.x;
        const dy = this.game.gameState.mouseY - this.base.y;
        const actualAngle = Math.atan2(dy, dx);
        
        // 將角度轉換為時鐘方向（0度是3點鐘，90度是6點鐘）
        let clockAngle = angle * 180 / Math.PI;
        // 轉換為時鐘方向：3點鐘是0度，6點鐘是90度，9點鐘是180度，12點鐘是-90度
        if (clockAngle < 0) clockAngle += 360;
        
        
        // 智能追蹤：搜索瞄準方向附近的敵機
        const isMobile = window.mobileControls && window.mobileControls.isEnabled;
        const trackingRange = isMobile ? Math.PI / 7.2 : Math.PI / 12; // 手機25°，PC15°
        const nearbyEnemy = this.findNearbyEnemy(angle, trackingRange);
        
        // 創建散射攻擊
        for (let i = 0; i < projectileCount; i++) {
            let targetAngle = angle;
            
            if (projectileCount > 1) {
                if (projectileCount % 2 === 1) {
                    // 奇數彈數：中心有一發，其他對稱分布
                    const centerIndex = Math.floor(projectileCount / 2);
                    if (i !== centerIndex) {
                        const spreadAngle = Math.PI / 8; // 22.5度範圍
                        const sideIndex = i < centerIndex ? i - centerIndex : i - centerIndex;
                        targetAngle = angle + sideIndex * (spreadAngle / Math.floor(projectileCount / 2));
                    }
                } else {
                    // 偶數彈數：對稱分布，無正中心
                    const spreadAngle = Math.PI / 8; // 22.5度範圍
                    const angleStep = spreadAngle / (projectileCount / 2);
                    const side = i < projectileCount / 2 ? -1 : 1;
                    const offset = (i % (projectileCount / 2) + 0.5) * angleStep;
                    targetAngle = angle + side * offset;
                }
            }
            
            // 對中心彈或主要彈幕應用追蹤
            if (nearbyEnemy && (projectileCount === 1 || i === Math.floor(projectileCount / 2))) {
                const enemyAngle = Math.atan2(nearbyEnemy.y - this.base.y, nearbyEnemy.x - this.base.x);
                const maxCorrection = isMobile ? Math.PI / 12 : Math.PI / 20; // 手機15°，PC9°
                const angleDiff = enemyAngle - targetAngle;
                
                // 標準化角度差
                let normalizedDiff = angleDiff;
                while (normalizedDiff > Math.PI) normalizedDiff -= 2 * Math.PI;
                while (normalizedDiff < -Math.PI) normalizedDiff += 2 * Math.PI;
                
                // 限制修正範圍
                const correction = Math.max(-maxCorrection, Math.min(maxCorrection, normalizedDiff));
                targetAngle += correction;
            }
            
            this.createBullet({
                x: fireX,
                y: fireY,
                angle: targetAngle,
                speed: pattern.speed,
                damage: pattern.damage * (1 + this.combo * 0.05) * damageMultiplier,
                size: pattern.size,
                color: pattern.color,
                glow: pattern.glow
            });
        }
    }
    
    // 散射方向性攻擊
    fireSpreadDirectional(pattern, angle) {
        const upgradeEffects = this.base.game.upgradeSystem ? this.base.game.upgradeSystem.getEffects() : {};
        const damageMultiplier = upgradeEffects.damageMultiplier || 1.0;
        
        // 升級增強散射效果：增加彈數和擴大角度
        const multiplier = upgradeEffects.rangeMultiplier || 1;
        let bulletCount = pattern.bulletCount;
        let spreadAngle = pattern.spreadAngle;
        
        if (multiplier >= 1.5) {
            // 升級時增加彈數和擴散角度
            const upgradeLevel = Math.min(Math.floor((multiplier - 0.5) / 1.5), 4);
            bulletCount = pattern.bulletCount + upgradeLevel * 2; // 每級增加2發
            spreadAngle = pattern.spreadAngle * (1 + upgradeLevel * 0.3); // 每級增加30%角度
        }
        
        // 從貓咪朝向目標方向的邊緣發射
        const fireDistance = this.base.radius * 0.7;
        const fireX = this.base.x + Math.cos(angle) * fireDistance;
        const fireY = this.base.y + Math.sin(angle) * fireDistance;
        
        for (let i = 0; i < bulletCount; i++) {
            const angleOffset = (i - bulletCount / 2) * (spreadAngle / bulletCount);
            const bulletAngle = angle + angleOffset;
            
            this.createBullet({
                x: fireX,
                y: fireY,
                angle: bulletAngle,
                speed: pattern.speed,
                damage: pattern.damage * (1 + this.combo * 0.05) * damageMultiplier,
                size: pattern.size,
                color: pattern.color,
                glow: pattern.glow,
                piercing: this.combo > 10
            });
        }
    }
    
    // 搜索指定方向附近的敵機（智能追蹤輔助）
    findNearbyEnemy(targetAngle, searchRange) {
        const activeEnemies = this.game.enemies.filter(enemy => enemy.active);
        if (activeEnemies.length === 0) return null;
        
        let bestEnemy = null;
        let bestScore = -1;
        
        for (const enemy of activeEnemies) {
            // 計算敵機相對於基地的角度
            const enemyAngle = Math.atan2(enemy.y - this.base.y, enemy.x - this.base.x);
            
            // 計算角度差
            let angleDiff = Math.abs(enemyAngle - targetAngle);
            while (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
            
            // 檢查是否在搜索範圍內
            if (angleDiff <= searchRange) {
                // 計算距離
                const dx = enemy.x - this.base.x;
                const dy = enemy.y - this.base.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 綜合評分：角度越小、距離越近分數越高
                const angleScore = (searchRange - angleDiff) / searchRange;
                const distanceScore = Math.max(0, 1 - distance / 800); // 800px為參考距離
                const totalScore = angleScore * 0.7 + distanceScore * 0.3;
                
                if (totalScore > bestScore) {
                    bestScore = totalScore;
                    bestEnemy = enemy;
                }
            }
        }
        
        return bestEnemy;
    }
    
    // 螺旋方向性攻擊
    fireSpiralDirectional(pattern, baseAngle) {
        const upgradeEffects = this.base.game.upgradeSystem ? this.base.game.upgradeSystem.getEffects() : {};
        const damageMultiplier = upgradeEffects.damageMultiplier || 1.0;
        
        // 升級增強螺旋效果：增加螺旋臂數量
        const multiplier = upgradeEffects.rangeMultiplier || 1;
        let spiralArms = 3; // 基礎3臂螺旋
        
        if (multiplier >= 1.5) {
            const upgradeLevel = Math.min(Math.floor((multiplier - 0.5) / 1.5), 4);
            spiralArms = 3 + upgradeLevel; // 每級增加1臂
        }
        
        // 在基礎角度周圍創建螺旋
        const spiralOffset = this.spiralAngle * pattern.spiralSpeed;
        this.spiralAngle += 0.2;
        
        for (let i = 0; i < spiralArms; i++) {
            const angle = baseAngle + spiralOffset + (i * Math.PI * 2 / spiralArms);
            
            // 從貓咪周圍不同位置發射
            const fireDistance = this.base.radius * 0.6;
            const fireX = this.base.x + Math.cos(angle) * fireDistance;
            const fireY = this.base.y + Math.sin(angle) * fireDistance;
            
            this.createBullet({
                x: fireX,
                y: fireY,
                angle: angle,
                speed: pattern.speed,
                damage: pattern.damage * (1 + this.combo * 0.05) * damageMultiplier,
                size: pattern.size,
                color: pattern.color,
                glow: pattern.glow
            });
        }
    }
    
    // 環形方向性攻擊 - 以滑鼠方向為主要方向的增強攻擊
    fireRingDirectional(pattern, baseAngle) {
        const upgradeEffects = this.base.game.upgradeSystem ? this.base.game.upgradeSystem.getEffects() : {};
        const damageMultiplier = upgradeEffects.damageMultiplier || 1.0;
        
        // 升級增強環形攻擊：增加主攻擊和環形彈數
        const multiplier = upgradeEffects.rangeMultiplier || 1;
        let mainBullets = 5;
        let ringBullets = pattern.bulletCount;
        
        if (multiplier >= 1.5) {
            const upgradeLevel = Math.min(Math.floor((multiplier - 0.5) / 1.5), 4);
            mainBullets = 5 + upgradeLevel * 2; // 每級主攻擊增加2發
            ringBullets = pattern.bulletCount + upgradeLevel * 4; // 每級環形增加4發
        }
        
        // 主要攻擊：朝滑鼠方向的強化彈幕
        for (let i = 0; i < mainBullets; i++) {
            const angle = baseAngle + (i - mainBullets/2) * 0.08; // 主方向的密集攻擊
            const fireDistance = this.base.radius * 0.8;
            const fireX = this.base.x + Math.cos(angle) * fireDistance;
            const fireY = this.base.y + Math.sin(angle) * fireDistance;
            
            this.createBullet({
                x: fireX,
                y: fireY,
                angle: angle,
                speed: pattern.speed + i * 15,
                damage: pattern.damage * (1 + this.combo * 0.1) * damageMultiplier,
                size: pattern.size + Math.sin(Date.now() * 0.01 + i) * 1,
                color: pattern.color,
                glow: pattern.glow,
                piercing: true
            });
        }
        
        // 輔助攻擊：360度環形攻擊（威力較小）
        for (let i = 0; i < ringBullets; i++) {
            const angle = (Math.PI * 2 / ringBullets) * i;
            const fireDistance = this.base.radius * 0.9;
            const fireX = this.base.x + Math.cos(angle) * fireDistance;
            const fireY = this.base.y + Math.sin(angle) * fireDistance;
            
            this.createBullet({
                x: fireX,
                y: fireY,
                angle: angle,
                speed: pattern.speed * 0.7,
                damage: pattern.damage * 0.5 * (1 + this.combo * 0.1) * damageMultiplier,
                size: pattern.size * 0.8,
                color: pattern.color,
                glow: pattern.glow
            });
        }
    }
    
    // 渲染能量條（與經驗條統一設計）
    renderEnergyBar(ctx) {
        ctx.save();
        
        // 使用與經驗條相同的尺寸和位置邏輯（底部中央位置）
        const barWidth = 180;
        const barHeight = 6;
        const barX = ctx.canvas.width / 2 - 90; // 底部中央位置
        
        // 考慮手機安全區域
        const game = window.currentGame;
        const isMobilePortrait = game?.isPortraitMode || false;
        const baseY = isMobilePortrait ? 
            ctx.canvas.height - 120 : // 手機豎屏模式留更多空間
            ctx.canvas.height - 80;   // 桌面模式
        const barY = baseY + 20; // 在經驗條下方，縮短間距
        
        const energyPercent = this.energyBar.current / this.energyBar.max;
        
        // 根據能量等級變色（統一風格）
        let barColor = '#00ff88'; // 綠色
        if (energyPercent > 0.6) barColor = '#ffff00'; // 黃色  
        if (energyPercent > 0.8) barColor = '#ff6600'; // 橙色
        if (energyPercent >= 1.0) barColor = '#ff00ff'; // 滿能量時紫色
        
        // 背景（與經驗條一致）
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 能量條填充（與經驗條一致的風格）
        if (energyPercent > 0) {
            ctx.fillStyle = barColor;
            ctx.shadowBlur = 5;
            ctx.shadowColor = barColor;
            ctx.fillRect(barX, barY, barWidth * energyPercent, barHeight);
        }
        
        // 能量條邊框（與經驗條一致）
        ctx.strokeStyle = barColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // 移除圖標，保持簡潔
        
        // 簡化顯示：數值/總數 ENG
        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 3;
        ctx.fillText(
            `${Math.floor(this.energyBar.current)}/${this.energyBar.max} ENG`,
            barX + barWidth + 8, barY + 4
        );
        
        // 滿能量時的簡單脈衝效果（減少性能影響）
        if (energyPercent >= 1.0 && Math.random() < 0.1) {
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = barColor;
            ctx.fillRect(barX, barY - 1, barWidth, barHeight + 2);
        }
        
        ctx.restore();
    }
    
    // 渲染能量圖標（向量設計）
    renderEnergyIcon(ctx, x, y) {
        ctx.save();
        
        ctx.translate(x, y);
        const size = 8;
        
        // 能量條的六角形圖標（小尺寸）
        ctx.strokeStyle = '#00ff88';
        ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = Math.cos(angle) * size;
            const py = Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 內部閃電符號
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-3, -3);
        ctx.lineTo(1, -1);
        ctx.lineTo(-1, 1);
        ctx.lineTo(3, 3);
        ctx.stroke();
        
        ctx.restore();
    }
}

// 導出類
window.BulletSystem = BulletSystem;