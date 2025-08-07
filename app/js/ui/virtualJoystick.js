// 虛擬搖桿系統 - 為手機提供觸控操作支持
// 參考ultimate-danmaku的設計，提供流暢的觸控體驗

class VirtualJoystick {
    constructor(canvas) {
        this.canvas = canvas;
        this.isActive = false;
        this.isMobile = this.detectMobile();
        
        // 事件處理器引用
        this.eventHandlers = {};
        
        // 搖桿狀態
        this.centerX = 0;
        this.centerY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.radius = 60; // 搖桿最大半徑
        this.deadZone = 0.1; // 死區，避免微小觸控
        
        // 視覺設置（會根據螢幕模式調整）
        this.originalBaseRadius = 45; // 原始底座半徑（稍微縮小）
        this.originalKnobRadius = 18; // 原始搖桿球半徑（稍微縮小）
        this.baseRadius = 45; // 底座半徑
        this.knobRadius = 18; // 搖桿球半徑
        this.opacity = this.isMobile ? 0.8 : 0.6; // 手機設備初始顯示（提高透明度）
        this.fadeOutTimer = 0;
        this.fadeOutDelay = 3000; // 3秒後淡出
        
        // 在手機設備上預設顯示位置（使用遊戲畫布座標）
        if (this.isMobile) {
            this.centerX = 80; // 左下角位置
            this.centerY = 480; // 接近畫布底部 (600 * 0.8)
            this.currentX = this.centerX;
            this.currentY = this.centerY;
        }
        
        // 觸控追蹤
        this.touchId = null;
        this.lastTouchTime = 0;
        
        // 輸出值 (-1 到 1)
        this.deltaX = 0;
        this.deltaY = 0;
        this.magnitude = 0;
        
        this.setupEventListeners();
        
        // VirtualJoystick 初始化完成
        // console.log('🕹️ VirtualJoystick 初始化完成');
    }
    
    detectMobile() {
        // 強制啟用虛擬手把以便測試，或檢查真實的手機條件
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0) ||
               (window.innerWidth <= 768); // 小螢幕也啟用
    }
    
    setupEventListeners() {
        if (!this.isMobile) return;
        
        // 觸控開始
        this.eventHandlers.touchstart = (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        };
        this.canvas.addEventListener('touchstart', this.eventHandlers.touchstart, { passive: false });
        
        // 觸控移動
        this.eventHandlers.touchmove = (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        };
        this.canvas.addEventListener('touchmove', this.eventHandlers.touchmove, { passive: false });
        
        // 觸控結束
        this.eventHandlers.touchend = (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        };
        this.canvas.addEventListener('touchend', this.eventHandlers.touchend, { passive: false });
        
        this.eventHandlers.touchcancel = (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        };
        this.canvas.addEventListener('touchcancel', this.eventHandlers.touchcancel, { passive: false });
    }
    
    // 清理事件監聽器
    cleanup() {
        if (this.eventHandlers.touchstart) {
            this.canvas.removeEventListener('touchstart', this.eventHandlers.touchstart);
        }
        if (this.eventHandlers.touchmove) {
            this.canvas.removeEventListener('touchmove', this.eventHandlers.touchmove);
        }
        if (this.eventHandlers.touchend) {
            this.canvas.removeEventListener('touchend', this.eventHandlers.touchend);
        }
        if (this.eventHandlers.touchcancel) {
            this.canvas.removeEventListener('touchcancel', this.eventHandlers.touchcancel);
        }
        
        this.eventHandlers = {};
    }
    
    handleTouchStart(e) {
        if (this.touchId !== null) return; // 已有觸控
        
        const touch = e.changedTouches[0];
        const rect = this.canvas.getBoundingClientRect();
        
        const x = (touch.clientX - rect.left) * (GameConfig.CANVAS.WIDTH / rect.width);
        const y = (touch.clientY - rect.top) * (GameConfig.CANVAS.HEIGHT / rect.height);
        
        // 擴大觸發區域，讓虛擬手把更容易啟動
        const leftZone = GameConfig.CANVAS.WIDTH * 0.5; // 左50%區域
        const bottomZone = GameConfig.CANVAS.HEIGHT * 0.5; // 下50%區域
        
        if (x <= leftZone && y >= bottomZone) {
            this.touchId = touch.identifier;
            this.centerX = x;
            this.centerY = y;
            this.currentX = x;
            this.currentY = y;
            this.isActive = true;
            this.opacity = 0.8;
            this.fadeOutTimer = 0;
            this.lastTouchTime = Date.now();
            
            this.updateValues();
        }
    }
    
    handleTouchMove(e) {
        if (this.touchId === null) return;
        
        // 找到對應的觸控點
        let targetTouch = null;
        for (let touch of e.changedTouches) {
            if (touch.identifier === this.touchId) {
                targetTouch = touch;
                break;
            }
        }
        
        if (!targetTouch) return;
        
        const rect = this.canvas.getBoundingClientRect();
        
        this.currentX = (targetTouch.clientX - rect.left) * (GameConfig.CANVAS.WIDTH / rect.width);
        this.currentY = (targetTouch.clientY - rect.top) * (GameConfig.CANVAS.HEIGHT / rect.height);
        
        // 限制在搖桿範圍內
        const dx = this.currentX - this.centerX;
        const dy = this.currentY - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.radius) {
            const angle = Math.atan2(dy, dx);
            this.currentX = this.centerX + Math.cos(angle) * this.radius;
            this.currentY = this.centerY + Math.sin(angle) * this.radius;
        }
        
        this.updateValues();
        this.lastTouchTime = Date.now();
    }
    
    handleTouchEnd(e) {
        if (this.touchId === null) return;
        
        // 檢查是否為對應的觸控點
        for (let touch of e.changedTouches) {
            if (touch.identifier === this.touchId) {
                this.touchId = null;
                this.isActive = false;
                this.currentX = this.centerX;
                this.currentY = this.centerY;
                this.updateValues();
                break;
            }
        }
    }
    
    updateValues() {
        const dx = this.currentX - this.centerX;
        const dy = this.currentY - this.centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.magnitude = Math.min(distance / this.radius, 1.0);
        
        if (this.magnitude < this.deadZone) {
            this.deltaX = 0;
            this.deltaY = 0;
            this.magnitude = 0;
        } else {
            this.deltaX = (dx / this.radius);
            this.deltaY = (dy / this.radius);
            
            // 調整死區後的數值
            const adjustedMagnitude = (this.magnitude - this.deadZone) / (1.0 - this.deadZone);
            const angle = Math.atan2(dy, dx);
            this.deltaX = Math.cos(angle) * adjustedMagnitude;
            this.deltaY = Math.sin(angle) * adjustedMagnitude;
        }
    }
    
    update(deltaTime) {
        if (!this.isMobile) return;
        
        // 根據遊戲縮放調整搖桿大小
        const game = window.currentGame;
        const renderScale = game?.mobileRenderScale || 1.0;
        
        this.baseRadius = this.originalBaseRadius * renderScale;
        this.knobRadius = this.originalKnobRadius * renderScale;
        this.radius = 55 * renderScale;
        
        // 淡出邏輯
        if (!this.isActive) {
            this.fadeOutTimer += deltaTime * 1000;
            if (this.fadeOutTimer > this.fadeOutDelay) {
                this.opacity = Math.max(0, this.opacity - deltaTime * 2);
            }
        }
    }
    
    render(ctx) {
        if (!this.isMobile) return;
        
        // 在手機上始終顯示虛擬手把提示（至少顯示淡淡的底座）
        if (!this.isActive && this.fadeOutTimer > this.fadeOutDelay && this.opacity <= 0.1) {
            this.opacity = 0.2; // 保持最低可見度
        }
        
        // 調試信息（僅在需要時啟用）
        // console.log('🕹️ VirtualJoystick 渲染:', { isActive: this.isActive, opacity: this.opacity });
        
        ctx.save();
        
        ctx.globalAlpha = this.opacity;
        
        // 底座（增加透明度讓它更明顯）
        ctx.strokeStyle = 'rgba(0, 255, 255, 1.0)';  // 完全不透明的邊框
        ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';    // 更明顯的填充
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.baseRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 內圈指示
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, this.baseRadius * 0.6, 0, Math.PI * 2);
        ctx.stroke();
        
        // 搖桿球
        if (this.isActive || this.fadeOutTimer <= this.fadeOutDelay) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.currentX, this.currentY, this.knobRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // 中心點
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(this.currentX, this.currentY, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // 獲取搖桿輸入（標準化到 -1 到 1）
    getInput() {
        return {
            x: this.deltaX,
            y: this.deltaY,
            magnitude: this.magnitude,
            isActive: this.isActive
        };
    }
    
    // 檢查是否在使用中
    isInUse() {
        return this.isActive || this.magnitude > 0;
    }
    
    // 獲取角度（弧度）
    getAngle() {
        if (this.magnitude === 0) return 0;
        return Math.atan2(this.deltaY, this.deltaX);
    }
    
    // 重置搖桿
    reset() {
        this.isActive = false;
        this.touchId = null;
        this.deltaX = 0;
        this.deltaY = 0;
        this.magnitude = 0;
        this.currentX = this.centerX;
        this.currentY = this.centerY;
    }
}

// 導出類
window.VirtualJoystick = VirtualJoystick;