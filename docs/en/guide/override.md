# Override

## How to Use

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)

instance.override.overrideFunction = () => void | Promise<void> | IOverrideResult | Promise<IOverrideResult>
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
instance.override.paste = (evt?: ClipboardEvent) => void | Promise<void> | IOverrideResult | Promise<IOverrideResult>
```

## copy

Feature: Override internal copy function

Usage:

```javascript
instance.override.copy = () => void | Promise<void> | IOverrideResult | Promise<IOverrideResult>
```

## drop

Feature: Override internal drop function

Usage:

```javascript
instance.override.drop = (evt: DragEvent) => void | Promise<void> | IOverrideResult | Promise<IOverrideResult>
```
