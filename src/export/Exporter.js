// PixelForge - Export Module

class Exporter {
    constructor(state) {
        this.state = state;
    }
    
    exportImage(format = 'png', quality = 0.92, scale = 1) {
        const width = Math.floor(this.state.canvasWidth * scale);
        const height = Math.floor(this.state.canvasHeight * scale);
        
        // Create export canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Draw background
        if (this.state.backgroundColor && this.state.backgroundColor !== 'transparent') {
            ctx.fillStyle = this.state.backgroundColor;
            ctx.fillRect(0, 0, width, height);
        }
        
        // Draw all visible layers scaled
        this.state.layers.forEach(layer => {
            if (!layer.visible) return;
            
            layer.render();
            
            ctx.save();
            
            // Apply transformations with scale
            const cx = (layer.x + layer.width / 2) * scale;
            const cy = (layer.y + layer.height / 2) * scale;
            
            ctx.translate(cx, cy);
            ctx.rotate(layer.rotation);
            ctx.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);
            ctx.scale(layer.scaleX * scale, layer.scaleY * scale);
            ctx.translate(-cx, -cy);
            
            ctx.globalAlpha = layer.opacity;
            ctx.globalCompositeOperation = layer.blendMode || 'source-over';
            
            if (layer.type === 'image' && layer.image) {
                ctx.filter = PFUtils.getFilterString(layer.adjustments);
            }
            
            const drawX = (layer.x + (layer.canvas.width - layer.width) / 2) * scale;
            const drawY = (layer.y + (layer.canvas.height - layer.height) / 2) * scale;
            
            ctx.drawImage(
                layer.canvas,
                drawX,
                drawY,
                layer.width * scale,
                layer.height * scale
            );
            
            ctx.restore();
        });
        
        // Convert to blob and download
        canvas.toBlob((blob) => {
            if (!blob) {
                alert('Export failed');
                return;
            }
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pixelforge-export.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, `image/${format}`, quality);
    }
    
    exportProject() {
        const data = this.state.toJSON();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'pixelforge-project.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    async exportToClipboard(format = 'png', quality = 0.92) {
        const width = this.state.canvasWidth;
        const height = this.state.canvasHeight;
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Draw background
        if (this.state.backgroundColor && this.state.backgroundColor !== 'transparent') {
            ctx.fillStyle = this.state.backgroundColor;
            ctx.fillRect(0, 0, width, height);
        }
        
        // Draw layers
        this.state.layers.forEach(layer => {
            if (!layer.visible) return;
            layer.render();
            ctx.drawImage(layer.canvas, layer.x, layer.y);
        });
        
        // Try to copy to clipboard
        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, `image/${format}`, quality));
            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
            ]);
            return true;
        } catch (err) {
            console.warn('Failed to copy to clipboard:', err);
            return false;
        }
    }
}

window.Exporter = Exporter;
