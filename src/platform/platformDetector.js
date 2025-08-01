/**
 * 平台檢測器
 * 自動檢測當前運行環境並返回對應的平台類型
 */

export class PlatformDetector {
    // 平台類型常數
    static PLATFORMS = {
        MOBILE_APP: 'mobile-app',      // 手機原生應用 (Android/iOS)
        MOBILE_WEB: 'mobile-web',      // 手機網頁版
        TABLET_APP: 'tablet-app',      // 平板原生應用
        TABLET_WEB: 'tablet-web',      // 平板網頁版
        DESKTOP_APP: 'desktop-app',    // 桌面應用 (Electron/Steam)
        DESKTOP_WEB: 'desktop-web'     // 桌面網頁版
    };
    
    /**
     * 檢測當前平台
     * @returns {string} 平台類型
     */
    static detect() {
        const isApp = this.isNativeApp();
        const deviceType = this.getDeviceType();
        
        // 組合平台類型
        if (isApp) {
            switch (deviceType) {
                case 'mobile':
                    return this.PLATFORMS.MOBILE_APP;
                case 'tablet':
                    return this.PLATFORMS.TABLET_APP;
                case 'desktop':
                    return this.PLATFORMS.DESKTOP_APP;
            }
        } else {
            switch (deviceType) {
                case 'mobile':
                    return this.PLATFORMS.MOBILE_WEB;
                case 'tablet':
                    return this.PLATFORMS.TABLET_WEB;
                case 'desktop':
                    return this.PLATFORMS.DESKTOP_WEB;
            }
        }
        
        // 預設返回桌面網頁版
        return this.PLATFORMS.DESKTOP_WEB;
    }
    
    /**
     * 檢測是否為原生應用
     * @returns {boolean}
     */
    static isNativeApp() {
        // Capacitor (Android/iOS)
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            return true;
        }
        
        // Electron (Desktop)
        if (window.electron || window.process?.versions?.electron) {
            return true;
        }
        
        // Cordova (舊版支援)
        if (window.cordova) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 獲取設備類型
     * @returns {string} 'mobile' | 'tablet' | 'desktop'
     */
    static getDeviceType() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isTouchDevice = this.isTouchDevice();
        const userAgent = navigator.userAgent.toLowerCase();
        
        // 檢測平板特徵
        const isTablet = this.isTabletUserAgent(userAgent) || 
                        (isTouchDevice && width >= 768 && width < 1024);
        
        // 檢測手機特徵
        const isMobile = this.isMobileUserAgent(userAgent) || 
                        (isTouchDevice && width < 768);
        
        if (isMobile) return 'mobile';
        if (isTablet) return 'tablet';
        return 'desktop';
    }
    
    /**
     * 檢測是否為觸控設備
     * @returns {boolean}
     */
    static isTouchDevice() {
        return (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0 ||
            window.matchMedia('(pointer: coarse)').matches
        );
    }
    
    /**
     * 檢測是否為手機 User Agent
     * @param {string} ua - User Agent 字串
     * @returns {boolean}
     */
    static isMobileUserAgent(ua) {
        const mobileKeywords = [
            'android', 'webos', 'iphone', 'ipod', 'blackberry',
            'windows phone', 'opera mini', 'mobile', 'palm', 'smartphone'
        ];
        
        return mobileKeywords.some(keyword => ua.includes(keyword));
    }
    
    /**
     * 檢測是否為平板 User Agent
     * @param {string} ua - User Agent 字串
     * @returns {boolean}
     */
    static isTabletUserAgent(ua) {
        const tabletKeywords = ['ipad', 'tablet', 'kindle', 'silk'];
        
        // Android 平板檢測（有 mobile 關鍵字的是手機）
        if (ua.includes('android') && !ua.includes('mobile')) {
            return true;
        }
        
        return tabletKeywords.some(keyword => ua.includes(keyword));
    }
    
    /**
     * 獲取平台詳細資訊
     * @returns {Object} 平台詳細資訊
     */
    static getPlatformInfo() {
        const platform = this.detect();
        const screenInfo = this.getScreenInfo();
        const capabilities = this.getCapabilities();
        
        return {
            platform,
            isApp: this.isNativeApp(),
            deviceType: this.getDeviceType(),
            screen: screenInfo,
            capabilities,
            userAgent: navigator.userAgent,
            language: navigator.language || 'en-US'
        };
    }
    
    /**
     * 獲取螢幕資訊
     * @returns {Object}
     */
    static getScreenInfo() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1,
            orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
            // 安全區域（用於 iPhone X 等有瀏海的設備）
            safeArea: {
                top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0'),
                right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sar') || '0'),
                bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0'),
                left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sal') || '0')
            }
        };
    }
    
    /**
     * 獲取設備能力
     * @returns {Object}
     */
    static getCapabilities() {
        return {
            touch: this.isTouchDevice(),
            mouse: window.matchMedia('(hover: hover)').matches,
            keyboard: !this.isTouchDevice() || this.getDeviceType() === 'desktop',
            vibration: 'vibrate' in navigator,
            audio: 'AudioContext' in window || 'webkitAudioContext' in window,
            webgl: this.checkWebGLSupport(),
            fullscreen: document.fullscreenEnabled || 
                       document.webkitFullscreenEnabled || 
                       document.mozFullScreenEnabled
        };
    }
    
    /**
     * 檢查 WebGL 支援
     * @returns {boolean}
     */
    static checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(
                window.WebGLRenderingContext && 
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
            );
        } catch (e) {
            return false;
        }
    }
}