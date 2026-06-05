/**
 * Utility Functions - Helper functions used throughout the app
 */

const Utils = {
    /**
     * Generate a unique ID
     */
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    /**
     * Clamp a value between min and max
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    /**
     * Linear interpolation
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    },
    
    /**
     * Convert degrees to radians
     */
    degToRad(degrees) {
        return degrees * Math.PI / 180;
    },
    
    /**
     * Convert radians to degrees
     */
    radToDeg(radians) {
        return radians * 180 / Math.PI;
    },
    
    /**
     * Snap value to grid
     */
    snapToGrid(value, gridSize) {
        return Math.round(value / gridSize) * gridSize;
    },
    
    /**
     * Check if point is inside rectangle
     */
    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },
    
    /**
     * Get distance between two points
     */
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    /**
     * Get angle between two points
     */
    angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    
    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    /**
     * Download data as file
     */
    downloadFile(data, filename, mimeType = 'application/octet-stream') {
        const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },
    
    /**
     * Read file as data URL
     */
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    /**
     * Read file as text
     */
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    },
    
    /**
     * Load image from URL or data URL
     */
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    },
    
    /**
     * Create canvas element
     */
    createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    },
    
    /**
     * Get canvas context
     */
    getContext(canvas, type = '2d') {
        return canvas.getContext(type);
    },
    
    /**
     * Resize canvas with content preservation
     */
    resizeCanvas(canvas, width, height) {
        const ctx = canvas.getContext('2d');
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCanvas.getContext('2d').drawImage(canvas, 0, 0);
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(tempCanvas, 0, 0);
    },
    
    /**
     * Apply CSS transform to element
     */
    setTransform(element, x, y, scale = 1, rotation = 0) {
        element.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotation}deg)`;
    },
    
    /**
     * Parse CSS color to RGBA object
     */
    parseColor(color) {
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.fillStyle = color;
        const normalized = ctx.fillStyle;
        
        const match = normalized.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
        if (match) {
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3]),
                a: match[4] ? parseFloat(match[4]) : 1,
            };
        }
        
        // Handle hex colors
        const hexMatch = normalized.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
        if (hexMatch) {
            return {
                r: parseInt(hexMatch[1], 16),
                g: parseInt(hexMatch[2], 16),
                b: parseInt(hexMatch[3], 16),
                a: 1,
            };
        }
        
        return { r: 0, g: 0, b: 0, a: 1 };
    },
    
    /**
     * Convert RGBA to CSS color string
     */
    rgbaToString({ r, g, b, a = 1 }) {
        if (a === 1) {
            return `rgb(${r}, ${g}, ${b})`;
        }
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    },
    
    /**
     * Debounce function
     */
    debounce(fn, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    },
    
    /**
     * Throttle function
     */
    throttle(fn, limit) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * Deep clone an object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    /**
     * Check if object is empty
     */
    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    },
    
    /**
     * Get modifier keys state from event
     */
    getModifierState(event) {
        return {
            shift: event.shiftKey,
            ctrl: event.ctrlKey || event.metaKey,
            alt: event.altKey,
        };
    },
    
    /**
     * Format number with fixed decimals
     */
    formatNumber(num, decimals = 2) {
        return Number(num.toFixed(decimals));
    },
    
    /**
     * Map value from one range to another
     */
    mapRange(value, inMin, inMax, outMin, outMax) {
        return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    },
};

// Make globally available
if (typeof window !== 'undefined') {
    window.Utils = Utils;
}
