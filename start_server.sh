#!/bin/bash
# 啟動背景服務器腳本

# 檢查是否已有服務運行在 8000 端口
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "警告：端口 8000 已被佔用！"
    echo "使用以下命令查看占用進程："
    echo "  lsof -i :8000"
    echo "使用以下命令停止進程："
    echo "  kill \$(lsof -t -i:8000)"
    exit 1
fi

# 啟動服務器在背景
echo "正在啟動 Cyberpunk Cat Defense 服務器..."
nohup python3 server.py > server_output.log 2>&1 &
SERVER_PID=$!

# 記錄 PID
echo $SERVER_PID > server.pid

echo "服務器已在背景啟動 (PID: $SERVER_PID)"
echo "訪問 http://localhost:8000 開始遊戲"
echo ""
echo "管理命令："
echo "  查看狀態: ./status_server.sh"
echo "  停止服務: ./stop_server.sh"
echo "  查看日誌: tail -f server.log"