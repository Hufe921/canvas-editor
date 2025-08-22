# 获取数据命令

## 使用方式

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
const value = instance.command.commandName()
```

## getValue

功能：获取当前文档信息

用法：

```javascript
const {
  version: string
  data: IEditorData
  options: IEditorOption
} = instance.command.getValue(options?: IGetValueOption)
```

## getValueAsync

功能：获取当前文档信息（异步）

用法：

```javascript
const {
  version: string
  data: IEditorData
  options: IEditorOption
} = await instance.command.getValueAsync(options?: IGetValueOption)
```

## getImage

功能：获取当前页面图片 base64 字符串

用法：

```javascript
const base64StringList = await instance.command.getImage(option?: IGetImageOption)
```

## getOptions

功能：获取编辑器配置

用法：

```javascript
const editorOption = await instance.command.getOptions()
```

## getWordCount

功能：获取文档字数

用法：

```javascript
const wordCount = await instance.command.getWordCount()
```

## getCursorPosition

功能: 获取光标位置坐标

用法:

```javascript
const range = instance.command.getCursorPosition()
```

## getRange

功能：获取选区

用法：

```javascript
const range = instance.command.getRange()
```

## getRangeText

功能：获取选区文本

用法：

```javascript
const rangeText = instance.command.getRangeText()
```

## getRangeContext

功能：获取选区上下文

用法：

```javascript
const rangeContext = instance.command.getRangeContext()
```

## getRangeRow

功能：获取选区所在行元素列表

用法：

```javascript
const rowElementList = instance.command.getRangeRow()
```

## getKeywordRangeList

功能：获取关键词所在选区列表

用法：

```javascript
const rangeList = instance.command.getKeywordRangeList()
```

## getKeywordContext

功能：获取关键词所在上下文本信息

用法：

```javascript
const keywordContextList = instance.command.getKeywordContext(payload: string)
```

## getRangeParagraph

功能：获取选区所在段落元素列表

用法：

```javascript
const paragraphElementList = instance.command.getRangeParagraph()
```

## getPaperMargin

功能：获取页边距

用法：

```javascript
const [top: number, right: number, bottom: number, left: number] =
  instance.command.getPaperMargin()
```

## getSearchNavigateInfo

功能：获取搜索导航信息

用法：

```javascript
const {
  index: number;
  count: number;
} = instance.command.getSearchNavigateInfo()
```

## getCatalog

功能：获取目录

用法：

```javascript
const catalog = await instance.command.getCatalog()
```

## getHTML

功能：获取 HTML

用法：

```javascript
const {
  header: string
  main: string
  footer: string
} = await instance.command.getHTML()
```

## getText

功能：获取文本

用法：

```javascript
const {
  header: string
  main: string
  footer: string
} = await instance.command.getText()
```

## getLocale

功能：获取当前语言

用法：

```javascript
const locale = await instance.command.getLocale()
```

## getGroupIds

功能：获取所有成组 id

用法：

```javascript
const groupIds = await instance.command.getGroupIds()
```

## getControlValue

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

## getControlList

功能：获取所有控件

用法：

```javascript
const controlList = await instance.command.getControlList()
```

## getContainer

功能：获取编辑器容器

用法：

```javascript
const container = await instance.command.getContainer()
```

## getTitleValue

功能：获取标题值

用法：

```javascript
const {
  value: string | null
  elementList: IElement[]
  zone: EditorZone
}[] = await instance.command.getTitleValue(payload: IGetTitleValueOption)
```

## getPositionContextByEvent

功能：获取位置上下文信息通过鼠标事件

用法：

```javascript
const {
  pageNo: number
  element: IElement | null
  rangeRect: RangeRect | null
  tableInfo: ITableInfoByEvent | null
}[] = await instance.command.getPositionContextByEvent(evt: MouseEvent, options?: IPositionContextByEventOption)
```

示例：

```javascript
instance.eventBus.on(
  'mousemove',
  debounce(evt => {
    const positionContext = instance.command.getPositionContextByEvent(evt)
    console.log(positionContext)
  }, 200)
)``
```

## getElementById

功能：根据 id 获取元素

用法：

```javascript
const elementList = await instance.command.getElementById(payload: IGetElementByIdOption)
```

## getAreaValue

功能: 获取区域数据
用法：

```js
const {
  id?: string
  area: IArea
  value: IElement[]
  startPageNo: number
  endPageNo: number
} = instance.command.getAreaValue(options: IGetAreaValueOption)
```
