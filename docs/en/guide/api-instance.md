# Instance API

## How to Use

```javascript
import Editor from '@herberthe/canvas-editor'

const instance = await Editor.create(container, data, options)
instance.apiName()
```

## Lifecycle and font APIs

| API                                                                     | Contract                                                                                 |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `Editor.create(container, data, options?)`                              | Returns a ready instance; cleans up on failure                                           |
| `ready: Promise<void>`                                                  | Waits for WASM, configured fonts and first layout, not background downloads              |
| `state` / `initializationError`                                         | Lifecycle state and initialization error with code/cause                                 |
| `register.fonts(faces)`                                                 | Waits for ready; per-face registered/duplicate/failed results; refreshes layout/coverage |
| `register.getFontFaces()` / `getFontRevision()`                         | Registered metadata snapshots / font revision                                            |
| `getFontCoverageReport()`                                               | Current missing-text, source and download snapshot                                       |
| `retryFontDownloads()`                                                  | Retries current missing fonts after ready, respecting the switch                         |
| `listener.fontCoverageChange` / `eventBus.on('fontCoverageChange', cb)` | Single callback / multiple subscribers                                                   |

Import `IEditorOption`, `IUpdateOption`, `IEditorFontFace`, `FontCoverageReport`,
`FontRegistrationResult`, `RegisteredFontFace`, `EditorRuntimeState`,
`EditorRuntimeErrorCode` and the `EditorRuntimeError` class from the package root.
See [Fonts and ESM migration](./font-and-esm-migration.md) for examples and recovery.

## version

Feature: version number

Usage：

```javascript
instance.version
```

## destroy

Feature: Destroy the editor

Usage：

```javascript
instance.destroy()
```

::: warning
Only destroy the editor DOM and related events, menu bars, toolbars, external variables, etc. need to be handled by themselves.
:::
