# Event Listening(eventBus)

## How to Use

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)

// register
instance.eventBus.on<K keyof EventMap>(
  eventName: K,
  callback: EventMap[K]
)

// remove
instance.eventBus.off<K keyof EventMap>(
  eventName: K,
  callback: EventMap[K]
)
```

## rangeStyleChange

Feature: The selection style changes

Usage:

```javascript
instance.eventBus.on('rangeStyleChange', (payload: IRangeStyle) => void)
```

## visiblePageNoListChange

Feature: The visible page changes

Usage:

```javascript
instance.eventBus.on('visiblePageNoListChange', (payload: number[]) => void)
```

## intersectionPageNoChange

Feature: The current page changes

Usage:

```javascript
instance.eventBus.on('intersectionPageNoChange', (payload: number) => void)
```

## pageSizeChange

Feature: The current number of pages has changed

Usage:

```javascript
instance.eventBus.on('pageSizeChange', (payload: number) => void)
```

## pageScaleChange

Feature: The current page scaling has changed

Usage:

```javascript
instance.eventBus.on('pageScaleChange', (payload: number) => void)
```

## contentChange

Feature: The current content has changed

Usage:

```javascript
instance.eventBus.on('contentChange', () => void)
```

## controlChange

Feature: The control where the current cursor is located changes

Usage:

```javascript
instance.eventBus.on('controlChange', (payload: IControlChangeResult) => void)
```

## controlContentChange

Feature: The control content changes

Usage:

```javascript
instance.eventBus.on('controlContentChange', (payload: IControlContentChangeResult) => void)
```

## pageModeChange

Feature: The page mode changes

Usage:

```javascript
instance.eventBus.on('pageModeChange', (payload: PageMode) => void)
```

## saved

Feature: Document saved

Usage:

```javascript
instance.eventBus.on('saved', (payload: IEditorResult) => void)
```

## zoneChange

Feature: The zone changes

Usage:

```javascript
instance.eventBus.on('zoneChange', (payload: EditorZone) => void)
```

## mousemove

Feature: Editor mousemove event

Usage:

```javascript
instance.eventBus.on('mousemove', (evt: MouseEvent) => void)
```

## mouseenter

Feature: Editor mouseenter event

Usage:

```javascript
instance.eventBus.on('mouseenter', (evt: MouseEvent) => void)
```

## mouseleave

Feature: Editor mouseleave event

Usage:

```javascript
instance.eventBus.on('mouseleave', (evt: MouseEvent) => void)
```

## mousedown

Feature: Editor mousedown event

Usage:

```javascript
instance.eventBus.on('mousedown', (evt: MouseEvent) => void)
```

## mouseup

Feature: Editor mouseup event

Usage:

```javascript
instance.eventBus.on('mouseup', (evt: MouseEvent) => void)
```

## click

Feature: Editor click event

Usage:

```javascript
instance.eventBus.on('click', (evt: MouseEvent) => void)
```

## positionContextChange

Feature: The position context change

Usage:

```javascript
instance.eventBus.on('positionContextChange', (payload: IPositionContextChangePayload) => void)
```

## imageSizeChange

Feature: The image size change

Usage:

```javascript
instance.eventBus.on('imageSizeChange', (payload: { element: IElement }) => void)
```
