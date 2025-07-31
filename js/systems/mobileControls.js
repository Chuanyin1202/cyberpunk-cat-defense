/**
 * 手機控制系統 - 單個瞄準手把版本
 * 專為塔防遊戲設計：固定位置的瞄準手把
 */
class MobileControls {
    constructor() {
        this.isEnabled = false;
        this.aimDpad = null;
        
        // 瞄準方向
        this.attackDirection = { x: 0, y: 0 };
        
        this.createControls();
        this.detectMobile();
        
        console.log('📱 MobileControls (瞄準手把版) 初始化完成');
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
        
        console.log(`📱 設備檢測: ${isMobile ? '手機 - 顯示瞄準手把' : '桌面 - 隱藏瞄準手把'}`);
    }
    
    // 創建控制界面
    createControls() {
        // 創建瞄準手把 (初始隱藏，觸碰時顯示)
        this.aimDpad = this.createAimPad();
        document.body.appendChild(this.aimDpad);
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
                width: 120px;
                height: 120px;
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
                width: 90px;
                height: 90px;
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
                width: 30px;
                height: 30px;
                background: #00ffff;
                border-radius: 50%;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.8);
                transition: none;
            }
            </style>
            <div class="aim-label">瞄準</div>
            <div class="joystick-container">
                <div class="joystick-bg">
                    <div class="joystick-knob"></div>
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
        const maxRadius = 45;
        
        const knob = this.aimDpad.querySelector('.joystick-knob');
        
        // 觸控開始 - 在觸碰位置顯示手把
        document.addEventListener('touchstart', (event) => {
            if (!this.isEnabled || isActive) return;
            
            const touch = event.touches[0];
            
            // 檢查是否觸碰到UI元素，如果是則不顯示搖桿
            if (this.isTouchingUI(event.target)) {
                console.log('🚫 觸碰到UI元素，不顯示搖桿:', event.target);
                return;
            }
            touchId = touch.identifier;
            isActive = true;
            
            // 設置手把位置在觸碰點
            const dpadSize = 120;
            const x = Math.max(dpadSize/2, Math.min(window.innerWidth - dpadSize/2, touch.clientX));
            const y = Math.max(dpadSize/2, Math.min(window.innerHeight - dpadSize/2, touch.clientY));
            
            this.aimDpad.style.left = (x - dpadSize/2) + 'px';
            this.aimDpad.style.top = (y - dpadSize/2) + 'px';
            
            // 記錄中心位置
            centerPos.x = touch.clientX;
            centerPos.y = touch.clientY;
            
            // 顯示手把（但不立即改變攻擊方向）
            this.aimDpad.classList.add('visible');
            // 不在這裡呼叫 updateAimDirection，因為只是顯示手把
            
            event.preventDefault();
        });
        
        // 觸控移動 - 只有在手把範圍內才控制瞄準方向
        document.addEventListener('touchmove', (event) => {
            if (!isActive) return;
            
            // 找到對應的觸控點
            let currentTouch = null;
            for (let i = 0; i < event.touches.length; i++) {
                if (event.touches[i].identifier === touchId) {
                    currentTouch = event.touches[i];
                    break;
                }
            }
            
            if (currentTouch) {
                // 檢查是否在手把有效控制範圍內
                const deltaX = currentTouch.clientX - centerPos.x;
                const deltaY = currentTouch.clientY - centerPos.y;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                // 只有當移動距離超過閾值時才開始控制
                if (distance > 15) { // 15px 的啟動閾值
                    this.aimDpad.classList.add('active');
                    this.updateAimDirection(currentTouch.clientX, currentTouch.clientY, centerPos, knob, maxRadius);
                } else {
                    // 在死區內，不控制方向
                    this.aimDpad.classList.remove('active', 'controlling');
                    this.attackDirection = { x: 0, y: 0 };
                }
            }
            
            event.preventDefault();
        });
        
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
                    this.attackDirection = { x: 0, y: 0 };
                    
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
    
    // 更新瞄準方向
    updateAimDirection(clientX, clientY, startPos, knob, maxRadius) {
        const deltaX = clientX - startPos.x;
        const deltaY = clientY - startPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        const clampedDistance = Math.min(distance, maxRadius);
        const angle = Math.atan2(deltaY, deltaX);
        
        const knobX = Math.cos(angle) * clampedDistance;
        const knobY = Math.sin(angle) * clampedDistance;
        
        knob.style.transform = `translate(${knobX - 15}px, ${knobY - 15}px)`;
        
        // 計算標準化瞄準方向
        const normalizedX = clampedDistance > 10 ? knobX / maxRadius : 0;
        const normalizedY = clampedDistance > 10 ? knobY / maxRadius : 0;
        
        this.attackDirection = { x: normalizedX, y: normalizedY };
        
        if (clampedDistance > 10) {
            this.aimDpad.classList.add('controlling');
        } else {
            this.aimDpad.classList.remove('controlling');
        }
    }
    
    // 啟用手機控制
    enable() {
        this.isEnabled = true;
        console.log('📱 觸碰顯示瞄準手把已啟用');
    }
    
    // 禁用手機控制
    disable() {
        this.isEnabled = false;
        if (this.aimDpad) {
            this.aimDpad.classList.remove('visible', 'active', 'controlling');
        }
        this.attackDirection = { x: 0, y: 0 };
        console.log('📱 觸碰顯示瞄準手把已禁用');
    }
    
    // 獲取攻擊方向
    getAttackDirection() {
        if (!this.isEnabled) return null;
        if (this.attackDirection.x === 0 && this.attackDirection.y === 0) return null;
        return { x: this.attackDirection.x, y: this.attackDirection.y };
    }
    
    // 是否正在瞄準
    isAttacking() {
        return this.isEnabled && (this.attackDirection.x !== 0 || this.attackDirection.y !== 0);
    }
    
    // 相容性方法（遊戲代碼可能會調用）
    getMovementInput() {
        return { x: 0, y: 0 }; // 塔防遊戲不需要移動
    }
}

// 創建全域手機控制器
const mobileControls = new MobileControls();
window.mobileControls = mobileControls;