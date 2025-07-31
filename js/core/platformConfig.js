// 平台特定遊戲設定管理系統
// 統一管理手機版和PC版的不同參數設定

class PlatformConfig {
    // 通用設定，不分平台
    static COMMON = {
        CANVAS: {
            WIDTH: 800,
            HEIGHT: 600,
            FPS: 60
        },
        
        GAME: {
            INITIAL_LIVES: 100,
            INITIAL_GOLD: 300,
            BASE_X: 400,
            BASE_Y: 300,
            BASE_RADIUS: 55
        },

        // 基本敵人數據（平台會套用倍數）
        BASE_ENEMY_STATS: {
            normal: { speed: 1.5, health: 96, color: '#00ff00', size: 10, reward: 15, damage: 15 },
            fast: { speed: 3.0, health: 64, color: '#ffff00', size: 12, reward: 20, damage: 12 },
            tank: { speed: 0.8, health: 200, color: '#ff6600', size: 15, reward: 35, damage: 25 },
            boss: { speed: 0.5, health: 3600, color: '#ff00ff', size: 35, reward: 500, damage: 50 }
        },

        // 基地表情系統
        BASE_EXPRESSIONS: {
            perfect: { expression: '(^_^)', threshold: 90, color: '#00ff00' },
            happy: { expression: '(^-^)', threshold: 70, color: '#66ff66' },
            normal: { expression: '(o_o)', threshold: 50, color: '#ffff00' },
            worried: { expression: '(>_<)', threshold: 30, color: '#ff6600' },
            critical: { expression: '(x_x)', threshold: 10, color: '#ff0000' },
            dying: { expression: '(@_@)', threshold: 0, color: '#660000' }
        },

        // 投射物基本配置
        BASE_PROJECTILES: {
            base_attack: {
                damage: 25,
                speed: 300,
                color: '#00ffff',
                size: 3,
                type: 'laser'
            }
        }
    };

    // 手機版特定設定
    static MOBILE = {
        // 遊戲平衡參數
        ENEMY_SPEED_MULTIPLIER: 0.5,    // 敵機速度-50%
        PROJECTILE_SPEED_MULTIPLIER: 1.0, // 子彈速度正常
        
        // 渲染參數
        RENDER_SCALE: 0.75,             // 直屏縮放75%
        UI_SCALE: 1.2,                  // UI放大20%便於點擊
        ENTITY_SIZE_MULTIPLIER: 1.3,    // 敵機和子彈放大30%便於瞄準
        
        // 控制參數
        TOUCH_SENSITIVITY: 1.0,         // 觸控靈敏度
        JOYSTICK_DEAD_ZONE: 0.15,      // 搖桿死區
        TRACKING_ASSISTANCE: 0.3,       // 瞄準輔助強度
        
        // 性能優化參數
        MAX_PARTICLES: 60,              // 粒子數量減少
        MAX_PROJECTILES: 25,            // 子彈數量限制
        MAX_ENEMIES: 15,                // 敵人數量限制
        CLEANUP_INTERVAL: 120,          // 更頻繁清理
        
        // 視覺效果
        VISUAL_EFFECTS_INTENSITY: 0.8,  // 特效強度降低
        GLOW_INTENSITY: 0.6             // 發光效果降低
    };

    // PC版特定設定
    static PC = {
        // 遊戲平衡參數
        ENEMY_SPEED_MULTIPLIER: 1.0,    // 敵機速度正常
        PROJECTILE_SPEED_MULTIPLIER: 1.0, // 子彈速度正常
        
        // 渲染參數
        RENDER_SCALE: 1.0,              // 不縮放
        UI_SCALE: 1.0,                  // UI正常大小
        ENTITY_SIZE_MULTIPLIER: 1.0,    // 實體大小正常
        
        // 控制參數
        MOUSE_SENSITIVITY: 1.0,         // 滑鼠靈敏度
        PRECISION_MODE: true,           // 精確瞄準模式
        TRACKING_ASSISTANCE: 0.1,       // 輕微瞄準輔助
        
        // 性能參數
        MAX_PARTICLES: 100,             // 更多粒子效果
        MAX_PROJECTILES: 40,            // 更多子彈
        MAX_ENEMIES: 25,                // 更多敵人
        CLEANUP_INTERVAL: 180,          // 較慢清理
        
        // 視覺效果
        VISUAL_EFFECTS_INTENSITY: 1.0,  // 完整特效
        GLOW_INTENSITY: 1.0             // 完整發光效果
    };

    // 獲取當前平台設定
    static getCurrentPlatformConfig() {
        const isMobile = window.mobileControls && window.mobileControls.isEnabled;
        return isMobile ? this.MOBILE : this.PC;
    }

    // 獲取平台特定的敵人設定
    static getEnemyConfig(enemyType) {
        const baseStats = this.COMMON.BASE_ENEMY_STATS[enemyType];
        const platformConfig = this.getCurrentPlatformConfig();
        
        if (!baseStats) return null;

        return {
            ...baseStats,
            speed: baseStats.speed * platformConfig.ENEMY_SPEED_MULTIPLIER,
            size: baseStats.size * platformConfig.ENTITY_SIZE_MULTIPLIER
        };
    }

    // 獲取平台特定的投射物設定
    static getProjectileConfig(projectileType) {
        const baseStats = this.COMMON.BASE_PROJECTILES[projectileType];
        const platformConfig = this.getCurrentPlatformConfig();
        
        if (!baseStats) return null;

        return {
            ...baseStats,
            speed: baseStats.speed * platformConfig.PROJECTILE_SPEED_MULTIPLIER,
            size: baseStats.size * platformConfig.ENTITY_SIZE_MULTIPLIER
        };
    }

    // 獲取當前平台類型
    static getCurrentPlatform() {
        return (window.mobileControls && window.mobileControls.isEnabled) ? 'mobile' : 'pc';
    }

    // 獲取合併的設定（通用+平台特定）
    static getAllConfig() {
        return {
            ...this.COMMON,
            PLATFORM: this.getCurrentPlatformConfig(),
            CURRENT_PLATFORM: this.getCurrentPlatform()
        };
    }

    // 動態獲取設定值的輔助方法
    static get(path, defaultValue = null) {
        const config = this.getAllConfig();
        const keys = path.split('.');
        let value = config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    }
}

// 為了向後相容，更新原有的 GameConfig
class GameConfig {
    // 保持原有API不變，但內部使用新的PlatformConfig
    static get CANVAS() { return PlatformConfig.COMMON.CANVAS; }
    static get GAME() { return PlatformConfig.COMMON.GAME; }
    static get BASE_EXPRESSIONS() { return PlatformConfig.COMMON.BASE_EXPRESSIONS; }
    static get PROJECTILES() { return PlatformConfig.COMMON.BASE_PROJECTILES; }
    static get WAVE_CONFIG() { return this._WAVE_CONFIG; }

    // 敵人設定現在使用平台特定配置
    static get ENEMIES() {
        const enemies = {};
        for (const [type, _] of Object.entries(PlatformConfig.COMMON.BASE_ENEMY_STATS)) {
            enemies[type] = PlatformConfig.getEnemyConfig(type);
        }
        return enemies;
    }

    // 性能設定使用平台特定配置
    static get PERFORMANCE() {
        const platformConfig = PlatformConfig.getCurrentPlatformConfig();
        return {
            MAX_PARTICLES: platformConfig.MAX_PARTICLES,
            MAX_PROJECTILES: platformConfig.MAX_PROJECTILES,
            MAX_ENEMIES: platformConfig.MAX_ENEMIES,
            CLEANUP_INTERVAL: platformConfig.CLEANUP_INTERVAL,
            PARTICLE_BATCH_SIZE: 20,
            LOD_DISTANCE: 400
        };
    }

    // 波次配置保持不變
    static _WAVE_CONFIG = {
        getWaveInfo(wave) {
            // 每 5 波出現 BOSS
            if (wave % 5 === 0) {
                const bossLevel = Math.floor(wave / 5);
                return {
                    name: 'BOSS 戰鬥！',
                    enemies: ['boss'],
                    spawnRate: 0,  // BOSS 只生成一個
                    enemyCount: 1,
                    healthMultiplier: 1 + (bossLevel - 1) * 0.8,  // BOSS 血量大幅增加
                    speedMultiplier: 1 + (bossLevel - 1) * 0.2,
                    isBossWave: true
                };
            } else if (wave <= 3) {
                return {
                    name: '新手防禦',
                    enemies: ['normal', 'fast'],
                    spawnRate: 1.5,
                    enemyCount: 10 + wave * 4,  // 基礎數量增加
                    healthMultiplier: 1 + (wave - 1) * 0.15,  // 即使初期也有血量成長
                    speedMultiplier: 1
                };
            } else if (wave <= 8) {
                return {
                    name: '加強攻勢',
                    enemies: ['normal', 'fast', 'tank'],
                    spawnRate: 1.0,  // 加快生成速度
                    enemyCount: 20 + wave * 5,  // 數量快速增長
                    healthMultiplier: 1.3 + (wave - 4) * 0.25,  // 血量增幅加大
                    speedMultiplier: 1.1 + (wave - 4) * 0.05
                };
            } else if (wave <= 15) {
                return {
                    name: '精英入侵',
                    enemies: ['tank', 'fast', 'tank', 'normal'],  // 更多坦克
                    spawnRate: 0.8,
                    enemyCount: 30 + wave * 6,  // 大量敵人
                    healthMultiplier: 2.0 + (wave - 9) * 0.3,  // 血量大幅提升
                    speedMultiplier: 1.3 + (wave - 9) * 0.08
                };
            } else {
                return {
                    name: '地獄模式',
                    enemies: ['tank', 'tank', 'fast', 'normal'],  // 坦克為主
                    spawnRate: 0.6,  // 極快生成
                    enemyCount: 50 + wave * 8,  // 海量敵人
                    healthMultiplier: 3.5 + wave * 0.4,  // 血量爆炸性成長
                    speedMultiplier: 1.8 + wave * 0.1
                };
            }
        }
    };
}

// 導出兩個類
window.PlatformConfig = PlatformConfig;
window.GameConfig = GameConfig;