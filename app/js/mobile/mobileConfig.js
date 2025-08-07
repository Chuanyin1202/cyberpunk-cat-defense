/**
 * 移動平台配置
 * 適用於手機和平板的 App 與 Web 版本
 */

// 移除 export 語法，改為全域變數
window.mobileConfig = {
    // 遊戲平衡參數
    ENEMY_SPEED_MULTIPLIER: 0.5,      // 敵機速度-50%
    PROJECTILE_SPEED_MULTIPLIER: 1.0, // 子彈速度正常
    
    // 渲染參數
    RENDER_SCALE: 0.75,               // 直屏縮放75%
    UI_SCALE: 1.2,                    // UI放大20%便於點擊
    ENTITY_SIZE_MULTIPLIER: 1.3,      // 敵機和子彈放大30%便於瞄準
    
    // 控制參數
    TOUCH_SENSITIVITY: 1.0,           // 觸控靈敏度
    JOYSTICK_DEAD_ZONE: 0.15,        // 搖桿死區
    TRACKING_ASSISTANCE: 0.3,         // 瞄準輔助強度
    
    // 性能優化參數
    MAX_PARTICLES: 60,                // 粒子數量減少
    MAX_PROJECTILES: 25,              // 子彈數量限制
    MAX_ENEMIES: 15,                  // 敵人數量限制
    CLEANUP_INTERVAL: 120,            // 更頻繁清理
    
    // 視覺效果
    VISUAL_EFFECTS_INTENSITY: 0.8,    // 特效強度降低
    GLOW_INTENSITY: 0.6               // 發光效果降低
};

// 移除 export default 語法