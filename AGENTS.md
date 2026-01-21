# Canvas Editor - Agent Development Guide

This guide provides essential information for agentic coding agents working on the canvas-editor repository.

## Project Overview

Canvas Editor is a TypeScript-based rich text editor library that renders content using HTML5 Canvas/SVG. It's built as an ES module with comprehensive TypeScript support and follows modern development practices.

## Development Commands

### Essential Commands
```bash
# Development
npm run dev                    # Start Vite dev server
npm run serve                  # Preview production build

# Building (includes lint + type check)
npm run lib                    # Build library for distribution
npm run build                  # Build application

# Code Quality
npm run lint                   # Run ESLint
npm run type:check            # TypeScript type checking

# Testing
npm run cypress:open          # Open Cypress test runner interactively
npm run cypress:run           # Run Cypress tests headless
```

### Pre-commit Hooks
- Automatically runs `npm run lint && npm run type:check` before commits
- Commit messages must follow conventional commit format (feat:, fix:, docs:, etc.)

## Code Style Guidelines

### Formatting Rules
- **No semicolons** - `semi: [1, "never"]`
- **Single quotes** - `quotes: [1, "single"]`
- **2-space indentation** - No tabs
- **80 character line limit** - `printWidth: 80`
- **No trailing commas** - `trailingComma: "none"`
- **Arrow function parentheses avoided** - `arrowParens: "avoid"`
- **LF line endings** - `endOfLine: "lf"`

### TypeScript Configuration
- **Strict mode enabled** - All type checking enforced
- **Target**: ESNext with modern features
- **Module system**: ESNext modules
- **Source maps**: Enabled for debugging
- **Unused locals/parameters**: Checked and reported

### ESLint Rules
- `any` type allowed (`@typescript-eslint/no-explicit-any: 0`)
- Console statements permitted
- Debugger statements allowed
- No explicit function return type required when inferred

## Project Structure

### Main Directories
```
src/
├── editor/                    # Core editor library
│   ├── index.ts              # Main entry point - exports Editor class
│   ├── core/                 # Core functionality
│   │   ├── draw/             # Canvas rendering engine
│   │   ├── command/         # Command pattern implementation
│   │   ├── listener/        # Event handling system
│   │   └── ...
│   ├── interface/            # TypeScript type definitions
│   ├── dataset/             # Constants and enums
│   │   ├── constant/        # Magic numbers and strings
│   │   └── enum/           # TypeScript enums
│   ├── utils/              # Editor-specific utilities
│   └── assets/             # CSS-in-JS and images
├── plugins/                 # Optional editor plugins
├── components/              # Reusable UI components
├── utils/                   # Shared utility functions
└── assets/                  # Static assets
```

### Key Files
- **Main entry**: `src/editor/index.ts` - Exports Editor class and utilities
- **Package exports**: ES module and UMD builds with TypeScript definitions
- **Node requirement**: `>=16.9.1`

## Import Conventions

### Module Imports
- Use ES module imports: `import { Editor } from './editor'`
- TypeScript interfaces: `import type { EditorInterface } from './interface'`
- Relative imports with explicit extensions for non-TypeScript files

### Import Organization
1. External libraries (Node.js built-ins, npm packages)
2. Internal modules (absolute imports from src/)
3. Relative imports (sibling/parent directory imports)
4. Type-only imports (use `import type` when possible)

## Naming Conventions

### Files and Directories
- **PascalCase** for components and classes: `EditorManager.ts`
- **camelCase** for utilities and functions: `formatText.ts`
- **kebab-case** for directories when containing multiple words: `rich-text/`

### Code Elements
- **PascalCase** for classes and interfaces: `class Editor`, `interface EditorConfig`
- **camelCase** for functions and variables: `formatText`, `currentSelection`
- **UPPER_SNAKE_CASE** for constants: `MAX_CANVAS_WIDTH`, `DEFAULT_FONT_SIZE`
- **PascalCase** for enums: `enum TextAlignment`

## Error Handling

### TypeScript Errors
- Use strict TypeScript checking - prefer explicit types over `any`
- Handle nullable types with optional chaining and nullish coalescing
- Use union types for variant error states

### Runtime Errors
- Throw descriptive Error objects with context
- Use try-catch blocks for external API calls
- Validate user input in public API methods

## Testing Guidelines

### Cypress E2E Tests
- Tests located in `cypress/` directory
- Use `npm run cypress:open` for interactive test development
- Use `npm run cypress:run` for CI/CD automated testing
- Viewport set to 1366x720 for consistency

### Test Organization
- Group related tests in describe blocks
- Use beforeEach for common setup
- Write descriptive test names that explain the behavior
- Test both happy path and error conditions

## Build Process

### Library Build
- TypeScript compilation with strict checking
- Vite bundling for ES module and UMD outputs
- Automatic CSS-in-JS injection via plugin
- Source maps generated for debugging

### Quality Gates
- Linting must pass before build completion
- Type checking must pass before build completion
- Pre-commit hooks enforce quality standards

## API Design

### Public API
- Main Editor class exported from `src/editor/index.ts`
- Fluent method chaining where appropriate
- Consistent parameter ordering (required, then optional)
- Comprehensive TypeScript definitions

### Plugin System
- Plugins in `src/plugins/` directory
- Extend Editor functionality without modifying core
- Follow established plugin patterns in codebase

## Development Workflow

1. **Start development**: `npm run dev`
2. **Make changes**: Follow code style guidelines
3. **Test changes**: Use Cypress for E2E testing
4. **Quality check**: `npm run lint && npm run type:check`
5. **Commit**: Pre-commit hooks will validate automatically
6. **Build**: `npm run lib` for distribution build

## Performance Considerations

- Canvas rendering optimized for frequent updates
- Minimal DOM manipulation - primarily Canvas-based
- Efficient event handling with delegation patterns
- Memory-conscious object pooling where appropriate

## Security Notes

- No external network requests in core library
- Sanitize all user input before rendering
- Avoid eval() and Function constructor usage
- Validate configuration options in public API