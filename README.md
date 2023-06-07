<h1 align="center">canvas-editor</h1>

<p align="center"> a rich text editor by canvas/svg</p>

## tips

1. [docs](https://hufe.club/canvas-editor-docs/)
2. The render layer by svg is under development, see [feature/svg](https://github.com/Hufe921/canvas-editor/tree/feature/svg)
3. The export pdf feature is available now, see [feature/pdf](https://github.com/Hufe921/canvas-editor/tree/feature/pdf)

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

1. improve list and title
2. improve performance
3. control rules
4. table paging
5. [CRDT](https://github.com/Hufe921/canvas-editor/tree/feature/CRDT)

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