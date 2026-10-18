# Custom shortcut keys

## How to use?

```javascript
import Editor from "@herberthe/canvas-editor"

const instance = await Editor.create(container, data, options)
instance.register.shortcutList([
    {
      key: KeyMap;
      ctrl?: boolean;
      meta?: boolean;
      mod?: boolean; // windows:ctrl || mac:command
      shift?: boolean;
      alt?: boolean;
      isGlobal?: boolean;
      callback?: (command: Command) => any;
      disable?: boolean;
    }
  ])
```
