# 实例 API

## 使用方式

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
instance.apiName()
```

## destroy

功能：销毁编辑器

用法：

```javascript
instance.destroy()
```

::: warning
仅销毁编辑器 dom 及相关事件，菜单栏、工具栏、外部变量等需自行处理。
:::
