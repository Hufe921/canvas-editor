<h1 align="center">canvas-editor</h1>

<p align="center">
<a href="https://www.npmjs.com/package/@hufe921/canvas-editor"><img src="https://img.shields.io/npm/v/@hufe921/canvas-editor.svg?sanitize=true" alt="Version"></a>
<a href="https://www.npmjs.com/package/@hufe921/canvas-editor"><img src="https://img.shields.io/npm/l/@hufe921/canvas-editor.svg?sanitize=true" alt="License"></a>
<a href="https://github.com/Hufe921/canvas-editor/issues/new/choose"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs"></a>
</p>

<p align="center"> a rich text editor by canvas/svg</p>

## tips

1. [docs](https://hufe.club/canvas-editor-docs/)
2. [canvas-editor-plugin](https://github.com/Hufe921/canvas-editor-plugin)
3. The render layer by svg is under development, see [feature/svg](https://github.com/Hufe921/canvas-editor/tree/feature/svg)
4. The export pdf feature is available now, see [feature/pdf](https://github.com/Hufe921/canvas-editor/tree/feature/pdf)

## usage

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

## next features

1. table paging
2. improve performance
3. control rules
4. [CRDT](https://github.com/Hufe921/canvas-editor/tree/feature/CRDT)

## snapshot

![image](https://github.com/Hufe921/canvas-editor/blob/main/src/assets/snapshots/main_v0.9.35.png)

## install

`yarn`

## dev

`npm run dev`

## build

#### app

`npm run build`

#### lib

`npm run lib`
