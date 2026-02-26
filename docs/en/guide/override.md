# Override

## How to Use

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)

instance.override.overrideFunction = () => unknown | IOverrideResult
```

```typescript
interface IOverrideResult {
  preventDefault?: boolean // Prevent the execution of internal default method. Default prevent
}
```

## paste

Feature: Override internal paste function

Usage:

```javascript
instance.override.paste = (evt?: ClipboardEvent) => unknown | IOverrideResult
```

## pasteImage

Feature: Override internal paste image function

Usage:

```javascript
instance.override.pasteImage = (file: File | Blob) => unknown | IOverrideResult
```

## copy

Feature: Override internal copy function

Usage:

```javascript
instance.override.copy = () => unknown | IOverrideResult
```

## drop

Feature: Override internal drop function

Usage:

```javascript
instance.override.drop = (evt: DragEvent) => unknown | IOverrideResult
```
