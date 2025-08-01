/**
 * 統一的遊戲入口點
 * 根據平台動態載入對應的配置和模組
 */

// 平台檢測
import { PlatformDetector } from './platform/platformDetector.js';
import { PlatformAdapter } from './platform/platformAdapter.js';

// 核心遊戲
import { Game } from './core/game.js';

// 全局實例
let gameInstance = null;

/**
 * 初始化遊戲
 */
async function initializeGame() {
    try {
        console.log('Initializing Cyberpunk Cat Defense...');
        
        // 1. 檢測當前平台
        const platform = PlatformDetector.detect();
        console.log(`Detected platform: ${platform}`);
        
        // 2. 初始化平台適配器
        await PlatformAdapter.initialize(platform);
        
        // 3. 載入平台特定配置
        const platformConfig = await PlatformAdapter.loadPlatformConfig(platform);
        
        // 4. 創建遊戲實例
        gameInstance = new Game(platformConfig);
        
        // 5. 初始化平台特定功能
        await PlatformAdapter.initializePlatformFeatures(gameInstance, platform);
        
        // 6. 啟動遊戲
        gameInstance.start();
        
        console.log('Game initialized successfully!');
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        // 顯示錯誤訊息給用戶
        showErrorMessage(error.message);
    }
}

/**
 * 顯示錯誤訊息
 */
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-family: 'Courier New', monospace;
        text-align: center;
        z-index: 10000;
    `;
    errorDiv.innerHTML = `
        <h2>遊戲初始化失敗</h2>
        <p>${message}</p>
        <button onclick="location.reload()">重新載入</button>
    `;
    document.body.appendChild(errorDiv);
}

/**
 * 處理頁面載入完成事件
 */
function handlePageLoad() {
    // 等待 DOM 完全載入
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeGame);
    } else {
        initializeGame();
    }
}

/**
 * 處理頁面卸載事件
 */
function handlePageUnload() {
    if (gameInstance) {
        gameInstance.destroy();
        gameInstance = null;
    }
}

// 註冊事件監聽器
window.addEventListener('load', handlePageLoad);
window.addEventListener('beforeunload', handlePageUnload);

// 導出遊戲實例（供調試使用）
window.game = () => gameInstance;

// 啟動遊戲
handlePageLoad();