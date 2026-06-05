// PixelForge - UI Manager

class UIManager {
    constructor(state, canvasManager) {
        this.state = state;
        this.canvasManager = canvasManager;
        
        this.setupEventListeners();
        this.setupLayerList();
    }
    
    setupEventListeners() {
        // Top bar buttons
        document.getElementById('btn-new')?.addEventListener('click', () => {
            document.getElementById('new-doc-dialog').showModal();
        });
        
        document.getElementById('btn-open')?.addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        
        document.getElementById('file-input')?.addEventListener('change', (e) => {
            this.handleFileOpen(e);
        });
        
        document.getElementById('btn-save')?.addEventListener('click', () => {
            window.app?.saveProject();
        });
        
        document.getElementById('btn-export')?.addEventListener('click', () => {
            document.getElementById('export-dialog').showModal();
        });
        
        // History buttons
        document.getElementById('btn-undo')?.addEventListener('click', () => {
            window.app?.history?.undo();
        });
        
        document.getElementById('btn-redo')?.addEventListener('click', () => {
            window.app?.history?.redo();
        });
        
        // Zoom controls
        document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
            this.state.setZoom(this.state.zoom - 0.25);
            this.canvasManager.updateZoomDisplay();
            this.canvasManager.render();
        });
        
        document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
            this.state.setZoom(this.state.zoom + 0.25);
            this.canvasManager.updateZoomDisplay();
            this.canvasManager.render();
        });
        
        document.getElementById('btn-fit')?.addEventListener('click', () => {
            this.fitToScreen();
        });
        
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.canvasManager.setTool(btn.dataset.tool);
            });
        });
        
        // Color pickers
        document.getElementById('fill-color')?.addEventListener('input', (e) => {
            this.state.fillColor = e.target.value;
        });
        
        document.getElementById('stroke-color')?.addEventListener('input', (e) => {
            this.state.strokeColor = e.target.value;
        });
        
        // Brush size
        document.getElementById('brush-size')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.state.brushSize = value;
            document.getElementById('brush-size-value').textContent = value;
        });
        
        // Opacity slider
        document.getElementById('opacity-slider')?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.state.brushOpacity = value / 100;
            document.getElementById('opacity-value').textContent = value;
            
            // Also update selected layer opacity
            const layers = this.state.getSelectedLayers();
            if (layers.length > 0) {
                layers.forEach(layer => {
                    layer.opacity = value / 100;
                    layer.dirty = true;
                });
                this.state.emit('layersChanged');
                this.canvasManager.render();
            }
        });
        
        // Adjustment sliders
        ['brightness', 'contrast', 'saturation', 'hue', 'blur'].forEach(adj => {
            const slider = document.getElementById(`adj-${adj}`);
            const display = document.getElementById(`val-${adj}`);
            
            slider?.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                
                if (display) {
                    if (adj === 'blur') {
                        display.textContent = value + 'px';
                    } else if (adj === 'hue') {
                        display.textContent = value + '°';
                    } else {
                        display.textContent = value;
                    }
                }
                
                // Apply to selected layer or globally
                const layers = this.state.getSelectedLayers();
                if (layers.length > 0) {
                    layers.forEach(layer => {
                        if (layer.type === 'image') {
                            layer.adjustments[adj] = value;
                            layer.dirty = true;
                        }
                    });
                    this.state.emit('layersChanged');
                    this.canvasManager.render();
                } else {
                    // Apply globally as a fallback
                    this.state.adjustments[adj] = value;
                    this.canvasManager.render();
                }
            });
        });
        
        document.getElementById('btn-reset-adjustments')?.addEventListener('click', () => {
            this.resetAdjustments();
        });
        
        // Layer panel buttons
        document.getElementById('btn-add-layer')?.addEventListener('click', () => {
            this.addNewLayer();
        });
        
        document.getElementById('btn-delete-layer')?.addEventListener('click', () => {
            this.deleteSelectedLayers();
        });
        
        document.getElementById('btn-duplicate-layer')?.addEventListener('click', () => {
            this.duplicateSelectedLayers();
        });
        
        // Dialog buttons
        document.getElementById('cancel-new')?.addEventListener('click', () => {
            document.getElementById('new-doc-dialog').close();
        });
        
        document.getElementById('confirm-new')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.createNewDocument();
        });
        
        document.getElementById('cancel-export')?.addEventListener('click', () => {
            document.getElementById('export-dialog').close();
        });
        
        document.getElementById('confirm-export')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.exportImage();
        });
        
        // Listen for state changes
        this.state.on('layersChanged', () => this.updateLayerList());
        this.state.on('selectionChanged', () => {
            this.updateLayerList();
            this.updatePropertiesPanel();
        });
        this.state.on('zoomChanged', () => this.canvasManager.updateZoomDisplay());
    }
    
    setupLayerList() {
        this.layerList = document.getElementById('layers-list');
    }
    
    updateLayerList() {
        if (!this.layerList) return;
        
        this.layerList.innerHTML = '';
        
        // Show layers in reverse order (top layer first)
        [...this.state.layers].reverse().forEach((layer, reverseIndex) => {
            const index = this.state.layers.length - 1 - reverseIndex;
            const item = this.createLayerItem(layer, index);
            this.layerList.appendChild(item);
        });
    }
    
    createLayerItem(layer, index) {
        const item = document.createElement('div');
        item.className = 'layer-item' + (this.state.selectedLayerIds.includes(layer.id) ? ' selected' : '');
        item.draggable = true;
        
        item.innerHTML = `
            <div class="layer-visibility ${layer.visible ? '' : 'hidden'}" title="Toggle Visibility">
                ${layer.visible ? '👁' : '○'}
            </div>
            <div class="layer-lock" title="Toggle Lock">
                ${layer.locked ? '🔒' : '🔓'}
            </div>
            <div class="layer-thumbnail">
                <canvas></canvas>
            </div>
            <div class="layer-info">
                <div class="layer-name">${this.escapeHtml(layer.name)}</div>
                <div class="layer-type">${layer.type}</div>
            </div>
        `;
        
        // Create thumbnail
        const thumbCanvas = item.querySelector('.layer-thumbnail canvas');
        thumbCanvas.width = 40;
        thumbCanvas.height = 40;
        const thumbCtx = thumbCanvas.getContext('2d');
        thumbCtx.fillStyle = '#1a1a2e';
        thumbCtx.fillRect(0, 0, 40, 40);
        
        if (layer.image || layer.type === 'shape' || layer.type === 'text') {
            layer.render();
            thumbCtx.drawImage(layer.canvas, 0, 0, 40, 40);
        }
        
        // Events
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.layer-visibility') && !e.target.closest('.layer-lock')) {
                this.state.selectLayer(layer.id, e.shiftKey);
                this.canvasManager.render();
            }
        });
        
        item.querySelector('.layer-visibility').addEventListener('click', (e) => {
            e.stopPropagation();
            layer.visible = !layer.visible;
            this.state.emit('layersChanged');
            this.canvasManager.render();
        });
        
        item.querySelector('.layer-lock').addEventListener('click', (e) => {
            e.stopPropagation();
            layer.locked = !layer.locked;
            this.state.emit('layersChanged');
        });
        
        // Drag and drop
        item.addEventListener('dragstart', (e) => {
            item.classList.add('dragging');
            e.dataTransfer.setData('text/plain', index.toString());
        });
        
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            document.querySelectorAll('.layer-item').forEach(i => i.classList.remove('drag-over'));
        });
        
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            item.classList.add('drag-over');
        });
        
        item.addEventListener('dragleave', () => {
            item.classList.remove('drag-over');
        });
        
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.classList.remove('drag-over');
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            this.state.reorderLayer(fromIndex, index);
        });
        
        return item;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    updatePropertiesPanel() {
        const content = document.getElementById('properties-content');
        if (!content) return;
        
        const layers = this.state.getSelectedLayers();
        
        if (layers.length === 0) {
            content.innerHTML = '<p class="no-selection">No layer selected</p>';
            return;
        }
        
        const layer = layers[0];
        
        content.innerHTML = `
            <div class="property-row">
                <label>Name</label>
                <input type="text" id="prop-name" value="${this.escapeHtml(layer.name)}">
            </div>
            <div class="property-row">
                <label>Type</label>
                <span>${layer.type}</span>
            </div>
            <div class="property-row">
                <label>X</label>
                <input type="number" id="prop-x" value="${Math.round(layer.x)}">
            </div>
            <div class="property-row">
                <label>Y</label>
                <input type="number" id="prop-y" value="${Math.round(layer.y)}">
            </div>
            <div class="property-row">
                <label>Width</label>
                <input type="number" id="prop-width" value="${Math.round(layer.width)}">
            </div>
            <div class="property-row">
                <label>Height</label>
                <input type="number" id="prop-height" value="${Math.round(layer.height)}">
            </div>
            <div class="property-row">
                <label>Opacity</label>
                <input type="range" id="prop-opacity" min="0" max="100" value="${Math.round(layer.opacity * 100)}">
            </div>
            ${layer.type === 'text' ? this.getTextProperties(layer) : ''}
            ${layer.type === 'shape' ? this.getShapeProperties(layer) : ''}
        `;
        
        // Bind property inputs
        document.getElementById('prop-name')?.addEventListener('input', (e) => {
            layer.name = e.target.value;
            this.updateLayerList();
        });
        
        document.getElementById('prop-x')?.addEventListener('input', (e) => {
            layer.x = parseInt(e.target.value) || 0;
            layer.dirty = true;
            this.canvasManager.render();
        });
        
        document.getElementById('prop-y')?.addEventListener('input', (e) => {
            layer.y = parseInt(e.target.value) || 0;
            layer.dirty = true;
            this.canvasManager.render();
        });
        
        document.getElementById('prop-width')?.addEventListener('input', (e) => {
            layer.width = parseInt(e.target.value) || 10;
            layer.dirty = true;
            this.canvasManager.render();
        });
        
        document.getElementById('prop-height')?.addEventListener('input', (e) => {
            layer.height = parseInt(e.target.value) || 10;
            layer.dirty = true;
            this.canvasManager.render();
        });
        
        document.getElementById('prop-opacity')?.addEventListener('input', (e) => {
            layer.opacity = parseInt(e.target.value) / 100;
            layer.dirty = true;
            this.canvasManager.render();
        });
    }
    
    getTextProperties(layer) {
        return `
            <div class="property-row">
                <label>Text</label>
                <input type="text" id="prop-text" value="${this.escapeHtml(layer.text)}">
            </div>
            <div class="property-row">
                <label>Font Size</label>
                <input type="number" id="prop-fontsize" value="${layer.fontSize}">
            </div>
            <div class="property-row">
                <label>Color</label>
                <input type="color" id="prop-fillcolor" value="${layer.fillColor}">
            </div>
        `;
    }
    
    getShapeProperties(layer) {
        return `
            <div class="property-row">
                <label>Fill</label>
                <input type="color" id="prop-shapefill" value="${layer.fillColor}">
            </div>
            <div class="property-row">
                <label>Stroke</label>
                <input type="color" id="prop-shapestroke" value="${layer.strokeColor || '#000000'}">
            </div>
        `;
    }
    
    handleFileOpen(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        if (file.name.endsWith('.json')) {
            // Load project file
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    this.state.fromJSON(data);
                    this.canvasManager.render();
                } catch (err) {
                    alert('Invalid project file');
                }
            };
            reader.readAsText(file);
        } else {
            // Load image
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const layer = new Layer({
                        type: 'image',
                        name: file.name,
                        width: img.width,
                        height: img.height,
                        image: img
                    });
                    this.state.addLayer(layer);
                    this.canvasManager.render();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
        
        // Reset input
        e.target.value = '';
    }
    
    createNewDocument() {
        const width = parseInt(document.getElementById('new-width').value) || 1920;
        const height = parseInt(document.getElementById('new-height').value) || 1080;
        const bg = document.getElementById('new-bg').value;
        
        this.state.clear();
        this.state.setDimensions(width, height);
        
        if (bg !== 'transparent') {
            this.state.setBackgroundColor(bg === 'white' ? '#ffffff' : '#000000');
        }
        
        document.getElementById('new-doc-dialog').close();
        this.canvasManager.render();
    }
    
    addNewLayer() {
        const layer = new Layer({
            type: 'shape',
            name: 'New Layer',
            x: 100,
            y: 100,
            width: 200,
            height: 200,
            fillColor: this.state.fillColor
        });
        this.state.addLayer(layer);
        this.canvasManager.render();
    }
    
    deleteSelectedLayers() {
        this.state.getSelectedLayers().forEach(layer => {
            this.state.removeLayer(layer.id);
        });
        this.canvasManager.render();
    }
    
    duplicateSelectedLayers() {
        this.state.getSelectedLayers().forEach(layer => {
            this.state.duplicateLayer(layer.id);
        });
        this.canvasManager.render();
    }
    
    resetAdjustments() {
        ['brightness', 'contrast', 'saturation', 'hue', 'blur'].forEach(adj => {
            const slider = document.getElementById(`adj-${adj}`);
            const display = document.getElementById(`val-${adj}`);
            
            if (slider) slider.value = 0;
            if (display) {
                if (adj === 'blur') {
                    display.textContent = '0px';
                } else if (adj === 'hue') {
                    display.textContent = '0°';
                } else {
                    display.textContent = '0';
                }
            }
        });
        
        // Reset on selected layer
        const layers = this.state.getSelectedLayers();
        if (layers.length > 0) {
            layers.forEach(layer => {
                layer.adjustments = { brightness: 0, contrast: 0, saturation: 0, hue: 0, blur: 0 };
                layer.dirty = true;
            });
            this.state.emit('layersChanged');
            this.canvasManager.render();
        }
    }
    
    fitToScreen() {
        const container = document.getElementById('canvas-container');
        const containerRect = container.getBoundingClientRect();
        
        const scaleX = containerRect.width / this.state.canvasWidth;
        const scaleY = containerRect.height / this.state.canvasHeight;
        const scale = Math.min(scaleX, scaleY) * 0.95;
        
        this.state.setZoom(scale);
        this.canvasManager.updateZoomDisplay();
        this.canvasManager.render();
    }
    
    exportImage() {
        const format = document.getElementById('export-format').value;
        const quality = parseInt(document.getElementById('export-quality').value) / 100;
        const scale = parseFloat(document.getElementById('export-scale').value);
        
        window.app?.exportImage(format, quality, scale);
        document.getElementById('export-dialog').close();
    }
}

window.UIManager = UIManager;
