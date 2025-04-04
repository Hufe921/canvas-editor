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
  version: string
  data: IEditorData
  options: IEditorOption
} = instance.command.getValue(options?: IGetValueOption)
```

## getValueAsync

Feature: Get the current document value (async)

Usage:

```javascript
const {
  version: string
  data: IEditorData
  options: IEditorOption
} = await instance.command.getValueAsync(options?: IGetValueOption)
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

## getCursorPosition

Feature: Get cursor position with coordinates

Usage:

```javascript
const range = instance.command.getCursorPosition()
```

## getRange

Feature: Get range

Usage:

```javascript
const range = instance.command.getRange()
```

## getRangeText

Feature: Get range text

Usage:

```javascript
const rangeText = instance.command.getRangeText()
```

## getRangeContext

Feature: Get range context

Usage:

```javascript
const rangeContext = instance.command.getRangeContext()
```

## getRangeRow

Feature: Get range row element list

Usage:

```javascript
const rowElementList = instance.command.getRangeRow()
```

## getKeywordRangeList

Feature: Get range list by keyword

Usage:

```javascript
const rangeList = instance.command.getKeywordRangeList()
```

## getKeywordContext

Feature: Get context list by keyword

Usage:

```javascript
const keywordContextList = instance.command.getKeywordContext(payload: string)
```

## getRangeParagraph

Feature: Get range paragraph element list

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
  zone: EditorZone
  elementList?: IElement[]
} = await instance.command.getControlValue(payload: IGetControlValueOption)
```

## getControlList

Feature: Get control list

Usage:

```javascript
const controlList = await instance.command.getControlList()
```

## getContainer

Feature: Get editor container

Usage:

```javascript
const container = await instance.command.getContainer()
```

## getTitleValue

Feature: Get title value

Usage:

```javascript
const {
  value: string | null
  elementList: IElement[]
  zone: EditorZone
}[] = await instance.command.getTitleValue(payload: IGetTitleValueOption)
```

## getPositionContextByEvent

Feature: Get position context by mouse event

Usage:

```javascript
const {
  pageNo: number
  element: IElement | null
  rangeRect: RangeRect | null
  tableInfo: ITableInfoByEvent | null
}[] = await instance.command.getPositionContextByEvent(evt: MouseEvent, options?: IPositionContextByEventOption)
```

demo:

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

Feature: Get element list by id

Usage:

```javascript
const elementList = await instance.command.getElementById(payload: IGetElementByIdOption)
```

## getAreaValue

Feature: Get area value

Usage:

```javascript
const {
  id?: string
  area: IArea
  value: IElement[]
  startPageNo: number
  endPageNo: number
} = instance.command.getAreaValue(options: IGetAreaValueOption)
```
