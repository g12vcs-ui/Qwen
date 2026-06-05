/**
 * Move Tool - For moving, transforming, and manipulating layers
 */

class MoveTool extends BaseTool {
    constructor(editor) {
        super('move', editor);
        this.cursor = 'move';
        
        // Transform state
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.dragOffset = { x: 0, y: 0 };
        this.resizeHandle = null;
        this.initialBounds = null;
        this.startPos = { x: 0, y: 0 };
        
        // Transform controls element
        this.transformControls = document.getElementById('transformControls');
    }
    
    onActivate() {
        this.updateTransformControls();
        this.state.subscribe('selectionChanged', () => this.updateTransformControls());
        this.state.subscribe('layersChanged', () => this.updateTransformControls());
    }
    
    onDeactivate() {
        this.hideTransformControls();
    }
    
    /**
     * Show transform controls for selected layer
     */
    updateTransformControls() {
        const selectedLayers = this.state.getSelectedLayers();
        if (selectedLayers.length === 1) {
            this.showTransformControls(selectedLayers[0]);
        } else {
            this.hideTransformControls();
        }
    }
    
    /**
     * Show transform controls for a layer
     */
    showTransformControls(layer) {
        if (!this.transformControls) return;
        
        const { x, y, width, height, rotation } = layer;
        const zoom = this.state.zoom;
        
        this.transformControls.style.display = 'block';
        this.transformControls.style.left = `${x * zoom}px`;
        this.transformControls.style.top = `${y * zoom}px`;
        this.transformControls.style.width = `${width * zoom}px`;
        this.transformControls.style.height = `${height * zoom}px`;
        this.transformControls.style.transform = `rotate(${rotation}deg)`;
    }
    
    /**
     * Hide transform controls
     */
    hideTransformControls() {
        if (this.transformControls) {
            this.transformControls.style.display = 'none';
        }
    }
    
    /**
     * Get the layer at coordinates
     */
    getLayerAt(x, y) {
        // Search from top to bottom (reverse order)
        for (let i = this.state.layers.length - 1; i >= 0; i--) {
            const layer = this.state.layers[i];
            if (layer.visible && !layer.locked && layer.containsPoint(x, y)) {
                return layer;
            }
        }
        return null;
    }
    
    /**
     * Check if clicking on a resize handle
     */
    getResizeHandle(x, y, layer) {
        if (!layer || !this.transformControls || this.transformControls.style.display === 'none') {
            return null;
        }
        
        const rect = this.transformControls.getBoundingClientRect();
        const zoom = this.state.zoom;
        const handleSize = 8 / zoom;
        const handles = {
            nw: { x: rect.left, y: rect.top },
            n: { x: rect.left + rect.width / 2, y: rect.top },
            ne: { x: rect.right, y: rect.top },
            e: { x: rect.right, y: rect.top + rect.height / 2 },
            se: { x: rect.right, y: rect.bottom },
            s: { x: rect.left + rect.width / 2, y: rect.bottom },
            sw: { x: rect.left, y: rect.bottom },
            w: { x: rect.left, y: rect.top + rect.height / 2 },
        };
        
        for (const [name, pos] of Object.entries(handles)) {
            if (Math.abs(x * zoom - pos.x) < handleSize && Math.abs(y * zoom - pos.y) < handleSize) {
                return name;
            }
        }
        
        // Check rotate handle
        const rotateY = rect.top - 30;
        const rotateX = rect.left + rect.width / 2;
        if (Math.abs(x * zoom - rotateX) < handleSize * 2 && Math.abs(y * zoom - rotateY) < handleSize * 2) {
            return 'rotate';
        }
        
        return null;
    }
    
    onPointerDown(event) {
        if (event.button !== 0) return; // Only left click
        
        const pos = this.getCanvasCoordinates(event);
        const selectedLayers = this.state.getSelectedLayers();
        
        // Check for resize handle first
        if (selectedLayers.length === 1) {
            const handle = this.getResizeHandle(pos.x, pos.y, selectedLayers[0]);
            if (handle) {
                this.isResizing = handle === 'rotate' ? false : true;
                this.isRotating = handle === 'rotate';
                this.resizeHandle = handle;
                this.startPos = pos;
                this.initialBounds = { ...selectedLayers[0] };
                event.preventDefault();
                return;
            }
        }
        
        // Check for layer selection
        const layer = this.getLayerAt(pos.x, pos.y);
        
        if (layer) {
            // Select layer
            const modifiers = this.getModifiers(event);
            this.state.selectLayer(layer.id, modifiers.shift);
            
            // Start dragging
            if (!layer.locked) {
                this.isDragging = true;
                this.dragOffset = {
                    x: pos.x - layer.x,
                    y: pos.y - layer.y,
                };
                
                // Save state for undo
                this.editor.history.saveState('Move Layer');
            }
        } else {
            // Deselect if clicking on empty space
            if (!modifiers.shift) {
                this.state.deselectAll();
            }
        }
    }
    
    onPointerMove(event) {
        const pos = this.getCanvasCoordinates(event);
        
        if (this.isDragging && this.state.selectedLayerIds.length > 0) {
            // Move selected layers
            const dx = pos.x - this.dragOffset.x - (this.state.getSelectedLayers()[0]?.x || 0);
            const dy = pos.y - this.dragOffset.y - (this.state.getSelectedLayers()[0]?.y || 0);
            
            this.editor.history.batch('Move Layers', () => {
                for (const layerId of this.state.selectedLayerIds) {
                    const layer = this.state.getLayer(layerId);
                    if (layer && !layer.locked) {
                        layer.x += dx;
                        layer.y += dy;
                        layer.touch();
                    }
                }
            });
            
            this.dragOffset.x = pos.x - (this.state.getSelectedLayers()[0]?.x || 0);
            this.dragOffset.y = pos.y - (this.state.getSelectedLayers()[0]?.y || 0);
            this.updateTransformControls();
        } else if (this.isResizing && this.resizeHandle && this.state.selectedLayerIds.length === 1) {
            const layer = this.state.getLayer(this.state.selectedLayerIds[0]);
            if (layer && !layer.locked) {
                this.handleResize(pos, layer);
            }
        } else if (this.isRotating && this.state.selectedLayerIds.length === 1) {
            const layer = this.state.getLayer(this.state.selectedLayerIds[0]);
            if (layer && !layer.locked) {
                this.handleRotate(pos, layer);
            }
        }
    }
    
    onPointerUp(event) {
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
        this.resizeHandle = null;
    }
    
    /**
     * Handle resize operation
     */
    handleResize(pos, layer) {
        const dx = pos.x - this.startPos.x;
        const dy = pos.y - this.startPos.y;
        const mods = this.getModifiers({ shiftKey: false, ctrlKey: false, altKey: event?.altKey });
        
        let newWidth = layer.width;
        let newHeight = layer.height;
        let newX = layer.x;
        let newY = layer.y;
        
        // Handle different resize directions
        switch (this.resizeHandle) {
            case 'e':
                newWidth = Math.max(10, this.initialBounds.width + dx);
                break;
            case 'w':
                newWidth = Math.max(10, this.initialBounds.width - dx);
                newX = this.initialBounds.x + (this.initialBounds.width - newWidth);
                break;
            case 's':
                newHeight = Math.max(10, this.initialBounds.height + dy);
                break;
            case 'n':
                newHeight = Math.max(10, this.initialBounds.height - dy);
                newY = this.initialBounds.y + (this.initialBounds.height - newHeight);
                break;
            case 'se':
                newWidth = Math.max(10, this.initialBounds.width + dx);
                newHeight = Math.max(10, this.initialBounds.height + dy);
                break;
            case 'sw':
                newWidth = Math.max(10, this.initialBounds.width - dx);
                newHeight = Math.max(10, this.initialBounds.height + dy);
                newX = this.initialBounds.x + (this.initialBounds.width - newWidth);
                break;
            case 'ne':
                newWidth = Math.max(10, this.initialBounds.width + dx);
                newHeight = Math.max(10, this.initialBounds.height - dy);
                newY = this.initialBounds.y + (this.initialBounds.height - newHeight);
                break;
            case 'nw':
                newWidth = Math.max(10, this.initialBounds.width - dx);
                newHeight = Math.max(10, this.initialBounds.height - dy);
                newX = this.initialBounds.x + (this.initialBounds.width - newWidth);
                newY = this.initialBounds.y + (this.initialBounds.height - newHeight);
                break;
        }
        
        // Maintain aspect ratio if shift is pressed
        if (mods.shift) {
            const aspectRatio = this.initialBounds.width / this.initialBounds.height;
            if (Math.abs(dx) > Math.abs(dy)) {
                newHeight = newWidth / aspectRatio;
            } else {
                newWidth = newHeight * aspectRatio;
            }
        }
        
        layer.width = newWidth;
        layer.height = newHeight;
        layer.x = newX;
        layer.y = newY;
        layer.touch();
        
        this.updateTransformControls();
    }
    
    /**
     * Handle rotate operation
     */
    handleRotate(pos, layer) {
        const centerX = layer.x + layer.width / 2;
        const centerY = layer.y + layer.height / 2;
        
        const angle = Math.atan2(pos.y - centerY, pos.x - centerX);
        layer.rotation = (angle * 180 / Math.PI) + 90;
        layer.touch();
        
        this.updateTransformControls();
    }
    
    onKeyDown(event) {
        // Arrow key movement
        const selectedLayers = this.state.getSelectedLayers();
        if (selectedLayers.length === 0) return;
        
        const step = event.shiftKey ? 10 : 1;
        let moved = false;
        
        switch (event.key) {
            case 'ArrowUp':
                selectedLayers.forEach(l => { if (!l.locked) { l.y -= step; moved = true; } });
                break;
            case 'ArrowDown':
                selectedLayers.forEach(l => { if (!l.locked) { l.y += step; moved = true; } });
                break;
            case 'ArrowLeft':
                selectedLayers.forEach(l => { if (!l.locked) { l.x -= step; moved = true; } });
                break;
            case 'ArrowRight':
                selectedLayers.forEach(l => { if (!l.locked) { l.x += step; moved = true; } });
                break;
        }
        
        if (moved) {
            selectedLayers.forEach(l => l.touch());
            this.updateTransformControls();
            event.preventDefault();
        }
    }
}

// Make globally available
if (typeof window !== 'undefined') {
    window.MoveTool = MoveTool;
}
