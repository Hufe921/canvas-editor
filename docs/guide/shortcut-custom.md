# 自定义快捷键

## 使用方式

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
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
