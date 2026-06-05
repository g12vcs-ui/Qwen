// PixelForge - Base Tool Class

class BaseTool {
    constructor(name, canvasManager) {
        this.name = name;
        this.canvasManager = canvasManager;
        this.state = canvasManager.state;
        this.isActive = false;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.lastX = 0;
        this.lastY = 0;
    }
    
    activate() {
        this.isActive = true;
        this.onActivate();
    }
    
    deactivate() {
        this.isActive = false;
        this.onDeactivate();
    }
    
    onActivate() {
        // Override in subclass
    }
    
    onDeactivate() {
        // Override in subclass
    }
    
    onPointerDown(e, x, y) {
        this.isDragging = true;
        this.startX = x;
        this.startY = y;
        this.lastX = x;
        this.lastY = y;
    }
    
    onPointerMove(e, x, y) {
        this.lastX = x;
        this.lastY = y;
    }
    
    onPointerUp(e, x, y) {
        this.isDragging = false;
    }
    
    onDoubleClick(e, x, y) {
        // Override in subclass
    }
    
    onKeyDown(e) {
        // Override in subclass
    }
    
    onKeyUp(e) {
        // Override in subclass
    }
    
    getCursorStyle() {
        return 'default';
    }
    
    // Helper: Get canvas coordinates from event
    getCanvasCoords(e) {
        return this.canvasManager.getCanvasCoords(e);
    }
    
    // Helper: Check if point hits a layer
    hitTestLayer(x, y, layer) {
        if (!layer || !layer.visible) return false;
        return layer.hitTest(x, y);
    }
    
    // Helper: Find topmost layer at point
    findLayerAtPoint(x, y) {
        for (let i = this.state.layers.length - 1; i >= 0; i--) {
            const layer = this.state.layers[i];
            if (layer.visible && !layer.locked && this.hitTestLayer(x, y, layer)) {
                return layer;
            }
        }
        return null;
    }
}

window.BaseTool = BaseTool;
