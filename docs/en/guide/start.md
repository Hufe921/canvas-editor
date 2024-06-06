# Getting Started

> WYSIWYG rich text editor.

Benefit from the complete self-implementation of cursor and text layout. The underlying rendering can also be rendered by svg, See code：[feature/svg](https://github.com/Hufe921/canvas-editor/tree/feature/svg); Or complete pdf drawing with pdfjs,See code：[feature/pdf](https://github.com/Hufe921/canvas-editor/tree/feature/pdf).

::: warning
The official only provides the editor core layer npm package, the menu bar or other external tools can refer to the document extension, or directly refer the implementation of [official](https://github.com/Hufe921/canvas-editor), See details [demo](https://hufe.club/canvas-editor/).
:::

## Features

- Rich text operations (Undo, Redo, Font, Size, Bold, Italic, Underline, Strikeout, Superscript, Alignment, Title, List, ...)
- Insert elements (Table, Image, Link, Code Block, Page Break, Math Formula, Date Picker, Block, ...)
- Print (Based on canvas to picture, pdf drawing)
- Controls (Select, Text, Date, Radio, Checkbox)
- Right-click menu (Internal, Custom)
- Shortcut keys (Internal, Custom)
- Drag and Drop(Text, Element, Control)
- Header, Footer, Page Number
- Page Margin
- Watermark
- Pagination
- Comment
- Catalog
- [Plugin](https://github.com/Hufe921/canvas-editor-plugin)

## TODO

- Computational performance
- Control rule
- Table paging
- Out of the box version for vue, react and other frameworks

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
