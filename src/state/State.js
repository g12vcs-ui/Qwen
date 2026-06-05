// PixelForge - State Management

class State {
    constructor() {
        this.canvasWidth = 1920;
        this.canvasHeight = 1080;
        this.backgroundColor = '#ffffff';
        this.layers = [];
        this.selectedLayerIds = [];
        this.activeTool = 'move';
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.showGrid = false;
        this.snapToGrid = false;
        this.gridSize = 20;
        
        // Tool options
        this.brushSize = 10;
        this.brushOpacity = 1;
        this.fillColor = '#3b82f6';
        this.strokeColor = '#1e40af';
        
        // Adjustments (global)
        this.adjustments = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            hue: 0,
            blur: 0
        };
        
        // Event listeners
        this.listeners = {};
        
        // Load from localStorage if available
        this.loadFromStorage();
    }
    
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        return () => this.off(event, callback);
    }
    
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }
    
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
    
    // Layer operations
    addLayer(layer) {
        this.layers.push(layer);
        this.selectedLayerIds = [layer.id];
        this.emit('layersChanged');
        this.emit('selectionChanged');
        this.saveToStorage();
        return layer;
    }
    
    removeLayer(layerId) {
        const index = this.layers.findIndex(l => l.id === layerId);
        if (index !== -1) {
            this.layers.splice(index, 1);
            this.selectedLayerIds = this.selectedLayerIds.filter(id => id !== layerId);
            this.emit('layersChanged');
            this.emit('selectionChanged');
            this.saveToStorage();
            return true;
        }
        return false;
    }
    
    getLayer(layerId) {
        return this.layers.find(l => l.id === layerId);
    }
    
    getSelectedLayers() {
        return this.layers.filter(l => this.selectedLayerIds.includes(l.id));
    }
    
    getTopVisibleLayer() {
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const layer = this.layers[i];
            if (layer.visible && !layer.locked) {
                return layer;
            }
        }
        return null;
    }
    
    selectLayer(layerId, addToSelection = false) {
        if (addToSelection) {
            if (!this.selectedLayerIds.includes(layerId)) {
                this.selectedLayerIds.push(layerId);
            }
        } else {
            this.selectedLayerIds = layerId ? [layerId] : [];
        }
        this.emit('selectionChanged');
        this.saveToStorage();
    }
    
    deselectAll() {
        this.selectedLayerIds = [];
        this.emit('selectionChanged');
        this.saveToStorage();
    }
    
    moveLayer(layerId, direction) {
        const index = this.layers.findIndex(l => l.id === layerId);
        if (index === -1) return false;
        
        const newIndex = direction === 'up' ? index + 1 : index - 1;
        if (newIndex < 0 || newIndex >= this.layers.length) return false;
        
        [this.layers[index], this.layers[newIndex]] = [this.layers[newIndex], this.layers[index]];
        this.emit('layersChanged');
        this.saveToStorage();
        return true;
    }
    
    reorderLayer(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.layers.length || 
            toIndex < 0 || toIndex >= this.layers.length) return false;
        
        const [layer] = this.layers.splice(fromIndex, 1);
        this.layers.splice(toIndex, 0, layer);
        this.emit('layersChanged');
        this.saveToStorage();
        return true;
    }
    
    duplicateLayer(layerId) {
        const layer = this.getLayer(layerId);
        if (!layer) return null;
        
        const data = layer.toJSON();
        data.id = PFUtils.generateId();
        data.name = layer.name + ' copy';
        data.x += 20;
        data.y += 20;
        
        const newLayer = Layer.fromJSON(data);
        this.addLayer(newLayer);
        return newLayer;
    }
    
    updateLayer(layerId, updates) {
        const layer = this.getLayer(layerId);
        if (!layer) return false;
        
        Object.assign(layer, updates);
        layer.dirty = true;
        this.emit('layerUpdated', layer);
        this.emit('layersChanged');
        this.saveToStorage();
        return true;
    }
    
    // Document operations
    setDimensions(width, height) {
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.emit('canvasResized');
        this.saveToStorage();
    }
    
    setBackgroundColor(color) {
        this.backgroundColor = color;
        this.emit('backgroundColorChanged');
        this.saveToStorage();
    }
    
    // Tool operations
    setTool(toolName) {
        this.activeTool = toolName;
        this.emit('toolChanged', toolName);
    }
    
    // View operations
    setZoom(zoom) {
        this.zoom = PFUtils.clamp(zoom, 0.01, 10);
        this.emit('zoomChanged', this.zoom);
    }
    
    setPan(x, y) {
        this.panX = x;
        this.panY = y;
        this.emit('panChanged');
    }
    
    resetView() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.emit('viewReset');
    }
    
    // Storage
    saveToStorage() {
        try {
            const data = {
                canvasWidth: this.canvasWidth,
                canvasHeight: this.canvasHeight,
                backgroundColor: this.backgroundColor,
                layers: this.layers.map(l => l.toJSON()),
                adjustments: { ...this.adjustments }
            };
            localStorage.setItem('pixelforge_project', JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    }
    
    loadFromStorage() {
        try {
            const data = localStorage.getItem('pixelforge_project');
            if (data) {
                const parsed = JSON.parse(data);
                this.canvasWidth = parsed.canvasWidth || 1920;
                this.canvasHeight = parsed.canvasHeight || 1080;
                this.backgroundColor = parsed.backgroundColor || '#ffffff';
                this.adjustments = parsed.adjustments || this.adjustments;
                
                // Load layers
                this.layers = [];
                if (parsed.layers) {
                    parsed.layers.forEach(layerData => {
                        const layer = Layer.fromJSON(layerData);
                        this.layers.push(layer);
                    });
                }
                
                this.emit('projectLoaded');
                return true;
            }
        } catch (e) {
            console.warn('Failed to load from localStorage:', e);
        }
        return false;
    }
    
    toJSON() {
        return {
            canvasWidth: this.canvasWidth,
            canvasHeight: this.canvasHeight,
            backgroundColor: this.backgroundColor,
            layers: this.layers.map(l => l.toJSON()),
            adjustments: { ...this.adjustments }
        };
    }
    
    fromJSON(data) {
        this.canvasWidth = data.canvasWidth || 1920;
        this.canvasHeight = data.canvasHeight || 1080;
        this.backgroundColor = data.backgroundColor || '#ffffff';
        this.adjustments = data.adjustments || this.adjustments;
        
        this.layers = [];
        if (data.layers) {
            data.layers.forEach(layerData => {
                const layer = Layer.fromJSON(layerData);
                this.layers.push(layer);
            });
        }
        
        this.selectedLayerIds = [];
        this.emit('projectLoaded');
        this.emit('layersChanged');
        this.emit('canvasResized');
    }
    
    clear() {
        this.layers = [];
        this.selectedLayerIds = [];
        this.canvasWidth = 1920;
        this.canvasHeight = 1080;
        this.backgroundColor = '#ffffff';
        this.adjustments = { brightness: 0, contrast: 0, saturation: 0, hue: 0, blur: 0 };
        this.emit('projectCleared');
        this.emit('layersChanged');
        this.emit('canvasResized');
        localStorage.removeItem('pixelforge_project');
    }
}

window.State = State;
