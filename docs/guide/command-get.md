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
  data: IElement[];
} = instance.command.getValue()
```

## getImage
功能：获取当前页面图片base64字符串

用法：
```javascript
const base64StringList = instance.command.getValue()
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

## getPaperMargin
功能：获取页边距

用法：
```javascript
const [top: number, right: number, bottom: number, left: number] = instance.command.getPaperMargin()
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
