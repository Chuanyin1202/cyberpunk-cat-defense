// 賽博龐克貓咪攻擊系統 - 創意攻擊模式
// 基於貓咪行為設計的獨特攻擊方式

class CatAttackSystem {
    constructor(base) {
        this.base = base;
        this.game = base.game;
        
        // 攻擊模式狀態
        this.currentMode = 'basic';
        this.modeTimer = 0;
        this.specialCooldowns = new Map();
        
        // 主動技能 - 簡化為兩個核心技能
        this.activeSkills = {
            plasmaOrb: { cooldown: 3000, lastUsed: 0 },  // 電漿彈
            pulseWave: { cooldown: 8000, lastUsed: 0 }   // 脈衝波
        };
        
        // 被動效果
        this.passiveEffects = {
            curiosity: { active: true, range: 1.5 },  // 增加攻擊範圍
            nineLives: { active: true, charges: 9 },  // 九命護盾
            catReflexes: { active: true, dodgeChance: 0.1 }  // 閃避機率
        };
        
        // 特殊攻擊狀態
        this.plasmaOrbs = [];
        this.pulseWaveActive = false;
    }
    
    // 更新攻擊系統
    update(deltaTime) {
        const currentTime = Date.now();
        
        // 更新特殊效果
        this.updatePlasmaOrbs(deltaTime);
        
        // 自動使用技能（基於遊戲狀態）
        this.autoUseSkills(currentTime);
    }
    
    // 基礎攻擊 - 貓爪快擊
    performBasicAttack(target) {
        // 創建爪痕投射物
        const projectile = this.game.createProjectile(this.base.x, this.base.y, target);
        projectile.type = 'claw';
        projectile.damage = this.catnipActive ? 30 : 15;
        
        // 爪擊特效
        this.createClawEffect(target);
        
        // 有機率觸發連擊
        if (Math.random() < 0.2) {
            setTimeout(() => {
                if (target.active) {
                    this.performBasicAttack(target);
                }
            }, 100);
        }
    }
    
    // 技能1：電漿彈
    launchPlasmaOrb() {
        const currentTime = Date.now();
        if (currentTime - this.activeSkills.plasmaOrb.lastUsed < this.activeSkills.plasmaOrb.cooldown) {
            return false;
        }
        
        this.activeSkills.plasmaOrb.lastUsed = currentTime;
        
        // 找到最近的敵人作為目標
        const enemies = this.game.enemies.filter(e => e.active);
        if (enemies.length === 0) return false;
        
        const target = enemies.reduce((nearest, enemy) => {
            const dist = Math.sqrt(Math.pow(enemy.x - this.base.x, 2) + Math.pow(enemy.y - this.base.y, 2));
            const nearestDist = Math.sqrt(Math.pow(nearest.x - this.base.x, 2) + Math.pow(nearest.y - this.base.y, 2));
            return dist < nearestDist ? enemy : nearest;
        });
        
        // 創建電漿彈
        const angle = Math.atan2(target.y - this.base.y, target.x - this.base.x);
        const plasmaOrb = {
            x: this.base.x,
            y: this.base.y,
            vx: Math.cos(angle) * 400,
            vy: Math.sin(angle) * 400,
            size: 15,
            damage: 80,
            trail: [],
            active: true,
            glow: 0,
            rotation: 0
        };
        
        this.plasmaOrbs.push(plasmaOrb);
        
        // 發射效果
        this.createPlasmaLaunchEffect();
        
        return true;
    }
    
    // 技能2：脈衝波
    releasePulseWave() {
        const currentTime = Date.now();
        if (currentTime - this.activeSkills.pulseWave.lastUsed < this.activeSkills.pulseWave.cooldown) {
            return false;
        }
        
        this.activeSkills.pulseWave.lastUsed = currentTime;
        this.pulseWaveActive = true;
        
        // 創建多層脈衝波
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.createPulseWave(i);
            }, i * 200);
        }
        
        return true;
    }
    
    // 移除的技能3：抓狂亂抓（暫時保留結構）
    scratchingFury() {
        const currentTime = Date.now();
        if (currentTime - this.activeSkills.scratchFury.lastUsed < this.activeSkills.scratchFury.cooldown) {
            return false;
        }
        
        this.activeSkills.scratchFury.lastUsed = currentTime;
        
        // 在隨機位置創建抓痕
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.5;
                const distance = 100 + Math.random() * 150;
                const x = this.base.x + Math.cos(angle) * distance;
                const y = this.base.y + Math.sin(angle) * distance;
                
                this.createScratchMark(x, y);
            }, i * 100);
        }
        
        // 表情變化
        this.base.emotion = 'angry';
        
        return true;
    }
    
    // 技能4：激光追逐
    laserPointerMadness() {
        const currentTime = Date.now();
        if (currentTime - this.activeSkills.laserChase.lastUsed < this.activeSkills.laserChase.cooldown) {
            return false;
        }
        
        this.activeSkills.laserChase.lastUsed = currentTime;
        
        // 創建激光點
        this.laserPointer = {
            x: this.base.x,
            y: this.base.y,
            targetX: Math.random() * this.game.canvas.width,
            targetY: Math.random() * this.game.canvas.height,
            speed: 300,
            duration: 5000,
            startTime: currentTime,
            lastDamageTime: 0
        };
        
        // 貓咪進入追逐模式
        this.base.emotion = 'happy';
        
        return true;
    }
    
    // 技能5：貓薄荷狂暴
    catnipBerserk() {
        const currentTime = Date.now();
        if (currentTime - this.activeSkills.catnipRage.lastUsed < this.activeSkills.catnipRage.cooldown) {
            return false;
        }
        
        this.activeSkills.catnipRage.lastUsed = currentTime;
        
        // 進入貓薄荷狀態
        this.catnipActive = true;
        this.catnipEndTime = currentTime + 8000;
        
        // 所有能力增強
        this.base.attackCooldown *= 0.3;  // 攻速提升
        this.base.attackRange *= 1.5;     // 範圍增加
        
        // 視覺效果
        this.createCatnipEffect();
        this.base.emotion = 'cool';
        
        return true;
    }
    
    // 被動技能：好奇心（擴大視野）
    applyCuriosityBonus() {
        if (this.passiveEffects.curiosity.active) {
            return this.base.attackRange * this.passiveEffects.curiosity.range;
        }
        return this.base.attackRange;
    }
    
    // 被動技能：九命（護盾）
    handleNineLives(damage) {
        if (this.passiveEffects.nineLives.active && this.passiveEffects.nineLives.charges > 0) {
            this.passiveEffects.nineLives.charges--;
            
            // 創建護盾特效
            this.createShieldEffect();
            
            // 完全吸收這次傷害
            if (this.passiveEffects.nineLives.charges === 0) {
                this.passiveEffects.nineLives.active = false;
            }
            
            return 0;  // 無傷害
        }
        return damage;
    }
    
    // 被動技能：貓咪反射神經（閃避）
    checkDodge() {
        if (this.passiveEffects.catReflexes.active && Math.random() < this.passiveEffects.catReflexes.dodgeChance) {
            // 創建閃避特效
            this.createDodgeEffect();
            this.base.emotion = 'cool';
            return true;
        }
        return false;
    }
    
    // 創建脈衝波
    createPulseWave(waveIndex) {
        const radius = 50 + waveIndex * 30;
        const enemies = this.game.enemies.filter(e => e.active);
        
        // 創建視覺效果
        this.createPulseWaveVisual(radius, waveIndex);
        
        // 延遲傷害計算，讓視覺效果先出現
        setTimeout(() => {
            enemies.forEach(enemy => {
                const distance = Math.sqrt(
                    Math.pow(enemy.x - this.base.x, 2) + 
                    Math.pow(enemy.y - this.base.y, 2)
                );
                
                // 檢查是否在波環範圍內
                if (Math.abs(distance - radius) < 30) {
                    enemy.takeDamage(40);
                    
                    // 擊退效果
                    const angle = Math.atan2(enemy.y - this.base.y, enemy.x - this.base.x);
                    enemy.x += Math.cos(angle) * 30;
                    enemy.y += Math.sin(angle) * 30;
                    
                    // 電擊效果
                    this.createElectricEffect(enemy.x, enemy.y);
                }
            });
        }, 100);
    }
    
    // 更新電漿彈
    updatePlasmaOrbs(deltaTime) {
        for (let i = this.plasmaOrbs.length - 1; i >= 0; i--) {
            const orb = this.plasmaOrbs[i];
            if (!orb.active) {
                this.plasmaOrbs.splice(i, 1);
                continue;
            }
            
            // 更新位置
            orb.x += orb.vx * deltaTime;
            orb.y += orb.vy * deltaTime;
            
            // 更新旋轉和光暈
            orb.rotation += deltaTime * 10;
            orb.glow = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
            
            // 添加軌跡點
            orb.trail.push({ x: orb.x, y: orb.y, life: 1.0 });
            
            // 更新軌跡
            orb.trail.forEach(point => {
                point.life -= deltaTime * 3;
            });
            orb.trail = orb.trail.filter(point => point.life > 0);
            
            // 限制軌跡長度
            if (orb.trail.length > 20) {
                orb.trail.shift();
            }
            
            // 檢查邊界
            if (orb.x < -50 || orb.x > this.game.canvas.width + 50 ||
                orb.y < -50 || orb.y > this.game.canvas.height + 50) {
                orb.active = false;
                continue;
            }
            
            // 檢查碰撞
            for (const enemy of this.game.enemies) {
                if (enemy.active) {
                    const dx = enemy.x - orb.x;
                    const dy = enemy.y - orb.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < orb.size + enemy.size) {
                        // 造成傷害
                        enemy.takeDamage(orb.damage);
                        
                        // 創建爆炸效果
                        this.createPlasmaExplosion(orb.x, orb.y);
                        
                        // 連鎖電擊附近敵人
                        this.chainLightning(orb.x, orb.y, enemy);
                        
                        orb.active = false;
                        break;
                    }
                }
            }
        }
    }
    
    // 更新激光點
    updateLaserPointer(deltaTime) {
        if (!this.laserPointer) return;
        
        const currentTime = Date.now();
        if (currentTime - this.laserPointer.startTime > this.laserPointer.duration) {
            this.laserPointer = null;
            return;
        }
        
        // 移動激光點
        const dx = this.laserPointer.targetX - this.laserPointer.x;
        const dy = this.laserPointer.targetY - this.laserPointer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const moveSpeed = this.laserPointer.speed * deltaTime;
            this.laserPointer.x += (dx / distance) * moveSpeed;
            this.laserPointer.y += (dy / distance) * moveSpeed;
        } else {
            // 到達目標，選擇新目標
            this.laserPointer.targetX = Math.random() * this.game.canvas.width;
            this.laserPointer.targetY = Math.random() * this.game.canvas.height;
        }
        
        // 貓咪射擊激光點
        if (currentTime - this.laserPointer.lastDamageTime > 200) {
            this.laserPointer.lastDamageTime = currentTime;
            
            // 創建激光束
            this.createLaserBeam(this.base.x, this.base.y, this.laserPointer.x, this.laserPointer.y);
            
            // 傷害路徑上的敵人
            this.game.enemies.forEach(enemy => {
                if (enemy.active) {
                    const distToLine = this.pointToLineDistance(
                        enemy.x, enemy.y,
                        this.base.x, this.base.y,
                        this.laserPointer.x, this.laserPointer.y
                    );
                    
                    if (distToLine < 20) {
                        enemy.takeDamage(10);
                    }
                }
            });
        }
    }
    
    // 更新抓痕
    updateScratchMarks(deltaTime) {
        for (let i = this.scratchMarks.length - 1; i >= 0; i--) {
            const mark = this.scratchMarks[i];
            mark.lifetime -= deltaTime;
            
            if (mark.lifetime <= 0) {
                this.scratchMarks.splice(i, 1);
                continue;
            }
            
            // 檢查敵人碰撞
            this.game.enemies.forEach(enemy => {
                if (enemy.active && !mark.hitEnemies.has(enemy)) {
                    const dx = enemy.x - mark.x;
                    const dy = enemy.y - mark.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < mark.radius) {
                        enemy.takeDamage(mark.damage);
                        mark.hitEnemies.add(enemy);
                        this.createScratchHitEffect(enemy.x, enemy.y);
                    }
                }
            });
        }
    }
    
    // 更新貓薄荷效果
    updateCatnipEffect(currentTime) {
        if (this.catnipActive && currentTime > this.catnipEndTime) {
            this.catnipActive = false;
            this.base.attackCooldown = 500;  // 恢復原始攻速
            this.base.attackRange = this.base.radius * 3;  // 恢復原始範圍
            this.base.emotion = 'normal';
        }
    }
    
    // 自動使用技能
    autoUseSkills(currentTime) {
        // 暫時停用自動技能，讓玩家手動控制
    }
    
    // 創建抓痕
    createScratchMark(x, y) {
        const mark = {
            x: x,
            y: y,
            radius: 40,
            damage: 20,
            lifetime: 2.0,
            hitEnemies: new Set()
        };
        
        this.scratchMarks.push(mark);
        this.createScratchEffect(x, y);
    }
    
    // === 視覺效果方法 ===
    
    // 創建電漿發射效果
    createPlasmaLaunchEffect() {
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            this.game.particleManager.addParticle(
                this.base.x + Math.cos(angle) * 20,
                this.base.y + Math.sin(angle) * 20,
                {
                    vx: Math.cos(angle) * 100,
                    vy: Math.sin(angle) * 100,
                    life: 0.5,
                    color: '#00ffff',
                    size: 4,
                    type: 'plasma_launch',
                    glow: true
                }
            );
        }
        
        // 中心閃光
        this.game.particleManager.addParticle(
            this.base.x,
            this.base.y,
            {
                vx: 0,
                vy: 0,
                life: 0.3,
                color: '#ffffff',
                size: 30,
                type: 'flash',
                fade: true
            }
        );
    }
    
    // 創建電漿爆炸效果
    createPlasmaExplosion(x, y) {
        // 環形衝擊波
        for (let ring = 0; ring < 3; ring++) {
            setTimeout(() => {
                const particleCount = 20;
                for (let i = 0; i < particleCount; i++) {
                    const angle = (Math.PI * 2 / particleCount) * i;
                    const speed = 200 - ring * 50;
                    this.game.particleManager.addParticle(
                        x,
                        y,
                        {
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            life: 0.6,
                            color: ring === 0 ? '#ffffff' : (ring === 1 ? '#00ffff' : '#ff00ff'),
                            size: 3,
                            type: 'plasma_ring',
                            glow: true
                        }
                    );
                }
            }, ring * 50);
        }
        
        // 電弧效果
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 30 + 20;
            this.createElectricArc(
                x, y,
                x + Math.cos(angle) * distance,
                y + Math.sin(angle) * distance
            );
        }
    }
    
    // 連鎖閃電效果
    chainLightning(x, y, firstEnemy) {
        const chainTargets = [];
        const maxChains = 3;
        let currentTarget = firstEnemy;
        let currentX = x;
        let currentY = y;
        
        // 找到連鎖目標
        for (let chain = 0; chain < maxChains; chain++) {
            let nearestEnemy = null;
            let nearestDistance = 150; // 最大連鎖距離
            
            this.game.enemies.forEach(enemy => {
                if (enemy.active && enemy !== currentTarget && !chainTargets.includes(enemy)) {
                    const dist = Math.sqrt(
                        Math.pow(enemy.x - currentX, 2) + 
                        Math.pow(enemy.y - currentY, 2)
                    );
                    if (dist < nearestDistance) {
                        nearestDistance = dist;
                        nearestEnemy = enemy;
                    }
                }
            });
            
            if (nearestEnemy) {
                chainTargets.push(nearestEnemy);
                // 創建電弧連接
                this.createElectricArc(currentX, currentY, nearestEnemy.x, nearestEnemy.y);
                // 造成遞減傷害
                nearestEnemy.takeDamage(30 - chain * 10);
                
                currentTarget = nearestEnemy;
                currentX = nearestEnemy.x;
                currentY = nearestEnemy.y;
            } else {
                break;
            }
        }
    }
    
    // 創建電弧效果
    createElectricArc(x1, y1, x2, y2) {
        const steps = 10;
        const points = [];
        
        // 生成電弧路徑點
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const mx = x1 + (x2 - x1) * t;
            const my = y1 + (y2 - y1) * t;
            
            // 添加隨機偏移
            const offset = i > 0 && i < steps ? (Math.random() - 0.5) * 20 : 0;
            const perpX = -(y2 - y1) / Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            const perpY = (x2 - x1) / Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            
            points.push({
                x: mx + perpX * offset,
                y: my + perpY * offset
            });
        }
        
        // 創建粒子連接點
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const subSteps = 3;
            
            for (let j = 0; j < subSteps; j++) {
                const t = j / subSteps;
                this.game.particleManager.addParticle(
                    p1.x + (p2.x - p1.x) * t,
                    p1.y + (p2.y - p1.y) * t,
                    {
                        vx: (Math.random() - 0.5) * 30,
                        vy: (Math.random() - 0.5) * 30,
                        life: 0.2,
                        color: '#00ffff',
                        size: 2,
                        type: 'electric',
                        glow: true
                    }
                );
            }
        }
    }
    
    // 創建脈衝波視覺效果
    createPulseWaveVisual(radius, waveIndex) {
        const segments = 60;
        const baseColor = ['#ffffff', '#00ffff', '#ff00ff'][waveIndex];
        
        for (let i = 0; i < segments; i++) {
            const angle = (Math.PI * 2 / segments) * i;
            const x = this.base.x + Math.cos(angle) * radius;
            const y = this.base.y + Math.sin(angle) * radius;
            
            this.game.particleManager.addParticle(
                x,
                y,
                {
                    vx: Math.cos(angle) * 50,
                    vy: Math.sin(angle) * 50,
                    life: 0.8 - waveIndex * 0.2,
                    color: baseColor,
                    size: 4 - waveIndex,
                    type: 'pulse_wave',
                    glow: true,
                    fade: true
                }
            );
            
            // 內側光暈
            if (i % 3 === 0) {
                this.game.particleManager.addParticle(
                    this.base.x + Math.cos(angle) * (radius - 10),
                    this.base.y + Math.sin(angle) * (radius - 10),
                    {
                        vx: Math.cos(angle) * 30,
                        vy: Math.sin(angle) * 30,
                        life: 0.5,
                        color: '#ffffff',
                        size: 2,
                        type: 'pulse_inner',
                        glow: true
                    }
                );
            }
        }
    }
    
    // 創建電擊效果
    createElectricEffect(x, y) {
        // 小型電弧
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 20 + 10;
            this.createElectricArc(
                x, y,
                x + Math.cos(angle) * distance,
                y + Math.sin(angle) * distance
            );
        }
        
        // 電火花
        for (let i = 0; i < 8; i++) {
            this.game.particleManager.addParticle(
                x + (Math.random() - 0.5) * 20,
                y + (Math.random() - 0.5) * 20,
                {
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    life: 0.3,
                    color: '#00ffff',
                    size: 2,
                    type: 'spark',
                    glow: true
                }
            );
        }
    }
    
    createHairballEffect() {
        for (let i = 0; i < 10; i++) {
            this.game.particleManager.addParticle(
                this.base.x,
                this.base.y - 20,
                {
                    vx: (Math.random() - 0.5) * 100,
                    vy: -Math.random() * 200 - 100,
                    life: 0.5,
                    color: '#8B4513',
                    size: Math.random() * 5 + 2,
                    type: 'hairball'
                }
            );
        }
    }
    
    createSonicWaveEffect() {
        // 創建環形波紋
        for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
            this.game.particleManager.addParticle(
                this.base.x + Math.cos(angle) * 50,
                this.base.y + Math.sin(angle) * 50,
                {
                    vx: Math.cos(angle) * 200,
                    vy: Math.sin(angle) * 200,
                    life: 0.8,
                    color: '#00ffff',
                    size: 5,
                    type: 'sonic'
                }
            );
        }
    }
    
    createScratchEffect(x, y) {
        // 爪痕視覺效果
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i + Math.random() * 0.5;
            this.game.particleManager.addParticle(
                x,
                y,
                {
                    vx: Math.cos(angle) * 150,
                    vy: Math.sin(angle) * 150,
                    life: 0.4,
                    color: '#ff0080',
                    size: 4,
                    type: 'scratch'
                }
            );
        }
    }
    
    createCatnipEffect() {
        // 綠色星星環繞
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            this.game.particleManager.addParticle(
                this.base.x + Math.cos(angle) * 60,
                this.base.y + Math.sin(angle) * 60,
                {
                    vx: 0,
                    vy: -50,
                    life: 2.0,
                    color: '#00ff00',
                    size: 3,
                    type: 'catnip'
                }
            );
        }
    }
    
    createShieldEffect() {
        // 九命護盾效果
        for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
            this.game.particleManager.addParticle(
                this.base.x + Math.cos(angle) * this.base.radius,
                this.base.y + Math.sin(angle) * this.base.radius,
                {
                    vx: 0,
                    vy: 0,
                    life: 0.5,
                    color: '#ffff00',
                    size: 6,
                    type: 'shield'
                }
            );
        }
    }
    
    createDodgeEffect() {
        // 殘影效果
        this.game.particleManager.addParticle(
            this.base.x,
            this.base.y,
            {
                vx: 0,
                vy: 0,
                life: 0.3,
                color: '#00ffff',
                size: this.base.radius,
                type: 'afterimage'
            }
        );
    }
    
    createBounceExplosion(x, y, damage) {
        // 毛球彈跳爆炸
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 / 15) * i;
            this.game.particleManager.addParticle(
                x,
                y,
                {
                    vx: Math.cos(angle) * 150,
                    vy: Math.sin(angle) * 150,
                    life: 0.5,
                    color: '#8B4513',
                    size: 4,
                    type: 'hit'
                }
            );
        }
    }
    
    createLaserBeam(x1, y1, x2, y2) {
        // 激光束效果
        const steps = 10;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            this.game.particleManager.addParticle(
                x1 + (x2 - x1) * t,
                y1 + (y2 - y1) * t,
                {
                    vx: (Math.random() - 0.5) * 50,
                    vy: (Math.random() - 0.5) * 50,
                    life: 0.2,
                    color: '#ff0000',
                    size: 3,
                    type: 'laser'
                }
            );
        }
    }
    
    createScratchHitEffect(x, y) {
        // 抓痕命中效果
        for (let i = 0; i < 5; i++) {
            this.game.particleManager.addParticle(
                x,
                y,
                {
                    vx: (Math.random() - 0.5) * 100,
                    vy: (Math.random() - 0.5) * 100,
                    life: 0.3,
                    color: '#ff0080',
                    size: 2,
                    type: 'hit'
                }
            );
        }
    }
    
    createHairballHitEffect(x, y) {
        // 毛球命中效果
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            this.game.particleManager.addParticle(
                x,
                y,
                {
                    vx: Math.cos(angle) * 100,
                    vy: Math.sin(angle) * 100,
                    life: 0.4,
                    color: '#8B4513',
                    size: 3,
                    type: 'hairball_hit'
                }
            );
        }
    }
    
    // 工具方法：點到線的距離
    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // 渲染方法（供 baseRenderer 調用）
    render(ctx) {
        // 設置混合模式以創造光效
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // 渲染電漿彈
        this.plasmaOrbs.forEach(orb => {
            if (orb.active) {
                ctx.save();
                
                // 渲染軌跡
                if (orb.trail.length > 1) {
                    ctx.strokeStyle = '#00ffff';
                    ctx.lineWidth = 3;
                    ctx.lineCap = 'round';
                    
                    for (let i = 0; i < orb.trail.length - 1; i++) {
                        const point = orb.trail[i];
                        const nextPoint = orb.trail[i + 1];
                        
                        ctx.globalAlpha = point.life * 0.5;
                        ctx.beginPath();
                        ctx.moveTo(point.x, point.y);
                        ctx.lineTo(nextPoint.x, nextPoint.y);
                        ctx.stroke();
                    }
                }
                
                // 渲染電漿球主體
                ctx.globalAlpha = 1;
                ctx.translate(orb.x, orb.y);
                ctx.rotate(orb.rotation);
                
                // 外層光暈
                const glowSize = orb.size * (2 + orb.glow);
                const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
                glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                glowGradient.addColorStop(0.3, 'rgba(0, 255, 255, 0.6)');
                glowGradient.addColorStop(0.6, 'rgba(255, 0, 255, 0.3)');
                glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
                
                ctx.fillStyle = glowGradient;
                ctx.beginPath();
                ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
                ctx.fill();
                
                // 內核
                const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, orb.size);
                coreGradient.addColorStop(0, '#ffffff');
                coreGradient.addColorStop(0.5, '#00ffff');
                coreGradient.addColorStop(1, '#0088ff');
                
                ctx.fillStyle = coreGradient;
                ctx.beginPath();
                ctx.arc(0, 0, orb.size, 0, Math.PI * 2);
                ctx.fill();
                
                // 電弧裝飾
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.6;
                for (let i = 0; i < 3; i++) {
                    const angle = (Math.PI * 2 / 3) * i;
                    ctx.beginPath();
                    ctx.arc(0, 0, orb.size * 0.7, angle, angle + Math.PI / 3);
                    ctx.stroke();
                }
                
                ctx.restore();
            }
        });
        
        ctx.restore();
        
    }
}

// 導出類
window.CatAttackSystem = CatAttackSystem;