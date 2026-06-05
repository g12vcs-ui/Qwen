/**
 * Eyedropper Tool - For sampling colors from the canvas
 */

class EyedropperTool extends BaseTool {
    constructor(editor) {
        super('eyedropper', editor);
        this.cursor = 'crosshair';
        
        this.sampleSize = 1; // 1x1, 3x3, 5x5 average
    }
    
    onPointerDown(event) {
        if (event.button !== 0) return;
        
        const pos = this.getCanvasCoordinates(event);
        this.sampleColor(pos.x, pos.y);
    }
    
    sampleColor(x, y) {
        // Get pixel data from renderer
        const pixelData = this.editor.renderer.getPixelData(x, y);
        
        if (pixelData) {
            const color = this.rgbToHex(pixelData.r, pixelData.g, pixelData.b);
            
            // Set as current brush/text color
            if (this.editor.tools.brush) {
                this.editor.tools.brush.setBrushColor(color);
            }
            
            // Update UI color picker if available
            this.updateUIColorPicker(color);
            
            // Show color preview
            this.showColorPreview(color, pixelData);
        }
    }
    
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
    
    updateUIColorPicker(color) {
        const colorInput = document.querySelector('.color-input');
        if (colorInput) {
            colorInput.value = color;
        }
    }
    
    showColorPreview(color, pixelData) {
        // Could show a toast/notification with sampled color
        console.log(`Sampled color: ${color} (RGBA: ${pixelData.r}, ${pixelData.g}, ${pixelData.b}, ${pixelData.a})`);
    }
}

if (typeof window !== 'undefined') {
    window.EyedropperTool = EyedropperTool;
}
