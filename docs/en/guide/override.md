# Override

## How to Use

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
instance.override.overrideFunction = ()=>{}
```

## paste

Feature: Override internal paste function

Usage:

```javascript
instance.override.paste = (evt?: ClipboardEvent) => void
```

## copy

Feature: Override internal copy function

Usage:

```javascript
instance.override.copy = () => void
```
