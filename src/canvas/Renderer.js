// PixelForge - Canvas Renderer

class Renderer {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.state = canvasManager.state;
        this.canvas = document.getElementById('main-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.needsRender = true;
        this.animationFrameId = null;
        
        // Handle high DPI displays
        this.setupHiDPI();
    }
    
    setupHiDPI() {
        const dpr = window.devicePixelRatio || 1;
        
        // Set actual size in pixels (scaled to account for extra pixel density)
        this.canvas.style.width = this.state.canvasWidth + 'px';
        this.canvas.style.height = this.state.canvasHeight + 'px';
        this.canvas.width = this.state.canvasWidth * dpr;
        this.canvas.height = this.state.canvasHeight * dpr;
        
        // Normalize coordinate system to use CSS pixels
        this.ctx.scale(dpr, dpr);
        
        this.dpr = dpr;
    }
    
    resize() {
        this.setupHiDPI();
        this.requestRender();
    }
    
    requestRender() {
        if (!this.needsRender) {
            this.needsRender = true;
            this.animationFrameId = requestAnimationFrame(() => this.render());
        }
    }
    
    render() {
        if (!this.needsRender) return;
        this.needsRender = false;
        this.animationFrameId = null;
        
        const ctx = this.ctx;
        const width = this.state.canvasWidth;
        const height = this.state.canvasHeight;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw background
        this.drawBackground();
        
        // Draw layers
        this.drawLayers();
        
        // Draw overlays (selection, guides, etc.)
        this.drawOverlays();
    }
    
    drawBackground() {
        const ctx = this.ctx;
        const width = this.state.canvasWidth;
        const height = this.state.canvasHeight;
        
        if (this.state.backgroundColor === 'transparent' || !this.state.backgroundColor) {
            // Draw checkerboard pattern for transparency
            PFUtils.drawCheckerboard(ctx, width, height, 10);
        } else {
            ctx.fillStyle = this.state.backgroundColor;
            ctx.fillRect(0, 0, width, height);
        }
    }
    
    drawLayers() {
        const ctx = this.ctx;
        
        this.state.layers.forEach(layer => {
            if (!layer.visible) return;
            
            // Render layer content if dirty
            layer.render();
            
            // Save context state
            ctx.save();
            
            // Apply layer transformations
            ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
            ctx.rotate(layer.rotation);
            ctx.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
            ctx.scale(layer.scaleX, layer.scaleY);
            ctx.translate(-(layer.x + layer.width / 2), -(layer.y + layer.height / 2));
            
            // Apply opacity
            ctx.globalAlpha = layer.opacity;
            
            // Apply blend mode
            ctx.globalCompositeOperation = layer.blendMode || 'source-over';
            
            // Apply adjustments filter for image layers
            if (layer.type === 'image' && layer.image) {
                ctx.filter = PFUtils.getFilterString(layer.adjustments);
            }
            
            // Draw layer canvas
            const drawX = layer.x + (layer.canvas.width - layer.width) / 2;
            const drawY = layer.y + (layer.canvas.height - layer.height) / 2;
            
            ctx.drawImage(layer.canvas, drawX, drawY);
            
            // Restore context
            ctx.restore();
        });
    }
    
    drawOverlays() {
        // Draw selection outlines
        const selectedLayers = this.state.getSelectedLayers();
        
        selectedLayers.forEach(layer => {
            this.drawSelectionOutline(layer);
        });
    }
    
    drawSelectionOutline(layer) {
        const ctx = this.ctx;
        const bounds = layer.getBounds();
        
        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2 / this.state.zoom;
        ctx.setLineDash([5 / this.state.zoom, 3 / this.state.zoom]);
        
        ctx.translate(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        ctx.rotate(bounds.rotation);
        ctx.strokeRect(-bounds.width / 2, -bounds.height / 2, bounds.width, bounds.height);
        
        ctx.restore();
    }
    
    clear() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

window.Renderer = Renderer;
