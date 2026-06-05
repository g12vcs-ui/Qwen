# PixelForge - Professional Browser-Based Image Editor

A production-grade, browser-based image editor built with vanilla JavaScript. No backend required.

## Features

### Core Editing
- **Multi-layer support** - Image, text, shape, brush layers with full layer management
- **Transform tools** - Move, scale, rotate, flip with visual handles
- **Advanced selection** - Rectangle marquee selection with multi-select support

### Tools
- **Move Tool (V)** - Select and transform layers with drag handles
- **Select Tool (A)** - Marquee selection for multiple layers
- **Text Tool (T)** - Add editable text with font customization
- **Shape Tool (U)** - Rectangles, circles with fill/stroke options
- **Brush Tool (B)** - Freehand drawing with size/opacity controls
- **Eraser Tool (E)** - Remove content from layers
- **Crop Tool (C)** - Crop canvas to selection
- **Eyedropper Tool (I)** - Sample colors from canvas
- **Hand Tool (H)** - Pan around the canvas

### Adjustments
- Brightness, Contrast, Saturation
- Hue rotation
- Blur effects

### Layer Management
- Visibility toggle
- Lock/unlock layers
- Opacity control
- Drag-to-reorder
- Delete layers
- Layer thumbnails

### File Operations
- Import images (PNG, JPG, WEBP, SVG)
- Drag-and-drop support
- Clipboard paste support
- Export as PNG, JPEG, WEBP
- Save/Load project files (JSON)
- Auto-save to localStorage

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| V | Move Tool |
| A | Select Tool |
| T | Text Tool |
| U | Shape Tool |
| B | Brush Tool |
| E | Eraser Tool |
| C | Crop Tool |
| I | Eyedropper |
| H | Hand Tool |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z / Ctrl+Y | Redo |
| Ctrl+S | Save Project |
| Ctrl+O | Open File |
| Ctrl+N | New Project |
| Delete/Backspace | Delete Selected |
| Space (hold) | Temporary Hand Tool |
| Shift+Drag | Maintain aspect ratio |

## Architecture

```
src/
├── main.js           # Application entry point
├── models/
│   └── Layer.js      # Layer data model
├── state/
│   └── State.js      # Central state management
├── history/
│   └── History.js    # Undo/Redo system
├── canvas/
│   └── Renderer.js   # Canvas rendering engine
├── tools/
│   ├── BaseTool.js   # Base tool class
│   ├── MoveTool.js
│   ├── SelectTool.js
│   ├── TextTool.js
│   ├── ShapeTool.js
│   ├── BrushTool.js
│   ├── EraserTool.js
│   ├── CropTool.js
│   ├── EyedropperTool.js
│   └── HandTool.js
├── export/
│   └── Exporter.js   # Export functionality
├── ui/
│   └── UIManager.js  # UI interactions
└── utils/
    └── helpers.js    # Utility functions
```

## Usage

1. Open `index.html` in a modern browser
2. Start editing!

### Creating a New Project
- Click "File" → "New Project" or press Ctrl+N
- Set canvas dimensions and background color
- Choose from preset sizes

### Importing Images
- Click "File" → "Import Image"
- Drag and drop files onto the canvas
- Paste from clipboard (Ctrl+V)

### Working with Layers
- Use the Layers panel on the right
- Click to select, shift-click for multi-select
- Drag to reorder
- Toggle visibility with eye icon
- Lock layers with lock icon

### Exporting
- Click "Export" button or File menu
- Choose format (PNG, JPEG, WEBP)
- Set quality and scale options
- Download your creation

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

Required features:
- Canvas API
- Pointer Events
- ES6+ JavaScript
- LocalStorage

## Performance Considerations

- Uses requestAnimationFrame for smooth rendering
- Efficient layer caching
- Debounced auto-save
- Optimized for large canvases

## Extending

The modular architecture makes it easy to add:
- New tools (extend BaseTool)
- New layer types
- Custom filters/effects
- Additional export formats

## License

MIT License - Feel free to use and modify for your projects.
