/**
 * 手機控制系統 - 單個瞄準手把版本
 * 專為塔防遊戲設計：固定位置的瞄準手把
 */
class MobileControls {
    constructor() {
        this.isEnabled = false;
        this.aimDpad = null;
        
        // 瞄準方向和位置
        this.attackDirection = { x: 0, y: 0 };
        this.targetPosition = { x: 0, y: 0 };  // 實際瞄準位置
        this.isAiming = false;
        
        this.createControls();
        this.detectMobile();
        
    }
    
    // 檢測是否為手機設備
    detectMobile() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                         ('ontouchstart' in window) ||
                         (navigator.maxTouchPoints > 0) ||
                         (window.innerWidth <= 768);
        
        if (isMobile) {
            this.enable();
        } else {
            this.disable();
        }
        
    }
    
    // 創建控制界面
    createControls() {
        // 創建瞄準手把 (初始隱藏，觸碰時顯示)
        this.aimDpad = this.createAimPad();
        document.body.appendChild(this.aimDpad);
        
        // 創建瞄準目標指示器
        this.aimTarget = document.createElement('div');
        this.aimTarget.className = 'aim-target';
        document.body.appendChild(this.aimTarget);
        
        this.setupScreenTouchEvents();
    }
    
    // 創建瞄準手把
    createAimPad() {
        const dpad = document.createElement('div');
        dpad.id = 'aimpad';
        dpad.className = 'mobile-aimpad';
        dpad.innerHTML = `
            <style>
            .mobile-aimpad {
                position: fixed;
                width: 140px;
                height: 140px;
                opacity: 0;
                pointer-events: none;
                z-index: 1000;
                transition: opacity 0.2s;
            }
            .mobile-aimpad.visible {
                opacity: 0.8;
                pointer-events: auto;
            }
            .mobile-aimpad.active {
                opacity: 0.9;
            }
            .mobile-aimpad.controlling .joystick-bg {
                border-color: #ff00ff;
                box-shadow: 0 0 25px rgba(255, 0, 255, 0.5);
            }
            .mobile-aimpad.controlling .joystick-knob {
                background: #ff00ff;
                box-shadow: 0 0 20px rgba(255, 0, 255, 1);
            }
            .aim-label {
                position: absolute;
                top: -25px;
                left: 50%;
                transform: translateX(-50%);
                color: #00ffff;
                font-size: 12px;
                text-shadow: 0 0 10px #00ffff;
                pointer-events: none;
                font-family: 'Courier New', monospace;
            }
            .joystick-container {
                width: 100%;
                height: 100%;
                position: relative;
            }
            .joystick-bg {
                width: 100px;
                height: 100px;
                border: 2px solid #00ffff;
                border-radius: 50%;
                background: rgba(0, 255, 255, 0.1);
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
            }
            .joystick-knob {
                width: 40px;
                height: 40px;
                background: #00ffff;
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.8);
                transition: none;
                pointer-events: none;
            }
            .aim-line {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 2px;
                background: linear-gradient(to right, transparent, #ff00ff);
                transform-origin: left center;
                opacity: 0;
                transition: opacity 0.2s;
                pointer-events: none;
            }
            .mobile-aimpad.active .aim-line {
                opacity: 0.6;
            }
            .aim-target {
                position: fixed;
                width: 20px;
                height: 20px;
                border: 2px solid #ff00ff;
                border-radius: 50%;
                opacity: 0;
                transition: opacity 0.2s;
                pointer-events: none;
                z-index: 999;
            }
            .aim-target.visible {
                opacity: 0.8;
            }
            .aim-target::before,
            .aim-target::after {
                content: '';
                position: absolute;
                background: #ff00ff;
            }
            .aim-target::before {
                width: 100%;
                height: 2px;
                top: 50%;
                left: 0;
                transform: translateY(-50%);
            }
            .aim-target::after {
                width: 2px;
                height: 100%;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
            }
            </style>
            <div class="aim-label">瞄準</div>
            <div class="joystick-container">
                <div class="joystick-bg">
                    <div class="joystick-knob"></div>
                    <div class="aim-line"></div>
                </div>
            </div>
        `;
        return dpad;
    }
    
    // 設置螢幕觸控事件 - 觸碰顯示手把
    setupScreenTouchEvents() {
        let isActive = false;
        let touchId = null;
        let centerPos = { x: 0, y: 0 };
        const maxRadius = 50;  // 增加最大半徑
        const deadZone = 15;   // 增加死區
        
        const knob = this.aimDpad.querySelector('.joystick-knob');
        const aimLine = this.aimDpad.querySelector('.aim-line');
        
        // 觸控開始 - 在觸碰位置顯示手把
        document.addEventListener('touchstart', (event) => {
            if (!this.isEnabled || isActive) return;
            
            const touch = event.touches[0];
            
            // 檢查是否觸碰到UI元素，如果是則不顯示搖桿
            if (this.isTouchingUI(event.target)) {
                return;
            }
            touchId = touch.identifier;
            isActive = true;
            
            // 設置手把位置在觸碰點（邊界約束）
            const dpadSize = 140;  // 更新為新尺寸
            const adjustedX = Math.max(dpadSize/2, Math.min(window.innerWidth - dpadSize/2, touch.clientX));
            const adjustedY = Math.max(dpadSize/2, Math.min(window.innerHeight - dpadSize/2, touch.clientY));
            
            this.aimDpad.style.left = (adjustedX - dpadSize/2) + 'px';
            this.aimDpad.style.top = (adjustedY - dpadSize/2) + 'px';
            
            // 記錄調整後的中心位置，確保與視覺位置一致
            centerPos.x = adjustedX;
            centerPos.y = adjustedY;
            
            // 顯示手把
            this.aimDpad.classList.add('visible');
            
            // 設置初始瞄準位置和方向
            this.updateTargetPosition(touch.clientX, touch.clientY);
            this.isAiming = true;
            
            event.preventDefault();
        });
        
        // 觸控移動 - 使用 capture 階段確保優先執行
        document.addEventListener('touchmove', (event) => {
            if (!isActive) return;
            
            // 找到對應的觸控點
            let currentTouch = null;
            for (let i = 0; i < event.changedTouches.length; i++) {
                if (event.changedTouches[i].identifier === touchId) {
                    currentTouch = event.changedTouches[i];
                    break;
                }
            }
            if (!currentTouch) return;
            
            if (currentTouch) {
                const deltaX = currentTouch.clientX - centerPos.x;
                const deltaY = currentTouch.clientY - centerPos.y;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                // 更新手把視覺
                const clampedDistance = Math.min(distance, maxRadius);
                const angle = Math.atan2(deltaY, deltaX);
                
                // 計算knob位置
                const knobX = Math.cos(angle) * clampedDistance;
                const knobY = Math.sin(angle) * clampedDistance;
                
                // 更新knob位置（使用正確的中心偏移）
                knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
                
                // 更新瞄準線
                if (distance > deadZone) {
                    this.aimDpad.classList.add('active', 'controlling');
                    
                    // 更新瞄準線角度和長度
                    aimLine.style.width = '60px';
                    aimLine.style.transform = `rotate(${angle}rad)`;
                    
                    // 更新瞄準位置
                    this.updateTargetPosition(currentTouch.clientX, currentTouch.clientY);
                    this.isAiming = true;
                } else {
                    // 在死區內
                    this.aimDpad.classList.remove('active', 'controlling');
                    this.isAiming = false;
                    this.aimTarget.classList.remove('visible');
                }
            }
            
            event.preventDefault();
        }, { capture: true, passive: false });
        
        // 觸控結束 - 隱藏手把
        const handleTouchEnd = (event) => {
            if (!isActive) return;
            
            // 檢查是否為對應的觸控點
            for (let i = 0; i < event.changedTouches.length; i++) {
                if (event.changedTouches[i].identifier === touchId) {
                    isActive = false;
                    touchId = null;
                    
                    // 隱藏手把
                    this.aimDpad.classList.remove('visible', 'active', 'controlling');
                    knob.style.transform = 'translate(-50%, -50%)';
                    aimLine.style.width = '0';
                    this.aimTarget.classList.remove('visible');
                    this.attackDirection = { x: 0, y: 0 };
                    this.targetPosition = { x: 0, y: 0 };
                    this.isAiming = false;
                    
                    event.preventDefault();
                    break;
                }
            }
        };
        
        document.addEventListener('touchend', handleTouchEnd);
        document.addEventListener('touchcancel', handleTouchEnd);
    }
    
    // 檢查是否觸碰到UI元素
    isTouchingUI(target) {
        if (!target) return false;
        
        // 檢查常見的UI元素
        const uiSelectors = [
            '#ui',                    // 主UI面板
            '.ui-panel',             // UI面板
            '.stats',                // 統計面板
            '.restart-button',       // 重啟按鈕
            '#gameOver',            // 遊戲結束畫面
            '.upgrade-option',       // 升級選項
            '.upgrade-panel',        // 升級面板
            'button',               // 所有按鈕
            'input',                // 輸入框
            'select',               // 下拉選單
            '[data-ui]',            // 標記為UI的元素
            '.mobile-aimpad'        // 防止手把觸發自己
        ];
        
        // 檢查目標元素或其父元素是否為UI
        let element = target;
        while (element && element !== document.body) {
            // 檢查ID或class
            for (const selector of uiSelectors) {
                if (element.matches && element.matches(selector)) {
                    return true;
                }
            }
            
            // 檢查是否有UI相關的class或屬性
            if (element.classList) {
                if (element.classList.contains('ui') || 
                    element.classList.contains('menu') ||
                    element.classList.contains('panel') ||
                    element.classList.contains('overlay')) {
                    return true;
                }
            }
            
            element = element.parentElement;
        }
        
        return false;
    }
    
    // 更新瞄準位置（新方法）
    updateTargetPosition(screenX, screenY) {
        // 獲取遊戲畫布的基地位置
        const game = window.currentGame;
        if (!game || !game.base) return;
        
        const baseX = game.base.x;
        const baseY = game.base.y;
        
        // 將螢幕座標轉換為遊戲座標
        const gameCoords = this.screenToGameCoords(screenX, screenY);
        if (!gameCoords) return;
        
        // 更新目標位置
        this.targetPosition = {
            x: gameCoords.x,
            y: gameCoords.y
        };
        
        // 計算攻擊方向
        const deltaX = gameCoords.x - baseX;
        const deltaY = gameCoords.y - baseY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 0) {
            this.attackDirection = {
                x: deltaX / distance,
                y: deltaY / distance
            };
            
            // 更新瞄準目標視覺位置（減去半徑使其居中）
            this.aimTarget.style.left = (screenX - 10) + 'px';
            this.aimTarget.style.top = (screenY - 10) + 'px';
            this.aimTarget.classList.add('visible');
        }
    }
    
    // 螢幕座標轉換為遊戲座標
    screenToGameCoords(screenX, screenY) {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return null;
        
        const rect = canvas.getBoundingClientRect();
        
        // 計算 object-fit: cover 的縮放和偏移
        const gameAspectRatio = GameConfig.CANVAS.WIDTH / GameConfig.CANVAS.HEIGHT;
        const screenAspectRatio = rect.width / rect.height;
        
        let scale, offsetX, offsetY;
        
        if (screenAspectRatio > gameAspectRatio) {
            // 螢幕較寬，左右被裁剪
            scale = rect.height / GameConfig.CANVAS.HEIGHT;
            offsetX = (rect.width - GameConfig.CANVAS.WIDTH * scale) / 2;
            offsetY = 0;
        } else {
            // 螢幕較高，上下被裁剪
            scale = rect.width / GameConfig.CANVAS.WIDTH;
            offsetX = 0;
            offsetY = (rect.height - GameConfig.CANVAS.HEIGHT * scale) / 2;
        }
        
        // 轉換座標
        const gameX = (screenX - rect.left - offsetX) / scale;
        const gameY = (screenY - rect.top - offsetY) / scale;
        
        // 確保在遊戲範圍內
        return {
            x: Math.max(0, Math.min(GameConfig.CANVAS.WIDTH, gameX)),
            y: Math.max(0, Math.min(GameConfig.CANVAS.HEIGHT, gameY))
        };
    }
    
    
    // 啟用手機控制
    enable() {
        this.isEnabled = true;
    }
    
    // 禁用手機控制
    disable() {
        this.isEnabled = false;
        if (this.aimDpad) {
            this.aimDpad.classList.remove('visible', 'active', 'controlling');
        }
        this.attackDirection = { x: 0, y: 0 };
    }
    
    // 獲取攻擊方向
    getAttackDirection() {
        if (!this.isEnabled || !this.isAiming) return null;
        return { x: this.attackDirection.x, y: this.attackDirection.y };
    }
    
    // 獲取目標位置（新方法）
    getTargetPosition() {
        if (!this.isEnabled || !this.isAiming) return null;
        return { x: this.targetPosition.x, y: this.targetPosition.y };
    }
    
    // 是否正在瞄準
    isAttacking() {
        return this.isEnabled && this.isAiming;
    }
    
    // 相容性方法（遊戲代碼可能會調用）
    getMovementInput() {
        return { x: 0, y: 0 }; // 塔防遊戲不需要移動
    }
}

// 創建全域手機控制器
const mobileControls = new MobileControls();
window.mobileControls = mobileControls;