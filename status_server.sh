#!/bin/bash
# 檢查服務器狀態腳本

echo "=== Cyberpunk Cat Defense 服務器狀態 ==="
echo ""

# 檢查 PID 文件
if [ -f server.pid ]; then
    PID=$(cat server.pid)
    if ps -p $PID > /dev/null; then
        echo "✓ 服務器運行中 (PID: $PID)"
        echo "  訪問地址: http://localhost:8000"
    else
        echo "✗ 服務器未運行（PID 文件存在但進程不存在）"
        rm -f server.pid
    fi
else
    echo "✗ PID 文件不存在"
fi

echo ""

# 檢查端口
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "✓ 端口 8000 已被監聽"
    echo "  進程信息："
    lsof -i :8000 | grep -E "COMMAND|LISTEN"
else
    echo "✗ 端口 8000 未被監聽"
fi

echo ""

# 顯示最近的日誌
if [ -f server.log ]; then
    echo "最近的服務器日誌："
    tail -5 server.log
else
    echo "沒有找到日誌文件"
fi