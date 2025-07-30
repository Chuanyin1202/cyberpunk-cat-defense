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

        // 渲染賽博龐克貓咪基地
        this.renderNeonBase(ctx, centerX, centerY);
    }

    // 賽博龐克貓咪基地渲染 - 完整版本
    renderNeonBase(ctx, centerX, centerY) {
        const healthPercent = this.base.game.gameState.lives / GameConfig.GAME.INITIAL_LIVES;
        const baseColor = this.getCyberpunkEmotionColor(this.base.emotion);
        const time = Date.now() / 1000;

        // 1. 數位網格背景
        this.drawCyberpunkGrid(ctx, centerX, centerY, this.base.radius * 2.5, time);

        // 2. 全息投影效果（已移除掃描線）

        // 3. 外層數位光暈
        const gradient1 = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, this.base.radius * 2);
        gradient1.addColorStop(0, this.adjustAlpha(baseColor, 0.4));
        gradient1.addColorStop(0.3, this.adjustAlpha(baseColor, 0.2));
        gradient1.addColorStop(0.6, this.adjustAlpha(baseColor, 0.1));
        gradient1.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient1;
        ctx.fillRect(centerX - this.base.radius * 2, centerY - this.base.radius * 2, this.base.radius * 4, this.base.radius * 4);

        // 4. 故障效果光環
        ctx.save();
        for (let i = 0; i < 4; i++) {
            const glitchOffset = Math.random() < 0.1 ? Math.random() * 4 - 2 : 0;
            const scale = 1 + (Math.sin(time * 3 + i) * 0.1);
            const alpha = 0.6 - (i * 0.15);

            ctx.shadowBlur = 20;
            ctx.shadowColor = baseColor;
            ctx.strokeStyle = this.adjustAlpha(baseColor, alpha);
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]);

            ctx.beginPath();
            ctx.arc(centerX + glitchOffset, centerY, this.base.radius * scale, 0, Math.PI * 2);
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

        // 10. 貓尾巴狀態指示器
        this.drawCatTailIndicator(ctx, centerX, centerY, this.base.radius, healthPercent);
        
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

        // 主表情
        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';

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
}

// 導出類
window.CyberpunkCatBaseRenderer = CyberpunkCatBaseRenderer;