// 賽博龐克貓咪基地渲染系統
// 負責所有基地的視覺效果和繪製

class CyberpunkCatBaseRenderer {
    constructor(base) {
        this.base = base;
    }
    
    // 主渲染方法
    render(ctx) {
        // 計算震動偏移
        let shakeX = 0, shakeY = 0;
        if (this.base.shakeTimer > 0) {
            shakeX = (Math.random() - 0.5) * this.base.shakeIntensity;
            shakeY = (Math.random() - 0.5) * this.base.shakeIntensity;
        }

        const centerX = this.base.x + shakeX;
        const centerY = this.base.y + shakeY;

        // 獲取手機渲染縮放係數
        const renderScale = this.base.game.mobileRenderScale || 1.0;

        // 渲染賽博龐克貓咪基地
        this.renderNeonBase(ctx, centerX, centerY, renderScale);
    }

    // 賽博龐克貓咪基地渲染 - 完整版本
    renderNeonBase(ctx, centerX, centerY, renderScale = 1.0) {
        const healthPercent = this.base.game.gameState.lives / GameConfig.GAME.INITIAL_LIVES;
        const baseColor = this.getCyberpunkEmotionColor(this.base.emotion);
        const time = Date.now() / 1000;
        
        // 計算渲染用的半徑
        const renderRadius = this.base.radius * renderScale;
        
        // 如果需要縮放，應用變換
        if (renderScale !== 1.0) {
            ctx.save();
            ctx.scale(renderScale, renderScale);
            // 調整中心點以補償縮放
            centerX /= renderScale;
            centerY /= renderScale;
        }

        // 1. 數位網格背景
        this.drawCyberpunkGrid(ctx, centerX, centerY, this.base.radius * 2.5, time);

        // 2. 全息投影效果（已移除掃描線）

        // 3. 外層數位光暈（整合能量狀態）
        let energyPercent = 0;
        if (this.base.bulletSystem && this.base.bulletSystem.energyBar) {
            energyPercent = this.base.bulletSystem.energyBar.current / this.base.bulletSystem.energyBar.max;
            // 確保值在有效範圍內
            energyPercent = Math.max(0, Math.min(1, energyPercent));
        }
        
        // 根據能量調整光暈強度（增強效果）
        const glowIntensity = 0.4 + (energyPercent * 0.6); // 0.4 到 1.0，更明顯
        const glowRadius = this.base.radius * (2 + energyPercent * 1.5); // 2 到 3.5 倍半徑，擴大範圍
        
        // 混合情感色彩和能量色彩
        const energyColor = '#ffff00'; // 能量黃色
        const mixedColor = this.mixColors(baseColor, energyColor, energyPercent * 0.7); // 增加混合比例
        
        const gradient1 = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
        gradient1.addColorStop(0, this.adjustAlpha(mixedColor, glowIntensity));
        gradient1.addColorStop(0.3, this.adjustAlpha(mixedColor, glowIntensity * 0.5));
        gradient1.addColorStop(0.6, this.adjustAlpha(mixedColor, glowIntensity * 0.25));
        gradient1.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient1;
        ctx.fillRect(centerX - glowRadius, centerY - glowRadius, glowRadius * 2, glowRadius * 2);

        // 4. 故障效果光環（能量後加速脈動）
        ctx.save();
        const pulseSpeed = 3 + (energyPercent * 2); // 能量越高脈動越快
        
        for (let i = 0; i < 4; i++) {
            const glitchOffset = Math.random() < 0.1 ? Math.random() * 4 - 2 : 0;
            const scale = 1 + (Math.sin(time * pulseSpeed + i) * 0.1);
            const alpha = (0.6 - (i * 0.15)) * (0.5 + energyPercent * 0.5);

            ctx.shadowBlur = 20 + (energyPercent * 10);
            ctx.shadowColor = mixedColor;
            ctx.strokeStyle = this.adjustAlpha(mixedColor, alpha);
            ctx.lineWidth = 2 + (energyPercent * 2);
            ctx.setLineDash([10, 5]);

            ctx.beginPath();
            ctx.arc(centerX + glitchOffset, centerY, this.base.radius * scale, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 能量滿後的特殊效果
        if (energyPercent >= 0.95) {
            ctx.strokeStyle = this.adjustAlpha('#ffff00', 0.8);
            ctx.lineWidth = 3;
            ctx.setLineDash([2, 8]);
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#ffff00';
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.base.radius * 1.3, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.setLineDash([]);
        ctx.restore();

        // 5. 圓形核心（貓臉）
        this.drawCircleCore(ctx, centerX, centerY, this.base.radius, baseColor);

        // 6. 貓耳朵
        this.drawCyberpunkCatEars(ctx, centerX, centerY, this.base.radius, baseColor);

        // 7. 貓鬚（已移除）

        // 8. 貓咪表情顯示
        this.drawCatFace(ctx, centerX, centerY, baseColor);

        // 9. 數據流粒子
        this.drawCyberpunkDataStream(ctx, centerX, centerY, this.base.radius, baseColor, healthPercent);
        
        // 9.5 能量粒子環繞效果（降低門檻，讓效果更明顯）
        if (energyPercent > 0.2) {
            this.drawEnergyParticles(ctx, centerX, centerY, this.base.radius, energyPercent);
        }

        // 10. 貓尾巴狀態指示器
        this.drawCatTailIndicator(ctx, centerX, centerY, this.base.radius, healthPercent);
        
        // 10.5 能量數值顯示（基地下方）
        if (this.base.bulletSystem && energyPercent > 0) {
            this.drawEnergyIndicator(ctx, centerX, centerY, energyPercent);
        }
        
        // 恢復變換
        if (renderScale !== 1.0) {
            ctx.restore();
        }
        
        // 11. 攻擊系統效果已移除
        
        // 12. 渲染彈幕系統
        if (this.base.bulletSystem) {
            this.base.bulletSystem.render(ctx);
        }

        ctx.shadowBlur = 0;
    }

    // 繪製圓形核心（貓臉）
    drawCircleCore(ctx, centerX, centerY, radius, color) {
        ctx.save();

        // 外層圓形邊框 - 多層發光效果
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = this.adjustAlpha(color, 0.8 - i * 0.2);
            ctx.lineWidth = 3 - i;
            ctx.shadowBlur = 20 + i * 10;
            ctx.shadowColor = color;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + i * 2, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 內部填充
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, this.adjustAlpha(color, 0.3));
        gradient.addColorStop(0.5, this.adjustAlpha(color, 0.15));
        gradient.addColorStop(0.8, this.adjustAlpha(color, 0.05));
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // 添加內圈裝飾
        ctx.strokeStyle = this.adjustAlpha(color, 0.3);
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.85, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
    }

    // 繪製賽博龐克貓耳朵
    drawCyberpunkCatEars(ctx, centerX, centerY, radius, color) {
        ctx.save();
        
        // 左耳
        ctx.save();
        ctx.translate(centerX - radius * 0.5, centerY - radius * 0.8);
        ctx.rotate(this.base.catEarAngleLeft);
        
        // 外耳輪廓
        ctx.fillStyle = this.adjustAlpha(color, 0.6);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);  // 底部中心點
        ctx.lineTo(-15, 0);  // 左下角
        ctx.lineTo(-5, -30);  // 頂點（尖端）
        ctx.lineTo(10, 0);  // 右下角
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 內耳
        ctx.fillStyle = this.adjustAlpha('#ff0080', 0.4);
        ctx.beginPath();
        ctx.moveTo(-5, -5);
        ctx.lineTo(-10, -5);
        ctx.lineTo(-5, -20);
        ctx.lineTo(0, -5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        // 右耳
        ctx.save();
        ctx.translate(centerX + radius * 0.5, centerY - radius * 0.8);
        ctx.rotate(this.base.catEarAngleRight);
        
        // 外耳輪廓
        ctx.fillStyle = this.adjustAlpha(color, 0.6);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);  // 底部中心點
        ctx.lineTo(15, 0);  // 右下角
        ctx.lineTo(5, -30);  // 頂點（尖端）
        ctx.lineTo(-10, 0);  // 左下角
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 內耳
        ctx.fillStyle = this.adjustAlpha('#ff0080', 0.4);
        ctx.beginPath();
        ctx.moveTo(5, -5);
        ctx.lineTo(10, -5);
        ctx.lineTo(5, -20);
        ctx.lineTo(0, -5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }


    // 繪製貓咪表情
    drawCatFace(ctx, centerX, centerY, baseColor) {
        // 獲取能量狀態（用於微調表情，但不覆蓋主要情感）
        let energyPercent = 0;
        if (this.base.bulletSystem && this.base.bulletSystem.energyBar) {
            energyPercent = this.base.bulletSystem.energyBar.current / this.base.bulletSystem.energyBar.max;
            energyPercent = Math.max(0, Math.min(1, energyPercent));
        }
        ctx.save();

        // 應用表情偏移
        const faceX = centerX + this.base.catLookSmoothX;
        const faceY = centerY + this.base.catLookSmoothY;

        ctx.font = 'bold 42px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 故障文字效果或 MEOW
        if (this.base.meowTimer < 0.5) {
            ctx.save();
            ctx.font = 'bold 24px "Courier New", monospace';
            ctx.fillStyle = '#ff0080';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff0080';
            ctx.fillText('MEOW!', faceX + Math.random() * 4 - 2, faceY - 50);
            ctx.restore();
        } else if (Math.random() < 0.01) {
            // 偶爾的故障效果
            ctx.save();
            ctx.font = 'bold 20px "Courier New", monospace';
            ctx.fillStyle = '#ff0080';
            ctx.fillText('ERROR', faceX + Math.random() * 4 - 2, faceY - 45);
            ctx.restore();
        }

        // 主表情（根據能量微調顏色，但保持情感主導）
        let faceColor = '#00ffff';
        if (energyPercent > 0.8 && this.base.emotion !== 'hurt' && this.base.emotion !== 'scared') {
            // 高能量時略帶黃色，但不影響受傷或害怕的表情
            faceColor = this.mixColors('#00ffff', '#ffff00', 0.3);
        }
        ctx.fillStyle = faceColor;
        ctx.shadowBlur = 10 + (energyPercent * 5); // 能量越高影子越亮
        ctx.shadowColor = faceColor;

        // 眨眼時的表情
        let currentExpression;
        if (this.base.isBlinking) {
            // 多種眨眼表情
            const blinkExpressions = ['－ω－', '˘ω˘', '￣ω￣', '=ω='];
            currentExpression = blinkExpressions[Math.floor(Date.now() / 1000) % blinkExpressions.length];
        } else {
            const expressions = {
                happy: ['^ω^', '≧ω≦', '♡ω♡', '✧ω✧', '◕ω◕'],
                normal: ['・ω・', '｡ω｡', '˘ω˘', '◉ω◉'],
                worried: ['>ω<', ';ω;', '･ω･`', '⊙ω⊙'],
                hurt: ['TωT', ';ω;', '◣ω◢', '╥ω╥'],
                angry: ['òωó', 'ÒωÓ', '▼ω▼', 'ಠωಠ'],
                scared: ['OωO', '⊙ω⊙', 'ΦωΦ', 'ʘωʘ'],
                dead: ['XωX', '×ω×', '+ω+', '✖ω✖'],
                celebrating: ['♪ω♪', '♬ω♬', '★ω★', '✧ω✧'],
                sleepy: ['=ω=', '˘ω˘', '¯ω¯', '-ω-'],
                love: ['♡ω♡', '♥ω♥', '❤ω❤', '💕ω💕'],
                surprised: ['!ω!', '‼ω‼', '°ω°', 'ºωº'],
                cool: ['▼ω▼', '■ω■', '▪ω▪', '◆ω◆']
            };
            
            // 根據不同情況選擇表情組
            let emotionGroup = expressions[this.base.emotion] || expressions.normal;
            
            // 特殊情況的表情
            if (this.base.meowTimer < 0.5) {
                // 叫的時候
                emotionGroup = ['ΦωΦ', '=ω=', '>ω<'];
            } else if (this.base.game.gameState.streak > 5) {
                // 連殺時
                emotionGroup = expressions.cool;
            } else if (this.base.game.enemies.length > 10) {
                // 敵人很多時
                emotionGroup = expressions.worried;
            }
            
            // 隨機選擇一個表情，但不要太頻繁變化
            const expressionIndex = Math.floor(Date.now() / 2000) % emotionGroup.length;
            currentExpression = emotionGroup[expressionIndex];
        }

        ctx.fillText(currentExpression, faceX, faceY);

        // RGB 分離效果
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = '#ff0080';
        ctx.fillText(currentExpression, faceX - 1, faceY);
        ctx.fillStyle = '#00ff80';
        ctx.fillText(currentExpression, faceX + 1, faceY);

        ctx.restore();
    }

    // 數據流粒子效果
    drawCyberpunkDataStream(ctx, x, y, radius, color, healthPercent) {
        const time = Date.now() / 1000;
        const particleCount = Math.floor(15 * healthPercent);

        ctx.save();
        ctx.font = '10px "Courier New", monospace';
        ctx.shadowBlur = 5;
        ctx.shadowColor = color;

        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + time * 0.5;
            const distance = radius + 20 + Math.sin(time * 3 + i) * 15;

            const px = x + Math.cos(angle) * distance;
            const py = y + Math.sin(angle) * distance;

            const alpha = 0.5 + Math.sin(time * 2 + i) * 0.3;
            ctx.fillStyle = this.adjustAlpha(color, alpha);

            const chars = ['0', '1', '♦', '♠', '♥', '♣', '◆', '◇'];
            const char = chars[Math.floor((time + i) * 2) % chars.length];
            ctx.fillText(char, px, py);
        }

        ctx.restore();
    }

    // 數位網格背景
    drawCyberpunkGrid(ctx, centerX, centerY, size, time) {
        ctx.save();
        ctx.strokeStyle = this.adjustAlpha('#00ffff', 0.1);
        ctx.lineWidth = 1;

        const gridSize = 20;
        const animOffset = (time * 10) % gridSize;

        for (let x = centerX - size; x < centerX + size; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x + animOffset, centerY - size);
            ctx.lineTo(x + animOffset, centerY + size);
            ctx.stroke();
        }

        for (let y = centerY - size; y < centerY + size; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(centerX - size, y + animOffset);
            ctx.lineTo(centerX + size, y + animOffset);
            ctx.stroke();
        }

        ctx.restore();
    }

    // 貓尾巴狀態指示器
    drawCatTailIndicator(ctx, centerX, centerY, radius, healthPercent) {
        ctx.save();

        // 尾巴從基地下方開始
        const tailX = centerX;
        const tailY = centerY + radius + 20;
        const tailLength = 100;
        const time = Date.now() / 1000;

        // 移動到尾巴起始位置
        ctx.translate(tailX, tailY);
        
        // 應用尾巴擺動
        ctx.rotate(this.base.catTailSwing);

        // 根據血量決定尾巴顏色
        let tailColor = '#00ff88';  // 健康：綠色
        if (healthPercent < 0.3) tailColor = '#ff0066';  // 危險：紅色
        else if (healthPercent < 0.6) tailColor = '#ffff00';  // 警告：黃色

        // 創建尾巴漸變
        const tailGradient = ctx.createLinearGradient(0, 0, 0, tailLength);
        tailGradient.addColorStop(0, this.adjustAlpha(tailColor, 0.8));
        tailGradient.addColorStop(0.7, this.adjustAlpha(tailColor, 0.5));
        tailGradient.addColorStop(1, this.adjustAlpha(tailColor, 0.2));

        // 設置樣式
        ctx.strokeStyle = tailGradient;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = tailColor;

        // 繪製尾巴曲線
        ctx.beginPath();
        ctx.moveTo(0, 0);
        
        // 使用貝塞爾曲線創建更自然的尾巴形狀
        const controlX1 = 20 * Math.sin(time * 2);
        const controlY1 = tailLength * 0.4;
        const controlX2 = 30 * Math.sin(time * 3);
        const controlY2 = tailLength * 0.7;
        const endX = 35 * Math.sin(time * 3.5);
        const endY = tailLength * healthPercent;  // 尾巴長度隨血量變化
        
        ctx.bezierCurveTo(
            controlX1, controlY1,
            controlX2, controlY2,
            endX, endY
        );
        ctx.stroke();

        // 尾巴尖端的發光圓點
        ctx.fillStyle = tailColor;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(endX, endY, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加能量粒子效果（血量越高越明顯）
        if (healthPercent > 0.5 && Math.random() < 0.1) {
            ctx.fillStyle = this.adjustAlpha(tailColor, 0.6);
            ctx.shadowBlur = 8;
            for (let i = 0; i < 3; i++) {
                const particleX = endX + (Math.random() - 0.5) * 10;
                const particleY = endY + (Math.random() - 0.5) * 10;
                ctx.beginPath();
                ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    // 獲取賽博龐克情感顏色
    getCyberpunkEmotionColor(emotion) {
        const colors = {
            happy: '#00ff88',      // 綠色
            normal: '#00ffff',     // 青色
            worried: '#ffff00',    // 黃色
            hurt: '#ff8800',       // 橙色
            angry: '#ff0066',      // 粉紅
            scared: '#8800ff',     // 紫色
            dead: '#666666',       // 灰色
            celebrating: '#ff00ff' // 洋紅
        };
        return colors[emotion] || '#00ffff';
    }

    // 調整顏色透明度
    adjustAlpha(color, alpha) {
        // 簡單的 hex 顏色轉 rgba
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // 混合兩個顏色
    mixColors(color1, color2, ratio) {
        const hex1 = color1.replace('#', '');
        const hex2 = color2.replace('#', '');
        
        const r1 = parseInt(hex1.substr(0, 2), 16);
        const g1 = parseInt(hex1.substr(2, 2), 16);
        const b1 = parseInt(hex1.substr(4, 2), 16);
        
        const r2 = parseInt(hex2.substr(0, 2), 16);
        const g2 = parseInt(hex2.substr(2, 2), 16);
        const b2 = parseInt(hex2.substr(4, 2), 16);
        
        const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
        const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
        const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // 繪製能量粒子
    drawEnergyParticles(ctx, x, y, radius, energyPercent) {
        const time = Date.now() / 1000;
        const particleCount = Math.floor(12 * energyPercent); // 增加粒子數量
        
        ctx.save();
        
        // 能量集中環（新增）
        if (energyPercent > 0.3) {
            ctx.strokeStyle = this.adjustAlpha('#ffff00', energyPercent * 0.3);
            ctx.lineWidth = 2 + energyPercent * 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffff00';
            ctx.setLineDash([5, 10]);
            
            const ringRadius = radius + 20 + Math.sin(time * 2) * 5;
            ctx.beginPath();
            ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // 能量粒子
        ctx.font = '16px "Courier New", monospace'; // 增大符號
        ctx.shadowBlur = 10 + energyPercent * 10;
        ctx.shadowColor = '#ffff00';
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + time * 0.5;
            const distance = radius + 25 + Math.sin(time * 2 + i) * 15 * energyPercent;
            const wobble = Math.sin(time * 4 + i * 2) * 8;
            
            const px = x + Math.cos(angle) * distance + wobble;
            const py = y + Math.sin(angle) * distance;
            
            const alpha = 0.4 + energyPercent * 0.6 * (0.5 + Math.sin(time * 3 + i) * 0.5);
            ctx.fillStyle = this.adjustAlpha('#ffff00', alpha);
            
            // 能量符號
            const symbols = ['⚡', '✦', '◈', '◆'];
            const symbol = symbols[Math.floor((time + i) * 1.5) % symbols.length];
            ctx.fillText(symbol, px, py);
        }
        
        // 能量溢出效果（能量高時）
        if (energyPercent > 0.7) {
            ctx.globalAlpha = energyPercent - 0.7;
            for (let i = 0; i < 3; i++) {
                const sparkAngle = time * 3 + i * 2;
                const sparkDist = radius + 40 + i * 15;
                const sparkX = x + Math.cos(sparkAngle) * sparkDist;
                const sparkY = y + Math.sin(sparkAngle) * sparkDist;
                
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#ffff00';
                ctx.fillText('✨', sparkX, sparkY);
            }
        }
        
        ctx.restore();
    }
    
    // 繪製能量指示器
    drawEnergyIndicator(ctx, x, y, energyPercent) {
        ctx.save();
        
        // 位置在基地正下方
        const indicatorY = y + this.base.radius + 25;
        
        // 能量百分比文字
        ctx.font = 'bold 14px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 根據能量等級變色
        let textColor = '#00ff88'; // 低能量：綠色
        if (energyPercent > 0.6) textColor = '#ffff00'; // 高能量：黃色
        if (energyPercent > 0.9) textColor = '#ff6600'; // 滿能量：橙色
        
        ctx.fillStyle = textColor;
        ctx.shadowBlur = 10;
        ctx.shadowColor = textColor;
        
        // 顯示百分比
        const energyText = `${Math.floor(energyPercent * 100)}%`;
        ctx.fillText(energyText, x, indicatorY);
        
        // 能量標籤（更小的字）
        ctx.font = '10px "Courier New", monospace';
        ctx.globalAlpha = 0.8;
        ctx.fillText('ENERGY', x, indicatorY + 15);
        
        ctx.restore();
    }
}

// 導出類
window.CyberpunkCatBaseRenderer = CyberpunkCatBaseRenderer;