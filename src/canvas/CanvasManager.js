// PixelForge - Canvas Manager

class CanvasManager {
    constructor(state) {
        this.state = state;
        this.container = document.getElementById('canvas-container');
        this.canvas = document.getElementById('main-canvas');
        this.transformBox = document.getElementById('transform-box');
        
        this.renderer = new Renderer(this);
        this.tools = {};
        this.currentTool = null;
        this.isSpacePressed = false;
        
        this.setupEventListeners();
        this.setupToolShortcuts();
        
        // Initialize with default tool
        this.setTool('move');
    }
    
    setupEventListeners() {
        // Pointer events on canvas container
        this.container.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        this.container.addEventListener('pointermove', (e) => this.onPointerMove(e));
        this.container.addEventListener('pointerup', (e) => this.onPointerUp(e));
        this.container.addEventListener('pointerleave', (e) => this.onPointerUp(e));
        this.container.addEventListener('dblclick', (e) => this.onDoubleClick(e));
        
        // Wheel for zoom/pan
        this.container.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Window resize
        window.addEventListener('resize', () => this.onResize());
        
        // State change listeners
        this.state.on('layersChanged', () => this.render());
        this.state.on('selectionChanged', () => {
            this.updateTransformBox();
            this.render();
        });
        this.state.on('canvasResized', () => this.onResize());
        this.state.on('toolChanged', (toolName) => this.setTool(toolName));
    }
    
    setupToolShortcuts() {
        const shortcuts = {
            'v': 'move',
            'a': 'select',
            't': 'text',
            'u': 'shape',
            'b': 'brush',
            'e': 'eraser',
            'c': 'crop',
            'i': 'eyedropper',
            'h': 'hand'
        };
        
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            const tool = shortcuts[e.key.toLowerCase()];
            if (tool && !e.ctrlKey && !e.metaKey) {
                this.setTool(tool);
            }
        });
    }
    
    getCanvasCoords(e) {
        const rect = this.container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.state.zoom;
        const y = (e.clientY - rect.top) / this.state.zoom;
        return { x, y };
    }
    
    onPointerDown(e) {
        if (e.button !== 0) return; // Only left click
        
        const { x, y } = this.getCanvasCoords(e);
        
        // Spacebar + drag for panning
        if (this.isSpacePressed || this.state.activeTool === 'hand') {
            this.setTool('hand');
        }
        
        if (this.currentTool) {
            this.currentTool.onPointerDown(e, x, y);
        }
        
        this.container.setPointerCapture(e.pointerId);
    }
    
    onPointerMove(e) {
        const { x, y } = this.getCanvasCoords(e);
        
        if (this.currentTool) {
            this.currentTool.onPointerMove(e, x, y);
        }
    }
    
    onPointerUp(e) {
        const { x, y } = this.getCanvasCoords(e);
        
        if (this.currentTool) {
            this.currentTool.onPointerUp(e, x, y);
        }
        
        try {
            this.container.releasePointerCapture(e.pointerId);
        } catch (err) {
            // Ignore if already released
        }
    }
    
    onDoubleClick(e) {
        const { x, y } = this.getCanvasCoords(e);
        
        if (this.currentTool && this.currentTool.onDoubleClick) {
            this.currentTool.onDoubleClick(e, x, y);
        }
    }
    
    onWheel(e) {
        e.preventDefault();
        
        const { x, y } = this.getCanvasCoords(e);
        
        // Ctrl/Cmd + wheel for zoom
        if (e.ctrlKey || e.metaKey) {
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newZoom = Math.max(0.1, Math.min(10, this.state.zoom + delta));
            this.state.setZoom(newZoom);
            this.updateZoomDisplay();
        } else {
            // Regular wheel for pan
            this.state.setPan(
                this.state.panX - e.deltaX,
                this.state.panY - e.deltaY
            );
        }
        
        this.render();
    }
    
    onKeyDown(e) {
        // Spacebar for hand tool
        if (e.code === 'Space' && !this.isSpacePressed) {
            this.isSpacePressed = true;
            if (this.currentTool && this.currentTool.name !== 'hand') {
                this.previousTool = this.currentTool.name;
            }
            this.setTool('hand');
        }
        
        // Current tool key handling
        if (this.currentTool && this.currentTool.onKeyDown) {
            this.currentTool.onKeyDown(e);
        }
        
        // Global shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'z':
                    if (e.shiftKey) {
                        window.app?.history?.redo();
                    } else {
                        window.app?.history?.undo();
                    }
                    e.preventDefault();
                    break;
                case 'y':
                    window.app?.history?.redo();
                    e.preventDefault();
                    break;
                case 's':
                    window.app?.saveProject();
                    e.preventDefault();
                    break;
                case 'o':
                    document.getElementById('file-input').click();
                    e.preventDefault();
                    break;
                case 'n':
                    document.getElementById('new-doc-dialog').showModal();
                    e.preventDefault();
                    break;
            }
        }
    }
    
    onKeyUp(e) {
        if (e.code === 'Space') {
            this.isSpacePressed = false;
            if (this.previousTool && this.previousTool !== 'hand') {
                this.setTool(this.previousTool);
                this.previousTool = null;
            }
        }
        
        if (this.currentTool && this.currentTool.onKeyUp) {
            this.currentTool.onKeyUp(e);
        }
    }
    
    onResize() {
        this.renderer.resize();
        this.updateTransformBox();
        this.render();
    }
    
    setTool(toolName) {
        // Deactivate current tool
        if (this.currentTool) {
            this.currentTool.deactivate();
        }
        
        // Activate new tool
        this.currentTool = this.tools[toolName];
        if (this.currentTool) {
            this.currentTool.activate();
        }
        
        // Update UI
        this.state.setTool(toolName);
        this.updateToolButtons();
        this.setCursor(this.currentTool?.getCursorStyle() || 'default');
        
        // Show/hide transform box based on tool
        if (toolName === 'move') {
            this.showTransformBox();
        } else {
            this.hideTransformBox();
        }
    }
    
    updateToolButtons() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === this.state.activeTool);
        });
    }
    
    setCursor(cursor) {
        this.container.style.cursor = cursor;
    }
    
    showTransformBox() {
        const layers = this.state.getSelectedLayers();
        if (layers.length > 0) {
            this.updateTransformBox();
            this.transformBox.style.display = 'block';
        }
    }
    
    hideTransformBox() {
        this.transformBox.style.display = 'none';
    }
    
    updateTransformBox() {
        const layers = this.state.getSelectedLayers();
        if (layers.length === 0) {
            this.hideTransformBox();
            return;
        }
        
        // Calculate bounds
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        layers.forEach(layer => {
            minX = Math.min(minX, layer.x);
            minY = Math.min(minY, layer.y);
            maxX = Math.max(maxX, layer.x + layer.width);
            maxY = Math.max(maxY, layer.y + layer.height);
        });
        
        const width = maxX - minX;
        const height = maxY - minY;
        const zoom = this.state.zoom;
        
        this.transformBox.style.left = (minX * zoom) + 'px';
        this.transformBox.style.top = (minY * zoom) + 'px';
        this.transformBox.style.width = (width * zoom) + 'px';
        this.transformBox.style.height = (height * zoom) + 'px';
    }
    
    getTransformHandleAtPoint(x, y) {
        const rect = this.transformBox.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        
        // Convert to local coordinates
        const localX = (x * this.state.zoom) - parseFloat(this.transformBox.style.left || 0);
        const localY = (y * this.state.zoom) - parseFloat(this.transformBox.style.top || 0);
        const width = parseFloat(this.transformBox.style.width || 0);
        const height = parseFloat(this.transformBox.style.height || 0);
        
        const handleSize = 10;
        const margin = 5;
        
        // Check each handle position
        const handles = {
            'nw': { x: 0, y: 0 },
            'n': { x: width / 2, y: 0 },
            'ne': { x: width, y: 0 },
            'e': { x: width, y: height / 2 },
            'se': { x: width, y: height },
            's': { x: width / 2, y: height },
            'sw': { x: 0, y: height },
            'w': { x: 0, y: height / 2 }
        };
        
        for (const [name, pos] of Object.entries(handles)) {
            if (Math.abs(localX - pos.x) < handleSize + margin &&
                Math.abs(localY - pos.y) < handleSize + margin) {
                return name;
            }
        }
        
        // Check rotate handle
        if (Math.abs(localX - width / 2) < handleSize + margin &&
            Math.abs(localY - (-20)) < handleSize + margin) {
            return 'rotate';
        }
        
        return null;
    }
    
    updateZoomDisplay() {
        const display = document.getElementById('zoom-display');
        if (display) {
            display.textContent = Math.round(this.state.zoom * 100) + '%';
        }
    }
    
    render() {
        this.renderer.requestRender();
    }
    
    registerTool(name, toolClass) {
        this.tools[name] = new toolClass(this);
    }
    
    initialize() {
        // Initial render
        this.render();
        this.updateZoomDisplay();
    }
}

window.CanvasManager = CanvasManager;
