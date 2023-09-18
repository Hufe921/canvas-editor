# Get Data Command

## How to Use

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
const value = instance.command.commandName()
```

## getValue

Feature: Get the current document value

Usage:

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

Feature: Gets the base64 string of the current page image

Usage:

```javascript
const base64StringList = await instance.command.getImage(option?: IGetImageOption)
```

## getOptions

Feature: Get editor options

Usage:

```javascript
const editorOption = await instance.command.getOptions()
```

## getWordCount

Feature: Get document word count

Usage:

```javascript
const wordCount = await instance.command.getWordCount()
```

## getRangeText

Feature: Get selection text

Usage:

```javascript
const rangeText = instance.command.getRangeText()
```

## getRangeContext

Feature: Get selection context

Usage:

```javascript
const rangeContext = instance.command.getRangeContext()
```

## getRangeRow

Feature: Get selection row element list

Usage:

```javascript
const rowElementList = instance.command.getRangeRow()
```

## getRangeParagraph

Feature: Get selection paragraph element list

Usage:

```javascript
const paragraphElementList = instance.command.getRangeParagraph()
```

## getPaperMargin

Feature: Gets the margins

Usage:

```javascript
const [top: number, right: number, bottom: number, left: number] =
  instance.command.getPaperMargin()
```

## getSearchNavigateInfo

Feature: Get search navigation information

Usage:

```javascript
const {
  index: number;
  count: number;
} = instance.command.getSearchNavigateInfo()
```

## getCatalog

Feature: Get directory

Usage:

```javascript
const catalog = await instance.command.getCatalog()
```

## getHTML

Feature: Get HTML

Usage:

```javascript
const {
  header: string
  main: string
  footer: string
} = await instance.command.getHTML()
```

## getText

Feature: Get text

Usage:

```javascript
const {
  header: string
  main: string
  footer: string
} = await instance.command.getText()
```

## getLocale

Feature: Get current locale

Usage:

```javascript
const locale = await instance.command.getLocale()
```

## getGroupIds

Feature: Get all group ids

Usage:

```javascript
const groupIds = await instance.command.getGroupIds()
```

## getControlValue

Feature: Get control value

Usage:

```javascript
const {
  value: string | null
  innerText: string | null
} = await instance.command.getControlValue(payload: IGetControlValueOption)
```
