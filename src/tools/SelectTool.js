/**
 * Select Tool - For making selections on the canvas
 */

class SelectTool extends BaseTool {
    constructor(editor) {
        super('select', editor);
        this.cursor = 'crosshair';
        
        this.isSelecting = false;
        this.selectionStart = { x: 0, y: 0 };
        this.selectionEnd = { x: 0, y: 0 };
        
        // Selection marquee element
        this.marquee = document.createElement('div');
        this.marquee.className = 'selection-marquee';
        this.marquee.style.display = 'none';
    }
    
    onActivate() {
        document.getElementById('canvasOverlay').appendChild(this.marquee);
    }
    
    onDeactivate() {
        this.marquee.style.display = 'none';
    }
    
    onPointerDown(event) {
        if (event.button !== 0) return;
        
        const pos = this.getCanvasCoordinates(event);
        this.isSelecting = true;
        this.selectionStart = pos;
        this.selectionEnd = pos;
        
        this.marquee.style.display = 'block';
        this.updateMarquee();
    }
    
    onPointerMove(event) {
        if (!this.isSelecting) return;
        
        this.selectionEnd = this.getCanvasCoordinates(event);
        this.updateMarquee();
    }
    
    onPointerUp(event) {
        if (!this.isSelecting) return;
        
        this.isSelecting = false;
        
        // Get layers within selection
        const selection = this.getSelectionRect();
        const layersInSelection = this.state.layers.filter(layer => {
            if (!layer.visible || layer.locked) return false;
            
            const bounds = layer.getBounds();
            return this.rectsIntersect(selection, bounds);
        });
        
        // Select found layers
        if (layersInSelection.length > 0) {
            const modifiers = this.getModifiers(event);
            if (modifiers.shift) {
                // Add to selection
                layersInSelection.forEach(layer => {
                    this.state.selectLayer(layer.id, true);
                });
            } else {
                // Replace selection with first found
                this.state.selectLayer(layersInSelection[0].id, false);
            }
        }
        
        this.marquee.style.display = 'none';
    }
    
    updateMarquee() {
        const rect = this.getSelectionRect();
        const zoom = this.state.zoom;
        
        this.marquee.style.left = `${rect.x * zoom}px`;
        this.marquee.style.top = `${rect.y * zoom}px`;
        this.marquee.style.width = `${rect.width * zoom}px`;
        this.marquee.style.height = `${rect.height * zoom}px`;
    }
    
    getSelectionRect() {
        const x = Math.min(this.selectionStart.x, this.selectionEnd.x);
        const y = Math.min(this.selectionStart.y, this.selectionEnd.y);
        const width = Math.abs(this.selectionEnd.x - this.selectionStart.x);
        const height = Math.abs(this.selectionEnd.y - this.selectionStart.y);
        
        return { x, y, width, height };
    }
    
    rectsIntersect(a, b) {
        return !(a.x + a.width < b.x || b.x + b.width < a.x ||
                 a.y + a.height < b.y || b.y + b.height < a.y);
    }
}

if (typeof window !== 'undefined') {
    window.SelectTool = SelectTool;
}
