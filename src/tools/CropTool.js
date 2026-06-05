// PixelForge - Crop Tool

class CropTool extends BaseTool {
    constructor(canvasManager) {
        super('crop', canvasManager);
        this.cropRect = null;
        this.overlay = null;
        this.isResizing = false;
        this.resizeHandle = null;
    }
    
    onActivate() {
        this.createOverlay();
        this.initializeCropRect();
    }
    
    onDeactivate() {
        this.removeOverlay();
        this.cropRect = null;
    }
    
    createOverlay() {
        if (!this.overlay) {
            const container = document.getElementById('canvas-container');
            
            this.overlay = document.createElement('div');
            this.overlay.className = 'crop-overlay';
            
            const cropBox = document.createElement('div');
            cropBox.className = 'crop-box';
            cropBox.id = 'crop-box';
            
            // Add resize handles
            const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
            handles.forEach(h => {
                const handle = document.createElement('div');
                handle.className = `crop-handle ${h}`;
                handle.dataset.handle = h;
                handle.style.cssText = `
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background: white;
                    border: 1px solid black;
                    cursor: ${h}-resize;
                `;
                cropBox.appendChild(handle);
            });
            
            this.overlay.appendChild(cropBox);
            container.appendChild(this.overlay);
            
            // Add event listeners
            cropBox.addEventListener('pointerdown', (e) => this.onCropBoxDown(e));
        }
    }
    
    removeOverlay() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
    
    initializeCropRect() {
        // Start with full canvas
        this.cropRect = {
            x: 0,
            y: 0,
            width: this.state.canvasWidth,
            height: this.state.canvasHeight
        };
        this.updateOverlay();
    }
    
    updateOverlay() {
        if (!this.overlay || !this.cropRect) return;
        
        const cropBox = document.getElementById('crop-box');
        if (!cropBox) return;
        
        const zoom = this.state.zoom;
        
        cropBox.style.left = (this.cropRect.x * zoom) + 'px';
        cropBox.style.top = (this.cropRect.y * zoom) + 'px';
        cropBox.style.width = (this.cropRect.width * zoom) + 'px';
        cropBox.style.height = (this.cropRect.height * zoom) + 'px';
    }
    
    onCropBoxDown(e) {
        e.preventDefault();
        const target = e.target;
        
        if (target.classList.contains('crop-handle')) {
            this.isResizing = true;
            this.resizeHandle = target.dataset.handle;
        } else {
            this.isDragging = true;
        }
        
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.initialRect = { ...this.cropRect };
        
        const onMove = (moveEvent) => this.onCropBoxMove(moveEvent);
        const onUp = () => {
            this.isResizing = false;
            this.isDragging = false;
            this.resizeHandle = null;
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onUp);
        };
        
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    }
    
    onCropBoxMove(e) {
        const dx = (e.clientX - this.startX) / this.state.zoom;
        const dy = (e.clientY - this.startY) / this.state.zoom;
        
        if (this.isResizing && this.resizeHandle) {
            this.resizeCrop(dx, dy);
        } else if (this.isDragging) {
            this.cropRect.x = this.initialRect.x + dx;
            this.cropRect.y = this.initialRect.y + dy;
        }
        
        // Constrain to canvas bounds
        this.constrainCropRect();
        this.updateOverlay();
    }
    
    resizeCrop(dx, dy) {
        const h = this.resizeHandle;
        
        if (h.includes('e')) {
            this.cropRect.width = Math.max(50, this.initialRect.width + dx);
        }
        if (h.includes('w')) {
            const newWidth = Math.max(50, this.initialRect.width - dx);
            this.cropRect.x = this.initialRect.x + (this.initialRect.width - newWidth);
            this.cropRect.width = newWidth;
        }
        if (h.includes('s')) {
            this.cropRect.height = Math.max(50, this.initialRect.height + dy);
        }
        if (h.includes('n')) {
            const newHeight = Math.max(50, this.initialRect.height - dy);
            this.cropRect.y = this.initialRect.y + (this.initialRect.height - newHeight);
            this.cropRect.height = newHeight;
        }
    }
    
    constrainCropRect() {
        this.cropRect.x = Math.max(0, Math.min(this.cropRect.x, this.state.canvasWidth - this.cropRect.width));
        this.cropRect.y = Math.max(0, Math.min(this.cropRect.y, this.state.canvasHeight - this.cropRect.height));
        this.cropRect.width = Math.min(this.cropRect.width, this.state.canvasWidth - this.cropRect.x);
        this.cropRect.height = Math.min(this.cropRect.height, this.state.canvasHeight - this.cropRect.y);
    }
    
    onPointerDown(e, x, y) {
        super.onPointerDown(e, x, y);
        
        // If clicking outside crop box, reset
        if (!this.isPointInCrop(x, y)) {
            this.cropRect = {
                x: Math.max(0, x - 100),
                y: Math.max(0, y - 100),
                width: 200,
                height: 200
            };
            this.constrainCropRect();
            this.updateOverlay();
        }
    }
    
    isPointInCrop(x, y) {
        if (!this.cropRect) return false;
        return x >= this.cropRect.x && x <= this.cropRect.x + this.cropRect.width &&
               y >= this.cropRect.y && y <= this.cropRect.y + this.cropRect.height;
    }
    
    applyCrop() {
        if (!this.cropRect) return;
        
        const { x, y, width, height } = this.cropRect;
        
        // Create a new canvas with cropped content
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = width;
        croppedCanvas.height = height;
        const ctx = croppedCanvas.getContext('2d');
        
        // Draw each visible layer cropped
        this.state.layers.forEach(layer => {
            if (!layer.visible) return;
            
            layer.render();
            ctx.drawImage(
                layer.canvas,
                x - layer.x,
                y - layer.y,
                width,
                height,
                0,
                0,
                width,
                height
            );
        });
        
        // Update state
        this.state.setDimensions(width, height);
        
        // Replace layers with cropped version
        const croppedLayer = new Layer({
            type: 'image',
            name: 'Cropped Image',
            x: 0,
            y: 0,
            width: width,
            height: height,
            image: croppedCanvas
        });
        
        this.state.layers = [croppedLayer];
        this.state.emit('layersChanged');
        this.state.emit('canvasResized');
        
        // Deactivate crop tool
        this.canvasManager.setTool('move');
        this.canvasManager.render();
    }
    
    onKeyDown(e) {
        if (e.key === 'Enter' || e.key === 'Return') {
            this.applyCrop();
        } else if (e.key === 'Escape') {
            this.canvasManager.setTool('move');
        }
    }
}

window.CropTool = CropTool;
