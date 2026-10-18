# Getting Started

> WYSIWYG rich text editor.

This is Herbert He's independent fork of `Hufe921/canvas-editor`, published
as `@herberthe/canvas-editor` with its own version series starting at `0.1.0`.
All text uses HarfBuzz. **Canvas is the default and only page renderer.**
SVG page rendering and standalone SVG export are deferred and unavailable.
SVG images, formulas and icons remain resources, not an SVG page backend.

::: warning
This is not an official upstream release. Plugin compatibility must be verified.
Run `npm run dev` for this fork's demo and `npm run docs:dev` for local docs.
See [Fork relationship and differences](./fork-and-differences.md).
:::

## Features

- Rich text operations: Undo, Redo, Painter, Clear Format, Font, Size, Bold, Italic, Underline, Strikeout, Superscript/Subscript, Text Color, Highlight, Alignment, Line Height, Row Margin, Title, List, First-line Indent
- Insert elements: Table, Image, Hyperlink, Separator, Page Break, LaTeX Formula, Date Picker, Tab, Block, Label, Area
- Table: Insert/Delete Rows and Columns, Merge/Split Cells, Border Style, Background Color, Vertical Alignment, Rowspan/Colspan, Cross-page Pagination
- Print: Canvas image printing; no standalone SVG or native PDF export
- Controls: Text, Number, Select, Radio Group, Checkbox Group, Date, supporting Placeholder, Prefix/Postfix, Default Value, Disabled, Indent Alignment Rules and Control Nesting
- Cascade Expression: Automatically toggles visibility, required, editable and deletable states of other controls or titles when control values change, with computed expression support
- Track Changes: Records and visually marks inserted and deleted revisions
- Macro: Recorded and script macros, supporting command recording/replay, JSON serialization and custom logic
- Editor Modes: Edit, Clean, Readonly, Form, Print
- Page Modes: Paging, Continuity, with Page Margin, Header, Footer, Page Number
- Watermark: Text, Image, placed above or below the content
- Comment: Add, Locate and Delete text comments
- Catalog: Auto-generated from titles, click to navigate
- Right-click menu: Built-in menu, customizable per element type
- Shortcut keys: Built-in shortcuts, customizable overrides
- Drag and Drop: Text, Element, Control
- Search and Replace: Keyword search, navigation, replace
- Internationalization (i18n): Built-in Chinese and English, extensible to other languages
- Plugin ecosystem: [Upstream plugins (verify fork compatibility) — Word/Excel import-export, formula, comments, spellcheck and more](https://github.com/Hufe921/canvas-editor-plugin)

## Step. 1: Download NPM Package

```sh
npm i @herberthe/canvas-editor@0.1.0 --save
```

## Step. 2: Prepare Container

```html
<div class="canvas-editor"></div>
```

## Step. 3: Instantiate Editor

- Examples that only the body content is included

```javascript
import Editor from '@herberthe/canvas-editor'

const editor = await Editor.create(
  document.querySelector('.canvas-editor'),
  [
    {
      value: 'Hello World'
    }
  ],
  {}
)
```

- Examples that contain body, header, footer content

```javascript
import Editor, { RowFlex } from '@herberthe/canvas-editor'

const editor = await Editor.create(
  document.querySelector('.canvas-editor'),
  {
    header: [
      {
        value: 'Header',
        rowFlex: RowFlex.CENTER
      }
    ],
    main: [
      {
        value: 'Hello World'
      }
    ],
    footer: [
      {
        value: 'canvas-editor',
        size: 12
      }
    ]
  },
  {}
)
```

## Step. 4: Configuration Editor

See the next section for details

## Initialization, fonts and ESM migration

All text uses HarfBuzz; no engine selection is required. `autoDownloadFonts`
defaults to true and requests basic fonts from Bunny Fonts for uncovered text.
Readiness waits for WASM, configured fonts and the first layout, not background
downloads. Rare characters, emoji and special styles may need additional fonts.

Pass `{ autoDownloadFonts: false }` to disable automatic downloads. Missing-font
hints remain available; manually supply bytes using
`await editor.register.fonts([{ family, data }])`. `Editor.create` rejects and
cleans up on WASM/first-layout failure. With synchronous construction, await
`editor.ready` before commands.

Only root ESM imports are supported; UMD, require and internal deep imports are
unsupported. `textEngine`, `renderMode` and their enums have been removed; passing
the old keys throws a migration error. Use Vite `build.target: 'esnext'` and deploy
all generated relative chunks together.

See [Fonts and ESM migration](./font-and-esm-migration.md) for public APIs, coverage
limits and offline integration. A runnable example is in `examples/esm-fonts`.
