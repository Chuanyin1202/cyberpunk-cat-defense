#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys
import signal
import threading
from datetime import datetime

PORT = 8000
HOST = "0.0.0.0"

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # 自定義日誌輸出
        with open('server.log', 'a') as f:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            f.write(f"{timestamp} - {self.address_string()} - {format % args}\n")
        # 同時輸出到控制台
        sys.stderr.write(f"{timestamp} - {self.address_string()} - {format % args}\n")

def signal_handler(sig, frame):
    print('\n正在關閉服務器...')
    sys.exit(0)

def start_server():
    # 切換到當前目錄
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # 註冊信號處理器
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
        print(f"服務器運行在 http://{HOST}:{PORT}")
        print(f"訪問 http://localhost:{PORT} 查看遊戲")
        print("按 Ctrl+C 停止服務器")
        
        # 記錄啟動信息
        with open('server.log', 'a') as f:
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            f.write(f"{timestamp} - 服務器啟動在 {HOST}:{PORT}\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            print("\n服務器已停止")

if __name__ == "__main__":
    start_server()