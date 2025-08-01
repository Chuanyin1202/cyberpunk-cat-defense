# Android 簽名策略建議

## 🎯 推薦策略：Google Play App Signing

### 📋 為什麼選擇 Google Play App Signing？

#### ✅ 優勢
1. **安全性更高**：Google 保管最終簽名，即使您的 upload key 遺失也能恢復
2. **密鑰管理簡單**：只需管理 upload key，不用擔心最終簽名遺失
3. **支援密鑰輪換**：可以更換 upload key 而不影響應用
4. **未來兼容性**：支援新的簽名格式和安全特性

#### ❌ 傳統方式的風險
1. **密鑰遺失 = 應用報廢**
2. **無法恢復**
3. **密鑰管理負擔重**

## 🔧 實施步驟

### 1. 生成 Upload Key
```bash
keytool -genkey -v -keystore upload.keystore -alias upload \
  -keyalg RSA -keysize 2048 -validity 25000 \
  -storepass "Upload2025!" -keypass "Upload2025!" \
  -dname "CN=PlanBWork Upload, OU=Mobile Development, O=PlanBWork Co., L=Taipei, ST=Taiwan, C=TW"
```

### 2. 修改 build.gradle
```gradle
signingConfigs {
    debug {
        storeFile file('keys/debug.keystore')
        storePassword 'android'
        keyAlias 'debug'
        keyPassword 'android'
    }
    upload {
        storeFile file('keys/upload.keystore')
        storePassword 'Upload2025!'
        keyAlias 'upload'
        keyPassword 'Upload2025!'
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.upload  // 使用 upload key
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### 3. Google Play Console 設定
1. 上傳首個 APK/AAB 時選擇"讓 Google Play 管理我的應用簽名密鑰"
2. Google 會：
   - 生成安全的 app signing key
   - 將您的 upload key 註冊為上傳專用
   - 提供 app signing key 證書供您參考

## 📊 密鑰對比

| 類型 | 用途 | 遺失後果 | 管理者 |
|------|------|----------|--------|
| **Debug Key** | 開發測試 | 可重新生成 | 開發者 |
| **Upload Key** | 上傳到 Google Play | 可請求重置 | 開發者 |
| **App Signing Key** | 最終用戶安裝 | Google 負責保管 | Google |

## ⚠️ 重要注意事項

### 如果堅持使用傳統方式
- **備份策略**：至少 3 個不同地點保存 release.keystore
- **密碼管理**：使用密碼管理工具記錄
- **團隊共享**：確保團隊成員都能存取

### 建議的備份位置
1. **主要位置**：開發機器
2. **雲端備份**：加密後上傳到私人雲端
3. **物理備份**：USB 隨身碟（加密）
4. **團隊共享**：公司安全資料庫

## 🚀 切換到 Google Play App Signing

### 對於新應用（推薦）
直接使用上述 upload key 配置

### 對於現有應用
如果已經用 release key 上架：
1. 不能切換到 Google Play App Signing
2. 必須繼續使用原 release key
3. 建議加強備份策略

---

**建議**：由於這是新應用，強烈建議使用 Google Play App Signing！