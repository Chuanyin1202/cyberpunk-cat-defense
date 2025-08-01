/**
 * 桌面平台配置
 * 適用於 PC Web 和 Steam/Electron 版本
 */

export const desktopConfig = {
    // 遊戲平衡參數
    ENEMY_SPEED_MULTIPLIER: 1.0,      // 敵機速度正常
    PROJECTILE_SPEED_MULTIPLIER: 1.0, // 子彈速度正常
    
    // 渲染參數
    RENDER_SCALE: 1.0,                // 不縮放
    UI_SCALE: 1.0,                    // UI正常大小
    ENTITY_SIZE_MULTIPLIER: 1.0,      // 實體大小正常
    
    // 控制參數
    MOUSE_SENSITIVITY: 1.0,           // 滑鼠靈敏度
    PRECISION_MODE: true,             // 精確瞄準模式
    TRACKING_ASSISTANCE: 0.1,         // 輕微瞄準輔助
    
    // 性能參數
    MAX_PARTICLES: 100,               // 更多粒子效果
    MAX_PROJECTILES: 40,              // 更多子彈
    MAX_ENEMIES: 25,                  // 更多敵人
    CLEANUP_INTERVAL: 180,            // 較慢清理
    
    // 視覺效果
    VISUAL_EFFECTS_INTENSITY: 1.0,    // 完整特效
    GLOW_INTENSITY: 1.0               // 完整發光效果
};

export default desktopConfig;