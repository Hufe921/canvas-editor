# 控件方法

## 获取数据

### getControlValue

功能：获取控件值

用法：

```javascript
const {
  value: string | null
  innerText: string | null
  zone: EditorZone
  elementList?: IElement[]
}[] = await instance.command.getControlValue(payload: IGetControlValueOption)
```

### getControlList

功能：获取所有控件

用法：

```javascript
const controlList = await instance.command.getControlList()
```

## 执行动作

### executeRemoveControl

功能：删除控件

用法：

```javascript
instance.command.executeRemoveControl(payload?: IRemoveControlOption)
```

### executeSetControlValue

功能：设置控件值

用法：

```javascript
instance.command.executeSetControlValue(payload: ISetControlValueOption)
```

### executeSetControlValueList

功能：批量设置控件值

用法：

```javascript
instance.command.executeSetControlValueList(payload: ISetControlValueOption[])
```

### executeSetControlExtension

功能：设置控件扩展值

用法：

```javascript
instance.command.executeSetControlExtension(payload: ISetControlExtensionOption)
```

### executeSetControlExtensionList

功能：批量设置控件扩展值

用法：

```javascript
instance.command.executeSetControlExtensionList(payload: ISetControlExtensionOption[])
```

### executeSetControlProperties

功能：设置控件属性

用法：

```javascript
instance.command.executeSetControlProperties(payload: ISetControlProperties)
```

### executeSetControlPropertiesList

功能：批量设置控件属性

用法：

```javascript
instance.command.executeSetControlPropertiesList(payload: ISetControlProperties[])
```

### executeSetControlHighlight

功能：设置控件高亮（根据关键词）

用法：

```javascript
instance.command.executeSetControlHighlight(payload: ISetControlHighlightOption)
```

### executeLocationControl

功能：定位并激活控件

用法：

```javascript
instance.command.executeLocationControl(controlId: string, options?: ILocationControlOption)
```

### executeInsertControl

功能：插入控件

用法：

```javascript
instance.command.executeInsertControl(payload: IElement)
```

### executeJumpControl

功能：跳转到下/上一个控件

用法：

```javascript
instance.command.executeJumpControl(payload?: { direction?: MoveDirection })
```
