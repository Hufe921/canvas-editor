<h1 align="center">canvas-editor</h1>

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
import Editor from "@hufe921/canvas-editor"

new Editor(document.querySelector(".canvas-editor"), [
    {
      value: "Hello World"
    }
  ])
```

## next features

1. improve performance
2. control rules
3. table paging
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