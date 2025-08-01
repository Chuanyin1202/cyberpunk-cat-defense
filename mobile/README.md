# 移動版開發指南

## 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 添加 Android 平台
```bash
npx cap add android
```

### 3. 同步文件
```bash
npx cap sync
```

### 4. 運行開發版本
```bash
npx cap run android
```

## 目錄結構

```
mobile/
├── index.html          # 移動版優化的入口
├── js/
│   ├── mobileConfig.js # 移動版配置
│   └── adManager.js    # 廣告管理系統
└── assets/            # 移動版資源
```

## 開發注意事項

1. **路徑問題**
   - mobile/index.html 使用相對路徑 `../js/` 來引用遊戲腳本
   - 確保 Capacitor 正確處理路徑

2. **廣告測試**
   - 開發時使用測試廣告 ID
   - 發布前必須替換為正式 ID

3. **性能優化**
   - 移動版已降低粒子數量
   - 關閉了某些視覺特效

## 調試技巧

1. **Chrome DevTools**
   ```
   chrome://inspect/#devices
   ```

2. **查看日誌**
   ```bash
   adb logcat | grep Capacitor
   ```

3. **常見問題**
   - 白屏：檢查路徑是否正確
   - 廣告不顯示：確認網路連接和廣告 ID

## 發布準備

詳見 [ANDROID_RELEASE_TODO.md](../ANDROID_RELEASE_TODO.md)