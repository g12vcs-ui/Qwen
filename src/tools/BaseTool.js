/**
 * Base Tool - Abstract base class for all tools
 */

class BaseTool {
    constructor(name, editor) {
        this.name = name;
        this.editor = editor;
        this.state = editor.state;
        this.canvas = editor.canvas;
        this.ctx = editor.ctx;
        this.isActive = false;
        
        // Cursor style for this tool
        this.cursor = 'default';
        
        // Event handlers bound to this instance
        this.handlers = {
            pointerdown: this.onPointerDown.bind(this),
            pointermove: this.onPointerMove.bind(this),
            pointerup: this.onPointerUp.bind(this),
            pointerleave: this.onPointerLeave.bind(this),
            dblclick: this.onDoubleClick.bind(this),
            wheel: this.onWheel.bind(this),
            keydown: this.onKeyDown.bind(this),
            keyup: this.onKeyUp.bind(this),
        };
    }
    
    /**
     * Activate the tool
     */
    activate() {
        this.isActive = true;
        this.attachEvents();
        this.onActivate();
        this.setCursor();
    }
    
    /**
     * Deactivate the tool
     */
    deactivate() {
        this.isActive = false;
        this.detachEvents();
        this.onDeactivate();
    }
    
    /**
     * Attach event listeners
     */
    attachEvents() {
        this.canvas.addEventListener('pointerdown', this.handlers.pointerdown);
        this.canvas.addEventListener('pointermove', this.handlers.pointermove);
        this.canvas.addEventListener('pointerup', this.handlers.pointerup);
        this.canvas.addEventListener('pointerleave', this.handlers.pointerleave);
        this.canvas.addEventListener('dblclick', this.handlers.dblclick);
        this.canvas.addEventListener('wheel', this.handlers.wheel, { passive: false });
        document.addEventListener('keydown', this.handlers.keydown);
        document.addEventListener('keyup', this.handlers.keyup);
    }
    
    /**
     * Detach event listeners
     */
    detachEvents() {
        this.canvas.removeEventListener('pointerdown', this.handlers.pointerdown);
        this.canvas.removeEventListener('pointermove', this.handlers.pointermove);
        this.canvas.removeEventListener('pointerup', this.handlers.pointerup);
        this.canvas.removeEventListener('pointerleave', this.handlers.pointerleave);
        this.canvas.removeEventListener('dblclick', this.handlers.dblclick);
        this.canvas.removeEventListener('wheel', this.handlers.wheel);
        document.removeEventListener('keydown', this.handlers.keydown);
        document.removeEventListener('keyup', this.handlers.keyup);
    }
    
    /**
     * Set cursor for this tool
     */
    setCursor() {
        this.canvas.style.cursor = this.cursor;
    }
    
    /**
     * Get canvas coordinates from pointer event
     */
    getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        const zoom = this.state.zoom;
        
        return {
            x: (event.clientX - rect.left) / zoom,
            y: (event.clientY - rect.top) / zoom,
        };
    }
    
    /**
     * Check if modifier keys are pressed
     */
    getModifiers(event) {
        return {
            shift: event.shiftKey,
            ctrl: event.ctrlKey || event.metaKey,
            alt: event.altKey,
            space: this.editor.spacePressed,
        };
    }
    
    /**
     * Snap coordinates to grid if enabled
     */
    snapToGrid(x, y) {
        if (this.state.snapToGrid) {
            const gridSize = this.state.gridSize;
            return {
                x: Math.round(x / gridSize) * gridSize,
                y: Math.round(y / gridSize) * gridSize,
            };
        }
        return { x, y };
    }
    
    /**
     * Called when tool is activated
     */
    onActivate() {
        // Override in subclasses
    }
    
    /**
     * Called when tool is deactivated
     */
    onDeactivate() {
        // Override in subclasses
    }
    
    /**
     * Handle pointer down event
     */
    onPointerDown(event) {
        // Override in subclasses
    }
    
    /**
     * Handle pointer move event
     */
    onPointerMove(event) {
        // Override in subclasses
    }
    
    /**
     * Handle pointer up event
     */
    onPointerUp(event) {
        // Override in subclasses
    }
    
    /**
     * Handle pointer leave event
     */
    onPointerLeave(event) {
        // Override in subclasses
    }
    
    /**
     * Handle double click event
     */
    onDoubleClick(event) {
        // Override in subclasses
    }
    
    /**
     * Handle wheel event
     */
    onWheel(event) {
        // Override in subclasses
    }
    
    /**
     * Handle key down event
     */
    onKeyDown(event) {
        // Override in subclasses
    }
    
    /**
     * Handle key up event
     */
    onKeyUp(event) {
        // Override in subclasses
    }
}

// Make globally available
if (typeof window !== 'undefined') {
    window.BaseTool = BaseTool;
}
