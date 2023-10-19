<h1 align="center">Canvas Editor</h1><br><br>
<p align="center">
<a href="https://www.npmjs.com/package/@mindfiredigital/canvas-editor"><img src="https://img.shields.io/npm/v/@mindfiredigital/canvas-editor.svg?sanitize=true" alt="Version"></a>
<a href="https://www.npmjs.com/package/@mindfiredigital/canvas-editor"><img src="https://img.shields.io/npm/l/@mindfiredigital/canvas-editor.svg?sanitize=true" alt="License"></a>
<a href="https://www.npmjs.com/package/@mindfiredigital/canvas-editor"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs"></a>
</p>

<p align="center"> a rich text editor by canvas/svg</p>

**Canvas Editor** project uses and extends the [canvas-editor-plugin](https://github.com/Hufe921/canvas-editor-plugin), adding useful features like as table support, font size optimization, and the export of important DOM handlers. We would like to offer our heartfelt appreciation for their substantial contributions to the open-source community.

<br>

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [DOM Handlers](#dom-handlers)
- [Contributing](#contributing)
- [License](#license)

<br>

## Features <br>
- **Event Handling:** DOM handlers were not exported so we helped exporting it so others can make use of it.
- **New Feature:**
     - **Tables**: A new feature has been introduced to enable the use of tables
- **Improved Font Size:** The font size has been optimized to enhance readability and user experience.

<br>

## Installation
```bash
npm i @mindfiredigital/canvas-editor
```

<br>

## Usage

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

<br>

## DOM Handlers 
- `handleUndo`: This handler is responsible for undoing the previous action performed in the editor.

- `handleRedo`: The `handleRedo` handler allows you to redo an action that was previously undone.

- `handleBold`: With the `handleBold` handler, you can apply or remove bold formatting to the selected text.

- `handleItalic`: The `handleItalic` handler enables you to apply or remove italic formatting to the selected text.

- `handleUnderline`: This handler allows you to apply or remove underline formatting to the selected text.

- `handleStrikeout`: The `handleStrikeout` handler enables you to apply or remove strikeout formatting to the selected text.

- `handleSuperscript`: With the `handleSuperscript` handler, you can apply or remove superscript formatting to the selected text.

- `handleSubscript`: The `handleSubscript` handler allows you to apply or remove subscript formatting to the selected text.

- `handleFontFamily`: This handler is used to change the font family of the selected text.

- `handleAlign`: The `handleAlign` handler allows you to align the selected text to the left, center, or right.

- `handleList`: With the `handleList` handler, you can create bulleted or numbered lists.

- `setFontColor`: This handler is responsible for changing the font color of the selected text.

- `highlightText`: The `highlightText` handler enables you to apply or remove highlighting to the selected text.

- `setFont`: With the `setFont` handler, you can change the font of the selected text.

- `setSize`: This handler allows you to set the font size of the selected text.

- `increaseFontSize`: The `increaseFontSize` handler increases the font size of the selected text.

- `decreaseFontSize`: The `decreaseFontSize` handler decreases the font size of the selected text.

- `getContent`: This handler retrieves the content of the editor.

- `setContent`: The `setContent` handler sets the content of the editor.

- `createTable`: With the `createTable` handler, you can insert a table into the editor.

- `setTitle`: This handler sets the title of the editor.

- `getContentStyles`: The `getContentStyles` handler retrieves the styles applied to the content of the editor.

- `setImage`: With the `setImage` handler, you can insert an image into the editor.

- `createHyperLink`: This handler allows you to create a hyperlink in the editor.

- `setHorizontalLine`: The `setHorizontalLine` handler inserts a horizontal line into the editor.

- `setPaperMargins`: This handler sets the paper margins of the editor.

- `getSelectedText`: The `getSelectedText` handler retrieves the currently selected text in the editor.

- `insertElement`: With the `insertElement` handler, you can insert a custom element into the editor.
<br>

## Contributing
This project welcomes contributions and suggestions.

<br>

## License
Copyright (c) Mindfire Digital llp. All rights reserved.

Licensed under the MIT license.