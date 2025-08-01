/**
 * 屬性面板
 * 負責顯示和編輯選中資源的屬性
 */
class PropertyPanel {
    constructor(containerElement) {
        this.container = containerElement;
        this.currentAsset = null;
        this.currentModule = null;
        this.formElements = new Map();
        this.changeListeners = [];
        
        console.log('🔧 屬性面板已創建');
    }
    
    /**
     * 載入資源到屬性面板
     */
    loadAsset(asset, module) {
        this.currentAsset = asset;
        this.currentModule = module;
        
        this.renderPropertyEditor();
        console.log(`📝 已載入資源: ${asset.name || asset.id}`);
    }
    
    /**
     * 清空屬性面板
     */
    clear() {
        this.container.innerHTML = `
            <div class="property-placeholder">
                <p>選擇資源以顯示屬性</p>
            </div>
        `;
        this.currentAsset = null;
        this.currentModule = null;
        this.formElements.clear();
    }
    
    /**
     * 渲染屬性編輯器
     */
    renderPropertyEditor() {
        if (!this.currentAsset) {
            this.clear();
            return;
        }
        
        const sections = this.getPropertySections();
        let html = '';
        
        sections.forEach(section => {
            html += this.renderSection(section);
        });
        
        this.container.innerHTML = html;
        this.bindFormEvents();
    }
    
    /**
     * 獲取屬性區塊定義
     */
    getPropertySections() {
        const moduleType = this.currentModule?.moduleType || 'unknown';
        
        switch (moduleType) {
            case 'enemies':
                return this.getEnemySections();
            case 'weapons':
                return this.getWeaponSections();
            default:
                return this.getGenericSections();
        }
    }
    
    /**
     * 敵機屬性區塊
     */
    getEnemySections() {
        return [
            {
                id: 'basic',
                title: '基本信息',
                expanded: true,
                fields: [
                    { key: 'id', label: 'ID', type: 'text', readonly: true },
                    { key: 'name', label: '名稱', type: 'text', required: true },
                    { key: 'type', label: '類型', type: 'select', options: [
                        { value: 'normal', label: '普通' },
                        { value: 'fast', label: '快速' },
                        { value: 'tank', label: '坦克' },
                        { value: 'stealth', label: '隱形' },
                        { value: 'bomber', label: '轟炸' },
                        { value: 'swarm', label: '蟲群' }
                    ]}
                ]
            },
            {
                id: 'stats',
                title: '數值屬性',
                expanded: true,
                fields: [
                    { key: 'stats.health', label: '生命值', type: 'number', min: 1, max: 10000 },
                    { key: 'stats.speed', label: '移動速度', type: 'range', min: 0.1, max: 10.0, step: 0.1 },
                    { key: 'stats.damage', label: '攻擊力', type: 'number', min: 1, max: 1000 },
                    { key: 'stats.reward', label: '擊殺獎勵', type: 'number', min: 1, max: 1000 }
                ]
            },
            {
                id: 'visual',
                title: '視覺效果',
                expanded: true,
                fields: [
                    { key: 'visual.size', label: '大小', type: 'range', min: 5, max: 50, step: 1 },
                    { key: 'visual.color', label: '顏色', type: 'color' },
                    { key: 'visual.shape', label: '形狀', type: 'select', options: [
                        { value: 'cyber_cat', label: '賽博貓' },
                        { value: 'chonky_mech_cat', label: '機甲肥貓' },
                        { value: 'pixel_kitten', label: '像素小貓' },
                        { value: 'quantum_cat', label: '量子貓' },
                        { value: 'yarn_ball', label: '毛線球' },
                        { value: 'sphinx_cat', label: '獅身貓' },
                        { value: 'red_dot', label: '紅點' },
                        { value: 'crazed_cat', label: '瘋狂貓' },
                        { value: 'angel_cat', label: '天使貓' },
                        { value: 'mining_cat', label: '挖礦貓' }
                    ]},
                    { key: 'visual.glowColor', label: '發光顏色', type: 'color' },
                    { key: 'visual.opacity', label: '透明度', type: 'range', min: 0.1, max: 1.0, step: 0.1 }
                ]
            },
            {
                id: 'behavior',
                title: '行為設定',
                expanded: false,
                fields: [
                    { key: 'behavior.movementType', label: '移動類型', type: 'select', options: [
                        { value: 'feline_stalk', label: '貓式潛行' },
                        { value: 'heavy_plod', label: '笨重前進' },
                        { value: 'glitch_teleport', label: '故障傳送' },
                        { value: 'quantum_tunnel', label: '量子隧道' },
                        { value: 'chaotic_roll', label: '混亂滾動' },
                        { value: 'majestic_stride', label: '威嚴步伐' },
                        { value: 'erratic_dot', label: '紅點亂動' },
                        { value: 'chaotic_sprint', label: '瘋狂衝刺' },
                        { value: 'graceful_float', label: '優雅飄浮' },
                        { value: 'steady_mining', label: '穩定挖礦' }
                    ]},
                    { key: 'behavior.ai', label: 'AI類型', type: 'select', options: [
                        { value: 'basic', label: '基礎' },
                        { value: 'aggressive', label: '積極' },
                        { value: 'evasive', label: '迴避' },
                        { value: 'sneaky', label: '隱匿' },
                        { value: 'bomber', label: '轟炸' },
                        { value: 'hive_mind', label: '蜂群意識' }
                    ]}
                ]
            }
        ];
    }
    
    /**
     * 武器屬性區塊
     */
    getWeaponSections() {
        return [
            {
                id: 'basic',
                title: '基本信息',
                expanded: true,
                fields: [
                    { key: 'id', label: 'ID', type: 'text', readonly: true },
                    { key: 'name', label: '名稱', type: 'text', required: true },
                    { key: 'category', label: '類別', type: 'select', options: [
                        { value: 'kinetic', label: '動能武器' },
                        { value: 'energy', label: '能量武器' },
                        { value: 'plasma', label: '等離子武器' },
                        { value: 'exotic', label: '特殊武器' },
                        { value: 'swarm', label: '群體武器' }
                    ]},
                    { key: 'description', label: '描述', type: 'textarea' }
                ]
            },
            {
                id: 'stats',
                title: '武器數值',
                expanded: true,
                fields: [
                    { key: 'stats.damage', label: '傷害', type: 'number', min: 1, max: 10000 },
                    { key: 'stats.fireRate', label: '射速(ms)', type: 'number', min: 100, max: 5000 },
                    { key: 'stats.range', label: '射程', type: 'number', min: 50, max: 1000 },
                    { key: 'stats.speed', label: '彈速', type: 'number', min: 100, max: 2000 },
                    { key: 'stats.accuracy', label: '精確度', type: 'range', min: 0.1, max: 1.0, step: 0.01 }
                ]
            },
            {
                id: 'effects',
                title: '特殊效果',
                expanded: true,
                fields: [
                    { key: 'effects.piercing', label: '穿透', type: 'checkbox' },
                    { key: 'effects.explosive', label: '爆炸', type: 'checkbox' },
                    { key: 'effects.homing', label: '追蹤', type: 'checkbox' },
                    { key: 'effects.elementalType', label: '元素類型', type: 'select', options: [
                        { value: 'physical', label: '物理' },
                        { value: 'energy', label: '能量' },
                        { value: 'plasma', label: '等離子' },
                        { value: 'quantum', label: '量子' },
                        { value: 'tech', label: '科技' }
                    ]}
                ]
            },
            {
                id: 'visual',
                title: '視覺效果',
                expanded: false,
                fields: [
                    { key: 'visual.bulletColor', label: '子彈顏色', type: 'color' },
                    { key: 'visual.bulletSize', label: '子彈大小', type: 'range', min: 1, max: 20, step: 1 },
                    { key: 'visual.trailEffect', label: '軌跡效果', type: 'checkbox' },
                    { key: 'visual.muzzleFlash', label: '槍口閃光', type: 'checkbox' }
                ]
            }
        ];
    }
    
    /**
     * 通用屬性區塊
     */
    getGenericSections() {
        return [
            {
                id: 'basic',
                title: '基本信息',
                expanded: true,
                fields: [
                    { key: 'id', label: 'ID', type: 'text', readonly: true },
                    { key: 'name', label: '名稱', type: 'text', required: true }
                ]
            }
        ];
    }
    
    /**
     * 渲染區塊
     */
    renderSection(section) {
        const isExpanded = section.expanded;
        
        let fieldsHtml = '';
        section.fields.forEach(field => {
            fieldsHtml += this.renderField(field);
        });
        
        return `
            <div class="property-section">
                <div class="section-header">
                    <h4 class="section-title">${section.title}</h4>
                    <button class="section-toggle" data-section="${section.id}">
                        ${isExpanded ? '▼' : '▶'}
                    </button>
                </div>
                <div class="section-content ${isExpanded ? '' : 'collapsed'}" data-section-content="${section.id}">
                    ${fieldsHtml}
                </div>
            </div>
        `;
    }
    
    /**
     * 渲染表單字段
     */
    renderField(field) {
        const value = this.getFieldValue(field.key);
        const fieldId = `field-${field.key.replace(/\./g, '-')}`;
        
        let inputHtml = '';
        
        switch (field.type) {
            case 'text':
                inputHtml = `
                    <input type="text" 
                           class="form-input" 
                           id="${fieldId}" 
                           data-key="${field.key}"
                           value="${value || ''}"
                           ${field.readonly ? 'readonly' : ''}
                           ${field.required ? 'required' : ''}>
                `;
                break;
                
            case 'textarea':
                inputHtml = `
                    <textarea class="form-textarea" 
                              id="${fieldId}" 
                              data-key="${field.key}"
                              rows="3">${value || ''}</textarea>
                `;
                break;
                
            case 'number':
                inputHtml = `
                    <input type="number" 
                           class="form-input" 
                           id="${fieldId}" 
                           data-key="${field.key}"
                           value="${value || 0}"
                           min="${field.min || ''}"
                           max="${field.max || ''}">
                `;
                break;
                
            case 'range':
                inputHtml = `
                    <div class="range-group">
                        <input type="range" 
                               class="range-input" 
                               id="${fieldId}" 
                               data-key="${field.key}"
                               value="${value || field.min || 0}"
                               min="${field.min || 0}"
                               max="${field.max || 100}"
                               step="${field.step || 1}">
                        <input type="number" 
                               class="range-value" 
                               data-key="${field.key}"
                               value="${value || field.min || 0}"
                               min="${field.min || 0}"
                               max="${field.max || 100}"
                               step="${field.step || 1}">
                    </div>
                `;
                break;
                
            case 'select':
                let optionsHtml = '';
                if (field.options) {
                    field.options.forEach(option => {
                        const selected = value === option.value ? 'selected' : '';
                        optionsHtml += `<option value="${option.value}" ${selected}>${option.label}</option>`;
                    });
                }
                inputHtml = `
                    <select class="form-select" id="${fieldId}" data-key="${field.key}">
                        ${optionsHtml}
                    </select>
                `;
                break;
                
            case 'checkbox':
                inputHtml = `
                    <div class="checkbox-group">
                        <input type="checkbox" 
                               class="form-checkbox" 
                               id="${fieldId}" 
                               data-key="${field.key}"
                               ${value ? 'checked' : ''}>
                        <label for="${fieldId}">啟用</label>
                    </div>
                `;
                break;
                
            case 'color':
                inputHtml = `
                    <div class="color-group">
                        <input type="color" 
                               class="form-color" 
                               id="${fieldId}" 
                               data-key="${field.key}"
                               value="${value || '#ffffff'}">
                        <input type="text" 
                               class="color-preview" 
                               data-key="${field.key}"
                               value="${value || '#ffffff'}">
                    </div>
                `;
                break;
        }
        
        return `
            <div class="form-group">
                <label class="form-label" for="${fieldId}">${field.label}</label>
                ${inputHtml}
            </div>
        `;
    }
    
    /**
     * 獲取字段值
     */
    getFieldValue(key) {
        if (!this.currentAsset) return null;
        
        const keys = key.split('.');
        let value = this.currentAsset;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }
        
        return value;
    }
    
    /**
     * 設置字段值
     */
    setFieldValue(key, value) {
        if (!this.currentAsset) return;
        
        const keys = key.split('.');
        let target = this.currentAsset;
        
        // 導航到父對象
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!target[k] || typeof target[k] !== 'object') {
                target[k] = {};
            }
            target = target[k];
        }
        
        // 設置值
        const finalKey = keys[keys.length - 1];
        target[finalKey] = value;
        
        // 通知更改
        this.notifyChange(key, value);
    }
    
    /**
     * 綁定表單事件
     */
    bindFormEvents() {
        // 區塊折疊/展開
        this.container.querySelectorAll('.section-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                const sectionId = e.target.dataset.section;
                const content = this.container.querySelector(`[data-section-content="${sectionId}"]`);
                const isCollapsed = content.classList.contains('collapsed');
                
                content.classList.toggle('collapsed');
                e.target.textContent = isCollapsed ? '▼' : '▶';
            });
        });
        
        // 表單輸入事件
        this.container.querySelectorAll('input, select, textarea').forEach(element => {
            const key = element.dataset.key;
            if (!key) return;
            
            // 根據元素類型綁定不同事件
            if (element.type === 'range') {
                element.addEventListener('input', (e) => {
                    this.handleRangeInput(e);
                });
            } else if (element.type === 'color') {
                element.addEventListener('change', (e) => {
                    this.handleColorInput(e);
                });
            } else if (element.type === 'checkbox') {
                element.addEventListener('change', (e) => {
                    this.setFieldValue(key, e.target.checked);
                });
            } else {
                element.addEventListener('input', (e) => {
                    let value = e.target.value;
                    
                    // 類型轉換
                    if (element.type === 'number') {
                        value = parseFloat(value) || 0;
                    }
                    
                    this.setFieldValue(key, value);
                });
            }
        });
    }
    
    /**
     * 處理範圍輸入
     */
    handleRangeInput(e) {
        const key = e.target.dataset.key;
        const value = parseFloat(e.target.value);
        
        // 同步數字輸入框
        const numberInput = this.container.querySelector(`input[type="number"][data-key="${key}"]`);
        if (numberInput) {
            numberInput.value = value;
        }
        
        this.setFieldValue(key, value);
    }
    
    /**
     * 處理顏色輸入
     */
    handleColorInput(e) {
        const key = e.target.dataset.key;
        const value = e.target.value;
        
        // 同步文字輸入框
        const textInput = this.container.querySelector(`input[type="text"][data-key="${key}"]`);
        if (textInput) {
            textInput.value = value;
        }
        
        this.setFieldValue(key, value);
    }
    
    /**
     * 通知更改
     */
    notifyChange(key, value) {
        // 標記為已修改
        if (window.gameEditor) {
            window.gameEditor.isModified = true;
            window.gameEditor.updateModificationStatus();
        }
        
        // 實時預覽更新
        if (window.gameEditor && window.gameEditor.previewRenderer) {
            window.gameEditor.previewRenderer.renderAsset(
                this.currentAsset, 
                window.gameEditor.currentMode
            );
        }
        
        // 調用監聽器
        this.changeListeners.forEach(listener => {
            try {
                listener(key, value, this.currentAsset);
            } catch (error) {
                console.error('屬性更改監聽器錯誤:', error);
            }
        });
    }
    
    /**
     * 添加更改監聽器
     */
    addChangeListener(listener) {
        this.changeListeners.push(listener);
    }
    
    /**
     * 移除更改監聽器
     */
    removeChangeListener(listener) {
        const index = this.changeListeners.indexOf(listener);
        if (index > -1) {
            this.changeListeners.splice(index, 1);
        }
    }
    
    /**
     * 驗證當前表單
     */
    validate() {
        const errors = [];
        
        // 檢查必填字段
        this.container.querySelectorAll('input[required]').forEach(input => {
            if (!input.value.trim()) {
                const label = this.container.querySelector(`label[for="${input.id}"]`);
                errors.push(`${label?.textContent || '未知字段'} 是必填的`);
            }
        });
        
        return errors;
    }
    
    /**
     * 獲取表單數據
     */
    getFormData() {
        return JSON.parse(JSON.stringify(this.currentAsset));
    }
}

// 全局訪問
window.PropertyPanel = PropertyPanel;