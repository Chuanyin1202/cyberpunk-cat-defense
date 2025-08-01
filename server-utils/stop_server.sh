#!/bin/bash
# 停止背景服務器腳本

# 切換到腳本目錄
cd "$(dirname "$0")"

if [ -f server.pid ]; then
    PID=$(cat server.pid)
    if ps -p $PID > /dev/null; then
        echo "正在停止服務器 (PID: $PID)..."
        kill $PID
        rm -f server.pid
        echo "服務器已停止"
    else
        echo "服務器未運行（PID: $PID 不存在）"
        rm -f server.pid
    fi
else
    echo "找不到 server.pid 文件"
    echo "嘗試尋找在端口 8000 上運行的進程..."
    
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
        PID=$(lsof -t -i:8000)
        echo "找到進程 (PID: $PID)，正在停止..."
        kill $PID
        echo "服務器已停止"
    else
        echo "沒有找到在端口 8000 上運行的服務器"
    fi
fi