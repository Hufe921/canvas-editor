# 重写方法

## 使用方式

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)

instance.override.overrideFunction = () => unknown | IOverrideResult
```

```typescript
interface IOverrideResult {
  preventDefault?: boolean // 阻止执行内部默认方法。默认阻止
}
```

## paste

功能：重写粘贴方法

用法：

```javascript
instance.override.paste = (evt?: ClipboardEvent) => unknown | IOverrideResult
```

## copy

功能：重写复制方法

用法：

```javascript
instance.override.copy = () => unknown | IOverrideResult
```

## drop

功能：重写拖放方法

用法：

```javascript
instance.override.drop = (evt: DragEvent) => unknown | IOverrideResult
```
