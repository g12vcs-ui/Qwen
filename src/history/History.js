// PixelForge - History System (Undo/Redo)

class History {
    constructor(state, maxStates = 50) {
        this.state = state;
        this.maxStates = maxStates;
        this.undoStack = [];
        this.redoStack = [];
        this.isRecording = true;
        this.batchDepth = 0;
        this.batchState = null;
        
        // Bind to state events
        this.setupListeners();
    }
    
    setupListeners() {
        this.state.on('layersChanged', () => {
            if (this.isRecording && this.batchDepth === 0) {
                this.saveState();
            }
        });
        
        this.state.on('canvasResized', () => {
            if (this.isRecording && this.batchDepth === 0) {
                this.saveState();
            }
        });
    }
    
    saveState() {
        const snapshot = {
            layers: this.state.layers.map(l => l.toJSON()),
            canvasWidth: this.state.canvasWidth,
            canvasHeight: this.state.canvasHeight,
            backgroundColor: this.state.backgroundColor,
            adjustments: { ...this.state.adjustments }
        };
        
        this.undoStack.push(snapshot);
        
        // Limit stack size
        while (this.undoStack.length > this.maxStates) {
            this.undoStack.shift();
        }
        
        // Clear redo stack on new action
        this.redoStack = [];
        
        this.updateButtons();
    }
    
    beginBatch() {
        this.batchDepth++;
        if (this.batchDepth === 1) {
            this.batchState = {
                layers: this.state.layers.map(l => l.toJSON()),
                canvasWidth: this.state.canvasWidth,
                canvasHeight: this.state.canvasHeight,
                backgroundColor: this.state.backgroundColor
            };
        }
    }
    
    endBatch() {
        this.batchDepth = Math.max(0, this.batchDepth - 1);
        if (this.batchDepth === 0 && this.batchState) {
            // Check if anything changed
            const currentState = {
                layers: this.state.layers.map(l => l.toJSON()),
                canvasWidth: this.state.canvasWidth,
                canvasHeight: this.state.canvasHeight,
                backgroundColor: this.state.backgroundColor
            };
            
            if (JSON.stringify(this.batchState) !== JSON.stringify(currentState)) {
                this.undoStack.push(this.batchState);
                while (this.undoStack.length > this.maxStates) {
                    this.undoStack.shift();
                }
                this.redoStack = [];
                this.updateButtons();
            }
            
            this.batchState = null;
        }
    }
    
    undo() {
        if (this.undoStack.length === 0) return false;
        
        // Save current state to redo stack
        const currentState = {
            layers: this.state.layers.map(l => l.toJSON()),
            canvasWidth: this.state.canvasWidth,
            canvasHeight: this.state.canvasHeight,
            backgroundColor: this.state.backgroundColor,
            adjustments: { ...this.state.adjustments }
        };
        this.redoStack.push(currentState);
        
        // Pop from undo stack and restore
        const previousState = this.undoStack.pop();
        this.restoreState(previousState);
        
        this.updateButtons();
        return true;
    }
    
    redo() {
        if (this.redoStack.length === 0) return false;
        
        // Save current state to undo stack
        const currentState = {
            layers: this.state.layers.map(l => l.toJSON()),
            canvasWidth: this.state.canvasWidth,
            canvasHeight: this.state.canvasHeight,
            backgroundColor: this.state.backgroundColor,
            adjustments: { ...this.state.adjustments }
        };
        this.undoStack.push(currentState);
        
        // Pop from redo stack and restore
        const nextState = this.redoStack.pop();
        this.restoreState(nextState);
        
        this.updateButtons();
        return true;
    }
    
    restoreState(snapshot) {
        this.isRecording = false;
        
        // Restore layers
        this.state.layers = snapshot.layers.map(data => Layer.fromJSON(data));
        
        // Restore document settings
        this.state.canvasWidth = snapshot.canvasWidth;
        this.state.canvasHeight = snapshot.canvasHeight;
        this.state.backgroundColor = snapshot.backgroundColor;
        
        if (snapshot.adjustments) {
            this.state.adjustments = { ...snapshot.adjustments };
        }
        
        // Clear selection
        this.state.selectedLayerIds = [];
        
        // Emit events
        this.state.emit('projectLoaded');
        this.state.emit('layersChanged');
        this.state.emit('canvasResized');
        this.state.emit('selectionChanged');
        
        this.isRecording = true;
    }
    
    updateButtons() {
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');
        
        if (undoBtn) {
            undoBtn.disabled = this.undoStack.length === 0;
        }
        if (redoBtn) {
            redoBtn.disabled = this.redoStack.length === 0;
        }
    }
    
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.updateButtons();
    }
    
    canUndo() {
        return this.undoStack.length > 0;
    }
    
    canRedo() {
        return this.redoStack.length > 0;
    }
}

window.History = History;
