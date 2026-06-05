/**
 * Hand Tool - For panning the viewport
 */

class HandTool extends BaseTool {
    constructor(editor) {
        super('hand', editor);
        this.cursor = 'grab';
        
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
    }
    
    onActivate() {
        this.editor.canvas.style.cursor = 'grab';
    }
    
    onPointerDown(event) {
        if (event.button !== 0 && event.button !== 1) return; // Left or middle click
        
        this.isPanning = true;
        this.panStart = {
            x: event.clientX - this.state.panX,
            y: event.clientY - this.state.panY,
        };
        this.editor.canvas.style.cursor = 'grabbing';
        event.preventDefault();
    }
    
    onPointerMove(event) {
        if (!this.isPanning) return;
        
        const newPanX = event.clientX - this.panStart.x;
        const newPanY = event.clientY - this.panStart.y;
        
        this.state.panX = newPanX;
        this.state.panY = newPanY;
        
        this.state.emit('viewportChanged');
    }
    
    onPointerUp(event) {
        this.isPanning = false;
        this.editor.canvas.style.cursor = 'grab';
    }
    
    onPointerLeave(event) {
        if (this.isPanning) {
            this.isPanning = false;
            this.editor.canvas.style.cursor = 'grab';
        }
    }
}

if (typeof window !== 'undefined') {
    window.HandTool = HandTool;
}
