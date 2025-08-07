/**
 * 廣告管理器 - 移動版廣告整合
 * 目前為佔位符，未來可整合實際廣告 SDK
 */

window.AdManager = {
    // 廣告配置
    config: {
        enabled: false,  // 預設關閉廣告
        testMode: true,  // 測試模式
        adFrequency: 3,  // 每幾波顯示一次廣告
        rewardedAdBonus: 50  // 獎勵廣告金幣獎勵
    },

    // 初始化廣告 SDK
    initialize() {
        console.log('📱 AdManager: 初始化廣告系統');
        // 未來整合實際廣告 SDK
        return Promise.resolve();
    },

    // 顯示插頁廣告
    showInterstitial() {
        if (!this.config.enabled) {
            console.log('📱 AdManager: 廣告已禁用');
            return Promise.resolve();
        }
        
        console.log('📱 AdManager: 顯示插頁廣告（模擬）');
        // 未來實作
        return Promise.resolve();
    },

    // 顯示獎勵廣告
    showRewarded(callback) {
        if (!this.config.enabled) {
            console.log('📱 AdManager: 廣告已禁用');
            if (callback) callback(false);
            return Promise.resolve();
        }
        
        console.log('📱 AdManager: 顯示獎勵廣告（模擬）');
        // 模擬獎勵
        if (callback) {
            setTimeout(() => {
                callback(true);  // 模擬成功觀看
            }, 100);
        }
        return Promise.resolve();
    },

    // 檢查廣告是否準備好
    isInterstitialReady() {
        return this.config.enabled;
    },

    // 檢查獎勵廣告是否準備好
    isRewardedReady() {
        return this.config.enabled;
    },

    // 預載廣告
    preloadAds() {
        if (!this.config.enabled) return;
        console.log('📱 AdManager: 預載廣告');
        // 未來實作
    },

    // 設置廣告狀態
    setEnabled(enabled) {
        this.config.enabled = enabled;
        console.log(`📱 AdManager: 廣告${enabled ? '啟用' : '禁用'}`);
    }
};

// 自動初始化
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        AdManager.initialize();
    });
}