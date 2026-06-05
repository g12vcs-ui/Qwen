// PixelForge - Utility Helpers

/**
 * Generate a unique ID
 */
export function generateId() {
    return 'layer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians) {
    return radians * 180 / Math.PI;
}

/**
 * Check if a point is inside a rectangle
 */
export function pointInRect(px, py, rx, ry, rw, rh, rotation = 0) {
    if (rotation === 0) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    }
    
    // Rotate point around rectangle center
    const cx = rx + rw / 2;
    const cy = ry + rh / 2;
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    
    const dx = px - cx;
    const dy = py - cy;
    
    const rotatedX = dx * cos - dy * sin;
    const rotatedY = dx * sin + dy * cos;
    
    return rotatedX >= -rw / 2 && rotatedX <= rw / 2 &&
           rotatedY >= -rh / 2 && rotatedY <= rh / 2;
}

/**
 * Get distance between two points
 */
export function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Deep clone an object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Throttle function calls
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Debounce function calls
 */
export function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Load image from URL or data URL
 */
export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Create a canvas element
 */
export function createCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

/**
 * Get canvas context
 */
export function getContext(canvas, type = '2d') {
    return canvas.getContext(type);
}

/**
 * Draw checkerboard pattern for transparency
 */
export function drawCheckerboard(ctx, width, height, size = 10) {
    const canvas = ctx.canvas;
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    
    // Temporarily resize for pattern
    canvas.width = size * 2;
    canvas.height = size * 2;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size * 2, size * 2);
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(0, 0, size, size);
    ctx.fillRect(size, size, size, size);
    
    // Create pattern
    const pattern = ctx.createPattern(canvas, 'repeat');
    
    // Restore original size
    canvas.width = originalWidth;
    canvas.height = originalHeight;
    
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
}

/**
 * Apply CSS filter string from adjustments
 */
export function getFilterString(adj) {
    const { brightness = 0, contrast = 0, saturation = 0, hue = 0, blur = 0 } = adj || {};
    return `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%) hue-rotate(${hue}deg) blur(${blur}px)`;
}

/**
 * Hex to RGB conversion
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * RGB to Hex conversion
 */
export function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

/**
 * Get file extension
 */
export function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Export for non-module usage
window.PFUtils = {
    generateId,
    clamp,
    degToRad,
    radToDeg,
    pointInRect,
    distance,
    deepClone,
    throttle,
    debounce,
    loadImage,
    createCanvas,
    getContext,
    drawCheckerboard,
    getFilterString,
    hexToRgb,
    rgbToHex,
    getFileExtension,
    formatBytes
};
