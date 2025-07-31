// 向量圖標系統 - 賽博龐克風格的純canvas繪製圖標
// 替代emoji，提供專業視覺效果

class VectorIcons {
    
    // 繪製圖標的主要方法
    static drawIcon(ctx, iconName, x, y, size = 32, color = '#00ffff', options = {}) {
        ctx.save();
        
        // 移動到圖標中心
        ctx.translate(x, y);
        
        // 應用縮放
        const scale = size / 32; // 基準大小為32px
        ctx.scale(scale, scale);
        
        // 設置基本樣式
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = options.lineWidth || 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // 發光效果
        if (options.glow !== false) {
            ctx.shadowBlur = options.shadowBlur || 8;
            ctx.shadowColor = color;
        }
        
        // 繪製對應圖標
        const drawMethod = VectorIcons[`draw_${iconName}`];
        if (drawMethod) {
            drawMethod.call(VectorIcons, ctx, options);
        } else {
            console.warn(`找不到圖標方法: draw_${iconName}，使用默認六邊形`);
            // 默認圖標：六邊形
            VectorIcons.draw_hexagon(ctx, options);
        }
        
        ctx.restore();
    }
    
    // 武器類圖標
    
    // 電磁軌道炮
    static draw_railgun(ctx, options) {
        // 炮管
        ctx.strokeStyle = options.color || ctx.strokeStyle;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-12, -3);
        ctx.lineTo(12, -3);
        ctx.moveTo(-12, 3);
        ctx.lineTo(12, 3);
        ctx.stroke();
        
        // 電磁線圈
        for (let i = 0; i < 4; i++) {
            const x = -8 + i * 5;
            ctx.beginPath();
            ctx.arc(x, 0, 4, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 能量核心
        ctx.fillStyle = options.color || ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(-10, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 發射口特效
        if (options.active) {
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.lineTo(16, 0);
            ctx.stroke();
        }
    }
    
    // 量子漩渦
    static draw_vortex(ctx, options) {
        const time = options.time || (Date.now() / 1000);
        
        // 旋轉漩渦
        ctx.save();
        ctx.rotate(time * 2);
        
        // 多層螺旋
        for (let layer = 0; layer < 3; layer++) {
            ctx.strokeStyle = options.color || ctx.strokeStyle;
            ctx.globalAlpha = 1 - layer * 0.3;
            ctx.lineWidth = 3 - layer;
            
            ctx.beginPath();
            for (let angle = 0; angle < Math.PI * 4; angle += 0.1) {
                const radius = (angle / (Math.PI * 4)) * (10 + layer * 2);
                const x = Math.cos(angle + layer) * radius;
                const y = Math.sin(angle + layer) * radius;
                
                if (angle === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
        ctx.restore();
        
        // 中心點
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 水晶碎片
    static draw_crystal(ctx, options) {
        // 主水晶
        ctx.fillStyle = options.color || ctx.fillStyle;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(8, -4);
        ctx.lineTo(8, 8);
        ctx.lineTo(0, 12);
        ctx.lineTo(-8, 8);
        ctx.lineTo(-8, -4);
        ctx.closePath();
        ctx.fill();
        
        // 內部線條
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(0, 12);
        ctx.moveTo(-8, -4);
        ctx.lineTo(8, 8);
        ctx.moveTo(8, -4);
        ctx.lineTo(-8, 8);
        ctx.stroke();
        
        // 碎片效果
        if (options.active) {
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                const distance = 16;
                const x = Math.cos(angle) * distance;
                const y = Math.sin(angle) * distance;
                
                ctx.save();
                ctx.translate(x, y);
                ctx.scale(0.3, 0.3);
                ctx.fillStyle = options.color || ctx.fillStyle;
                ctx.beginPath();
                ctx.moveTo(0, -4);
                ctx.lineTo(3, 0);
                ctx.lineTo(0, 4);
                ctx.lineTo(-3, 0);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }
    }
    
    // 時空裂隙
    static draw_rift(ctx, options) {
        const time = options.time || (Date.now() / 1000);
        
        // 時空扭曲效果
        ctx.strokeStyle = options.color || ctx.strokeStyle;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 6; i++) {
            const offset = Math.sin(time * 3 + i) * 3;
            ctx.beginPath();
            ctx.moveTo(-12 + offset, -8 + i * 3);
            ctx.bezierCurveTo(
                -4 + offset, -8 + i * 3 + offset,
                4 + offset, -8 + i * 3 - offset,
                12 + offset, -8 + i * 3
            );
            ctx.stroke();
        }
        
        // 中心能量點
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 3; i++) {
            const alpha = 0.8 - i * 0.2;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(0, 0, 2 + i, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 離子風暴
    static draw_storm(ctx, options) {
        const time = options.time || (Date.now() / 1000);
        
        // 閃電效果
        ctx.strokeStyle = options.color || ctx.strokeStyle;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time;
            const startRadius = 4;
            const endRadius = 14;
            
            ctx.beginPath();
            ctx.moveTo(
                Math.cos(angle) * startRadius,
                Math.sin(angle) * startRadius
            );
            
            // 鋸齒狀閃電
            const steps = 4;
            for (let j = 1; j <= steps; j++) {
                const progress = j / steps;
                const radius = startRadius + (endRadius - startRadius) * progress;
                const zigzag = Math.sin(j * Math.PI) * 2;
                
                ctx.lineTo(
                    Math.cos(angle) * radius + zigzag,
                    Math.sin(angle) * radius + zigzag
                );
            }
            ctx.stroke();
        }
        
        // 中心球
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 納米追蹤
    static draw_tracker(ctx, options) {
        // 導彈外形
        ctx.fillStyle = options.color || ctx.fillStyle;
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(-8, -4);
        ctx.lineTo(-8, -2);
        ctx.lineTo(-12, -2);
        ctx.lineTo(-12, 2);
        ctx.lineTo(-8, 2);
        ctx.lineTo(-8, 4);
        ctx.closePath();
        ctx.fill();
        
        // 追蹤環
        for (let i = 0; i < 3; i++) {
            const radius = 6 + i * 4;
            const alpha = 0.8 - i * 0.2;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = options.color || ctx.strokeStyle;
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        
        // 鎖定標記
        if (options.active) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-2, -2);
            ctx.lineTo(2, 2);
            ctx.moveTo(2, -2);
            ctx.lineTo(-2, 2);
            ctx.stroke();
        }
    }
    
    // 能力類圖標
    
    // 傷害提升
    static draw_damage(ctx, options) {
        // 劍形狀
        ctx.fillStyle = options.color || ctx.fillStyle;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(2, -10);
        ctx.lineTo(2, 8);
        ctx.lineTo(4, 8);
        ctx.lineTo(4, 12);
        ctx.lineTo(-4, 12);
        ctx.lineTo(-4, 8);
        ctx.lineTo(-2, 8);
        ctx.lineTo(-2, -10);
        ctx.closePath();
        ctx.fill();
        
        // 上升箭頭
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, -4);
        ctx.lineTo(-8, -8);
        ctx.lineTo(-6, -6);
        ctx.moveTo(-8, -8);
        ctx.lineTo(-10, -6);
        ctx.stroke();
    }
    
    // 射速提升
    static draw_speed(ctx, options) {
        // 多重箭頭表示速度
        for (let i = 0; i < 3; i++) {
            const offset = i * 4;
            const alpha = 1 - i * 0.3;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = options.color || ctx.strokeStyle;
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.moveTo(-8 + offset, 0);
            ctx.lineTo(4 + offset, 0);
            ctx.moveTo(0 + offset, -4);
            ctx.lineTo(4 + offset, 0);
            ctx.lineTo(0 + offset, 4);
            ctx.stroke();
        }
    }
    
    // 範圍擴大
    static draw_range(ctx, options) {
        // 同心圓表示範圍
        for (let i = 0; i < 3; i++) {
            const radius = 4 + i * 4;
            ctx.strokeStyle = options.color || ctx.strokeStyle;
            ctx.globalAlpha = 0.8 - i * 0.2;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 擴散箭頭
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            const x1 = Math.cos(angle) * 8;
            const y1 = Math.sin(angle) * 8;
            const x2 = Math.cos(angle) * 12;
            const y2 = Math.sin(angle) * 12;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }
    
    // 連擊強化
    static draw_combo(ctx, options) {
        // 連鎖符號
        ctx.strokeStyle = options.color || ctx.strokeStyle;
        ctx.lineWidth = 2;
        
        // 第一環
        ctx.beginPath();
        ctx.arc(-4, -4, 4, 0, Math.PI * 2);
        ctx.stroke();
        
        // 第二環
        ctx.beginPath();
        ctx.arc(4, 4, 4, 0, Math.PI * 2);
        ctx.stroke();
        
        // 連接線
        ctx.beginPath();
        ctx.moveTo(-1, -1);
        ctx.lineTo(1, 1);
        ctx.stroke();
        
        // 數字標記
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('x2', 0, 12);
    }
    
    // 精準射擊
    static draw_precision(ctx, options) {
        // 準星
        ctx.strokeStyle = options.color || ctx.strokeStyle;
        ctx.lineWidth = 2;
        
        // 外圈
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.stroke();
        
        // 十字線
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(-8, 0);
        ctx.moveTo(8, 0);
        ctx.lineTo(12, 0);
        ctx.moveTo(0, -12);
        ctx.lineTo(0, -8);
        ctx.moveTo(0, 8);
        ctx.lineTo(0, 12);
        ctx.stroke();
        
        // 中心點
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 子彈時間
    static draw_time(ctx, options) {
        const time = options.time || (Date.now() / 1000);
        
        // 時鐘外圈
        ctx.strokeStyle = options.color || ctx.strokeStyle;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.stroke();
        
        // 時鐘刻度（慢速轉動）
        ctx.save();
        ctx.rotate(time * 0.5);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const x1 = Math.cos(angle) * 8;
            const y1 = Math.sin(angle) * 8;
            const x2 = Math.cos(angle) * 10;
            const y2 = Math.sin(angle) * 10;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        ctx.restore();
        
        // 指針
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -6);
        ctx.stroke();
    }
    
    // 生存類圖標
    
    // 緊急修復
    static draw_repair(ctx, options) {
        // 醫療十字
        ctx.fillStyle = options.color || ctx.fillStyle;
        ctx.beginPath();
        ctx.rect(-2, -8, 4, 16);
        ctx.rect(-8, -2, 16, 4);
        ctx.fill();
        
        // 外框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(-10, -10, 20, 20);
        ctx.stroke();
        
        // 脈衝效果
        if (options.active) {
            ctx.strokeStyle = options.color || ctx.strokeStyle;
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.globalAlpha = 0.6 - i * 0.2;
                ctx.beginPath();
                ctx.rect(-10 - i * 2, -10 - i * 2, 20 + i * 4, 20 + i * 4);
                ctx.stroke();
            }
        }
    }
    
    // 裝甲升級
    static draw_armor(ctx, options) {
        // 盾牌形狀
        ctx.fillStyle = options.color || ctx.fillStyle;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.bezierCurveTo(-8, -12, -10, -6, -10, 0);
        ctx.bezierCurveTo(-10, 6, -6, 10, 0, 12);
        ctx.bezierCurveTo(6, 10, 10, 6, 10, 0);
        ctx.bezierCurveTo(10, -6, 8, -12, 0, -12);
        ctx.fill();
        
        // 內部線條
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(0, 8);
        ctx.moveTo(-6, -4);
        ctx.lineTo(6, -4);
        ctx.moveTo(-4, 0);
        ctx.lineTo(4, 0);
        ctx.stroke();
    }
    
    // 護盾重組
    static draw_shield(ctx, options) {
        const time = options.time || (Date.now() / 1000);
        
        // 六邊形護盾
        ctx.strokeStyle = options.color || ctx.strokeStyle;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * 10;
            const y = Math.sin(angle) * 10;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        
        // 能量流動
        ctx.save();
        ctx.rotate(time);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * 6;
            const y = Math.sin(angle) * 6;
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    
    // 九命重生
    static draw_lives(ctx, options) {
        // 貓頭輪廓
        ctx.strokeStyle = options.color || ctx.strokeStyle;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // 貓耳
        ctx.beginPath();
        ctx.moveTo(-4, -6);
        ctx.lineTo(-6, -10);
        ctx.lineTo(-2, -8);
        ctx.moveTo(4, -6);
        ctx.lineTo(6, -10);
        ctx.lineTo(2, -8);
        ctx.stroke();
        
        // 九命符號
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('9', 0, 3);
        
        // 光環效果
        if (options.active) {
            for (let i = 0; i < 3; i++) {
                ctx.strokeStyle = options.color || ctx.strokeStyle;
                ctx.globalAlpha = 0.6 - i * 0.2;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(0, 0, 10 + i * 3, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }
    
    // 血量偷取
    static draw_steal(ctx, options) {
        // 吸血符號
        ctx.fillStyle = '#ff0066';
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.bezierCurveTo(-5, -2, -5, -8, 0, -4);
        ctx.bezierCurveTo(5, -8, 5, -2, 0, 2);
        ctx.fill();
        
        // 吸收箭頭
        ctx.strokeStyle = options.color || ctx.strokeStyle;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const y = 6 + i * 3;
            ctx.beginPath();
            ctx.moveTo(-4, y);
            ctx.lineTo(0, y - 2);
            ctx.lineTo(4, y);
            ctx.stroke();
        }
    }
    
    // 過載核心
    static draw_overcharge(ctx, options) {
        const time = options.time || (Date.now() / 1000);
        
        // 核心圓形
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // 能量環
        ctx.save();
        ctx.rotate(time * 2);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.cos(angle) * 10;
            const y = Math.sin(angle) * 10;
            
            ctx.fillStyle = options.color || ctx.fillStyle;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        
        // 警告符號
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('!', 0, 2);
    }
    
    // 默認六邊形
    static draw_hexagon(ctx, options) {
        ctx.strokeStyle = options.color || ctx.strokeStyle;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * 10;
            const y = Math.sin(angle) * 10;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }
}

// 導出類
window.VectorIcons = VectorIcons;