// 模組載入器
// 管理 JavaScript 模組的載入順序和依賴關係

class ModuleLoader {
    constructor() {
        this.modules = new Map();
        this.loadedModules = new Set();
        this.loadingModules = new Set();
        this.moduleCallbacks = new Map();
    }
    
    // 定義模組
    define(name, dependencies, factory) {
        if (this.modules.has(name)) {
            console.warn(`Module ${name} is already defined`);
            return;
        }
        
        this.modules.set(name, {
            name,
            dependencies,
            factory,
            exports: null,
            loaded: false
        });
        
        // 如果有等待這個模組的回調，執行它們
        if (this.moduleCallbacks.has(name)) {
            const callbacks = this.moduleCallbacks.get(name);
            callbacks.forEach(callback => callback());
            this.moduleCallbacks.delete(name);
        }
    }
    
    // 載入模組
    async require(moduleNames, callback) {
        if (!Array.isArray(moduleNames)) {
            moduleNames = [moduleNames];
        }
        
        const modules = await Promise.all(
            moduleNames.map(name => this.loadModule(name))
        );
        
        if (callback) {
            callback(...modules);
        }
        
        return modules.length === 1 ? modules[0] : modules;
    }
    
    // 載入單個模組
    async loadModule(name) {
        // 如果已經載入，直接返回
        if (this.loadedModules.has(name)) {
            return this.modules.get(name).exports;
        }
        
        // 如果正在載入，等待完成
        if (this.loadingModules.has(name)) {
            return new Promise((resolve) => {
                if (!this.moduleCallbacks.has(name)) {
                    this.moduleCallbacks.set(name, []);
                }
                this.moduleCallbacks.get(name).push(() => {
                    resolve(this.modules.get(name).exports);
                });
            });
        }
        
        // 檢查模組是否存在
        if (!this.modules.has(name)) {
            throw new Error(`Module ${name} not found`);
        }
        
        const module = this.modules.get(name);
        this.loadingModules.add(name);
        
        try {
            // 載入依賴
            const deps = await Promise.all(
                module.dependencies.map(dep => this.loadModule(dep))
            );
            
            // 執行模組工廠函數
            module.exports = module.factory(...deps);
            module.loaded = true;
            
            this.loadedModules.add(name);
            this.loadingModules.delete(name);
            
            return module.exports;
        } catch (error) {
            this.loadingModules.delete(name);
            throw new Error(`Failed to load module ${name}: ${error.message}`);
        }
    }
    
    // 檢查模組是否已載入
    isLoaded(name) {
        return this.loadedModules.has(name);
    }
    
    // 獲取所有已載入的模組
    getLoadedModules() {
        return Array.from(this.loadedModules);
    }
    
    // 清除所有模組
    clear() {
        this.modules.clear();
        this.loadedModules.clear();
        this.loadingModules.clear();
        this.moduleCallbacks.clear();
    }
}

// 創建全局模組載入器
window.moduleLoader = new ModuleLoader();

// 簡化的全局函數
window.define = (name, deps, factory) => {
    if (typeof deps === 'function') {
        factory = deps;
        deps = [];
    }
    window.moduleLoader.define(name, deps, factory);
};

window.require = (modules, callback) => {
    return window.moduleLoader.require(modules, callback);
};

// 遊戲模組配置
const GameModules = {
    // 核心模組
    CORE: {
        EventBus: 'core/EventBus',
        Constants: 'core/Constants',
        Config: 'core/Config',
        Game: 'core/Game'
    },
    
    // 實體模組
    ENTITIES: {
        Base: 'entities/Base',
        Enemy: 'entities/Enemy',
        Projectile: 'entities/Projectile',
        Bullet: 'entities/Bullet'
    },
    
    // 系統模組
    SYSTEMS: {
        UpgradeSystem: 'systems/UpgradeSystem',
        WaveSystem: 'systems/WaveSystem',
        InputSystem: 'systems/InputSystem',
        SpatialGrid: 'systems/SpatialGrid',
        ObjectPool: 'systems/ObjectPool'
    },
    
    // 管理器模組
    MANAGERS: {
        EnemyManager: 'managers/EnemyManager',
        ProjectileManager: 'managers/ProjectileManager',
        ParticleManager: 'managers/ParticleManager'
    },
    
    // 渲染模組
    RENDERING: {
        BaseRenderer: 'rendering/BaseRenderer',
        UIRenderer: 'rendering/UIRenderer'
    },
    
    // 工具模組
    UTILS: {
        Math: 'utils/Math',
        Performance: 'utils/Performance'
    }
};

window.GameModules = GameModules;