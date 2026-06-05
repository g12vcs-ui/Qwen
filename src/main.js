/**
 * PixelForge - Main Application Entry Point
 * A professional browser-based image editor
 */

class PixelForge {
    constructor() {
        // Core components
        this.state = null;
        this.history = null;
        this.renderer = null;
        this.exporter = null;
        this.ui = null;
        
        // Tools registry
        this.tools = {};
        this.currentTool = null;
        
        // Canvas elements
        this.canvas = null;
        this.ctx = null;
        
        // Input state
        this.spacePressed = false;
        
        // Initialize on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    /**
     * Initialize the application
     */
    init() {
        console.log('PixelForge initializing...');
        
        // Get canvas elements
        this.canvas = document.getElementById('mainCanvas');
        this.container = document.getElementById('canvasContainer');
        
        if (!this.canvas || !this.container) {
            console.error('Canvas elements not found');
            return;
        }
        
        // Initialize core systems
        this.initState();
        this.initHistory();
        this.initRenderer();
        this.initExporter();
        this.initTools();
        this.initUI();
        this.initEventListeners();
        
        // Load existing project or create default
        if (!this.state.loadFromStorage()) {
            this.createDefaultProject();
        }
        
        // Set initial tool
        this.setTool('move');
        
        console.log('PixelForge ready!');
    }
    
    /**
     * Initialize state management
     */
    initState() {
        this.state = new State();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.state.emit('viewportChanged');
        });
    }
    
    /**
     * Initialize history system
     */
    initHistory() {
        this.history = new History(this.state);
    }
    
    /**
     * Initialize renderer
     */
    initRenderer() {
        this.renderer = new Renderer(this.state);
        this.renderer.init(this.canvas, this.container);
    }
    
    /**
     * Initialize exporter
     */
    initExporter() {
        this.exporter = new Exporter(this.state, this.renderer);
    }
    
    /**
     * Initialize all tools
     */
    initTools() {
        this.tools = {
            move: new MoveTool(this),
            select: new SelectTool(this),
            text: new TextTool(this),
            shape: new ShapeTool(this),
            brush: new BrushTool(this),
            eraser: new EraserTool(this),
            crop: new CropTool(this),
            eyedropper: new EyedropperTool(this),
            hand: new HandTool(this),
        };
    }
    
    /**
     * Initialize UI manager
     */
    initUI() {
        this.ui = new UIManager(this);
        
        // Subscribe to selection changes for properties panel
        this.state.subscribe('selectionChanged', () => {
            this.ui.updatePropertiesPanel();
        });
    }
    
    /**
     * Initialize global event listeners
     */
    initEventListeners() {
        // Spacebar for hand tool
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.spacePressed) {
                this.spacePressed = true;
                if (this.currentTool && this.currentTool.name !== 'hand') {
                    this.previousTool = this.currentTool.name;
                    this.setTool('hand');
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.spacePressed = false;
                if (this.previousTool && this.currentTool.name === 'hand') {
                    this.setTool(this.previousTool);
                    this.previousTool = null;
                }
            }
        });
        
        // Wheel zoom
        this.canvas.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                this.state.setZoom(this.state.zoom * delta);
            }
        }, { passive: false });
        
        // Middle click pan
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1) {
                e.preventDefault();
                if (this.currentTool && this.currentTool.name !== 'hand') {
                    this.previousTool = this.currentTool.name;
                    this.setTool('hand');
                    this.middleClickPan = true;
                }
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            if (e.button === 1 && this.middleClickPan) {
                this.middleClickPan = false;
                if (this.previousTool && this.currentTool.name === 'hand') {
                    this.setTool(this.previousTool);
                    this.previousTool = null;
                }
            }
        });
        
        // Clipboard paste
        document.addEventListener('paste', (e) => {
            const items = e.clipboardData?.items;
            if (items) {
                for (const item of items) {
                    if (item.type.startsWith('image/')) {
                        const blob = item.getAsFile();
                        this.ui.importImage(blob);
                        break;
                    }
                }
            }
        });
    }
    
    /**
     * Set active tool
     */
    setTool(toolName) {
        if (!this.tools[toolName]) {
            console.warn(`Tool "${toolName}" not found`);
            return;
        }
        
        // Deactivate current tool
        if (this.currentTool) {
            this.currentTool.deactivate();
        }
        
        // Activate new tool
        this.currentTool = this.tools[toolName];
        this.currentTool.activate();
        
        // Update state
        this.state.currentTool = toolName;
        
        console.log(`Tool changed to: ${toolName}`);
    }
    
    /**
     * Create default project
     */
    createDefaultProject() {
        this.state.canvasWidth = 1920;
        this.state.canvasHeight = 1080;
        this.state.backgroundColor = '#ffffff';
        this.state.projectName = 'Untitled';
        
        this.state.emit('change', { key: 'project', value: 'new' });
    }
    
    /**
     * Create new project with specified dimensions
     */
    createNewProject(width, height, backgroundColor) {
        this.history.saveState('New Project');
        
        this.state.canvasWidth = width;
        this.state.canvasHeight = height;
        this.state.backgroundColor = backgroundColor || '#ffffff';
        this.state.layers = [];
        this.state.adjustments = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            blur: 0,
        };
        this.state.selectedLayerIds = [];
        this.state.activeLayerId = null;
        
        this.history.clear();
        this.state.emit('change', { key: 'project', value: 'new' });
        this.state.emit('layersChanged');
    }
    
    /**
     * Get current state summary
     */
    getStateSummary() {
        return {
            canvasSize: `${this.state.canvasWidth}x${this.state.canvasHeight}`,
            layerCount: this.state.layers.length,
            selectedCount: this.state.selectedLayerIds.length,
            zoom: Math.round(this.state.zoom * 100) + '%',
            tool: this.state.currentTool,
        };
    }
    
    /**
     * Save project
     */
    save() {
        this.state.saveToStorage();
        console.log('Project saved');
    }
    
    /**
     * Export current canvas
     */
    async export(options = {}) {
        return await this.exporter.export('png', options);
    }
}

// Make globally available and initialize
if (typeof window !== 'undefined') {
    window.PixelForge = PixelForge;
    
    // Auto-initialize when script loads
    window.app = new PixelForge();
}
