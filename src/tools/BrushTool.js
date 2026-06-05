/**
 * Brush Tool - For freehand drawing
 */

class BrushTool extends BaseTool {
    constructor(editor) {
        super('brush', editor);
        this.cursor = 'crosshair';
        
        this.isDrawing = false;
        this.lastPos = null;
        this.currentPath = [];
        this.brushCanvas = null;
        this.brushCtx = null;
        
        // Default brush properties
        this.brushSize = 5;
        this.brushColor = '#ffffff';
        this.brushOpacity = 1;
        this.brushHardness = 1;
    }
    
    onActivate() {
        this.createBrushCanvas();
    }
    
    createBrushCanvas() {
        if (this.brushCanvas) return;
        
        this.brushCanvas = document.createElement('canvas');
        const size = 100;
        this.brushCanvas.width = size;
        this.brushCanvas.height = size;
        this.brushCtx = this.brushCanvas.getContext('2d');
        
        // Create brush tip
        this.updateBrushTip();
    }
    
    updateBrushTip() {
        if (!this.brushCtx) return;
        
        const size = 100;
        const ctx = this.brushCtx;
        const radius = (this.brushSize / 2) * (size / 20);
        
        ctx.clearRect(0, 0, size, size);
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, radius, 0, Math.PI * 2);
        
        if (this.brushHardness < 1) {
            const gradient = ctx.createRadialGradient(
                size / 2, size / 2, 0,
                size / 2, size / 2, radius
            );
            gradient.addColorStop(0, `rgba(0, 0, 0, ${this.brushOpacity})`);
            gradient.addColorStop(this.brushHardness, `rgba(0, 0, 0, ${this.brushOpacity})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = `rgba(0, 0, 0, ${this.brushOpacity})`;
        }
        
        ctx.fill();
    }
    
    onPointerDown(event) {
        if (event.button !== 0) return;
        
        const pos = this.getCanvasCoordinates(event);
        this.isDrawing = true;
        this.lastPos = pos;
        this.currentPath = [pos];
        
        // Create new brush layer
        const LayerClass = window.Layer || Layer;
        
        this.brushLayer = new LayerClass({
            type: 'brush',
            name: 'Brush Stroke',
            x: 0,
            y: 0,
            width: this.state.canvasWidth,
            height: this.state.canvasHeight,
        });
        
        // Create canvas for this stroke
        this.strokeCanvas = Utils.createCanvas(this.state.canvasWidth, this.state.canvasHeight);
        this.strokeCtx = this.strokeCanvas.getContext('2d');
        
        this.editor.history.saveState('Brush Stroke');
        this.state.addLayer(this.brushLayer);
        
        // Draw initial point
        this.drawAt(pos);
    }
    
    onPointerMove(event) {
        if (!this.isDrawing) return;
        
        const pos = this.getCanvasCoordinates(event);
        
        // Draw line from last position
        this.drawLine(this.lastPos, pos);
        this.currentPath.push(pos);
        this.lastPos = pos;
    }
    
    onPointerUp(event) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        
        // Convert stroke canvas to image
        if (this.brushLayer && this.strokeCanvas) {
            this.brushLayer.image = this.strokeCanvas;
            this.brushLayer.touch();
        }
        
        this.strokeCanvas = null;
        this.strokeCtx = null;
        this.brushLayer = null;
    }
    
    drawAt(pos) {
        if (!this.strokeCtx) return;
        
        this.strokeCtx.fillStyle = this.brushColor;
        this.strokeCtx.beginPath();
        this.strokeCtx.arc(pos.x, pos.y, this.brushSize / 2, 0, Math.PI * 2);
        this.strokeCtx.fill();
    }
    
    drawLine(from, to) {
        if (!this.strokeCtx) return;
        
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.max(1, distance / (this.brushSize / 4));
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = from.x + dx * t;
            const y = from.y + dy * t;
            this.drawAt({ x, y });
        }
    }
    
    setBrushSize(size) {
        this.brushSize = size;
        this.updateBrushTip();
    }
    
    setBrushColor(color) {
        this.brushColor = color;
    }
    
    setBrushOpacity(opacity) {
        this.brushOpacity = opacity;
        this.updateBrushTip();
    }
}

if (typeof window !== 'undefined') {
    window.BrushTool = BrushTool;
}
