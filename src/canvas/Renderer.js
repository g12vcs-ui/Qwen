/**
 * Canvas Renderer - Handles all canvas rendering operations
 */

class Renderer {
    constructor(state) {
        this.state = state;
        this.canvas = null;
        this.ctx = null;
        this.container = null;
        
        // Off-screen canvas for layer caching
        this.layerCache = new Map();
        
        // Render flags
        this.needsRender = true;
        this.renderQuality = 1;
        
        // Animation frame
        this.animationFrame = null;
    }
    
    /**
     * Initialize renderer with canvas element
     */
    init(canvasElement, containerElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d', { alpha: true });
        this.container = containerElement;
        
        // Handle high DPI displays
        this.setupHiDPI();
        
        // Initial render
        this.resize();
        this.render();
        
        // Listen to state changes
        this.state.subscribe('change', () => this.requestRender());
        this.state.subscribe('layersChanged', () => {
            this.invalidateLayerCache();
            this.requestRender();
        });
        this.state.subscribe('viewportChanged', () => this.resize());
        this.state.subscribe('zoomChanged', () => this.resize());
    }
    
    /**
     * Setup HiDPI display support
     */
    setupHiDPI() {
        const dpr = window.devicePixelRatio || 1;
        this.dpr = dpr;
    }
    
    /**
     * Resize canvas to match state
     */
    resize() {
        if (!this.canvas || !this.container) return;
        
        const rect = this.container.getBoundingClientRect();
        const dpr = this.dpr;
        
        // Set display size
        this.canvas.style.width = `${this.state.canvasWidth * this.state.zoom}px`;
        this.canvas.style.height = `${this.state.canvasHeight * this.state.zoom}px`;
        
        // Set actual canvas size (with DPR)
        this.canvas.width = Math.floor(this.state.canvasWidth * this.state.zoom * dpr);
        this.canvas.height = Math.floor(this.state.canvasHeight * this.state.zoom * dpr);
        
        // Scale context
        this.ctx.setTransform(
            this.state.zoom * dpr, 0, 0,
            this.state.zoom * dpr, 0, 0
        );
        
        this.requestRender();
    }
    
    /**
     * Request a render (debounced via requestAnimationFrame)
     */
    requestRender() {
        if (!this.needsRender) {
            this.needsRender = true;
            this.animationFrame = requestAnimationFrame(() => this.render());
        }
    }
    
    /**
     * Main render function
     */
    render() {
        if (!this.ctx || !this.needsRender) return;
        
        this.needsRender = false;
        
        const { canvasWidth, canvasHeight, backgroundColor, layers, adjustments } = this.state;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // Draw background
        if (backgroundColor && backgroundColor !== 'transparent') {
            this.ctx.fillStyle = backgroundColor;
            this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }
        
        // Build filter string from adjustments
        const filterString = this.buildFilterString(adjustments);
        
        // Save context state
        this.ctx.save();
        
        // Apply global filters
        if (filterString) {
            this.ctx.filter = filterString;
        }
        
        // Render all visible layers in order
        for (const layer of layers) {
            if (layer.visible) {
                this.renderLayer(layer);
            }
        }
        
        // Restore context
        this.ctx.restore();
    }
    
    /**
     * Render a single layer
     */
    renderLayer(layer) {
        this.ctx.save();
        
        // Apply layer transform
        this.applyLayerTransform(layer);
        
        // Apply layer opacity
        this.ctx.globalAlpha = layer.opacity;
        
        // Apply blend mode
        this.ctx.globalCompositeOperation = this.getBlendMode(layer.blendMode);
        
        // Apply layer-specific filters
        const layerFilterString = this.buildFilterString(layer.filters);
        if (layerFilterString) {
            this.ctx.filter = layerFilterString;
        }
        
        // Render based on layer type
        switch (layer.type) {
            case 'image':
                this.renderImageLayer(layer);
                break;
            case 'text':
                this.renderTextLayer(layer);
                break;
            case 'shape':
                this.renderShapeLayer(layer);
                break;
            case 'brush':
                this.renderBrushLayer(layer);
                break;
            case 'group':
                this.renderGroupLayer(layer);
                break;
        }
        
        this.ctx.restore();
    }
    
    /**
     * Apply layer transformation (position, rotation, scale, flip)
     */
    applyLayerTransform(layer) {
        const { x, y, width, height, rotation, scaleX, scaleY, flipX, flipY } = layer;
        
        // Translate to layer position
        this.ctx.translate(x + width / 2, y + height / 2);
        
        // Rotate
        if (rotation) {
            this.ctx.rotate((rotation * Math.PI) / 180);
        }
        
        // Scale and flip
        this.ctx.scale(scaleX * (flipX ? -1 : 1), scaleY * (flipY ? -1 : 1));
        
        // Translate back
        this.ctx.translate(-width / 2, -height / 2);
    }
    
    /**
     * Render image layer
     */
    renderImageLayer(layer) {
        if (!layer.image) return;
        
        const { width, height } = layer;
        
        // Check if image is loaded
        if (layer.image.complete && layer.image.naturalWidth > 0) {
            this.ctx.drawImage(layer.image, 0, 0, width, height);
        } else {
            // Draw placeholder while loading
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(0, 0, width, height);
            this.ctx.fillStyle = '#666';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Loading...', width / 2, height / 2);
        }
    }
    
    /**
     * Render text layer
     */
    renderTextLayer(layer) {
        const { text, width, height, fontFamily, fontSize, fontWeight, fontStyle, 
                fillColor, textAlign, lineHeight, letterSpacing, strokeColor, strokeWidth,
                shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY } = layer;
        
        // Setup shadow
        if (shadowColor) {
            this.ctx.shadowColor = shadowColor;
            this.ctx.shadowBlur = shadowBlur;
            this.ctx.shadowOffsetX = shadowOffsetX;
            this.ctx.shadowOffsetY = shadowOffsetY;
        }
        
        // Setup font
        this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        this.ctx.textAlign = textAlign;
        this.ctx.textBaseline = 'top';
        
        // Calculate line height
        const actualLineHeight = fontSize * lineHeight;
        
        // Split text into lines
        const lines = text.split('\n');
        
        // Get horizontal offset based on alignment
        let xOffset = 0;
        if (textAlign === 'center') xOffset = width / 2;
        else if (textAlign === 'right') xOffset = width;
        
        // Draw each line
        lines.forEach((line, index) => {
            const y = index * actualLineHeight;
            
            // Draw stroke if specified
            if (strokeColor && strokeWidth > 0) {
                this.ctx.strokeStyle = strokeColor;
                this.ctx.lineWidth = strokeWidth;
                this.ctx.strokeText(line, xOffset, y);
            }
            
            // Draw fill
            this.ctx.fillStyle = fillColor;
            this.ctx.fillText(line, xOffset, y);
        });
    }
    
    /**
     * Render shape layer
     */
    renderShapeLayer(layer) {
        const { shapeType, width, height, fillColor, strokeColor, strokeWidth, 
                cornerRadius, dashPattern } = layer;
        
        this.ctx.beginPath();
        
        switch (shapeType) {
            case 'rectangle':
                if (cornerRadius > 0) {
                    this.roundedRect(0, 0, width, height, cornerRadius);
                } else {
                    this.ctx.rect(0, 0, width, height);
                }
                break;
                
            case 'circle':
                this.ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
                break;
                
            case 'line':
                this.ctx.moveTo(0, height / 2);
                this.ctx.lineTo(width, height / 2);
                break;
                
            case 'polygon':
                if (layer.points.length > 0) {
                    this.ctx.moveTo(layer.points[0].x * width, layer.points[0].y * height);
                    for (let i = 1; i < layer.points.length; i++) {
                        this.ctx.lineTo(layer.points[i].x * width, layer.points[i].y * height);
                    }
                    this.ctx.closePath();
                }
                break;
        }
        
        // Fill
        if (fillColor) {
            this.ctx.fillStyle = fillColor;
            this.ctx.fill();
        }
        
        // Stroke
        if (strokeColor && strokeWidth > 0) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = strokeWidth;
            if (dashPattern) {
                this.ctx.setLineDash(dashPattern);
            }
            this.ctx.stroke();
        }
    }
    
    /**
     * Render brush/drawing layer
     */
    renderBrushLayer(layer) {
        if (!layer.image) return;
        this.renderImageLayer(layer);
    }
    
    /**
     * Render group layer
     */
    renderGroupLayer(layer) {
        // Create clipping region for group
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(0, 0, layer.width, layer.height);
        this.ctx.clip();
        
        // Render children
        for (const child of layer.children) {
            if (child.visible) {
                this.renderLayer(child);
            }
        }
        
        this.ctx.restore();
    }
    
    /**
     * Draw rounded rectangle path
     */
    roundedRect(x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        this.ctx.moveTo(x + r, y);
        this.ctx.arcTo(x + width, y, x + width, y + height, r);
        this.ctx.arcTo(x + width, y + height, x, y + height, r);
        this.ctx.arcTo(x, y + height, x, y, r);
        this.ctx.arcTo(x, y, x + width, y, r);
        this.ctx.closePath();
    }
    
    /**
     * Build CSS filter string from filter object
     */
    buildFilterString(filters) {
        if (!filters) return '';
        
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
        if (filters.grayscale > 0) {
            parts.push(`grayscale(${filters.grayscale}%)`);
        }
        if (filters.sepia > 0) {
            parts.push(`sepia(${filters.sepia}%)`);
        }
        if (filters.invert > 0) {
            parts.push(`invert(${filters.invert}%)`);
        }
        
        return parts.join(' ');
    }
    
    /**
     * Get CSS blend mode value
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
            colorBurn: 'color-burn',
            hardLight: 'hard-light',
            softLight: 'soft-light',
            difference: 'difference',
            exclusion: 'exclusion',
            hue: 'hue',
            saturation: 'saturation',
            color: 'color',
            luminosity: 'luminosity',
        };
        return modes[mode] || 'source-over';
    }
    
    /**
     * Invalidate cached layer renders
     */
    invalidateLayerCache() {
        this.layerCache.clear();
    }
    
    /**
     * Get pixel data at coordinates
     */
    getPixelData(x, y) {
        if (!this.canvas) return null;
        
        const dpr = this.dpr;
        const zoom = this.state.zoom;
        const px = Math.floor(x * zoom * dpr);
        const py = Math.floor(y * zoom * dpr);
        
        try {
            const imageData = this.ctx.getImageData(px, py, 1, 1);
            const data = imageData.data;
            return {
                r: data[0],
                g: data[1],
                b: data[2],
                a: data[3],
            };
        } catch (e) {
            return null;
        }
    }
    
    /**
     * Export canvas as data URL
     */
    toDataURL(format = 'image/png', quality = 1) {
        if (!this.canvas) return null;
        
        // Create temporary canvas for export
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.state.canvasWidth;
        tempCanvas.height = this.state.canvasHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw background
        if (this.state.backgroundColor && this.state.backgroundColor !== 'transparent') {
            tempCtx.fillStyle = this.state.backgroundColor;
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        }
        
        // Draw layers without viewport transform
        for (const layer of this.state.layers) {
            if (layer.visible) {
                this.renderLayerToContext(tempCtx, layer);
            }
        }
        
        return tempCanvas.toDataURL(format, quality);
    }
    
    /**
     * Render layer to specific context
     */
    renderLayerToContext(ctx, layer) {
        ctx.save();
        ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
        if (layer.rotation) ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.scale(layer.scaleX * (layer.flipX ? -1 : 1), layer.scaleY * (layer.flipY ? -1 : 1));
        ctx.translate(-layer.width / 2, -layer.height / 2);
        ctx.globalAlpha = layer.opacity;
        
        if (layer.type === 'image' && layer.image) {
            ctx.drawImage(layer.image, 0, 0, layer.width, layer.height);
        }
        
        ctx.restore();
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.invalidateLayerCache();
    }
}

// Make globally available
if (typeof window !== 'undefined') {
    window.Renderer = Renderer;
}
