# Contributing to Canvas Editor

Thank you for your interest in Canvas Editor! We welcome contributions in any form.

## How to Contribute

### Report a Bug

1. Search [existing Issues](https://github.com/Hufe921/canvas-editor/issues) to make sure it hasn't been reported
2. Use the [Bug Report template](https://github.com/Hufe921/canvas-editor/issues/new?template=bug_report.yml) to create an Issue
3. Provide clear reproduction steps, expected behavior, and actual behavior

### Suggest a Feature

1. Use the [Feature Request template](https://github.com/Hufe921/canvas-editor/issues/new?template=feature_request.yml) to create an Issue
2. Describe the use case and expected behavior

### Submit a Pull Request

1. Fork the repository
2. Create a feature branch from the latest `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
3. Make your changes and ensure all checks pass
4. Submit a PR and reference the related Issue (e.g., `fixes #123`)

## Development Setup

### Prerequisites

- Node.js >= 24
- pnpm >= 10

```bash
pnpm install
pnpm run dev        # Start development server
```

### Common Commands

| Command                 | Description                                |
| ----------------------- | ------------------------------------------ |
| `pnpm run dev`          | Start development server                   |
| `pnpm run lib`          | Build library (includes lint + type check) |
| `pnpm run build`        | Build application                          |
| `pnpm run lint`         | Run ESLint                                 |
| `pnpm run type:check`   | TypeScript type checking                   |
| `pnpm run cypress:open` | Open Cypress test runner                   |
| `pnpm run cypress:run`  | Run Cypress tests in headless mode         |
| `pnpm run docs:dev`     | Start documentation dev server             |

### Code Standards

- Follow the ESLint configuration — checks run automatically before commits
- TypeScript strict mode — all code must pass type checking

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

Common types:

| Type       | Description                             |
| ---------- | --------------------------------------- |
| `feat`     | New feature                             |
| `fix`      | Bug fix                                 |
| `docs`     | Documentation changes                   |
| `style`    | Code formatting (no functional change)  |
| `refactor` | Code refactoring (not a feature or fix) |
| `perf`     | Performance improvement                 |
| `test`     | Adding or updating tests                |
| `chore`    | Build or tooling changes                |

Examples:

```bash
feat(table): support merged cells
fix(cursor): resolve position offset in list
docs: update quick start guide
```

## Pull Request Guidelines

- One PR per concern — keep changes focused and minimal
- Title should follow Conventional Commits format
- Describe **what** changed and **why** in the PR description
- Reference related Issues
- Ensure all CI checks pass

## Project Structure

```
src/editor/
├── core/
│   ├── draw/           # Canvas rendering engine
│   │   ├── particle/   # Element rendering (text, image, table, latex, etc.)
│   │   ├── control/    # Form control rendering (checkbox, radio, etc.)
│   │   ├── frame/      # Page frame elements (margin, background, borders)
│   │   ├── richtext/   # Rich text decorations (underline, highlight)
│   │   ├── interactive/# Interactive features (search, etc.)
│   │   └── graffiti/   # Freehand drawing
│   ├── command/        # Command pattern (executeBold, executeUndo, etc.)
│   ├── event/          # Canvas & global event handling, EventBus
│   ├── observer/       # Mouse, selection, image observers
│   ├── worker/         # Web Workers (word count, catalog, etc.)
│   ├── plugin/         # Plugin system (editor.use(plugin))
│   ├── cursor/         # Cursor management & rendering
│   ├── position/       # Position calculation
│   ├── range/          # Selection range management
│   ├── history/        # Undo/redo history stack
│   ├── zone/           # Header/main/footer zone management
│   ├── contextmenu/    # Right-click context menu
│   ├── shortcut/       # Keyboard shortcut bindings
│   ├── i18n/           # Internationalization
│   ├── listener/       # Change notification callbacks
│   ├── register/       # Module registration
│   ├── actuator/       # Internal action handlers
│   └── override/       # Method overrides
├── interface/          # TypeScript interface definitions
├── dataset/            # Enums and constants
├── types/              # Type declarations
└── utils/              # Utility functions
```

For detailed architecture, see [CLAUDE.md](./CLAUDE.md).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
