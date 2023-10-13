<h1 align="center">canvas-editor</h1>

<p align="center">
<a href="https://www.npmjs.com/package/@mindfiredigital/canvas-editor"><img src="https://img.shields.io/npm/v/@mindfiredigital/canvas-editor.svg?sanitize=true" alt="Version"></a>
<a href="https://www.npmjs.com/package/@mindfiredigital/canvas-editor"><img src="https://img.shields.io/npm/l/@mindfiredigital/canvas-editor.svg?sanitize=true" alt="License"></a>
<a href="https://www.npmjs.com/package/@mindfiredigital/canvas-editor"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs"></a>
</p>

<p align="center"> a rich text editor by canvas/svg</p>

This project utilizes and builds upon the excellent [canvas-editor-plugin](https://github.com/Hufe921/canvas-editor-plugin). We want to express our sincere gratitude for their significant contributions to the open-source community.
## Modifications and Enhancements

In this project, we have extended the functionality of the original library in the following ways:

- **Event Handling:** We've added custom event handling features to meet our project's requirements.
- **New Feature: Tables:** A new feature has been introduced to enable the use of tables
- **Improved Font Size:** The font size has been optimized to enhance readability and user experience.

## Usage

```bash
npm i @mindfiredigital/canvas-editor
```

```javascript
import {
  DOMEventHandlers,
  ListStyle,
  ListType,
  RowFlex,
} from '@mindfiredigital/canvas-editor'

    <ButtonWrapper 
        title="bold" 
        handleClick={DOMEventHandlers.handleBold}>
            <FormatBoldIcon />
    </ButtonWrapper>
    <ButtonWrapper
        title="italic"
        handleClick={DOMEventHandlers.handleItalic}>
            <FormatItalicIcon />
    </ButtonWrapper>
    <ButtonWrapper
        title="underline"
        handleClick={DOMEventHandlers.handleUnderline}>
        <FormatUnderlinedIcon />
    </ButtonWrapper>
```

## install

`yarn`

## dev

`npm run dev`

## build

#### app
`npm run build`

#### lib
`npm run lib`
