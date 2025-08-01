# 賽博喵咪塔防 - 簽名 Key 資訊

## 📱 應用資訊
- **Package Name**: com.planbwork.cyberpunkcats
- **應用名稱**: 賽博喵咪塔防

## 🔐 Debug Key 資訊
- **文件名**: debug.keystore
- **別名**: debug
- **密碼**: android
- **Key 密碼**: android
- **有效期**: 10,000 天
- **用途**: 開發測試

## 🚀 Release Key 資訊
- **文件名**: release.keystore
- **別名**: release
- **密碼**: CyberPunkCats2025!
- **Key 密碼**: CyberPunkCats2025!
- **有效期**: 25,000 天（約 68 年）
- **用途**: 正式發布到 Google Play Store

## 📋 證書資訊
- **演算法**: RSA 2048 位元
- **簽名**: SHA256withRSA
- **組織**: PlanBWork Co.
- **地區**: Taipei, Taiwan

## ⚠️ 重要提醒
1. **Release Key 安全性**:
   - 🔒 Release key 必須妥善保管，遺失無法復原
   - 🚫 絕對不要將 release key 提交到版本控制系統
   - 💾 建議備份到多個安全位置

2. **Google Play 上架**:
   - 使用 release key 簽名的 APK 才能上架
   - Key 一旦使用就不能更換
   - 應用的所有更新都必須使用相同的 key

3. **Debug Key 使用**:
   - 僅用於開發和測試
   - 不能用於正式發布
   - 可以隨時重新生成

## 🛠️ 使用方法

### Debug 簽名
```bash
./gradlew assembleDebug
```

### Release 簽名
```bash
./gradlew assembleRelease
```

---
**生成時間**: 2025-08-01 15:32
**生成工具**: Java keytool