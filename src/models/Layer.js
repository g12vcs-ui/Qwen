// PixelForge - Layer Model

class Layer {
    constructor(options = {}) {
        this.id = options.id || PFUtils.generateId();
        this.name = options.name || 'Layer';
        this.type = options.type || 'image'; // image, text, shape, group
        this.visible = options.visible !== false;
        this.locked = options.locked === true;
        this.opacity = options.opacity !== undefined ? options.opacity : 1;
        this.blendMode = options.blendMode || 'normal';
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 0;
        this.height = options.height || 0;
        this.rotation = options.rotation || 0;
        this.scaleX = options.scaleX || 1;
        this.scaleY = options.scaleY || 1;
        this.flipX = options.flipX || false;
        this.flipY = options.flipY || false;
        
        // Type-specific properties
        this.image = options.image || null; // Image element for image layers
        this.text = options.text || '';
        this.fontFamily = options.fontFamily || 'Arial';
        this.fontSize = options.fontSize || 24;
        this.fontWeight = options.fontWeight || 'normal';
        this.fontStyle = options.fontStyle || 'normal';
        this.textAlign = options.textAlign || 'left';
        this.lineHeight = options.lineHeight || 1.2;
        this.letterSpacing = options.letterSpacing || 0;
        this.fillColor = options.fillColor || '#ffffff';
        this.strokeColor = options.strokeColor || null;
        this.strokeWidth = options.strokeWidth || 0;
        this.shadowColor = options.shadowColor || null;
        this.shadowBlur = options.shadowBlur || 0;
        this.shadowOffsetX = options.shadowOffsetX || 0;
        this.shadowOffsetY = options.shadowOffsetY || 0;
        
        // Shape properties
        this.shapeType = options.shapeType || 'rect'; // rect, ellipse, polygon
        this.cornerRadius = options.cornerRadius || 0;
        this.points = options.points || []; // For polygons
        
        // Adjustments
        this.adjustments = {
            brightness: options.brightness || 0,
            contrast: options.contrast || 0,
            saturation: options.saturation || 0,
            hue: options.hue || 0,
            blur: options.blur || 0
        };
        
        // Canvas for layer content
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Dirty flag for re-rendering
        this.dirty = true;
        
        // Initialize canvas size
        this.updateCanvasSize();
    }
    
    updateCanvasSize() {
        const padding = 10;
        this.canvas.width = Math.max(this.width + padding * 2, 64);
        this.canvas.height = Math.max(this.height + padding * 2, 64);
        this.dirty = true;
    }
    
    render() {
        if (!this.dirty && !this.canvas_dirty) return;
        
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        
        // Apply adjustments
        if (this.type === 'image' && this.image) {
            const filter = PFUtils.getFilterString(this.adjustments);
            ctx.filter = filter;
        }
        
        // Apply opacity
        ctx.globalAlpha = this.opacity;
        
        // Apply blend mode
        ctx.globalCompositeOperation = this.blendMode;
        
        const cx = w / 2;
        const cy = h / 2;
        
        // Transform to center
        ctx.translate(cx, cy);
        ctx.rotate(this.rotation);
        ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
        ctx.scale(this.scaleX, this.scaleY);
        ctx.translate(-cx, -cy);
        
        const drawX = (w - this.width) / 2;
        const drawY = (h - this.height) / 2;
        
        if (this.type === 'image' && this.image) {
            ctx.drawImage(this.image, drawX, drawY, this.width, this.height);
        } else if (this.type === 'text') {
            this.renderText(ctx, drawX, drawY);
        } else if (this.type === 'shape') {
            this.renderShape(ctx, drawX, drawY);
        }
        
        ctx.restore();
        this.dirty = false;
    }
    
    renderText(ctx, x, y) {
        ctx.font = `${this.fontStyle} ${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
        ctx.textAlign = this.textAlign;
        ctx.textBaseline = 'top';
        ctx.fillStyle = this.fillColor;
        
        // Shadow
        if (this.shadowColor) {
            ctx.shadowColor = this.shadowColor;
            ctx.shadowBlur = this.shadowBlur;
            ctx.shadowOffsetX = this.shadowOffsetX;
            ctx.shadowOffsetY = this.shadowOffsetY;
        }
        
        const lines = this.text.split('\n');
        const lineHeight = this.fontSize * this.lineHeight;
        
        lines.forEach((line, i) => {
            const lineY = y + i * lineHeight;
            
            // Stroke
            if (this.strokeColor && this.strokeWidth > 0) {
                ctx.strokeStyle = this.strokeColor;
                ctx.lineWidth = this.strokeWidth;
                ctx.strokeText(line, x, lineY);
            }
            
            // Fill
            ctx.fillText(line, x, lineY);
        });
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
    
    renderShape(ctx, x, y) {
        ctx.fillStyle = this.fillColor;
        ctx.strokeStyle = this.strokeColor || 'transparent';
        ctx.lineWidth = this.strokeWidth;
        
        if (this.shapeType === 'rect') {
            if (this.cornerRadius > 0) {
                this.drawRoundedRect(ctx, x, y, this.width, this.height, this.cornerRadius);
            } else {
                ctx.fillRect(x, y, this.width, this.height);
            }
            if (this.strokeColor) ctx.strokeRect(x, y, this.width, this.height);
        } else if (this.shapeType === 'ellipse') {
            ctx.beginPath();
            ctx.ellipse(x + this.width / 2, y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            if (this.strokeColor) ctx.stroke();
        } else if (this.shapeType === 'polygon' && this.points.length > 2) {
            ctx.beginPath();
            ctx.moveTo(x + this.points[0].x * this.width, y + this.points[0].y * this.height);
            for (let i = 1; i < this.points.length; i++) {
                ctx.lineTo(x + this.points[i].x * this.width, y + this.points[i].y * this.height);
            }
            ctx.closePath();
            ctx.fill();
            if (this.strokeColor) ctx.stroke();
        }
    }
    
    drawRoundedRect(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
    }
    
    hitTest(px, py) {
        // Transform point to local coordinates
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        
        const cos = Math.cos(-this.rotation);
        const sin = Math.sin(-this.rotation);
        
        const dx = px - cx;
        const dy = py - cy;
        
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        
        const hw = (this.width * Math.abs(this.scaleX)) / 2;
        const hh = (this.height * Math.abs(this.scaleY)) / 2;
        
        return localX >= -hw && localX <= hw && localY >= -hh && localY <= hh;
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width * Math.abs(this.scaleX),
            height: this.height * Math.abs(this.scaleY),
            rotation: this.rotation
        };
    }
    
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            visible: this.visible,
            locked: this.locked,
            opacity: this.opacity,
            blendMode: this.blendMode,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            rotation: this.rotation,
            scaleX: this.scaleX,
            scaleY: this.scaleY,
            flipX: this.flipX,
            flipY: this.flipY,
            image: this.image ? this.image.src : null,
            text: this.text,
            fontFamily: this.fontFamily,
            fontSize: this.fontSize,
            fontWeight: this.fontWeight,
            fontStyle: this.fontStyle,
            textAlign: this.textAlign,
            lineHeight: this.lineHeight,
            letterSpacing: this.letterSpacing,
            fillColor: this.fillColor,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            shadowColor: this.shadowColor,
            shadowBlur: this.shadowBlur,
            shadowOffsetX: this.shadowOffsetX,
            shadowOffsetY: this.shadowOffsetY,
            shapeType: this.shapeType,
            cornerRadius: this.cornerRadius,
            points: this.points,
            adjustments: { ...this.adjustments }
        };
    }
    
    static fromJSON(data) {
        const layer = new Layer(data);
        if (data.image) {
            const img = new Image();
            img.src = data.image;
            layer.image = img;
            layer.width = layer.width || img.width;
            layer.height = layer.height || img.height;
        }
        return layer;
    }
}

window.Layer = Layer;
