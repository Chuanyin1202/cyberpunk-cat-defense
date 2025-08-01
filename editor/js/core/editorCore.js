/**
 * 遊戲內容編輯器核心類
 * 管理整個編輯器的狀態、模塊切換和全局操作
 */
class GameContentEditor {
    constructor() {
        this.currentModule = null;
        this.currentAsset = null;
        this.isModified = false;
        this.modules = new Map();
        
        // 核心組件
        this.dataManager = null;
        this.previewRenderer = null;
        this.propertyPanel = null;
        this.assetBrowser = null;
        
        // UI元素引用
        this.elements = {};
        
        // 當前編輯模式
        this.currentMode = 'enemies';
        
        console.log('🎮 遊戲內容編輯器初始化中...');
    }
    
    /**
     * 初始化編輯器
     */
    async initialize() {
        try {
            console.log('🔧 開始初始化編輯器組件...');
            
            // 初始化UI元素引用
            this.initializeElements();
            
            // 初始化核心組件
            await this.initializeComponents();
            
            // 註冊編輯模塊
            await this.registerModules();
            
            // 綁定事件處理器
            this.bindEventHandlers();
            
            // 設置初始狀態
            this.setInitialState();
            
            console.log('✅ 編輯器初始化完成');
            this.updateStatus('就緒', 'success');
            
        } catch (error) {
            console.error('❌ 編輯器初始化失敗:', error);
            this.updateStatus('初始化失敗', 'error');
        }
    }
    
    /**
     * 初始化UI元素引用
     */
    initializeElements() {
        this.elements = {
            // 頂部導航
            moduleTabButtons: document.querySelectorAll('.tab-button'),
            reloadButton: document.getElementById('reload-config'),
            saveButton: document.getElementById('save-config'),
            testButton: document.getElementById('test-game'),
            
            // 工作區
            workspaceTitle: document.getElementById('workspace-title'),
            workspaceStatus: document.getElementById('workspace-status'),
            workspaceOverlay: document.getElementById('workspace-overlay'),
            previewCanvas: document.getElementById('preview-canvas'),
            previewToggle: document.getElementById('preview-toggle'),
            gridToggle: document.getElementById('grid-toggle'),
            
            // 資源瀏覽器
            assetList: document.getElementById('asset-list'),
            createButton: document.getElementById('create-new'),
            importButton: document.getElementById('import-config'),
            exportButton: document.getElementById('export-config'),
            
            // 屬性面板
            propertyTitle: document.getElementById('property-title'),
            propertyContent: document.getElementById('property-content'),
            applyButton: document.getElementById('apply-changes'),
            resetButton: document.getElementById('reset-changes'),
            
            // 狀態欄
            currentModeSpan: document.getElementById('current-mode'),
            selectedItemSpan: document.getElementById('selected-item'),
            modificationStatusSpan: document.getElementById('modification-status'),
            
            // 模態對話框
            modalBackdrop: document.getElementById('modal-backdrop'),
            modalDialog: document.getElementById('modal-dialog'),
            modalTitle: document.getElementById('modal-title'),
            modalContent: document.getElementById('modal-content'),
            modalClose: document.getElementById('modal-close'),
            modalCancel: document.getElementById('modal-cancel'),
            modalConfirm: document.getElementById('modal-confirm')
        };
        
        console.log('📋 UI元素引用已建立');
    }
    
    /**
     * 初始化核心組件
     */
    async initializeComponents() {
        // 初始化數據管理器
        this.dataManager = new DataManager();
        await this.dataManager.initialize();
        
        // 設置全局訪問
        window.dataManager = this.dataManager;
        
        // 初始化預覽渲染器
        this.previewRenderer = new PreviewRenderer(this.elements.previewCanvas);
        
        // 初始化屬性面板
        this.propertyPanel = new PropertyPanel(this.elements.propertyContent);
        
        // 初始化資源瀏覽器
        this.assetBrowser = new AssetBrowser(this.elements.assetList);
        
        console.log('🧩 核心組件初始化完成');
    }
    
    /**
     * 註冊編輯模塊
     */
    async registerModules() {
        // 註冊敵機編輯模塊
        const enemyEditor = new EnemyEditor();
        await enemyEditor.initialize();
        this.modules.set('enemies', enemyEditor);
        
        // 後續會添加其他模塊
        // this.modules.set('weapons', new WeaponEditor());
        // this.modules.set('skills', new SkillEditor());
        // this.modules.set('effects', new EffectEditor());
        
        console.log('📦 編輯模塊註冊完成:', Array.from(this.modules.keys()));
    }
    
    /**
     * 綁定事件處理器
     */
    bindEventHandlers() {
        // 模塊切換標籤
        this.elements.moduleTabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const moduleType = e.currentTarget.dataset.module;
                this.switchModule(moduleType);
            });
        });
        
        // 頂部工具按鈕
        this.elements.reloadButton.addEventListener('click', () => this.reloadConfiguration());
        this.elements.saveButton.addEventListener('click', () => this.saveConfiguration());
        this.elements.testButton.addEventListener('click', () => this.testInGame());
        
        // 工作區工具
        this.elements.previewToggle.addEventListener('click', () => this.togglePreview());
        this.elements.gridToggle.addEventListener('click', () => this.toggleGrid());
        
        // 資源瀏覽器按鈕
        this.elements.createButton.addEventListener('click', () => this.createNewAsset());
        this.elements.importButton.addEventListener('click', () => this.importConfiguration());
        this.elements.exportButton.addEventListener('click', () => this.exportConfiguration());
        
        // 屬性面板按鈕
        this.elements.applyButton.addEventListener('click', () => this.applyChanges());
        this.elements.resetButton.addEventListener('click', () => this.resetChanges());
        
        // 模態對話框
        this.elements.modalClose.addEventListener('click', () => this.closeModal());
        this.elements.modalCancel.addEventListener('click', () => this.closeModal());
        this.elements.modalBackdrop.addEventListener('click', (e) => {
            if (e.target === this.elements.modalBackdrop) {
                this.closeModal();
            }
        });
        
        // 鍵盤快捷鍵
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // 窗口關閉前確認
        window.addEventListener('beforeunload', (e) => {
            if (this.isModified) {
                e.preventDefault();
                e.returnValue = '您有未保存的更改，確定要離開嗎？';
            }
        });
        
        console.log('🎯 事件處理器綁定完成');
    }
    
    /**
     * 設置初始狀態
     */
    setInitialState() {
        // 激活默認模塊
        this.switchModule(this.currentMode);
        
        // 隱藏工作區覆蓋層
        setTimeout(() => {
            this.elements.workspaceOverlay.classList.add('hidden');
        }, 1000);
    }
    
    /**
     * 切換編輯模塊
     */
    async switchModule(moduleType) {
        if (this.currentMode === moduleType) return;
        
        try {
            console.log(`🔄 切換到模塊: ${moduleType}`);
            
            // 檢查未保存更改
            if (this.isModified && !await this.confirmDiscardChanges()) {
                return;
            }
            
            // 更新UI狀態
            this.updateTabSelection(moduleType);
            this.currentMode = moduleType;
            
            // 切換模塊
            const module = this.modules.get(moduleType);
            if (module) {
                this.currentModule = module;
                
                // 更新工作區標題
                const moduleNames = {
                    'enemies': '敵機設計',
                    'weapons': '武器效果',
                    'skills': '技能開發',
                    'effects': '特效渲染'
                };
                this.updateWorkspaceTitle(moduleNames[moduleType] || moduleType);
                
                // 更新資源列表
                await this.refreshAssetList();
                
                // 清空屬性面板
                this.propertyPanel.clear();
                
                console.log(`✅ 模塊 ${moduleType} 已激活`);
            } else {
                console.warn(`⚠️ 模塊 ${moduleType} 尚未實現`);
                this.updateStatus(`模塊 ${moduleType} 開發中`, 'warning');
            }
            
        } catch (error) {
            console.error(`❌ 切換模塊失敗:`, error);
            this.updateStatus('模塊切換失敗', 'error');
        }
    }
    
    /**
     * 更新標籤選擇狀態
     */
    updateTabSelection(activeModule) {
        this.elements.moduleTabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.module === activeModule);
        });
    }
    
    /**
     * 更新工作區標題
     */
    updateWorkspaceTitle(title) {
        this.elements.workspaceTitle.textContent = title;
        this.elements.currentModeSpan.textContent = title;
    }
    
    /**
     * 刷新資源列表
     */
    async refreshAssetList() {
        if (this.currentModule && this.assetBrowser) {
            const assets = await this.currentModule.getAssets();
            this.assetBrowser.updateAssetList(assets, this.currentMode);
        }
    }
    
    /**
     * 更新狀態顯示
     */
    updateStatus(message, type = 'normal') {
        this.elements.workspaceStatus.textContent = message;
        this.elements.workspaceStatus.className = `workspace-status status-${type}`;
    }
    
    /**
     * 選擇資源
     */
    async selectAsset(assetId) {
        try {
            if (this.currentModule) {
                const asset = this.currentModule.getEnemyById ? 
                    this.currentModule.getEnemyById(assetId) : 
                    await this.currentModule.getAssetById(assetId);
                    
                if (asset) {
                    this.currentAsset = asset;
                    this.elements.selectedItemSpan.textContent = asset.name || assetId;
                    
                    // 更新屬性面板
                    this.propertyPanel.loadAsset(asset, this.currentModule);
                    
                    // 更新預覽
                    this.previewRenderer.renderAsset(asset, this.currentMode);
                    
                    // 隱藏歡迎覆蓋層
                    this.elements.workspaceOverlay.classList.add('hidden');
                }
            }
        } catch (error) {
            console.error('❌ 選擇資源失敗:', error);
        }
    }
    
    /**
     * 保存配置
     */
    async saveConfiguration() {
        try {
            if (!this.currentModule) return;
            
            this.updateStatus('保存中...', 'normal');
            
            const success = await this.currentModule.saveEnemies ? 
                await this.currentModule.saveEnemies() :
                await this.currentModule.save();
            
            if (success) {
                this.isModified = false;
                this.updateModificationStatus();
                this.updateStatus('保存成功', 'success');
                
                // 顯示成功提示
                this.showNotification('配置已保存', 'success');
            } else {
                this.updateStatus('保存失敗', 'error');
            }
            
        } catch (error) {
            console.error('❌ 保存配置失敗:', error);
            this.updateStatus('保存失敗', 'error');
        }
    }
    
    /**
     * 在遊戲中測試
     */
    testInGame() {
        // 在新標籤頁打開遊戲
        window.open('../index.html', '_blank');
    }
    
    /**
     * 重新載入配置
     */
    async reloadConfiguration() {
        try {
            this.updateStatus('重新載入配置中...', 'normal');
            
            // 確認是否要重新載入
            const confirmed = confirm('確定要從文件重新載入配置嗎？這將覆蓋所有未保存的更改。');
            if (!confirmed) return;
            
            // 清除本地快取並重新載入
            if (this.currentModule && this.currentModule.loadEnemies) {
                // 清除 localStorage
                const key = `editor_config_${this.currentMode}`;
                localStorage.removeItem(key);
                
                // 重新載入配置
                await this.currentModule.loadEnemies();
                
                // 刷新資源列表
                await this.refreshAssetList();
                
                // 清空屬性面板
                this.propertyPanel.clear();
                
                this.isModified = false;
                this.updateModificationStatus();
                this.updateStatus('配置已重新載入', 'success');
                this.showNotification('配置已從文件重新載入', 'success');
            }
            
        } catch (error) {
            console.error('❌ 重新載入配置失敗:', error);
            this.updateStatus('重新載入失敗', 'error');
            this.showNotification('重新載入失敗: ' + error.message, 'error');
        }
    }
    
    /**
     * 更新修改狀態
     */
    updateModificationStatus() {
        const status = this.isModified ? '已修改' : '未修改';
        this.elements.modificationStatusSpan.textContent = status;
        this.elements.modificationStatusSpan.className = this.isModified ? 'status-warning' : '';
    }
    
    /**
     * 顯示通知
     */
    showNotification(message, type = 'info', duration = 3000) {
        // 創建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 添加樣式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: var(--bg-panel);
            border: 1px solid var(--border-bright);
            border-radius: var(--radius-sm);
            color: var(--text-primary);
            font-family: inherit;
            font-size: 12px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // 自動移除
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    /**
     * 處理鍵盤快捷鍵
     */
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.saveConfiguration();
                    break;
                case 'n':
                    e.preventDefault();
                    this.createNewAsset();
                    break;
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        // Ctrl+Shift+Z: 重做
                        // 待實現
                    } else {
                        // Ctrl+Z: 撤銷
                        // 待實現
                    }
                    break;
            }
        }
    }
    
    /**
     * 顯示模態對話框
     */
    showModal(title, content, onConfirm = null) {
        this.elements.modalTitle.textContent = title;
        this.elements.modalContent.innerHTML = content;
        this.elements.modalBackdrop.style.display = 'flex';
        
        // 綁定確認事件
        const confirmHandler = () => {
            if (onConfirm) onConfirm();
            this.closeModal();
        };
        
        this.elements.modalConfirm.removeEventListener('click', this._modalConfirmHandler);
        this._modalConfirmHandler = confirmHandler;
        this.elements.modalConfirm.addEventListener('click', confirmHandler);
    }
    
    /**
     * 關閉模態對話框
     */
    closeModal() {
        this.elements.modalBackdrop.style.display = 'none';
    }
    
    /**
     * 確認丟棄更改
     */
    async confirmDiscardChanges() {
        return new Promise((resolve) => {
            this.showModal(
                '未保存的更改',
                '<p>您有未保存的更改，是否要丟棄這些更改？</p>',
                () => resolve(true)
            );
            
            // 取消按鈕
            const cancelHandler = () => {
                resolve(false);
                this.closeModal();
            };
            
            this.elements.modalCancel.removeEventListener('click', this._modalCancelHandler);
            this._modalCancelHandler = cancelHandler;
            this.elements.modalCancel.addEventListener('click', cancelHandler);
        });
    }
    
    // 實現的方法
    togglePreview() { 
        this.previewRenderer.togglePreview();
        console.log('切換預覽'); 
    }
    
    toggleGrid() { 
        this.previewRenderer.toggleGrid();
        console.log('切換網格'); 
    }
    
    async createNewAsset() { 
        if (this.currentModule && this.currentModule.createEnemy) {
            try {
                const newAsset = await this.currentModule.createEnemy();
                
                // 刷新資源列表
                await this.refreshAssetList();
                
                // 自動選擇新創建的資源
                this.assetBrowser.selectAsset(newAsset.id);
                
                // 標記為已修改
                this.isModified = true;
                this.updateModificationStatus();
                
                this.showNotification('新資源已創建', 'success');
            } catch (error) {
                console.error('創建資源失敗:', error);
                this.showNotification('創建失敗', 'error');
            }
        } else {
            console.log('當前模塊不支持創建新資源');
        }
    }
    
    importConfiguration() { console.log('導入配置'); }
    exportConfiguration() { console.log('導出配置'); }
    applyChanges() { console.log('應用更改'); }
    resetChanges() { console.log('重置更改'); }
}

// 全局訪問
window.GameContentEditor = GameContentEditor;