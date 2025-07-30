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
        
        // UI配置
        this.config = {
            cardWidth: 200,
            cardHeight: 280,
            cardSpacing: 50,
            animationDuration: 0.5,
            glitchIntensity: 2
        };
        
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
        this.game.canvas.addEventListener('mousemove', (e) => {
            if (!this.visible) return;
            this.handleMouseMove(e);
        });
        
        // 點擊事件
        this.game.canvas.addEventListener('click', (e) => {
            if (!this.visible) return;
            this.handleClick(e);
        });
        
        // 觸控事件
        this.game.canvas.addEventListener('touchstart', (e) => {
            if (!this.visible) return;
            e.preventDefault();
            const touch = e.touches[0];
            this.handleClick(touch);
        });
        
        // 鍵盤事件
        document.addEventListener('keydown', (e) => {
            if (!this.visible) return;
            this.handleKeyboard(e);
        });
    }
    
    // 顯示升級選擇
    show(upgradeChoices, callback) {
        console.log(`📋 UpgradeUI.show() 被調用，選項數量: ${upgradeChoices.length}`);
        
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
    
    // 獲取指定位置的卡片索引
    getCardIndexAt(x, y) {
        const centerX = this.game.canvas.width / 2;
        const centerY = this.game.canvas.height / 2;
        
        const totalWidth = this.config.cardWidth * 3 + this.config.cardSpacing * 2;
        const startX = centerX - totalWidth / 2;
        
        for (let i = 0; i < 3; i++) {
            const cardX = startX + i * (this.config.cardWidth + this.config.cardSpacing);
            const cardY = centerY - this.config.cardHeight / 2;
            
            if (x >= cardX && x <= cardX + this.config.cardWidth &&
                y >= cardY && y <= cardY + this.config.cardHeight) {
                return i;
            }
        }
        
        return -1;
    }
    
    // 選擇升級
    selectUpgrade(index) {
        if (index < 0 || index >= this.upgradeChoices.length) return;
        
        this.selectedIndex = index;
        const selectedUpgrade = this.upgradeChoices[index];
        
        // 創建選擇特效
        this.createSelectionEffect(index);
        
        // 延遲隱藏UI並執行回調
        setTimeout(() => {
            this.hide();
            if (this.callback) {
                this.callback(selectedUpgrade);
            }
        }, 300);
        
        console.log(`選擇升級: ${selectedUpgrade.name}`);
    }
    
    // 創建選擇特效
    createSelectionEffect(index) {
        const centerX = this.game.canvas.width / 2;
        const centerY = this.game.canvas.height / 2;
        const totalWidth = this.config.cardWidth * 3 + this.config.cardSpacing * 2;
        const startX = centerX - totalWidth / 2;
        const cardX = startX + index * (this.config.cardWidth + this.config.cardSpacing) + this.config.cardWidth / 2;
        const cardY = centerY;
        
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
        
        const centerX = this.game.canvas.width / 2;
        const centerY = this.game.canvas.height / 2;
        
        const totalWidth = this.config.cardWidth * 3 + this.config.cardSpacing * 2;
        const startX = centerX - totalWidth / 2;
        
        for (let i = 0; i < Math.min(3, this.upgradeChoices.length); i++) {
            const upgrade = this.upgradeChoices[i];
            
            if (!upgrade) continue;
            
            const cardX = startX + i * (this.config.cardWidth + this.config.cardSpacing);
            const cardY = centerY - this.config.cardHeight / 2;
            
            this.renderUpgradeCard(ctx, upgrade, cardX, cardY, i);
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
        
        // 圖標
        const iconSize = 48;
        const iconX = this.config.cardWidth / 2;
        const iconY = 50;
        
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
        
        // 升級名稱
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
        
        ctx.save();
        ctx.font = '14px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffffff';
        
        ctx.fillText('點擊或按 1-3 鍵選擇升級', centerX, instructionY);
        
        ctx.restore();
    }
}

// 導出類
window.UpgradeUI = UpgradeUI;