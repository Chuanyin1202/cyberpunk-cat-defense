// 廣告管理系統
class AdManager {
    constructor() {
        this.initialized = false;
        this.isTestMode = true; // 開發時使用測試廣告
        this.adCallbacks = new Map();
        this.lastInterstitialTime = 0;
        this.lastRewardedTime = 0;
        
        // 廣告載入狀態
        this.interstitialReady = false;
        this.rewardedReady = false;
        
        console.log('🎯 廣告管理器已創建');
    }
    
    // 初始化 AdMob
    async initialize() {
        if (!window.Capacitor || !window.AdMob) {
            console.warn('❌ AdMob 插件未找到');
            return false;
        }
        
        try {
            await AdMob.initialize({
                requestTrackingAuthorization: true,
                testDeviceIds: ['YOUR_TEST_DEVICE_ID'], // 替換為您的測試設備 ID
                initializeForTesting: this.isTestMode,
            });
            
            this.initialized = true;
            console.log('✅ AdMob 初始化成功');
            
            // 預載入廣告
            this.preloadInterstitial();
            this.preloadRewarded();
            
            // 設置事件監聽器
            this.setupEventListeners();
            
            return true;
        } catch (error) {
            console.error('❌ AdMob 初始化失敗:', error);
            return false;
        }
    }
    
    // 設置事件監聽器
    setupEventListeners() {
        // 插頁廣告事件
        AdMob.addListener('interstitialAdLoaded', () => {
            console.log('📢 插頁廣告已載入');
            this.interstitialReady = true;
        });
        
        AdMob.addListener('interstitialAdFailedToLoad', (error) => {
            console.error('❌ 插頁廣告載入失敗:', error);
            this.interstitialReady = false;
        });
        
        AdMob.addListener('interstitialAdDismissed', () => {
            console.log('📢 插頁廣告已關閉');
            this.interstitialReady = false;
            // 預載入下一個
            setTimeout(() => this.preloadInterstitial(), 1000);
        });
        
        // 獎勵廣告事件
        AdMob.addListener('rewardedAdLoaded', () => {
            console.log('🎁 獎勵廣告已載入');
            this.rewardedReady = true;
        });
        
        AdMob.addListener('rewardedAdFailedToLoad', (error) => {
            console.error('❌ 獎勵廣告載入失敗:', error);
            this.rewardedReady = false;
        });
        
        AdMob.addListener('rewardedAdDismissed', () => {
            console.log('🎁 獎勵廣告已關閉');
            this.rewardedReady = false;
            // 預載入下一個
            setTimeout(() => this.preloadRewarded(), 1000);
        });
        
        AdMob.addListener('rewardedAdRewarded', (reward) => {
            console.log('🎉 用戶獲得獎勵:', reward);
            // 執行獎勵回調
            const callback = this.adCallbacks.get('rewarded');
            if (callback) {
                callback(true);
                this.adCallbacks.delete('rewarded');
            }
        });
    }
    
    // 預載入插頁廣告
    async preloadInterstitial() {
        if (!this.initialized) return;
        
        const adId = window.MobileConfig.isAndroid 
            ? window.MobileConfig.ads.androidInterstitialId 
            : window.MobileConfig.ads.iosInterstitialId;
        
        try {
            await AdMob.prepareInterstitial({
                adId: adId,
                isTesting: this.isTestMode,
            });
        } catch (error) {
            console.error('預載入插頁廣告失敗:', error);
        }
    }
    
    // 預載入獎勵廣告
    async preloadRewarded() {
        if (!this.initialized) return;
        
        const adId = window.MobileConfig.isAndroid 
            ? window.MobileConfig.ads.androidRewardedId 
            : window.MobileConfig.ads.iosRewardedId;
        
        try {
            await AdMob.prepareRewardVideo({
                adId: adId,
                isTesting: this.isTestMode,
            });
        } catch (error) {
            console.error('預載入獎勵廣告失敗:', error);
        }
    }
    
    // 顯示插頁廣告
    async showInterstitial() {
        if (!this.initialized || !this.interstitialReady) {
            console.warn('插頁廣告未準備好');
            return false;
        }
        
        // 檢查頻率限制
        const now = Date.now();
        if (now - this.lastInterstitialTime < 60000) { // 最少間隔 1 分鐘
            console.log('插頁廣告冷卻中');
            return false;
        }
        
        try {
            await AdMob.showInterstitial();
            this.lastInterstitialTime = now;
            return true;
        } catch (error) {
            console.error('顯示插頁廣告失敗:', error);
            return false;
        }
    }
    
    // 顯示獎勵廣告
    async showRewarded(callback) {
        if (!this.initialized || !this.rewardedReady) {
            console.warn('獎勵廣告未準備好');
            if (callback) callback(false);
            return false;
        }
        
        // 保存回調
        this.adCallbacks.set('rewarded', callback);
        
        // 顯示載入提示
        this.showAdLoading(true);
        
        try {
            await AdMob.showRewardVideo();
            this.lastRewardedTime = Date.now();
            return true;
        } catch (error) {
            console.error('顯示獎勵廣告失敗:', error);
            this.showAdLoading(false);
            if (callback) callback(false);
            return false;
        } finally {
            this.showAdLoading(false);
        }
    }
    
    // 顯示/隱藏廣告載入提示
    showAdLoading(show) {
        const loadingEl = document.getElementById('adLoading');
        if (loadingEl) {
            loadingEl.classList.toggle('show', show);
        }
    }
    
    // 檢查是否可以顯示插頁廣告（基於波次）
    canShowInterstitialForWave(waveNumber) {
        if (!this.initialized || !this.interstitialReady) return false;
        
        // 每 N 波顯示一次
        const frequency = window.MobileConfig.ads.interstitialFrequency;
        return waveNumber > 0 && waveNumber % frequency === 0;
    }
    
    // 檢查獎勵廣告是否可用
    isRewardedAdAvailable() {
        if (!this.initialized || !this.rewardedReady) return false;
        
        // 檢查冷卻時間
        const cooldown = window.MobileConfig.ads.rewardedCooldown;
        return Date.now() - this.lastRewardedTime >= cooldown;
    }
    
    // 集成到遊戲中的輔助方法
    
    // 復活功能
    async offerRevive(onSuccess, onFail) {
        console.log('💀 提供復活機會');
        
        // 顯示復活對話框
        const reviveDialog = this.createReviveDialog();
        document.body.appendChild(reviveDialog);
        
        // 綁定按鈕事件
        reviveDialog.querySelector('#watchAdButton').onclick = async () => {
            reviveDialog.remove();
            await this.showRewarded((success) => {
                if (success) {
                    onSuccess();
                } else {
                    onFail();
                }
            });
        };
        
        reviveDialog.querySelector('#skipButton').onclick = () => {
            reviveDialog.remove();
            onFail();
        };
    }
    
    // 創建復活對話框
    createReviveDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'revive-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>遊戲結束</h2>
                <p>觀看廣告以復活並繼續遊戲？</p>
                <div class="dialog-buttons">
                    <button id="watchAdButton" class="cyber-button primary">
                        <span class="button-icon">🎥</span>
                        觀看廣告復活
                    </button>
                    <button id="skipButton" class="cyber-button secondary">
                        跳過
                    </button>
                </div>
            </div>
        `;
        
        // 添加樣式
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        return dialog;
    }
    
    // 獎勵翻倍功能
    async offerRewardDouble(currentGold, onComplete) {
        console.log('💰 提供獎勵翻倍機會');
        
        const dialog = this.createRewardDialog(currentGold);
        document.body.appendChild(dialog);
        
        dialog.querySelector('#doubleButton').onclick = async () => {
            dialog.remove();
            await this.showRewarded((success) => {
                onComplete(success ? currentGold * 2 : currentGold);
            });
        };
        
        dialog.querySelector('#continueButton').onclick = () => {
            dialog.remove();
            onComplete(currentGold);
        };
    }
    
    // 創建獎勵對話框
    createRewardDialog(gold) {
        const dialog = document.createElement('div');
        dialog.className = 'reward-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h2>波次完成！</h2>
                <p>獲得金幣：${gold}</p>
                <p>觀看廣告獲得雙倍獎勵？</p>
                <div class="dialog-buttons">
                    <button id="doubleButton" class="cyber-button primary">
                        <span class="button-icon">🎥</span>
                        翻倍獎勵 (${gold * 2})
                    </button>
                    <button id="continueButton" class="cyber-button secondary">
                        繼續
                    </button>
                </div>
            </div>
        `;
        
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        
        return dialog;
    }
}

// 創建全局實例
window.adManager = new AdManager();

// 在 Capacitor 準備好後初始化
document.addEventListener('deviceready', () => {
    window.adManager.initialize();
});

// 導出給遊戲使用
window.AdManager = AdManager;