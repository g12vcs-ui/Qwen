/**
 * Eraser Tool - For erasing content
 */

class EraserTool extends BaseTool {
    constructor(editor) {
        super('eraser', editor);
        this.cursor = 'cell';
        
        this.isErasing = false;
        this.lastPos = null;
        
        // Default eraser properties
        this.eraserSize = 20;
    }
    
    onPointerDown(event) {
        if (event.button !== 0) return;
        
        const pos = this.getCanvasCoordinates(event);
        this.isErasing = true;
        this.lastPos = pos;
        
        this.editor.history.saveState('Erase');
    }
    
    onPointerMove(event) {
        if (!this.isErasing) return;
        
        const pos = this.getCanvasCoordinates(event);
        
        // Erase from selected layers
        const selectedLayers = this.state.getSelectedLayers();
        
        if (selectedLayers.length > 0) {
            selectedLayers.forEach(layer => {
                if (layer.locked || !layer.visible) return;
                
                if (layer.type === 'image' && layer.image) {
                    this.eraseFromLayer(layer, this.lastPos, pos);
                }
            });
        }
        
        this.lastPos = pos;
    }
    
    onPointerUp(event) {
        this.isErasing = false;
        this.lastPos = null;
    }
    
    eraseFromLayer(layer, from, to) {
        // Create a temporary canvas to erase from the image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = layer.width;
        tempCanvas.height = layer.height;
        const ctx = tempCanvas.getContext('2d');
        
        // Draw current image
        ctx.drawImage(layer.image, 0, 0, layer.width, layer.height);
        
        // Set composite operation to erase
        ctx.globalCompositeOperation = 'destination-out';
        
        // Draw eraser circle(s)
        this.drawEraserLine(ctx, from, to, layer);
        
        // Update layer image
        layer.image = tempCanvas;
        layer.touch();
    }
    
    drawEraserLine(ctx, from, to, layer) {
        const dx = to.x - layer.x;
        const dy = to.y - layer.y;
        const fromX = from.x - layer.x;
        const fromY = from.y - layer.y;
        
        const distance = Math.sqrt((dx - fromX) ** 2 + (dy - fromY) ** 2);
        const steps = Math.max(1, distance / (this.eraserSize / 4));
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = fromX + (dx - fromX) * t;
            const y = fromY + (dy - fromY) * t;
            
            ctx.beginPath();
            ctx.arc(x, y, this.eraserSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    setEraserSize(size) {
        this.eraserSize = size;
    }
}

if (typeof window !== 'undefined') {
    window.EraserTool = EraserTool;
}
