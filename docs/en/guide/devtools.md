# DevTools

Canvas Editor DevTools is a browser extension for debugging and analyzing Canvas Editor instances.

::: tip
Plugin repository: https://github.com/Hufe921/canvas-editor-devtools
:::

## Installation

### Development Mode Installation

1. Clone or download the plugin repository
2. Open Chrome browser and visit `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click the "Load unpacked" button
5. Select the plugin project folder

## Features

### Element Tree Inspector

- View Canvas Editor document structure in real-time
- Support for main content, header, and footer zones
- Click elements to view detailed styles and properties
- Quickly locate specific elements in the document

### Event Monitor

Monitor the following types of events in real-time:

- Content change events
- Selection style change events
- Page events
- Control events
- Image events
- Mouse events

Supports filtering by event category and auto-scroll to view latest logs.

### Configuration Panel

- View current editor configuration
- Modify appearance, watermark, page numbers, etc.
- Adjust table styles and control styles
- Configure cursor-related options

## Usage

1. Open a webpage using Canvas Editor
2. Ensure the page has exposed the editor instance to `window.__CANVAS_EDITOR_INSTANCE__`
3. Press F12 or right-click and select "Inspect" to open Developer Tools
4. Find and click the "Canvas Editor" tab

::: tip
The editor instance can be exposed as follows:

```javascript
// Mount the editor instance to the window object
window.__CANVAS_EDITOR_INSTANCE__ = editor
```
:::
