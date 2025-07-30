// 簡化的敵人系統
// 只保留基本的敵人類型和移動邏輯

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        
        const config = GameConfig.ENEMIES[type];
        this.speed = config.speed;
        this.health = config.health;
        this.maxHealth = config.health;
        this.color = config.color;
        this.size = config.size;
        this.reward = config.reward;
        this.damage = config.damage;
        
        // 目標：貓咪基地
        this.targetX = GameConfig.GAME.BASE_X;
        this.targetY = GameConfig.GAME.BASE_Y;
        
        this.active = true;
        this.glowIntensity = 0;
        
        // 視覺效果
        this.pulsePhase = Math.random() * Math.PI * 2;
        
        // 狀態效果
        this.stunned = false;
        this.stunnedUntil = 0;
    }

    update(deltaTime) {
        if (!this.active) return;
        
        // 檢查眩暈狀態
        if (this.stunned) {
            const currentTime = Date.now();
            if (currentTime >= this.stunnedUntil) {
                this.stunned = false;
            }
        }

        // 計算到基地的距離
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 移動向基地（眩暈時不移動）
        if (!this.stunned && distance > 0) {
            const moveSpeed = this.speed * 60 * deltaTime;
            this.x += (dx / distance) * moveSpeed;
            this.y += (dy / distance) * moveSpeed;
        }

        // 更新視覺效果
        this.glowIntensity *= 0.95;
        this.pulsePhase += deltaTime * 3;

        // 檢查是否到達基地
        return distance <= GameConfig.GAME.BASE_RADIUS;
    }

    takeDamage(damage) {
        this.health -= Math.round(damage);
        this.glowIntensity = 1.0;
        
        if (this.health <= 0) {
            this.active = false;
            return true; // 死亡
        }
        return false;
    }

    render(ctx) {
        if (!this.active) return;

        ctx.save();

        // 移動到敵人位置
        ctx.translate(this.x, this.y);

        // 發光效果
        if (this.glowIntensity > 0) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15 * this.glowIntensity;
        }

        // 脈衝效果
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.1;
        const currentSize = this.size * pulse;

        // 繪製敵人主體 - 賽博龐克風格
        this.drawCyberpunkEnemy(ctx, currentSize);
        
        // 繪製眩暈效果
        if (this.stunned) {
            this.drawStunnedEffect(ctx);
        }

        // 繪製血條
        if (this.health < this.maxHealth) {
            this.drawHealthBar(ctx);
        }

        ctx.restore();
    }

    drawCyberpunkEnemy(ctx, size) {
        // 根據類型繪製不同風格
        switch (this.type) {
            case 'normal':
                this.drawNormalEnemy(ctx, size);
                break;
            case 'fast':
                this.drawFastEnemy(ctx, size);
                break;
            case 'tank':
                this.drawTankEnemy(ctx, size);
                break;
            case 'boss':
                this.drawBossEnemy(ctx, size);
                break;
        }
    }

    drawNormalEnemy(ctx, size) {
        // 賽博龐克機器人 - 八邊形外殼
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i;
            const x = size * Math.cos(angle);
            const y = size * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // 內部電路圖案
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.8;
        
        // 核心圓圈
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        
        // 連接線
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * size * 0.3, Math.sin(angle) * size * 0.3);
            ctx.lineTo(Math.cos(angle) * size * 0.7, Math.sin(angle) * size * 0.7);
            ctx.stroke();
        }
        
        // 中心發光點
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFastEnemy(ctx, size) {
        // 賽博龐克箭頭戰機 - 具有明確方向性的設計
        ctx.save();
        
        // 計算面向基地的角度
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const angle = Math.atan2(dy, dx);
        ctx.rotate(angle);
        
        // 主機身 - 流線型箭頭
        const gradient = ctx.createLinearGradient(-size, 0, size * 1.5, 0);
        gradient.addColorStop(0, '#444444');
        gradient.addColorStop(0.7, this.color);
        gradient.addColorStop(1, '#ffff00');
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        // 尖銳的前端（頭部）
        ctx.moveTo(size * 1.8, 0);
        // 上翼
        ctx.lineTo(size * 0.5, -size * 0.8);
        ctx.lineTo(0, -size * 0.6);
        // 後部凹陷（引擎部分）
        ctx.lineTo(-size * 1.0, -size * 0.8);
        ctx.lineTo(-size * 1.2, -size * 0.4);
        ctx.lineTo(-size * 1.2, size * 0.4);
        ctx.lineTo(-size * 1.0, size * 0.8);
        // 下翼
        ctx.lineTo(0, size * 0.6);
        ctx.lineTo(size * 0.5, size * 0.8);
        ctx.closePath();
        ctx.fill();
        
        // 機身中線
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(size * 1.8, 0);
        ctx.lineTo(-size * 1.2, 0);
        ctx.stroke();
        
        // 引擎噴射效果（後部）
        ctx.globalAlpha = 0.8;
        const engineGlow = ctx.createRadialGradient(
            -size * 1.2, 0, 0,
            -size * 1.2, 0, size * 0.8
        );
        engineGlow.addColorStop(0, '#00ffff');
        engineGlow.addColorStop(0.5, '#0088ff');
        engineGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = engineGlow;
        ctx.beginPath();
        ctx.arc(-size * 1.2, 0, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // 雙引擎噴口
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(-size * 1.0, -size * 0.3, size * 0.15, 0, Math.PI * 2);
        ctx.arc(-size * 1.0, size * 0.3, size * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // 駕駛艙（前部）
        ctx.fillStyle = '#00ffff';
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.ellipse(size * 0.8, 0, size * 0.3, size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 武器系統（機頭）
        ctx.fillStyle = '#ff0000';
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ff0000';
        ctx.beginPath();
        ctx.arc(size * 1.5, 0, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        
        // 速度線條裝飾
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(size * 0.5, -size * 0.3);
        ctx.lineTo(-size * 0.8, -size * 0.3);
        ctx.moveTo(size * 0.5, size * 0.3);
        ctx.lineTo(-size * 0.8, size * 0.3);
        ctx.stroke();
        
        ctx.restore();
    }

    drawTankEnemy(ctx, size) {
        // 重型裝甲機甲 - 複雜的六邊形設計
        ctx.save();
        
        // 外層裝甲板
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = size * Math.cos(angle);
            const y = size * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // 裝甲板分割線
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(size * Math.cos(angle), size * Math.sin(angle));
            ctx.stroke();
        }
        
        // 內層核心
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = size * 0.7 * Math.cos(angle);
            const y = size * 0.7 * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // 能量核心
        ctx.globalAlpha = 0.8;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.4);
        gradient.addColorStop(0, '#ff6600');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // 警示標記
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        
        // 危險符號
        ctx.fillStyle = '#ff0000';
        ctx.font = `${size * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', 0, 0);
        
        ctx.restore();
    }
    
    drawBossEnemy(ctx, size) {
        // 終極 BOSS - 多層結構的賽博龐克戰艦
        ctx.save();
        
        const time = Date.now() / 1000;
        
        // 外層護盾（旋轉）
        ctx.save();
        ctx.rotate(time * 0.5);
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI / 6) * i;
            const x = size * 1.3 * Math.cos(angle);
            const y = size * 1.3 * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        
        // 主體 - 複雜的多邊形
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, '#ff00ff');
        gradient.addColorStop(0.5, '#ff0066');
        gradient.addColorStop(1, '#660033');
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i;
            const radius = size * (1 + Math.sin(time * 2 + i) * 0.1);
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        
        // 內部機械結構
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7;
        
        // 齒輪形狀
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI / 8) * i;
            const radius = i % 2 === 0 ? size * 0.6 : size * 0.4;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        
        // 核心反應爐
        ctx.globalAlpha = 1;
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.3);
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.5, '#ff00ff');
        coreGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // 能量脈衝環
        for (let i = 0; i < 3; i++) {
            const pulseAlpha = 0.3 * (1 - (time * 2 + i * 0.3) % 1);
            ctx.globalAlpha = pulseAlpha;
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, size * (0.5 + (time * 2 + i * 0.3) % 1), 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // BOSS 標識
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${size * 0.3}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('B', 0, 0);
        
        ctx.restore();
    }

    drawHealthBar(ctx) {
        const barWidth = this.size * 2;
        const barHeight = 4;
        const barY = -this.size - 10;

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);

        // 血量
        const healthPercent = this.health / this.maxHealth;
        const healthColor = healthPercent > 0.6 ? '#00ff00' : 
                           healthPercent > 0.3 ? '#ffff00' : '#ff0000';
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight);

        // 邊框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(-barWidth / 2, barY, barWidth, barHeight);
    }
    
    drawStunnedEffect(ctx) {
        // 繪製眩暈星星
        const time = Date.now() / 1000;
        const starCount = 3;
        
        for (let i = 0; i < starCount; i++) {
            const angle = (Math.PI * 2 / starCount) * i + time * 2;
            const radius = this.size + 15;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius * 0.5 - this.size;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(time * 3);
            
            // 繪製星星
            ctx.fillStyle = '#ffff00';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ffff00';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', 0, 0);
            
            ctx.restore();
        }
    }
}

// 敵人管理系統
class EnemyManager {
    constructor(game) {
        this.game = game;
        this.enemies = [];
        this.spawnTimer = 0;
        this.waveActive = false;
        this.currentWave = 1;
        this.enemiesSpawned = 0;
        this.maxEnemiesInWave = 5;
    }

    update(deltaTime) {
        // 更新現有敵人
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const reachedBase = enemy.update(deltaTime);

            if (reachedBase) {
                // 敵人到達基地
                this.game.base.takeDamage(enemy.damage);
                this.game.gameState.lives -= enemy.damage;
                this.game.gameState.streak = 0;  // 重置連殺
                this.enemies.splice(i, 1);
                continue;
            }

            if (!enemy.active) {
                // 敵人死亡
                this.game.gameState.score += enemy.reward;
                this.game.gameState.gold += enemy.reward;
                this.game.gameState.kills++;
                
                // 更新連殺
                this.game.gameState.streak++;
                if (this.game.gameState.streak > 5) {
                    // 連殺獎勵
                    this.game.gameState.score += 10 * this.game.gameState.streak;
                }
                
                // 升級系統：獲得經驗值
                if (this.game.upgradeSystem) {
                    this.game.upgradeSystem.onEnemyKilled(enemy.type);
                    this.game.upgradeSystem.onEnemyKilledByPlayer(enemy);
                }
                
                this.game.createDeathEffect(enemy.x, enemy.y, enemy.color);
                this.enemies.splice(i, 1);
                continue;
            }
        }

        // 波次管理
        this.updateWaveLogic(deltaTime);
    }

    updateWaveLogic(deltaTime) {
        if (!this.waveActive) {
            // 檢查是否開始新波次
            if (this.enemies.length === 0) {
                this.startNextWave();
            }
            return;
        }

        // 生成敵人
        this.spawnTimer += deltaTime;
        const waveInfo = GameConfig.WAVE_CONFIG.getWaveInfo(this.currentWave);
        
        if (this.spawnTimer >= waveInfo.spawnRate && this.enemiesSpawned < this.maxEnemiesInWave) {
            this.spawnEnemy(waveInfo);
            this.spawnTimer = 0;
        }

        // 檢查波次是否完成
        if (this.enemiesSpawned >= this.maxEnemiesInWave && this.enemies.length === 0) {
            this.completeWave();
        }
    }

    startNextWave() {
        const waveInfo = GameConfig.WAVE_CONFIG.getWaveInfo(this.currentWave);
        
        this.waveActive = true;
        this.enemiesSpawned = 0;
        this.maxEnemiesInWave = waveInfo.enemyCount;
        this.spawnTimer = 0;

        // 更新UI
        this.game.gameState.wave = this.currentWave;
        
        console.log(`第 ${this.currentWave} 波開始：${waveInfo.name}`);
        
        // 如果是 BOSS 波次，立即生成 BOSS
        if (waveInfo.isBossWave) {
            this.spawnBoss(waveInfo);
            this.enemiesSpawned = this.maxEnemiesInWave;  // 標記已生成完成
        }
    }

    completeWave() {
        this.waveActive = false;
        const completedWave = this.currentWave;
        this.currentWave++;
        
        // 獎勵金幣
        const bonus = 50 + completedWave * 10;
        this.game.gameState.gold += bonus;
        
        console.log(`第 ${completedWave} 波完成！獲得 ${bonus} 金幣`);
        
        // 升級系統：觸發升級選擇
        if (this.game.upgradeSystem) {
            this.game.upgradeSystem.setUpgradeCallback(() => {
                // 升級完成後繼續遊戲
                console.log('升級完成，繼續下一波');
            });
            this.game.upgradeSystem.triggerUpgradeChoice(completedWave);
        }
    }

    spawnEnemy(waveInfo) {
        // 隨機選擇敵人類型
        const enemyTypes = waveInfo.enemies;
        const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

        // 從螢幕邊緣隨機生成
        const spawnSide = Math.floor(Math.random() * 4);
        let x, y;

        switch (spawnSide) {
            case 0: // 上
                x = Math.random() * GameConfig.CANVAS.WIDTH;
                y = -30;
                break;
            case 1: // 右
                x = GameConfig.CANVAS.WIDTH + 30;
                y = Math.random() * GameConfig.CANVAS.HEIGHT;
                break;
            case 2: // 下
                x = Math.random() * GameConfig.CANVAS.WIDTH;
                y = GameConfig.CANVAS.HEIGHT + 30;
                break;
            case 3: // 左
                x = -30;
                y = Math.random() * GameConfig.CANVAS.HEIGHT;
                break;
        }

        const enemy = new Enemy(x, y, randomType);
        
        // 應用波次修正
        enemy.health *= waveInfo.healthMultiplier;
        enemy.maxHealth = enemy.health;
        enemy.speed *= waveInfo.speedMultiplier;

        this.enemies.push(enemy);
        this.enemiesSpawned++;
    }
    
    spawnBoss(waveInfo) {
        // BOSS 從螢幕頂部中央出現
        const x = GameConfig.CANVAS.WIDTH / 2;
        const y = -50;
        
        const boss = new Enemy(x, y, 'boss');
        
        // 應用波次修正
        boss.health *= waveInfo.healthMultiplier;
        boss.maxHealth = boss.health;
        boss.speed *= waveInfo.speedMultiplier;
        
        // BOSS 震撼入場特效
        this.createBossEntryEffect(x, y);
        
        this.enemies.push(boss);
        
        console.log(`BOSS 出現！血量：${boss.health}`);
    }
    
    // 創建 BOSS 入場震撼特效
    createBossEntryEffect(x, y) {
        // 1. 螢幕震動效果
        if (!this.game.screenShake) {
            this.game.screenShake = {
                intensity: 0,
                duration: 0,
                time: 0
            };
        }
        
        this.game.screenShake.intensity = 15;
        this.game.screenShake.duration = 1.5;
        this.game.screenShake.time = 0;
        
        // 2. 大型爆炸粒子效果
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 / 30) * i;
            const speed = 200 + Math.random() * 100;
            
            this.game.particleManager.addParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: i % 3 === 0 ? '#ff00ff' : (i % 3 === 1 ? '#ff0066' : '#cc00cc'),
                size: 4 + Math.random() * 3,
                type: 'explosion',
                glow: true,
                gravity: 50,
                friction: 0.92
            });
        }
        
        // 3. 衝擊波效果
        if (!this.game.specialEffects) {
            this.game.specialEffects = [];
        }
        
        // 多重衝擊波
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.game.specialEffects.push({
                    type: 'shockwave',
                    x: x,
                    y: y + i * 50,  // 逐漸下移
                    radius: 0,
                    maxRadius: 300 + i * 100,
                    expandSpeed: 500 - i * 50,
                    alpha: 0.8 - i * 0.2,
                    color: '#ff00ff',
                    lineWidth: 5 - i,
                    createdTime: Date.now(),
                    duration: 1.0
                });
            }, i * 200);
        }
        
        // 4. 警告閃爍效果
        this.game.warningFlash = {
            active: true,
            color: '#ff0066',
            alpha: 0.3,
            duration: 1.5,
            time: 0
        };
        
        // 5. 閃電效果
        for (let i = 0; i < 5; i++) {
            const targetAngle = (Math.PI * 2 / 5) * i;
            const targetX = x + Math.cos(targetAngle) * 400;
            const targetY = y + Math.sin(targetAngle) * 400;
            
            this.createLightningEffect(x, y, targetX, targetY);
        }
    }
    
    // 創建閃電效果
    createLightningEffect(x1, y1, x2, y2) {
        const segments = 15;
        const points = [{x: x1, y: y1}];
        
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const baseX = x1 + (x2 - x1) * t;
            const baseY = y1 + (y2 - y1) * t;
            const offset = (segments / 2 - Math.abs(i - segments / 2)) * 10;
            
            points.push({
                x: baseX + (Math.random() - 0.5) * offset,
                y: baseY + (Math.random() - 0.5) * offset
            });
        }
        points.push({x: x2, y: y2});
        
        // 添加到特效列表
        this.game.specialEffects.push({
            type: 'lightning',
            points: points,
            color: '#ff00ff',
            alpha: 1.0,
            lineWidth: 3,
            createdTime: Date.now(),
            duration: 0.3,
            glow: true
        });
    }

    render(ctx) {
        for (const enemy of this.enemies) {
            enemy.render(ctx);
        }
    }

    // 獲取指定範圍內的敵人
    getEnemiesInRange(x, y, range) {
        return this.enemies.filter(enemy => {
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= range && enemy.active;
        });
    }
}

// 導出類
window.Enemy = Enemy;
window.EnemyManager = EnemyManager;