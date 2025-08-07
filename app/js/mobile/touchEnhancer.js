// 觸控增強系統
// 提供手機觸控體驗的增強功能

class TouchEnhancer {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        
        // 觸控反饋
        this.hapticSupported = 'vibrate' in navigator;
        this.touchEffects = [];
        
        // 手勢識別
        this.gestureStartTime = 0;
        this.gestureStartPos = { x: 0, y: 0 };
        this.lastTapTime = 0;
        this.doubleTapDelay = 300; // 雙擊檢測時間
        
        // 設置觸控增強
        this.setupTouchEnhancements();
    }
    
    setupTouchEnhancements() {
        // 添加觸控樣式
        this.canvas.style.touchAction = 'none';
        this.canvas.style.userSelect = 'none';
        this.canvas.style.webkitUserSelect = 'none';
        this.canvas.style.webkitTouchCallout = 'none';
        
        // 防止上下文選單
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // 阻止預設的觸控縮放
        document.addEventListener('gesturestart', (e) => {
            e.preventDefault();
        });
        
        document.addEventListener('gesturechange', (e) => {
            e.preventDefault();
        });
        
        document.addEventListener('gestureend', (e) => {
            e.preventDefault();
        });
    }
    
    // 創建觸控反饋效果
    createTouchEffect(x, y, type = 'tap') {
        const effect = {
            x,
            y,
            type,
            startTime: Date.now(),
            duration: 300,
            maxRadius: type === 'tap' ? 30 : 50,
            color: type === 'tap' ? '#00ffff' : '#ff0066'
        };
        
        this.touchEffects.push(effect);
        
        // 觸覺反饋
        if (this.hapticSupported) {
            if (type === 'tap') {
                navigator.vibrate(10); // 短振動
            } else if (type === 'doubletap') {
                navigator.vibrate([10, 50, 20]); // 複合振動
            }
        }
    }
    
    // 處理增強的觸控事件
    handleEnhancedTouch(x, y, eventType) {
        const currentTime = Date.now();
        
        switch (eventType) {
            case 'start':
                this.gestureStartTime = currentTime;
                this.gestureStartPos = { x, y };
                break;
                
            case 'end':
                const tapDuration = currentTime - this.gestureStartTime;
                const tapDistance = Math.sqrt(
                    Math.pow(x - this.gestureStartPos.x, 2) + 
                    Math.pow(y - this.gestureStartPos.y, 2)
                );
                
                // 檢測是否為點擊 (短時間，小移動)
                if (tapDuration < 200 && tapDistance < 20) {
                    // 檢測雙擊
                    if (currentTime - this.lastTapTime < this.doubleTapDelay) {
                        this.handleDoubleTap(x, y);
                    } else {
                        this.handleSingleTap(x, y);
                    }
                    this.lastTapTime = currentTime;
                }
                break;
        }
    }
    
    // 處理單擊
    handleSingleTap(x, y) {
        this.createTouchEffect(x, y, 'tap');
        
        // 檢查是否點擊了特定區域
        if (this.isInBaseArea(x, y)) {
            // 點擊基地區域，觸發特殊攻擊
            if (this.game.base && this.game.base.bulletSystem) {
                this.game.base.bulletSystem.fireSpecialAttack(x, y);
            }
        }
    }
    
    // 處理雙擊
    handleDoubleTap(x, y) {
        this.createTouchEffect(x, y, 'doubletap');
        
        // 雙擊可以觸發暫停/繼續
        if (this.game.togglePause) {
            this.game.togglePause();
        }
    }
    
    // 檢查是否在基地區域
    isInBaseArea(x, y) {
        if (!this.game.base) return false;
        
        const distance = Math.sqrt(
            Math.pow(x - this.game.base.x, 2) + 
            Math.pow(y - this.game.base.y, 2)
        );
        
        return distance <= this.game.base.radius * 2;
    }
    
    // 更新觸控效果
    update(deltaTime) {
        // 更新觸控效果動畫
        for (let i = this.touchEffects.length - 1; i >= 0; i--) {
            const effect = this.touchEffects[i];
            const elapsed = Date.now() - effect.startTime;
            
            if (elapsed >= effect.duration) {
                this.touchEffects.splice(i, 1);
            }
        }
    }
    
    // 渲染觸控效果
    render(ctx) {
        for (const effect of this.touchEffects) {
            const elapsed = Date.now() - effect.startTime;
            const progress = elapsed / effect.duration;
            const radius = effect.maxRadius * progress;
            const alpha = 1 - progress;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = effect.color;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = effect.color;
            
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
            ctx.stroke();
            
            // 內部小圓點
            if (progress < 0.3) {
                ctx.fillStyle = effect.color;
                ctx.globalAlpha = alpha * 2;
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, 3, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }
    
    // 提供易於觸控的按鈕檢測
    createTouchButton(x, y, width, height, callback, label) {
        return {
            x: x - width / 2,
            y: y - height / 2,
            width,
            height,
            callback,
            label,
            isPressed: false,
            
            // 檢查觸控點是否在按鈕內
            contains(touchX, touchY) {
                return touchX >= this.x && touchX <= this.x + this.width &&
                       touchY >= this.y && touchY <= this.y + this.height;
            },
            
            // 渲染按鈕
            render(ctx) {
                ctx.save();
                
                // 按鈕背景
                ctx.fillStyle = this.isPressed ? 
                    'rgba(0, 255, 255, 0.3)' : 
                    'rgba(0, 255, 255, 0.1)';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // 按鈕邊框
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(this.x, this.y, this.width, this.height);
                
                // 按鈕文字
                ctx.fillStyle = '#ffffff';
                ctx.font = '16px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    this.label, 
                    this.x + this.width / 2, 
                    this.y + this.height / 2
                );
                
                ctx.restore();
            }
        };
    }
    
    // 清理資源
    cleanup() {
        this.touchEffects = [];
    }
}

// 導出類
window.TouchEnhancer = TouchEnhancer;