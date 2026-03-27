# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server
- `npm run lib` - Build library (runs lint, type check, and builds library)
- `npm run build` - Build app (runs lint, type check, and builds app)
- `npm run lint` - Run ESLint
- `npm run type:check` - Run TypeScript type checking without emitting
- `npm run cypress:open` - Open Cypress test runner GUI
- `npm run cypress:run` - Run Cypress tests headlessly
- `npm run docs:dev` - Start VitePress documentation server
- `npm run docs:build` - Build VitePress documentation
- `npm run release` - Run release script

To run a single Cypress test file: `npx cypress run --spec cypress/e2e/<test-file>.cy.ts`

## Git Hooks

Pre-commit hooks run `npm run lint` and `npm run type:check`. Commit message must follow Conventional Commits format: `feat:`, `fix:`, `docs:`, `refactor:`, etc.

## Architecture Overview

This is a canvas-based rich text editor built with TypeScript. The core architecture follows a modular, layered design:

### Core Components

**Editor Class** (`src/editor/index.ts`)
- Main entry point that orchestrates all subsystems
- Exposes public API via the `command` property (e.g., `editor.command.executeBold()`)
- Manages lifecycle through `destroy()` method

**Draw Class** (`src/editor/core/draw/Draw.ts`)
- Central rendering engine (~96KB) responsible for canvas drawing
- Manages pages, rows, elements, and cursor rendering
- Coordinates all particle types and frame elements

**Command Pattern** (`src/editor/core/command/`)
- `Command.ts`: Facade exposing all execute methods (e.g., `executeBold`, `executeUndo`)
- `CommandAdapt.ts`: Adapter that bridges commands to Draw context
- All commands follow `execute*` naming convention

### Element System

The editor uses a hierarchical element model defined in `src/editor/interface/Element.ts`:

**IElement** - Base interface for all content elements with:
- Basic properties: `id`, `type`, `value`, `extension`, `externalId`
- Style: `font`, `size`, `bold`, `color`, etc. (IElementStyle)
- Rules: `hide` (IElementRule)
- Groups: `groupIds` (IElementGroup)

**Element Types** (ElementType enum):
- Text particles: TextParticle, ListParticle, HyperlinkParticle, etc.
- Block particles: ImageParticle, TableParticle, LaTexParticle, etc.
- Control particles: CheckboxParticle, RadioParticle, etc.
- Frame elements: Margin, Background, PageNumber, etc.

### Directory Structure

```
src/editor/
├── core/
│   ├── draw/           # Rendering engine
│   │   ├── particle/    # Element rendering (text, image, table, latex, etc.)
│   │   ├── control/    # Control component rendering
│   │   ├── frame/       # Frame elements (margin, background, borders)
│   │   ├── richtext/    # Rich text decorations (underline, highlight)
│   │   └── interactive/ # Interactive features (search, graffiti)
│   ├── command/         # Command pattern implementation
│   ├── event/          # Canvas and global event handling
│   ├── observer/        # Mouse, selection, image observers
│   ├── worker/          # Web workers for async operations
│   └── [other subsystems]
├── interface/           # TypeScript interfaces (40+ files)
├── dataset/            # Enums and constants
└── utils/               # Utility functions
```

### Web Workers

Async operations use Web Workers managed by `WorkerManager.ts`:
- WordCountWorker - Count words in element list
- CatalogWorker - Generate document catalog/TOC
- GroupWorker - Extract group IDs from elements
- ValueWorker - Get document value asynchronously

### Event System

**EventBus** (`src/editor/core/event/eventbus/`) - Pub/sub system for editor events
**Listener** (`src/editor/core/listener/`) - Callback system for change notifications
**CanvasEvent** and **GlobalEvent** - Handle mouse, keyboard, and drag events

### Plugin System

Plugins extend functionality through `editor.use(plugin)` pattern. See `src/editor/core/plugin/Plugin.ts`.

## Key Patterns

**Command-Draw Separation**: Commands access Draw functionality through CommandAdapt, not directly. This prevents exposing internal Draw context to external consumers.

**Element Formatting**: Elements are formatted via `formatElementList()` utility which applies defaults and compensates missing properties.

**Zone-Based Layout**: Documents support header/main/footer zones managed through the Zone system.

**Position-Range Model**: Cursor positions and selections are tracked through Position and RangeManager classes.

**History Management**: Undo/redo functionality via HistoryManager with command history stack.
