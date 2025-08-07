// 工具函數和粒子系統

// 粒子類
class Particle {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.vx = config.vx || 0;
        this.vy = config.vy || 0;
        this.life = config.life || 1.0;
        this.maxLife = this.life;
        this.color = config.color || '#ffffff';
        this.size = config.size || 2;
        this.type = config.type || 'default';
        this.active = true;
        
        // 重力和阻力
        this.gravity = config.gravity || 0;
        this.friction = config.friction || 1;
        
        // 新的賽博龐克效果參數
        this.glow = config.glow || false;
        this.fade = config.fade || false;
        
        // 旋轉參數
        this.rotation = 0;
        this.rotationSpeed = config.rotationSpeed || 0;
    }

    update(deltaTime) {
        if (!this.active) return;

        // 更新位置
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // 應用重力
        this.vy += this.gravity * deltaTime;

        // 應用阻力
        this.vx *= this.friction;
        this.vy *= this.friction;

        // 更新生命
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.active = false;
        }
        
        // 更新旋轉
        this.rotation += this.rotationSpeed * deltaTime;
        
        // 特殊效果更新
        if (this.glow !== undefined) {
            this.glow = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
        }
    }

    render(ctx) {
        if (!this.active) return;

        const alpha = this.fade ? (this.life / this.maxLife) : 1;
        
        ctx.save();
        ctx.globalAlpha = alpha;

        switch (this.type) {
            case 'spark':
                this.renderSpark(ctx);
                break;
            case 'explosion':
                this.renderExplosion(ctx);
                break;
            case 'touch':
                this.renderTouch(ctx);
                break;
            case 'damage':
                this.renderDamage(ctx);
                break;
            case 'hit':
                this.renderHit(ctx);
                break;
            case 'base_attack':
                this.renderBaseAttack(ctx);
                break;
            case 'plasma_launch':
            case 'plasma_ring':
            case 'electric':
            case 'pulse_wave':
            case 'pulse_inner':
                this.renderCyberpunk(ctx);
                break;
            case 'flash':
                this.renderFlash(ctx);
                break;
            case 'firework_spark':
                this.renderFireworkSpark(ctx);
                break;
            case 'firework_flash':
                this.renderFireworkFlash(ctx);
                break;
            case 'firework_trail':
                this.renderFireworkTrail(ctx);
                break;
            default:
                this.renderDefault(ctx);
        }

        ctx.restore();
    }
    
    // 繪製六邊形粒子
    drawHexParticle(ctx, x, y, size, color, alpha = 1) {
        ctx.save();
        
        ctx.globalAlpha = alpha;
        ctx.translate(x, y);
        ctx.rotate(this.rotation);
        
        // 繪製六邊形
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = Math.cos(angle) * size;
            const py = Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        
        // 填充和描邊
        ctx.fillStyle = color;
        if (this.glow) {
            ctx.shadowBlur = 5;
            ctx.shadowColor = color;
        }
        ctx.fill();
        
        // 邊框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        
        ctx.restore();
    }
    
    // 繪製愛心形狀粒子
    drawHeartParticle(ctx, x, y, size, color, alpha = 1) {
        ctx.save();
        
        ctx.globalAlpha = alpha;
        ctx.translate(x, y);
        ctx.rotate(this.rotation);
        
        // 縮放到適當大小（調大一些）
        const scale = size / 8;
        ctx.scale(scale, scale);
        
        // 繪製飽滿的經典愛心形狀
        ctx.beginPath();
        // 從底部尖端開始
        ctx.moveTo(0, 10);
        // 左側曲線 - 更飽滿
        ctx.bezierCurveTo(-10, 2, -10, -6, -5, -6);
        // 左側頂部圓弧
        ctx.bezierCurveTo(-2.5, -6, 0, -4, 0, -2);
        // 右側頂部圓弧
        ctx.bezierCurveTo(0, -4, 2.5, -6, 5, -6);
        // 右側曲線 - 更飽滿
        ctx.bezierCurveTo(10, -6, 10, 2, 0, 10);
        ctx.closePath();
        
        // 填充和發光效果
        ctx.fillStyle = color;
        if (this.glow) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
        }
        ctx.fill();
        
        // 可選的邊框（更柔和）
        if (alpha > 0.5) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
        
        ctx.restore();
    }

    renderSpark(ctx) {
        const alpha = this.fade ? (this.life / this.maxLife) : 1;
        const currentSize = this.size * (this.life / this.maxLife);
        
        // 六邊形火花效果
        this.drawHexParticle(ctx, this.x, this.y, currentSize, this.color, alpha);
    }

    renderExplosion(ctx) {
        const scale = 1 + (1 - this.life / this.maxLife) * 1.5;  // 減少放大倍數
        const alpha = this.life / this.maxLife;
        
        // 爆炸愛心效果（保持較大尺寸）
        this.drawHeartParticle(ctx, this.x, this.y, this.size * scale * 1.2, this.color, alpha);
    }

    renderTouch(ctx) {
        const scale = (1 - this.life / this.maxLife) * 10;
        const alpha = this.life / this.maxLife;
        
        // 觸摸效果用六邊形（擴散的六邊形波紋）
        this.drawHexParticle(ctx, this.x, this.y, this.size * scale, this.color, alpha);
    }

    renderDamage(ctx) {
        const alpha = this.fade ? (this.life / this.maxLife) : 1;
        
        // 傷害六邊形顯示
        this.drawHexParticle(ctx, this.x, this.y, this.size, this.color, alpha);
    }

    renderHit(ctx) {
        const alpha = this.fade ? (this.life / this.maxLife) : 1;
        
        // 擊中效果用六邊形
        this.drawHexParticle(ctx, this.x, this.y, this.size * 0.8, this.color, alpha);
    }

    renderBaseAttack(ctx) {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        
        // 基地攻擊六邊形效果
        const alpha = this.fade ? (this.life / this.maxLife) : 1;
        this.drawHexParticle(ctx, this.x, this.y, this.size, this.color, alpha);

        // 內部十字
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x - this.size/2, this.y);
        ctx.lineTo(this.x + this.size/2, this.y);
        ctx.moveTo(this.x, this.y - this.size/2);
        ctx.lineTo(this.x, this.y + this.size/2);
        ctx.stroke();
    }

    renderDefault(ctx) {
        const alpha = this.fade ? (this.life / this.maxLife) : 1;
        
        // 使用六邊形代替圓形
        this.drawHexParticle(ctx, this.x, this.y, this.size, this.color, alpha);
    }
    
    renderCyberpunk(ctx) {
        // 開啟光效混合模式
        ctx.globalCompositeOperation = 'screen';
        const alpha = this.fade ? (this.life / this.maxLife) : 1;
        
        if (this.glow) {
            // 多層六邊形光暈
            for (let layer = 0; layer < 3; layer++) {
                const layerAlpha = alpha * (0.4 - layer * 0.1);
                const layerSize = this.size * (2 + layer * 0.5);
                this.drawHexParticle(ctx, this.x, this.y, layerSize, this.color, layerAlpha);
            }
        }
        
        // 核心六邊形
        this.drawHexParticle(ctx, this.x, this.y, this.size, this.color, alpha);
        
        // 內部高光
        const innerGradient = ctx.createRadialGradient(
            this.x - this.size * 0.3, 
            this.y - this.size * 0.3, 
            0,
            this.x, 
            this.y, 
            this.size
        );
        innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        innerGradient.addColorStop(1, 'transparent');
        
        // 內部高光 - 小六邊形
        this.drawHexParticle(ctx, this.x - this.size * 0.2, this.y - this.size * 0.2, this.size * 0.4, '#ffffff', alpha * 0.8);
    }
    
    renderFlash(ctx) {
        // 大型閃光效果
        ctx.globalCompositeOperation = 'screen';
        
        const flashSize = this.size * (1 + (1 - this.life / this.maxLife) * 2);
        const alpha = this.life / this.maxLife * 0.5;
        
        // 多層六邊形閃光效果
        for (let layer = 0; layer < 3; layer++) {
            const layerAlpha = alpha * (0.5 - layer * 0.1);
            const layerSize = flashSize * (1 + layer * 0.3);
            this.drawHexParticle(ctx, this.x, this.y, layerSize, this.color, layerAlpha);
        }
    }
    
    renderFireworkSpark(ctx) {
        const alpha = this.fade ? (this.life / this.maxLife) : 1;
        
        // 煙火火花 - 小愛心亮點
        this.drawHeartParticle(ctx, this.x, this.y, this.size, this.color, alpha);
        
        // 白色核心小愛心
        this.drawHeartParticle(ctx, this.x, this.y, this.size * 0.5, '#ffffff', alpha * 0.8);
    }
    
    renderFireworkFlash(ctx) {
        const alpha = this.fade ? (this.life / this.maxLife) : 1;
        const scale = 1 + (1 - this.life / this.maxLife) * 2;
        
        // 煙火閃光 - 放大的愛心
        this.drawHeartParticle(ctx, this.x, this.y, this.size * scale * 1.5, this.color, alpha);
        
        // 外圈光暈
        this.drawHeartParticle(ctx, this.x, this.y, this.size * scale * 2.5, this.color, alpha * 0.3);
    }
    
    renderFireworkTrail(ctx) {
        const alpha = this.fade ? (this.life / this.maxLife) : 1;
        
        // 煙火拖尾 - 橢圓形光點
        ctx.save();
        ctx.globalAlpha = alpha;
        
        const scaleX = 1 + Math.abs(this.vx) * 0.01;
        const scaleY = 1 + Math.abs(this.vy) * 0.01;
        
        ctx.scale(scaleX, scaleY);
        
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x / scaleX, this.y / scaleY, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// 粒子管理系統
class ParticleManager {
    constructor() {
        this.particles = [];
        this.frameCounter = 0;
        this.lastCleanup = 0;
    }

    update(deltaTime) {
        this.frameCounter++;
        
        // 批次更新粒子（減少每幀處理量）
        const batchSize = GameConfig.PERFORMANCE.PARTICLE_BATCH_SIZE;
        const startIndex = (this.frameCounter * batchSize) % this.particles.length;
        const endIndex = Math.min(startIndex + batchSize, this.particles.length);
        
        // 更新當前批次的粒子
        for (let i = startIndex; i < endIndex; i++) {
            if (this.particles[i]) {
                this.particles[i].update(deltaTime);
            }
        }
        
        // 定期清理死亡粒子
        if (this.frameCounter - this.lastCleanup > GameConfig.PERFORMANCE.CLEANUP_INTERVAL / 10) {
            this.cleanupDeadParticles();
            this.lastCleanup = this.frameCounter;
        }
    }
    
    // 優化的清理方法（使用對象池）
    cleanupDeadParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            if (!particle.active) {
                // 釋放到對象池
                if (window.objectPoolManager) {
                    window.objectPoolManager.releaseParticle(particle);
                }
                this.particles.splice(i, 1);
            }
        }
    }

    addParticle(x, y, config) {
        if (this.particles.length >= GameConfig.PERFORMANCE.MAX_PARTICLES) return;

        // 使用對象池優化
        let particle;
        if (window.objectPoolManager) {
            particle = window.objectPoolManager.getParticle();
            // 重新初始化粒子（而不是創建新的）
            particle.x = x;
            particle.y = y;
            particle.vx = config.vx || 0;
            particle.vy = config.vy || 0;
            particle.life = config.life || 1.0;
            particle.maxLife = particle.life;
            particle.color = config.color || '#ffffff';
            particle.size = config.size || 2;
            particle.type = config.type || 'default';
            particle.active = true;
            particle.gravity = config.gravity || 0;
            particle.friction = config.friction || 1;
            particle.glow = config.glow || false;
            particle.fade = config.fade || false;
            particle.rotation = 0;
            particle.rotationSpeed = config.rotationSpeed || 0;
        } else {
            particle = new Particle(x, y, config);
        }
        
        this.particles.push(particle);
        return particle;
    }

    addParticles(x, y, count, configGenerator) {
        for (let i = 0; i < count; i++) {
            const config = configGenerator(i);
            this.addParticle(x, y, config);
        }
    }

    createExplosion(x, y, color, count = 4) {
        // 確保爆炸位置在畫布範圍內
        const canvas = window.currentGame?.canvas;
        if (canvas) {
            x = Math.max(0, Math.min(canvas.width, x));
            y = Math.max(0, Math.min(canvas.height, y));
        }
        
        // 進一步減少粒子數量
        this.addParticles(x, y, count, (i) => ({
            vx: (Math.random() - 0.5) * 120,  // 減慢速度
            vy: (Math.random() - 0.5) * 120,
            life: 1.0,  // 縮短生命週期
            color: color,
            size: Math.random() * 2 + 2,  // 更小的尺寸 (2-4)
            type: 'explosion',
            fade: true,  // 加入淡出效果
            friction: 0.90  // 增加摩擦力，讓粒子更快停下
        }));
    }

    createTouchEffect(x, y, count = 8) {
        this.addParticles(x, y, count, (i) => ({
            vx: (Math.random() - 0.5) * 300,
            vy: (Math.random() - 0.5) * 300,
            life: 0.6,
            color: ['#00ffff', '#ff00ff', '#00ff88'][i % 3],
            size: Math.random() * 4 + 2,
            type: 'touch',
            friction: 0.9,
            glow: true,
            rotationSpeed: (Math.random() - 0.5) * 10
        }));
    }

    createDamageEffect(x, y, count = 5) {
        this.addParticles(x, y, count, (i) => ({
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100 - 50,
            life: 1.0,
            color: '#ff6666',
            size: Math.random() * 3 + 1,
            type: 'damage',
            friction: 0.95,
            gravity: 100
        }));
    }

    render(ctx) {
        // LOD渲染：根據粒子數量動態調整渲染品質
        const particleCount = this.particles.length;
        const shouldUseLOD = particleCount > 200;
        
        ctx.save();
        
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            
            // LOD: 當粒子太多時，跳過一些渲染
            if (shouldUseLOD && i % 2 === 0) continue;
            
            // 簡化渲染模式
            if (shouldUseLOD) {
                this.renderSimplified(ctx, particle);
            } else {
                particle.render(ctx);
            }
        }
        
        ctx.restore();
    }
    
    // 簡化的粒子渲染
    renderSimplified(ctx, particle) {
        const alpha = particle.fade ? (particle.life / particle.maxLife) : 1;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        
        // 簡單圓形，不使用複雜的六邊形和發光效果
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }

    clear() {
        // 釋放所有粒子到對象池
        if (window.objectPoolManager) {
            for (const particle of this.particles) {
                window.objectPoolManager.releaseParticle(particle);
            }
        }
        this.particles = [];
    }
}

// 工具函數
class Utils {
    // 計算兩點間距離
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // 計算兩點間角度
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    // 線性插值
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    // 限制數值在範圍內
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // 隨機範圍
    static randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    // 隨機選擇陣列元素
    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // 調整顏色透明度
    static adjustAlpha(color, alpha) {
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return color;
    }

    // 生成隨機顏色
    static randomColor() {
        const colors = ['#ff0066', '#00ff66', '#6600ff', '#ff6600', '#00ffff', '#ffff00'];
        return this.randomChoice(colors);
    }

    // 檢查點是否在圓內
    static pointInCircle(px, py, cx, cy, radius) {
        return this.distance(px, py, cx, cy) <= radius;
    }

    // 檢查兩個圓是否相交
    static circlesIntersect(x1, y1, r1, x2, y2, r2) {
        return this.distance(x1, y1, x2, y2) <= (r1 + r2);
    }
}

// 性能監控
class PerformanceMonitor {
    constructor() {
        this.fps = 60;
        this.frameTime = 0;
        this.lastTime = 0;
        this.frameCount = 0;
        this.updateTimer = 0;
    }

    update(currentTime) {
        // 首次調用時初始化
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
            return;
        }
        
        this.frameTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.frameCount++;

        // 每秒更新一次 FPS
        this.updateTimer += this.frameTime;
        if (this.updateTimer >= 1000) {
            // 計算平均每幀時間並轉換為 FPS
            const avgFrameTime = this.updateTimer / this.frameCount;
            this.fps = Math.min(240, Math.round(1000 / avgFrameTime));
            
            this.updateTimer = 0;
            this.frameCount = 0;

            // 更新 UI
            const fpsElement = document.getElementById('fps');
            if (fpsElement) {
                fpsElement.textContent = this.fps;
            }
        }
    }

    getFPS() {
        return this.fps;
    }

    getFrameTime() {
        return this.frameTime;
    }
}

// 導出類和工具
window.Particle = Particle;
window.ParticleManager = ParticleManager;
window.Utils = Utils;
window.PerformanceMonitor = PerformanceMonitor;