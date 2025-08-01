// 移動版特定配置
window.MobileConfig = {
    // 平台檢測
    isCapacitor: window.Capacitor !== undefined,
    isAndroid: window.Capacitor && window.Capacitor.getPlatform() === 'android',
    isIOS: window.Capacitor && window.Capacitor.getPlatform() === 'ios',
    
    // 廣告配置
    ads: {
        // AdMob 測試 ID（發布時需要替換為真實 ID）
        androidBannerId: 'ca-app-pub-3940256099942544/6300978111',
        androidInterstitialId: 'ca-app-pub-3940256099942544/1033173712',
        androidRewardedId: 'ca-app-pub-3940256099942544/5224354917',
        
        iosBannerId: 'ca-app-pub-3940256099942544/2934735716',
        iosInterstitialId: 'ca-app-pub-3940256099942544/4411468910',
        iosRewardedId: 'ca-app-pub-3940256099942544/1712485313',
        
        // 廣告頻率控制
        interstitialFrequency: 3, // 每 3 波顯示一次插頁廣告
        rewardedCooldown: 300000, // 獎勵廣告冷卻時間 5 分鐘
    },
    
    // 性能優化
    performance: {
        // 移動版降低粒子數量
        maxParticles: 50,
        maxProjectiles: 30,
        maxEnemies: 20,
        
        // 降低特效品質
        enableGlow: false,
        enableBlur: false,
        particleQuality: 0.5,
    },
    
    // 遊戲調整
    gameplay: {
        // 移動版增加金幣獎勵（補償廣告打擾）
        goldMultiplier: 1.2,
        
        // 復活機制
        reviveEnabled: true,
        reviveHealthPercent: 0.5,
        reviveCost: 'watch_ad', // 看廣告復活
    },
    
    // UI 調整
    ui: {
        // 移動版按鈕放大
        buttonScale: 1.2,
        
        // 廣告按鈕位置
        adButtonPosition: {
            x: 20,
            y: 20,
        },
    },
    
    // 初始化移動版特定功能
    init() {
        console.log('🎮 移動版配置已載入');
        console.log(`📱 平台: ${this.isAndroid ? 'Android' : this.isIOS ? 'iOS' : '未知'}`);
        
        // 覆蓋部分遊戲配置
        if (window.GameConfig && this.isCapacitor) {
            // 調整性能設置
            GameConfig.PERFORMANCE.MAX_PARTICLES = this.performance.maxParticles;
            GameConfig.PERFORMANCE.MAX_PROJECTILES = this.performance.maxProjectiles;
            GameConfig.PERFORMANCE.MAX_ENEMIES = this.performance.maxEnemies;
            
            console.log('✨ 已應用移動版性能優化');
        }
        
        // 監聽返回鍵（Android）
        if (this.isAndroid && window.App) {
            window.App.addListener('backButton', () => {
                // 如果在遊戲中，顯示暫停選單
                if (window.game && window.game.isPlaying) {
                    window.game.pause();
                    this.showExitDialog();
                }
            });
        }
        
        // 監聽應用進入後台
        if (window.App) {
            window.App.addListener('pause', () => {
                // 自動暫停遊戲
                if (window.game && window.game.isPlaying) {
                    window.game.pause();
                }
            });
        }
    },
    
    // 顯示退出對話框
    showExitDialog() {
        const confirmed = confirm('確定要退出遊戲嗎？');
        if (confirmed && window.App) {
            window.App.exitApp();
        } else if (window.game) {
            window.game.resume();
        }
    }
};

// 自動初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.MobileConfig.init();
    });
} else {
    window.MobileConfig.init();
}