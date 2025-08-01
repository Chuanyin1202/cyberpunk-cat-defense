/**
 * 資源瀏覽器
 * 負責顯示和管理資源列表
 */
class AssetBrowser {
    constructor(containerElement) {
        this.container = containerElement;
        this.assets = [];
        this.selectedAssetId = null;
        this.currentModuleType = null;
        this.searchQuery = '';
        this.sortBy = 'name';
        this.sortOrder = 'asc';
        
        console.log('📂 資源瀏覽器已創建');
    }
    
    /**
     * 更新資源列表
     */
    updateAssetList(assets, moduleType) {
        this.assets = assets;
        this.currentModuleType = moduleType;
        this.renderAssetList();
        
        console.log(`📋 已更新 ${moduleType} 資源列表: ${assets.length} 個項目`);
    }
    
    /**
     * 渲染資源列表
     */
    renderAssetList() {
        if (!this.assets || this.assets.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        // 過濾和排序
        let filteredAssets = this.filterAssets();
        filteredAssets = this.sortAssets(filteredAssets);
        
        let html = '';
        
        // 搜索框
        html += this.renderSearchBox();
        
        // 排序控制
        html += this.renderSortControls();
        
        // 資源項目
        filteredAssets.forEach(asset => {
            html += this.renderAssetItem(asset);
        });
        
        this.container.innerHTML = html;
        this.bindEvents();
    }
    
    /**
     * 渲染空狀態
     */
    renderEmptyState() {
        this.container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📁</div>
                <h4>沒有資源</h4>
                <p>點擊「新建」來創建第一個${this.getModuleDisplayName()}資源</p>
                <button class="create-first-button" onclick="window.gameEditor.createNewAsset()">
                    <span class="button-icon">➕</span>
                    <span class="button-text">創建資源</span>
                </button>
            </div>
        `;
    }
    
    /**
     * 渲染搜索框
     */
    renderSearchBox() {
        return `
            <div class="search-box">
                <input type="text" 
                       class="search-input" 
                       placeholder="搜索資源..."
                       value="${this.searchQuery}"
                       id="asset-search">
                <button class="search-clear" id="search-clear" style="display: ${this.searchQuery ? 'block' : 'none'}">
                    ✖
                </button>
            </div>
        `;
    }
    
    /**
     * 渲染排序控制
     */
    renderSortControls() {
        return `
            <div class="sort-controls">
                <label class="sort-label">排序:</label>
                <select class="sort-select" id="sort-by">
                    <option value="name" ${this.sortBy === 'name' ? 'selected' : ''}>名稱</option>
                    <option value="type" ${this.sortBy === 'type' ? 'selected' : ''}>類型</option>
                    <option value="lastModified" ${this.sortBy === 'lastModified' ? 'selected' : ''}>修改時間</option>
                </select>
                <button class="sort-order-toggle" id="sort-order" data-order="${this.sortOrder}">
                    ${this.sortOrder === 'asc' ? '↑' : '↓'}
                </button>
            </div>
        `;
    }
    
    /**
     * 渲染資源項目
     */
    renderAssetItem(asset) {
        const isSelected = this.selectedAssetId === asset.id;
        const icon = this.getAssetIcon(asset);
        const typeLabel = this.getTypeLabel(asset.type);
        
        return `
            <div class="asset-item ${isSelected ? 'selected' : ''}" 
                 data-asset-id="${asset.id}"
                 title="${asset.name}">
                <div class="asset-icon">${icon}</div>
                <div class="asset-info">
                    <div class="asset-name">${asset.name}</div>
                    <div class="asset-type">${typeLabel}</div>
                </div>
                <div class="asset-actions">
                    <button class="asset-action tooltip" 
                            data-tooltip="複製" 
                            data-action="duplicate" 
                            data-asset-id="${asset.id}">
                        📄
                    </button>
                    <button class="asset-action tooltip" 
                            data-tooltip="刪除" 
                            data-action="delete" 
                            data-asset-id="${asset.id}">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }
    
    /**
     * 獲取資源圖標
     */
    getAssetIcon(asset) {
        const iconMap = {
            // 敵機類型
            'assassin': '💀',
            'heavy': '🤖',
            'hacker': '👨‍💻',
            'swarm': '🦠',
            'stealth': '👤',
            'boss': '👹',
            'disruptor': '⚡',
            'illusion': '👻',
            'exotic': '🌀',
            'virus': '🦠',
            
            // 武器類型
            'kinetic': '🔫',
            'energy': '⚡',
            'plasma': '🔥',
            'exotic': '✨',
            'swarm': '🌀',
            
            // 技能類型
            'passive': '🔰',
            'active': '⚔️',
            'ultimate': '💥',
            
            // 特效類型
            'particle': '✨',
            'explosion': '💥',
            'trail': '💫',
            'ambient': '🌟'
        };
        
        return iconMap[asset.type] || '📦';
    }
    
    /**
     * 獲取類型標籤
     */
    getTypeLabel(type) {
        const labelMap = {
            // 敵機類型
            'assassin': '刺客',
            'heavy': '重裝',
            'hacker': '駭客',
            'swarm': '蟲群',
            'stealth': '隱形',
            'boss': 'BOSS',
            'disruptor': '干擾者',
            'illusion': '幻象',
            'exotic': '異常',
            'virus': '病毒',
            
            // 武器類型
            'kinetic': '動能',
            'energy': '能量',
            'plasma': '等離子',
            'exotic': '特殊',
            'swarm': '群體',
            
            // 技能類型
            'passive': '被動',
            'active': '主動',
            'ultimate': '終極',
            
            // 特效類型
            'particle': '粒子',
            'explosion': '爆炸',
            'trail': '軌跡',
            'ambient': '環境'
        };
        
        return labelMap[type] || type;
    }
    
    /**
     * 獲取模塊顯示名稱
     */
    getModuleDisplayName() {
        const nameMap = {
            'enemies': '敵機',
            'weapons': '武器',
            'skills': '技能',
            'effects': '特效'
        };
        
        return nameMap[this.currentModuleType] || '資源';
    }
    
    /**
     * 過濾資源
     */
    filterAssets() {
        if (!this.searchQuery) {
            return this.assets;
        }
        
        const query = this.searchQuery.toLowerCase();
        return this.assets.filter(asset => 
            asset.name.toLowerCase().includes(query) ||
            asset.id.toLowerCase().includes(query) ||
            asset.type.toLowerCase().includes(query)
        );
    }
    
    /**
     * 排序資源
     */
    sortAssets(assets) {
        return assets.sort((a, b) => {
            let aValue = a[this.sortBy];
            let bValue = b[this.sortBy];
            
            // 處理特殊情況
            if (this.sortBy === 'lastModified') {
                aValue = new Date(aValue || 0);
                bValue = new Date(bValue || 0);
            } else if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = (bValue || '').toLowerCase();
            }
            
            let result = 0;
            if (aValue < bValue) result = -1;
            else if (aValue > bValue) result = 1;
            
            return this.sortOrder === 'desc' ? -result : result;
        });
    }
    
    /**
     * 綁定事件
     */
    bindEvents() {
        // 資源項目點擊
        this.container.querySelectorAll('.asset-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('asset-action')) {
                    return; // 忽略操作按鈕點擊
                }
                
                const assetId = item.dataset.assetId;
                this.selectAsset(assetId);
            });
        });
        
        // 資源操作按鈕
        this.container.querySelectorAll('.asset-action').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const action = button.dataset.action;
                const assetId = button.dataset.assetId;
                
                this.handleAssetAction(action, assetId);
            });
        });
        
        // 搜索
        const searchInput = this.container.querySelector('#asset-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.renderAssetList();
            });
        }
        
        // 清除搜索
        const searchClear = this.container.querySelector('#search-clear');
        if (searchClear) {
            searchClear.addEventListener('click', () => {
                this.searchQuery = '';
                this.renderAssetList();
            });
        }
        
        // 排序
        const sortBy = this.container.querySelector('#sort-by');
        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.sortBy = e.target.value;
                this.renderAssetList();
            });
        }
        
        const sortOrder = this.container.querySelector('#sort-order');
        if (sortOrder) {
            sortOrder.addEventListener('click', () => {
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
                this.renderAssetList();
            });
        }
    }
    
    /**
     * 選擇資源
     */
    selectAsset(assetId) {
        this.selectedAssetId = assetId;
        
        // 更新UI
        this.container.querySelectorAll('.asset-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.assetId === assetId);
        });
        
        // 通知編輯器
        if (window.gameEditor) {
            window.gameEditor.selectAsset(assetId);
        }
        
        console.log(`🎯 已選擇資源: ${assetId}`);
    }
    
    /**
     * 處理資源操作
     */
    async handleAssetAction(action, assetId) {
        switch (action) {
            case 'duplicate':
                await this.duplicateAsset(assetId);
                break;
            case 'delete':
                await this.deleteAsset(assetId);
                break;
        }
    }
    
    /**
     * 複製資源
     */
    async duplicateAsset(assetId) {
        try {
            if (window.gameEditor && window.gameEditor.currentModule) {
                const success = await window.gameEditor.currentModule.duplicateAsset(assetId);
                if (success) {
                    // 刷新列表
                    const assets = await window.gameEditor.currentModule.getAssets();
                    this.updateAssetList(assets, this.currentModuleType);
                    
                    window.gameEditor.showNotification('資源已複製', 'success');
                }
            }
        } catch (error) {
            console.error('複製資源失敗:', error);
            if (window.gameEditor) {
                window.gameEditor.showNotification('複製失敗', 'error');
            }
        }
    }
    
    /**
     * 刪除資源
     */
    async deleteAsset(assetId) {
        const asset = this.assets.find(a => a.id === assetId);
        const assetName = asset ? asset.name : assetId;
        
        // 確認對話框
        const confirmed = confirm(`確定要刪除資源「${assetName}」嗎？此操作無法撤銷。`);
        if (!confirmed) return;
        
        try {
            if (window.gameEditor && window.gameEditor.currentModule) {
                const success = await window.gameEditor.currentModule.deleteAsset(assetId);
                if (success) {
                    // 如果刪除的是當前選中的資源，清空選擇
                    if (this.selectedAssetId === assetId) {
                        this.selectedAssetId = null;
                        
                        // 清空屬性面板
                        if (window.gameEditor.propertyPanel) {
                            window.gameEditor.propertyPanel.clear();
                        }
                    }
                    
                    // 刷新列表
                    const assets = await window.gameEditor.currentModule.getAssets();
                    this.updateAssetList(assets, this.currentModuleType);
                    
                    window.gameEditor.showNotification('資源已刪除', 'success');
                }
            }
        } catch (error) {
            console.error('刪除資源失敗:', error);
            if (window.gameEditor) {
                window.gameEditor.showNotification('刪除失敗', 'error');
            }
        }
    }
    
    /**
     * 添加新資源到列表
     */
    addAsset(asset) {
        this.assets.push(asset);
        this.renderAssetList();
        
        // 自動選擇新創建的資源
        this.selectAsset(asset.id);
    }
    
    /**
     * 從列表中移除資源
     */
    removeAsset(assetId) {
        const index = this.assets.findIndex(a => a.id === assetId);
        if (index > -1) {
            this.assets.splice(index, 1);
            this.renderAssetList();
        }
    }
    
    /**
     * 清空選擇
     */
    clearSelection() {
        this.selectedAssetId = null;
        this.container.querySelectorAll('.asset-item').forEach(item => {
            item.classList.remove('selected');
        });
    }
}

// 添加CSS樣式
const style = document.createElement('style');
style.textContent = `
    .empty-state {
        text-align: center;
        padding: var(--spacing-xl);
        color: var(--text-muted);
    }
    
    .empty-icon {
        font-size: 48px;
        margin-bottom: var(--spacing-md);
    }
    
    .empty-state h4 {
        color: var(--text-secondary);
        margin-bottom: var(--spacing-sm);
    }
    
    .create-first-button {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-xs);
        margin-top: var(--spacing-md);
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--primary-cyan);
        border: none;
        border-radius: var(--radius-sm);
        color: var(--bg-dark);
        font-family: inherit;
        font-size: 12px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .create-first-button:hover {
        box-shadow: 0 0 10px var(--shadow-glow);
        transform: translateY(-1px);
    }
    
    .search-box {
        position: relative;
        margin-bottom: var(--spacing-sm);
    }
    
    .search-input {
        width: 100%;
        padding: var(--spacing-xs) var(--spacing-sm);
        padding-right: 30px;
        background: var(--bg-darker);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        font-family: inherit;
        font-size: 11px;
    }
    
    .search-input:focus {
        outline: none;
        border-color: var(--primary-cyan);
        box-shadow: 0 0 3px var(--shadow-glow);
    }
    
    .search-clear {
        position: absolute;
        right: 5px;
        top: 50%;
        transform: translateY(-50%);
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 10px;
        cursor: pointer;
        padding: 2px;
    }
    
    .search-clear:hover {
        color: var(--text-primary);
    }
    
    .sort-controls {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        margin-bottom: var(--spacing-sm);
        padding: var(--spacing-xs);
        background: var(--bg-darker);
        border-radius: var(--radius-sm);
        font-size: 10px;
    }
    
    .sort-label {
        color: var(--text-muted);
    }
    
    .sort-select {
        flex: 1;
        padding: 2px 4px;
        background: transparent;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        font-family: inherit;
        font-size: 10px;
    }
    
    .sort-order-toggle {
        width: 20px;
        height: 20px;
        background: transparent;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        color: var(--text-secondary);
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .sort-order-toggle:hover {
        border-color: var(--primary-cyan);
        color: var(--primary-cyan);
    }
`;
document.head.appendChild(style);

// 全局訪問
window.AssetBrowser = AssetBrowser;