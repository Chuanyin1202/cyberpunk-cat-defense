// 升級系統核心 - 管理所有升級邏輯和效果應用
// 整合經驗值、升級選擇和效果系統

class UpgradeSystem {
    constructor(game) {
        this.game = game;
        
        // 子系統
        this.experienceSystem = new ExperienceSystem();
        this.upgradeUI = new UpgradeUI(game);
        
        // 玩家升級狀態
        this.playerUpgrades = {
            weapons: [],        // 已獲得的武器升級
            abilities: {},      // 能力升級和疊加數
            survival: {},       // 生存升級狀態
            activeEffects: []   // 當前生效的效果
        };
        
        // 升級效果緩存
        this.cachedEffects = {
            damageMultiplier: 1.0,
            fireRateMultiplier: 1.0,
            rangeMultiplier: 1.0,
            maxHealthMultiplier: 1.0,
            criticalChance: 0.0,
            criticalMultiplier: 2.0,
            lifeStealPercent: 0.0
        };
        
        // 特殊武器系統
        this.specialWeapons = [];
        this.weaponCooldowns = {};
        
        // 狀態追蹤
        this.pendingUpgrade = false;
        this.upgradeCallback = null;
        
        console.log('升級系統初始化完成');
    }
    
    // 波次完成觸發升級選擇
    triggerUpgradeChoice(waveNumber) {
        if (this.pendingUpgrade) {
            console.log('升級已在進行中，跳過觸發');
            return;
        }
        
        console.log(`🎯 觸發升級選擇 - 波次 ${waveNumber}`);
        this.pendingUpgrade = true;
        
        // 獲得波次經驗值
        this.experienceSystem.completeWave(waveNumber);
        console.log(`經驗值更新後 - 等級: ${this.experienceSystem.level}, 經驗: ${this.experienceSystem.experience}`);
        
        // 獲取可用升級選項
        const playerLevel = this.experienceSystem.level;
        const playerQuality = this.experienceSystem.getCurrentQuality();
        const existingUpgrades = this.getAllUpgrades();
        
        console.log(`玩家狀態 - 等級: ${playerLevel}, 品質: ${playerQuality}, 已有升級: ${existingUpgrades.length}`);
        
        const upgradeChoices = UpgradeDefinitions.getRandomUpgradeChoices(
            playerLevel, 
            playerQuality, 
            existingUpgrades
        );
        
        console.log(`獲得升級選項: ${upgradeChoices.length} 個`);
        upgradeChoices.forEach((choice, index) => {
            console.log(`選項 ${index + 1}: ${choice.name} (${choice.category})`);
        });
        
        if (upgradeChoices.length === 0) {
            console.error('❌ 沒有可用的升級選項！');
            this.pendingUpgrade = false;
            if (this.upgradeCallback) {
                this.upgradeCallback();
                this.upgradeCallback = null;
            }
            return;
        }
        
        // 顯示升級UI
        console.log('📋 顯示升級UI');
        this.upgradeUI.show(upgradeChoices, (selectedUpgrade) => {
            console.log(`✅ 選擇了升級: ${selectedUpgrade.name}`);
            this.applyUpgrade(selectedUpgrade);
            this.pendingUpgrade = false;
            
            // 繼續遊戲
            if (this.upgradeCallback) {
                this.upgradeCallback();
                this.upgradeCallback = null;
            }
        });
    }
    
    // 設置升級完成回調
    setUpgradeCallback(callback) {
        this.upgradeCallback = callback;
    }
    
    // 敵人死亡獲得經驗值
    onEnemyKilled(enemyType) {
        this.experienceSystem.killEnemy(enemyType);
    }
    
    // 應用選中的升級
    applyUpgrade(upgrade) {
        console.log(`應用升級: ${upgrade.name}`);
        
        switch (upgrade.category) {
            case 'weapon':
                this.applyWeaponUpgrade(upgrade);
                break;
            case 'ability':
                this.applyAbilityUpgrade(upgrade);
                break;
            case 'survival':
                this.applySurvivalUpgrade(upgrade);
                break;
        }
        
        // 重新計算效果
        this.recalculateEffects();
        
        // 創建升級特效
        this.createUpgradeEffect(upgrade);
    }
    
    // 應用武器升級
    applyWeaponUpgrade(upgrade) {
        // 檢查是否已經擁有此武器
        const existingIndex = this.playerUpgrades.weapons.findIndex(w => w.id === upgrade.id);
        
        if (existingIndex >= 0) {
            // 升級現有武器
            const currentLevel = this.playerUpgrades.weapons[existingIndex].level || 1;
            const maxLevel = upgrade.maxLevel || (upgrade.levelEffects ? upgrade.levelEffects.length : 3);
            const newLevel = Math.min(currentLevel + 1, maxLevel);
            
            this.playerUpgrades.weapons[existingIndex].level = newLevel;
            
            // 更新武器數據到新等級
            if (upgrade.levelEffects && upgrade.levelEffects[newLevel - 1]) {
                const levelData = upgrade.levelEffects[newLevel - 1];
                this.playerUpgrades.weapons[existingIndex].currentEffect = levelData.newWeapon;
                console.log(`${upgrade.name} 升級到等級 ${newLevel}: ${levelData.description}`);
            }
        } else {
            // 添加新武器
            const weaponData = {
                id: upgrade.id,
                level: 1,
                data: upgrade,
                currentEffect: upgrade.levelEffects ? upgrade.levelEffects[0].newWeapon : upgrade.effects.newWeapon
            };
            this.playerUpgrades.weapons.push(weaponData);
            console.log(`獲得新武器: ${upgrade.name}`);
        }
        
        // 初始化或更新特殊武器
        this.initializeSpecialWeapon(upgrade);
    }
    
    // 應用能力升級
    applyAbilityUpgrade(upgrade) {
        const upgradeId = upgrade.id;
        
        if (upgrade.stackable) {
            // 可疊加升級
            if (!this.playerUpgrades.abilities[upgradeId]) {
                this.playerUpgrades.abilities[upgradeId] = {
                    stacks: 1,
                    data: upgrade
                };
            } else {
                const maxStacks = upgrade.maxStacks || 999;
                const currentStacks = this.playerUpgrades.abilities[upgradeId].stacks;
                if (currentStacks < maxStacks) {
                    this.playerUpgrades.abilities[upgradeId].stacks++;
                }
            }
        } else {
            // 不可疊加升級
            this.playerUpgrades.abilities[upgradeId] = {
                stacks: 1,
                data: upgrade
            };
        }
    }
    
    // 應用生存升級
    applySurvivalUpgrade(upgrade) {
        const upgradeId = upgrade.id;
        
        // 立即效果處理
        if (upgrade.effects.immediateHeal) {
            const healAmount = this.game.gameState.lives * upgrade.effects.immediateHeal;
            const maxHealth = this.getMaxHealth();
            this.game.gameState.lives = Math.min(maxHealth, this.game.gameState.lives + healAmount);
            
            // 創建治療特效
            this.createHealEffect(healAmount);
        }
        
        if (upgrade.stackable) {
            // 可疊加生存升級
            if (!this.playerUpgrades.survival[upgradeId]) {
                this.playerUpgrades.survival[upgradeId] = {
                    stacks: 1,
                    data: upgrade
                };
            } else {
                const maxStacks = upgrade.maxStacks || 999;
                const currentStacks = this.playerUpgrades.survival[upgradeId].stacks;
                if (currentStacks < maxStacks) {
                    this.playerUpgrades.survival[upgradeId].stacks++;
                }
            }
        } else {
            // 不可疊加生存升級
            this.playerUpgrades.survival[upgradeId] = {
                stacks: 1,
                data: upgrade
            };
        }
    }
    
    // 初始化特殊武器
    initializeSpecialWeapon(upgrade) {
        // 獲取當前武器的數據
        const weaponInfo = this.playerUpgrades.weapons.find(w => w.id === upgrade.id);
        let weaponData;
        
        if (weaponInfo && weaponInfo.currentEffect) {
            weaponData = weaponInfo.currentEffect;
        } else if (upgrade.levelEffects && upgrade.levelEffects[0]) {
            weaponData = upgrade.levelEffects[0].newWeapon;
        } else {
            weaponData = upgrade.effects.newWeapon;
        }
        
        if (!weaponData) return;
        
        const specialWeapon = {
            id: upgrade.id,
            type: upgrade.id,
            lastFired: 0,
            data: weaponData,
            upgrade: upgrade,
            level: weaponInfo ? weaponInfo.level : 1
        };
        
        // 檢查是否已存在
        const existingIndex = this.specialWeapons.findIndex(w => w.id === upgrade.id);
        if (existingIndex >= 0) {
            this.specialWeapons[existingIndex] = specialWeapon;
        } else {
            this.specialWeapons.push(specialWeapon);
        }
        
        this.weaponCooldowns[upgrade.id] = 0;
    }
    
    // 重新計算所有效果
    recalculateEffects() {
        // 重置為基礎值
        this.cachedEffects = {
            damageMultiplier: 1.0,
            fireRateMultiplier: 1.0,
            rangeMultiplier: 1.0,
            maxHealthMultiplier: 1.0,
            criticalChance: 0.0,
            criticalMultiplier: 2.0,
            lifeStealPercent: 0.0
        };
        
        // 計算能力升級效果
        for (const [upgradeId, upgradeInfo] of Object.entries(this.playerUpgrades.abilities)) {
            const upgrade = upgradeInfo.data;
            const stacks = upgradeInfo.stacks;
            
            if (upgrade.effects.damageMultiplier) {
                // 疊加傷害加成：(1.2)^stacks
                this.cachedEffects.damageMultiplier *= Math.pow(upgrade.effects.damageMultiplier, stacks);
            }
            
            if (upgrade.effects.fireRateMultiplier) {
                // 疊加射速加成
                this.cachedEffects.fireRateMultiplier *= Math.pow(upgrade.effects.fireRateMultiplier, stacks);
            }
            
            if (upgrade.effects.rangeMultiplier) {
                this.cachedEffects.rangeMultiplier *= Math.pow(upgrade.effects.rangeMultiplier, stacks);
            }
            
            if (upgrade.effects.criticalChance) {
                this.cachedEffects.criticalChance += upgrade.effects.criticalChance * stacks;
            }
            
            if (upgrade.effects.criticalMultiplier) {
                this.cachedEffects.criticalMultiplier = Math.max(
                    this.cachedEffects.criticalMultiplier,
                    upgrade.effects.criticalMultiplier
                );
            }
        }
        
        // 計算生存升級效果
        for (const [upgradeId, upgradeInfo] of Object.entries(this.playerUpgrades.survival)) {
            const upgrade = upgradeInfo.data;
            const stacks = upgradeInfo.stacks;
            
            if (upgrade.effects.maxHealthMultiplier) {
                this.cachedEffects.maxHealthMultiplier *= Math.pow(upgrade.effects.maxHealthMultiplier, stacks);
            }
            
            if (upgrade.effects.lifeStealPercent) {
                this.cachedEffects.lifeStealPercent += upgrade.effects.lifeStealPercent * stacks;
            }
        }
        
        // 應用範圍效果到基地
        if (this.game && this.game.base) {
            this.game.base.attackRange = this.game.base.baseAttackRange * this.cachedEffects.rangeMultiplier;
        }
        
        // 限制數值範圍
        this.cachedEffects.criticalChance = Math.min(1.0, this.cachedEffects.criticalChance);
        this.cachedEffects.lifeStealPercent = Math.min(0.5, this.cachedEffects.lifeStealPercent);
        
        console.log('重新計算升級效果:', this.cachedEffects);
    }
    
    // 獲取所有升級列表
    getAllUpgrades() {
        const allUpgrades = [];
        
        // 武器升級
        for (const weapon of this.playerUpgrades.weapons) {
            allUpgrades.push({
                id: weapon.id,
                stacks: weapon.level || 1
            });
        }
        
        // 能力升級
        for (const [id, info] of Object.entries(this.playerUpgrades.abilities)) {
            allUpgrades.push({
                id: id,
                stacks: info.stacks
            });
        }
        
        // 生存升級
        for (const [id, info] of Object.entries(this.playerUpgrades.survival)) {
            allUpgrades.push({
                id: id,
                stacks: info.stacks
            });
        }
        
        return allUpgrades;
    }
    
    // 更新特殊武器系統
    updateSpecialWeapons(deltaTime) {
        const currentTime = Date.now();
        
        for (const weapon of this.specialWeapons) {
            const fireRate = weapon.data.fireRate || 1000;
            
            if (currentTime - weapon.lastFired >= fireRate) {
                this.fireSpecialWeapon(weapon);
                weapon.lastFired = currentTime;
            }
        }
        
        // 更新冷卻時間
        for (const weaponId in this.weaponCooldowns) {
            if (this.weaponCooldowns[weaponId] > 0) {
                this.weaponCooldowns[weaponId] -= deltaTime * 1000;
            }
        }
    }
    
    // 發射特殊武器
    fireSpecialWeapon(weapon) {
        const enemies = this.game.enemies.filter(e => e.active);
        if (enemies.length === 0) return;
        
        const baseX = this.game.base.x;
        const baseY = this.game.base.y;
        
        switch (weapon.type) {
            case 'electromagnetic_railgun':
                this.fireRailgun(weapon, baseX, baseY, enemies);
                break;
            case 'quantum_vortex':
                this.fireQuantumVortex(weapon, baseX, baseY, enemies);
                break;
            case 'crystal_shards':
                this.fireCrystalShards(weapon, baseX, baseY, enemies);
                break;
            case 'temporal_rift':
                this.fireTemporalRift(weapon, baseX, baseY, enemies);
                break;
            case 'ion_storm':
                this.fireIonStorm(weapon, baseX, baseY, enemies);
                break;
            case 'nano_tracker':
                this.fireNanoTracker(weapon, baseX, baseY, enemies);
                break;
        }
    }
    
    // 電磁軌道炮
    fireRailgun(weapon, x, y, enemies) {
        // 找到最遠的敵人
        let target = enemies[0];
        let maxDistance = 0;
        
        for (const enemy of enemies) {
            const distance = Math.sqrt(Math.pow(enemy.x - x, 2) + Math.pow(enemy.y - y, 2));
            if (distance > maxDistance) {
                maxDistance = distance;
                target = enemy;
            }
        }
        
        // 使用 BulletSystem 創建穿透彈
        const bulletSystem = this.game.base.bulletSystem;
        if (!bulletSystem) return;
        
        const angle = Math.atan2(target.y - y, target.x - x);
        const baseDamage = weapon.data.damage * this.cachedEffects.damageMultiplier;
        
        // 基礎軌道炮
        bulletSystem.createBullet({
            x: x,
            y: y,
            angle: angle,
            damage: baseDamage,
            speed: weapon.data.speed,
            color: weapon.data.color,
            size: 8,
            type: 'railgun',
            piercing: true,
            trail: 10
        });
        
        // 等級2+: 雙軌道炮
        if (weapon.data.dualRails) {
            const perpAngle = angle + Math.PI / 2;
            const spacing = weapon.data.railSpacing || 30;
            const offsetX = Math.cos(perpAngle) * spacing;
            const offsetY = Math.sin(perpAngle) * spacing;
            
            bulletSystem.createBullet({
                x: x + offsetX,
                y: y + offsetY,
                angle: angle,
                damage: baseDamage,
                speed: weapon.data.speed,
                color: weapon.data.color,
                size: 8,
                type: 'railgun',
                piercing: true,
                trail: 10
            });
        }
        
        // 等級3: 電磁場殘留
        if (weapon.data.magneticField) {
            const field = {
                x: target.x,
                y: target.y,
                radius: 60,
                damage: weapon.data.fieldDamage,
                duration: weapon.data.fieldDuration,
                createdTime: Date.now(),
                color: '#00ffff',
                type: 'magnetic_field'
            };
            
            if (!this.game.specialEffects) {
                this.game.specialEffects = [];
            }
            this.game.specialEffects.push(field);
        }
        
        // 軌道炮特效
        this.createRailgunEffect(x, y, target.x, target.y);
    }
    
    // 量子漩渦
    fireQuantumVortex(weapon, x, y, enemies) {
        // 找到敵人最密集的區域
        const vortexX = x + (Math.random() - 0.5) * 200;
        const vortexY = y + (Math.random() - 0.5) * 200;
        
        // 創建漩渦效果
        const vortex = {
            x: vortexX,
            y: vortexY,
            radius: weapon.data.radius,
            damage: weapon.data.damage * this.cachedEffects.damageMultiplier,
            pullForce: weapon.data.pullForce,
            duration: weapon.data.duration,
            tickRate: weapon.data.tickRate,
            slowEffect: weapon.data.slowEffect,
            lastTick: Date.now(),
            createdTime: Date.now(),
            color: weapon.data.color,
            type: 'vortex'
        };
        
        // 添加到特殊效果列表
        if (!this.game.specialEffects) {
            this.game.specialEffects = [];
        }
        this.game.specialEffects.push(vortex);
        
        // 等級3: 雙重漩渦
        if (weapon.data.dualVortex) {
            const spacing = weapon.data.vortexSpacing || 150;
            const secondVortex = {
                ...vortex,
                x: x + (Math.random() - 0.5) * 200 + spacing,
                y: y + (Math.random() - 0.5) * 200,
                createdTime: Date.now(),
                lastTick: Date.now()
            };
            this.game.specialEffects.push(secondVortex);
            this.createVortexEffect(secondVortex.x, secondVortex.y);
        }
        
        this.createVortexEffect(vortexX, vortexY);
    }
    
    // 水晶碎片
    fireCrystalShards(weapon, x, y, enemies) {
        if (enemies.length === 0) return;
        
        const target = enemies[0];
        const baseAngle = Math.atan2(target.y - y, target.x - x);
        
        // 使用 BulletSystem 來創建水晶碎片
        const bulletSystem = this.game.base.bulletSystem;
        if (!bulletSystem) return;
        
        for (let i = 0; i < weapon.data.shardCount; i++) {
            const spread = weapon.data.spreadAngle;
            const angle = baseAngle + (i - weapon.data.shardCount / 2) * (spread / weapon.data.shardCount);
            
            // 使用 BulletSystem 的 createBullet 方法
            bulletSystem.createBullet({
                x: x,
                y: y,
                angle: angle,
                damage: weapon.data.damage * this.cachedEffects.damageMultiplier,
                speed: weapon.data.speed,
                color: weapon.data.color,
                size: 6,
                type: 'crystal',
                piercing: false,
                trail: 5
            });
        }
        
        this.createCrystalEffect(x, y);
    }
    
    // 納米追蹤
    fireNanoTracker(weapon, x, y, enemies) {
        // 等級3: 多目標模式
        const targetCount = weapon.data.multiTarget ? Math.min(weapon.data.targetCount || 3, enemies.length) : 1;
        const targets = [];
        
        // 按血量排序選擇目標
        const sortedEnemies = [...enemies].sort((a, b) => b.health - a.health);
        for (let i = 0; i < targetCount; i++) {
            if (sortedEnemies[i]) {
                targets.push(sortedEnemies[i]);
            }
        }
        
        // 為每個目標創建導彈
        for (const target of targets) {
            const projectile = {
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                damage: weapon.data.damage * this.cachedEffects.damageMultiplier,
                color: weapon.data.color,
                size: 8,
                type: 'homing_missile',
                target: target,
                speed: weapon.data.speed,
                lockStrength: weapon.data.lockStrength,
                active: true,
                trail: [],
                
                // 等級2: 分裂彈頭
                splitOnHit: weapon.data.splitOnHit,
                splitCount: weapon.data.splitCount,
                splitDamage: weapon.data.splitDamage,
                
                // 等級3: 爆炸半徑
                explosiveRadius: weapon.data.explosiveRadius,
                
                // 添加render方法
                render: function(ctx) {
                    if (!this.active) return;
                    
                    ctx.save();
                    
                    // 繪製軌跡
                    if (this.trail.length > 1) {
                        ctx.strokeStyle = this.color;
                        ctx.lineWidth = 3;
                        ctx.globalAlpha = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(this.trail[0].x, this.trail[0].y);
                        for (let i = 1; i < this.trail.length; i++) {
                            ctx.lineTo(this.trail[i].x, this.trail[i].y);
                        }
                        ctx.stroke();
                    }
                    
                    // 繪製導彈
                    ctx.fillStyle = this.color;
                    ctx.shadowBlur = 12;
                    ctx.shadowColor = this.color;
                    ctx.globalAlpha = 1;
                    
                    // 導彈形狀
                    ctx.translate(this.x, this.y);
                    const angle = Math.atan2(this.vy, this.vx);
                    ctx.rotate(angle);
                    
                    ctx.beginPath();
                    ctx.moveTo(this.size, 0);
                    ctx.lineTo(-this.size/2, -this.size/2);
                    ctx.lineTo(-this.size/2, this.size/2);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.restore();
                },
                
                // 添加update方法
                update: function(deltaTime) {
                    if (!this.active || !this.target || !this.target.active) {
                        this.active = false;
                        return;
                    }
                    
                    // 追蹤目標
                    const dx = this.target.x - this.x;
                    const dy = this.target.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < this.size + this.target.size) {
                        // 命中目標
                        this.target.takeDamage(this.damage);
                        
                        // 等級2: 分裂效果
                        if (this.splitOnHit && window.game) {
                            const enemies = window.game.enemies.filter(e => e.active && e !== this.target);
                            for (let i = 0; i < Math.min(this.splitCount, enemies.length); i++) {
                                const splitBullet = window.game.base.bulletSystem.createBullet({
                                    x: this.x,
                                    y: this.y,
                                    angle: Math.atan2(enemies[i].y - this.y, enemies[i].x - this.x),
                                    damage: this.splitDamage,
                                    speed: 600,
                                    color: this.color,
                                    size: 4,
                                    type: 'split'
                                });
                            }
                        }
                        
                        // 等級3: 爆炸效果
                        if (this.explosiveRadius && window.game) {
                            const nearbyEnemies = window.game.enemies.filter(e => {
                                const dist = Math.sqrt(
                                    Math.pow(e.x - this.x, 2) + 
                                    Math.pow(e.y - this.y, 2)
                                );
                                return e.active && dist <= this.explosiveRadius;
                            });
                            
                            for (const enemy of nearbyEnemies) {
                                enemy.takeDamage(this.damage * 0.5);
                            }
                            
                            // 爆炸特效
                            if (window.game.particleManager) {
                                for (let i = 0; i < 12; i++) {
                                    window.game.particleManager.addParticle(
                                        this.x,
                                        this.y,
                                        {
                                            vx: (Math.random() - 0.5) * 200,
                                            vy: (Math.random() - 0.5) * 200,
                                            life: 0.5,
                                            color: this.color,
                                            size: Math.random() * 4 + 2,
                                            type: 'hit'
                                        }
                                    );
                                }
                            }
                        }
                        
                        this.active = false;
                        return;
                    }
                    
                    // 導向運動
                    const targetAngle = Math.atan2(dy, dx);
                    const currentAngle = Math.atan2(this.vy, this.vx);
                    const turnRate = this.lockStrength * deltaTime;
                    
                    let angleDiff = targetAngle - currentAngle;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    
                    const newAngle = currentAngle + angleDiff * turnRate;
                    
                    this.vx = Math.cos(newAngle) * this.speed;
                    this.vy = Math.sin(newAngle) * this.speed;
                    
                    // 更新位置
                    this.x += this.vx * deltaTime;
                    this.y += this.vy * deltaTime;
                    
                    // 更新軌跡
                    this.trail.push({x: this.x, y: this.y});
                    if (this.trail.length > 8) {
                        this.trail.shift();
                    }
                }
            };
            
            this.game.projectileManager.projectiles.push(projectile);
        }
        
        this.createTrackerEffect(x, y);
    }
    
    // 離子風暴
    fireIonStorm(weapon, x, y, enemies) {
        if (enemies.length === 0) return;
        
        // 限制鏈數不超過敵人數量
        const maxChains = Math.min(weapon.data.chainCount, enemies.length);
        const chainedEnemies = [];
        const remainingEnemies = [...enemies];
        
        // 第一個目標：最近的敵人
        let currentEnemy = remainingEnemies[0];
        let minDist = Infinity;
        for (const enemy of remainingEnemies) {
            const dist = Math.sqrt(Math.pow(enemy.x - x, 2) + Math.pow(enemy.y - y, 2));
            if (dist < minDist) {
                minDist = dist;
                currentEnemy = enemy;
            }
        }
        
        chainedEnemies.push(currentEnemy);
        remainingEnemies.splice(remainingEnemies.indexOf(currentEnemy), 1);
        
        // 計算傷害
        let currentDamage = weapon.data.damage * this.cachedEffects.damageMultiplier;
        const damageReduction = weapon.data.jumpDamageReduction || 1.0;
        
        // 處理第一個目標
        currentEnemy.takeDamage(currentDamage);
        
        // 等級3: 麻痺效果
        if (weapon.data.paralysis && Math.random() < weapon.data.paralysisChance) {
            currentEnemy.paralyzed = true;
            currentEnemy.paralysisEnd = Date.now() + weapon.data.paralysisDuration;
        }
        
        // 連鎖到其他敵人
        for (let i = 1; i < maxChains && remainingEnemies.length > 0; i++) {
            // 找最近的未被擊中的敵人
            let nextEnemy = null;
            let minChainDist = Infinity;
            
            for (const enemy of remainingEnemies) {
                const dist = Math.sqrt(
                    Math.pow(enemy.x - currentEnemy.x, 2) + 
                    Math.pow(enemy.y - currentEnemy.y, 2)
                );
                if (dist < minChainDist) {
                    minChainDist = dist;
                    nextEnemy = enemy;
                }
            }
            
            if (nextEnemy) {
                currentDamage *= damageReduction;
                nextEnemy.takeDamage(currentDamage);
                
                // 麻痺效果
                if (weapon.data.paralysis && Math.random() < weapon.data.paralysisChance) {
                    nextEnemy.paralyzed = true;
                    nextEnemy.paralysisEnd = Date.now() + weapon.data.paralysisDuration;
                }
                
                chainedEnemies.push(nextEnemy);
                remainingEnemies.splice(remainingEnemies.indexOf(nextEnemy), 1);
                currentEnemy = nextEnemy;
            }
        }
        
        // 創建閃電風暴效果
        const stormEffect = {
            x: x,
            y: y,
            targets: chainedEnemies.map(e => ({x: e.x, y: e.y, enemy: e})),
            duration: 1500,
            createdTime: Date.now(),
            color: weapon.data.color,
            lightningBolts: [],
            type: 'ion_storm'
        };
        
        // 生成閃電視覺效果
        for (let i = 0; i < chainedEnemies.length; i++) {
            const target = chainedEnemies[i];
            
            if (i === 0) {
                // 主閃電（從基地到第一個敵人）
                stormEffect.lightningBolts.push({
                    startX: x,
                    startY: y,
                    endX: target.x,
                    endY: target.y,
                    intensity: 1.0,
                    duration: 300 + Math.random() * 200
                });
            } else {
                // 連鎖閃電（敵人之間）
                const prevTarget = chainedEnemies[i - 1];
                stormEffect.lightningBolts.push({
                    startX: prevTarget.x,
                    startY: prevTarget.y,
                    endX: target.x,
                    endY: target.y,
                    intensity: 0.7 + (i / chainedEnemies.length) * 0.3,
                    duration: 200 + Math.random() * 150
                });
            }
        }
        
        // 添加到特殊效果列表
        if (!this.game.specialEffects) {
            this.game.specialEffects = [];
        }
        this.game.specialEffects.push(stormEffect);
        
        this.createStormEffect(x, y);
    }
    
    // 時空裂隙
    fireTemporalRift(weapon, x, y, enemies) {
        // 創建減速區域
        const rift = {
            x: x + (Math.random() - 0.5) * 300,
            y: y + (Math.random() - 0.5) * 300,
            radius: weapon.data.radius,
            slowEffect: weapon.data.slowEffect,
            duration: weapon.data.duration,
            createdTime: Date.now(),
            color: weapon.data.color,
            type: 'temporal_rift'
        };
        
        // 等級2+: 時間傷害
        if (weapon.data.damageTick) {
            rift.damageTick = weapon.data.damageTick * this.cachedEffects.damageMultiplier;
            rift.tickRate = weapon.data.tickRate;
            rift.lastTick = Date.now();
        }
        
        // 等級3: 時空崩塌
        if (weapon.data.collapseOnEnd) {
            rift.collapseOnEnd = true;
            rift.collapseDamage = weapon.data.collapseDamage * this.cachedEffects.damageMultiplier;
        }
        
        if (!this.game.specialEffects) {
            this.game.specialEffects = [];
        }
        this.game.specialEffects.push(rift);
        
        this.createRiftEffect(rift.x, rift.y);
    }
    
    // 獲取最大血量
    getMaxHealth() {
        return GameConfig.GAME.INITIAL_LIVES * this.cachedEffects.maxHealthMultiplier;
    }
    
    // 處理生命偷取
    onEnemyKilledByPlayer(enemy) {
        if (this.cachedEffects.lifeStealPercent > 0) {
            const healAmount = this.getMaxHealth() * this.cachedEffects.lifeStealPercent;
            const maxHealth = this.getMaxHealth();
            this.game.gameState.lives = Math.min(maxHealth, this.game.gameState.lives + healAmount);
            
            if (healAmount > 0) {
                this.createLifeStealEffect(healAmount);
            }
        }
    }
    
    // 檢查九命重生
    checkRevive() {
        const nineLives = this.playerUpgrades.survival.nine_lives;
        if (!nineLives || !nineLives.data.effects.revive) return false;
        
        const reviveData = nineLives.data.effects.revive;
        if (reviveData.charges > 0) {
            // 復活
            reviveData.charges--;
            const healAmount = this.getMaxHealth() * reviveData.healPercent;
            this.game.gameState.lives = healAmount;
            
            // 創建復活特效
            this.createReviveEffect();
            
            return true;
        }
        
        return false;
    }
    
    // 創建各種特效（占位符方法）
    createUpgradeEffect(upgrade) {
        console.log(`創建升級特效: ${upgrade.name}`);
    }
    
    createHealEffect(amount) {
        console.log(`創建治療特效: +${amount} HP`);
    }
    
    createRailgunEffect(x1, y1, x2, y2) {
        console.log('創建軌道炮特效');
    }
    
    createVortexEffect(x, y) {
        console.log('創建量子漩渦特效');
    }
    
    createCrystalEffect(x, y) {
        console.log('創建水晶碎片特效');
    }
    
    createTrackerEffect(x, y) {
        console.log('創建追蹤導彈特效');
    }
    
    createStormEffect(x, y) {
        console.log('創建離子風暴特效');
    }
    
    createRiftEffect(x, y) {
        console.log('創建時空裂隙特效');
    }
    
    createLightningEffect(x1, y1, x2, y2) {
        console.log('創建閃電特效');
    }
    
    createLifeStealEffect(amount) {
        console.log(`創建生命偷取特效: +${amount} HP`);
    }
    
    createReviveEffect() {
        console.log('創建復活特效');
    }
    
    // 更新系統
    update(deltaTime) {
        // 更新經驗值系統
        this.experienceSystem.update(deltaTime);
        
        // 更新升級UI
        this.upgradeUI.update(deltaTime);
        
        // 更新特殊武器
        this.updateSpecialWeapons(deltaTime);
    }
    
    // 渲染系統（將經驗條和能量條移到畫面底部中央）
    render(ctx) {
        // 計算底部中央位置
        const centerX = ctx.canvas.width / 2 - 90; // 條寬度180的一半
        const bottomY = ctx.canvas.height - 80; // 離底部80像素
        
        // 渲染經驗值UI（底部中央）
        this.experienceSystem.render(ctx, centerX, bottomY);
        
        // 渲染升級UI
        this.upgradeUI.render(ctx);
    }
    
    // 重置系統
    reset() {
        this.experienceSystem.reset();
        this.playerUpgrades = {
            weapons: [],
            abilities: {},
            survival: {},
            activeEffects: []
        };
        this.specialWeapons = [];
        this.weaponCooldowns = {};
        this.pendingUpgrade = false;
        this.recalculateEffects();
        
        console.log('升級系統已重置');
    }
    
    // 獲取當前效果
    getEffects() {
        return { ...this.cachedEffects };
    }
    
    // 獲取經驗值系統
    getExperienceSystem() {
        return this.experienceSystem;
    }
    
    // 獲取升級統計
    getUpgradeStats() {
        return {
            level: this.experienceSystem.level,
            experience: this.experienceSystem.experience,
            weaponCount: this.playerUpgrades.weapons.length,
            abilityCount: Object.keys(this.playerUpgrades.abilities).length,
            survivalCount: Object.keys(this.playerUpgrades.survival).length,
            effects: this.cachedEffects
        };
    }
}

// 導出類
window.UpgradeSystem = UpgradeSystem;