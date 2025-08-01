// 遊戲狀態管理器
// 負責管理遊戲狀態的所有邏輯

class GameStateManager {
    constructor() {
        this.resetState();
        this.setupEventListeners();
    }
    
    // 重置遊戲狀態
    resetState() {
        this.state = {
            // 核心狀態
            lives: GameConfig.GAME.INITIAL_LIVES,
            gold: GameConfig.GAME.INITIAL_GOLD,
            wave: 1,
            score: 0,
            kills: 0,
            streak: 0,
            
            // 遊戲流程狀態
            isGameOver: false,
            isPaused: false,
            isUpgrading: false,
            
            // 時間相關
            startTime: Date.now(),
            pausedTime: 0,
            lastWaveTime: Date.now(),
            
            // 輸入狀態
            mouseX: null,
            mouseY: null,
            
            // 統計數據
            stats: {
                totalEnemiesKilled: 0,
                totalDamageDealt: 0,
                totalGoldEarned: 0,
                totalWavesCompleted: 0,
                totalUpgradesPurchased: 0,
                highestStreak: 0,
                totalPlayTime: 0
            }
        };
    }
    
    // 設置事件監聽器
    setupEventListeners() {
        if (!window.gameEventBus) return;
        
        // 監聽敵人死亡事件
        window.gameEventBus.on(GameEvents.ENEMY_DEATH, (data) => {
            this.handleEnemyDeath(data);
        });
        
        // 監聽基地受傷事件
        window.gameEventBus.on(GameEvents.BASE_DAMAGE, (data) => {
            this.handleBaseDamage(data);
        });
        
        // 監聽升級購買事件
        window.gameEventBus.on(GameEvents.UPGRADE_PURCHASE, (data) => {
            this.stats.totalUpgradesPurchased++;
        });
        
        // 監聽波次完成事件
        window.gameEventBus.on(GameEvents.WAVE_COMPLETE, (data) => {
            this.handleWaveComplete(data);
        });
    }
    
    // 處理敵人死亡
    handleEnemyDeath(data) {
        this.addGold(data.reward);
        this.addScore(data.reward);
        this.kills++;
        this.streak++;
        
        // 更新統計
        this.stats.totalEnemiesKilled++;
        this.stats.totalGoldEarned += data.reward;
        
        if (this.streak > this.stats.highestStreak) {
            this.stats.highestStreak = this.streak;
        }
        
        // 發送分數更新事件
        window.gameEventBus.emit(GameEvents.SCORE_UPDATE, {
            score: this.score,
            kills: this.kills,
            streak: this.streak
        });
    }
    
    // 處理基地受傷
    handleBaseDamage(data) {
        this.lives = Math.max(0, this.lives - data.damage);
        this.streak = 0; // 重置連殺
        
        if (this.lives <= 0) {
            this.isGameOver = true;
        }
    }
    
    // 處理波次完成
    handleWaveComplete(data) {
        this.wave++;
        this.stats.totalWavesCompleted++;
        this.lastWaveTime = Date.now();
        
        // 波次獎勵
        const waveBonus = data.waveNumber * 100;
        this.addGold(waveBonus);
        this.addScore(waveBonus);
    }
    
    // 添加金幣
    addGold(amount) {
        this.gold += amount;
        return this.gold;
    }
    
    // 消耗金幣
    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }
    
    // 添加分數
    addScore(points) {
        this.score += points;
        return this.score;
    }
    
    // 暫停/繼續遊戲
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.pausedTime = Date.now();
            window.gameEventBus.emit(GameEvents.GAME_PAUSE);
        } else {
            const pauseDuration = Date.now() - this.pausedTime;
            this.startTime += pauseDuration; // 調整開始時間
            window.gameEventBus.emit(GameEvents.GAME_RESUME);
        }
        
        return this.isPaused;
    }
    
    // 開始新遊戲
    startNewGame() {
        this.resetState();
        window.gameEventBus.emit(GameEvents.GAME_START, {
            timestamp: Date.now()
        });
    }
    
    // 獲取遊戲時間（秒）
    getPlayTime() {
        if (this.isPaused) {
            return Math.floor((this.pausedTime - this.startTime) / 1000);
        }
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
    
    // 獲取當前狀態的只讀副本
    getState() {
        return {
            ...this.state,
            playTime: this.getPlayTime()
        };
    }
    
    // 獲取統計數據
    getStats() {
        return {
            ...this.stats,
            totalPlayTime: this.getPlayTime()
        };
    }
    
    // 更新滑鼠位置
    updateMousePosition(x, y) {
        this.mouseX = x;
        this.mouseY = y;
    }
    
    // 導出/導入狀態（用於存檔）
    exportState() {
        return JSON.stringify({
            state: this.state,
            stats: this.stats,
            timestamp: Date.now()
        });
    }
    
    importState(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.state = data.state;
            this.stats = data.stats;
            return true;
        } catch (error) {
            console.error('Failed to import state:', error);
            return false;
        }
    }
}

// 創建全局實例
window.GameStateManager = GameStateManager;