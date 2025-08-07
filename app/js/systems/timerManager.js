// 計時器管理系統 - 統一管理所有 setTimeout 和 setInterval
// 確保遊戲結束時能正確清理所有計時器，避免記憶體洩漏

class TimerManager {
    constructor() {
        this.timeouts = new Map();
        this.intervals = new Map();
        this.nextId = 1;
    }
    
    // 替代原生 setTimeout
    setTimeout(callback, delay, ...args) {
        const id = this.nextId++;
        const timeoutId = setTimeout(() => {
            callback(...args);
            this.timeouts.delete(id);
        }, delay);
        
        this.timeouts.set(id, timeoutId);
        return id;
    }
    
    // 替代原生 setInterval
    setInterval(callback, interval, ...args) {
        const id = this.nextId++;
        const intervalId = setInterval(() => {
            callback(...args);
        }, interval);
        
        this.intervals.set(id, intervalId);
        return id;
    }
    
    // 清除特定 timeout
    clearTimeout(id) {
        if (this.timeouts.has(id)) {
            clearTimeout(this.timeouts.get(id));
            this.timeouts.delete(id);
        }
    }
    
    // 清除特定 interval
    clearInterval(id) {
        if (this.intervals.has(id)) {
            clearInterval(this.intervals.get(id));
            this.intervals.delete(id);
        }
    }
    
    // 清除所有計時器
    clearAll() {
        // 清除所有 timeout
        for (const [id, timeoutId] of this.timeouts) {
            clearTimeout(timeoutId);
        }
        this.timeouts.clear();
        
        // 清除所有 interval
        for (const [id, intervalId] of this.intervals) {
            clearInterval(intervalId);
        }
        this.intervals.clear();
        
        console.log('計時器管理器：已清除所有計時器');
    }
    
    // 獲取統計資訊
    getStats() {
        return {
            activeTimeouts: this.timeouts.size,
            activeIntervals: this.intervals.size
        };
    }
}

// 創建全局實例
window.timerManager = new TimerManager();