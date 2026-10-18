# HarfBuzz, fonts and ESM migration

> `@herberthe/canvas-editor@0.1.0`: Canvas is the default and only page renderer. SVG implementation/export is deferred; no renderer selector exists. See [fork differences](./fork-and-differences.md).

All text now uses HarfBuzz, including auxiliary text. There is no engine selector
or Canvas text fallback. Images, formulas, tables and Blocks retain dedicated
object layout and painting.

## Migrate existing integrations

| Previous integration                                       | Current integration                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `textEngine`, `renderMode`, `TextEngineMode`, `RenderMode` | Remove the options and imports; no replacement selector                           |
| Commands immediately after construction                    | `await Editor.create(...)`, or `new Editor(...)` followed by `await editor.ready` |
| UMD script, `require()`, internal deep imports             | ESM imports from `@herberthe/canvas-editor`                                       |
| System fonts or CSS @font-face alone                       | Automatic basic fonts, configured font binaries/URLs, or `register.fonts`         |
| Mutating options.fonts to load a face                      | Configure initial fonts; use `await editor.register.fonts(...)` at runtime        |

Construction and `executeUpdateOptions` reject either removed option with a
TypeError, even if its value is undefined. Explicitly remove these keys from
persisted options before constructing an editor. Document content does not need
to be rewritten for this migration.

```typescript
import Editor, { RowFlex } from '@herberthe/canvas-editor'

const editor = await Editor.create(container, {
  header: [{ value: 'Header', rowFlex: RowFlex.CENTER }],
  main: [{ value: 'Hello 世界 مرحبا' }],
  footer: [{ value: 'Footer' }]
})
editor.command.executeSetRange(0, 1)
```

`ready` waits for WASM, configured fonts and the first layout, but not background
font downloads. Missing fonts are recoverable: text, placeholders and editing
remain available. WASM or first-layout failure rejects ready;
`initializationError` preserves the cause. `Editor.create` cleans up on failure.
States are initializing / ready / failed / destroyed.
Before readiness, only getValue, getValueAsync, getLocale and getContainer are
available as read-only queries, plus the explicitly waiting
`executeComputeElementListHeightAsync`. Other mutation/geometry commands are not
queued. `executeComputeElementListHeight` remains synchronous after readiness.

## Automatic fonts and coverage limits

`autoDownloadFonts` defaults to true. Actual uncovered text triggers basic-font
requests to Bunny Fonts. URLs contain fixed families, weights and styles, never
document text. Context is used locally to choose fragments. Allow the CSS and font
resources at `https://fonts.bunny.net` in your network policy. Fonts, WASM and
decoder resources also depend on your CSP, browser capabilities and deployment.

Candidates include Noto Sans (Latin/Greek/Cyrillic), Noto Sans SC/JP/KR,
Noto Naskh Arabic, Noto Sans Devanagari and Noto Sans Thai. The automatic scheduler
has no general content-language field; unspecified Han uses SC. UI locale does
not determine regional glyphs. Register explicit fonts for TC or other regional
requirements. Basic subsets are not complete Unicode coverage: rare Han,
emoji/ZWJ, unverified scripts and special styles may still need additional files.
Ordinary missing text first requests 400 normal. Style gaps request supported
real styles; bold/italic availability is not guaranteed for every family and
browser synthesis is not used as a fallback.

```typescript
editor.command.executeUpdateOptions({ autoDownloadFonts: false })
editor.command.executeUpdateOptions({ autoDownloadFonts: true })
editor.retryFontDownloads() // after ready; does not auto-download when disabled
```

Disabling downloads prevents automatic Bunny requests and registration from shared
caches. Explicit URLs/manual registration remain available, and existing faces
remain registered. Disabled, offline, failed or unsupported coverage is explained
by the built-in status area and deduplicated console warnings. Downloads and
provider adaptation are implemented; basic fonts remain a coverage limit rather
than a guarantee.

## Supply fonts manually

OS installation does not give HarfBuzz the font bytes. For an offline deployment,
disable downloads and ship matching font files with your application.

```typescript
import Editor from '@herberthe/canvas-editor'

const editor = await Editor.create(container, [{ value: 'مرحبا' }], {
  autoDownloadFonts: false,
  defaultFont: 'My Arabic',
  fonts: [{ family: 'My Arabic', url: '/fonts/Arabic-Regular.ttf' }]
})

// file can come from <input type="file">, with no font network request.
const results = await editor.register.fonts([
  {
    family: 'My Arabic',
    data: await file.arrayBuffer(),
    weight: 400,
    style: 'normal'
  }
])
for (const result of results) {
  if (result.status === 'failed') {
    console.warn(result.failure.stage, result.failure.message)
  }
}
const report = editor.getFontCoverageReport()
```

TTF/OTF/WOFF/WOFF2 are supported. Remote URLs need correct CORS responses.
Descriptors must match actual family/weight/style; a regular file does not provide
real bold/italic. Per-face results are registered / duplicate / failed. Failures
remain recoverable. Successful registration still requires checking actual
coverage. `register.getFontFaces()` returns metadata snapshots;
`register.getFontRevision()` returns the font revision, unchanged by duplicates or
failures. CSS/FontFace registration alone cannot replace binary registration.

## Observe coverage

```typescript
import type { FontCoverageReport } from '@herberthe/canvas-editor'

const onCoverage = (report: FontCoverageReport) => {
  for (const issue of report.issues) {
    console.log(issue.script, issue.reason, issue.downloadStatus)
  }
}
editor.eventBus.on('fontCoverageChange', onCoverage)
onCoverage(editor.getFontCoverageReport())
// On host teardown: editor.eventBus.off('fontCoverageChange', onCoverage)
// Alternatively: editor.listener.fontCoverageChange = onCoverage
```

Reports contain revisions, autoDownloadFonts and current issues; resolved issues
are removed. Issues include source locations, missing characters/sequences,
limited samples, requested style, attempted resources and failure stages.
Issue states include disabled / idle / loading / failed / unsupported; resource
attempts may be resolved. Full reports can contain document text/locations, so the
host decides whether to persist or transmit them. The built-in status UI requires
no subscription and is excluded from content, history and printing.

## Deploy ESM and run the example

Import runtime APIs and types from the package root. The only extra public subpath
is `package.json`. Deploy all generated relative chunks/resources together, using
a browser supporting Worker, WebAssembly and top-level await. For Vite, set
`build.target: 'esnext'`. Copying only the entry JS or opening via `file://` is
unsupported.

The repository's `examples/esm-fonts` directory contains a standalone example;
follow its README to run it. It uses only root APIs and demonstrates default
downloads, `?auto=false`, failure status, retry and local-file registration.
Disabling downloads keeps loaded fonts; reopen the offline URL to test an
initially disabled instance. Package checks independently type-check and build
this example against the branch's packed artifacts.
