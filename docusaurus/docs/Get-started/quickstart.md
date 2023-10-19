---
sidebar_position: 2
---

# Quick Start

Let's discover **Canvas Editor in less than 5 minutes**.

## Getting Started

- **Initialization**:  To get started, you'll need to initialize the canvas document editor within your project. This involves specifying the container element where the editor will be embedded.

## toolbar.jsx
```javascript
import {
  DOMEventHandlers
} from '@mindfiredigital/canvas-editor'

import React from 'react';

export const test = () =>{
    return {
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
    }
}
```
## CanvasEditor.jsx
```javascript

import {DOMEventHandlers} from "@mindfiredigital/canvas-editor";
import React, { useEffect, useState } from "react";
import "./CanvasEditor.scss";
import MarginRuler from "../MarginRuler/MarginRuler";


const CanvasEditor = (function Editor(ref) {

  const [dropdown, setDropdown] = useState({
    left: 1180,
    top: 250,
    visiblity: false,
  });
  const [editorContent, setEditorContent] = useState([]);

  const [selectedText, setSelectedText] = useState("");

  const { documentId } = useParams();

  useEffect(() => {
    const container = document.querySelector(".canvas-editor");

    const editorOptions = {
      height: 1056,
      width: 816,
      mode: EditorMode.EDIT,
      pageMode: PageMode.PAGING,
      pageNumber: {
        format: "{pageNo}/{pageCount}",
      },
      minSize: 1,
      maxSize: 72,
    };

    DOMEventHandlers.register(container, editorContent, editorOptions);
  }, []);

  return (
    <div className="canvas-editor-main">
      <div className="canvas-editor editor" ref={ref}>
        <MarginRuler />
      </div>
    </div>
  );
});

export default CanvasEditor;
```

## DocumentEditor
```javascript

import React, { useRef } from "react";
import CanvasEditor from "./CanvasEditor";
import EditorToolbar from "./toolbar";

function DocumentEditor() {
  const canvasRef = useRef(null);
  return (
    <>
      <EditorToolbar ref={canvasRef} />
      <CanvasEditor ref={canvasRef} />
    </>
  );
}

These code snippets provide a professional and corrected version of the initialization process for the Document Editor. You can integrate this editor into your project for a smooth document editing experience.

export default DocumentEditor;
```