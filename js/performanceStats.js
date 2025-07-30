// 性能統計和監控系統
// 用於追蹤優化效果和診斷性能問題

class PerformanceStats {
    constructor() {
        this.enabled = true;
        this.frameCount = 0;
        this.lastStatsUpdate = 0;
        this.updateInterval = 1000; // 1秒更新一次統計
        
        // FPS 統計
        this.fps = 60;
        this.avgFps = 60;
        this.minFps = 60;
        this.maxFps = 60;
        this.fpsHistory = [];
        
        // 渲染統計
        this.renderTime = 0;
        this.updateTime = 0;
        this.totalFrameTime = 0;
        
        // 對象統計
        this.objectCounts = {
            particles: 0,
            bullets: 0,
            enemies: 0,
            projectiles: 0
        };
        
        // 內存統計
        this.memoryUsage = {
            used: 0,
            total: 0,
            poolStats: null
        };
        
        // 性能歷史
        this.performanceHistory = [];
        this.maxHistoryLength = 60; // 保持60秒的歷史
        
        // 渲染統計
        this.renderStats = {
            drawCalls: 0,
            stateChanges: 0,
            batchedRenders: 0
        };
    }
    
    // 開始幀統計
    startFrame() {
        this.frameStartTime = performance.now();
        this.renderStats.drawCalls = 0;
        this.renderStats.stateChanges = 0;
        this.renderStats.batchedRenders = 0;
    }
    
    // 記錄更新時間
    recordUpdateTime() {
        this.updateEndTime = performance.now();
        this.updateTime = this.updateEndTime - this.frameStartTime;
    }
    
    // 結束幀統計
    endFrame() {
        const frameEndTime = performance.now();
        this.totalFrameTime = frameEndTime - this.frameStartTime;
        this.renderTime = frameEndTime - (this.updateEndTime || this.frameStartTime);
        
        this.frameCount++;
        
        // 計算 FPS
        const currentFps = 1000 / this.totalFrameTime;
        this.fpsHistory.push(currentFps);
        if (this.fpsHistory.length > 60) {
            this.fpsHistory.shift();
        }
        
        // 更新統計
        if (frameEndTime - this.lastStatsUpdate >= this.updateInterval) {
            this.updateStats();
            this.lastStatsUpdate = frameEndTime;
        }
    }
    
    // 更新統計數據
    updateStats() {
        if (this.fpsHistory.length > 0) {
            this.avgFps = this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length;
            this.minFps = Math.min(...this.fpsHistory);
            this.maxFps = Math.max(...this.fpsHistory);
            this.fps = this.fpsHistory[this.fpsHistory.length - 1];
        }
        
        // 獲取對象池統計
        if (window.objectPoolManager) {
            this.memoryUsage.poolStats = window.objectPoolManager.getAllStats();
        }
        
        // 獲取遊戲對象統計
        if (window.game) {
            this.objectCounts.particles = window.game.particleManager?.particles?.length || 0;
            this.objectCounts.bullets = window.game.base?.bulletSystem?.bullets?.length || 0;
            this.objectCounts.enemies = window.game.enemyManager?.enemies?.length || 0;
            this.objectCounts.projectiles = window.game.projectileManager?.projectiles?.length || 0;
        }
        
        // 記錄歷史
        this.performanceHistory.push({
            timestamp: Date.now(),
            fps: this.fps,
            avgFps: this.avgFps,
            frameTime: this.totalFrameTime,
            updateTime: this.updateTime,
            renderTime: this.renderTime,
            objectCounts: { ...this.objectCounts },
            renderStats: { ...this.renderStats }
        });
        
        if (this.performanceHistory.length > this.maxHistoryLength) {
            this.performanceHistory.shift();
        }
        
        // 更新 DOM 顯示
        this.updateDisplay();
    }
    
    // 記錄繪圖調用
    recordDrawCall() {
        this.renderStats.drawCalls++;
    }
    
    // 記錄狀態變更
    recordStateChange() {
        this.renderStats.stateChanges++;
    }
    
    // 記錄批次渲染
    recordBatchRender(count = 1) {
        this.renderStats.batchedRenders += count;
    }
    
    // 更新顯示
    updateDisplay() {
        if (!this.enabled) return;
        
        // 更新 FPS 顯示
        const fpsElement = document.getElementById('fps');
        if (fpsElement) {
            fpsElement.textContent = Math.round(this.fps);
            
            // 根據 FPS 設置顏色
            if (this.fps < 30) {
                fpsElement.style.color = '#ff4444';
            } else if (this.fps < 45) {
                fpsElement.style.color = '#ffaa44';
            } else {
                fpsElement.style.color = '#44ff44';
            }
        }
        
        // 如果有開發模式顯示區域，更新詳細統計
        this.updateDetailedStats();
    }
    
    // 更新詳細統計顯示
    updateDetailedStats() {
        let statsDiv = document.getElementById('performance-stats');
        if (!statsDiv) {
            // 創建統計顯示區域
            statsDiv = document.createElement('div');
            statsDiv.id = 'performance-stats';
            statsDiv.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: #00ff00;
                font-family: 'Courier New', monospace;
                font-size: 10px;
                padding: 10px;
                border: 1px solid #00ff00;
                border-radius: 5px;
                z-index: 1000;
                display: none;
                max-width: 300px;
            `;
            document.body.appendChild(statsDiv);
        }
        
        // 只在開發模式或按下特定鍵時顯示
        if (this.shouldShowDetailedStats()) {
            statsDiv.style.display = 'block';
            statsDiv.innerHTML = this.generateDetailedStatsHTML();
        } else {
            statsDiv.style.display = 'none';
        }
    }
    
    // 生成詳細統計 HTML
    generateDetailedStatsHTML() {
        const poolStats = this.memoryUsage.poolStats;
        
        return `
            <div><strong>性能統計</strong></div>
            <div>FPS: ${Math.round(this.fps)} (平均: ${Math.round(this.avgFps)})</div>
            <div>幀時間: ${this.totalFrameTime.toFixed(1)}ms</div>
            <div>更新: ${this.updateTime.toFixed(1)}ms</div>
            <div>渲染: ${this.renderTime.toFixed(1)}ms</div>
            <hr style="border-color: #00ff00; margin: 5px 0;">
            <div><strong>對象數量</strong></div>
            <div>粒子: ${this.objectCounts.particles}</div>
            <div>子彈: ${this.objectCounts.bullets}</div>
            <div>敵人: ${this.objectCounts.enemies}</div>
            <div>投射物: ${this.objectCounts.projectiles}</div>
            ${poolStats ? `
            <hr style="border-color: #00ff00; margin: 5px 0;">
            <div><strong>對象池統計</strong></div>
            <div>粒子池: ${poolStats.particles.inUse}/${poolStats.particles.total}</div>
            <div>子彈池: ${poolStats.bullets.inUse}/${poolStats.bullets.total}</div>
            <div>重用率: P${Math.round((poolStats.performance.particlesReused / Math.max(1, poolStats.performance.particlesReused + poolStats.performance.particlesCreated)) * 100)}% B${Math.round((poolStats.performance.bulletsReused / Math.max(1, poolStats.performance.bulletsReused + poolStats.performance.bulletsCreated)) * 100)}%</div>
            <div>緩存: ${poolStats.renderCache.gradients}G ${poolStats.renderCache.cachedCanvas}C</div>
            ` : ''}
            <hr style="border-color: #00ff00; margin: 5px 0;">
            <div><strong>渲染統計</strong></div>
            <div>繪圖調用: ${this.renderStats.drawCalls}</div>
            <div>狀態變更: ${this.renderStats.stateChanges}</div>
            <div>批次渲染: ${this.renderStats.batchedRenders}</div>
        `;
    }
    
    // 判斷是否應該顯示詳細統計
    shouldShowDetailedStats() {
        // 可以通過URL參數或localStorage控制
        return new URLSearchParams(window.location.search).has('debug') ||
               localStorage.getItem('showPerformanceStats') === 'true';
    }
    
    // 切換詳細統計顯示
    toggleDetailedStats() {
        const current = localStorage.getItem('showPerformanceStats') === 'true';
        localStorage.setItem('showPerformanceStats', (!current).toString());
        this.updateDetailedStats();
    }
    
    // 獲取性能報告
    getPerformanceReport() {
        return {
            fps: {
                current: this.fps,
                average: this.avgFps,
                min: this.minFps,
                max: this.maxFps
            },
            timing: {
                frame: this.totalFrameTime,
                update: this.updateTime,
                render: this.renderTime
            },
            objects: this.objectCounts,
            memory: this.memoryUsage,
            render: this.renderStats,
            history: this.performanceHistory.slice(-10) // 最近10個記錄
        };
    }
    
    // 重置統計
    reset() {
        this.frameCount = 0;
        this.fpsHistory = [];
        this.performanceHistory = [];
        this.renderStats = {
            drawCalls: 0,
            stateChanges: 0,
            batchedRenders: 0
        };
    }
    
    // 啟用/禁用統計
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            const statsDiv = document.getElementById('performance-stats');
            if (statsDiv) {
                statsDiv.style.display = 'none';
            }
        }
    }
}

// 創建全局性能統計實例
window.PerformanceStats = PerformanceStats;
window.performanceStats = new PerformanceStats();

// 添加鍵盤快捷鍵切換詳細統計
document.addEventListener('keydown', (e) => {
    if (e.key === 'F3') {
        e.preventDefault();
        window.performanceStats.toggleDetailedStats();
    }
});