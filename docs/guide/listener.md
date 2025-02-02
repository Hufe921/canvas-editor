# 事件监听(listener)

::: warning
listener 只能响应一个方法，后续不再添加新监听方法，推荐使用 eventBus 进行事件监听。
:::

## 使用方式

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
instance.listener.eventName = ()=>{}
```

## rangeStyleChange

功能：选区样式发生改变

用法：

```javascript
instance.listener.rangeStyleChange = (payload: IRangeStyle) => {}
```

## visiblePageNoListChange

功能：可见页发生改变

用法：

```javascript
instance.listener.visiblePageNoListChange = (payload: number[]) => {}
```

## intersectionPageNoChange

功能：当前页发生改变

用法：

```javascript
instance.listener.intersectionPageNoChange = (payload: number) => {}
```

## pageSizeChange

功能：当前页数发生改变

用法：

```javascript
instance.listener.pageSizeChange = (payload: number) => {}
```

## pageScaleChange

功能：当前页面缩放比例发生改变

用法：

```javascript
instance.listener.pageScaleChange = (payload: number) => {}
```

## contentChange

功能：当前内容发生改变

用法：

```javascript
instance.listener.contentChange = () => {}
```

## controlChange

功能：当前光标所在控件发生改变

用法：

```javascript
instance.listener.controlChange = (payload: IControlChangeResult) => {}
```

## controlContentChange

功能：控件内容发生改变

用法：

```javascript
instance.listener.controlContentChange = (
  payload: IControlContentChangeResult
) => {}
```

## pageModeChange

功能：页面模式发生改变

用法：

```javascript
instance.listener.pageModeChange = (payload: PageMode) => {}
```

## saved

功能：文档执行保存

用法：

```javascript
instance.listener.saved = (payload: IEditorResult) => {}
```

## zoneChange

功能：区域发生改变

用法：

```javascript
instance.listener.zoneChange = (payload: EditorZone) => {}
```
