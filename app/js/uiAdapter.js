// UI適配系統 - 統一管理不同平台的UI布局和定位
// 支援PC/平板/手機三種平台的自適應佈局

class UIAdapter {
    constructor() {
        this.currentConfig = null;
        this.lastCanvasInfo = null;
        this.updateConfig();
        
        // 監聽窗口大小變化
        this.boundUpdateConfig = this.updateConfig.bind(this);
        window.addEventListener('resize', this.boundUpdateConfig);
        window.addEventListener('orientationchange', this.boundUpdateConfig);
    }
    
    // 平台檢測
    detectPlatform() {
        const isTouchDevice = window.mobileControls && window.mobileControls.isEnabled;
        const actualDisplayWidth = window.innerWidth;
        const actualDisplayHeight = window.innerHeight;
        
        // 手機檢測：觸控設備且螢幕寬度小於700px
        const isMobileScreen = actualDisplayWidth < 700;
        
        if (isTouchDevice && isMobileScreen) {
            return 'mobile';
        } else if (isTouchDevice) {
            return 'tablet';
        } else {
            return 'pc';
        }
    }
    
    // 更新配置
    updateConfig(canvas = null) {
        const platform = this.detectPlatform();
        
        // 如果配置沒有變化，避免重複更新
        const currentCanvas = canvas ? `${canvas.width}x${canvas.height}` : 'null';
        if (this.lastCanvasInfo === currentCanvas && this.currentConfig) {
            return;
        }
        this.lastCanvasInfo = currentCanvas;
        
        console.log(`🎯 updateConfig 被調用: canvas=${currentCanvas}`);
        
        // 始終使用邏輯座標系統(800x600)，不受devicePixelRatio影響
        let displayWidth, displayHeight;
        if (canvas) {
            // 檢查是否有scale變換，如果有則使用邏輯尺寸
            const pixelRatio = window.devicePixelRatio || 1;
            if (canvas.width === 800 * pixelRatio && canvas.height === 600 * pixelRatio) {
                // 桌面模式：使用邏輯尺寸
                displayWidth = 800;
                displayHeight = 600;
                console.log(`📐 使用邏輯尺寸: ${displayWidth}x${displayHeight} (物理尺寸: ${canvas.width}x${canvas.height})`);
            } else {
                // 手機模式：直接使用canvas尺寸
                displayWidth = canvas.width;
                displayHeight = canvas.height;
                console.log(`📐 使用canvas尺寸: ${displayWidth}x${displayHeight}`);
            }
        } else {
            // 沒有canvas時使用標準遊戲尺寸
            displayWidth = 800;
            displayHeight = 600;
            console.log(`📐 使用默認尺寸: ${displayWidth}x${displayHeight}`);
        }
        
        console.log(`🔧 UI適配: 平台=${platform}, 尺寸=${displayWidth}x${displayHeight}`);
        
        // 調試信息：顯示計算後的配置值
        const config = this.getPlatformConfig(platform, displayWidth, displayHeight);
        if (config.textEffects && config.textEffects.combo) {
            console.log(`📍 COMBO配置: centerY=${config.textEffects.combo.centerY}, fontSize=${config.textEffects.combo.fontSize}`);
        }
        if (config.upgradeUI) {
            console.log(`📋 升級UI配置: titleY=${config.upgradeUI.titleY}, cardHeight=${config.upgradeUI.cardHeight}`);
        }
        
        this.currentConfig = {
            platform,
            displayWidth,
            displayHeight,
            ...this.getPlatformConfig(platform, displayWidth, displayHeight)
        };
    }
    
    // 獲取平台特定配置
    getPlatformConfig(platform, displayWidth, displayHeight) {
        switch (platform) {
            case 'mobile':
                return this.getMobileConfig(displayWidth, displayHeight);
            case 'tablet':
                return this.getTabletConfig(displayWidth, displayHeight);
            case 'pc':
            default:
                return this.getPCConfig(displayWidth, displayHeight);
        }
    }
    
    // 手機配置
    getMobileConfig(displayWidth, displayHeight) {
        return {
            // 升級UI配置
            upgradeUI: {
                cardWidth: Math.min(280, displayWidth - 60),
                cardHeight: Math.min(360, Math.max(250, displayHeight - 150)), // 手機確保最小高度
                cardSpacing: 20,
                layout: 'swipeable',
                maxCardsPerRow: 1,
                enableSwipe: true,
                titleY: displayHeight * 0.28, // 28%canvas高度，避開COMBO區域
                instructionY: displayHeight * 0.9 // 90%canvas高度
            },
            
            // 文字特效配置 - 基於canvas內部座標系統
            textEffects: {
                levelUp: {
                    centerX: displayWidth / 2,     // 400
                    centerY: displayHeight / 2,    // 300
                    fontSize: 36
                },
                combo: {
                    centerX: displayWidth / 2,     // 400
                    centerY: displayHeight * 0.18, // 108 (18%，安全位置)
                    fontSize: 24
                },
                expGain: {
                    baseX: displayWidth - 100,     // 700
                    baseY: displayHeight * 0.25    // 150
                }
            },
            
            // 布局參數
            layout: {
                safeAreaTop: 40,
                safeAreaBottom: 40,
                safeAreaLeft: 20,
                safeAreaRight: 20
            },
            
            // 字體縮放
            fontScale: 0.8,
            
            // 間距調整
            spacing: {
                small: 5,
                medium: 10,
                large: 20
            }
        };
    }
    
    // 平板配置
    getTabletConfig(displayWidth, displayHeight) {
        // 使用固定尺寸，確保穩定性
        return {
            // 升級UI配置
            upgradeUI: {
                cardWidth: 180,     // 固定卡片寬度
                cardHeight: 260,    // 固定卡片高度
                cardSpacing: 40,    // 固定間距
                layout: 'horizontal',
                maxCardsPerRow: 3,
                enableSwipe: false,
                titleY: displayHeight * 0.28, // 28%canvas高度，三平台一致
                instructionY: displayHeight * 0.9 // 90%canvas高度
            },
            
            // 文字特效配置 - 基於canvas內部座標系統
            textEffects: {
                levelUp: {
                    centerX: displayWidth / 2,     // 400
                    centerY: displayHeight / 2,    // 300
                    fontSize: 42
                },
                combo: {
                    centerX: displayWidth / 2,     // 400
                    centerY: displayHeight * 0.18, // 108 (一致的安全位置)
                    fontSize: 28
                },
                expGain: {
                    baseX: displayWidth - 120,     // 680
                    baseY: displayHeight * 0.25    // 150
                }
            },
            
            // 布局參數
            layout: {
                safeAreaTop: 50,
                safeAreaBottom: 50,
                safeAreaLeft: 30,
                safeAreaRight: 30
            },
            
            // 字體縮放
            fontScale: 0.9,
            
            // 間距調整
            spacing: {
                small: 8,
                medium: 15,
                large: 30
            }
        };
    }
    
    // PC配置
    getPCConfig(displayWidth, displayHeight) {
        return {
            // 升級UI配置
            upgradeUI: {
                cardWidth: 200,
                cardHeight: Math.min(280, Math.max(220, displayHeight - 200)), // PC確保合適高度
                cardSpacing: 50,
                layout: 'horizontal',
                maxCardsPerRow: 3,
                enableSwipe: false,
                titleY: displayHeight * 0.28, // 28%canvas高度，三平台一致
                instructionY: displayHeight * 0.9 // 90%canvas高度
            },
            
            // 文字特效配置 - 基於canvas內部座標系統
            textEffects: {
                levelUp: {
                    centerX: displayWidth / 2,     // 400
                    centerY: displayHeight / 2,    // 300
                    fontSize: 48
                },
                combo: {
                    centerX: displayWidth / 2,     // 400
                    centerY: displayHeight * 0.18, // 108 (三平台一致)
                    fontSize: 32
                },
                expGain: {
                    baseX: displayWidth - 140,     // 660
                    baseY: displayHeight * 0.25    // 150
                }
            },
            
            // 布局參數
            layout: {
                safeAreaTop: 50,
                safeAreaBottom: 50,
                safeAreaLeft: 50,
                safeAreaRight: 50
            },
            
            // 字體縮放
            fontScale: 1.0,
            
            // 間距調整
            spacing: {
                small: 10,
                medium: 20,
                large: 40
            }
        };
    }
    
    // 獲取當前配置
    getConfig(canvas = null) {
        if (!this.currentConfig || canvas) {
            this.updateConfig(canvas);
        }
        return this.currentConfig;
    }
    
    // 獲取特定模組配置
    getModuleConfig(moduleName, canvas = null) {
        const config = this.getConfig(canvas);
        return config[moduleName] || {};
    }
    
    // 獲取安全區域邊界
    getSafeArea() {
        const config = this.getConfig();
        return {
            top: config.layout.safeAreaTop,
            bottom: config.displayHeight - config.layout.safeAreaBottom,
            left: config.layout.safeAreaLeft,
            right: config.displayWidth - config.layout.safeAreaRight,
            width: config.displayWidth - config.layout.safeAreaLeft - config.layout.safeAreaRight,
            height: config.displayHeight - config.layout.safeAreaTop - config.layout.safeAreaBottom
        };
    }
    
    // 計算居中位置
    getCenterPosition(width = 0, height = 0) {
        const config = this.getConfig();
        return {
            x: (config.displayWidth - width) / 2,
            y: (config.displayHeight - height) / 2
        };
    }
    
    // 縮放字體大小
    scaleFont(baseFontSize) {
        const config = this.getConfig();
        return Math.floor(baseFontSize * config.fontScale);
    }
    
    // 調整間距
    adjustSpacing(size) {
        const config = this.getConfig();
        if (size <= 10) return config.spacing.small;
        if (size <= 30) return config.spacing.medium;
        return config.spacing.large;
    }
    
    // 檢查是否為觸控設備
    isTouchDevice() {
        const config = this.getConfig();
        return config.platform === 'mobile' || config.platform === 'tablet';
    }
    
    // 檢查是否為手機
    isMobile() {
        const config = this.getConfig();
        return config.platform === 'mobile';
    }
    
    // 檢查是否為平板
    isTablet() {
        const config = this.getConfig();
        return config.platform === 'tablet';
    }
    
    // 檢查是否為PC
    isPC() {
        const config = this.getConfig();
        return config.platform === 'pc';
    }
    
    // 計算響應式尺寸
    getResponsiveSize(baseSize, mobileScale = 0.8, tabletScale = 0.9) {
        const config = this.getConfig();
        switch (config.platform) {
            case 'mobile':
                return Math.floor(baseSize * mobileScale);
            case 'tablet':
                return Math.floor(baseSize * tabletScale);
            default:
                return baseSize;
        }
    }
    
    // 銷毀適配器
    destroy() {
        if (this.boundUpdateConfig) {
            window.removeEventListener('resize', this.boundUpdateConfig);
            window.removeEventListener('orientationchange', this.boundUpdateConfig);
        }
    }
}

// 創建全局實例
window.uiAdapter = new UIAdapter();

// 導出類
window.UIAdapter = UIAdapter;