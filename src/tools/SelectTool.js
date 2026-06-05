// PixelForge - Select Tool (Rectangle Selection)

class SelectTool extends BaseTool {
    constructor(canvasManager) {
        super('select', canvasManager);
        this.selectionRect = null;
        this.marqueeElement = null;
    }
    
    onActivate() {
        this.createMarquee();
    }
    
    onDeactivate() {
        this.removeMarquee();
        this.selectionRect = null;
    }
    
    createMarquee() {
        if (!this.marqueeElement) {
            this.marqueeElement = document.createElement('div');
            this.marqueeElement.className = 'selection-marquee';
            this.marqueeElement.style.display = 'none';
            document.getElementById('canvas-container').appendChild(this.marqueeElement);
        }
    }
    
    removeMarquee() {
        if (this.marqueeElement) {
            this.marqueeElement.remove();
            this.marqueeElement = null;
        }
    }
    
    getCursorStyle() {
        return 'crosshair';
    }
    
    onPointerDown(e, x, y) {
        super.onPointerDown(e, x, y);
        this.selectionRect = { x, y, width: 0, height: 0 };
        this.updateMarquee();
    }
    
    onPointerMove(e, x, y) {
        super.onPointerMove(e, x, y);
        
        if (this.isDragging && this.selectionRect) {
            this.selectionRect.width = x - this.startX;
            this.selectionRect.height = y - this.startY;
            this.updateMarquee();
        }
    }
    
    onPointerUp(e, x, y) {
        super.onPointerUp(e, x, y);
        
        if (this.selectionRect && Math.abs(this.selectionRect.width) > 5 && Math.abs(this.selectionRect.height) > 5) {
            // Select layers within rectangle
            const rect = this.normalizeRect(this.selectionRect);
            this.selectLayersInRect(rect);
        } else {
            // Click without drag - deselect
            this.state.deselectAll();
        }
        
        this.selectionRect = null;
        this.hideMarquee();
    }
    
    normalizeRect(rect) {
        return {
            x: rect.width < 0 ? rect.x + rect.width : rect.x,
            y: rect.height < 0 ? rect.y + rect.height : rect.y,
            width: Math.abs(rect.width),
            height: Math.abs(rect.height)
        };
    }
    
    updateMarquee() {
        if (!this.marqueeElement || !this.selectionRect) return;
        
        const rect = this.normalizeRect(this.selectionRect);
        const zoom = this.state.zoom;
        const container = document.getElementById('canvas-container');
        const containerRect = container.getBoundingClientRect();
        
        this.marqueeElement.style.display = 'block';
        this.marqueeElement.style.left = (rect.x * zoom + containerRect.left - container.offsetParent.getBoundingClientRect().left) + 'px';
        this.marqueeElement.style.top = (rect.y * zoom + containerRect.top - container.offsetParent.getBoundingClientRect().top) + 'px';
        this.marqueeElement.style.width = (rect.width * zoom) + 'px';
        this.marqueeElement.style.height = (rect.height * zoom) + 'px';
    }
    
    hideMarquee() {
        if (this.marqueeElement) {
            this.marqueeElement.style.display = 'none';
        }
    }
    
    selectLayersInRect(rect) {
        const addToSelection = event?.shiftKey;
        
        if (!addToSelection) {
            this.state.deselectAll();
        }
        
        this.state.layers.forEach(layer => {
            if (!layer.visible || layer.locked) return;
            
            const layerBounds = layer.getBounds();
            
            // Check if layer intersects with selection rect
            if (rect.x < layerBounds.x + layerBounds.width &&
                rect.x + rect.width > layerBounds.x &&
                rect.y < layerBounds.y + layerBounds.height &&
                rect.y + rect.height > layerBounds.y) {
                this.state.selectLayer(layer.id, true);
            }
        });
    }
    
    onKeyDown(e) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const layers = this.state.getSelectedLayers();
            layers.forEach(l => this.state.removeLayer(l.id));
            this.canvasManager.render();
        }
    }
}

window.SelectTool = SelectTool;
