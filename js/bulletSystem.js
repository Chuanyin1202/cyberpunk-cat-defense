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
                damage: 10,         // 傷害
                size: 4,            // 彈幕大小 - 縮小
                color: '#00ffff',   // 電子藍
                glow: true          // 發光效果
            },
            spread: {
                fireRate: 300,
                speed: 400,
                damage: 8,
                size: 3,            // 縮小
                color: '#ff00ff',   // 霓虹粉
                glow: true,
                spreadAngle: Math.PI / 6,  // 扇形角度
                bulletCount: 5             // 每次發射數量
            },
            spiral: {
                fireRate: 50,
                speed: 350,
                damage: 5,
                size: 2,            // 縮小
                color: '#00ff88',   // 數位綠
                glow: true,
                spiralSpeed: 5     // 螺旋速度
            },
            ring: {
                fireRate: 800,
                speed: 300,
                damage: 15,
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
            current: 0,
            max: 100,               // 能量條最大值（簡化為100）
            damagePerPoint: 0.5,    // 每點傷害累積多少能量（降低50%）
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
        if (!this.game.gameState.mouseX || !this.game.gameState.mouseY) {
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
            }, i * 50);
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
        const bullet = {
            x: config.x,
            y: config.y,
            vx: Math.cos(config.angle) * config.speed,
            vy: Math.sin(config.angle) * config.speed,
            damage: config.damage,
            size: config.size,
            color: config.color,
            glow: config.glow,
            active: true,
            trail: [],
            lifetime: 0,
            
            // 特殊屬性
            homing: config.homing || false,
            target: config.target || null,
            piercing: config.piercing || false,
            spiral: config.spiral || false,
            wave: config.wave || false,
            hitEnemies: new Set()
        };
        
        this.bullets.push(bullet);
        
        // 發射特效
        this.createMuzzleFlash(config.x, config.y, config.color);
    }
    
    // 恢復完整的彈幕更新（但簡化批次處理）
    updateBullets(deltaTime) {
        this.updateCounter = (this.updateCounter || 0) + 1;
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            if (!bullet.active) {
                this.bullets.splice(i, 1);
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
            
            // 恢復正常軌跡更新
            bullet.trail.push({ x: bullet.x, y: bullet.y, life: 1.0 });
            bullet.trail.forEach(point => {
                point.life -= deltaTime * 4;
            });
            bullet.trail = bullet.trail.filter(point => point.life > 0);
            if (bullet.trail.length > 8) { // 恢復軌跡長度
                bullet.trail.shift();
            }
            
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
    
    // 累積傷害到能量條
    addDamageToEnergy(damage) {
        this.energyBar.current = Math.min(
            this.energyBar.max, 
            this.energyBar.current + damage * this.energyBar.damagePerPoint
        );
        this.energyBar.lastDamageTime = Date.now();
    }
    
    // 觸發能量攻擊
    triggerEnergyAttack() {
        if (this.specialAttackCooldown > 0) return;
        
        // 重置能量條
        this.energyBar.current = 0;
        this.specialAttackCooldown = 500; // 短冷卻，因為是自動觸發
        
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
    
    // 特殊攻擊 - 點擊位置（已棄用，改為能量觸發）
    fireSpecialAttack(x, y) {
        // 現在點擊不再直接觸發特殊攻擊，改為加強普通攻擊
        console.log('點擊攻擊已改為能量條自動觸發系統');
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
                        homing: patternIndex === 0 // 第一波有追蹤能力
                    });
                }
            }, pattern.delay);
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
    
    // 能量波特效
    createEnergyWaveEffect(x, y) {
        // 進一步縮小的能量波特效
        for (let wave = 0; wave < 2; wave++) {  // 減少到2個波
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
            }, wave * 30);
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
                // 高品質模式：先渲染軌跡，再渲染子彈
                batchRenderer.startBatch('bullet_trails', (ctx) => {
                    ctx.globalCompositeOperation = 'screen';
                });
                
                for (const bullet of activeBullets) {
                    if (bullet.trail.length > 1) {
                        batchRenderer.addToBatch({
                            render: (ctx) => this.renderCyberpunkTrail(ctx, bullet)
                        });
                    }
                }
                batchRenderer.finishBatch(ctx);
                
                // 渲染子彈主體
                batchRenderer.startBatch('bullet_bodies', (ctx) => {
                    ctx.globalCompositeOperation = 'screen';
                });
                
                for (const bullet of activeBullets) {
                    batchRenderer.addToBatch({
                        render: (ctx) => this.renderCyberpunkBullet(ctx, bullet)
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
                    this.renderCyberpunkTrail(ctx, bullet);
                    this.renderCyberpunkBullet(ctx, bullet);
                }
            }
        }
        
        ctx.restore();
        
        // 恢復連擊數渲染
        if (this.combo > 0) {
            this.renderCyberpunkCombo(ctx);
        }
        
        // 渲染能量條
        this.renderEnergyBar(ctx);
    }
    
    // 恢復完整的軌跡渲染效果
    renderCyberpunkTrail(ctx, bullet) {
        if (bullet.trail.length < 2) return;
        
        ctx.save();
        
        // 恢復多層光束效果（但減少層數）
        for (let i = 0; i < bullet.trail.length - 1; i++) {
            const point = bullet.trail[i];
            const nextPoint = bullet.trail[i + 1];
            
            // 恢復多層效果（偳2層）
            for (let layer = 0; layer < 2; layer++) {
                ctx.globalAlpha = point.life * (0.4 - layer * 0.1);
                ctx.strokeStyle = layer === 0 ? '#ffffff' : bullet.color;
                ctx.lineWidth = (bullet.size * 0.6) * (1 + layer * 0.3);
                ctx.lineCap = 'round';
                
                // 偶爾故障效果
                if (Math.random() < 0.08) {
                    ctx.setLineDash([3, 2]);
                }
                
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(nextPoint.x, nextPoint.y);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
        
        // 恢復數據流效果（但簡化）
        if (bullet.trail.length > 3) {
            ctx.globalAlpha = 0.3;
            ctx.strokeStyle = bullet.color;
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 3]);
            
            ctx.beginPath();
            bullet.trail.forEach((point, i) => {
                if (i === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    }
    
    // 恢復完整的賽博龐克彈幕渲染
    renderCyberpunkBullet(ctx, bullet) {
        ctx.save();
        
        const time = Date.now() * 0.001;
        const pulse = 1 + Math.sin(time * 10 + bullet.x * 0.01) * 0.1;
        
        // 恢復多層霓虹光暈
        if (bullet.glow) {
            const glowSize = bullet.size * 3; // 稍微縮小但保持效果
            
            // 外層光暈
            const outerGradient = ctx.createRadialGradient(
                bullet.x, bullet.y, 0,
                bullet.x, bullet.y, glowSize * pulse
            );
            outerGradient.addColorStop(0, this.adjustAlpha(bullet.color, 0.8));
            outerGradient.addColorStop(0.3, this.adjustAlpha(bullet.color, 0.4));
            outerGradient.addColorStop(0.7, this.adjustAlpha(bullet.color, 0.1));
            outerGradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = outerGradient;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, glowSize * pulse, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 能量核心圓形
        ctx.globalAlpha = 1;
        ctx.fillStyle = bullet.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size * pulse, 0, Math.PI * 2);
        ctx.fill();
        
        // 內部高光
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.9;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(
            bullet.x - bullet.size * 0.3,
            bullet.y - bullet.size * 0.3,
            bullet.size * 0.4,
            0, Math.PI * 2
        );
        ctx.fill();
        
        // 恢復數位環效果
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = this.adjustAlpha(bullet.color, 0.8);
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size * 1.5 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 恢復掃描線效果
        if (Math.random() < 0.15) {
            ctx.globalAlpha = 0.6;
            ctx.strokeStyle = bullet.color;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(bullet.x - bullet.size * 2, bullet.y);
            ctx.lineTo(bullet.x + bullet.size * 2, bullet.y);
            ctx.stroke();
        }
        
        ctx.restore();
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
        
        const comboAlpha = 1 - (this.comboTimer / this.comboDecayTime) * 0.5;
        const glitchOffset = Math.random() * 2 - 1;
        const time = Date.now() * 0.001;
        
        // 背景數據流
        ctx.globalAlpha = comboAlpha * 0.3;
        ctx.font = '12px "Courier New", monospace';
        ctx.fillStyle = '#00ff88';
        const dataText = '01101011 ' + this.combo.toString(2).padStart(8, '0');
        ctx.fillText(dataText, this.game.canvas.width / 2, 80);
        
        // 主連擊顯示 - 故障效果
        ctx.globalAlpha = comboAlpha;
        
        // 陰影層
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.textAlign = 'center';
        
        // 多層故障效果
        const colors = ['#ff00ff', '#00ffff', '#ffff00'];
        colors.forEach((color, i) => {
            ctx.globalAlpha = comboAlpha * (1 - i * 0.2);
            ctx.fillStyle = color;
            ctx.shadowBlur = 20;
            ctx.shadowColor = color;
            
            const offsetX = glitchOffset * (i + 1) * 2;
            const offsetY = 100 + Math.sin(time * 10 + i) * 5;
            
            ctx.fillText(
                `[${this.combo}] COMBO!`, 
                this.game.canvas.width / 2 + offsetX, 
                offsetY
            );
        });
        
        // 移除數位框架（虛線框）
        
        // 連擊等級 - 賽博龐克風格
        if (this.combo >= 30) {
            this.renderGlitchText(ctx, 'CYBER OVERDRIVE', this.game.canvas.width / 2, 140, '#ff00ff', comboAlpha);
        } else if (this.combo >= 15) {
            this.renderGlitchText(ctx, 'NEON SURGE', this.game.canvas.width / 2, 140, '#00ffff', comboAlpha);
        } else if (this.combo >= 5) {
            this.renderGlitchText(ctx, 'DIGITAL FLOW', this.game.canvas.width / 2, 140, '#00ff88', comboAlpha);
        }
        
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
        // 簡單的 hex 顏色轉 rgba
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // === 方向性攻擊方法 ===
    
    // 基礎方向性攻擊
    fireBasicDirectional(pattern, angle) {
        const upgradeEffects = this.base.game.upgradeSystem ? this.base.game.upgradeSystem.getEffects() : {};
        const damageMultiplier = upgradeEffects.damageMultiplier || 1.0;
        
        // 計算從貓咪邊緣發射的位置
        const fireDistance = this.base.radius * 0.8;
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
    
    // 散射方向性攻擊
    fireSpreadDirectional(pattern, angle) {
        const upgradeEffects = this.base.game.upgradeSystem ? this.base.game.upgradeSystem.getEffects() : {};
        const damageMultiplier = upgradeEffects.damageMultiplier || 1.0;
        
        // 從貓咪朝向目標方向的邊緣發射
        const fireDistance = this.base.radius * 0.7;
        const fireX = this.base.x + Math.cos(angle) * fireDistance;
        const fireY = this.base.y + Math.sin(angle) * fireDistance;
        
        for (let i = 0; i < pattern.bulletCount; i++) {
            const spreadAngle = angle + (i - pattern.bulletCount / 2) * (pattern.spreadAngle / pattern.bulletCount);
            
            this.createBullet({
                x: fireX,
                y: fireY,
                angle: spreadAngle,
                speed: pattern.speed,
                damage: pattern.damage * (1 + this.combo * 0.05) * damageMultiplier,
                size: pattern.size,
                color: pattern.color,
                glow: pattern.glow,
                piercing: this.combo > 10
            });
        }
    }
    
    // 螺旋方向性攻擊
    fireSpiralDirectional(pattern, baseAngle) {
        const upgradeEffects = this.base.game.upgradeSystem ? this.base.game.upgradeSystem.getEffects() : {};
        const damageMultiplier = upgradeEffects.damageMultiplier || 1.0;
        
        // 在基礎角度周圍創建螺旋
        const spiralOffset = this.spiralAngle * pattern.spiralSpeed;
        this.spiralAngle += 0.2;
        
        for (let i = 0; i < 3; i++) {
            const angle = baseAngle + spiralOffset + (i * Math.PI * 2 / 3);
            
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
        
        // 主要攻擊：朝滑鼠方向的強化彈幕
        for (let i = 0; i < 5; i++) {
            const angle = baseAngle + (i - 2) * 0.1; // 主方向的密集攻擊
            const fireDistance = this.base.radius * 0.8;
            const fireX = this.base.x + Math.cos(angle) * fireDistance;
            const fireY = this.base.y + Math.sin(angle) * fireDistance;
            
            this.createBullet({
                x: fireX,
                y: fireY,
                angle: angle,
                speed: pattern.speed + i * 20,
                damage: pattern.damage * (1 + this.combo * 0.1) * damageMultiplier,
                size: pattern.size + Math.sin(Date.now() * 0.01 + i) * 1,
                color: pattern.color,
                glow: pattern.glow,
                piercing: true
            });
        }
        
        // 輔助攻擊：360度環形攻擊（威力較小）
        for (let i = 0; i < pattern.bulletCount; i++) {
            const angle = (Math.PI * 2 / pattern.bulletCount) * i;
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
        const barY = ctx.canvas.height - 80 + 20; // 在經驗條下方，縮短間距
        
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