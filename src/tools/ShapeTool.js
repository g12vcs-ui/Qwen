// PixelForge - Shape Tool

class ShapeTool extends BaseTool {
    constructor(canvasManager) {
        super('shape', canvasManager);
        this.currentShape = null;
        this.shapeType = 'rect'; // rect, ellipse, polygon
    }
    
    onActivate() {
        // Could show shape type selector
    }
    
    onDeactivate() {
        this.currentShape = null;
    }
    
    getCursorStyle() {
        return 'crosshair';
    }
    
    setShapeType(type) {
        this.shapeType = type;
    }
    
    onPointerDown(e, x, y) {
        super.onPointerDown(e, x, y);
        
        const fillColor = this.state.fillColor || '#3b82f6';
        const strokeColor = this.state.strokeColor || null;
        
        this.currentShape = new Layer({
            type: 'shape',
            name: this.shapeType.charAt(0).toUpperCase() + this.shapeType.slice(1),
            x: x,
            y: y,
            width: 0,
            height: 0,
            fillColor: fillColor,
            strokeColor: strokeColor,
            strokeWidth: 2,
            shapeType: this.shapeType,
            cornerRadius: 0
        });
        
        if (this.shapeType === 'polygon') {
            this.currentShape.points = [
                { x: 0.5, y: 0 },
                { x: 1, y: 0.5 },
                { x: 0.5, y: 1 },
                { x: 0, y: 0.5 }
            ];
        }
    }
    
    onPointerMove(e, x, y) {
        super.onPointerMove(e, x, y);
        
        if (!this.isDragging || !this.currentShape) return;
        
        const dx = x - this.startX;
        const dy = y - this.startY;
        
        // Handle negative dimensions
        if (dx < 0) {
            this.currentShape.x = this.startX;
            this.currentShape.width = Math.abs(dx);
        } else {
            this.currentShape.width = dx;
        }
        
        if (dy < 0) {
            this.currentShape.y = this.startY;
            this.currentShape.height = Math.abs(dy);
        } else {
            this.currentShape.height = dy;
        }
        
        // Maintain aspect ratio with Shift
        if (e.shiftKey) {
            const size = Math.max(this.currentShape.width, this.currentShape.height);
            this.currentShape.width = size;
            this.currentShape.height = size;
            
            if (dx < 0 && dy < 0) {
                this.currentShape.x = this.startX;
                this.currentShape.y = this.startY;
            } else if (dx < 0) {
                this.currentShape.x = this.startX;
            } else if (dy < 0) {
                this.currentShape.y = this.startY;
            }
        }
        
        this.currentShape.dirty = true;
        this.canvasManager.render();
    }
    
    onPointerUp(e, x, y) {
        super.onPointerUp(e, x, y);
        
        if (this.currentShape && this.currentShape.width > 5 && this.currentShape.height > 5) {
            this.state.addLayer(this.currentShape);
            this.canvasManager.render();
        }
        
        this.currentShape = null;
    }
    
    onKeyDown(e) {
        // Quick shape type switching
        switch (e.key.toLowerCase()) {
            case 'r':
                this.shapeType = 'rect';
                break;
            case 'e':
                this.shapeType = 'ellipse';
                break;
        }
    }
}

window.ShapeTool = ShapeTool;
