/**
 * Shape Tool - For adding geometric shapes
 */

class ShapeTool extends BaseTool {
    constructor(editor) {
        super('shape', editor);
        this.cursor = 'crosshair';
        
        this.isDrawing = false;
        this.startPos = { x: 0, y: 0 };
        this.currentShape = null;
        
        // Default shape properties
        this.shapeType = 'rectangle';
        this.defaultShape = {
            fillColor: '#6366f1',
            strokeColor: null,
            strokeWidth: 0,
            cornerRadius: 0,
        };
    }
    
    onActivate() {
        // Could show shape options panel here
    }
    
    setShapeType(type) {
        this.shapeType = type;
    }
    
    onPointerDown(event) {
        if (event.button !== 0) return;
        
        const pos = this.getCanvasCoordinates(event);
        this.isDrawing = true;
        this.startPos = pos;
        
        const LayerClass = window.Layer || Layer;
        
        // Create new shape layer
        this.currentShape = new LayerClass({
            type: 'shape',
            name: `Shape (${this.shapeType})`,
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            shapeType: this.shapeType,
            ...this.defaultShape,
        });
        
        this.editor.history.saveState('Add Shape');
        this.state.addLayer(this.currentShape);
    }
    
    onPointerMove(event) {
        if (!this.isDrawing || !this.currentShape) return;
        
        const pos = this.getCanvasCoordinates(event);
        const modifiers = this.getModifiers(event);
        
        let x = Math.min(this.startPos.x, pos.x);
        let y = Math.min(this.startPos.y, pos.y);
        let width = Math.abs(pos.x - this.startPos.x);
        let height = Math.abs(pos.y - this.startPos.y);
        
        // Maintain aspect ratio with shift
        if (modifiers.shift && this.shapeType !== 'line') {
            const size = Math.max(width, height);
            width = size;
            height = size;
            
            // Adjust position to maintain start point
            if (pos.x < this.startPos.x) x = this.startPos.x - size;
            if (pos.y < this.startPos.y) y = this.startPos.y - size;
        }
        
        this.currentShape.x = x;
        this.currentShape.y = y;
        this.currentShape.width = Math.max(1, width);
        this.currentShape.height = Math.max(1, height);
        this.currentShape.touch();
    }
    
    onPointerUp(event) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        this.currentShape = null;
    }
    
    onKeyDown(event) {
        // Delete selected shape layers
        if ((event.key === 'Delete' || event.key === 'Backspace') && !this.isDrawing) {
            const selectedLayers = this.state.getSelectedLayers();
            if (selectedLayers.length > 0) {
                this.editor.history.saveState('Delete Shape');
                selectedLayers.forEach(layer => {
                    if (layer.type === 'shape') {
                        this.state.removeLayer(layer.id);
                    }
                });
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.ShapeTool = ShapeTool;
}
