// PixelForge - Text Tool

class TextTool extends BaseTool {
    constructor(canvasManager) {
        super('text', canvasManager);
        this.editingLayer = null;
        this.textarea = null;
    }
    
    onActivate() {
        this.createTextarea();
    }
    
    onDeactivate() {
        this.finishEditing();
        this.removeTextarea();
    }
    
    createTextarea() {
        if (!this.textarea) {
            this.textarea = document.createElement('textarea');
            this.textarea.className = 'text-editor';
            this.textarea.style.cssText = `
                position: absolute;
                display: none;
                background: rgba(255, 255, 255, 0.9);
                border: 1px solid #3b82f6;
                color: #000;
                font-family: Arial;
                font-size: 24px;
                padding: 4px;
                resize: none;
                outline: none;
                overflow: hidden;
                z-index: 1000;
            `;
            document.getElementById('canvas-container').appendChild(this.textarea);
            
            // Handle input
            this.textarea.addEventListener('input', () => {
                if (this.editingLayer) {
                    this.editingLayer.text = this.textarea.value;
                    this.editingLayer.dirty = true;
                    this.updateTextareaSize();
                    this.canvasManager.render();
                }
            });
            
            // Handle blur
            this.textarea.addEventListener('blur', () => {
                this.finishEditing();
            });
            
            // Handle escape
            this.textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.textarea.blur();
                }
            });
        }
    }
    
    removeTextarea() {
        if (this.textarea) {
            this.textarea.remove();
            this.textarea = null;
        }
    }
    
    getCursorStyle() {
        return 'text';
    }
    
    onPointerDown(e, x, y) {
        super.onPointerDown(e, x, y);
        
        // Check if clicking on existing text layer
        const layer = this.findLayerAtPoint(x, y);
        
        if (layer && layer.type === 'text') {
            this.startEditing(layer);
        } else {
            // Create new text layer
            this.createNewTextLayer(x, y);
        }
    }
    
    createNewTextLayer(x, y) {
        const fillColor = this.state.fillColor || '#ffffff';
        
        const layer = new Layer({
            type: 'text',
            name: 'Text',
            x: x,
            y: y,
            width: 200,
            height: 40,
            text: 'Text',
            fillColor: fillColor,
            fontSize: 24,
            fontFamily: 'Arial'
        });
        
        this.state.addLayer(layer);
        this.startEditing(layer);
        this.canvasManager.render();
    }
    
    startEditing(layer) {
        this.editingLayer = layer;
        this.state.selectLayer(layer.id);
        
        this.textarea.value = layer.text;
        this.textarea.style.display = 'block';
        this.textarea.style.fontFamily = layer.fontFamily;
        this.textarea.style.fontSize = layer.fontSize + 'px';
        this.textarea.style.color = layer.fillColor;
        
        this.updateTextareaPosition();
        this.updateTextareaSize();
        
        // Focus and select all
        setTimeout(() => {
            this.textarea.focus();
            this.textarea.select();
        }, 10);
    }
    
    finishEditing() {
        if (this.editingLayer) {
            this.editingLayer.text = this.textarea.value;
            this.editingLayer.dirty = true;
            this.editingLayer = null;
        }
        this.textarea.style.display = 'none';
        this.canvasManager.render();
    }
    
    updateTextareaPosition() {
        if (!this.editingLayer || !this.textarea) return;
        
        const layer = this.editingLayer;
        const zoom = this.state.zoom;
        const container = document.getElementById('canvas-container');
        
        this.textarea.style.left = (layer.x * zoom) + 'px';
        this.textarea.style.top = (layer.y * zoom) + 'px';
    }
    
    updateTextareaSize() {
        if (!this.editingLayer || !this.textarea) return;
        
        const layer = this.editingLayer;
        const zoom = this.state.zoom;
        
        // Calculate text dimensions
        const ctx = this.textarea;
        const lines = this.textarea.value.split('\n');
        const maxLine = lines.reduce((a, b) => a.length > b.length ? a : b, '');
        
        // Approximate width based on character count
        const charWidth = layer.fontSize * 0.6;
        const lineHeight = layer.fontSize * layer.lineHeight;
        
        const width = Math.max(layer.width, maxLine.length * charWidth + 20);
        const height = Math.max(layer.height, lines.length * lineHeight + 10);
        
        this.textarea.style.width = (width * zoom) + 'px';
        this.textarea.style.height = (height * zoom) + 'px';
        
        layer.width = width;
        layer.height = height;
    }
    
    onKeyDown(e) {
        if (this.editingLayer) {
            // Let textarea handle typing
            return;
        }
        
        if (e.key === 'Enter') {
            const layers = this.state.getSelectedLayers();
            if (layers.length > 0 && layers[0].type === 'text') {
                this.startEditing(layers[0]);
            }
        }
    }
}

window.TextTool = TextTool;
