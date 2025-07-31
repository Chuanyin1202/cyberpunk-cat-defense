// 升級選項定義 - 所有升級的數據和效果
// 包含武器、能力和生存三大類升級

class UpgradeDefinitions {
    static WEAPON_UPGRADES = {
        electromagnetic_railgun: {
            id: 'electromagnetic_railgun',
            name: '電磁軌道炮',
            category: 'weapon',
            description: '發射高速穿透彈，無視護甲並貫穿敵人',
            quality: 'rare',
            minLevel: 1,
            icon: 'railgun',
            maxLevel: 3,
            levelEffects: [
                {
                    level: 1,
                    description: '單發穿透',
                    newWeapon: {
                        damage: 50,  // 2倍基礎傷害
                        speed: 800,
                        fireRate: 1500,  // 1.5秒，+33DPS（但能穿透多個）
                        piercing: true,
                        armorPiercing: true,
                        color: '#00ffff',
                        sound: 'railgun_fire'
                    }
                },
                {
                    level: 2,
                    description: '充能穿透',
                    newWeapon: {
                        damage: 75,  // 3倍基礎傷害
                        speed: 900,
                        fireRate: 1400,  // 1.4秒，+54DPS
                        piercing: true,
                        armorPiercing: true,
                        chargeEffect: true,  // 擊中後短暫加速下次射擊
                        color: '#00ffff',
                        sound: 'railgun_fire'
                    }
                },
                {
                    level: 3,
                    description: '雙軌穿透',
                    newWeapon: {
                        damage: 100,  // 4倍基礎傷害
                        speed: 1000,
                        fireRate: 1300,  // 1.3秒，+77DPS x2軌道
                        piercing: true,
                        armorPiercing: true,
                        dualRails: true,
                        railSpacing: 40,
                        color: '#00ffff',
                        sound: 'railgun_fire'
                    }
                }
            ],
            flavorText: '科技之力，一擊貫穿！'
        },
        
        quantum_vortex: {
            id: 'quantum_vortex',
            name: '量子漩渦',
            category: 'weapon',
            description: '創建吸引敵人的能量漩渦，造成持續傷害',
            quality: 'epic',
            minLevel: 2,
            icon: 'vortex',
            maxLevel: 3,
            levelEffects: [
                {
                    level: 1,
                    description: '小型漩渦',
                    newWeapon: {
                        damage: 15,  // 每0.2秒造成傷害
                        radius: 80,
                        duration: 6000,  // 6秒
                        pullForce: 150,
                        tickRate: 200,  // 0.2秒/次 = 75DPS區域
                        fireRate: 3000,  // 3秒CD
                        color: '#ff00ff',
                        sound: 'vortex_create'
                    }
                },
                {
                    level: 2,
                    description: '強力吸引',
                    newWeapon: {
                        damage: 20,  // 每0.15秒造成傷害
                        radius: 100,
                        duration: 7000,  // 7秒
                        pullForce: 250,
                        tickRate: 150,  // 0.15秒/次 = 133DPS區域
                        fireRate: 2800,  // 2.8秒CD
                        slowEffect: 0.5,  // 50%減速
                        color: '#ff00ff',
                        sound: 'vortex_create'
                    }
                },
                {
                    level: 3,
                    description: '持續漩渦',
                    newWeapon: {
                        damage: 25,  // 每0.1秒造成傷害
                        radius: 120,
                        duration: 8000,  // 8秒
                        pullForce: 350,
                        tickRate: 100,  // 0.1秒/次 = 250DPS區域
                        fireRate: 2500,  // 2.5秒CD
                        slowEffect: 0.3,  // 70%減速
                        color: '#ff00ff',
                        sound: 'vortex_create'
                    }
                }
            ],
            flavorText: '扭曲空間，吞噬敵軍！'
        },
        
        crystal_shards: {
            id: 'crystal_shards',
            name: '水晶碎片',
            category: 'weapon',
            description: '散射式攻擊，一發變成多發水晶碎片',
            quality: 'common',
            minLevel: 1,
            icon: 'crystal',
            maxLevel: 3,
            levelEffects: [
                {
                    level: 1,
                    description: '5發散射',
                    newWeapon: {
                        damage: 15,  // 5x15=75總傷害
                        shardCount: 5,
                        spreadAngle: Math.PI / 4,
                        speed: 400,
                        fireRate: 1000,  // 1秒，+75DPS
                        color: '#00ff88',
                        sound: 'crystal_fire'
                    }
                },
                {
                    level: 2,
                    description: '7發散射+聚焦',
                    newWeapon: {
                        damage: 20,  // 7x20=140總傷害
                        shardCount: 7,
                        spreadAngle: Math.PI / 6,  // 更集中
                        speed: 450,
                        fireRate: 900,  // 0.9秒，+155DPS
                        color: '#00ffaa',
                        sound: 'crystal_fire'
                    }
                },
                {
                    level: 3,
                    description: '9發散射+穿透',
                    newWeapon: {
                        damage: 25,  // 9x25=225總傷害
                        shardCount: 9,
                        spreadAngle: Math.PI / 5,  // 精準扇形
                        speed: 500,
                        fireRate: 850,  // 0.85秒，+265DPS
                        piercing: true,
                        piercingCount: 1,  // 穿透1個敵人
                        color: '#00ffff',
                        sound: 'crystal_fire'
                    }
                }
            ],
            flavorText: '碎片飛舞，片片致命！'
        },
        
        temporal_rift: {
            id: 'temporal_rift',
            name: '時空裂隙',
            category: 'weapon',
            description: '創建減緩敵人速度的時空扭曲區域',
            quality: 'epic',
            minLevel: 2,
            icon: 'rift',
            maxLevel: 3,
            levelEffects: [
                {
                    level: 1,
                    description: '時間減速',
                    newWeapon: {
                        slowEffect: 0.5,  // 50%速度
                        radius: 100,
                        duration: 5000,  // 5秒
                        fireRate: 3000,  // 3秒CD
                        color: '#8800ff',
                        sound: 'rift_open'
                    }
                },
                {
                    level: 2,
                    description: '時間定格',
                    newWeapon: {
                        slowEffect: 0.2,  // 20%速度（幾乎定住）
                        radius: 120,
                        duration: 6000,  // 6秒
                        fireRate: 2800,  // 2.8秒CD
                        damageTick: 10,  // 每0.5秒造成20DPS
                        tickRate: 500,
                        color: '#8800ff',
                        sound: 'rift_open'
                    }
                },
                {
                    level: 3,
                    description: '時空崩塌',
                    newWeapon: {
                        slowEffect: 0.1,  // 10%速度（幾乎靜止）
                        radius: 150,
                        duration: 7000,  // 7秒
                        fireRate: 2500,  // 2.5秒CD
                        damageTick: 15,  // 每0.3秒造成50DPS
                        tickRate: 300,
                        collapseOnEnd: true,
                        collapseDamage: 100,  // 結束時爆炸100傷害
                        color: '#8800ff',
                        sound: 'rift_open'
                    }
                }
            ],
            flavorText: '時間靜止，萬物凝滯！'
        },
        
        ion_storm: {
            id: 'ion_storm',
            name: '離子風暴',
            category: 'weapon',
            description: '周期性全屏電擊，對所有敵人造成傷害',
            quality: 'legendary',
            minLevel: 3,
            icon: 'storm',
            maxLevel: 3,
            levelEffects: [
                {
                    level: 1,
                    description: '閃電鏈',
                    newWeapon: {
                        damage: 40,  // 對前3個目標
                        range: 'global',
                        fireRate: 3500,  // 3.5秒CD
                        chainCount: 3,
                        color: '#ffff00',
                        sound: 'ion_storm'
                    }
                },
                {
                    level: 2,
                    description: '連鎖風暴',
                    newWeapon: {
                        damage: 50,  // 基礎傷害
                        range: 'global',
                        fireRate: 3000,  // 3秒CD
                        chainCount: 5,
                        jumpDamageReduction: 0.8,  // 每次跳躍80%傷害
                        color: '#ffff00',
                        sound: 'ion_storm'
                    }
                },
                {
                    level: 3,
                    description: '電磁脈衝',
                    newWeapon: {
                        damage: 60,  // 基礎傷害
                        range: 'global',
                        fireRate: 2500,  // 2.5秒CD
                        chainCount: 7,
                        jumpDamageReduction: 0.9,  // 每次跳躍90%傷害
                        paralysis: true,
                        paralysisChance: 0.2,  // 20%機率麻痺
                        paralysisDuration: 800,  // 0.8秒
                        color: '#ffff00',
                        sound: 'ion_storm'
                    }
                }
            ],
            flavorText: '雷霆萬鈞，席捲戰場！'
        },
        
        nano_tracker: {
            id: 'nano_tracker',
            name: '納米追蹤',
            category: 'weapon',
            description: '自動鎖定最強敵人的追蹤導彈',
            quality: 'epic',
            minLevel: 1,
            icon: 'tracker',
            maxLevel: 3,
            levelEffects: [
                {
                    level: 1,
                    description: '單發導彈',
                    newWeapon: {
                        damage: 75,  // 3倍基礎傷害
                        speed: 600,
                        homing: true,
                        lockStrength: 0.8,
                        fireRate: 2500,  // 2.5秒，+30DPS（但必中）
                        color: '#ff6600',
                        sound: 'missile_lock'
                    }
                },
                {
                    level: 2,
                    description: '雙重鎖定',
                    newWeapon: {
                        damage: 100,  // 4倍基礎傷害
                        speed: 700,
                        homing: true,
                        lockStrength: 0.9,
                        fireRate: 2200,  // 2.2秒，+45DPS
                        multiTarget: true,
                        targetCount: 2,  // 同時追蹤2個目標
                        color: '#ff6600',
                        sound: 'missile_lock'
                    }
                },
                {
                    level: 3,
                    description: '爆炸彈頭',
                    newWeapon: {
                        damage: 125,  // 5倍基礎傷害
                        speed: 800,
                        homing: true,
                        lockStrength: 1.0,
                        fireRate: 2000,  // 2秒，+62DPS
                        multiTarget: true,
                        targetCount: 2,
                        explosiveRadius: 50,  // 爆炸範圍
                        explosiveDamage: 50,  // 範圍傷害
                        color: '#ff6600',
                        sound: 'missile_lock'
                    }
                }
            ],
            flavorText: '智能追蹤，無處可逃！'
        }
    };
    
    static ABILITY_UPGRADES = {
        firepower_boost: {
            id: 'firepower_boost',
            name: '火力增強',
            category: 'ability',
            description: '提升15%攻擊力',
            quality: 'common',
            minLevel: 1,
            icon: 'damage',
            effects: {
                damageMultiplier: 1.15  // 15%增傷，5層=2.01倍
            },
            stackable: true,
            maxStacks: 5,
            flavorText: '更強的火力，更快的勝利！'
        },
        
        rapid_fire: {
            id: 'rapid_fire',
            name: '射速提升',
            category: 'ability',
            description: '提升10%射擊速度',
            quality: 'common',
            minLevel: 1,
            icon: 'speed',
            effects: {
                fireRateMultiplier: 0.9  // 10%加速，5層=0.59倍間隔
            },
            stackable: true,
            maxStacks: 5,
            flavorText: '快如閃電的攻擊節奏！'
        },
        
        range_extension: {
            id: 'range_extension',
            name: '散射強化',
            category: 'ability',
            description: '基本攻擊變為散射，增加彈藥數量',
            quality: 'common',
            minLevel: 1,
            icon: 'range',
            effects: {
                rangeMultiplier: 1.5  // 每層增加0.5發彈藥（整數部分）
            },
            stackable: true,
            maxStacks: 4,  // 最多4層，總計5發彈藥
            flavorText: '一發變多發，火力全開！'
        },
        
        precision_strike: {
            id: 'precision_strike',
            name: '精準射擊',
            category: 'ability',
            description: '暴擊率增加8%',
            quality: 'rare',
            minLevel: 2,
            icon: 'precision',
            effects: {
                criticalChance: 0.08,  // 8%暴擊，3層=24%
                criticalMultiplier: 2.0
            },
            stackable: true,
            maxStacks: 3,
            flavorText: '一擊命中要害！'
        },
        
    };
    
    static SURVIVAL_UPGRADES = {
        emergency_repair: {
            id: 'emergency_repair',
            name: '緊急修復',
            category: 'survival',
            description: '立即回復25%血量',
            quality: 'common',
            minLevel: 1,
            icon: 'repair',
            effects: {
                immediateHeal: 0.25  // 25%立即回復
            },
            flavorText: '戰場醫療，立即生效！'
        },
        
        armor_upgrade: {
            id: 'armor_upgrade',
            name: '裝甲升級',
            category: 'survival',
            description: '最大血量增加15%',
            quality: 'common',
            minLevel: 1,
            icon: 'armor',
            effects: {
                maxHealthMultiplier: 1.15  // 15%增加，5層=2.01倍
            },
            stackable: true,
            maxStacks: 5,
            flavorText: '更厚的裝甲，更長的生存！'
        },
        
        life_steal: {
            id: 'life_steal',
            name: '血量偷取',
            category: 'survival',
            description: '每次擊殺回復1.5%血量',
            quality: 'rare',
            minLevel: 2,
            icon: 'steal',
            effects: {
                lifeStealPercent: 0.015  // 1.5%，5層=7.5%
            },
            stackable: true,
            maxStacks: 5,
            flavorText: '敵人的生命力為我所用！'
        }
    };
    
    // 根據品質獲取顏色
    static getQualityColor(quality) {
        const colors = {
            common: '#ffffff',     // 白色
            rare: '#00ffff',       // 青色
            epic: '#ff00ff',       // 洋紅
            legendary: '#ffff00'   // 黃色
        };
        return colors[quality] || colors.common;
    }
    
    // 根據等級和品質篩選可用升級
    static getAvailableUpgrades(level, quality) {
        const allUpgrades = [
            ...Object.values(this.WEAPON_UPGRADES),
            ...Object.values(this.ABILITY_UPGRADES),
            ...Object.values(this.SURVIVAL_UPGRADES)
        ];
        
        return allUpgrades.filter(upgrade => {
            return upgrade.minLevel <= level && 
                   this.isQualityAvailable(upgrade.quality, quality);
        });
    }
    
    // 檢查品質是否可用
    static isQualityAvailable(upgradeQuality, playerQuality) {
        const qualityLevels = {
            common: 1,
            rare: 2,
            epic: 3,
            legendary: 4
        };
        
        return qualityLevels[upgradeQuality] <= qualityLevels[playerQuality];
    }
    
    // 隨機選擇三個升級選項
    static getRandomUpgradeChoices(level, quality, existingUpgrades = []) {
        const available = this.getAvailableUpgrades(level, quality);
        
        console.log(`等級 ${level}, 品質 ${quality}, 可用升級數量: ${available.length}`);
        
        // 過濾已經擁有且不可疊加的升級
        const filtered = available.filter(upgrade => {
            const existing = existingUpgrades.find(e => e.id === upgrade.id);
            if (!existing) return true;
            
            // 檢查是否可以疊加或升級
            if (upgrade.stackable) {
                const maxStacks = upgrade.maxStacks || 999;
                return existing.stacks < maxStacks;
            }
            
            // 武器可以升級
            if (upgrade.category === 'weapon' && upgrade.maxLevel) {
                return existing.stacks < upgrade.maxLevel;
            }
            
            return false;
        });
        
        console.log(`過濾後可用升級數量: ${filtered.length}`);
        
        // 加權計算
        const weightedOptions = filtered.map(upgrade => {
            let weight = 10; // 基礎權重
            
            // 品質權重
            switch (upgrade.quality) {
                case 'common': weight *= 4; break;
                case 'rare': weight *= 2.5; break;
                case 'epic': weight *= 1.5; break;
                case 'legendary': weight *= 1; break;
            }
            
            // 類別權重
            const categoryCount = existingUpgrades.filter(e => {
                const def = this.getUpgradeById(e.id);
                return def && def.category === upgrade.category;
            }).length;
            
            // 已有該類別的升級越多，權重越低
            weight *= Math.pow(0.85, categoryCount);
            
            // 已擁有的升級權重降低
            const existing = existingUpgrades.find(e => e.id === upgrade.id);
            if (existing) {
                weight *= 0.6; // 已擁有的權重降低
            }
            
            return { upgrade, weight };
        });
        
        // 加權隨機選擇
        const choices = [];
        const usedIds = new Set();
        
        for (let i = 0; i < 3 && weightedOptions.length > 0; i++) {
            // 計算總權重
            const totalWeight = weightedOptions.reduce((sum, option) => {
                return usedIds.has(option.upgrade.id) ? sum : sum + option.weight;
            }, 0);
            
            if (totalWeight === 0) break;
            
            // 加權隨機選擇
            let random = Math.random() * totalWeight;
            let selectedOption = null;
            
            for (const option of weightedOptions) {
                if (usedIds.has(option.upgrade.id)) continue;
                
                random -= option.weight;
                if (random <= 0) {
                    selectedOption = option;
                    break;
                }
            }
            
            if (selectedOption) {
                choices.push(selectedOption.upgrade);
                usedIds.add(selectedOption.upgrade.id);
                console.log(`選擇: ${selectedOption.upgrade.name} (權重: ${selectedOption.weight.toFixed(2)})`);
            }
        }
        
        console.log(`最終選擇的升級數量: ${choices.length}`);
        return choices;
    }
    
    // 獲取升級的完整信息
    static getUpgradeById(id) {
        const allUpgrades = [
            ...Object.values(this.WEAPON_UPGRADES),
            ...Object.values(this.ABILITY_UPGRADES),
            ...Object.values(this.SURVIVAL_UPGRADES)
        ];
        
        return allUpgrades.find(upgrade => upgrade.id === id);
    }
}

// 導出類
window.UpgradeDefinitions = UpgradeDefinitions;