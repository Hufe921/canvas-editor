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
  version: string;
  width: number;
  height: number;
  margins: IMargin;
  header?: IHeader;
  watermark?: IWatermark;
  data: IEditorData;
} = instance.command.getValue(options?: IGetValueOption)
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
} = await instance.command.getControlValue(payload: IGetControlValueOption)
```
