<h1 align="center">canvas-editor</h1>

<p align="center">
<a href="https://www.npmjs.com/package/@hufe921/canvas-editor" target="_blank"><img src="https://img.shields.io/npm/v/@hufe921/canvas-editor.svg?sanitize=true" alt="Version"></a>
 <a href="https://github.com/hufe921/canvas-editor/actions" target="_blank">
  <img alt="Cypress Passing" src="https://github.com/hufe921/canvas-editor/workflows/cypress/badge.svg" />
</a>
<a href="https://github.com/hufe921/canvas-editor/graphs/contributors" target="_blank">
  <img alt="GitHub Contributors" src="https://img.shields.io/github/contributors/hufe921/canvas-editor" />
</a>
<a href="https://www.npmjs.com/package/@hufe921/canvas-editor" target="_blank"><img src="https://img.shields.io/npm/l/@hufe921/canvas-editor.svg?sanitize=true" alt="License"></a>
<a href="https://github.com/Hufe921/canvas-editor/issues/new/choose" target="_blank"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs"></a>
</p>

<p align="center"> a rich text editor by canvas/svg</p>

<p align="center">
  <a href="https://hufe.club/canvas-editor" target="_blank">View Demo</a>
  ·
  <a href="https://hufe.club/canvas-editor-docs" target="_blank">View Docs</a>
  ·
  <a href="https://github.com/Hufe921/canvas-editor/issues/new?assignees=&labels=&projects=&template=bug_report.yml" target="_blank">Report Bug</a>
  ·
  <a href="https://github.com/Hufe921/canvas-editor/issues/new?assignees=&labels=%3Asparkles%3A+feature+request&projects=&template=feature_request.yml" target="_blank">Request Feature</a>
  ·
  <a href="https://github.com/Hufe921/canvas-editor/discussions" target="_blank">FAQ</a>
</p>

<p align="center">Love the project? Please consider <a href="https://hufe.club/donate.jpg" target="_blank">donating</a> to help it improve!</p>

## Tips

1. Official plugin: [canvas-editor-plugin](https://github.com/Hufe921/canvas-editor-plugin)
2. The render layer by svg is under development, see [feature/svg](https://github.com/Hufe921/canvas-editor/tree/feature/svg)
3. The export pdf feature is available now, see [feature/pdf](https://github.com/Hufe921/canvas-editor/tree/feature/pdf)
4. The AI-powered text processing demo, see [feature/ai](https://github.com/Hufe921/canvas-editor/tree/feature/ai)

## Basic usage

```bash
npm i @hufe921/canvas-editor --save
```

```html
<div class="canvas-editor"></div>
```

```javascript
import Editor from '@hufe921/canvas-editor'

new Editor(document.querySelector('.canvas-editor'), {
  main: [
    {
      value: 'Hello World'
    }
  ]
})
```

## Features

- Rich text operations (Undo, Redo, Font, Size, Bold, Italic, Underline, Strikeout, Superscript, Alignment, Title, List, ...)
- Insert elements (Table, Image, Link, Code Block, Page Break, Math Formula, Date Picker, Block, ...)
- Print (Based on canvas to picture, pdf drawing)
- Controls (Select, Text, Date, Radio, Checkbox)
- Contextmenu (Internal, Custom)
- Shortcut keys (Internal, Custom)
- Drag and Drop(Text, Element, Control)
- Header, Footer, Page Number
- Page Margin
- Watermark
- Pagination
- Comment
- Catalog

## Roadmap

1. Table paging
2. Control rules
3. Improve performance
4. [CRDT](https://github.com/Hufe921/canvas-editor/tree/feature/CRDT)

## Snapshot

![image](https://github.com/Hufe921/canvas-editor/blob/main/src/assets/snapshots/main_v0.9.35.png)

## Install

`yarn`

## Dev

`npm run dev`

## Build

#### app

`npm run build`

#### lib

`npm run lib`
