/**
 * Layer Model - Represents a single layer in the editor
 * Supports multiple layer types: image, text, shape, group
 */

class Layer {
    constructor(options = {}) {
        this.id = options.id || `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = options.name || 'Layer';
        this.type = options.type || 'image'; // image, text, shape, group, brush
        this.visible = options.visible !== undefined ? options.visible : true;
        this.locked = options.locked || false;
        this.opacity = options.opacity !== undefined ? options.opacity : 1;
        this.blendMode = options.blendMode || 'normal';
        
        // Transform properties
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 0;
        this.height = options.height || 0;
        this.rotation = options.rotation || 0;
        this.scaleX = options.scaleX || 1;
        this.scaleY = options.scaleY || 1;
        this.flipX = options.flipX || false;
        this.flipY = options.flipY || false;
        
        // Content specific properties
        this.image = options.image || null; // For image layers
        this.text = options.text || ''; // For text layers
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
        this.shapeType = options.shapeType || 'rectangle'; // rectangle, circle, line, polygon
        this.cornerRadius = options.cornerRadius || 0;
        this.points = options.points || []; // For polygons/custom shapes
        this.dashPattern = options.dashPattern || null;
        
        // Brush/drawing properties
        this.brushSize = options.brushSize || 5;
        this.brushHardness = options.brushHardness || 1;
        
        // Filter/adjustment properties
        this.filters = {
            brightness: options.brightness || 100,
            contrast: options.contrast || 100,
            saturation: options.saturation || 100,
            hue: options.hue || 0,
            blur: options.blur || 0,
            grayscale: options.grayscale || 0,
            sepia: options.sepia || 0,
            invert: options.invert || 0,
        };
        
        // Group children (for folder/group layers)
        this.children = options.children || [];
        this.isGroup = options.isGroup || false;
        
        // Mask support
        this.mask = options.mask || null;
        this.clippedBy = options.clippedBy || null;
        
        // Metadata
        this.createdAt = Date.now();
        this.updatedAt = Date.now();
    }
    
    /**
     * Clone the layer
     */
    clone() {
        const data = this.toJSON();
        data.id = `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        data.name = `${this.name} copy`;
        return new Layer(data);
    }
    
    /**
     * Convert layer to JSON for serialization
     */
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
            image: this.image ? this.image.toDataURL() : null,
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
            dashPattern: this.dashPattern,
            brushSize: this.brushSize,
            brushHardness: this.brushHardness,
            filters: { ...this.filters },
            children: this.children.map(child => child.toJSON()),
            isGroup: this.isGroup,
        };
    }
    
    /**
     * Create layer from JSON
     */
    static fromJSON(json) {
        if (json.image && typeof json.image === 'string') {
            // Create image element from data URL
            const img = new Image();
            img.src = json.image;
            json.image = img;
        }
        if (json.children && json.children.length > 0) {
            json.children = json.children.map(child => Layer.fromJSON(child));
        }
        return new Layer(json);
    }
    
    /**
     * Get bounding box considering transform
     */
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width * this.scaleX,
            height: this.height * this.scaleY,
        };
    }
    
    /**
     * Check if a point is inside the layer bounds
     */
    containsPoint(px, py) {
        const bounds = this.getBounds();
        return px >= bounds.x && px <= bounds.x + bounds.width &&
               py >= bounds.y && py <= bounds.y + bounds.height;
    }
    
    /**
     * Update the timestamp
     */
    touch() {
        this.updatedAt = Date.now();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Layer;
}
