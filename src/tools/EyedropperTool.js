// PixelForge - Eyedropper Tool

class EyedropperTool extends BaseTool {
    constructor(canvasManager) {
        super('eyedropper', canvasManager);
    }
    
    getCursorStyle() {
        return 'crosshair';
    }
    
    onPointerDown(e, x, y) {
        super.onPointerDown(e, x, y);
        
        const color = this.getPixelColor(x, y);
        
        if (color) {
            // Set as fill color
            this.state.fillColor = color;
            
            // Update UI
            const fillColorInput = document.getElementById('fill-color');
            if (fillColorInput) {
                fillColorInput.value = color;
            }
            
            // Show feedback
            this.showColorFeedback(color);
        }
    }
    
    getPixelColor(x, y) {
        // Create temporary canvas to composite all visible layers
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.state.canvasWidth;
        tempCanvas.height = this.state.canvasHeight;
        const ctx = tempCanvas.getContext('2d');
        
        // Fill with background
        if (this.state.backgroundColor && this.state.backgroundColor !== 'transparent') {
            ctx.fillStyle = this.state.backgroundColor;
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        }
        
        // Draw visible layers
        this.state.layers.forEach(layer => {
            if (!layer.visible) return;
            layer.render();
            ctx.drawImage(layer.canvas, layer.x, layer.y);
        });
        
        // Get pixel color
        try {
            const imageData = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1);
            const data = imageData.data;
            
            if (data[3] === 0) {
                return null; // Transparent
            }
            
            return this.rgbToHex(data[0], data[1], data[2]);
        } catch (e) {
            console.warn('Could not get pixel color:', e);
            return null;
        }
    }
    
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
    
    showColorFeedback(color) {
        // Create a small flash effect
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            width: 40px;
            height: 40px;
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            animation: fadeOut 0.5s ease-out forwards;
        `;
        
        // Position at cursor
        feedback.style.left = (this.lastX * this.state.zoom + 200) + 'px';
        feedback.style.top = (this.lastY * this.state.zoom + 100) + 'px';
        
        document.body.appendChild(feedback);
        
        setTimeout(() => feedback.remove(), 500);
    }
}

window.EyedropperTool = EyedropperTool;
