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
instance.eventBus.on('controlChange', (payload: IControlChangeResult) => void)
```

## controlContentChange

功能：控件内容发生改变

用法：

```javascript
instance.eventBus.on('controlContentChange', (payload: IControlContentChangeResult) => void)
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

## mousemove

功能：编辑器 mousemove 事件监听

用法：

```javascript
instance.eventBus.on('mousemove', (evt: MouseEvent) => void)
```

## mouseenter

功能：编辑器 mouseenter 事件监听

用法：

```javascript
instance.eventBus.on('mouseenter', (evt: MouseEvent) => void)
```

## mouseleave

功能：编辑器 mouseleave 事件监听

用法：

```javascript
instance.eventBus.on('mouseleave', (evt: MouseEvent) => void)
```

## mousedown

功能：编辑器 mousedown 事件监听

用法：

```javascript
instance.eventBus.on('mousedown', (evt: MouseEvent) => void)
```

## mouseup

功能：编辑器 mouseup 事件监听

用法：

```javascript
instance.eventBus.on('mouseup', (evt: MouseEvent) => void)
```

## click

功能：编辑器 click 事件监听

用法：

```javascript
instance.eventBus.on('click', (evt: MouseEvent) => void)
```

## positionContextChange

功能：上下文内容发生改变

用法：

```javascript
instance.eventBus.on('positionContextChange', (payload: IPositionContextChangePayload) => void)
```

## imageSizeChange

功能：图片尺寸发生改变事件

用法：

```javascript
instance.eventBus.on('imageSizeChange', (payload: { element: IElement }) => void)
```
