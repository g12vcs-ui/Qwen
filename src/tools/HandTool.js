// PixelForge - Hand Tool (Pan)

class HandTool extends BaseTool {
    constructor(canvasManager) {
        super('hand', canvasManager);
    }
    
    onActivate() {
        this.canvasManager.setCursor('grab');
    }
    
    onDeactivate() {
        this.canvasManager.setCursor('default');
    }
    
    getCursorStyle() {
        return this.isDragging ? 'grabbing' : 'grab';
    }
    
    onPointerDown(e, x, y) {
        super.onPointerDown(e, x, y);
        this.startPanX = this.state.panX;
        this.startPanY = this.state.panY;
        this.canvasManager.setCursor('grabbing');
    }
    
    onPointerMove(e, x, y) {
        super.onPointerMove(e, x, y);
        
        if (!this.isDragging) return;
        
        const dx = x - this.lastX;
        const dy = y - this.lastY;
        
        this.state.setPan(this.startPanX + dx, this.startPanY + dy);
    }
    
    onPointerUp(e, x, y) {
        super.onPointerUp(e, x, y);
        this.canvasManager.setCursor('grab');
    }
    
    onKeyDown(e) {
        // Pan with arrow keys
        const step = e.shiftKey ? 50 : 10;
        
        switch (e.key) {
            case 'ArrowUp':
                this.state.setPan(this.state.panX, this.state.panY + step);
                break;
            case 'ArrowDown':
                this.state.setPan(this.state.panX, this.state.panY - step);
                break;
            case 'ArrowLeft':
                this.state.setPan(this.state.panX + step, this.state.panY);
                break;
            case 'ArrowRight':
                this.state.setPan(this.state.panX - step, this.state.panY);
                break;
        }
    }
}

window.HandTool = HandTool;
