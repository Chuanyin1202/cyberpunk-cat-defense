// 動態載入敵機配置的範例程式碼
// 這個檔案展示如何從編輯器的 JSON 載入敵機配置

async function loadEnemyConfig() {
    try {
        // 從編輯器配置載入
        const response = await fetch('/shared/configs/enemies.json');
        const data = await response.json();
        
        // 轉換格式（編輯器格式 -> 遊戲格式）
        const gameEnemies = {};
        Object.entries(data.enemies).forEach(([id, enemy]) => {
            gameEnemies[id] = {
                speed: enemy.stats.speed,
                health: enemy.stats.health,
                color: enemy.visual.color,
                size: enemy.visual.size,
                reward: enemy.stats.reward,
                damage: enemy.stats.damage,
                // 可以加入更多屬性
                shape: enemy.visual.shape,
                glowColor: enemy.visual.glowColor,
                movementType: enemy.behavior.movementType
            };
        });
        
        // 替換 GameConfig.ENEMIES
        GameConfig.ENEMIES = gameEnemies;
        console.log('✅ 已載入賽博龐克貓咪敵機配置');
        
    } catch (error) {
        console.error('載入敵機配置失敗，使用預設配置:', error);
        // 保持原本的配置
    }
}

// 使用方式：
// 1. 在 game.js 的初始化時呼叫：
// await loadEnemyConfig();
// 
// 2. 或在 index.html 中加入：
// <script src="js/core/loadEnemyConfig.js"></script>
// 然後在遊戲初始化前呼叫