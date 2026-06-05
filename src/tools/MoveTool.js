// PixelForge - Move Tool

class MoveTool extends BaseTool {
    constructor(canvasManager) {
        super('move', canvasManager);
        this.draggedLayers = [];
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.transformMode = null; // 'move', 'scale', 'rotate'
        this.selectedHandle = null;
        this.initialBounds = null;
    }
    
    onActivate() {
        this.canvasManager.showTransformBox();
    }
    
    onDeactivate() {
        this.canvasManager.hideTransformBox();
        this.draggedLayers = [];
        this.transformMode = null;
    }
    
    getCursorStyle() {
        if (this.transformMode === 'scale') return 'nwse-resize';
        if (this.transformMode === 'rotate') return 'grab';
        return 'move';
    }
    
    onPointerDown(e, x, y) {
        super.onPointerDown(e, x, y);
        
        // Check for transform handle click
        const handle = this.canvasManager.getTransformHandleAtPoint(x, y);
        if (handle) {
            this.selectedHandle = handle;
            if (handle === 'rotate') {
                this.transformMode = 'rotate';
            } else {
                this.transformMode = 'scale';
            }
            this.initialBounds = this.getSelectedLayerBounds();
            return;
        }
        
        // Check for layer selection
        const layer = this.findLayerAtPoint(x, y);
        
        if (layer) {
            // Select layer
            const addToSelection = e.shiftKey;
            this.state.selectLayer(layer.id, addToSelection);
            
            // Start dragging
            this.draggedLayers = this.state.getSelectedLayers();
            if (this.draggedLayers.length > 0) {
                const firstLayer = this.draggedLayers[0];
                this.dragOffsetX = x - firstLayer.x;
                this.dragOffsetY = y - firstLayer.y;
            }
            
            this.transformMode = 'move';
            this.canvasManager.showTransformBox();
        } else {
            // Clicked on empty space - deselect
            this.state.deselectAll();
            this.canvasManager.hideTransformBox();
        }
    }
    
    onPointerMove(e, x, y) {
        super.onPointerMove(e, x, y);
        
        // Update cursor based on hover
        if (!this.isDragging) {
            const handle = this.canvasManager.getTransformHandleAtPoint(x, y);
            const layer = this.findLayerAtPoint(x, y);
            
            if (handle === 'rotate') {
                this.canvasManager.setCursor('grab');
            } else if (handle) {
                this.canvasManager.setCursor('nwse-resize');
            } else if (layer) {
                this.canvasManager.setCursor('move');
            } else {
                this.canvasManager.setCursor('default');
            }
            return;
        }
        
        const dx = x - this.lastX;
        const dy = y - this.lastY;
        
        if (this.transformMode === 'move' && this.draggedLayers.length > 0) {
            // Move layers
            this.state.beginBatch?.();
            this.draggedLayers.forEach(layer => {
                if (!layer.locked) {
                    layer.x += dx;
                    layer.y += dy;
                    layer.dirty = true;
                }
            });
            this.state.endBatch?.();
            this.canvasManager.updateTransformBox();
        } else if (this.transformMode === 'scale' && this.selectedHandle) {
            this.scaleSelectedLayer(x, y);
        } else if (this.transformMode === 'rotate') {
            this.rotateSelectedLayer(x, y);
        }
        
        this.canvasManager.render();
    }
    
    onPointerUp(e, x, y) {
        super.onPointerUp(e, x, y);
        this.state.endBatch?.();
        this.transformMode = null;
        this.selectedHandle = null;
        this.initialBounds = null;
    }
    
    scaleSelectedLayer(x, y) {
        const layers = this.state.getSelectedLayers();
        if (layers.length === 0 || !this.initialBounds) return;
        
        const bounds = this.initialBounds;
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        
        // Calculate scale based on handle
        let newWidth = bounds.width;
        let newHeight = bounds.height;
        let newX = bounds.x;
        let newY = bounds.y;
        
        const h = this.selectedHandle;
        
        if (h.includes('e')) {
            newWidth = x - bounds.x;
        }
        if (h.includes('w')) {
            newWidth = bounds.width + (bounds.x - x);
            newX = x;
        }
        if (h.includes('s')) {
            newHeight = y - bounds.y;
        }
        if (h.includes('n')) {
            newHeight = bounds.height + (bounds.y - y);
            newY = y;
        }
        
        // Maintain aspect ratio with Shift
        if (e.shiftKey && bounds.width > 0) {
            const aspect = bounds.height / bounds.width;
            if (h.includes('e') || h.includes('w')) {
                newHeight = newWidth * aspect;
                if (h.includes('n')) newY = bounds.y + (bounds.height - newHeight);
            } else {
                newWidth = newHeight / aspect;
                if (h.includes('w')) newX = bounds.x + (bounds.width - newWidth);
            }
        }
        
        // Apply to all selected layers
        const scaleX = newWidth / bounds.width;
        const scaleY = newHeight / bounds.height;
        
        layers.forEach(layer => {
            if (!layer.locked) {
                if (layer === layers[0]) {
                    layer.x = newX;
                    layer.y = newY;
                } else {
                    // Move relative to first layer
                    const relX = layer.x - bounds.x;
                    const relY = layer.y - bounds.y;
                    layer.x = newX + relX * scaleX;
                    layer.y = newY + relY * scaleY;
                }
                layer.width = Math.max(10, layer.width * scaleX);
                layer.height = Math.max(10, layer.height * scaleY);
                layer.dirty = true;
            }
        });
        
        this.canvasManager.updateTransformBox();
    }
    
    rotateSelectedLayer(x, y) {
        const layers = this.state.getSelectedLayers();
        if (layers.length === 0 || !this.initialBounds) return;
        
        const bounds = this.initialBounds;
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        
        const angle = Math.atan2(y - centerY, x - centerX);
        const degrees = PFUtils.radToDeg(angle) + 90; // Offset so top is 0
        
        layers.forEach(layer => {
            if (!layer.locked) {
                layer.rotation = PFUtils.degToRad(degrees);
                layer.dirty = true;
            }
        });
        
        this.canvasManager.updateTransformBox();
    }
    
    getSelectedLayerBounds() {
        const layers = this.state.getSelectedLayers();
        if (layers.length === 0) return null;
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        layers.forEach(layer => {
            minX = Math.min(minX, layer.x);
            minY = Math.min(minY, layer.y);
            maxX = Math.max(maxX, layer.x + layer.width);
            maxY = Math.max(maxY, layer.y + layer.height);
        });
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    
    onKeyDown(e) {
        const layers = this.state.getSelectedLayers();
        if (layers.length === 0) return;
        
        const step = e.shiftKey ? 10 : 1;
        let moved = false;
        
        switch (e.key) {
            case 'ArrowUp':
                layers.forEach(l => { if (!l.locked) { l.y -= step; l.dirty = true; } });
                moved = true;
                break;
            case 'ArrowDown':
                layers.forEach(l => { if (!l.locked) { l.y += step; l.dirty = true; } });
                moved = true;
                break;
            case 'ArrowLeft':
                layers.forEach(l => { if (!l.locked) { l.x -= step; l.dirty = true; } });
                moved = true;
                break;
            case 'ArrowRight':
                layers.forEach(l => { if (!l.locked) { l.x += step; l.dirty = true; } });
                moved = true;
                break;
            case 'Delete':
            case 'Backspace':
                layers.forEach(l => this.state.removeLayer(l.id));
                moved = true;
                break;
        }
        
        if (moved) {
            this.state.emit('layersChanged');
            this.canvasManager.updateTransformBox();
            this.canvasManager.render();
        }
    }
}

window.MoveTool = MoveTool;
