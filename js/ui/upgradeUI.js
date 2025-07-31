// 升級UI界面 - 賽博龐克風格的升級選擇界面
// 每波結束後顯示三選一升級選項

class UpgradeUI {
    constructor(game) {
        this.game = game;
        this.visible = false;
        this.upgradeChoices = [];
        this.selectedIndex = -1;
        this.hoverIndex = -1;
        this.callback = null;
        
        // 事件處理器引用
        this.eventHandlers = {};
        
        // UI配置 - 會根據平台動態調整
        this.config = this.getUIConfig();
        
        // 動畫狀態
        this.animationTime = 0;
        this.showAnimation = false;
        this.glitchTimer = 0;
        
        // 粒子效果
        this.backgroundParticles = [];
        this.initBackgroundParticles();
        
        // 綁定事件
        this.bindEvents();
    }
    
    // 獲取UI配置 - 根據平台和螢幕尺寸調整
    getUIConfig() {
        const isTouchDevice = window.mobileControls && window.mobileControls.isEnabled;
        
        // 使用實際顯示寬度而不是canvas內部寬度
        const actualDisplayWidth = window.innerWidth;
        const canvasWidth = this.game.canvas.width;
        
        // 手機檢測：觸控設備且實際螢幕寬度小於700px
        const isMobileScreen = actualDisplayWidth < 700;
        
        console.log(`🔍 平台檢測: 觸控設備=${isTouchDevice}, Canvas寬度=${canvasWidth}, 實際顯示寬度=${actualDisplayWidth}, 手機螢幕=${isMobileScreen}`);
        
        if (isTouchDevice && isMobileScreen) {
            // 手機版：垂直排列，充分利用螢幕寬度
            return {
                cardWidth: Math.min(300, actualDisplayWidth - 40), // 適應實際顯示寬度，留20px邊距
                cardHeight: 120,  // 扁平卡片設計
                cardSpacing: 15,  
                animationDuration: 0.5,
                glitchIntensity: 1,
                layout: 'vertical',  // 垂直布局
                maxCardsPerRow: 1    // 每行最多1張卡片
            };
        } else {
            // PC版/平板版：橫向排列，正常大小
            return {
                cardWidth: 200,
                cardHeight: 280,
                cardSpacing: 50,
                animationDuration: 0.5,
                glitchIntensity: 2,
                layout: 'horizontal', // 橫向布局
                maxCardsPerRow: 3     // 每行最多3張卡片
            };
        }
    }
    
    // 初始化背景粒子
    initBackgroundParticles() {
        for (let i = 0; i < 50; i++) {
            this.backgroundParticles.push({
                x: Math.random() * this.game.canvas.width,
                y: Math.random() * this.game.canvas.height,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                life: Math.random(),
                maxLife: Math.random() * 2 + 1,
                color: ['#00ffff', '#ff00ff', '#00ff88'][Math.floor(Math.random() * 3)]
            });
        }
    }
    
    // 綁定事件
    bindEvents() {
        // 滑鼠移動事件
        this.eventHandlers.mousemove = (e) => {
            if (!this.visible) return;
            this.handleMouseMove(e);
        };
        this.game.canvas.addEventListener('mousemove', this.eventHandlers.mousemove);
        
        // 點擊事件
        this.eventHandlers.click = (e) => {
            if (!this.visible) return;
            this.handleClick(e);
        };
        this.game.canvas.addEventListener('click', this.eventHandlers.click);
        
        // 觸控事件
        this.eventHandlers.touchstart = (e) => {
            if (!this.visible) return;
            e.preventDefault();
            const touch = e.touches[0];
            this.handleClick(touch);
        };
        this.game.canvas.addEventListener('touchstart', this.eventHandlers.touchstart);
        
        // 鍵盤事件
        this.eventHandlers.keydown = (e) => {
            if (!this.visible) return;
            this.handleKeyboard(e);
        };
        document.addEventListener('keydown', this.eventHandlers.keydown);
    }
    
    // 清理事件監聽器
    cleanup() {
        // 移除畫布事件
        if (this.eventHandlers.mousemove) {
            this.game.canvas.removeEventListener('mousemove', this.eventHandlers.mousemove);
        }
        if (this.eventHandlers.click) {
            this.game.canvas.removeEventListener('click', this.eventHandlers.click);
        }
        if (this.eventHandlers.touchstart) {
            this.game.canvas.removeEventListener('touchstart', this.eventHandlers.touchstart);
        }
        
        // 移除文檔事件
        if (this.eventHandlers.keydown) {
            document.removeEventListener('keydown', this.eventHandlers.keydown);
        }
        
        // 清空事件處理器引用
        this.eventHandlers = {};
    }
    
    // 顯示升級選擇
    show(upgradeChoices, callback) {
        console.log(`📋 UpgradeUI.show() 被調用，選項數量: ${upgradeChoices.length}`);
        
        // 重新獲取UI配置，確保使用最新的平台設定
        this.config = this.getUIConfig();
        console.log(`🔧 UI配置更新: 布局=${this.config.layout}, 卡片大小=${this.config.cardWidth}x${this.config.cardHeight}`);
        
        this.upgradeChoices = upgradeChoices;
        this.callback = callback;
        this.visible = true;
        this.showAnimation = true;
        this.animationTime = 0;
        this.selectedIndex = -1;
        this.hoverIndex = -1;
        
        // 暫停遊戲
        this.game.gameState.isPaused = true;
        
        console.log('✅ 升級選擇界面已設置為可見');
        console.log('🎮 遊戲已暫停');
    }
    
    // 隱藏升級選擇
    hide() {
        this.visible = false;
        this.showAnimation = false;
        this.animationTime = 0;
        
        // 恢復遊戲
        this.game.gameState.isPaused = false;
    }
    
    // 處理滑鼠移動
    handleMouseMove(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        const scaleX = this.game.canvas.width / rect.width;
        const scaleY = this.game.canvas.height / rect.height;
        
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        // 檢查是否懸停在卡片上
        this.hoverIndex = this.getCardIndexAt(mouseX, mouseY);
        
        // 改變滑鼠樣式
        this.game.canvas.style.cursor = this.hoverIndex >= 0 ? 'pointer' : 'default';
    }
    
    // 處理點擊
    handleClick(e) {
        const rect = this.game.canvas.getBoundingClientRect();
        const scaleX = this.game.canvas.width / rect.width;
        const scaleY = this.game.canvas.height / rect.height;
        
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;
        
        const cardIndex = this.getCardIndexAt(clickX, clickY);
        
        if (cardIndex >= 0) {
            this.selectUpgrade(cardIndex);
        }
    }
    
    // 處理鍵盤輸入
    handleKeyboard(e) {
        switch (e.key) {
            case '1':
                if (this.upgradeChoices[0]) this.selectUpgrade(0);
                break;
            case '2':
                if (this.upgradeChoices[1]) this.selectUpgrade(1);
                break;
            case '3':
                if (this.upgradeChoices[2]) this.selectUpgrade(2);
                break;
            case 'Escape':
                // ESC鍵取消（如果有默認選項）
                break;
        }
    }
    
    // 獲取指定位置的卡片索引 - 支援多種布局
    getCardIndexAt(x, y) {
        const positions = this.getCardPositions();
        
        for (let i = 0; i < Math.min(3, this.upgradeChoices.length); i++) {
            const pos = positions[i];
            if (!pos) continue;
            
            if (x >= pos.x && x <= pos.x + this.config.cardWidth &&
                y >= pos.y && y <= pos.y + this.config.cardHeight) {
                return i;
            }
        }
        
        return -1;
    }
    
    // 計算卡片位置 - 根據布局類型
    getCardPositions() {
        const centerX = this.game.canvas.width / 2;
        const centerY = this.game.canvas.height / 2;
        const positions = [];
        
        if (this.config.layout === 'vertical') {
            // 垂直布局 - 手機版，扁平卡片設計
            const totalHeight = this.config.cardHeight * 3 + this.config.cardSpacing * 2;
            const startY = Math.max(140, centerY - totalHeight / 2); // 距離頂部至少140px
            
            for (let i = 0; i < 3; i++) {
                positions.push({
                    x: centerX - this.config.cardWidth / 2,
                    y: startY + i * (this.config.cardHeight + this.config.cardSpacing)
                });
            }
        } else {
            // 橫向布局 - PC版
            const totalWidth = this.config.cardWidth * 3 + this.config.cardSpacing * 2;
            const startX = centerX - totalWidth / 2;
            
            for (let i = 0; i < 3; i++) {
                positions.push({
                    x: startX + i * (this.config.cardWidth + this.config.cardSpacing),
                    y: centerY - this.config.cardHeight / 2
                });
            }
        }
        
        return positions;
    }
    
    // 選擇升級
    selectUpgrade(index) {
        if (index < 0 || index >= this.upgradeChoices.length) return;
        
        this.selectedIndex = index;
        const selectedUpgrade = this.upgradeChoices[index];
        
        // 創建選擇特效
        this.createSelectionEffect(index);
        
        // 延遲隱藏UI並執行回調
        if (window.timerManager) {
            window.timerManager.setTimeout(() => {
                this.hide();
                if (this.callback) {
                    this.callback(selectedUpgrade);
                }
            }, 300);
        } else {
            setTimeout(() => {
                this.hide();
                if (this.callback) {
                    this.callback(selectedUpgrade);
                }
            }, 300);
        }
        
        console.log(`選擇升級: ${selectedUpgrade.name}`);
    }
    
    // 創建選擇特效
    createSelectionEffect(index) {
        const positions = this.getCardPositions();
        const pos = positions[index];
        
        if (!pos) return;
        
        const cardX = pos.x + this.config.cardWidth / 2;
        const cardY = pos.y + this.config.cardHeight / 2;
        
        // 添加粒子爆炸效果
        if (this.game.particleManager) {
            for (let i = 0; i < 30; i++) {
                const angle = (i / 30) * Math.PI * 2;
                const speed = 200 + Math.random() * 100;
                
                this.game.particleManager.addParticle(cardX, cardY, {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 1.5,
                    color: UpgradeDefinitions.getQualityColor(this.upgradeChoices[index].quality),
                    size: 3,
                    type: 'firework_spark',
                    glow: true,
                    gravity: 50,
                    friction: 0.95
                });
            }
        }
    }
    
    // 更新系統
    update(deltaTime) {
        if (!this.visible) return;
        
        // 更新動畫時間
        if (this.showAnimation) {
            this.animationTime += deltaTime;
            if (this.animationTime >= this.config.animationDuration) {
                this.showAnimation = false;
            }
        }
        
        // 更新故障效果
        this.glitchTimer += deltaTime;
        
        // 更新背景粒子
        this.updateBackgroundParticles(deltaTime);
    }
    
    // 更新背景粒子
    updateBackgroundParticles(deltaTime) {
        for (const particle of this.backgroundParticles) {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime;
            
            // 邊界處理
            if (particle.x < 0 || particle.x > this.game.canvas.width ||
                particle.y < 0 || particle.y > this.game.canvas.height ||
                particle.life <= 0) {
                
                particle.x = Math.random() * this.game.canvas.width;
                particle.y = Math.random() * this.game.canvas.height;
                particle.vx = (Math.random() - 0.5) * 20;
                particle.vy = (Math.random() - 0.5) * 20;
                particle.life = particle.maxLife;
            }
        }
    }
    
    // 渲染升級界面
    render(ctx) {
        if (!this.visible) return;
        
        ctx.save();
        
        // 渲染背景覆蓋
        this.renderBackground(ctx);
        
        // 渲染標題
        this.renderTitle(ctx);
        
        // 渲染升級卡片
        this.renderUpgradeCards(ctx);
        
        // 渲染指令提示
        this.renderInstructions(ctx);
        
        ctx.restore();
    }
    
    // 渲染背景
    renderBackground(ctx) {
        // 半透明背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        
        // 數據流背景
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        
        const gridSize = 30;
        for (let x = 0; x < this.game.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.game.canvas.height);
            ctx.stroke();
        }
        
        for (let y = 0; y < this.game.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.game.canvas.width, y);
            ctx.stroke();
        }
        ctx.restore();
        
        // 渲染背景粒子
        for (const particle of this.backgroundParticles) {
            ctx.save();
            ctx.globalAlpha = particle.life / particle.maxLife * 0.3;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    // 渲染標題
    renderTitle(ctx) {
        const centerX = this.game.canvas.width / 2;
        const titleY = 80;
        
        // 動畫進入效果
        let alpha = 1;
        if (this.showAnimation) {
            alpha = Math.min(1, this.animationTime / 0.3);
        }
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // 主標題
        ctx.font = 'bold 48px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        
        // 故障效果
        const glitchX = Math.sin(this.glitchTimer * 10) * this.config.glitchIntensity;
        const glitchY = Math.cos(this.glitchTimer * 15) * this.config.glitchIntensity;
        
        ctx.fillText('UPGRADE', centerX + glitchX, titleY + glitchY);
        
        // RGB分離效果
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = '#ff00ff';
        ctx.fillText('UPGRADE', centerX + glitchX - 2, titleY + glitchY);
        ctx.fillStyle = '#00ff88';
        ctx.fillText('UPGRADE', centerX + glitchX + 2, titleY + glitchY);
        
        ctx.globalCompositeOperation = 'source-over';
        
        // 副標題
        ctx.font = '20px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.fillText('選擇你的進化方向', centerX, titleY + 60);
        
        ctx.restore();
    }
    
    // 渲染升級卡片
    renderUpgradeCards(ctx) {
        if (!this.upgradeChoices || this.upgradeChoices.length === 0) {
            // 渲染錯誤提示
            ctx.save();
            ctx.font = '20px "Courier New", monospace';
            ctx.fillStyle = '#ff0000';
            ctx.textAlign = 'center';
            ctx.fillText('錯誤：沒有升級選項', this.game.canvas.width / 2, this.game.canvas.height / 2);
            ctx.restore();
            return;
        }
        
        const positions = this.getCardPositions();
        
        for (let i = 0; i < Math.min(3, this.upgradeChoices.length); i++) {
            const upgrade = this.upgradeChoices[i];
            const pos = positions[i];
            
            if (!upgrade || !pos) continue;
            
            this.renderUpgradeCard(ctx, upgrade, pos.x, pos.y, i);
        }
    }
    
    // 渲染單個升級卡片
    renderUpgradeCard(ctx, upgrade, x, y, index) {
        // console.log(`🎴 開始渲染卡片 ${index}: ${upgrade.name} 在位置 (${x}, ${y})`); // 移除調試日誌
        ctx.save();
        
        // 動畫進入效果
        let scale = 1;
        let alpha = 1;
        if (this.showAnimation) {
            const delay = index * 0.1;
            const progress = Math.max(0, (this.animationTime - delay) / 0.4);
            scale = Math.min(1, progress * 1.2);
            alpha = Math.min(1, progress);
            
            if (progress < 1) {
                y += (1 - progress) * 50;
            }
        }
        
        // 懸停效果
        const isHovered = this.hoverIndex === index;
        const isSelected = this.selectedIndex === index;
        
        if (isHovered && !isSelected) {
            scale *= 1.05;
        }
        
        if (isSelected) {
            scale *= 1.1;
        }
        
        ctx.globalAlpha = alpha;
        ctx.translate(x + this.config.cardWidth / 2, y + this.config.cardHeight / 2);
        ctx.scale(scale, scale);
        ctx.translate(-this.config.cardWidth / 2, -this.config.cardHeight / 2);
        
        // 卡片品質顏色
        const qualityColor = UpgradeDefinitions.getQualityColor(upgrade.quality);
        
        // 卡片背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, this.config.cardWidth, this.config.cardHeight);
        
        // 卡片邊框
        ctx.strokeStyle = qualityColor;
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.shadowBlur = isHovered ? 15 : 10;
        ctx.shadowColor = qualityColor;
        ctx.strokeRect(0, 0, this.config.cardWidth, this.config.cardHeight);
        
        // 品質等級條
        ctx.fillStyle = qualityColor;
        ctx.fillRect(0, 0, this.config.cardWidth, 8);
        
        // 圖標位置 - 根據布局調整
        const isVerticalLayout = this.config.layout === 'vertical';
        const iconSize = isVerticalLayout ? 32 : 48;
        const iconX = isVerticalLayout ? 50 : this.config.cardWidth / 2;
        const iconY = isVerticalLayout ? this.config.cardHeight / 2 : 50;
        
        // console.log(`🎨 繪製圖標: ${upgrade.icon} 在 (${iconX}, ${iconY}), 大小: ${iconSize}, 顏色: ${qualityColor}`); // 移除調試日誌
        
        try {
            VectorIcons.drawIcon(ctx, upgrade.icon, iconX, iconY, iconSize, qualityColor, {
                glow: true,
                active: isHovered,
                time: this.glitchTimer
            });
            // console.log(`✅ 圖標 ${upgrade.icon} 繪製完成`); // 移除調試日誌
        } catch (error) {
            console.error(`❌ 繪製圖標時出錯:`, error);
            // 繪製替代圖標
            ctx.fillStyle = qualityColor;
            ctx.fillRect(iconX - 20, iconY - 20, 40, 40);
        }
        
        if (isVerticalLayout) {
            // 手機版橫向布局：圖標左側，文字右側
            const textStartX = 90;
            
            // 升級名稱
            ctx.font = 'bold 14px "Courier New", monospace';
            ctx.textAlign = 'left';
            ctx.fillStyle = qualityColor;
            ctx.shadowBlur = 5;
            ctx.shadowColor = qualityColor;
            ctx.fillText(upgrade.name, textStartX, 30);
            
            // 類別標籤  
            ctx.font = '10px "Courier New", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 3;
            const categoryText = {
                weapon: '武器',
                ability: '能力', 
                survival: '生存'
            }[upgrade.category] || upgrade.category;
            ctx.fillText(`[${categoryText}]`, textStartX, 45);
            
            // 描述文字
            ctx.font = '10px "Courier New", monospace';
            ctx.fillStyle = '#cccccc';
            ctx.shadowBlur = 2;
            
            const description = upgrade.description;
            const maxCharsPerLine = Math.floor((this.config.cardWidth - textStartX - 10) / 6); // 估算字符數
            const lines = this.wrapText(description, maxCharsPerLine);
            
            for (let i = 0; i < lines.length && i < 3; i++) {
                ctx.fillText(lines[i], textStartX, 65 + i * 12);
            }
            
            // 風味文字
            if (upgrade.flavorText) {
                ctx.font = 'italic 8px "Courier New", monospace';
                ctx.fillStyle = qualityColor;
                ctx.globalAlpha = 0.6;
                const flavorLines = this.wrapText(upgrade.flavorText, maxCharsPerLine);
                for (let i = 0; i < flavorLines.length && i < 1; i++) {
                    ctx.fillText(flavorLines[i], textStartX, 100 + i * 10);
                }
            }
        } else {
            // PC版垂直布局：保持原有設計
            ctx.font = 'bold 16px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = qualityColor;
            ctx.shadowBlur = 5;
            ctx.shadowColor = qualityColor;
            ctx.fillText(upgrade.name, this.config.cardWidth / 2, 120);
            
            // 類別標籤
            ctx.font = '12px "Courier New", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 3;
            const categoryText = {
                weapon: '武器',
                ability: '能力',
                survival: '生存'
            }[upgrade.category] || upgrade.category;
            ctx.fillText(`[${categoryText}]`, this.config.cardWidth / 2, 140);
            
            // 描述文字
            ctx.font = '12px "Courier New", monospace';
            ctx.fillStyle = '#cccccc';
            ctx.shadowBlur = 2;
            
            const description = upgrade.description;
            const maxCharsPerLine = 18;
            const lines = this.wrapText(description, maxCharsPerLine);
            
            for (let i = 0; i < lines.length && i < 4; i++) {
                ctx.fillText(lines[i], this.config.cardWidth / 2, 165 + i * 16);
            }
            
            // 風味文字
            if (upgrade.flavorText) {
                ctx.font = 'italic 10px "Courier New", monospace';
                ctx.fillStyle = qualityColor;
                ctx.globalAlpha = 0.8;
                const flavorLines = this.wrapText(upgrade.flavorText, 20);
                for (let i = 0; i < flavorLines.length && i < 2; i++) {
                    ctx.fillText(flavorLines[i], this.config.cardWidth / 2, 240 + i * 12);
                }
            }
        }
        
        // 鍵盤快捷鍵提示
        ctx.font = 'bold 24px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = qualityColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;
        const keyNumber = (index + 1).toString();
        ctx.strokeText(keyNumber, 15, 30);
        ctx.fillText(keyNumber, 15, 30);
        
        // 選中效果
        if (isSelected) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(-5, -5, this.config.cardWidth + 10, this.config.cardHeight + 10);
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    }
    
    // 文字換行
    wrapText(text, maxChars) {
        const words = text.split('');
        const lines = [];
        let currentLine = '';
        
        for (const char of words) {
            if (currentLine.length + 1 <= maxChars) {
                currentLine += char;
            } else {
                lines.push(currentLine);
                currentLine = char;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines;
    }
    
    // 渲染操作指令
    renderInstructions(ctx) {
        const centerX = this.game.canvas.width / 2;
        const instructionY = this.game.canvas.height - 50;
        const isMobile = this.config.layout === 'vertical';
        
        ctx.save();
        ctx.font = isMobile ? '12px "Courier New", monospace' : '14px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffffff';
        
        const instructionText = isMobile ? '點擊卡片選擇升級' : '點擊或按 1-3 鍵選擇升級';
        ctx.fillText(instructionText, centerX, instructionY);
        
        ctx.restore();
    }
}

// 導出類
window.UpgradeUI = UpgradeUI;