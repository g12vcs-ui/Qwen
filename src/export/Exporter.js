/**
 * Exporter - Handles exporting canvas to various formats
 */

class Exporter {
    constructor(state, renderer) {
        this.state = state;
        this.renderer = renderer;
    }
    
    /**
     * Export canvas as data URL
     */
    async export(format = 'png', options = {}) {
        const {
            quality = 0.92,
            scale = 1,
            transparentBg = true,
        } = options;
        
        // Create export canvas
        const width = Math.floor(this.state.canvasWidth * scale);
        const height = Math.floor(this.state.canvasHeight * scale);
        
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width;
        exportCanvas.height = height;
        const ctx = exportCanvas.getContext('2d');
        
        // Draw background
        if (!transparentBg && this.state.backgroundColor) {
            ctx.fillStyle = this.state.backgroundColor;
            ctx.fillRect(0, 0, width, height);
        }
        
        // Scale context
        ctx.scale(scale, scale);
        
        // Render all visible layers
        for (const layer of this.state.layers) {
            if (layer.visible) {
                this.renderLayerToContext(ctx, layer);
            }
        }
        
        // Apply global adjustments
        if (this.hasAdjustments()) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Apply filter
            tempCtx.filter = this.buildFilterString(this.state.adjustments);
            tempCtx.drawImage(exportCanvas, 0, 0);
            
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(tempCanvas, 0, 0);
        }
        
        // Convert to requested format
        const mimeType = this.getMimeType(format);
        const dataUrl = exportCanvas.toDataURL(mimeType, quality);
        
        return dataUrl;
    }
    
    /**
     * Export and download file
     */
    async download(filename, format = 'png', options = {}) {
        const dataUrl = await this.export(format, options);
        Utils.downloadFile(dataUrl, filename);
    }
    
    /**
     * Render a layer to a specific context
     */
    renderLayerToContext(ctx, layer) {
        if (!layer.visible) return;
        
        ctx.save();
        
        // Apply transform
        ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
        if (layer.rotation) {
            ctx.rotate((layer.rotation * Math.PI) / 180);
        }
        ctx.scale(layer.scaleX * (layer.flipX ? -1 : 1), layer.scaleY * (layer.flipY ? -1 : 1));
        ctx.translate(-layer.width / 2, -layer.height / 2);
        
        // Apply opacity
        ctx.globalAlpha = layer.opacity;
        
        // Apply blend mode
        ctx.globalCompositeOperation = this.getBlendMode(layer.blendMode);
        
        // Render based on type
        switch (layer.type) {
            case 'image':
                if (layer.image && layer.image.complete) {
                    ctx.drawImage(layer.image, 0, 0, layer.width, layer.height);
                }
                break;
                
            case 'text':
                ctx.font = `${layer.fontStyle} ${layer.fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
                ctx.textAlign = layer.textAlign;
                ctx.textBaseline = 'top';
                ctx.fillStyle = layer.fillColor;
                
                if (layer.shadowColor) {
                    ctx.shadowColor = layer.shadowColor;
                    ctx.shadowBlur = layer.shadowBlur;
                    ctx.shadowOffsetX = layer.shadowOffsetX;
                    ctx.shadowOffsetY = layer.shadowOffsetY;
                }
                
                const lines = layer.text.split('\n');
                const lineHeight = layer.fontSize * layer.lineHeight;
                
                lines.forEach((line, i) => {
                    let x = 0;
                    if (layer.textAlign === 'center') x = layer.width / 2;
                    else if (layer.textAlign === 'right') x = layer.width;
                    
                    if (layer.strokeColor && layer.strokeWidth > 0) {
                        ctx.strokeStyle = layer.strokeColor;
                        ctx.lineWidth = layer.strokeWidth;
                        ctx.strokeText(line, x, i * lineHeight);
                    }
                    
                    ctx.fillText(line, x, i * lineHeight);
                });
                break;
                
            case 'shape':
                ctx.beginPath();
                
                switch (layer.shapeType) {
                    case 'rectangle':
                        if (layer.cornerRadius > 0) {
                            this.roundedRect(ctx, 0, 0, layer.width, layer.height, layer.cornerRadius);
                        } else {
                            ctx.rect(0, 0, layer.width, layer.height);
                        }
                        break;
                    case 'circle':
                        ctx.ellipse(layer.width/2, layer.height/2, layer.width/2, layer.height/2, 0, 0, Math.PI * 2);
                        break;
                }
                
                if (layer.fillColor) {
                    ctx.fillStyle = layer.fillColor;
                    ctx.fill();
                }
                
                if (layer.strokeColor && layer.strokeWidth > 0) {
                    ctx.strokeStyle = layer.strokeColor;
                    ctx.lineWidth = layer.strokeWidth;
                    if (layer.dashPattern) ctx.setLineDash(layer.dashPattern);
                    ctx.stroke();
                }
                break;
                
            case 'brush':
                if (layer.image) {
                    ctx.drawImage(layer.image, 0, 0);
                }
                break;
        }
        
        ctx.restore();
    }
    
    /**
     * Draw rounded rectangle path
     */
    roundedRect(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + width, y, x + width, y + height, r);
        ctx.arcTo(x + width, y + height, x, y + height, r);
        ctx.arcTo(x, y + height, x, y, r);
        ctx.arcTo(x, y, x + width, y, r);
        ctx.closePath();
    }
    
    /**
     * Check if there are active adjustments
     */
    hasAdjustments() {
        const adj = this.state.adjustments;
        return adj.brightness !== 100 || adj.contrast !== 100 || 
               adj.saturation !== 100 || adj.hue !== 0 || adj.blur > 0;
    }
    
    /**
     * Build CSS filter string
     */
    buildFilterString(filters) {
        const parts = [];
        
        if (filters.brightness !== 100) {
            parts.push(`brightness(${filters.brightness}%)`);
        }
        if (filters.contrast !== 100) {
            parts.push(`contrast(${filters.contrast}%)`);
        }
        if (filters.saturation !== 100) {
            parts.push(`saturate(${filters.saturation}%)`);
        }
        if (filters.hue !== 0) {
            parts.push(`hue-rotate(${filters.hue}deg)`);
        }
        if (filters.blur > 0) {
            parts.push(`blur(${filters.blur}px)`);
        }
        
        return parts.join(' ');
    }
    
    /**
     * Get blend mode string
     */
    getBlendMode(mode) {
        const modes = {
            normal: 'source-over',
            multiply: 'multiply',
            screen: 'screen',
            overlay: 'overlay',
            darken: 'darken',
            lighten: 'lighten',
            colorDodge: 'color-dodge',
            hardLight: 'hard-light',
            softLight: 'soft-light',
            difference: 'difference',
            exclusion: 'exclusion',
        };
        return modes[mode] || 'source-over';
    }
    
    /**
     * Get MIME type for format
     */
    getMimeType(format) {
        const types = {
            png: 'image/png',
            jpeg: 'image/jpeg',
            jpg: 'image/jpeg',
            webp: 'image/webp',
        };
        return types[format.toLowerCase()] || 'image/png';
    }
    
    /**
     * Export project as JSON
     */
    exportProject() {
        return JSON.stringify(this.state.toJSON(), null, 2);
    }
    
    /**
     * Save project to file
     */
    saveProject(filename = 'project.json') {
        const data = this.exportProject();
        Utils.downloadFile(data, filename, 'application/json');
    }
}

// Make globally available
if (typeof window !== 'undefined') {
    window.Exporter = Exporter;
}
