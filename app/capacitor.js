// Capacitor 核心檔案 - 由 Capacitor CLI 自動生成
// 此檔案為 Capacitor 框架的入口點

(function(win, doc) {
  if (!win.Capacitor) {
    // 基本 Capacitor 物件
    win.Capacitor = {
      platform: 'web',
      isNative: false,
      Plugins: {},
      
      // 基本 API
      getPlatform: function() {
        return this.platform;
      },
      
      isPluginAvailable: function(pluginName) {
        return !!this.Plugins[pluginName];
      },
      
      // 外掛註冊
      registerPlugin: function(pluginName, plugin) {
        this.Plugins[pluginName] = plugin;
      }
    };
    
    console.log('[Capacitor] Web 平台初始化完成');
  }
})(window, document);