/**
 * 敵機編輯器模塊
 * 專門處理敵機資源的CRUD操作
 */
class EnemyEditor {
    constructor() {
        this.moduleType = 'enemies';
        this.enemies = {};
        this.currentEnemyId = null;
        this.isLoaded = false;
        
        console.log('👾 敵機編輯器已創建');
    }
    
    /**
     * 初始化模塊
     */
    async initialize() {
        try {
            await this.loadEnemies();
            this.isLoaded = true;
            console.log('✅ 敵機編輯器初始化完成');
            return true;
        } catch (error) {
            console.error('❌ 敵機編輯器初始化失敗:', error);
            return false;
        }
    }
    
    /**
     * 載入敵機數據
     */
    async loadEnemies() {
        try {
            // 檢查全局 dataManager 是否存在
            if (!window.dataManager && window.gameEditor && window.gameEditor.dataManager) {
                window.dataManager = window.gameEditor.dataManager;
            }
            
            if (!window.dataManager) {
                console.warn('數據管理器尚未初始化，使用空配置');
                this.enemies = {};
                return this.enemies;
            }
            
            // 強制從文件重新載入
            const config = await window.dataManager.loadConfig('enemies', true);
            this.enemies = config.enemies || {};
            
            console.log(`📂 已載入 ${Object.keys(this.enemies).length} 個敵機配置`);
            return this.enemies;
        } catch (error) {
            console.error('載入敵機配置失敗:', error);
            this.enemies = {};
            throw error;
        }
    }
    
    /**
     * 保存敵機數據
     */
    async saveEnemies() {
        try {
            // 確保 dataManager 存在
            if (!window.dataManager && window.gameEditor && window.gameEditor.dataManager) {
                window.dataManager = window.gameEditor.dataManager;
            }
            
            if (!window.dataManager) {
                console.error('數據管理器不存在，無法保存');
                return false;
            }
            
            const config = {
                version: '1.0.0',
                lastModified: new Date().toISOString(),
                editor: 'cyberpunk-cat-defense-editor',
                enemies: this.enemies
            };
            
            await window.dataManager.saveConfig('enemies', config);
            console.log('💾 敵機配置已保存');
            return true;
        } catch (error) {
            console.error('保存敵機配置失敗:', error);
            return false;
        }
    }
    
    /**
     * 獲取所有敵機資源
     */
    async getAssets() {
        if (!this.isLoaded) {
            await this.loadEnemies();
        }
        
        return Object.values(this.enemies).map(enemy => ({
            ...enemy,
            lastModified: enemy.lastModified || new Date().toISOString()
        }));
    }
    
    /**
     * 根據ID獲取敵機
     */
    getEnemyById(enemyId) {
        return this.enemies[enemyId] || null;
    }
    
    /**
     * 創建新敵機
     */
    async createEnemy(enemyData = null) {
        // 生成唯一ID
        let newId = enemyData?.id || this.generateEnemyId();
        let counter = 1;
        
        while (this.enemies[newId]) {
            newId = `${enemyData?.id || 'new_enemy'}_${counter}`;
            counter++;
        }
        
        // 默認敵機模板
        const defaultEnemy = {
            id: newId,
            name: enemyData?.name || `新敵機 ${counter}`,
            type: 'normal',
            stats: {
                health: 100,
                speed: 2.0,
                damage: 15,
                reward: 20
            },
            visual: {
                size: 12,
                color: '#ff6600',
                shape: 'circle',
                animations: ['idle', 'move', 'death']
            },
            behavior: {
                movementType: 'straight',
                specialAbilities: [],
                ai: 'basic'
            },
            lastModified: new Date().toISOString()
        };
        
        // 合併用戶提供的數據
        const newEnemy = enemyData ? 
            this.mergeEnemyData(defaultEnemy, enemyData) : 
            defaultEnemy;
        
        this.enemies[newId] = newEnemy;
        this.currentEnemyId = newId;
        
        console.log(`➕ 已創建新敵機: ${newId}`);
        return newEnemy;
    }
    
    /**
     * 更新敵機
     */
    async updateEnemy(enemyId, updates) {
        if (!this.enemies[enemyId]) {
            throw new Error(`敵機 ${enemyId} 不存在`);
        }
        
        // 深度合併更新
        this.enemies[enemyId] = this.mergeEnemyData(this.enemies[enemyId], updates);
        this.enemies[enemyId].lastModified = new Date().toISOString();
        
        console.log(`📝 已更新敵機: ${enemyId}`);
        return this.enemies[enemyId];
    }
    
    /**
     * 複製敵機
     */
    async duplicateAsset(enemyId) {
        const originalEnemy = this.enemies[enemyId];
        if (!originalEnemy) {
            console.error(`要複製的敵機 ${enemyId} 不存在`);
            return false;
        }
        
        try {
            // 創建副本
            const duplicateData = JSON.parse(JSON.stringify(originalEnemy));
            duplicateData.name = `${originalEnemy.name} (副本)`;
            duplicateData.id = `${enemyId}_copy`;
            
            await this.createEnemy(duplicateData);
            return true;
        } catch (error) {
            console.error('複製敵機失敗:', error);
            return false;
        }
    }
    
    /**
     * 刪除敵機
     */
    async deleteAsset(enemyId) {
        if (!this.enemies[enemyId]) {
            console.error(`要刪除的敵機 ${enemyId} 不存在`);
            return false;
        }
        
        try {
            delete this.enemies[enemyId];
            
            // 如果刪除的是當前選中的敵機，清空選擇
            if (this.currentEnemyId === enemyId) {
                this.currentEnemyId = null;
            }
            
            console.log(`🗑️ 已刪除敵機: ${enemyId}`);
            return true;
        } catch (error) {
            console.error('刪除敵機失敗:', error);
            return false;
        }
    }
    
    /**
     * 生成敵機ID
     */
    generateEnemyId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `enemy_${timestamp}_${random}`;
    }
    
    /**
     * 合併敵機數據
     */
    mergeEnemyData(target, source) {
        const result = JSON.parse(JSON.stringify(target));
        
        const merge = (obj, src) => {
            Object.keys(src).forEach(key => {
                if (src[key] && typeof src[key] === 'object' && !Array.isArray(src[key])) {
                    if (!obj[key]) obj[key] = {};
                    merge(obj[key], src[key]);
                } else {
                    obj[key] = src[key];
                }
            });
        };
        
        merge(result, source);
        return result;
    }
    
    /**
     * 驗證敵機數據
     */
    validateEnemy(enemyData) {
        const errors = [];
        
        // 必填字段檢查
        if (!enemyData.id) errors.push('ID 是必填的');
        if (!enemyData.name) errors.push('名稱 是必填的');
        if (!enemyData.type) errors.push('類型 是必填的');
        
        // 數值範圍檢查
        if (enemyData.stats) {
            const { health, speed, damage, reward } = enemyData.stats;
            
            if (health && (health < 1 || health > 10000)) {
                errors.push('生命值必須在 1-10000 之間');
            }
            if (speed && (speed < 0.1 || speed > 10.0)) {
                errors.push('移動速度必須在 0.1-10.0 之間');
            }
            if (damage && (damage < 1 || damage > 1000)) {
                errors.push('攻擊力必須在 1-1000 之間');
            }
            if (reward && (reward < 1 || reward > 1000)) {
                errors.push('擊殺獎勵必須在 1-1000 之間');
            }
        }
        
        // 視覺屬性檢查
        if (enemyData.visual) {
            const { size, color } = enemyData.visual;
            
            if (size && (size < 5 || size > 50)) {
                errors.push('大小必須在 5-50 之間');
            }
            if (color && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
                errors.push('顏色必須是有效的十六進制格式');
            }
        }
        
        return errors;
    }
    
    /**
     * 獲取敵機類型選項
     */
    getEnemyTypes() {
        return [
            { value: 'assassin', label: '刺客', description: '高速高傷害，專門獵殺弱點' },
            { value: 'heavy', label: '重裝', description: '高護甲高血量，反彈傷害' },
            { value: 'hacker', label: '駭客', description: '干擾防禦系統，降低塔效率' },
            { value: 'swarm', label: '蟲群', description: '群體智能，數量優勢' },
            { value: 'stealth', label: '隱形', description: '完美潛行，暗殺打擊' },
            { value: 'boss', label: 'BOSS', description: '多階段變化，極高威脅' },
            { value: 'disruptor', label: '干擾者', description: 'EMP攻擊，癱瘓防禦' },
            { value: 'illusion', label: '幻象', description: '製造分身，迷惑目標' },
            { value: 'exotic', label: '異常', description: '量子特性，不可預測' },
            { value: 'virus', label: '病毒', description: '感染擴散，系統崩潰' }
        ];
    }
    
    /**
     * 獲取移動類型選項
     */
    getMovementTypes() {
        return [
            { value: 'phase_dash', label: '相位衝刺', description: '瞬間移動攻擊' },
            { value: 'heavy_stomp', label: '重裝踐踏', description: '震撼大地前進' },
            { value: 'glitch_teleport', label: '故障傳送', description: '數位化跳躍' },
            { value: 'swarm_intelligence', label: '蜂群智能', description: '協同進化路徑' },
            { value: 'shadow_drift', label: '暗影漂移', description: '虛空中滑行' },
            { value: 'adaptive', label: '自適應', description: '根據戰況改變' },
            { value: 'erratic_spark', label: '電火花', description: '不規則放電移動' },
            { value: 'deceptive', label: '欺騙性', description: '誤導性軌跡' },
            { value: 'quantum_tunnel', label: '量子隧道', description: '概率性出現' },
            { value: 'viral_spread', label: '病毒擴散', description: '感染式蔓延' }
        ];
    }
    
    /**
     * 獲取AI類型選項
     */
    getAITypes() {
        return [
            { value: 'hunter', label: '獵殺者', description: '鎖定弱點目標' },
            { value: 'fortress', label: '堡壘', description: '堅守推進' },
            { value: 'disruptor', label: '破壞者', description: '癱瘓系統' },
            { value: 'collective', label: '集群', description: '蜂群思維' },
            { value: 'ambusher', label: '伏擊者', description: '暗中出擊' },
            { value: 'boss_ai', label: 'BOSS AI', description: '多階段策略' },
            { value: 'saboteur', label: '破壞專家', description: '系統干擾' },
            { value: 'deceiver', label: '欺詐師', description: '幻象迷惑' },
            { value: 'unpredictable', label: '混沌', description: '完全隨機' },
            { value: 'infectious', label: '感染體', description: '病毒擴散' }
        ];
    }
    
    /**
     * 導出為遊戲格式
     */
    exportForGame() {
        const gameFormat = {};
        
        Object.entries(this.enemies).forEach(([id, enemy]) => {
            gameFormat[id] = {
                // 基本屬性
                speed: enemy.stats.speed,
                health: enemy.stats.health,
                damage: enemy.stats.damage,
                reward: enemy.stats.reward,
                
                // 視覺屬性
                size: enemy.visual.size,
                color: enemy.visual.color,
                shape: enemy.visual.shape,
                
                // 行為屬性
                movementType: enemy.behavior.movementType,
                ai: enemy.behavior.ai,
                specialAbilities: enemy.behavior.specialAbilities || [],
                
                // 元數據
                type: enemy.type,
                name: enemy.name
            };
        });
        
        return gameFormat;
    }
    
    /**
     * 獲取統計信息
     */
    getStatistics() {
        const enemies = Object.values(this.enemies);
        const typeCount = {};
        
        enemies.forEach(enemy => {
            typeCount[enemy.type] = (typeCount[enemy.type] || 0) + 1;
        });
        
        return {
            totalCount: enemies.length,
            typeDistribution: typeCount,
            averageHealth: enemies.reduce((sum, e) => sum + (e.stats.health || 0), 0) / enemies.length || 0,
            averageSpeed: enemies.reduce((sum, e) => sum + (e.stats.speed || 0), 0) / enemies.length || 0,
            averageDamage: enemies.reduce((sum, e) => sum + (e.stats.damage || 0), 0) / enemies.length || 0
        };
    }
    
    /**
     * 搜索敵機
     */
    searchEnemies(query) {
        if (!query) return Object.values(this.enemies);
        
        const searchTerm = query.toLowerCase();
        return Object.values(this.enemies).filter(enemy => 
            enemy.name.toLowerCase().includes(searchTerm) ||
            enemy.id.toLowerCase().includes(searchTerm) ||
            enemy.type.toLowerCase().includes(searchTerm)
        );
    }
    
    /**
     * 清理資源
     */
    destroy() {
        this.enemies = {};
        this.currentEnemyId = null;
        this.isLoaded = false;
        console.log('🧹 敵機編輯器已清理');
    }
}

// 全局訪問
window.EnemyEditor = EnemyEditor;