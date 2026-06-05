/**
 * Text Tool - For adding and editing text layers
 */

class TextTool extends BaseTool {
    constructor(editor) {
        super('text', editor);
        this.cursor = 'text';
        
        this.isEditing = false;
        this.editElement = null;
        
        // Default text properties
        this.defaultText = {
            fontFamily: 'Arial',
            fontSize: 32,
            fontWeight: 'normal',
            fontStyle: 'normal',
            fillColor: '#ffffff',
            textAlign: 'left',
            lineHeight: 1.2,
        };
    }
    
    onActivate() {
        this.createEditElement();
    }
    
    onDeactivate() {
        this.finishEditing();
    }
    
    createEditElement() {
        if (this.editElement) return;
        
        this.editElement = document.createElement('textarea');
        this.editElement.className = 'text-edit-element';
        this.editElement.style.cssText = `
            position: absolute;
            display: none;
            background: transparent;
            border: 1px dashed #6366f1;
            color: white;
            font-family: Arial;
            font-size: 32px;
            line-height: 1.2;
            padding: 4px;
            margin: 0;
            resize: none;
            outline: none;
            overflow: hidden;
            z-index: 1000;
        `;
        
        this.editElement.addEventListener('blur', () => this.finishEditing());
        this.editElement.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cancelEditing();
            } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.finishEditing();
            }
        });
        
        document.getElementById('canvasContainer').appendChild(this.editElement);
    }
    
    onPointerDown(event) {
        if (event.button !== 0) return;
        
        const pos = this.getCanvasCoordinates(event);
        
        // Check if clicking on existing text layer
        const layer = this.getTextLayerAt(pos.x, pos.y);
        
        if (layer) {
            // Edit existing text
            this.state.selectLayer(layer.id);
            this.startEditing(layer);
        } else {
            // Create new text layer
            this.createNewText(pos.x, pos.y);
        }
    }
    
    getTextLayerAt(x, y) {
        for (let i = this.state.layers.length - 1; i >= 0; i--) {
            const layer = this.state.layers[i];
            if (layer.type === 'text' && layer.visible && layer.containsPoint(x, y)) {
                return layer;
            }
        }
        return null;
    }
    
    createNewText(x, y) {
        const LayerClass = window.Layer || Layer;
        
        const textLayer = new LayerClass({
            type: 'text',
            name: 'Text',
            x: x,
            y: y,
            width: 200,
            height: 50,
            text: 'Type here...',
            ...this.defaultText,
        });
        
        this.editor.history.saveState('Add Text');
        this.state.addLayer(textLayer);
        this.startEditing(textLayer);
    }
    
    startEditing(layer) {
        if (!this.editElement) return;
        
        this.isEditing = true;
        const zoom = this.state.zoom;
        
        // Position edit element
        this.editElement.style.display = 'block';
        this.editElement.style.left = `${layer.x * zoom}px`;
        this.editElement.style.top = `${layer.y * zoom}px`;
        this.editElement.style.width = `${layer.width * zoom}px`;
        this.editElement.style.height = `${layer.height * zoom}px`;
        this.editElement.style.fontSize = `${layer.fontSize * zoom}px`;
        this.editElement.style.fontFamily = layer.fontFamily;
        this.editElement.style.color = layer.fillColor;
        this.editElement.style.textAlign = layer.textAlign;
        
        // Set content
        this.editElement.value = layer.text;
        this.editElement.focus();
        this.editElement.select();
        
        this.editingLayer = layer;
    }
    
    finishEditing() {
        if (!this.isEditing || !this.editingLayer) return;
        
        const newText = this.editElement.value;
        
        if (newText !== this.editingLayer.text) {
            this.editor.history.saveState('Edit Text');
            this.editingLayer.text = newText;
            this.editingLayer.touch();
            
            // Auto-resize based on content
            this.autoResizeLayer(this.editingLayer);
        }
        
        this.isEditing = false;
        this.editElement.style.display = 'none';
        this.editingLayer = null;
    }
    
    cancelEditing() {
        this.isEditing = false;
        this.editElement.style.display = 'none';
        this.editingLayer = null;
    }
    
    autoResizeLayer(layer) {
        // Simple auto-resize based on text content
        const lines = layer.text.split('\n');
        const maxLine = lines.reduce((a, b) => a.length > b.length ? a : b, '');
        
        // Approximate width based on character count
        const charWidth = layer.fontSize * 0.6;
        const estimatedWidth = Math.max(100, maxLine.length * charWidth);
        const estimatedHeight = lines.length * layer.fontSize * layer.lineHeight + 20;
        
        layer.width = estimatedWidth;
        layer.height = estimatedHeight;
    }
    
    onKeyDown(event) {
        // Delete selected text layer
        if ((event.key === 'Delete' || event.key === 'Backspace') && !this.isEditing) {
            const selectedLayers = this.state.getSelectedLayers();
            if (selectedLayers.length > 0) {
                this.editor.history.saveState('Delete Text');
                selectedLayers.forEach(layer => {
                    if (layer.type === 'text') {
                        this.state.removeLayer(layer.id);
                    }
                });
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.TextTool = TextTool;
}
