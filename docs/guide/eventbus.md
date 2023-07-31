# 事件监听(eventBus)

## 使用方式

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)

// 注册
instance.eventBus.on<K keyof EventMap>(
  eventName: K,
  callback: EventMap[K]
)

// 移除
instance.eventBus.off<K keyof EventMap>(
  eventName: K,
  callback: EventMap[K]
)
```

## rangeStyleChange

功能：选区样式发生改变

用法：

```javascript
instance.eventBus.on('rangeStyleChange', (payload: IRangeStyle) => void)
```

## visiblePageNoListChange

功能：可见页发生改变

用法：

```javascript
instance.eventBus.on('visiblePageNoListChange', (payload: number[]) => void)
```

## intersectionPageNoChange

功能：当前页发生改变

用法：

```javascript
instance.eventBus.on('intersectionPageNoChange', (payload: number) => void)
```

## pageSizeChange

功能：当前页数发生改变

用法：

```javascript
instance.eventBus.on('pageSizeChange', (payload: number) => void)
```

## pageScaleChange

功能：当前页面缩放比例发生改变

用法：

```javascript
instance.eventBus.on('pageScaleChange', (payload: number) => void)
```

## contentChange

功能：当前内容发生改变

用法：

```javascript
instance.eventBus.on('contentChange', () => void)
```

## controlChange

功能：当前光标所在控件发生改变

用法：

```javascript
instance.eventBus.on('controlChange', (payload: IControl | null) => void)
```

## pageModeChange

功能：页面模式发生改变

用法：

```javascript
instance.eventBus.on('pageModeChange', (payload: PageMode) => void)
```

## saved

功能：文档执行保存

用法：

```javascript
instance.eventBus.on('saved', (payload: IEditorResult) => void)
```

## zoneChange

功能：区域发生改变

用法：

```javascript
instance.eventBus.on('zoneChange', (payload: EditorZone) => void)
```
