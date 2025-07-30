// 環形技能選單系統
// 長按貓咪基地觸發的技能選擇介面

class RadialSkillMenu {
    constructor(game) {
        this.game = game;
        this.base = game.base;
        
        // 選單狀態
        this.isOpen = false;
        this.isAnimating = false;
        this.selectedSkill = null;
        
        // 長按計時
        this.touchStartTime = 0;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.longPressTimer = null;
        this.longPressThreshold = 500; // 0.5秒觸發
        
        // 動畫參數
        this.animationProgress = 0;
        this.animationSpeed = 5;
        
        // 技能配置
        this.skills = [
            {
                id: 'plasma',
                name: '電漿彈',
                angle: 0, // 右邊
                color: '#00ffff',
                icon: 'plasma'
            },
            {
                id: 'pulse',
                name: '脈衝波',
                angle: Math.PI / 2, // 下方
                color: '#ff00ff',
                icon: 'pulse'
            },
            {
                id: 'shield',
                name: '能量護盾',
                angle: Math.PI, // 左邊
                color: '#00ff88',
                icon: 'shield'
            },
            {
                id: 'laser',
                name: '激光掃射',
                angle: Math.PI * 1.5, // 上方
                color: '#ff6600',
                icon: 'laser'
            }
        ];
        
        // 視覺參數
        this.menuRadius = 120;
        this.skillRadius = 35;
        this.innerRadius = 60;
        
        // 綁定事件
        this.bindEvents();
    }
    
    bindEvents() {
        const canvas = this.game.canvas;
        
        // 觸控事件
        canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
        // 滑鼠事件（測試用）
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }
    
    handleTouchStart(e) {
        if (this.game.gameState.isGameOver || this.game.gameState.isPaused) return;
        
        const touch = e.touches[0];
        const rect = this.game.canvas.getBoundingClientRect();
        const scaleX = GameConfig.CANVAS.WIDTH / rect.width;
        const scaleY = GameConfig.CANVAS.HEIGHT / rect.height;
        
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        
        // 檢查是否點擊在貓咪基地上
        const distance = Math.sqrt(
            Math.pow(x - this.base.x, 2) + 
            Math.pow(y - this.base.y, 2)
        );
        
        if (distance <= this.base.radius) {
            this.startLongPress(x, y);
        }
    }
    
    handleTouchMove(e) {
        if (!this.isOpen) return;
        
        const touch = e.touches[0];
        const rect = this.game.canvas.getBoundingClientRect();
        const scaleX = GameConfig.CANVAS.WIDTH / rect.width;
        const scaleY = GameConfig.CANVAS.HEIGHT / rect.height;
        
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;
        
        this.updateSelection(x, y);
    }
    
    handleTouchEnd(e) {
        this.endTouch();
    }
    
    // 滑鼠事件處理（方便測試）
    handleMouseDown(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        const scaleX = GameConfig.CANVAS.WIDTH / rect.width;
        const scaleY = GameConfig.CANVAS.HEIGHT / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const distance = Math.sqrt(
            Math.pow(x - this.base.x, 2) + 
            Math.pow(y - this.base.y, 2)
        );
        
        if (distance <= this.base.radius) {
            this.startLongPress(x, y);
        }
    }
    
    handleMouseMove(e) {
        if (!this.isOpen) return;
        
        const rect = this.game.canvas.getBoundingClientRect();
        const scaleX = GameConfig.CANVAS.WIDTH / rect.width;
        const scaleY = GameConfig.CANVAS.HEIGHT / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        this.updateSelection(x, y);
    }
    
    handleMouseUp(e) {
        this.endTouch();
    }
    
    startLongPress(x, y) {
        this.touchStartTime = Date.now();
        this.touchStartX = x;
        this.touchStartY = y;
        
        // 設置長按計時器
        this.longPressTimer = setTimeout(() => {
            this.openMenu();
        }, this.longPressThreshold);
    }
    
    updateSelection(x, y) {
        // 計算角度和距離
        const dx = x - this.base.x;
        const dy = y - this.base.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // 清除之前的選擇
        this.selectedSkill = null;
        
        // 檢查是否在有效範圍內
        if (distance < this.innerRadius || distance > this.menuRadius + this.skillRadius) {
            return;
        }
        
        // 找到最近的技能
        let minAngleDiff = Math.PI;
        let closestSkill = null;
        
        this.skills.forEach(skill => {
            let angleDiff = Math.abs(angle - skill.angle);
            if (angleDiff > Math.PI) {
                angleDiff = 2 * Math.PI - angleDiff;
            }
            
            if (angleDiff < minAngleDiff && angleDiff < Math.PI / 4) {
                minAngleDiff = angleDiff;
                closestSkill = skill;
            }
        });
        
        this.selectedSkill = closestSkill;
    }
    
    endTouch() {
        // 清除長按計時器
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        // 如果選單打開且有選中的技能，則施放
        if (this.isOpen && this.selectedSkill) {
            this.activateSkill(this.selectedSkill);
        }
        
        // 關閉選單
        if (this.isOpen) {
            this.closeMenu();
        }
    }
    
    openMenu() {
        this.isOpen = true;
        this.isAnimating = true;
        this.animationProgress = 0;
        
        // 震動反饋（如果支援）
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
        
        // 標記選單開啟狀態，但不暫停整個遊戲
        this.game.isMenuOpen = true;
    }
    
    closeMenu() {
        this.isOpen = false;
        this.isAnimating = true;
        this.selectedSkill = null;
        
        // 標記選單關閉
        this.game.isMenuOpen = false;
    }
    
    activateSkill(skill) {
        let success = false;
        
        // 技能系統已簡化，技能將移至升級系統
        switch(skill.id) {
            case 'plasma':
            case 'pulse':
            case 'shield':
                console.log(`技能 ${skill.id} 已移至升級系統`);
                success = false;
                break;
            case 'laser':
                // TODO: 實現激光技能
                console.log('激光技能尚未實現');
                break;
        }
        
        // 只有成功施放才有視覺反饋
        if (success) {
            this.createActivationEffect(skill);
        }
    }
    
    createActivationEffect(skill) {
        // 創建技能施放特效
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            this.game.particleManager.addParticle(
                this.base.x + Math.cos(angle) * 30,
                this.base.y + Math.sin(angle) * 30,
                {
                    vx: Math.cos(angle) * 150,
                    vy: Math.sin(angle) * 150,
                    life: 0.5,
                    color: skill.color,
                    size: 4,
                    type: 'skill_activation',
                    glow: true
                }
            );
        }
    }
    
    update(deltaTime) {
        // 更新動畫
        if (this.isAnimating) {
            if (this.isOpen) {
                this.animationProgress = Math.min(1, this.animationProgress + deltaTime * this.animationSpeed);
                if (this.animationProgress >= 1) {
                    this.isAnimating = false;
                }
            } else {
                this.animationProgress = Math.max(0, this.animationProgress - deltaTime * this.animationSpeed);
                if (this.animationProgress <= 0) {
                    this.isAnimating = false;
                }
            }
        }
    }
    
    render(ctx) {
        if (this.animationProgress <= 0) return;
        
        ctx.save();
        
        // 半透明背景
        ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * this.animationProgress})`;
        ctx.fillRect(0, 0, GameConfig.CANVAS.WIDTH, GameConfig.CANVAS.HEIGHT);
        
        // 中心光環
        this.renderCenterGlow(ctx);
        
        // 技能圖標
        this.renderSkills(ctx);
        
        // 選擇指示器
        if (this.selectedSkill) {
            this.renderSelection(ctx);
        }
        
        ctx.restore();
    }
    
    renderCenterGlow(ctx) {
        const gradient = ctx.createRadialGradient(
            this.base.x, this.base.y, 0,
            this.base.x, this.base.y, this.menuRadius * this.animationProgress
        );
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.3)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.1)');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.base.x, this.base.y, this.menuRadius * this.animationProgress, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderSkills(ctx) {
        const currentTime = Date.now();
        
        this.skills.forEach(skill => {
            const progress = this.animationProgress;
            const radius = this.menuRadius * progress;
            
            const x = this.base.x + Math.cos(skill.angle) * radius;
            const y = this.base.y + Math.sin(skill.angle) * radius;
            
            // 檢查技能冷卻
            let isOnCooldown = false;
            let cooldownPercent = 0;
            
            if (skill.id === 'plasma' || skill.id === 'pulse') {
                // 技能冷卻檢查已移除，技能將移至升級系統
                isOnCooldown = false;
                cooldownPercent = 0;
            }
            
            // 技能背景
            ctx.save();
            ctx.globalAlpha = progress * (isOnCooldown ? 0.5 : 1);
            
            // 外框
            const isSelected = this.selectedSkill === skill;
            const scale = isSelected && !isOnCooldown ? 1.2 : 1;
            
            ctx.strokeStyle = isOnCooldown ? '#666666' : skill.color;
            ctx.lineWidth = 3;
            ctx.shadowBlur = isOnCooldown ? 5 : 20;
            ctx.shadowColor = isOnCooldown ? '#666666' : skill.color;
            
            ctx.beginPath();
            ctx.arc(x, y, this.skillRadius * scale, 0, Math.PI * 2);
            ctx.stroke();
            
            // 內部填充
            const fillGradient = ctx.createRadialGradient(x, y, 0, x, y, this.skillRadius * scale);
            fillGradient.addColorStop(0, Utils.adjustAlpha(skill.color, 0.3));
            fillGradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
            
            ctx.fillStyle = fillGradient;
            ctx.fill();
            
            // 繪製技能圖標
            this.renderSkillIcon(ctx, x, y, skill.icon, skill.color);
            
            // 技能名稱
            if (isSelected) {
                ctx.font = 'bold 14px "Courier New", monospace';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 10;
                ctx.shadowColor = skill.color;
                ctx.fillText(skill.name, x, y - this.skillRadius - 15);
            }
            
            ctx.restore();
        });
    }
    
    renderSkillIcon(ctx, x, y, iconType, color) {
        ctx.save();
        ctx.translate(x, y);
        
        switch(iconType) {
            case 'plasma':
                this.drawPlasmaIcon(ctx, color);
                break;
            case 'pulse':
                this.drawPulseIcon(ctx, color);
                break;
            case 'shield':
                this.drawShieldIcon(ctx, color);
                break;
            case 'laser':
                this.drawLaserIcon(ctx, color);
                break;
        }
        
        ctx.restore();
    }
    
    drawPlasmaIcon(ctx, color) {
        // 簡化的電漿彈圖標
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        
        // 電弧
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            ctx.beginPath();
            ctx.arc(0, 0, 15, angle, angle + Math.PI / 4);
            ctx.stroke();
        }
    }
    
    drawPulseIcon(ctx, color) {
        // 簡化的脈衝波圖標
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        
        for (let i = 0; i < 3; i++) {
            ctx.globalAlpha = 1 - i * 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, 5 + i * 7, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    drawShieldIcon(ctx, color) {
        // 護盾圖標
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        
        // 簡化的護盾形狀
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(12, -5);
        ctx.lineTo(12, 10);
        ctx.lineTo(0, 15);
        ctx.lineTo(-12, 10);
        ctx.lineTo(-12, -5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    drawLaserIcon(ctx, color) {
        // 激光圖標
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        
        // 十字準心
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(15, 0);
        ctx.moveTo(0, -15);
        ctx.lineTo(0, 15);
        ctx.stroke();
        
        // 中心點
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderSelection(ctx) {
        const skill = this.selectedSkill;
        const x = this.base.x + Math.cos(skill.angle) * this.menuRadius;
        const y = this.base.y + Math.sin(skill.angle) * this.menuRadius;
        
        // 連接線
        ctx.strokeStyle = skill.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = skill.color;
        ctx.globalAlpha = 0.8;
        
        ctx.beginPath();
        ctx.moveTo(this.base.x, this.base.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        // 選中光環
        ctx.beginPath();
        ctx.arc(x, y, this.skillRadius * 1.5, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// 導出類
window.RadialSkillMenu = RadialSkillMenu;