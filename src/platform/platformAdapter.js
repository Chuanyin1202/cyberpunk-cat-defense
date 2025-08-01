/**
 * 平台適配器
 * 負責載入平台特定的配置和功能
 */

import { PlatformDetector } from './platformDetector.js';

export class PlatformAdapter {
    // 平台配置緩存
    static platformConfig = null;
    
    /**
     * 初始化平台適配器
     * @param {string} platform - 平台類型
     */
    static async initialize(platform) {
        console.log(`Initializing platform adapter for: ${platform}`);
        
        try {
            // 載入基礎配置
            await this.loadBaseConfig();
            
            // 載入平台特定配置
            await this.loadPlatformConfig(platform);
            
            // 初始化平台特定模組
            await this.initializePlatformModules(platform);
            
            console.log('Platform adapter initialized successfully');
        } catch (error) {
            console.error('Failed to initialize platform adapter:', error);
            throw error;
        }
    }
    
    /**
     * 載入基礎配置
     */
    static async loadBaseConfig() {
        try {
            // 動態載入核心配置
            const modules = await Promise.all([
                import('../core/config/config.js'),
                import('../core/config/constants.js')
            ]);
            
            // 合併到全局
            window.GameConfig = modules[0].GameConfig;
            window.GameConstants = modules[1].GameConstants;
            
        } catch (error) {
            console.error('Failed to load base config:', error);
            throw error;
        }
    }
    
    /**
     * 載入平台特定配置
     * @param {string} platform - 平台類型
     * @returns {Object} 平台配置
     */
    static async loadPlatformConfig(platform) {
        const deviceType = PlatformDetector.getDeviceType();
        
        try {
            let configModule;
            
            // 根據設備類型載入對應配置
            switch (deviceType) {
                case 'mobile':
                case 'tablet':
                    configModule = await import('./mobile/config/mobileConfig.js');
                    break;
                case 'desktop':
                    configModule = await import('./desktop/config/desktopConfig.js');
                    break;
                default:
                    configModule = await import('./desktop/config/desktopConfig.js');
            }
            
            // 載入平台配置類
            const platformConfigModule = await import('./mobile/config/platformConfig.js');
            window.PlatformConfig = platformConfigModule.PlatformConfig;
            
            // 合併配置
            this.platformConfig = this.mergeConfigs(
                window.GameConfig,
                configModule.default || configModule.config,
                platform
            );
            
            return this.platformConfig;
            
        } catch (error) {
            console.error(`Failed to load platform config for ${platform}:`, error);
            // 返回預設配置
            return this.getDefaultConfig();
        }
    }
    
    /**
     * 初始化平台特定模組
     * @param {string} platform - 平台類型
     */
    static async initializePlatformModules(platform) {
        const modules = [];
        
        try {
            // 根據平台載入對應模組
            if (platform.includes('mobile') || platform.includes('tablet')) {
                // 載入移動控制
                modules.push(import('./mobile/controls/mobileControls.js'));
                modules.push(import('./mobile/controls/touchEnhancer.js'));
            }
            
            if (platform.includes('app')) {
                // 載入原生功能
                if (platform.includes('mobile') || platform.includes('tablet')) {
                    modules.push(this.loadCapacitorModules());
                } else if (platform.includes('desktop')) {
                    modules.push(this.loadElectronModules());
                }
            }
            
            // 等待所有模組載入
            await Promise.all(modules);
            
        } catch (error) {
            console.error('Failed to initialize platform modules:', error);
            // 繼續執行，某些模組失敗不應導致整個遊戲無法運行
        }
    }
    
    /**
     * 載入 Capacitor 模組（移動原生功能）
     */
    static async loadCapacitorModules() {
        if (!window.Capacitor) return;
        
        try {
            // 載入原生功能模組
            const modules = await Promise.all([
                import('./native/capacitor/haptics.js'),
                import('./native/capacitor/audio.js'),
                import('./native/capacitor/storage.js')
            ]);
            
            // 初始化模組
            modules.forEach(module => {
                if (module.default && module.default.initialize) {
                    module.default.initialize();
                }
            });
            
        } catch (error) {
            console.error('Failed to load Capacitor modules:', error);
        }
    }
    
    /**
     * 載入 Electron 模組（桌面原生功能）
     */
    static async loadElectronModules() {
        if (!window.electron) return;
        
        try {
            // 載入桌面原生功能
            const modules = await Promise.all([
                import('./native/electron/window.js'),
                import('./native/electron/steam.js')
            ]);
            
            // 初始化模組
            modules.forEach(module => {
                if (module.default && module.default.initialize) {
                    module.default.initialize();
                }
            });
            
        } catch (error) {
            console.error('Failed to load Electron modules:', error);
        }
    }
    
    /**
     * 初始化平台特定功能
     * @param {Object} game - 遊戲實例
     * @param {string} platform - 平台類型
     */
    static async initializePlatformFeatures(game, platform) {
        try {
            // 設置全局遊戲實例引用
            window.game = game;
            
            // 初始化輸入系統
            if (platform.includes('mobile') || platform.includes('tablet')) {
                // 移動設備使用觸控
                if (window.MobileControls) {
                    window.mobileControls = new window.MobileControls(game);
                }
                if (window.TouchEnhancer) {
                    game.touchEnhancer = new window.TouchEnhancer(game);
                }
            }
            
            // 初始化平台特定 UI
            await this.initializePlatformUI(platform);
            
            // 註冊平台特定事件
            this.registerPlatformEvents(platform);
            
        } catch (error) {
            console.error('Failed to initialize platform features:', error);
        }
    }
    
    /**
     * 初始化平台特定 UI
     * @param {string} platform - 平台類型
     */
    static async initializePlatformUI(platform) {
        // 根據平台調整 UI
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        
        if (platform.includes('mobile') || platform.includes('tablet')) {
            // 移動設備全螢幕
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
            canvas.style.border = 'none';
        } else {
            // 桌面設備固定尺寸
            canvas.style.width = '800px';
            canvas.style.height = '600px';
            canvas.style.border = '2px solid #00ffff';
        }
    }
    
    /**
     * 註冊平台特定事件
     * @param {string} platform - 平台類型
     */
    static registerPlatformEvents(platform) {
        // 處理螢幕旋轉
        if (platform.includes('mobile') || platform.includes('tablet')) {
            window.addEventListener('orientationchange', () => {
                this.handleOrientationChange();
            });
        }
        
        // 處理視窗大小變化
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // 處理應用程式生命週期（原生應用）
        if (platform.includes('app')) {
            document.addEventListener('pause', () => {
                if (window.game) window.game.pause();
            });
            
            document.addEventListener('resume', () => {
                if (window.game) window.game.resume();
            });
        }
    }
    
    /**
     * 處理螢幕旋轉
     */
    static handleOrientationChange() {
        const orientation = window.orientation;
        console.log(`Orientation changed to: ${orientation}`);
        
        // 重新調整遊戲視圖
        if (window.game && window.game.handleOrientationChange) {
            window.game.handleOrientationChange(orientation);
        }
    }
    
    /**
     * 處理視窗大小變化
     */
    static handleResize() {
        const screenInfo = PlatformDetector.getScreenInfo();
        console.log(`Window resized to: ${screenInfo.width}x${screenInfo.height}`);
        
        // 通知遊戲調整
        if (window.game && window.game.handleResize) {
            window.game.handleResize(screenInfo);
        }
    }
    
    /**
     * 合併配置
     * @param {Object} baseConfig - 基礎配置
     * @param {Object} platformConfig - 平台配置
     * @param {string} platform - 平台類型
     * @returns {Object} 合併後的配置
     */
    static mergeConfigs(baseConfig, platformConfig, platform) {
        // 深度合併配置
        const merged = JSON.parse(JSON.stringify(baseConfig || {}));
        
        // 應用平台特定配置
        if (platformConfig) {
            Object.keys(platformConfig).forEach(key => {
                if (typeof platformConfig[key] === 'object' && !Array.isArray(platformConfig[key])) {
                    merged[key] = { ...merged[key], ...platformConfig[key] };
                } else {
                    merged[key] = platformConfig[key];
                }
            });
        }
        
        // 添加平台資訊
        merged.PLATFORM = platform;
        merged.PLATFORM_INFO = PlatformDetector.getPlatformInfo();
        
        return merged;
    }
    
    /**
     * 獲取預設配置
     * @returns {Object}
     */
    static getDefaultConfig() {
        return {
            CANVAS: {
                WIDTH: 800,
                HEIGHT: 600,
                FPS: 60
            },
            PLATFORM: 'unknown',
            PLATFORM_INFO: PlatformDetector.getPlatformInfo()
        };
    }
}