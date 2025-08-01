// 賽博龐克貓咪塔防遊戲配置
// 直接從 base-tower-final.js 提取並簡化

class GameConfig {
    static CANVAS = {
        WIDTH: 800,
        HEIGHT: 600,
        FPS: 60
    };

    static GAME = {
        INITIAL_LIVES: 100,
        INITIAL_GOLD: 300,
        BASE_X: 400,
        BASE_Y: 300,
        BASE_RADIUS: 55  // 放大基地以容納貓咪特徵
    };

    // 簡化的敵人配置 - 只保留基本類型
    static ENEMIES = {
        normal: { speed: 1.5, health: 96, color: '#00ff00', size: 10, reward: 15, damage: 15 },
        fast: { speed: 3.0, health: 64, color: '#ffff00', size: 12, reward: 20, damage: 12 },
        tank: { speed: 0.8, health: 200, color: '#ff6600', size: 15, reward: 35, damage: 25 },
        boss: { speed: 0.5, health: 3600, color: '#ff00ff', size: 35, reward: 500, damage: 50 }
    };

    // 波次配置
    static WAVE_CONFIG = {
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

    // 基地表情系統配置
    static BASE_EXPRESSIONS = {
        perfect: { expression: '(^_^)', threshold: 90, color: '#00ff00' },
        happy: { expression: '(^-^)', threshold: 70, color: '#66ff66' },
        normal: { expression: '(o_o)', threshold: 50, color: '#ffff00' },
        worried: { expression: '(>_<)', threshold: 30, color: '#ff6600' },
        critical: { expression: '(x_x)', threshold: 10, color: '#ff0000' },
        dying: { expression: '(@_@)', threshold: 0, color: '#660000' }
    };

    // 投射物配置
    static PROJECTILES = {
        base_attack: {
            damage: 25,
            speed: 300,
            color: '#00ffff',
            size: 3,
            type: 'laser'
        }
    };

    // 性能配置（優化）
    static PERFORMANCE = {
        MAX_PARTICLES: 100,      // 降低粒子上限
        MAX_PROJECTILES: 40,     // 降低子彈上限
        MAX_ENEMIES: 25,         // 降低敵人上限
        CLEANUP_INTERVAL: 180,   // 更頻繁清理
        PARTICLE_BATCH_SIZE: 20, // 批次處理大小
        LOD_DISTANCE: 400        // 距離優化閾值
    };
}

// 導出配置
window.GameConfig = GameConfig;