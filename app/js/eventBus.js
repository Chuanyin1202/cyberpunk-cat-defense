// 事件總線系統
// 實現解耦的組件間通信機制

class EventBus {
    constructor() {
        this.events = new Map();
        this.onceEvents = new Map();
        this.eventHistory = [];
        this.maxHistorySize = 100;
        this.debug = false;
    }
    
    // 訂閱事件
    on(eventName, callback, context = null) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        
        const listeners = this.events.get(eventName);
        listeners.push({ callback, context });
        
        if (this.debug) {
            console.log(`[EventBus] Subscribed to: ${eventName}`);
        }
        
        // 返回取消訂閱函數
        return () => this.off(eventName, callback, context);
    }
    
    // 訂閱一次性事件
    once(eventName, callback, context = null) {
        if (!this.onceEvents.has(eventName)) {
            this.onceEvents.set(eventName, []);
        }
        
        const listeners = this.onceEvents.get(eventName);
        listeners.push({ callback, context });
        
        return () => this.offOnce(eventName, callback, context);
    }
    
    // 取消訂閱
    off(eventName, callback = null, context = null) {
        if (!this.events.has(eventName)) return;
        
        if (callback === null) {
            // 移除該事件的所有監聽器
            this.events.delete(eventName);
        } else {
            const listeners = this.events.get(eventName);
            const filtered = listeners.filter(listener => 
                listener.callback !== callback || listener.context !== context
            );
            
            if (filtered.length === 0) {
                this.events.delete(eventName);
            } else {
                this.events.set(eventName, filtered);
            }
        }
    }
    
    // 取消一次性訂閱
    offOnce(eventName, callback = null, context = null) {
        if (!this.onceEvents.has(eventName)) return;
        
        if (callback === null) {
            this.onceEvents.delete(eventName);
        } else {
            const listeners = this.onceEvents.get(eventName);
            const filtered = listeners.filter(listener => 
                listener.callback !== callback || listener.context !== context
            );
            
            if (filtered.length === 0) {
                this.onceEvents.delete(eventName);
            } else {
                this.onceEvents.set(eventName, filtered);
            }
        }
    }
    
    // 發送事件
    emit(eventName, data = null) {
        const eventData = {
            name: eventName,
            data,
            timestamp: Date.now()
        };
        
        // 記錄事件歷史
        this.eventHistory.push(eventData);
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
        
        if (this.debug) {
            console.log(`[EventBus] Emitting: ${eventName}`, data);
        }
        
        // 執行常規監聽器
        if (this.events.has(eventName)) {
            const listeners = this.events.get(eventName).slice(); // 複製陣列避免修改問題
            listeners.forEach(listener => {
                try {
                    if (listener.context) {
                        listener.callback.call(listener.context, data);
                    } else {
                        listener.callback(data);
                    }
                } catch (error) {
                    console.error(`[EventBus] Error in listener for ${eventName}:`, error);
                }
            });
        }
        
        // 執行一次性監聽器
        if (this.onceEvents.has(eventName)) {
            const listeners = this.onceEvents.get(eventName).slice();
            this.onceEvents.delete(eventName); // 執行後立即清除
            
            listeners.forEach(listener => {
                try {
                    if (listener.context) {
                        listener.callback.call(listener.context, data);
                    } else {
                        listener.callback(data);
                    }
                } catch (error) {
                    console.error(`[EventBus] Error in once listener for ${eventName}:`, error);
                }
            });
        }
    }
    
    // 清除所有事件監聽器
    clear() {
        this.events.clear();
        this.onceEvents.clear();
        this.eventHistory = [];
    }
    
    // 獲取事件歷史
    getHistory(eventName = null) {
        if (eventName) {
            return this.eventHistory.filter(event => event.name === eventName);
        }
        return this.eventHistory.slice();
    }
    
    // 啟用/禁用調試模式
    setDebug(enabled) {
        this.debug = enabled;
    }
}

// 遊戲事件定義
const GameEvents = {
    // 遊戲狀態事件
    GAME_START: 'game:start',
    GAME_PAUSE: 'game:pause',
    GAME_RESUME: 'game:resume',
    GAME_OVER: 'game:over',
    WAVE_START: 'wave:start',
    WAVE_COMPLETE: 'wave:complete',
    
    // 玩家/基地事件
    BASE_DAMAGE: 'base:damage',
    BASE_HEAL: 'base:heal',
    BASE_UPGRADE: 'base:upgrade',
    PLAYER_LEVELUP: 'player:levelup',
    PLAYER_ATTACK: 'player:attack',
    
    // 敵人事件
    ENEMY_SPAWN: 'enemy:spawn',
    ENEMY_DEATH: 'enemy:death',
    ENEMY_DAMAGE: 'enemy:damage',
    ENEMY_REACH_BASE: 'enemy:reachbase',
    
    // 升級系統事件
    UPGRADE_PURCHASE: 'upgrade:purchase',
    UPGRADE_MAX_LEVEL: 'upgrade:maxlevel',
    SKILL_UNLOCK: 'skill:unlock',
    
    // 投射物事件
    PROJECTILE_FIRE: 'projectile:fire',
    PROJECTILE_HIT: 'projectile:hit',
    PROJECTILE_MISS: 'projectile:miss',
    
    // 特效事件
    PARTICLE_SPAWN: 'particle:spawn',
    EFFECT_TRIGGER: 'effect:trigger',
    
    // UI 事件
    UI_CLICK: 'ui:click',
    UI_HOVER: 'ui:hover',
    MENU_OPEN: 'menu:open',
    MENU_CLOSE: 'menu:close',
    
    // 成就/統計事件
    ACHIEVEMENT_UNLOCK: 'achievement:unlock',
    STAT_UPDATE: 'stat:update',
    SCORE_UPDATE: 'score:update',
    
    // 音效事件
    SOUND_PLAY: 'sound:play',
    SOUND_STOP: 'sound:stop',
    MUSIC_CHANGE: 'music:change'
};

// 創建全局事件總線實例
window.EventBus = EventBus;
window.GameEvents = GameEvents;
window.gameEventBus = new EventBus();