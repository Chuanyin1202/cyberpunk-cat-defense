// 遊戲常量配置 - 集中管理所有魔術數字
// 提高代碼可維護性和可調整性

const GameConstants = {
    // === 空間網格配置 ===
    SPATIAL_GRID: {
        CELL_SIZE: 80,
        COLLISION_RADIUS: 15
    },
    
    // === 視窗尺寸配置 ===
    RESPONSIVE: {
        WINDOW_PADDING: 20,
        MOBILE_BREAKPOINT: 768,
        MOBILE_ASPECT_RATIO: 0.75
    },
    
    // === 動畫時間配置（秒）===
    ANIMATION: {
        FADE_OUT_DELAY: 2.0,
        SKILL_COOLDOWN: 5.0,
        BLINK_INTERVAL: 3.0,
        MEOW_INTERVAL: 10.0,
        ATTACK_COOLDOWN: 0.78,
        UPGRADE_ANIMATION_DURATION: 0.5,
        SELECTION_EFFECT_DELAY: 0.3
    },
    
    // === 渲染配置 ===
    RENDERING: {
        MAX_TRAIL_LENGTH: 8,
        LOD_THRESHOLD: 15,
        PARTICLE_BATCH_SIZE: 20,
        BACKGROUND_PARTICLE_COUNT: 25,
        GLOW_DECAY_RATE: 0.98,
        SHADOW_BLUR_DEFAULT: 5,
        GRID_OPACITY: 0.2
    },
    
    // === 遊戲邏輯配置 ===
    GAMEPLAY: {
        BASE_EXPERIENCE: 100,
        EXPERIENCE_INCREMENT: 25,
        WAVE_INTERVAL: 3000,
        SPAWN_INTERVAL: 1500,
        COMBO_DECAY_TIME: 2000,
        CRITICAL_HIT_MULTIPLIER: 2.0,
        ENERGY_BAR_MAX: 100,
        ENERGY_DECAY_RATE: 0.5
    },
    
    // === 物理配置 ===
    PHYSICS: {
        PROJECTILE_HIT_RADIUS: 10,
        ENEMY_HIT_RADIUS: 15,
        BASE_ATTACK_RANGE_MULTIPLIER: 3,
        GRAVITY: 50,
        FRICTION: 0.95,
        BOUNCE_DAMPING: 0.7
    },
    
    // === UI 配置 ===
    UI: {
        CARD_WIDTH: 200,
        CARD_HEIGHT: 280,
        CARD_SPACING: 50,
        GLITCH_INTENSITY: 2,
        HUD_PADDING: 15,
        FONT_SIZE_TITLE: 48,
        FONT_SIZE_SUBTITLE: 20,
        FONT_SIZE_NORMAL: 14,
        FONT_SIZE_SMALL: 12
    },
    
    // === 性能優化配置 ===
    PERFORMANCE: {
        CLEANUP_INTERVAL: 100, // 幀
        ARRAY_CLEANUP_THRESHOLD: 100,
        UPDATE_BATCH_SIZE: 20,
        MAX_PARTICLES_PER_EFFECT: 30,
        SPATIAL_GRID_UPDATE_INTERVAL: 1 // 每幀更新
    },
    
    // === 顏色主題 ===
    COLORS: {
        PRIMARY: '#00ffff',      // 賽博藍
        SECONDARY: '#ff00ff',    // 賽博紫
        ACCENT: '#00ff88',       // 賽博綠
        WARNING: '#ffff00',      // 警告黃
        DANGER: '#ff0066',       // 危險紅
        SUCCESS: '#00ff00',      // 成功綠
        WHITE: '#ffffff',
        BLACK: '#000000',
        BACKGROUND: 'rgba(0, 0, 0, 0.85)'
    },
    
    // === 音效配置（預留）===
    AUDIO: {
        MASTER_VOLUME: 0.7,
        SFX_VOLUME: 0.8,
        MUSIC_VOLUME: 0.5
    },
    
    // === 調試配置 ===
    DEBUG: {
        SHOW_HITBOXES: false,
        SHOW_FPS: true,
        SHOW_SPATIAL_GRID: false,
        LOG_PERFORMANCE: false
    }
};

// 凍結配置防止運行時修改
Object.freeze(GameConstants);
Object.keys(GameConstants).forEach(key => {
    Object.freeze(GameConstants[key]);
});

// 導出常量
window.GameConstants = GameConstants;