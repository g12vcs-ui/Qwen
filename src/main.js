// PixelForge - Main Application Entry Point

class PixelForgeApp {
    constructor() {
        this.state = null;
        this.canvasManager = null;
        this.uiManager = null;
        this.history = null;
        this.exporter = null;
        
        this.init();
    }
    
    init() {
        console.log('PixelForge initializing...');
        
        // Initialize state
        this.state = new State();
        
        // Initialize canvas manager
        this.canvasManager = new CanvasManager(this.state);
        
        // Initialize history
        this.history = new History(this.state);
        
        // Initialize exporter
        this.exporter = new Exporter(this.state);
        
        // Register tools
        this.registerTools();
        
        // Initialize UI
        this.uiManager = new UIManager(this.state, this.canvasManager);
        
        // Setup clipboard paste
        this.setupClipboardPaste();
        
        // Setup autosave
        this.setupAutosave();
        
        // Initialize canvas
        this.canvasManager.initialize();
        
        // Update UI
        this.uiManager.updateLayerList();
        
        console.log('PixelForge ready!');
        
        // Expose app globally for debugging
        window.app = this;
    }
    
    registerTools() {
        this.canvasManager.registerTool('move', MoveTool);
        this.canvasManager.registerTool('select', SelectTool);
        this.canvasManager.registerTool('text', TextTool);
        this.canvasManager.registerTool('shape', ShapeTool);
        this.canvasManager.registerTool('brush', BrushTool);
        this.canvasManager.registerTool('eraser', EraserTool);
        this.canvasManager.registerTool('crop', CropTool);
        this.canvasManager.registerTool('eyedropper', EyedropperTool);
        this.canvasManager.registerTool('hand', HandTool);
    }
    
    setupClipboardPaste() {
        document.addEventListener('paste', (e) => {
            // Don't paste when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            const items = e.clipboardData?.items;
            if (!items) return;
            
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                
                if (item.type.startsWith('image/')) {
                    const blob = item.getAsFile();
                    if (blob) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const img = new Image();
                            img.onload = () => {
                                const layer = new Layer({
                                    type: 'image',
                                    name: 'Pasted Image',
                                    x: 100,
                                    y: 100,
                                    width: img.width,
                                    height: img.height,
                                    image: img
                                });
                                this.state.addLayer(layer);
                                this.canvasManager.render();
                            };
                            img.src = event.target.result;
                        };
                        reader.readAsDataURL(blob);
                    }
                    return;
                }
            }
        });
    }
    
    setupAutosave() {
        // Autosave every 30 seconds
        setInterval(() => {
            this.state.saveToStorage();
            console.log('Project autosaved');
        }, 30000);
        
        // Save on page unload
        window.addEventListener('beforeunload', () => {
            this.state.saveToStorage();
        });
    }
    
    saveProject() {
        this.exporter.exportProject();
    }
    
    exportImage(format, quality, scale) {
        this.exporter.exportImage(format, quality, scale);
    }
    
    newDocument(width, height, backgroundColor) {
        this.state.clear();
        this.state.setDimensions(width, height);
        this.state.setBackgroundColor(backgroundColor);
        this.history.clear();
        this.canvasManager.render();
    }
    
    openProject(data) {
        this.state.fromJSON(data);
        this.history.clear();
        this.canvasManager.render();
    }
    
    getSelectedLayers() {
        return this.state.getSelectedLayers();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PixelForgeApp();
});
