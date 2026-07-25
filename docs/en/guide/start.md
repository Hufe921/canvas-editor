# Getting Started

> WYSIWYG rich text editor.

Benefit from the complete self-implementation of cursor and text layout. The underlying rendering can also be rendered by svg, See code：[feature/svg](https://github.com/Hufe921/canvas-editor/tree/feature/svg); Or complete pdf drawing with pdfjs,See code：[feature/pdf](https://github.com/Hufe921/canvas-editor/tree/feature/pdf).

::: warning
The official only provides the editor core layer npm package, the menu bar or other external tools can refer to the document extension, or directly refer the implementation of [official](https://github.com/Hufe921/canvas-editor), See details [demo](https://hufe.club/canvas-editor/).
:::

## Features

- Rich text operations: Undo, Redo, Painter, Clear Format, Font, Size, Bold, Italic, Underline, Strikeout, Superscript/Subscript, Text Color, Highlight, Alignment, Line Height, Row Margin, Title, List, First-line Indent
- Insert elements: Table, Image, Hyperlink, Separator, Page Break, LaTeX Formula, Date Picker, Tab, Block, Label, Area
- Table: Insert/Delete Rows and Columns, Merge/Split Cells, Border Style, Background Color, Vertical Alignment, Rowspan/Colspan, Cross-page Pagination
- Print: Based on canvas to picture, pdf drawing
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
- [Plugin](https://github.com/Hufe921/canvas-editor-plugin)

## Step. 1: Download NPM Package

```sh
npm i @hufe921/canvas-editor --save
```

## Step. 2: Prepare Container

```html
<div class="canvas-editor"></div>
```

## Step. 3: Instantiate Editor

- Examples that only the body content is included

```javascript
import Editor from '@hufe921/canvas-editor'

new Editor(
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
import Editor from '@hufe921/canvas-editor'

new Editor(
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
