/**
 * UI Manager - Handles all UI interactions and updates
 */

class UIManager {
    constructor(editor) {
        this.editor = editor;
        this.state = editor.state;
        
        // DOM elements cache
        this.elements = {};
        
        // Initialize
        this.cacheElements();
        this.bindEvents();
        this.setupAdjustments();
        this.renderLayers();
    }
    
    /**
     * Cache frequently accessed DOM elements
     */
    cacheElements() {
        this.elements = {
            canvasContainer: document.getElementById('canvasContainer'),
            canvasOverlay: document.getElementById('canvasOverlay'),
            transformControls: document.getElementById('transformControls'),
            zoomDisplay: document.getElementById('zoomDisplay'),
            layersContent: document.getElementById('layersContent'),
            propertiesContent: document.getElementById('propertiesContent'),
            fileMenu: document.getElementById('fileMenu'),
            newProjectDialog: document.getElementById('newProjectDialog'),
            exportDialog: document.getElementById('exportDialog'),
            fileInput: document.getElementById('fileInput'),
            projectInput: document.getElementById('projectInput'),
            
            // Adjustment sliders
            brightness: document.getElementById('brightness'),
            contrast: document.getElementById('contrast'),
            saturation: document.getElementById('saturation'),
            hue: document.getElementById('hue'),
            blur: document.getElementById('blur'),
            
            // Adjustment value displays
            brightnessValue: document.getElementById('brightnessValue'),
            contrastValue: document.getElementById('contrastValue'),
            saturationValue: document.getElementById('saturationValue'),
            hueValue: document.getElementById('hueValue'),
            blurValue: document.getElementById('blurValue'),
        };
    }
    
    /**
     * Bind global event listeners
     */
    bindEvents() {
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                if (tool) this.setTool(tool);
            });
        });
        
        // Top bar actions
        document.querySelectorAll('[data-action]').forEach(el => {
            el.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                if (action) this.handleAction(action);
            });
        });
        
        // Menu items
        document.querySelector('[data-action="file"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFileMenu();
        });
        
        // Close menus on outside click
        document.addEventListener('click', (e) => {
            if (this.elements.fileMenu && !this.elements.fileMenu.contains(e.target)) {
                this.elements.fileMenu.classList.remove('show');
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // File inputs
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.elements.projectInput.addEventListener('change', (e) => this.handleProjectLoad(e));
        
        // Drag and drop
        this.elements.canvasContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.canvasContainer.style.borderColor = '#6366f1';
        });
        
        this.elements.canvasContainer.addEventListener('dragleave', () => {
            this.elements.canvasContainer.style.borderColor = '';
        });
        
        this.elements.canvasContainer.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Dialog preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const width = btn.dataset.width;
                const height = btn.dataset.height;
                document.getElementById('canvasWidth').value = width;
                document.getElementById('canvasHeight').value = height;
            });
        });
        
        // Export quality slider
        const qualitySlider = document.getElementById('exportQuality');
        const qualityValue = document.getElementById('qualityValue');
        if (qualitySlider && qualityValue) {
            qualitySlider.addEventListener('input', () => {
                qualityValue.textContent = `${qualitySlider.value}%`;
            });
        }
        
        // Export format change
        const formatSelect = document.getElementById('exportFormat');
        const qualityGroup = document.getElementById('qualityGroup');
        if (formatSelect && qualityGroup) {
            formatSelect.addEventListener('change', () => {
                qualityGroup.style.display = 
                    formatSelect.value === 'jpeg' || formatSelect.value === 'webp' ? 'block' : 'none';
            });
        }
        
        // State subscriptions
        this.state.subscribe('zoomChanged', (zoom) => this.updateZoomDisplay(zoom));
        this.state.subscribe('layersChanged', () => this.renderLayers());
        this.state.subscribe('selectionChanged', () => this.renderLayers());
        this.state.subscribe('adjustmentsChanged', (adj) => this.updateAdjustmentDisplays(adj));
    }
    
    /**
     * Setup adjustment sliders
     */
    setupAdjustments() {
        const adjustments = ['brightness', 'contrast', 'saturation', 'hue', 'blur'];
        
        adjustments.forEach(key => {
            const slider = this.elements[key];
            if (!slider) return;
            
            slider.addEventListener('input', () => {
                let value = parseInt(slider.value);
                this.state.setAdjustment(key, value);
                
                // Update display
                const display = this.elements[`${key}Value`];
                if (display) {
                    if (key === 'blur') {
                        display.textContent = `${value}px`;
                    } else if (key === 'hue') {
                        display.textContent = `${value}°`;
                    } else {
                        display.textContent = `${value}%`;
                    }
                }
            });
        });
        
        // Reset button
        const resetBtn = document.querySelector('[data-action="reset-adjustments"]');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.state.resetAdjustments();
                this.syncAdjustmentSliders();
            });
        }
    }
    
    /**
     * Sync adjustment sliders with state
     */
    syncAdjustmentSliders() {
        const adj = this.state.adjustments;
        
        Object.keys(adj).forEach(key => {
            const slider = this.elements[key];
            if (slider) {
                slider.value = adj[key];
            }
        });
        
        this.updateAdjustmentDisplays(adj);
    }
    
    /**
     * Update adjustment value displays
     */
    updateAdjustmentDisplays(adj) {
        if (this.elements.brightnessValue) {
            this.elements.brightnessValue.textContent = `${adj.brightness}%`;
        }
        if (this.elements.contrastValue) {
            this.elements.contrastValue.textContent = `${adj.contrast}%`;
        }
        if (this.elements.saturationValue) {
            this.elements.saturationValue.textContent = `${adj.saturation}%`;
        }
        if (this.elements.hueValue) {
            this.elements.hueValue.textContent = `${adj.hue}°`;
        }
        if (this.elements.blurValue) {
            this.elements.blurValue.textContent = `${adj.blur}px`;
        }
    }
    
    /**
     * Set active tool
     */
    setTool(toolName) {
        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === toolName);
        });
        
        // Activate tool in editor
        this.editor.setTool(toolName);
    }
    
    /**
     * Handle top bar actions
     */
    handleAction(action) {
        switch (action) {
            case 'undo':
                this.editor.history.undo();
                break;
            case 'redo':
                this.editor.history.redo();
                break;
            case 'zoom-in':
                this.state.zoomIn();
                break;
            case 'zoom-out':
                this.state.zoomOut();
                break;
            case 'zoom-fit':
                const container = this.elements.canvasContainer.getBoundingClientRect();
                this.state.fitToScreen(container.width, container.height);
                break;
            case 'export':
                this.showExportDialog();
                break;
            case 'new-project':
                this.showNewProjectDialog();
                break;
            case 'open-file':
            case 'import-image':
                this.elements.fileInput.click();
                break;
            case 'save-project':
                this.editor.exporter.saveProject();
                break;
            case 'load-project':
                this.elements.projectInput.click();
                break;
            case 'add-layer':
                this.addNewLayer();
                break;
            case 'delete-layer':
                this.deleteSelectedLayers();
                break;
            case 'confirm-export':
                this.confirmExport();
                break;
            case 'create-project':
                this.createNewProject();
                break;
            case 'cancel-dialog':
                this.closeAllDialogs();
                break;
            case 'export-png':
            case 'export-jpg':
            case 'export-webp':
                const formatMap = { 'export-png': 'png', 'export-jpg': 'jpeg', 'export-webp': 'webp' };
                this.editor.exporter.download(`export.${formatMap[action]}`, formatMap[action]);
                this.elements.fileMenu.classList.remove('show');
                break;
        }
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(e) {
        // Ignore when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        const modifiers = Utils.getModifierState(e);
        
        // Ctrl/Cmd shortcuts
        if (modifiers.ctrl) {
            switch (e.key.toLowerCase()) {
                case 'z':
                    e.preventDefault();
                    if (modifiers.shift) {
                        this.editor.history.redo();
                    } else {
                        this.editor.history.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    this.editor.history.redo();
                    break;
                case 's':
                    e.preventDefault();
                    this.state.saveToStorage();
                    break;
                case 'o':
                    e.preventDefault();
                    this.elements.fileInput.click();
                    break;
                case 'n':
                    e.preventDefault();
                    this.showNewProjectDialog();
                    break;
                case 'v':
                    e.preventDefault();
                    this.setTool('move');
                    break;
            }
        }
        
        // Single key shortcuts
        switch (e.key.toLowerCase()) {
            case 'v':
                this.setTool('move');
                break;
            case 'a':
                this.setTool('select');
                break;
            case 't':
                this.setTool('text');
                break;
            case 'u':
                this.setTool('shape');
                break;
            case 'b':
                this.setTool('brush');
                break;
            case 'e':
                this.setTool('eraser');
                break;
            case 'c':
                this.setTool('crop');
                break;
            case 'i':
                this.setTool('eyedropper');
                break;
            case 'h':
                this.setTool('hand');
                break;
            case 'delete':
            case 'backspace':
                this.deleteSelectedLayers();
                break;
            case 'escape':
                this.state.deselectAll();
                break;
        }
    }
    
    /**
     * Toggle file menu
     */
    toggleFileMenu() {
        this.elements.fileMenu.classList.toggle('show');
    }
    
    /**
     * Show/hide dialogs
     */
    showNewProjectDialog() {
        this.elements.newProjectDialog.showModal();
        this.elements.fileMenu.classList.remove('show');
    }
    
    showExportDialog() {
        this.elements.exportDialog.showModal();
    }
    
    closeAllDialogs() {
        document.querySelectorAll('dialog').forEach(d => d.close());
    }
    
    /**
     * Create new project
     */
    createNewProject() {
        const width = parseInt(document.getElementById('canvasWidth').value);
        const height = parseInt(document.getElementById('canvasHeight').value);
        const bgColor = document.getElementById('backgroundColor').value;
        
        this.editor.createNewProject(width, height, bgColor);
        this.closeAllDialogs();
    }
    
    /**
     * Confirm export
     */
    confirmExport() {
        const format = document.getElementById('exportFormat').value;
        const quality = parseInt(document.getElementById('exportQuality').value) / 100;
        const scale = parseFloat(document.getElementById('exportScale').value);
        const transparentBg = document.getElementById('transparentBg').checked;
        
        const filename = `export.${format === 'jpeg' ? 'jpg' : format}`;
        
        this.editor.exporter.download(filename, format, {
            quality,
            scale,
            transparentBg,
        });
        
        this.closeAllDialogs();
    }
    
    /**
     * Handle file selection
     */
    async handleFileSelect(event) {
        const files = event.target.files;
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                await this.importImage(file);
            } else if (file.name.endsWith('.json')) {
                await this.loadProject(file);
            }
        }
        event.target.value = '';
    }
    
    /**
     * Handle drag and drop
     */
    async handleDrop(event) {
        event.preventDefault();
        this.elements.canvasContainer.style.borderColor = '';
        
        const files = event.dataTransfer.files;
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                await this.importImage(file);
            }
        }
    }
    
    /**
     * Import image as layer
     */
    async importImage(file) {
        try {
            const dataUrl = await Utils.readFileAsDataURL(file);
            const img = await Utils.loadImage(dataUrl);
            
            const LayerClass = window.Layer || Layer;
            const layer = new LayerClass({
                type: 'image',
                name: file.name,
                x: this.state.panX / this.state.zoom,
                y: this.state.panY / this.state.zoom,
                width: img.width,
                height: img.height,
                image: img,
            });
            
            this.editor.history.saveState('Import Image');
            this.state.addLayer(layer);
        } catch (e) {
            console.error('Failed to import image:', e);
        }
    }
    
    /**
     * Load project from file
     */
    async loadProject(file) {
        try {
            const text = await Utils.readFileAsText(file);
            const json = JSON.parse(text);
            this.state.fromJSON(json);
            this.editor.history.clear();
        } catch (e) {
            console.error('Failed to load project:', e);
        }
    }
    
    /**
     * Handle project load input
     */
    handleProjectLoad(event) {
        const file = event.target.files[0];
        if (file) this.loadProject(file);
        event.target.value = '';
    }
    
    /**
     * Render layers panel
     */
    renderLayers() {
        const container = this.elements.layersContent;
        if (!container) return;
        
        container.innerHTML = '';
        
        // Render layers in reverse order (top to bottom)
        [...this.state.layers].reverse().forEach((layer, index) => {
            const actualIndex = this.state.layers.length - 1 - index;
            const item = this.createLayerItem(layer, actualIndex);
            container.appendChild(item);
        });
    }
    
    /**
     * Create layer item element
     */
    createLayerItem(layer, index) {
        const div = document.createElement('div');
        div.className = `layer-item${this.state.selectedLayerIds.includes(layer.id) ? ' selected' : ''}`;
        div.draggable = true;
        
        div.innerHTML = `
            <div class="layer-visibility" data-action="toggle-visibility" title="${layer.visible ? 'Hide' : 'Show'}">
                ${layer.visible ? 
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' :
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
                }
            </div>
            <div class="layer-thumbnail">
                ${this.getLayerThumbnail(layer)}
            </div>
            <div class="layer-info">
                <div class="layer-name">${layer.name}</div>
                <div class="layer-type">${layer.type}</div>
            </div>
            <div class="layer-lock" data-action="toggle-lock" title="${layer.locked ? 'Unlock' : 'Lock'}">
                ${layer.locked ?
                    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' :
                    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>'
                }
            </div>
        `;
        
        // Click to select
        div.addEventListener('click', (e) => {
            if (e.target.closest('[data-action]')) return;
            this.state.selectLayer(layer.id, e.shiftKey);
        });
        
        // Visibility toggle
        const visBtn = div.querySelector('[data-action="toggle-visibility"]');
        if (visBtn) {
            visBtn.addEventListener('click', () => {
                layer.visible = !layer.visible;
                this.renderLayers();
            });
        }
        
        // Lock toggle
        const lockBtn = div.querySelector('[data-action="toggle-lock"]');
        if (lockBtn) {
            lockBtn.addEventListener('click', () => {
                layer.locked = !layer.locked;
                this.renderLayers();
            });
        }
        
        // Drag events
        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', index.toString());
        });
        
        div.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        div.addEventListener('drop', (e) => {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            this.state.reorderLayer(this.state.layers[fromIndex].id, index);
        });
        
        return div;
    }
    
    /**
     * Get thumbnail HTML for layer
     */
    getLayerThumbnail(layer) {
        switch (layer.type) {
            case 'image':
                if (layer.image) {
                    return `<img src="${layer.image.src}" alt="">`;
                }
                break;
            case 'text':
                return `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:10px;color:#aaa;">T</div>`;
            case 'shape':
                return `<div style="display:flex;align-items:center;justify-content:center;height:100%;"><div style="width:16px;height:16px;background:${layer.fillColor};border-radius:${layer.shapeType === 'circle' ? '50%' : '2px'};"></div></div>`;
            default:
                return `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:10px;color:#aaa;">${layer.type[0].toUpperCase()}</div>`;
        }
        return '';
    }
    
    /**
     * Add new layer
     */
    addNewLayer() {
        const LayerClass = window.Layer || Layer;
        const layer = new LayerClass({
            type: 'shape',
            name: 'New Layer',
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            shapeType: 'rectangle',
            fillColor: '#6366f1',
        });
        
        this.editor.history.saveState('Add Layer');
        this.state.addLayer(layer);
    }
    
    /**
     * Delete selected layers
     */
    deleteSelectedLayers() {
        const selectedLayers = this.state.getSelectedLayers();
        if (selectedLayers.length === 0) return;
        
        this.editor.history.saveState('Delete Layers');
        selectedLayers.forEach(layer => {
            this.state.removeLayer(layer.id, false);
        });
        this.state.emit('layersChanged');
    }
    
    /**
     * Update zoom display
     */
    updateZoomDisplay(zoom) {
        if (this.elements.zoomDisplay) {
            this.elements.zoomDisplay.textContent = `${Math.round(zoom * 100)}%`;
        }
    }
    
    /**
     * Update properties panel based on selection
     */
    updatePropertiesPanel() {
        const container = this.elements.propertiesContent;
        if (!container) return;
        
        const selectedLayers = this.state.getSelectedLayers();
        if (selectedLayers.length !== 1) {
            container.innerHTML = '<p style="color:var(--text-secondary);font-size:13px;text-align:center;padding:20px;">Select a layer to edit properties</p>';
            return;
        }
        
        const layer = selectedLayers[0];
        container.innerHTML = this.generatePropertiesHTML(layer);
        this.bindPropertyEvents(layer);
    }
    
    /**
     * Generate properties panel HTML
     */
    generatePropertiesHTML(layer) {
        return `
            <div class="property-group">
                <label class="property-label">Position</label>
                <div class="property-row">
                    <input type="number" class="property-input" data-prop="x" value="${Math.round(layer.x)}">
                    <input type="number" class="property-input" data-prop="y" value="${Math.round(layer.y)}">
                </div>
            </div>
            <div class="property-group">
                <label class="property-label">Size</label>
                <div class="property-row">
                    <input type="number" class="property-input" data-prop="width" value="${Math.round(layer.width)}">
                    <input type="number" class="property-input" data-prop="height" value="${Math.round(layer.height)}">
                </div>
            </div>
            <div class="property-group">
                <label class="property-label">Opacity</label>
                <input type="range" class="slider" data-prop="opacity" min="0" max="100" value="${Math.round(layer.opacity * 100)}">
            </div>
            <div class="property-group">
                <label class="property-label">Rotation</label>
                <input type="number" class="property-input" data-prop="rotation" value="${Math.round(layer.rotation)}">
            </div>
            ${layer.type === 'text' ? this.getTextProperties(layer) : ''}
            ${layer.type === 'shape' ? this.getShapeProperties(layer) : ''}
        `;
    }
    
    getTextProperties(layer) {
        return `
            <div class="property-group">
                <label class="property-label">Text Color</label>
                <input type="color" class="color-input" data-prop="fillColor" value="${layer.fillColor}">
            </div>
            <div class="property-group">
                <label class="property-label">Font Size</label>
                <input type="number" class="property-input" data-prop="fontSize" value="${layer.fontSize}">
            </div>
        `;
    }
    
    getShapeProperties(layer) {
        return `
            <div class="property-group">
                <label class="property-label">Fill Color</label>
                <input type="color" class="color-input" data-prop="fillColor" value="${layer.fillColor}">
            </div>
            <div class="property-group">
                <label class="property-label">Corner Radius</label>
                <input type="number" class="property-input" data-prop="cornerRadius" value="${layer.cornerRadius}">
            </div>
        `;
    }
    
    /**
     * Bind property input events
     */
    bindPropertyEvents(layer) {
        const container = this.elements.propertiesContent;
        if (!container) return;
        
        // Number inputs
        container.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('change', () => {
                const prop = input.dataset.prop;
                const value = parseFloat(input.value);
                if (layer[prop] !== undefined) {
                    this.editor.history.saveState(`Change ${prop}`);
                    layer[prop] = value;
                    layer.touch();
                }
            });
        });
        
        // Range inputs
        container.querySelectorAll('input[type="range"]').forEach(input => {
            input.addEventListener('input', () => {
                const prop = input.dataset.prop;
                let value = parseFloat(input.value);
                if (prop === 'opacity') value = value / 100;
                if (layer[prop] !== undefined) {
                    layer[prop] = value;
                    layer.touch();
                }
            });
        });
        
        // Color inputs
        container.querySelectorAll('input[type="color"]').forEach(input => {
            input.addEventListener('input', () => {
                const prop = input.dataset.prop;
                if (layer[prop] !== undefined) {
                    layer[prop] = input.value;
                    layer.touch();
                }
            });
        });
    }
}

// Make globally available
if (typeof window !== 'undefined') {
    window.UIManager = UIManager;
}
