# Instance API

## How to Use

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
instance.apiName()
```

## destroy

Feature: Destroy the editor

Usage：

```javascript
instance.destroy()
```

::: warning
Only destroy the editor DOM and related events, menu bars, toolbars, external variables, etc. need to be handled by themselves.
:::
