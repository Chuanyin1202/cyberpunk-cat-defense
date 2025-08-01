# Development Knowledge Base - 賽博喵咪塔防

🧠 **賽博喵咪塔防 Development Experience** - Technical challenges and solutions

---

## 📋 Contents
1. [Platform/Technology Specific Experiences](#platform-experiences)
2. [Technical Challenges & Solutions](#technical-challenges)
3. [Performance Optimization](#performance-optimization)
4. [Error Handling & Debugging](#error-handling)
5. [Integration Experiences](#integration-experiences)
6. [Best Practices Discovered](#best-practices)
7. [Future Development Guidelines](#future-guidelines)

---

## Platform/Technology Specific Experiences

### 🎯 Core Challenges

#### Android SDK 35 升級問題
- **Challenge**: 無法使用 SDK 35 編譯
- **Context**: Capacitor Android 專案，原本使用 SDK 34
- **Issue**: 編譯時出現 `aapt2 E RES_TABLE_TYPE_TYPE entry offsets overlap` 錯誤
- **Solution**: 升級 Android Gradle Plugin 從 8.0.0 到 8.2.2，同時升級 Gradle Wrapper 從 8.0.2 到 8.4

### 🔍 Key Technical Discoveries

#### Android Gradle Plugin 與 SDK 相容性
- **Discovery**: 每個 Android Gradle Plugin 版本都有其支援的最高 SDK 版本
- **Impact**: 使用過舊的 Plugin 版本會導致無法編譯新版 SDK
- **Application**: 升級 SDK 前需要先確認 Gradle Plugin 版本相容性

## Technical Challenges & Solutions

### Problem: APK 畫面在直向模式下被壓縮
**Context**: Web 版本在手機瀏覽器上正常顯示，但 APK 版本畫面被壓縮  
**Symptoms**: 遊戲畫面只佔螢幕的一部分，上下有黑邊  
**Investigation**: 比較 Web 版和 APK 版的 index.html 差異  
**Root Cause**: APK 版本使用了不同的 CSS 樣式，依賴 JavaScript 動態調整大小  
**Solution**: 使用與 Web 版相同的 CSS 方式，設定 100vw/100vh  
**Prevention**: 保持 Web 版和移動版的核心樣式一致

```css
#gameCanvas {
    width: 100vw !important;
    height: 100vh !important;
    max-width: none;
    max-height: none;
    object-fit: cover;
    object-position: center center;
}
```

### Problem: Android SDK 35 編譯失敗
**Context**: 嘗試將 compileSdkVersion 從 34 升級到 35  
**Symptoms**: `Android resource linking failed` 錯誤  
**Investigation**: 檢查錯誤訊息發現 Android Gradle Plugin 版本警告  
**Root Cause**: Android Gradle Plugin 8.0.0 不支援 SDK 35  
**Solution**: 
1. 升級 Android Gradle Plugin 到 8.2.2
2. 升級 Gradle Wrapper 到 8.4
3. 重新編譯成功

**Prevention**: 
- 升級 SDK 前先檢查 [Android Gradle Plugin Release Notes](https://developer.android.com/build/releases/gradle-plugin)
- 確認 Plugin 版本支援目標 SDK

## Performance Optimization
（待補充）

## Error Handling & Debugging

### TouchEnhancer 未定義錯誤
- **問題**: 移動版使用符號連結共享邏輯，但 TouchEnhancer 類別未正確引入
- **解決**: 在 mobile/index.html 中添加必要的 script 引用

## Integration Experiences

### Capacitor 整合
- **版本**: Capacitor 5.0.0
- **挑戰**: 需要維護兩個獨立的 index.html（Web 版和移動版）
- **解決**: 使用符號連結共享核心邏輯文件，只保持 HTML 入口分離

## Best Practices Discovered

### Android 開發最佳實踐
1. **簽名管理**: 
   - 使用 Google Play App Signing 更安全
   - 保留 debug.keystore 在版本控制中方便團隊開發
   - release.keystore 必須加入 .gitignore

2. **版本管理**:
   - 遵循語義化版本號
   - versionCode 使用日期格式確保唯一性

3. **架構決策**:
   - Web 和移動版共享核心邏輯
   - 分離平台特定的配置和樣式

## Future Development Guidelines

### SDK 升級檢查清單
1. 檢查 Android Gradle Plugin 相容性
2. 更新 gradle-wrapper.properties
3. 清理專案 (`./gradlew clean`)
4. 測試 debug 版本編譯
5. 測試 release 版本編譯
6. 在實機測試功能

### 維護建議
- 定期更新 Capacitor 和相關插件
- 保持 Android Gradle Plugin 在最新穩定版本
- 記錄每次重大更新的變更和解決方案

---

*最後更新：2025-08-01*