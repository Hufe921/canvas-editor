# Control Commands

## Get Data

### getControlValue

Feature: Get control value

Usage:

```javascript
const {
  value: string | null
  innerText: string | null
  zone: EditorZone
  elementList?: IElement[]
} = await instance.command.getControlValue(payload: IGetControlValueOption)
```

### getControlList

Feature: Get control list

Usage:

```javascript
const controlList = await instance.command.getControlList()
```

## Execute

### executeRemoveControl

Feature: Delete the control

Usage:

```javascript
instance.command.executeRemoveControl(payload?: IRemoveControlOption)
```

### executeSetControlValue

Feature: Set control value

Usage:

```javascript
instance.command.executeSetControlValue(payload: ISetControlValueOption)
```

### executeSetControlValueList

Feature: Batch set control value

Usage:

```javascript
instance.command.executeSetControlValueList(payload: ISetControlValueOption[])
```

### executeSetControlExtension

Feature: Set control extension value

Usage:

```javascript
instance.command.executeSetControlExtension(payload: ISetControlExtensionOption)
```

### executeSetControlExtensionList

Feature: Batch set control extension value

Usage:

```javascript
instance.command.executeSetControlExtensionList(payload: ISetControlExtensionOption[])
```

### executeSetControlProperties

Feature: Set control properties

Usage:

```javascript
instance.command.executeSetControlProperties(payload: ISetControlProperties)
```

### executeSetControlPropertiesList

Feature: Batch set control properties

Usage:

```javascript
instance.command.executeSetControlPropertiesList(payload: ISetControlProperties[])
```

### executeSetControlHighlight

Feature: Set control highlight (by keyword)

Usage:

```javascript
instance.command.executeSetControlHighlight(payload: ISetControlHighlightOption)
```

### executeLocationControl

Feature: Positioning and activating control

Usage:

```javascript
instance.command.executeLocationControl(controlId: string, options?: ILocationControlOption)
```

### executeInsertControl

Feature: Insert control

Usage:

```javascript
instance.command.executeInsertControl(payload: IElement)
```

### executeJumpControl

Feature: Jump to the next/previous control

Usage:

```javascript
instance.command.executeJumpControl(payload?: { direction?: MoveDirection })
```
