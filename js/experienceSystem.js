// 經驗值系統 - 管理玩家經驗值和等級
// 為升級系統提供基礎數據
// 版本更新：添加控制提示渲染功能

class ExperienceSystem {
    constructor() {
        // 經驗值數據
        this.experience = 0;
        this.level = 1;
        this.experienceToNextLevel = 100; // 每級需要100經驗值
        
        // 經驗值獎勵配置
        this.expRewards = {
            normal: 15,
            fast: 20,
            tank: 35,
            waveBonus: 50, // 基礎波次獎勵
            waveBonusMultiplier: 10 // 每波額外獎勵
        };
        
        // 等級影響升級品質
        this.qualityThresholds = {
            common: 1,    // 1級以上：普通品質
            rare: 2,      // 2級以上：稀有品質
            epic: 4,      // 4級以上：史詩品質
            legendary: 8  // 8級以上：傳說品質
        };
        
        // 視覺效果
        this.levelUpEffect = false;
        this.levelUpTimer = 0;
        this.expGainAnimations = []; // 經驗值獲得動畫
    }
    
    // 獲得經驗值
    gainExperience(amount, source = 'kill') {
        this.experience += amount;
        
        // 創建獲得經驗值動畫
        this.createExpGainAnimation(amount, source);
        
        // 檢查是否升級
        this.checkLevelUp();
        
        // console.log(`獲得 ${amount} 經驗值 (${source})`); // 移除頻繁日誌
    }
    
    // 擊殺敵人獲得經驗值
    killEnemy(enemyType) {
        const expAmount = this.expRewards[enemyType] || 10;
        this.gainExperience(expAmount, `kill_${enemyType}`);
    }
    
    // 波次完成獎勵
    completeWave(waveNumber) {
        const bonus = this.expRewards.waveBonus + (waveNumber * this.expRewards.waveBonusMultiplier);
        this.gainExperience(bonus, `wave_${waveNumber}`);
    }
    
    // 檢查升級
    checkLevelUp() {
        while (this.experience >= this.experienceToNextLevel) {
            this.levelUp();
        }
    }
    
    // 升級
    levelUp() {
        this.experience -= this.experienceToNextLevel;
        this.level++;
        
        // 觸發升級特效
        this.levelUpEffect = true;
        this.levelUpTimer = 0;
        
        // 下一級所需經驗值（線性增長）
        this.experienceToNextLevel = 100 + (this.level - 1) * 25;
        
        console.log(`等級提升到 ${this.level}！下一級需要 ${this.experienceToNextLevel} 經驗值`);
    }
    
    // 獲取當前品質等級
    getCurrentQuality() {
        if (this.level >= this.qualityThresholds.legendary) return 'legendary';
        if (this.level >= this.qualityThresholds.epic) return 'epic';
        if (this.level >= this.qualityThresholds.rare) return 'rare';
        return 'common';
    }
    
    // 獲取品質顏色
    getQualityColor(quality = null) {
        const currentQuality = quality || this.getCurrentQuality();
        const colors = {
            common: '#ffffff',     // 白色
            rare: '#00ffff',       // 青色
            epic: '#ff00ff',       // 洋紅
            legendary: '#ffff00'   // 黃色
        };
        return colors[currentQuality] || colors.common;
    }
    
    // 創建經驗值獲得動畫
    createExpGainAnimation(amount, source) {
        const animation = {
            amount: amount,
            source: source,
            timer: 0,
            maxTime: 2.0,
            y: 0,
            alpha: 1.0,
            scale: 1.2
        };
        
        this.expGainAnimations.push(animation);
    }
    
    // 更新系統
    update(deltaTime) {
        // 更新升級特效
        if (this.levelUpEffect) {
            this.levelUpTimer += deltaTime;
            if (this.levelUpTimer >= 3.0) {
                this.levelUpEffect = false;
            }
        }
        
        // 更新經驗值獲得動畫
        for (let i = this.expGainAnimations.length - 1; i >= 0; i--) {
            const anim = this.expGainAnimations[i];
            anim.timer += deltaTime;
            
            // 動畫效果
            const progress = anim.timer / anim.maxTime;
            anim.y = -progress * 60; // 向上飄移
            anim.alpha = 1 - progress;
            anim.scale = 1.2 - progress * 0.4;
            
            if (anim.timer >= anim.maxTime) {
                this.expGainAnimations.splice(i, 1);
            }
        }
    }
    
    // 渲染經驗值UI（增加控制提示和調整間距）
    render(ctx, x = 20, y = 100) {
        ctx.save();
        
        // 經驗值條背景
        const barWidth = 180;
        const barHeight = 6;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // 經驗值條
        const expProgress = this.experience / this.experienceToNextLevel;
        const qualityColor = this.getQualityColor();
        
        ctx.fillStyle = qualityColor;
        ctx.shadowBlur = 5;
        ctx.shadowColor = qualityColor;
        ctx.fillRect(x, y, barWidth * expProgress, barHeight);
        
        // 經驗值條邊框
        ctx.strokeStyle = qualityColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
        
        // 等級顯示在經驗條上方中間
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = qualityColor;
        ctx.shadowBlur = 8;
        const barCenterX = x + barWidth / 2; // 經驗條中心位置
        ctx.fillText(`LV.${this.level}`, barCenterX, y - 10);
        
        // 簡化顯示：數值/總數 EXP
        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 3;
        ctx.fillText(
            `${this.experience}/${this.experienceToNextLevel} EXP`, 
            x + barWidth + 8, y + 4
        );
        
        // 移除品質等級指示（不顯示COMMON等文字）
        
        ctx.restore();
        
        // 渲染升級特效
        if (this.levelUpEffect) {
            this.renderLevelUpEffect(ctx);
        }
        
        // 渲染經驗值獲得動畫
        this.renderExpGainAnimations(ctx);
    }
    
    // 渲染能量條（新增方法）
    renderEnergyBar(ctx, x = 20, y = 130, currentEnergy, maxEnergy) {
        ctx.save();
        
        const barWidth = 180;
        const barHeight = 6;
        
        // 能量條背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // 能量條進度
        const energyProgress = currentEnergy / maxEnergy;
        const energyColor = '#ffff00'; // 黃色能量條
        
        ctx.fillStyle = energyColor;
        ctx.shadowBlur = 5;
        ctx.shadowColor = energyColor;
        ctx.fillRect(x, y, barWidth * energyProgress, barHeight);
        
        // 能量條邊框
        ctx.strokeStyle = energyColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
        
        // 能量文字
        ctx.font = 'bold 10px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = energyColor;
        ctx.shadowBlur = 8;
        ctx.fillText('ENERGY', x, y - 3);
        
        // 能量數值
        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 3;
        ctx.fillText(
            `${Math.floor(currentEnergy)}/${maxEnergy}`, 
            x + barWidth + 8, y + 4
        );
        
        ctx.restore();
    }
    
    // 渲染控制提示（經驗條和能量條之間）
    renderControlHint(ctx, x = 20, y = 115) {
        ctx.save();
        
        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.shadowBlur = 3;
        ctx.shadowColor = '#00ffff';
        ctx.fillText('移動滑鼠控制方向', x, y);
        
        ctx.restore();
    }
    
    // 渲染升級特效
    renderLevelUpEffect(ctx) {
        ctx.save();
        
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        const time = this.levelUpTimer;
        
        // 創建脈衝效果
        const pulseScale = 1 + Math.sin(time * 10) * 0.3;
        const alpha = Math.max(0, 1 - time / 3);
        
        // 背景閃光
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = this.getQualityColor();
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // 升級文字
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${48 * pulseScale}px "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = this.getQualityColor();
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.getQualityColor();
        
        // 故障效果
        const glitchX = (Math.random() - 0.5) * 10;
        const glitchY = (Math.random() - 0.5) * 10;
        
        ctx.fillText(`LEVEL UP!`, centerX + glitchX, centerY - 50 + glitchY);
        ctx.fillText(`LV.${this.level}`, centerX + glitchX, centerY + 20 + glitchY);
        
        // 數據流效果
        ctx.font = '12px "Courier New", monospace';
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2 + time * 2;
            const radius = 100 + Math.sin(time * 3 + i) * 20;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            ctx.globalAlpha = alpha * (0.5 + Math.sin(time * 5 + i) * 0.3);
            ctx.fillText(['0', '1', '+', '='][i % 4], x, y);
        }
        
        ctx.restore();
    }
    
    // 渲染經驗值獲得動畫
    renderExpGainAnimations(ctx) {
        ctx.save();
        
        const baseX = ctx.canvas.width - 100;
        const baseY = 150;
        
        for (const anim of this.expGainAnimations) {
            ctx.globalAlpha = anim.alpha;
            ctx.font = `bold ${12 * anim.scale}px "Courier New", monospace`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffff00';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#ffff00';
            
            ctx.fillText(
                `+${anim.amount} EXP`,
                baseX,
                baseY + anim.y
            );
            
            // 來源類型顯示
            if (anim.source.startsWith('kill_')) {
                ctx.font = `${8 * anim.scale}px "Courier New", monospace`;
                ctx.fillStyle = '#00ffff';
                ctx.fillText(
                    anim.source.replace('kill_', '').toUpperCase(),
                    baseX,
                    baseY + anim.y + 15
                );
            }
        }
        
        ctx.restore();
    }
    
    // 獲取統計數據
    getStats() {
        return {
            level: this.level,
            experience: this.experience,
            experienceToNext: this.experienceToNextLevel,
            quality: this.getCurrentQuality(),
            progress: this.experience / this.experienceToNextLevel
        };
    }
    
    // 渲染等級圖標（向量設計）
    renderLevelIcon(ctx, x, y) {
        ctx.save();
        
        ctx.translate(x, y);
        const size = 8;
        const qualityColor = this.getQualityColor();
        
        // 等級圖標：鑽石形狀
        ctx.strokeStyle = qualityColor;
        ctx.fillStyle = this.adjustAlpha(qualityColor, 0.3);
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(0, -size);    // 上
        ctx.lineTo(size, 0);     // 右
        ctx.lineTo(0, size);     // 下
        ctx.lineTo(-size, 0);    // 左
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 內部十字
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-4, 0);
        ctx.lineTo(4, 0);
        ctx.moveTo(0, -4);
        ctx.lineTo(0, 4);
        ctx.stroke();
        
        ctx.restore();
    }
    
    // 工具方法：調整顏色透明度
    adjustAlpha(color, alpha) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // 重置系統
    reset() {
        this.experience = 0;
        this.level = 1;
        this.experienceToNextLevel = 100;
        this.levelUpEffect = false;
        this.levelUpTimer = 0;
        this.expGainAnimations = [];
    }
}

// 導出類
window.ExperienceSystem = ExperienceSystem;