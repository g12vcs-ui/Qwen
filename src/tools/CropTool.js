/**
 * Crop Tool - For cropping the canvas or layers
 */

class CropTool extends BaseTool {
    constructor(editor) {
        super('crop', editor);
        this.cursor = 'crosshair';
        
        this.isCropping = false;
        this.cropStart = { x: 0, y: 0 };
        this.cropEnd = { x: 0, y: 0 };
        this.showCropOverlay = false;
        
        // Crop overlay element
        this.overlay = document.createElement('div');
        this.overlay.className = 'crop-overlay';
        this.overlay.style.cssText = `
            position: absolute;
            display: none;
            border: 2px dashed #6366f1;
            background: rgba(99, 102, 241, 0.1);
            pointer-events: none;
            z-index: 100;
        `;
    }
    
    onActivate() {
        document.getElementById('canvasContainer').appendChild(this.overlay);
    }
    
    onDeactivate() {
        this.hideOverlay();
    }
    
    showOverlay() {
        this.overlay.style.display = 'block';
        this.showCropOverlay = true;
    }
    
    hideOverlay() {
        this.overlay.style.display = 'none';
        this.showCropOverlay = false;
    }
    
    updateOverlay() {
        const zoom = this.state.zoom;
        const x = Math.min(this.cropStart.x, this.cropEnd.x);
        const y = Math.min(this.cropStart.y, this.cropEnd.y);
        const width = Math.abs(this.cropEnd.x - this.cropStart.x);
        const height = Math.abs(this.cropEnd.y - this.cropStart.y);
        
        this.overlay.style.left = `${x * zoom}px`;
        this.overlay.style.top = `${y * zoom}px`;
        this.overlay.style.width = `${width * zoom}px`;
        this.overlay.style.height = `${height * zoom}px`;
    }
    
    onPointerDown(event) {
        if (event.button !== 0) return;
        
        const pos = this.getCanvasCoordinates(event);
        this.isCropping = true;
        this.cropStart = pos;
        this.cropEnd = pos;
        
        this.showOverlay();
        this.updateOverlay();
    }
    
    onPointerMove(event) {
        if (!this.isCropping) return;
        
        this.cropEnd = this.getCanvasCoordinates(event);
        this.updateOverlay();
    }
    
    onPointerUp(event) {
        if (!this.isCropping) return;
        
        this.isCropping = false;
        
        // Apply crop
        const cropRect = this.getCropRect();
        
        if (cropRect.width > 10 && cropRect.height > 10) {
            this.applyCrop(cropRect);
        }
        
        this.hideOverlay();
    }
    
    getCropRect() {
        return {
            x: Math.min(this.cropStart.x, this.cropEnd.x),
            y: Math.min(this.cropStart.y, this.cropEnd.y),
            width: Math.abs(this.cropEnd.x - this.cropStart.x),
            height: Math.abs(this.cropEnd.y - this.cropStart.y),
        };
    }
    
    applyCrop(cropRect) {
        this.editor.history.saveState('Crop Canvas');
        
        // Update canvas size
        this.state.canvasWidth = cropRect.width;
        this.state.canvasHeight = cropRect.height;
        
        // Move and clip layers
        this.state.layers.forEach(layer => {
            layer.x -= cropRect.x;
            layer.y -= cropRect.y;
            
            // Clip layer to new canvas bounds
            if (layer.x < 0) {
                layer.width += layer.x;
                layer.x = 0;
            }
            if (layer.y < 0) {
                layer.height += layer.y;
                layer.y = 0;
            }
            if (layer.x + layer.width > cropRect.width) {
                layer.width = cropRect.width - layer.x;
            }
            if (layer.y + layer.height > cropRect.height) {
                layer.height = cropRect.height - layer.y;
            }
            
            layer.touch();
        });
        
        this.state.emit('change', { key: 'canvasSize', value: { width: cropRect.width, height: cropRect.height } });
    }
    
    onKeyDown(event) {
        if (event.key === 'Escape') {
            this.isCropping = false;
            this.hideOverlay();
        } else if (event.key === 'Enter') {
            if (this.isCropping) {
                this.applyCrop(this.getCropRect());
                this.isCropping = false;
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.CropTool = CropTool;
}
