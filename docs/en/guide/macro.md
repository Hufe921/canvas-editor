# Macro

Macros record and replay sequences of command invocations. Two kinds are supported:

- **Recorded macro**: produced by `startRecording` / `stopRecording`. Each `execute*` call is captured as a step and can be serialized to JSON.
- **Script macro**: registered via `register` with a JavaScript function. Can run arbitrary logic (conditions, loops, async, reading data, etc.).

## Usage

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
instance.macro.apiName()
```

## MacroType

Macro type enum.

| Value      | Description    |
| ---------- | -------------- |
| `RECORDED` | Recorded macro |
| `SCRIPT`   | Script macro   |

## startRecording

Feature: Start recording. While recording, every `command.execute*` call is captured as a step.

Usage:

```javascript
instance.macro.startRecording()
```

::: warning
Non-serializable arguments (DOM nodes, functions, etc.) are silently dropped during recording.
:::

## stopRecording

Feature: Stop recording and save it as a recorded macro.

Usage:

```javascript
const macro: IRecordedMacro | null = instance.macro.stopRecording(name: string)
```

| Parameter | Type     | Description                                |
| --------- | -------- | ------------------------------------------ |
| `name`    | `string` | Macro name; used for later lookup/playback |

Returns the recorded macro, or `null` if not currently recording.

## cancelRecording

Feature: Discard the current recording.

Usage:

```javascript
instance.macro.cancelRecording()
```

## isRecording

Feature: Whether recording is in progress.

Usage:

```javascript
const recording: boolean = instance.macro.isRecording()
```

## play

Feature: Replay a macro by id or name. Recorded macros re-invoke each captured step; script macros invoke the handler directly.

Usage:

```javascript
await instance.macro.play(idOrName: string, ...args: unknown[])
```

| Parameter  | Type        | Description                                         |
| ---------- | ----------- | --------------------------------------------------- |
| `idOrName` | `string`    | Macro id or name (id takes precedence)              |
| `...args`  | `unknown[]` | Runtime arguments forwarded to script macro handler |

::: warning

- Cannot play during recording.
- Returns silently (no throw) when the macro is not found, a step command is missing, or a step throws.
  :::

## register

Feature: Register a script macro. The handler can run arbitrary JS logic (conditions, loops, async, multiple commands).

Usage:

```javascript
const macro: IScriptMacro = instance.macro.register(
  name: string,
  handler: (...args: unknown[]) => void | Promise<void>
)
```

Example:

```javascript
// Combine multiple commands
instance.macro.register('Normalize selection', () => {
  instance.command.executeFormat()
  instance.command.executeBold()
  instance.command.executeSize(16)
})

// Accept runtime arguments + use Date
instance.macro.register('Insert signature', (userName = 'anonymous') => {
  instance.command.executeInsertElementList([
    { value: `\n— ${userName} at ${new Date().toLocaleString()}\n` }
  ])
})

// Async read + compute (recorded macros cannot do this)
instance.macro.register('Word count', async () => {
  const count = await instance.command.getWordCount()
  console.log(`Words: ${count}`)
})
```

::: warning
Script macro handlers are function references and are NOT included in `exportMacros` output.
:::

## unregister

Feature: Unregister a macro (typically a script macro) by id or name.

Usage:

```javascript
const ok: boolean = instance.macro.unregister(idOrName: string)
```

## getMacros

Feature: Return all macros (recorded + script).

Usage:

```javascript
const macros: IMacro[] = instance.macro.getMacros()
```

## getMacro

Feature: Find a single macro by id or name.

Usage:

```javascript
const macro: IMacro | undefined = instance.macro.getMacro(idOrName: string)
```

## removeMacro

Feature: Delete a macro by id or name.

Usage:

```javascript
const ok: boolean = instance.macro.removeMacro(idOrName: string)
```

## exportMacros

Feature: Serialize all recorded macros to a JSON string (script macros are excluded).

Usage:

```javascript
const json: string = instance.macro.exportMacros()
```

## importMacros

Feature: Import recorded macros from a JSON string.

Usage:

```javascript
instance.macro.importMacros(json: string, options?: { overwrite?: boolean })
```

| Parameter           | Type      | Description                                                               |
| ------------------- | --------- | ------------------------------------------------------------------------- |
| `json`              | `string`  | JSON produced by `exportMacros`                                           |
| `options.overwrite` | `boolean` | Whether to overwrite macros with the same id. Defaults to `false` (skip). |

## Full example: record + persist + replay

```javascript
const STORAGE_KEY = 'my-macros'

// Restore on startup
const saved = localStorage.getItem(STORAGE_KEY)
if (saved) {
  instance.macro.importMacros(saved)
}

// User-triggered recording
instance.macro.startRecording()
// ...user edits the document...
const macro = instance.macro.stopRecording('My macro')
if (macro) {
  localStorage.setItem(STORAGE_KEY, instance.macro.exportMacros())
}

// Replay
await instance.macro.play('My macro')
```
