/**
 * 預覽渲染器
 * 負責在編輯器中實時預覽資源效果
 */
class PreviewRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.currentAsset = null;
        this.currentMode = null;
        this.animationId = null;
        this.time = 0;
        this.gridVisible = true;
        this.previewVisible = true;
        
        // 預覽設定
        this.settings = {
            showGrid: true,
            showPath: true,
            showStats: true,
            animationSpeed: 1.0,
            zoom: 1.0
        };
        
        this.setupCanvas();
        this.startRenderLoop();
        
        console.log('🎨 預覽渲染器已創建');
    }
    
    /**
     * 設置畫布
     */
    setupCanvas() {
        // 設置高DPI支持
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        // 設置基本渲染屬性
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
    }
    
    /**
     * 開始渲染循環
     */
    startRenderLoop() {
        const render = (timestamp) => {
            this.time = timestamp * 0.001; // 轉換為秒
            this.render();
            this.animationId = requestAnimationFrame(render);
        };
        
        this.animationId = requestAnimationFrame(render);
    }
    
    /**
     * 停止渲染循環
     */
    stopRenderLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * 渲染資源
     */
    renderAsset(asset, mode) {
        this.currentAsset = asset;
        this.currentMode = mode;
        
        console.log(`🖼️ 預覽渲染: ${asset.name || asset.id} (${mode})`);
    }
    
    /**
     * 主渲染方法
     */
    render() {
        // 清空畫布
        this.clearCanvas();
        
        // 繪製網格
        if (this.settings.showGrid) {
            this.renderGrid();
        }
        
        // 繪製資源預覽
        if (this.currentAsset && this.previewVisible) {
            this.renderAssetPreview();
        }
        
        // 繪製UI覆蓋層
        this.renderOverlay();
    }
    
    /**
     * 清空畫布
     */
    clearCanvas() {
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        
        // 賽博龐克風格背景
        const gradient = this.ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(0.5, '#1a1a1a');
        gradient.addColorStop(1, '#0a0a0a');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);
    }
    
    /**
     * 繪製網格
     */
    renderGrid() {
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        const gridSize = 25;
        
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        // 垂直線
        for (let x = 0; x <= width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        
        // 水平線
        for (let y = 0; y <= height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
        
        // 中心線
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        
        // 垂直中心線
        this.ctx.beginPath();
        this.ctx.moveTo(width / 2, 0);
        this.ctx.lineTo(width / 2, height);
        this.ctx.stroke();
        
        // 水平中心線
        this.ctx.beginPath();
        this.ctx.moveTo(0, height / 2);
        this.ctx.lineTo(width, height / 2);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    /**
     * 渲染資源預覽
     */
    renderAssetPreview() {
        switch (this.currentMode) {
            case 'enemies':
                this.renderEnemyPreview();
                break;
            case 'weapons':
                this.renderWeaponPreview();
                break;
            case 'skills':
                this.renderSkillPreview();
                break;
            case 'effects':
                this.renderEffectPreview();
                break;
        }
    }
    
    /**
     * 渲染敵機預覽
     */
    renderEnemyPreview() {
        if (!this.currentAsset) return;
        
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        const centerX = width / 2;
        const centerY = height / 2;
        
        // 移動路徑演示
        if (this.settings.showPath) {
            this.renderMovementPath();
        }
        
        // 繪製敵機
        this.drawEnemy(centerX, centerY);
        
        // 顯示屬性信息
        if (this.settings.showStats) {
            this.renderEnemyStats();
        }
    }
    
    /**
     * 繪製敵機
     */
    drawEnemy(x, y) {
        const enemy = this.currentAsset;
        const size = (enemy.visual?.size || 12) * this.settings.zoom;
        const color = enemy.visual?.color || '#ff6600';
        const glowColor = enemy.visual?.glowColor || color;
        const shape = enemy.visual?.shape || 'circle';
        const opacity = enemy.visual?.opacity || 1.0;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.globalAlpha = opacity;
        
        // 脈衝動畫
        const pulseScale = 1 + Math.sin(this.time * 2) * 0.1;
        this.ctx.scale(pulseScale, pulseScale);
        
        // 雙層發光效果
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = glowColor;
        
        // 外層光暈
        this.drawGlowEffect(0, 0, size * 1.5, glowColor, 0.3);
        
        // 根據形狀繪製
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = glowColor;
        this.ctx.lineWidth = 2;
        
        switch (shape) {
            // 賽博龐克貓咪形狀
            case 'cyber_cat':
                this.drawCyberCat(0, 0, size);
                break;
                
            case 'chonky_mech_cat':
                this.drawChonkyMechCat(0, 0, size);
                break;
                
            case 'pixel_kitten':
                this.drawPixelKitten(0, 0, size);
                break;
                
            case 'quantum_cat':
                this.drawQuantumCat(0, 0, size);
                break;
                
            case 'yarn_ball':
                this.drawYarnBall(0, 0, size);
                break;
                
            case 'sphinx_cat':
                this.drawSphinxCat(0, 0, size);
                break;
                
            case 'red_dot':
                this.drawRedDot(0, 0, size);
                break;
                
            case 'crazed_cat':
                this.drawCrazedCat(0, 0, size);
                break;
                
            case 'angel_cat':
                this.drawAngelCat(0, 0, size);
                break;
                
            case 'mining_cat':
                this.drawMiningCat(0, 0, size);
                break;
                
            default:
                // 默認圓形
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size, 0, Math.PI * 2);
                this.ctx.fill();
                break;
        }
        
        // 繪製生命值條
        if (this.settings.showStats) {
            this.drawHealthBar(-size, -size - 20, size * 2, 4);
        }
        
        this.ctx.restore();
    }
    
    /**
     * 繪製六邊形
     */
    drawHexagon(x, y, size) {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = x + Math.cos(angle) * size;
            const py = y + Math.sin(angle) * size;
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
    }
    
    /**
     * 繪製生命值條
     */
    drawHealthBar(x, y, width, height) {
        const enemy = this.currentAsset;
        const maxHealth = enemy.stats?.health || 100;
        const currentHealth = maxHealth * 0.8; // 模擬80%血量
        const healthPercent = currentHealth / maxHealth;
        
        this.ctx.save();
        this.ctx.shadowBlur = 0;
        
        // 背景
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(x, y, width, height);
        
        // 生命值
        const healthColor = healthPercent > 0.6 ? '#00ff00' : 
                           healthPercent > 0.3 ? '#ffff00' : '#ff0000';
        this.ctx.fillStyle = healthColor;
        this.ctx.fillRect(x, y, width * healthPercent, height);
        
        // 邊框
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
        
        this.ctx.restore();
    }
    
    /**
     * 渲染移動路徑
     */
    renderMovementPath() {
        const enemy = this.currentAsset;
        const movementType = enemy.behavior?.movementType || 'straight';
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        
        switch (movementType) {
            case 'straight':
                this.ctx.moveTo(0, height / 2);
                this.ctx.lineTo(width, height / 2);
                break;
                
            case 'zigzag':
                const segments = 8;
                const amplitude = 50;
                for (let i = 0; i <= segments; i++) {
                    const x = (width / segments) * i;
                    const y = height / 2 + Math.sin((i / segments) * Math.PI * 4) * amplitude;
                    
                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
                break;
                
            case 'curve':
                this.ctx.moveTo(0, height / 2);
                this.ctx.quadraticCurveTo(width / 2, height / 4, width, height / 2);
                break;
                
            case 'arc':
                this.ctx.arc(width / 2, height, height / 2, Math.PI, 0);
                break;
        }
        
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    /**
     * 渲染敵機屬性信息
     */
    renderEnemyStats() {
        const enemy = this.currentAsset;
        const stats = [
            `名稱: ${enemy.name || enemy.id}`,
            `類型: ${enemy.type || 'unknown'}`,
            `生命: ${enemy.stats?.health || 0}`,
            `速度: ${enemy.stats?.speed || 0}`,
            `傷害: ${enemy.stats?.damage || 0}`,
            `獎勵: ${enemy.stats?.reward || 0}`
        ];
        
        this.renderStatsPanel(stats, 10, 10);
    }
    
    /**
     * 渲染武器預覽
     */
    renderWeaponPreview() {
        if (!this.currentAsset) return;
        
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        
        // 繪製射擊演示
        this.renderShootingDemo(width, height);
        
        // 顯示武器屬性
        if (this.settings.showStats) {
            this.renderWeaponStats();
        }
    }
    
    /**
     * 渲染射擊演示
     */
    renderShootingDemo(width, height) {
        const weapon = this.currentAsset;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // 繪製發射器（基地位置）
        this.ctx.save();
        this.ctx.fillStyle = '#00ffff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00ffff';
        this.ctx.beginPath();
        this.ctx.arc(50, centerY, 15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // 繪製子彈軌跡
        const bulletColor = weapon.visual?.bulletColor || '#00ffff';
        const bulletSize = (weapon.visual?.bulletSize || 3) * this.settings.zoom;
        
        // 多個子彈演示
        for (let i = 0; i < 3; i++) {
            const progress = (this.time * this.settings.animationSpeed + i * 0.5) % 2;
            if (progress > 1) continue;
            
            const x = 50 + (width - 100) * progress;
            const y = centerY + Math.sin(progress * Math.PI * 2) * 20 * i;
            
            this.ctx.save();
            this.ctx.fillStyle = bulletColor;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = bulletColor;
            
            // 子彈
            this.ctx.beginPath();
            this.ctx.arc(x, y, bulletSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 軌跡效果
            if (weapon.visual?.trailEffect) {
                this.ctx.strokeStyle = bulletColor;
                this.ctx.lineWidth = bulletSize * 0.5;
                this.ctx.globalAlpha = 0.5;
                this.ctx.beginPath();
                this.ctx.moveTo(x - 20, y);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        }
    }
    
    /**
     * 渲染武器屬性信息
     */
    renderWeaponStats() {
        const weapon = this.currentAsset;
        const stats = [
            `名稱: ${weapon.name || weapon.id}`,
            `類別: ${weapon.category || 'unknown'}`,
            `傷害: ${weapon.stats?.damage || 0}`,
            `射速: ${weapon.stats?.fireRate || 0}ms`,
            `射程: ${weapon.stats?.range || 0}`,
            `彈速: ${weapon.stats?.speed || 0}`,
            `精確度: ${((weapon.stats?.accuracy || 0) * 100).toFixed(1)}%`
        ];
        
        this.renderStatsPanel(stats, 10, 10);
    }
    
    /**
     * 渲染技能預覽
     */
    renderSkillPreview() {
        // 待實現
        this.renderPlaceholder('技能預覽開發中...');
    }
    
    /**
     * 渲染特效預覽
     */
    renderEffectPreview() {
        // 待實現
        this.renderPlaceholder('特效預覽開發中...');
    }
    
    /**
     * 渲染佔位符
     */
    renderPlaceholder(text) {
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        
        this.ctx.save();
        this.ctx.font = '16px "Courier New", monospace';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, width / 2, height / 2);
        this.ctx.restore();
    }
    
    /**
     * 渲染屬性面板
     */
    renderStatsPanel(stats, x, y) {
        this.ctx.save();
        
        // 面板背景
        const panelWidth = 200;
        const panelHeight = stats.length * 18 + 20;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x, y, panelWidth, panelHeight);
        
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, panelWidth, panelHeight);
        
        // 屬性文字
        this.ctx.font = '12px "Courier New", monospace';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        stats.forEach((stat, index) => {
            this.ctx.fillText(stat, x + 10, y + 10 + index * 18);
        });
        
        this.ctx.restore();
    }
    
    /**
     * 渲染覆蓋層UI
     */
    renderOverlay() {
        // 繪製縮放和設定信息
        this.renderZoomInfo();
    }
    
    /**
     * 渲染縮放信息
     */
    renderZoomInfo() {
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        
        this.ctx.save();
        this.ctx.font = '10px "Courier New", monospace';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'top';
        
        const info = [
            `縮放: ${(this.settings.zoom * 100).toFixed(0)}%`,
            `網格: ${this.settings.showGrid ? '開' : '關'}`,
            `預覽: ${this.previewVisible ? '開' : '關'}`
        ];
        
        info.forEach((text, index) => {
            this.ctx.fillText(text, width - 10, 10 + index * 12);
        });
        
        this.ctx.restore();
    }
    
    /**
     * 切換設定
     */
    toggleGrid() {
        this.settings.showGrid = !this.settings.showGrid;
    }
    
    togglePreview() {
        this.previewVisible = !this.previewVisible;
    }
    
    togglePath() {
        this.settings.showPath = !this.settings.showPath;
    }
    
    toggleStats() {
        this.settings.showStats = !this.settings.showStats;
    }
    
    /**
     * 設置縮放
     */
    setZoom(zoom) {
        this.settings.zoom = Math.max(0.1, Math.min(5.0, zoom));
    }
    
    /**
     * 設置動畫速度
     */
    setAnimationSpeed(speed) {
        this.settings.animationSpeed = Math.max(0.1, Math.min(3.0, speed));
    }
    
    /**
     * 清理資源
     */
    destroy() {
        this.stopRenderLoop();
        this.currentAsset = null;
        this.currentMode = null;
    }
    
    /**
     * 繪製發光效果
     */
    drawGlowEffect(x, y, radius, color, alpha) {
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
    
    /**
     * 繪製賽博骷髏
     */
    drawCyberSkull(x, y, size) {
        // 骷髏主體
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.3, size * 0.7, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 眼窩
        this.ctx.save();
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.25, y - size * 0.3, size * 0.15, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.25, y - size * 0.3, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 發光眼睛
        this.ctx.fillStyle = this.currentAsset.visual?.glowColor || '#ff00ff';
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.25, y - size * 0.3, size * 0.08, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.25, y - size * 0.3, size * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // 下顎
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.5, y + size * 0.1);
        this.ctx.lineTo(x, y + size * 0.5);
        this.ctx.lineTo(x + size * 0.5, y + size * 0.1);
        this.ctx.stroke();
    }
    
    /**
     * 繪製機甲行者
     */
    drawMechWalker(x, y, size) {
        // 主體
        this.ctx.fillRect(x - size * 0.4, y - size * 0.6, size * 0.8, size * 0.8);
        
        // 腿部
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.3, y - size * 0.2);
        this.ctx.lineTo(x - size * 0.5, y + size * 0.8);
        this.ctx.moveTo(x + size * 0.3, y - size * 0.2);
        this.ctx.lineTo(x + size * 0.5, y + size * 0.8);
        this.ctx.stroke();
        
        // 武器
        this.ctx.fillRect(x - size * 0.8, y - size * 0.4, size * 0.3, size * 0.15);
        this.ctx.fillRect(x + size * 0.5, y - size * 0.4, size * 0.3, size * 0.15);
    }
    
    /**
     * 繪製數位幽靈
     */
    drawDigitalGhost(x, y, size) {
        // 像素化效果
        const pixelSize = 3;
        for (let i = 0; i < 10; i++) {
            const px = x + (Math.random() - 0.5) * size * 2;
            const py = y + (Math.random() - 0.5) * size * 2;
            this.ctx.fillRect(px, py, pixelSize, pixelSize);
        }
        
        // 主體輪廓
        this.ctx.save();
        this.ctx.globalAlpha = 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size);
        this.ctx.quadraticCurveTo(x + size, y, x + size * 0.5, y + size);
        this.ctx.quadraticCurveTo(x, y + size * 0.5, x - size * 0.5, y + size);
        this.ctx.quadraticCurveTo(x - size, y, x, y - size);
        this.ctx.fill();
        this.ctx.restore();
    }
    
    /**
     * 繪製奈米無人機
     */
    drawNanoDrone(x, y, size) {
        // 六邊形主體
        this.drawHexagon(x, y, size * 0.8);
        this.ctx.fill();
        
        // 能量核心
        this.ctx.save();
        this.ctx.fillStyle = this.currentAsset.visual?.glowColor || '#ffaa00';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // 連接點
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const px = x + Math.cos(angle) * size * 0.8;
            const py = y + Math.sin(angle) * size * 0.8;
            this.ctx.beginPath();
            this.ctx.arc(px, py, size * 0.1, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    /**
     * 繪製暗影機體
     */
    drawShadowMech(x, y, size) {
        // 扭曲效果
        this.ctx.save();
        this.ctx.globalAlpha = 0.3;
        for (let i = 0; i < 3; i++) {
            this.ctx.save();
            this.ctx.translate(x + i * 2, y + i * 2);
            this.ctx.scale(1 - i * 0.1, 1 - i * 0.1);
            
            // 機體輪廓
            this.ctx.beginPath();
            this.ctx.moveTo(0, -size);
            this.ctx.lineTo(size * 0.6, -size * 0.3);
            this.ctx.lineTo(size * 0.8, size * 0.5);
            this.ctx.lineTo(0, size * 0.8);
            this.ctx.lineTo(-size * 0.8, size * 0.5);
            this.ctx.lineTo(-size * 0.6, -size * 0.3);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();
        }
        this.ctx.restore();
    }
    
    /**
     * 繪製生化機械怪物
     */
    drawBiomechHorror(x, y, size) {
        // 主體
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 觸手
        const tentacleCount = this.currentAsset.visual?.tentacles || 6;
        for (let i = 0; i < tentacleCount; i++) {
            const angle = (Math.PI * 2 / tentacleCount) * i + this.time * 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            const tx = x + Math.cos(angle) * size * 1.5;
            const ty = y + Math.sin(angle) * size * 1.5;
            const cx = x + Math.cos(angle + 0.3) * size;
            const cy = y + Math.sin(angle + 0.3) * size;
            this.ctx.quadraticCurveTo(cx, cy, tx, ty);
            this.ctx.stroke();
        }
        
        // 眼睛
        const eyeCount = this.currentAsset.visual?.eyeCount || 8;
        this.ctx.save();
        this.ctx.fillStyle = this.currentAsset.visual?.glowColor || '#ff3399';
        for (let i = 0; i < eyeCount; i++) {
            const angle = (Math.PI * 2 / eyeCount) * i;
            const ex = x + Math.cos(angle) * size * 0.5;
            const ey = y + Math.sin(angle) * size * 0.5;
            this.ctx.beginPath();
            this.ctx.arc(ex, ey, size * 0.1, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }
    
    /**
     * 繪製電火花無人機
     */
    drawSparkDrone(x, y, size) {
        // 核心
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 電弧
        this.ctx.save();
        this.ctx.strokeStyle = this.currentAsset.visual?.glowColor || '#66ffff';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i + this.time * 2;
            const startX = x + Math.cos(angle) * size * 0.5;
            const startY = y + Math.sin(angle) * size * 0.5;
            const endX = x + Math.cos(angle) * size * 1.2;
            const endY = y + Math.sin(angle) * size * 1.2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            // 閃電效果
            const midX = (startX + endX) / 2 + (Math.random() - 0.5) * size * 0.3;
            const midY = (startY + endY) / 2 + (Math.random() - 0.5) * size * 0.3;
            this.ctx.quadraticCurveTo(midX, midY, endX, endY);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }
    
    /**
     * 繪製全息戰機
     */
    drawHologramFighter(x, y, size) {
        // 掃描線效果
        this.ctx.save();
        this.ctx.globalAlpha = 0.8;
        
        // 戰機形狀
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size);
        this.ctx.lineTo(x + size * 0.7, y + size * 0.5);
        this.ctx.lineTo(x + size * 0.3, y + size * 0.3);
        this.ctx.lineTo(x, y + size * 0.7);
        this.ctx.lineTo(x - size * 0.3, y + size * 0.3);
        this.ctx.lineTo(x - size * 0.7, y + size * 0.5);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 掃描線
        this.ctx.strokeStyle = this.currentAsset.visual?.glowColor || '#ffff66';
        this.ctx.lineWidth = 1;
        for (let i = -size; i < size; i += 4) {
            this.ctx.beginPath();
            this.ctx.moveTo(x - size, y + i);
            this.ctx.lineTo(x + size, y + i);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }
    
    /**
     * 繪製不穩定質體
     */
    drawUnstableMass(x, y, size) {
        // 波動效果
        this.ctx.save();
        this.ctx.globalAlpha = 0.6;
        
        for (let i = 0; i < 5; i++) {
            const offset = this.time * 2 + i * 0.5;
            const wobbleX = Math.sin(offset) * size * 0.2;
            const wobbleY = Math.cos(offset) * size * 0.2;
            
            this.ctx.beginPath();
            this.ctx.arc(x + wobbleX, y + wobbleY, size * (0.8 - i * 0.1), 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
        
        // 概率雲
        this.ctx.save();
        this.ctx.globalAlpha = 0.2;
        for (let i = 0; i < 20; i++) {
            const px = x + (Math.random() - 0.5) * size * 3;
            const py = y + (Math.random() - 0.5) * size * 3;
            const ps = Math.random() * size * 0.3;
            this.ctx.beginPath();
            this.ctx.arc(px, py, ps, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }
    
    /**
     * 繪製腐化核心
     */
    drawCorruptedCore(x, y, size) {
        // 核心
        this.ctx.save();
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 故障效果
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${size * 0.3}px monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('ERROR', x, y);
        
        // 數據流
        this.ctx.strokeStyle = '#ff3333';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const startR = size * 0.6;
            const endR = size * 1.5;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x + Math.cos(angle) * startR, y + Math.sin(angle) * startR);
            this.ctx.lineTo(x + Math.cos(angle) * endR, y + Math.sin(angle) * endR);
            this.ctx.stroke();
            
            // 二進制碼
            const binaryX = x + Math.cos(angle) * (endR + 10);
            const binaryY = y + Math.sin(angle) * (endR + 10);
            this.ctx.font = '8px monospace';
            this.ctx.fillStyle = '#ff0000';
            this.ctx.fillText(Math.random() > 0.5 ? '1' : '0', binaryX, binaryY);
        }
        this.ctx.restore();
    }
    
    /**
     * 繪製賽博貓
     */
    drawCyberCat(x, y, size) {
        // 貓頭
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.3, size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 貓耳朵（三角形）
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.5, y - size * 0.5);
        this.ctx.lineTo(x - size * 0.3, y - size * 0.8);
        this.ctx.lineTo(x - size * 0.1, y - size * 0.5);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 0.5, y - size * 0.5);
        this.ctx.lineTo(x + size * 0.3, y - size * 0.8);
        this.ctx.lineTo(x + size * 0.1, y - size * 0.5);
        this.ctx.fill();
        
        // 身體
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + size * 0.3, size * 0.5, size * 0.7, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 發光眼睛
        this.ctx.save();
        this.ctx.fillStyle = this.currentAsset.visual?.glowColor || '#ff66ff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.currentAsset.visual?.glowColor || '#ff66ff';
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.2, y - size * 0.3, size * 0.08, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.2, y - size * 0.3, size * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 尾巴
        this.ctx.strokeStyle = this.currentAsset.visual?.color || '#ff00ff';
        this.ctx.lineWidth = size * 0.15;
        this.ctx.beginPath();
        const tailWave = Math.sin(this.time * 3) * size * 0.2;
        this.ctx.moveTo(x + size * 0.3, y + size * 0.5);
        this.ctx.quadraticCurveTo(
            x + size * 0.8 + tailWave, y + size * 0.3,
            x + size * 0.9, y - size * 0.2
        );
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    /**
     * 繪製肥胖機甲貓
     */
    drawChonkyMechCat(x, y, size) {
        // 超大身體
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, size * 0.9, size * 0.8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 小頭
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.7, size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 機械腿
        this.ctx.strokeStyle = this.currentAsset.visual?.glowColor || '#00ffff';
        this.ctx.lineWidth = size * 0.1;
        // 前腿
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.5, y + size * 0.5);
        this.ctx.lineTo(x - size * 0.5, y + size * 0.9);
        this.ctx.moveTo(x + size * 0.5, y + size * 0.5);
        this.ctx.lineTo(x + size * 0.5, y + size * 0.9);
        // 後腿
        this.ctx.moveTo(x - size * 0.3, y + size * 0.6);
        this.ctx.lineTo(x - size * 0.3, y + size * 0.9);
        this.ctx.moveTo(x + size * 0.3, y + size * 0.6);
        this.ctx.lineTo(x + size * 0.3, y + size * 0.9);
        this.ctx.stroke();
        
        // 激光眼
        this.ctx.save();
        this.ctx.fillStyle = '#ff0000';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.15, y - size * 0.7, size * 0.06, 0, Math.PI * 2);
        this.ctx.arc(x + size * 0.15, y - size * 0.7, size * 0.06, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }
    
    /**
     * 繪製像素小貓
     */
    drawPixelKitten(x, y, size) {
        const pixelSize = size * 0.1;
        this.ctx.save();
        
        // 像素化效果
        const catPixels = [
            // 頭部
            [-2, -4], [-1, -4], [0, -4], [1, -4], [2, -4],
            [-3, -3], [-2, -3], [-1, -3], [0, -3], [1, -3], [2, -3], [3, -3],
            // 耳朵
            [-3, -5], [3, -5],
            // 身體
            [-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2],
            [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1],
            [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0],
            [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1],
            // 腿
            [-2, 2], [-1, 2], [1, 2], [2, 2],
            // 尾巴
            [3, 0], [4, -1], [4, -2]
        ];
        
        // 繪製像素
        catPixels.forEach(([px, py]) => {
            const pixelX = x + px * pixelSize;
            const pixelY = y + py * pixelSize;
            this.ctx.fillRect(pixelX - pixelSize/2, pixelY - pixelSize/2, pixelSize, pixelSize);
        });
        
        // 眼睛（不同顏色）
        this.ctx.fillStyle = this.currentAsset.visual?.glowColor || '#00ff00';
        this.ctx.fillRect(x - pixelSize * 1.5, y - pixelSize * 3.5, pixelSize, pixelSize);
        this.ctx.fillRect(x + pixelSize * 0.5, y - pixelSize * 3.5, pixelSize, pixelSize);
        
        this.ctx.restore();
    }
    
    /**
     * 繪製量子貓
     */
    drawQuantumCat(x, y, size) {
        // 多重疊加態
        this.ctx.save();
        
        for (let i = 0; i < 3; i++) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.3 + (i * 0.2);
            const offset = Math.sin(this.time * 2 + i) * size * 0.1;
            
            // 盒子
            if (i === 0) {
                this.ctx.strokeStyle = this.currentAsset.visual?.color || '#9900ff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x - size * 0.8, y - size * 0.5, size * 1.6, size * 1.2);
            }
            
            // 貓（可能存在）
            this.ctx.translate(x + offset, y);
            this.ctx.scale(1 - i * 0.1, 1 - i * 0.1);
            
            // 簡單貓形
            this.ctx.beginPath();
            this.ctx.arc(0, -size * 0.3, size * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.ellipse(0, size * 0.2, size * 0.4, size * 0.5, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 問號
            if (i === 2) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = `${size * 0.4}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText('?', 0, 0);
            }
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    /**
     * 繪製毛線球
     */
    drawYarnBall(x, y, size) {
        // 球體
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 纏繞的線
        this.ctx.save();
        this.ctx.strokeStyle = this.currentAsset.visual?.glowColor || '#ffaa00';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.6;
        
        // 螺旋線
        for (let i = 0; i < 5; i++) {
            this.ctx.beginPath();
            const angle = (this.time * 2 + i * 0.5) % (Math.PI * 2);
            const r = size * 0.8;
            
            for (let j = 0; j < 20; j++) {
                const a = angle + j * 0.3;
                const radius = r + Math.sin(j * 0.5) * size * 0.2;
                const px = x + Math.cos(a) * radius;
                const py = y + Math.sin(a) * radius;
                
                if (j === 0) this.ctx.moveTo(px, py);
                else this.ctx.lineTo(px, py);
            }
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    /**
     * 繪製獅身貓
     */
    drawSphinxCat(x, y, size) {
        // 身體（獅子身）
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + size * 0.2, size * 0.8, size * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 頭部（貓頭）
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.4, size * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 埃及頭飾
        this.ctx.save();
        this.ctx.fillStyle = this.currentAsset.visual?.glowColor || '#9933ff';
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.6, y - size * 0.4);
        this.ctx.lineTo(x, y - size * 0.9);
        this.ctx.lineTo(x + size * 0.6, y - size * 0.4);
        this.ctx.lineTo(x + size * 0.4, y - size * 0.2);
        this.ctx.lineTo(x - size * 0.4, y - size * 0.2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 第三隻眼
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.5, size * 0.08, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 翅膀
        this.ctx.globalAlpha = 0.6;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.5, y);
        this.ctx.quadraticCurveTo(x - size * 1.5, y - size * 0.5, x - size * 1.2, y + size * 0.3);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 0.5, y);
        this.ctx.quadraticCurveTo(x + size * 1.5, y - size * 0.5, x + size * 1.2, y + size * 0.3);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    /**
     * 繪製紅點
     */
    drawRedDot(x, y, size) {
        // 多層光暈效果
        for (let i = 3; i > 0; i--) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.3 / i;
            this.ctx.fillStyle = this.currentAsset.visual?.color || '#ff0000';
            this.ctx.shadowBlur = size * i;
            this.ctx.shadowColor = '#ff0000';
            this.ctx.beginPath();
            this.ctx.arc(x, y, size * i * 0.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        
        // 核心紅點
        this.ctx.save();
        this.ctx.fillStyle = '#ff0000';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 跳動效果
        const jumpOffset = Math.abs(Math.sin(this.time * 10)) * size * 0.5;
        this.ctx.globalAlpha = 0.5;
        this.ctx.beginPath();
        this.ctx.arc(x + jumpOffset, y - jumpOffset, size * 0.7, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    /**
     * 繪製瘋狂貓
     */
    drawCrazedCat(x, y, size) {
        // 抖動效果
        const shakeX = (Math.random() - 0.5) * size * 0.1;
        const shakeY = (Math.random() - 0.5) * size * 0.1;
        
        this.ctx.save();
        this.ctx.translate(x + shakeX, y + shakeY);
        
        // 炸毛身體
        this.ctx.beginPath();
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            const r = size * (0.7 + Math.random() * 0.3);
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            
            if (i === 0) this.ctx.moveTo(px, py);
            else this.ctx.lineTo(px, py);
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        // 瘋狂的眼睛
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(-size * 0.3, -size * 0.2, size * 0.2, 0, Math.PI * 2);
        this.ctx.arc(size * 0.3, -size * 0.2, size * 0.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 瞳孔（不同方向）
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(-size * 0.35, -size * 0.15, size * 0.1, 0, Math.PI * 2);
        this.ctx.arc(size * 0.25, -size * 0.25, size * 0.1, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    /**
     * 繪製天使貓
     */
    drawAngelCat(x, y, size) {
        this.ctx.save();
        
        // 光環
        this.ctx.strokeStyle = this.currentAsset.visual?.glowColor || '#ffffcc';
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#ffffcc';
        this.ctx.beginPath();
        this.ctx.ellipse(x, y - size * 0.8, size * 0.4, size * 0.15, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 翅膀
        this.ctx.fillStyle = this.currentAsset.visual?.color || '#ffffff';
        this.ctx.globalAlpha = 0.7;
        
        // 左翼
        this.ctx.beginPath();
        this.ctx.moveTo(x - size * 0.3, y - size * 0.2);
        this.ctx.quadraticCurveTo(x - size * 1.2, y - size * 0.4, x - size * 1.0, y + size * 0.2);
        this.ctx.quadraticCurveTo(x - size * 0.8, y + size * 0.1, x - size * 0.3, y);
        this.ctx.fill();
        
        // 右翼
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 0.3, y - size * 0.2);
        this.ctx.quadraticCurveTo(x + size * 1.2, y - size * 0.4, x + size * 1.0, y + size * 0.2);
        this.ctx.quadraticCurveTo(x + size * 0.8, y + size * 0.1, x + size * 0.3, y);
        this.ctx.fill();
        
        // 貓身體（簡化）
        this.ctx.globalAlpha = 1;
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.2, size * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + size * 0.3, size * 0.4, size * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    /**
     * 繪製挖礦貓
     */
    drawMiningCat(x, y, size) {
        // 安全帽
        this.ctx.save();
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.5, size * 0.6, Math.PI, 0);
        this.ctx.fill();
        
        // 頭燈
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.6, size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // 貓身體
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.2, size * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + size * 0.4, size * 0.6, size * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 鎬子
        this.ctx.save();
        this.ctx.strokeStyle = '#8b4513';
        this.ctx.lineWidth = size * 0.1;
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 0.5, y);
        this.ctx.lineTo(x + size * 0.9, y - size * 0.3);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#c0c0c0';
        this.ctx.beginPath();
        this.ctx.moveTo(x + size * 0.8, y - size * 0.4);
        this.ctx.lineTo(x + size * 1.0, y - size * 0.3);
        this.ctx.lineTo(x + size * 0.9, y - size * 0.1);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 比特幣符號
        this.ctx.fillStyle = this.currentAsset.visual?.glowColor || '#ffed4e';
        this.ctx.font = `${size * 0.3}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('₿', x, y + size * 0.5);
        
        this.ctx.restore();
    }
}

// 全局訪問
window.PreviewRenderer = PreviewRenderer;