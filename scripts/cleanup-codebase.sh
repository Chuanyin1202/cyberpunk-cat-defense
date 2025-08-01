#!/bin/bash
# 程式碼庫清理腳本
# 注意：此腳本應從專案根目錄執行

# 確保在專案根目錄執行
if [ ! -f "index.html" ]; then
    echo "❌ 請在專案根目錄執行此腳本"
    exit 1
fi

echo "🧹 開始清理程式碼庫..."

# 1. 移動檔案到正確位置
echo "📁 調整檔案位置..."

# 移動 touchEnhancer.js 到 systems 目錄
if [ -f "js/touchEnhancer.js" ]; then
    echo "  - 移動 touchEnhancer.js 到 systems/"
    mv js/touchEnhancer.js js/systems/touchEnhancer.js
    
    # 更新 index.html 中的引用
    sed -i 's|js/touchEnhancer.js|js/systems/touchEnhancer.js|g' index.html
fi

# 移動 moduleLoader.js 到 core 目錄
if [ -f "js/moduleLoader.js" ]; then
    echo "  - 移動 moduleLoader.js 到 core/"
    mv js/moduleLoader.js js/core/moduleLoader.js
    
    # 更新 index.html 中的引用
    sed -i 's|js/moduleLoader.js|js/core/moduleLoader.js|g' index.html
fi

# 2. 處理測試檔案
echo "🧪 處理測試檔案..."

# 創建測試檔案目錄
mkdir -p tests

# 移動測試檔案
if [ -f "memory-leak-test.html" ]; then
    echo "  - 歸檔 memory-leak-test.html"
    mv memory-leak-test.html tests/
fi

if [ -f "editor/test.html" ]; then
    echo "  - 歸檔 editor/test.html"
    mv editor/test.html tests/editor-test.html
fi

# 3. 創建檔案說明
echo "📝 創建說明文件..."

cat > FILE_STRUCTURE.md << 'EOF'
# 檔案結構說明

## 目錄結構

### /js - 遊戲核心程式碼
- `/core` - 核心系統（配置、常數、事件系統等）
- `/entities` - 遊戲實體（基地、敵人、子彈等）
- `/managers` - 管理器（渲染管理等）
- `/rendering` - 渲染相關
- `/systems` - 子系統（輸入、物件池、升級等）
- `/ui` - UI 元件（升級介面、虛擬搖桿等）
- `/utils` - 工具函數

### /editor - 編輯器系統（獨立）
- `/css` - 編輯器樣式
- `/js/core` - 編輯器核心
- `/js/modules` - 編輯器模組
- `/js/ui` - 編輯器 UI

### /shared - 共享資源
- `/configs` - JSON 配置檔案

### /tests - 測試檔案
- 各種測試和調試用的 HTML 檔案

## 主要入口
- `index.html` - 遊戲主入口
- `editor/index.html` - 編輯器入口
EOF

echo "✅ 清理完成！"
echo ""
echo "📋 清理摘要："
echo "  - 檔案位置已調整"
echo "  - 測試檔案已歸檔到 /tests"
echo "  - 已創建 FILE_STRUCTURE.md 說明文件"
echo ""
echo "⚠️  請注意："
echo "  - 需要測試遊戲是否正常運行"
echo "  - 如果出現問題，可以使用 git 還原變更"