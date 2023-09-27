# 重写方法

## 使用方式

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
instance.override.overrideFunction = ()=>{}
```

## paste

功能：重写粘贴方法

用法：

```javascript
instance.override.paste = (evt: ClipboardEvent) => void
```
