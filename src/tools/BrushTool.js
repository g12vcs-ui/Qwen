// PixelForge - Brush Tool

class BrushTool extends BaseTool {
    constructor(canvasManager) {
        super('brush', canvasManager);
        this.drawingLayer = null;
        this.lastPoints = [];
        this.smoothing = 0.5;
    }
    
    onActivate() {
        // Create or get brush layer
    }
    
    onDeactivate() {
        this.drawingLayer = null;
        this.lastPoints = [];
    }
    
    getCursorStyle() {
        const size = this.state.brushSize || 10;
        return `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="%233b82f6" opacity="0.5"/></svg>') ${size/2} ${size/2}, crosshair`;
    }
    
    onPointerDown(e, x, y) {
        super.onPointerDown(e, x, y);
        
        // Create a new drawing layer for this stroke
        this.drawingLayer = new Layer({
            type: 'image',
            name: 'Brush Stroke',
            x: 0,
            y: 0,
            width: this.state.canvasWidth,
            height: this.state.canvasHeight
        });
        
        this.lastPoints = [{ x, y }];
        
        // Draw initial point
        this.drawPoint(x, y);
        
        this.state.addLayer(this.drawingLayer);
        this.canvasManager.render();
    }
    
    onPointerMove(e, x, y) {
        super.onPointerMove(e, x, y);
        
        if (!this.isDragging || !this.drawingLayer) return;
        
        // Apply smoothing
        const smoothedX = this.lastX + (x - this.lastX) * this.smoothing;
        const smoothedY = this.lastY + (y - this.lastY) * this.smoothing;
        
        this.drawLine(this.lastX, this.lastY, smoothedX, smoothedY);
        this.lastPoints.push({ x: smoothedX, y: smoothedY });
        
        this.canvasManager.render();
    }
    
    onPointerUp(e, x, y) {
        super.onPointerUp(e, x, y);
        this.drawingLayer = null;
        this.lastPoints = [];
    }
    
    drawPoint(x, y) {
        if (!this.drawingLayer) return;
        
        const ctx = this.drawingLayer.ctx;
        const size = this.state.brushSize || 10;
        const opacity = this.state.brushOpacity || 1;
        const color = this.state.fillColor || '#000000';
        
        ctx.fillStyle = this.hexToRgba(color, opacity);
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        this.drawingLayer.dirty = true;
    }
    
    drawLine(x1, y1, x2, y2) {
        if (!this.drawingLayer) return;
        
        const ctx = this.drawingLayer.ctx;
        const size = this.state.brushSize || 10;
        const opacity = this.state.brushOpacity || 1;
        const color = this.state.fillColor || '#000000';
        
        ctx.strokeStyle = this.hexToRgba(color, opacity);
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        this.drawingLayer.dirty = true;
    }
    
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    onKeyDown(e) {
        // Adjust brush size with keys
        if (e.key === '[') {
            this.state.brushSize = Math.max(1, (this.state.brushSize || 10) - 1);
            this.updateBrushSizeDisplay();
        } else if (e.key === ']') {
            this.state.brushSize = Math.min(100, (this.state.brushSize || 10) + 1);
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

window.BrushTool = BrushTool;
