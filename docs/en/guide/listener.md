# Event Listening(listener)

> The listener can respond to only one method. eventBus is recommended for event listening

## How to Use

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
instance.listener.eventName = ()=>{}
```

## rangeStyleChange

Feature: The selection style changes

Usage:

```javascript
instance.listener.rangeStyleChange = (payload: IRangeStyle) => {}
```

## visiblePageNoListChange

Feature: The visible page changes

Usage:

```javascript
instance.listener.visiblePageNoListChange = (payload: number[]) => {}
```

## intersectionPageNoChange

Feature: The current page changes

Usage:

```javascript
instance.listener.intersectionPageNoChange = (payload: number) => {}
```

## pageSizeChange

Feature: The current page size has changed

Usage:

```javascript
instance.listener.pageSizeChange = (payload: number) => {}
```

## pageScaleChange

Feature: The current page scaling has changed

Usage:

```javascript
instance.listener.pageScaleChange = (payload: number) => {}
```

## contentChange

Feature: The current content has changed

Usage:

```javascript
instance.listener.contentChange = () => {}
```

## controlChange

Feature: The control where the current cursor is located changes

Usage:

```javascript
instance.listener.controlChange = (payload: IControl | null) => {}
```

## pageModeChange

Feature: The page mode changes

Usage:

```javascript
instance.listener.pageModeChange = (payload: PageMode) => {}
```

## saved

Feature: Document saved

Usage:

```javascript
instance.listener.saved = (payload: IEditorResult) => {}
```

## zoneChange

Feature: 区域发生改变

Usage:

```javascript
instance.listener.zoneChange = (payload: EditorZone) => {}
```
