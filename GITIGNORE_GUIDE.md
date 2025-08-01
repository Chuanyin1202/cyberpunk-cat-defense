# .gitignore 說明指南

## 目前忽略的檔案類型

### 🗑️ 伺服器相關（不應上傳）
- `server.log` - 伺服器日誌
- `server_output.log` - 伺服器輸出日誌
- `server.pid` - 進程 ID 檔案
- `*.pyc` - Python 編譯檔案
- `__pycache__/` - Python 快取目錄

### 📝 暫存檔案
- `*.tmp`, `*.temp` - 臨時檔案
- `*.bak`, `*.backup`, `*.old` - 備份檔案
- `*.log` - 所有日誌檔案
- `*.cache` - 快取檔案

### 💻 開發環境
- `.vscode/`, `.idea/` - IDE 設定
- `*.swp`, `*.swo` - Vim 暫存檔
- `.DS_Store` - macOS 系統檔案
- `Thumbs.db` - Windows 縮圖快取

### 🧪 測試相關（可選）
目前是註解狀態，如果不想上傳測試檔案可以取消註解：
```
# memory-leak-test.html
# editor/test.html
# tests/
```

## 需要上傳的重要檔案

### ✅ 應該上傳到 GitHub
1. **所有遊戲程式碼** (`js/` 目錄)
2. **編輯器程式碼** (`editor/` 目錄)
3. **共享配置** (`shared/` 目錄)
4. **主要 HTML 檔案** (`index.html`, `editor/index.html`)
5. **腳本檔案** (`*.sh`)
6. **文件檔案** (`*.md`)

### ⚠️ 注意事項
- `cleanup-codebase.sh` - 清理腳本（建議上傳，方便其他開發者使用）
- `codebase-cleanup-report.md` - 程式碼分析報告（建議上傳作為文件）

## 檢查忽略狀態

使用以下命令檢查哪些檔案被忽略：
```bash
git status --ignored
```

查看將要上傳的檔案：
```bash
git status
```

如果某個被忽略的檔案需要上傳，可以強制添加：
```bash
git add -f <filename>
```