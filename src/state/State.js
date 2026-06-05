/**
 * State Management - Central state store for the editor
 * Handles project state, layers, selections, and settings
 */

class State {
    constructor() {
        // Canvas settings
        this.canvasWidth = 1920;
        this.canvasHeight = 1080;
        this.backgroundColor = '#ffffff';
        
        // Layers
        this.layers = [];
        this.selectedLayerIds = [];
        this.activeLayerId = null;
        
        // Viewport
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        
        // Tool state
        this.currentTool = 'move';
        this.toolOptions = {};
        
        // Global adjustments (applied to final output)
        this.adjustments = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            blur: 0,
        };
        
        // Snapping settings
        this.snapToGrid = false;
        this.snapToGuides = true;
        this.gridSize = 20;
        
        // Guides
        this.guides = {
            horizontal: [],
            vertical: [],
        };
        
        // Selection
        this.selection = null; // { x, y, width, height }
        
        // Clipboard
        this.clipboard = null;
        
        // Project metadata
        this.projectName = 'Untitled';
        this.lastSaved = null;
        
        // Event listeners
        this.listeners = {};
        
        // Load from localStorage if available
        this.loadFromStorage();
    }
    
    /**
     * Subscribe to state changes
     */
    subscribe(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        return () => this.unsubscribe(event, callback);
    }
    
    /**
     * Unsubscribe from state changes
     */
    unsubscribe(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }
    
    /**
     * Emit an event
     */
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
    
    /**
     * Set a property and emit change event
     */
    set(key, value, emitChange = true) {
        const oldValue = this[key];
        this[key] = value;
        if (emitChange) {
            this.emit('change', { key, value, oldValue });
        }
    }
    
    /**
     * Add a layer
     */
    addLayer(layer, index = -1, emitChange = true) {
        if (index === -1 || index >= this.layers.length) {
            this.layers.push(layer);
        } else {
            this.layers.splice(index, 0, layer);
        }
        this.setActiveLayer(layer.id);
        if (emitChange) {
            this.emit('layersChanged');
            this.emit('change', { key: 'layers', value: this.layers });
        }
    }
    
    /**
     * Remove a layer by ID
     */
    removeLayer(layerId, emitChange = true) {
        const index = this.layers.findIndex(l => l.id === layerId);
        if (index !== -1) {
            this.layers.splice(index, 1);
            if (this.activeLayerId === layerId) {
                this.activeLayerId = null;
                this.selectedLayerIds = this.selectedLayerIds.filter(id => id !== layerId);
            }
            if (emitChange) {
                this.emit('layersChanged');
                this.emit('change', { key: 'layers', value: this.layers });
            }
            return true;
        }
        return false;
    }
    
    /**
     * Get a layer by ID
     */
    getLayer(layerId) {
        return this.layers.find(l => l.id === layerId);
    }
    
    /**
     * Get all selected layers
     */
    getSelectedLayers() {
        return this.layers.filter(l => this.selectedLayerIds.includes(l.id));
    }
    
    /**
     * Set active layer
     */
    setActiveLayer(layerId) {
        this.activeLayerId = layerId;
        this.emit('activeLayerChanged', layerId);
    }
    
    /**
     * Select/deselect layers
     */
    selectLayer(layerId, addToSelection = false) {
        if (addToSelection) {
            if (!this.selectedLayerIds.includes(layerId)) {
                this.selectedLayerIds.push(layerId);
            }
        } else {
            this.selectedLayerIds = [layerId];
        }
        this.setActiveLayer(layerId);
        this.emit('selectionChanged', this.selectedLayerIds);
    }
    
    /**
     * Deselect all layers
     */
    deselectAll() {
        this.selectedLayerIds = [];
        this.activeLayerId = null;
        this.emit('selectionChanged', []);
    }
    
    /**
     * Reorder layers
     */
    reorderLayer(layerId, newIndex) {
        const currentIndex = this.layers.findIndex(l => l.id === layerId);
        if (currentIndex !== -1 && currentIndex !== newIndex) {
            const [layer] = this.layers.splice(currentIndex, 1);
            this.layers.splice(newIndex, 0, layer);
            this.emit('layersChanged');
            this.emit('change', { key: 'layers', value: this.layers });
        }
    }
    
    /**
     * Set zoom level
     */
    setZoom(zoom) {
        this.zoom = Math.max(0.01, Math.min(32, zoom));
        this.emit('zoomChanged', this.zoom);
    }
    
    /**
     * Zoom in
     */
    zoomIn() {
        this.setZoom(this.zoom * 1.2);
    }
    
    /**
     * Zoom out
     */
    zoomOut() {
        this.setZoom(this.zoom / 1.2);
    }
    
    /**
     * Fit canvas to viewport
     */
    fitToScreen(containerWidth, containerHeight) {
        const zoomX = containerWidth / this.canvasWidth;
        const zoomY = containerHeight / this.canvasHeight;
        const zoom = Math.min(zoomX, zoomY, 1);
        this.setZoom(zoom);
        this.panX = (containerWidth - this.canvasWidth * zoom) / 2;
        this.panY = (containerHeight - this.canvasHeight * zoom) / 2;
        this.emit('viewportChanged');
    }
    
    /**
     * Reset viewport
     */
    resetViewport() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.emit('viewportChanged');
    }
    
    /**
     * Set adjustment value
     */
    setAdjustment(key, value) {
        this.adjustments[key] = value;
        this.emit('adjustmentsChanged', this.adjustments);
    }
    
    /**
     * Reset all adjustments
     */
    resetAdjustments() {
        this.adjustments = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            blur: 0,
        };
        this.emit('adjustmentsChanged', this.adjustments);
    }
    
    /**
     * Serialize state to JSON
     */
    toJSON() {
        return {
            canvasWidth: this.canvasWidth,
            canvasHeight: this.canvasHeight,
            backgroundColor: this.backgroundColor,
            layers: this.layers.map(l => l.toJSON()),
            adjustments: { ...this.adjustments },
            guides: { ...this.guides },
            projectName: this.projectName,
        };
    }
    
    /**
     * Load state from JSON
     */
    fromJSON(json) {
        const LayerClass = typeof Layer !== 'undefined' ? Layer : require('./models/Layer');
        
        this.canvasWidth = json.canvasWidth || 1920;
        this.canvasHeight = json.canvasHeight || 1080;
        this.backgroundColor = json.backgroundColor || '#ffffff';
        this.layers = (json.layers || []).map(l => LayerClass.fromJSON(l));
        this.adjustments = json.adjustments || { ...this.adjustments };
        this.guides = json.guides || { horizontal: [], vertical: [] };
        this.projectName = json.projectName || 'Untitled';
        this.selectedLayerIds = [];
        this.activeLayerId = null;
        
        this.emit('stateLoaded');
        this.emit('layersChanged');
        this.emit('change', { key: 'full', value: json });
    }
    
    /**
     * Save state to localStorage
     */
    saveToStorage() {
        try {
            const data = this.toJSON();
            localStorage.setItem('pixelforge_project', JSON.stringify(data));
            this.lastSaved = Date.now();
            this.emit('saved');
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    }
    
    /**
     * Load state from localStorage
     */
    loadFromStorage() {
        try {
            const data = localStorage.getItem('pixelforge_project');
            if (data) {
                const json = JSON.parse(data);
                this.fromJSON(json);
                return true;
            }
        } catch (e) {
            console.warn('Failed to load from localStorage:', e);
        }
        return false;
    }
    
    /**
     * Clear localStorage
     */
    clearStorage() {
        localStorage.removeItem('pixelforge_project');
    }
}

// Make globally available
if (typeof window !== 'undefined') {
    window.State = State;
}
