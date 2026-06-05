/**
 * History System - Undo/Redo functionality
 * Uses command pattern with efficient state snapshots
 */

class History {
    constructor(state, maxStack = 50) {
        this.state = state;
        this.maxStack = maxStack;
        this.undoStack = [];
        this.redoStack = [];
        this.isRecording = true;
        this.currentBatch = null;
        
        // Debounce timer for auto-save
        this.saveTimer = null;
        this.saveDelay = 1000;
    }
    
    /**
     * Save current state for undo
     */
    saveState(description = 'Edit') {
        if (!this.isRecording) return;
        
        // If we're in a batch, add to batch instead
        if (this.currentBatch) {
            this.currentBatch.actions.push({
                description,
                state: this.serializeState(),
                timestamp: Date.now(),
            });
            return;
        }
        
        const snapshot = {
            description,
            state: this.serializeState(),
            timestamp: Date.now(),
        };
        
        this.undoStack.push(snapshot);
        
        // Trim stack if too large
        if (this.undoStack.length > this.maxStack) {
            this.undoStack.shift();
        }
        
        // Clear redo stack on new action
        this.redoStack = [];
        
        // Emit history changed event
        this.state.emit('historyChanged', {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
        });
        
        // Auto-save to storage with debounce
        this.debouncedSave();
    }
    
    /**
     * Serialize the important parts of state
     */
    serializeState() {
        return {
            layers: this.state.layers.map(l => l.toJSON()),
            adjustments: { ...this.state.adjustments },
            canvasWidth: this.state.canvasWidth,
            canvasHeight: this.state.canvasHeight,
            backgroundColor: this.state.backgroundColor,
        };
    }
    
    /**
     * Restore state from snapshot
     */
    restoreState(snapshot) {
        const LayerClass = typeof Layer !== 'undefined' ? Layer : window.Layer;
        
        this.state.layers = (snapshot.layers || []).map(l => LayerClass.fromJSON(l));
        this.state.adjustments = snapshot.adjustments || { ...this.state.adjustments };
        this.state.canvasWidth = snapshot.canvasWidth || this.state.canvasWidth;
        this.state.canvasHeight = snapshot.canvasHeight || this.state.canvasHeight;
        this.state.backgroundColor = snapshot.backgroundColor || this.state.backgroundColor;
        this.state.selectedLayerIds = [];
        this.state.activeLayerId = null;
        
        this.state.emit('layersChanged');
        this.state.emit('change', { key: 'historyRestore', value: snapshot });
    }
    
    /**
     * Undo last action
     */
    undo() {
        if (!this.canUndo()) return false;
        
        const current = this.serializeState();
        const previous = this.undoStack.pop();
        
        this.redoStack.push({
            description: previous.description,
            state: current,
            timestamp: Date.now(),
        });
        
        this.restoreState(previous.state);
        
        this.state.emit('historyChanged', {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
        });
        
        return true;
    }
    
    /**
     * Redo last undone action
     */
    redo() {
        if (!this.canRedo()) return false;
        
        const current = this.serializeState();
        const next = this.redoStack.pop();
        
        this.undoStack.push({
            description: next.description,
            state: current,
            timestamp: Date.now(),
        });
        
        this.restoreState(next.state);
        
        this.state.emit('historyChanged', {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
        });
        
        return true;
    }
    
    /**
     * Check if undo is available
     */
    canUndo() {
        return this.undoStack.length > 0;
    }
    
    /**
     * Check if redo is available
     */
    canRedo() {
        return this.redoStack.length > 0;
    }
    
    /**
     * Start a batch operation (multiple changes as one undo)
     */
    startBatch(description = 'Batch Edit') {
        this.currentBatch = {
            description,
            actions: [],
            startTime: Date.now(),
        };
    }
    
    /**
     * End batch operation and save as single undo
     */
    endBatch() {
        if (!this.currentBatch) return;
        
        if (this.currentBatch.actions.length > 0) {
            // Save the last state of the batch
            const lastAction = this.currentBatch.actions[this.currentBatch.actions.length - 1];
            
            const snapshot = {
                description: this.currentBatch.description,
                state: lastAction.state,
                timestamp: Date.now(),
            };
            
            this.undoStack.push(snapshot);
            
            if (this.undoStack.length > this.maxStack) {
                this.undoStack.shift();
            }
            
            this.redoStack = [];
            
            this.state.emit('historyChanged', {
                canUndo: this.canUndo(),
                canRedo: this.canRedo(),
            });
        }
        
        this.currentBatch = null;
    }
    
    /**
     * Execute a function within a batch
     */
    batch(description, fn) {
        this.startBatch(description);
        try {
            fn();
        } finally {
            this.endBatch();
        }
    }
    
    /**
     * Clear history
     */
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.state.emit('historyChanged', {
            canUndo: false,
            canRedo: false,
        });
    }
    
    /**
     * Get history info
     */
    getInfo() {
        return {
            undoCount: this.undoStack.length,
            redoCount: this.redoStack.length,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            lastAction: this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null,
        };
    }
    
    /**
     * Debounced save to localStorage
     */
    debouncedSave() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        this.saveTimer = setTimeout(() => {
            this.state.saveToStorage();
        }, this.saveDelay);
    }
    
    /**
     * Disable recording (for programmatic changes)
     */
    disableRecording() {
        this.isRecording = false;
    }
    
    /**
     * Enable recording
     */
    enableRecording() {
        this.isRecording = true;
    }
}

// Make globally available
if (typeof window !== 'undefined') {
    window.History = History;
}
