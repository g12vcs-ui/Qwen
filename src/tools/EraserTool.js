// PixelForge - Eraser Tool

class EraserTool extends BaseTool {
    constructor(canvasManager) {
        super('eraser', canvasManager);
        this.erasingLayer = null;
        this.lastX = 0;
        this.lastY = 0;
    }
    
    onActivate() {
        // Select or create layer to erase on
    }
    
    onDeactivate() {
        this.erasingLayer = null;
    }
    
    getCursorStyle() {
        const size = this.state.brushSize || 20;
        return `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect x="0" y="0" width="${size}" height="${size}" fill="white" stroke="black" stroke-width="1"/></svg>') ${size/2} ${size/2}, crosshair`;
    }
    
    onPointerDown(e, x, y) {
        super.onPointerDown(e, x, y);
        
        // Find layer under cursor
        const layer = this.findLayerAtPoint(x, y);
        
        if (layer && layer.type === 'image' && layer.image) {
            this.erasingLayer = layer;
            this.eraseAt(x, y);
        } else {
            // Create transparent layer to erase on
            this.erasingLayer = new Layer({
                type: 'image',
                name: 'Erased Area',
                x: 0,
                y: 0,
                width: this.state.canvasWidth,
                height: this.state.canvasHeight
            });
            this.state.addLayer(this.erasingLayer);
            this.eraseAt(x, y);
        }
        
        this.canvasManager.render();
    }
    
    onPointerMove(e, x, y) {
        super.onPointerMove(e, x, y);
        
        if (!this.isDragging || !this.erasingLayer) return;
        
        this.eraseLine(this.lastX, this.lastY, x, y);
        this.canvasManager.render();
    }
    
    onPointerUp(e, x, y) {
        super.onPointerUp(e, x, y);
        this.erasingLayer = null;
    }
    
    eraseAt(x, y) {
        if (!this.erasingLayer) return;
        
        const ctx = this.erasingLayer.ctx;
        const size = this.state.brushSize || 20;
        
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        this.erasingLayer.dirty = true;
    }
    
    eraseLine(x1, y1, x2, y2) {
        if (!this.erasingLayer) return;
        
        const ctx = this.erasingLayer.ctx;
        const size = this.state.brushSize || 20;
        
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        this.erasingLayer.dirty = true;
    }
    
    onKeyDown(e) {
        // Adjust eraser size with keys
        if (e.key === '[') {
            this.state.brushSize = Math.max(1, (this.state.brushSize || 20) - 1);
            this.updateBrushSizeDisplay();
        } else if (e.key === ']') {
            this.state.brushSize = Math.min(100, (this.state.brushSize || 20) + 1);
            this.updateBrushSizeDisplay();
        }
    }
    
    updateBrushSizeDisplay() {
        const display = document.getElementById('brush-size-value');
        const slider = document.getElementById('brush-size');
        if (display) display.textContent = this.state.brushSize;
        if (slider) slider.value = this.state.brushSize;
    }
}

window.EraserTool = EraserTool;
