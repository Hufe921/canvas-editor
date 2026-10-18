# Event Listening(listener)

::: warning
The listener can only respond to one method, and no new listening methods will be added in the future. It is recommended to use eventBus for event listening.
:::

## How to Use

```javascript
import Editor from '@herberthe/canvas-editor'

const instance = await Editor.create(container, data, options)
instance.listener.eventName = () => {}
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
instance.listener.controlChange = (payload: IControlChangeResult) => {}
```

## controlContentChange

Feature: The control content changes

Usage:

```javascript
instance.listener.controlContentChange = (
  payload: IControlContentChangeResult
) => {}
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

## fontCoverageChange

Receives the current `FontCoverageReport` when coverage/download state changes;
resolved issues are removed. Query once after subscribing to avoid depending on
initial event timing. Built-in hints need no subscription.

```typescript
instance.listener.fontCoverageChange = report => {
  console.log(report.issues)
}
const current = instance.getFontCoverageReport()
```

[Font APIs and coverage limits](./font-and-esm-migration.md).
