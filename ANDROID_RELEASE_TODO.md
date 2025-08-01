# 賽博龐克貓咪塔防 - Android 發布計劃

## 📱 專案資訊
- **應用名稱**: 賽博喵咪塔防
- **包名**: com.cyberpunkcatdefense.game
- **目標平台**: Android (優先)
- **商業模式**: 免費 + 廣告
- **最低 Android 版本**: 5.0 (API 21)

## ✅ 前置準備檢查清單

### 環境設置
- [ ] Node.js 已安裝 (v14+)
- [ ] Android Studio 已安裝
- [ ] Android SDK 已配置
- [ ] Google Play Console 帳號已開通 ✓
- [ ] AdMob 帳號已創建

### 開發工具
- [ ] 安裝 Capacitor CLI
- [ ] 測試設備準備就緒
- [ ] ADB 調試已啟用

## 🚀 Phase 1: 基礎設置 (已完成)

### 1.1 專案初始化 ✓
- [x] 創建 package.json
- [x] 配置 Capacitor
- [x] 更新 .gitignore
- [x] 創建移動版目錄結構

### 1.2 下一步操作
```bash
# 安裝依賴
npm install

# 初始化 Capacitor (如果尚未初始化)
npx cap init

# 添加 Android 平台
npx cap add android

# 同步文件到 Android
npx cap sync
```

## 📱 Phase 2: Android 專案配置

### 2.1 基礎配置
- [ ] 設置應用圖標 (各種尺寸)
- [ ] 設置啟動畫面
- [ ] 配置應用權限
- [ ] 設置版本號和版本名

### 2.2 應用圖標尺寸
需要準備以下尺寸的圖標：
- mipmap-mdpi: 48x48
- mipmap-hdpi: 72x72
- mipmap-xhdpi: 96x96
- mipmap-xxhdpi: 144x144
- mipmap-xxxhdpi: 192x192

### 2.3 AndroidManifest.xml 配置
```xml
<!-- 需要添加的權限 -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- 廣告相關 -->
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-YOUR-APP-ID"/>
```

## 💰 Phase 3: AdMob 整合

### 3.1 安裝 AdMob 插件
```bash
npm install @capacitor-community/admob
npx cap sync
```

### 3.2 AdMob 設置步驟
- [ ] 在 AdMob 創建應用
- [ ] 創建廣告單元 (獎勵視頻、插頁、橫幅)
- [ ] 獲取應用 ID 和廣告單元 ID
- [ ] 替換測試 ID 為正式 ID

### 3.3 廣告單元類型
1. **獎勵視頻廣告**
   - 用途：復活、獎勵翻倍、特殊道具
   - 預期 eCPM: $10-30

2. **插頁廣告**
   - 用途：波次間展示
   - 頻率：每 3-5 波一次
   - 預期 eCPM: $3-10

3. **橫幅廣告** (可選)
   - 用途：主選單
   - 預期 eCPM: $0.5-2

## 🎮 Phase 4: 遊戲整合

### 4.1 廣告觸發點實現
- [ ] 復活系統整合
  - [ ] 修改 game.js 添加死亡處理
  - [ ] 創建復活 UI
  - [ ] 處理復活邏輯

- [ ] 獎勵翻倍系統
  - [ ] 波次結束時顯示選項
  - [ ] 處理獎勵發放

- [ ] 插頁廣告時機
  - [ ] 波次計數器
  - [ ] 廣告顯示邏輯

### 4.2 代碼修改清單
```javascript
// game.js 需要添加的功能
- handlePlayerDeath() // 處理玩家死亡
- offerRevive() // 提供復活選項
- handleWaveComplete() // 波次完成處理
- checkInterstitialTiming() // 檢查插頁廣告時機
```

### 4.3 UI/UX 優化
- [ ] 廣告按鈕設計 (賽博龐克風格)
- [ ] 載入動畫
- [ ] 獎勵特效
- [ ] 廣告提示文案

## 🧪 Phase 5: 測試優化

### 5.1 功能測試
- [ ] 廣告載入測試
- [ ] 廣告展示測試
- [ ] 獎勵發放測試
- [ ] 無網路情況測試
- [ ] 返回鍵處理測試

### 5.2 性能測試
- [ ] 內存使用監控
- [ ] 電池消耗測試
- [ ] 不同設備兼容性
- [ ] 載入時間優化

### 5.3 測試設備清單
- [ ] 低端設備 (2GB RAM)
- [ ] 中端設備 (4GB RAM)
- [ ] 高端設備 (8GB+ RAM)
- [ ] 不同 Android 版本 (5.0, 7.0, 10.0, 12.0)

## 📸 Phase 6: 商店資產準備

### 6.1 截圖要求
需要準備 2-8 張截圖：
- [ ] 遊戲主畫面
- [ ] 戰鬥場景
- [ ] 升級系統
- [ ] BOSS 戰
- [ ] 特效展示

截圖尺寸：
- 手機: 1080x1920 或 1440x2560
- 平板: 1200x1920 或 1600x2560

### 6.2 商店列表資料
- [ ] 應用標題 (30 字符)
- [ ] 簡短描述 (80 字符)
- [ ] 完整描述 (4000 字符)
- [ ] 宣傳圖片 (1024x500)
- [ ] 應用圖標 (512x512)

### 6.3 描述文案範例
```
標題：賽博喵咪塔防 - 霓虹貓咪大戰

簡短描述：
在霓虹閃爍的賽博龐克世界，指揮貓咪軍團守護基地！

完整描述：
🐱 歡迎來到 2087 年的喵托邦！
在這個被貓咪統治的賽博龐克世界，您將扮演貓咪基地的守護者...

遊戲特色：
✨ 獨特的賽博龐克 x 貓咪主題
🎮 刺激的塔防戰鬥
⚡ 豐富的升級系統
🌟 絢麗的視覺特效
📱 完美的觸控體驗

立即下載，守護您的賽博貓咪基地！
```

## 🚀 Phase 7: 發布流程

### 7.1 構建 APK/AAB
```bash
# 構建 debug 版本測試
npx cap run android

# 構建 release 版本
cd android
./gradlew assembleRelease

# 或構建 AAB (推薦)
./gradlew bundleRelease
```

### 7.2 簽名配置
- [ ] 生成簽名密鑰
- [ ] 配置 build.gradle
- [ ] 保存密鑰安全

### 7.3 Google Play Console
- [ ] 創建應用
- [ ] 填寫商店資料
- [ ] 上傳 AAB 文件
- [ ] 設置內容分級
- [ ] 配置定價和分發
- [ ] 填寫隱私政策

### 7.4 內容分級問卷
- 暴力：輕度幻想暴力
- 性內容：無
- 賭博：無
- 年齡限制：7+

## 📊 Phase 8: 發布後監控

### 8.1 數據追蹤
- [ ] Firebase Analytics 整合
- [ ] 崩潰報告設置
- [ ] 廣告收入監控
- [ ] 用戶留存追蹤

### 8.2 關鍵指標
- DAU (日活躍用戶)
- 廣告展示率
- eCPM
- 用戶留存 (D1, D7, D30)
- 崩潰率

### 8.3 優化計劃
- A/B 測試廣告頻率
- 優化廣告位置
- 改進獎勵機制
- 收集用戶反饋

## 📋 快速檢查清單

發布前必須完成：
- [ ] 移除所有測試代碼
- [ ] 替換測試廣告 ID
- [ ] 測試購買流程（如有）
- [ ] 準備隱私政策頁面
- [ ] 測試所有廣告類型
- [ ] 優化 APK 大小
- [ ] 準備客服郵箱
- [ ] 設置崩潰報告

## 🎯 時間線估計

- **Phase 1-2**: 1 天 (環境設置) ✓
- **Phase 3-4**: 2-3 天 (廣告整合)
- **Phase 5**: 2 天 (測試優化)
- **Phase 6**: 1 天 (資產準備)
- **Phase 7**: 1 天 (發布)
- **總計**: 7-8 天

## 💡 注意事項

1. **廣告政策**
   - 不要在遊戲關鍵時刻顯示廣告
   - 確保廣告可以正常關閉
   - 遵守 AdMob 政策

2. **用戶體驗**
   - 廣告不要太頻繁
   - 提供真實價值的獎勵
   - 保持遊戲平衡

3. **技術考量**
   - 處理網路斷線情況
   - 廣告載入失敗的備案
   - 防止廣告作弊

## 🔗 相關資源

- [Capacitor 文檔](https://capacitorjs.com/docs)
- [AdMob 文檔](https://developers.google.com/admob)
- [Google Play Console](https://play.google.com/console)
- [Android 開發者文檔](https://developer.android.com)

---

**最後更新**: 2024-01-31
**當前進度**: Phase 1 完成，準備進入 Phase 2