/**
 * 數據管理器
 * 負責配置文件的讀取、保存和格式轉換
 */
class DataManager {
    constructor() {
        this.configData = new Map();
        this.configPaths = {
            enemies: '../shared/configs/enemies.json',
            weapons: '../shared/configs/weapons.json',
            skills: '../shared/configs/skills.json',
            effects: '../shared/configs/effects.json'
        };
        
        console.log('📁 數據管理器已創建');
    }
    
    /**
     * 初始化數據管理器
     */
    async initialize() {
        try {
            console.log('🔄 開始載入配置文件...');
            
            // 載入現有配置或創建默認配置
            await this.loadAllConfigurations();
            
            console.log('✅ 數據管理器初始化完成');
        } catch (error) {
            console.error('❌ 數據管理器初始化失敗:', error);
            // 創建默認配置
            this.createDefaultConfigurations();
        }
    }
    
    /**
     * 載入所有配置文件
     */
    async loadAllConfigurations() {
        const loadPromises = Object.entries(this.configPaths).map(([type, path]) =>
            this.loadConfiguration(type, path)
        );
        
        await Promise.all(loadPromises);
    }
    
    /**
     * 載入單個配置文件
     */
    async loadConfiguration(type, path) {
        try {
            const response = await fetch(path);
            if (response.ok) {
                const data = await response.json();
                this.configData.set(type, data);
                console.log(`📥 已載入 ${type} 配置`);
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn(`⚠️ 無法載入 ${type} 配置，使用默認配置:`, error.message);
            this.configData.set(type, this.createDefaultConfig(type));
        }
    }
    
    /**
     * 創建默認配置
     */
    createDefaultConfigurations() {
        Object.keys(this.configPaths).forEach(type => {
            this.configData.set(type, this.createDefaultConfig(type));
        });
        
        console.log('🎯 已創建默認配置');
    }
    
    /**
     * 創建特定類型的默認配置
     */
    createDefaultConfig(type) {
        const baseConfig = {
            version: '1.0.0',
            lastModified: new Date().toISOString(),
            editor: 'cyberpunk-cat-defense-editor'
        };
        
        switch (type) {
            case 'enemies':
                return {
                    ...baseConfig,
                    enemies: {
                        sample_enemy: {
                            id: 'sample_enemy',
                            name: '示例敵機',
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
                            }
                        }
                    }
                };
                
            case 'weapons':
                return {
                    ...baseConfig,
                    weapons: {
                        sample_weapon: {
                            id: 'sample_weapon',
                            name: '示例武器',
                            category: 'basic',
                            stats: {
                                damage: 25,
                                fireRate: 1000,
                                range: 300,
                                speed: 400
                            },
                            effects: {
                                piercing: false,
                                explosive: false,
                                homing: false
                            },
                            visual: {
                                bulletColor: '#00ffff',
                                bulletSize: 3,
                                trailEffect: true,
                                muzzleFlash: true
                            }
                        }
                    }
                };
                
            case 'skills':
                return {
                    ...baseConfig,
                    skills: {
                        sample_skill: {
                            id: 'sample_skill',
                            name: '示例技能',
                            category: 'passive',
                            description: '這是一個示例技能',
                            requirements: {
                                minLevel: 1,
                                prerequisites: []
                            },
                            effects: {
                                type: 'stat_boost',
                                target: 'damage',
                                value: 0.2,
                                duration: -1
                            }
                        }
                    }
                };
                
            case 'effects':
                return {
                    ...baseConfig,
                    effects: {
                        sample_effect: {
                            id: 'sample_effect',
                            name: '示例特效',
                            type: 'particle',
                            properties: {
                                particleCount: 20,
                                lifetime: 2.0,
                                color: '#00ffff',
                                size: 3,
                                velocity: 100
                            },
                            animation: {
                                fadeIn: 0.1,
                                fadeOut: 0.5,
                                scale: [1.0, 0.0]
                            }
                        }
                    }
                };
                
            default:
                return { ...baseConfig };
        }
    }
    
    /**
     * 獲取模塊數據
     */
    getModuleData(moduleType) {
        return this.configData.get(moduleType) || this.createDefaultConfig(moduleType);
    }
    
    /**
     * 載入配置 (供編輯器模塊使用)
     */
    async loadConfig(moduleType, forceReload = false) {
        // 如果強制重新載入，先清除快取
        if (forceReload) {
            const key = `editor_config_${moduleType}`;
            localStorage.removeItem(key);
            console.log(`🧹 已清除 ${moduleType} 本地快取`);
        }
        
        // 首先嘗試從 localStorage 載入
        const key = `editor_config_${moduleType}`;
        const stored = localStorage.getItem(key);
        
        if (stored && !forceReload) {
            try {
                const data = JSON.parse(stored);
                this.configData.set(moduleType, data);
                console.log(`📥 從本地存儲載入 ${moduleType} 配置`);
                return data;
            } catch (error) {
                console.warn(`解析本地 ${moduleType} 配置失敗:`, error);
            }
        }
        
        // 如果沒有本地數據或強制重新載入，嘗試從文件載入
        await this.loadConfiguration(moduleType, this.configPaths[moduleType]);
        const existingData = this.configData.get(moduleType);
        if (existingData) {
            return existingData;
        }
        
        // 最後使用默認配置
        const defaultConfig = this.createDefaultConfig(moduleType);
        this.configData.set(moduleType, defaultConfig);
        return defaultConfig;
    }
    
    /**
     * 保存配置 (供編輯器模塊使用)
     */
    async saveConfig(moduleType, configData) {
        return await this.saveModuleData(moduleType, configData);
    }
    
    /**
     * 保存模塊數據
     */
    async saveModuleData(moduleType, data) {
        try {
            // 更新本地數據
            const configData = {
                ...data,
                lastModified: new Date().toISOString(),
                version: '1.0.0'
            };
            
            this.configData.set(moduleType, configData);
            
            // 由於瀏覽器安全限制，我們使用localStorage作為臨時存儲
            // 在實際部署中，這裡應該連接到後端API
            const key = `editor_config_${moduleType}`;
            localStorage.setItem(key, JSON.stringify(configData));
            
            console.log(`💾 已保存 ${moduleType} 配置到本地存儲`);
            
            // 同時生成下載文件
            this.downloadConfigFile(moduleType, configData);
            
            return true;
        } catch (error) {
            console.error(`❌ 保存 ${moduleType} 配置失敗:`, error);
            return false;
        }
    }
    
    /**
     * 下載配置文件
     */
    downloadConfigFile(moduleType, data) {
        const filename = `${moduleType}.json`;
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`📥 配置文件 ${filename} 已準備下載`);
    }
    
    /**
     * 從localStorage載入配置
     */
    loadFromLocalStorage(moduleType) {
        try {
            const key = `editor_config_${moduleType}`;
            const data = localStorage.getItem(key);
            
            if (data) {
                const config = JSON.parse(data);
                this.configData.set(moduleType, config);
                return config;
            }
        } catch (error) {
            console.error(`❌ 從本地存儲載入 ${moduleType} 失敗:`, error);
        }
        
        return null;
    }
    
    /**
     * 導入配置文件
     */
    async importConfigFile(file, moduleType) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    
                    // 驗證配置格式
                    if (this.validateConfig(config, moduleType)) {
                        this.configData.set(moduleType, config);
                        console.log(`📥 已導入 ${moduleType} 配置`);
                        resolve(config);
                    } else {
                        reject(new Error('配置文件格式無效'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('文件讀取失敗'));
            reader.readAsText(file);
        });
    }
    
    /**
     * 驗證配置格式
     */
    validateConfig(config, moduleType) {
        if (!config || typeof config !== 'object') {
            return false;
        }
        
        // 基本字段檢查
        if (!config.version) {
            console.warn('配置缺少版本信息');
        }
        
        // 類型特定驗證
        switch (moduleType) {
            case 'enemies':
                return config.enemies && typeof config.enemies === 'object';
            case 'weapons':
                return config.weapons && typeof config.weapons === 'object';
            case 'skills':
                return config.skills && typeof config.skills === 'object';
            case 'effects':
                return config.effects && typeof config.effects === 'object';
            default:
                return true;
        }
    }
    
    /**
     * 轉換為遊戲格式
     * 將編輯器格式轉換為遊戲引擎可用的格式
     */
    convertToGameFormat(moduleType) {
        const editorData = this.getModuleData(moduleType);
        
        if (!editorData) return null;
        
        switch (moduleType) {
            case 'enemies':
                return this.convertEnemiesForGame(editorData);
            case 'weapons':
                return this.convertWeaponsForGame(editorData);
            default:
                return editorData;
        }
    }
    
    /**
     * 轉換敵機數據為遊戲格式
     */
    convertEnemiesForGame(editorData) {
        const gameFormat = {};
        
        if (editorData.enemies) {
            Object.entries(editorData.enemies).forEach(([id, enemy]) => {
                gameFormat[id] = {
                    speed: enemy.stats.speed,
                    health: enemy.stats.health,
                    color: enemy.visual.color,
                    size: enemy.visual.size,
                    reward: enemy.stats.reward,
                    damage: enemy.stats.damage
                };
            });
        }
        
        return gameFormat;
    }
    
    /**
     * 轉換武器數據為遊戲格式
     */
    convertWeaponsForGame(editorData) {
        const gameFormat = {};
        
        if (editorData.weapons) {
            Object.entries(editorData.weapons).forEach(([id, weapon]) => {
                gameFormat[id] = {
                    damage: weapon.stats.damage,
                    speed: weapon.stats.speed,
                    fireRate: weapon.stats.fireRate,
                    color: weapon.visual.bulletColor,
                    size: weapon.visual.bulletSize,
                    piercing: weapon.effects.piercing,
                    explosive: weapon.effects.explosive
                };
            });
        }
        
        return gameFormat;
    }
    
    /**
     * 獲取資源列表
     */
    getAssetList(moduleType) {
        const data = this.getModuleData(moduleType);
        
        if (!data) return [];
        
        const assetsKey = moduleType; // enemies, weapons, etc.
        const assets = data[assetsKey] || {};
        
        return Object.entries(assets).map(([id, asset]) => ({
            id,
            name: asset.name || id,
            type: asset.type || asset.category || 'unknown',
            lastModified: asset.lastModified || data.lastModified
        }));
    }
    
    /**
     * 獲取單個資源
     */
    getAsset(moduleType, assetId) {
        const data = this.getModuleData(moduleType);
        if (!data || !data[moduleType]) return null;
        
        return data[moduleType][assetId] || null;
    }
    
    /**
     * 更新資源
     */
    updateAsset(moduleType, assetId, assetData) {
        const data = this.getModuleData(moduleType);
        if (!data[moduleType]) {
            data[moduleType] = {};
        }
        
        data[moduleType][assetId] = {
            ...assetData,
            id: assetId,
            lastModified: new Date().toISOString()
        };
        
        this.configData.set(moduleType, data);
    }
    
    /**
     * 刪除資源
     */
    deleteAsset(moduleType, assetId) {
        const data = this.getModuleData(moduleType);
        if (data[moduleType] && data[moduleType][assetId]) {
            delete data[moduleType][assetId];
            this.configData.set(moduleType, data);
            return true;
        }
        return false;
    }
    
    /**
     * 創建新資源
     */
    createAsset(moduleType, assetId, templateData = null) {
        const data = this.getModuleData(moduleType);
        if (!data[moduleType]) {
            data[moduleType] = {};
        }
        
        // 使用模板或默認數據
        const newAsset = templateData || this.getDefaultAssetTemplate(moduleType);
        newAsset.id = assetId;
        newAsset.name = newAsset.name || assetId;
        newAsset.lastModified = new Date().toISOString();
        
        data[moduleType][assetId] = newAsset;
        this.configData.set(moduleType, data);
        
        return newAsset;
    }
    
    /**
     * 獲取默認資源模板
     */
    getDefaultAssetTemplate(moduleType) {
        const templates = {
            enemies: {
                name: '新敵機',
                type: 'normal',
                stats: { health: 100, speed: 2.0, damage: 15, reward: 20 },
                visual: { size: 12, color: '#ff6600', shape: 'circle' },
                behavior: { movementType: 'straight', specialAbilities: [], ai: 'basic' }
            },
            weapons: {
                name: '新武器',
                category: 'basic',
                stats: { damage: 25, fireRate: 1000, range: 300, speed: 400 },
                effects: { piercing: false, explosive: false, homing: false },
                visual: { bulletColor: '#00ffff', bulletSize: 3, trailEffect: true }
            }
        };
        
        return JSON.parse(JSON.stringify(templates[moduleType] || {}));
    }
}

// 全局訪問
window.DataManager = DataManager;