// 輸入管理器
// 統一處理所有輸入事件（滑鼠、觸控、鍵盤）

class InputManager {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        
        // 輸入狀態
        this.mouse = { x: 0, y: 0, isDown: false };
        this.touch = { x: 0, y: 0, isActive: false, identifier: null };
        this.keys = new Map();
        
        // 事件處理器引用
        this.handlers = {};
        
        // 設置輸入處理
        this.setupEventHandlers();
    }
    
    // 設置事件處理器
    setupEventHandlers() {
        // 滑鼠事件
        this.handlers.mousedown = (e) => this.handleMouseDown(e);
        this.handlers.mouseup = (e) => this.handleMouseUp(e);
        this.handlers.mousemove = (e) => this.handleMouseMove(e);
        
        // 觸控事件
        this.handlers.touchstart = (e) => this.handleTouchStart(e);
        this.handlers.touchend = (e) => this.handleTouchEnd(e);
        this.handlers.touchmove = (e) => this.handleTouchMove(e);
        this.handlers.touchcancel = (e) => this.handleTouchEnd(e);
        
        // 鍵盤事件
        this.handlers.keydown = (e) => this.handleKeyDown(e);
        this.handlers.keyup = (e) => this.handleKeyUp(e);
        
        // 右鍵選單
        this.handlers.contextmenu = (e) => e.preventDefault();
        
        // 綁定事件
        this.bindEvents();
    }
    
    // 綁定事件
    bindEvents() {
        // 滑鼠事件
        this.canvas.addEventListener('mousedown', this.handlers.mousedown);
        this.canvas.addEventListener('mouseup', this.handlers.mouseup);
        this.canvas.addEventListener('mousemove', this.handlers.mousemove);
        
        // 觸控事件
        this.canvas.addEventListener('touchstart', this.handlers.touchstart, { passive: false });
        this.canvas.addEventListener('touchend', this.handlers.touchend, { passive: false });
        this.canvas.addEventListener('touchmove', this.handlers.touchmove, { passive: false });
        this.canvas.addEventListener('touchcancel', this.handlers.touchcancel, { passive: false });
        
        // 鍵盤事件
        document.addEventListener('keydown', this.handlers.keydown);
        document.addEventListener('keyup', this.handlers.keyup);
        
        // 右鍵選單
        this.canvas.addEventListener('contextmenu', this.handlers.contextmenu);
    }
    
    // 清理事件監聽器
    cleanup() {
        // 滑鼠事件
        this.canvas.removeEventListener('mousedown', this.handlers.mousedown);
        this.canvas.removeEventListener('mouseup', this.handlers.mouseup);
        this.canvas.removeEventListener('mousemove', this.handlers.mousemove);
        
        // 觸控事件
        this.canvas.removeEventListener('touchstart', this.handlers.touchstart);
        this.canvas.removeEventListener('touchend', this.handlers.touchend);
        this.canvas.removeEventListener('touchmove', this.handlers.touchmove);
        this.canvas.removeEventListener('touchcancel', this.handlers.touchcancel);
        
        // 鍵盤事件
        document.removeEventListener('keydown', this.handlers.keydown);
        document.removeEventListener('keyup', this.handlers.keyup);
        
        // 右鍵選單
        this.canvas.removeEventListener('contextmenu', this.handlers.contextmenu);
    }
    
    // 轉換座標到遊戲空間
    convertToGameCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = GameConfig.CANVAS.WIDTH / rect.width;
        const scaleY = GameConfig.CANVAS.HEIGHT / rect.height;
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }
    
    // 滑鼠按下
    handleMouseDown(event) {
        const coords = this.convertToGameCoordinates(event.clientX, event.clientY);
        this.mouse.x = coords.x;
        this.mouse.y = coords.y;
        this.mouse.isDown = true;
        
        // 發送點擊事件
        if (window.gameEventBus) {
            window.gameEventBus.emit(GameEvents.UI_CLICK, {
                x: coords.x,
                y: coords.y,
                button: event.button
            });
        }
        
        // 遊戲特定處理
        if (this.game && this.game.handleClick) {
            this.game.handleClick(coords.x, coords.y);
        }
    }
    
    // 滑鼠釋放
    handleMouseUp(event) {
        this.mouse.isDown = false;
    }
    
    // 滑鼠移動
    handleMouseMove(event) {
        const coords = this.convertToGameCoordinates(event.clientX, event.clientY);
        this.mouse.x = coords.x;
        this.mouse.y = coords.y;
        
        // 更新遊戲狀態
        if (this.game && this.game.gameState) {
            this.game.gameState.mouseX = coords.x;
            this.game.gameState.mouseY = coords.y;
        }
    }
    
    // 觸控開始
    handleTouchStart(event) {
        event.preventDefault();
        
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            const coords = this.convertToGameCoordinates(touch.clientX, touch.clientY);
            
            this.touch.x = coords.x;
            this.touch.y = coords.y;
            this.touch.isActive = true;
            this.touch.identifier = touch.identifier;
            
            // 發送觸控事件
            if (window.gameEventBus) {
                window.gameEventBus.emit(GameEvents.UI_CLICK, {
                    x: coords.x,
                    y: coords.y,
                    isTouch: true
                });
            }
            
            // 遊戲特定處理
            if (this.game && this.game.handleTouch) {
                this.game.handleTouch(coords.x, coords.y);
            }
        }
    }
    
    // 觸控結束
    handleTouchEnd(event) {
        event.preventDefault();
        
        // 檢查是否是我們追蹤的觸控點
        for (let touch of event.changedTouches) {
            if (touch.identifier === this.touch.identifier) {
                this.touch.isActive = false;
                this.touch.identifier = null;
                break;
            }
        }
    }
    
    // 觸控移動
    handleTouchMove(event) {
        event.preventDefault();
        
        for (let touch of event.touches) {
            if (touch.identifier === this.touch.identifier) {
                const coords = this.convertToGameCoordinates(touch.clientX, touch.clientY);
                this.touch.x = coords.x;
                this.touch.y = coords.y;
                
                // 更新遊戲狀態
                if (this.game && this.game.gameState) {
                    this.game.gameState.mouseX = coords.x;
                    this.game.gameState.mouseY = coords.y;
                }
                break;
            }
        }
    }
    
    // 鍵盤按下
    handleKeyDown(event) {
        this.keys.set(event.key, true);
        
        // 特殊按鍵處理
        switch (event.key) {
            case 'Escape':
            case 'p':
            case 'P':
                if (this.game && this.game.togglePause) {
                    this.game.togglePause();
                }
                break;
                
            case 'g':
            case 'G':
                // 切換空間網格調試顯示
                if (this.game && this.game.toggleSpatialGridDebug) {
                    this.game.toggleSpatialGridDebug();
                }
                break;
                
            case 'F3':
                event.preventDefault();
                if (window.performanceStats) {
                    window.performanceStats.toggleDetailedStats();
                }
                break;
        }
    }
    
    // 鍵盤釋放
    handleKeyUp(event) {
        this.keys.set(event.key, false);
    }
    
    // 檢查按鍵是否按下
    isKeyPressed(key) {
        return this.keys.get(key) || false;
    }
    
    // 獲取當前輸入狀態
    getInputState() {
        return {
            mouse: { ...this.mouse },
            touch: { ...this.touch },
            isInteracting: this.mouse.isDown || this.touch.isActive
        };
    }
    
    // 獲取指向位置（滑鼠或觸控）
    getPointerPosition() {
        if (this.touch.isActive) {
            return { x: this.touch.x, y: this.touch.y };
        }
        return { x: this.mouse.x, y: this.mouse.y };
    }
}

// 導出類
window.InputManager = InputManager;