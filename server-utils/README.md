# 伺服器工具說明

這個目錄包含管理遊戲開發伺服器的工具。

## 檔案說明

- `server.py` - Python HTTP 伺服器（支援 CORS）
- `start_server.sh` - 啟動伺服器腳本
- `stop_server.sh` - 停止伺服器腳本
- `status_server.sh` - 檢查伺服器狀態腳本

## 使用方式

### 從專案根目錄執行：

```bash
# 啟動伺服器
./server-utils/start_server.sh

# 檢查狀態
./server-utils/status_server.sh

# 停止伺服器
./server-utils/stop_server.sh
```

### 或者進入目錄執行：

```bash
cd server-utils

# 啟動伺服器
./start_server.sh

# 檢查狀態
./status_server.sh

# 停止伺服器
./stop_server.sh
```

## 注意事項

- 伺服器預設運行在端口 8000
- 支援 CORS，方便開發測試
- 日誌檔案會生成在 `server-utils` 目錄中
- PID 檔案用於追蹤伺服器進程

## 被 .gitignore 忽略的檔案

以下檔案不會上傳到 Git：
- `server.log` - 伺服器日誌
- `server_output.log` - 伺服器輸出
- `server.pid` - 進程 ID 檔案