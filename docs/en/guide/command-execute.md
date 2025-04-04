# Execute Command

## How to Use

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
instance.command.commandName()
```

## executeMode

Feature: Switch editor mode (Edit, Clean, Read only)

Usage:

```javascript
instance.command.executeMode(editorMode: EditorMode)
```

## executeCut

Feature: Cut

Usage:

```javascript
instance.command.executeCut()
```

## executeCopy

Feature: Copy

Usage:

```javascript
instance.command.executeCopy(payload?: ICopyOption)
```

## executePaste

Feature: Paste

Usage:

```javascript
instance.command.executePaste(payload?: IPasteOption)
```

## executeSelectAll

Feature: Select all

Usage:

```javascript
instance.command.executeSelectAll()
```

## executeBackspace

Feature: Forward delete

Usage:

```javascript
instance.command.executeBackspace()
```

## executeSetRange

Feature: Set range

Usage:

```javascript
instance.command.executeSetRange(
  startIndex: number,
  endIndex: number,
  tableId?: string,
  startTdIndex?: number,
  endTdIndex?: number,
  startTrIndex?: number,
  endTrIndex?: number
)
```

## executeReplaceRange

Feature: Replace range

Usage:

```javascript
instance.command.executeReplaceRange(range: IRange)
```

## executeSetPositionContext

Feature: Set position context

Usage:

```javascript
instance.command.executeSetPositionContext(range: IRange)
```

## executeForceUpdate

Feature: force update editor

Usage:

```javascript
instance.command.executeForceUpdate(options?: IForceUpdateOption)
```

## executeBlur

Feature: Set editor blur

Usage:

```javascript
instance.command.executeBlur()
```

## executeUndo

Feature: Undo

Usage:

```javascript
instance.command.executeUndo()
```

## executeRedo

Feature: Redo

Usage:

```javascript
instance.command.executeRedo()
```

## executePainter

Feature: Format Brush - Copy style

Usage:

```javascript
instance.command.executePainter()
```

## executeApplyPainterStyle

Feature: Format brush - Apply style

Usage:

```javascript
instance.command.executeApplyPainterStyle()
```

## executeFormat

Feature: Clear format

Usage:

```javascript
instance.command.executeFormat()
```

## executeFont

Feature: Set font

Usage:

```javascript
instance.command.executeFont(font: string)
```

## executeSize

Feature: Set font size

Usage:

```javascript
instance.command.executeSize(size: number)
```

## executeSizeAdd

Feature: Increase the font size

Usage:

```javascript
instance.command.executeSizeAdd()
```

## executeSizeMinus

Feature: Reduce the font size

Usage:

```javascript
instance.command.executeSizeMinus()
```

## executeBold

Feature: Bold

Usage:

```javascript
instance.command.executeBold()
```

## executeItalic

Feature: Italic

Usage:

```javascript
instance.command.executeItalic()
```

## executeUnderline

Feature: Underline

Usage:

```javascript
instance.command.executeUnderline(textDecoration?: ITextDecoration)
```

## executeStrikeout

Feature: Strikeout

Usage:

```javascript
instance.command.executeStrikeout()
```

## executeSuperscript

Feature: Superscript

Usage:

```javascript
instance.command.executeSuperscript()
```

## executeSubscript

Feature: Subscript

Usage:

```javascript
instance.command.executeSubscript()
```

## executeColor

Feature: Font color

Usage:

```javascript
instance.command.executeColor(color: string | null)
```

## executeHighlight

Feature: Highlight

Usage:

```javascript
instance.command.executeHighlight(color: string | null)
```

## executeTitle

Feature: Set title

Usage:

```javascript
instance.command.executeTitle(TitleLevel | null)
```

## executeList

Feature: Set list

Usage:

```javascript
instance.command.executeList(listType: ListType | null, listStyle?: ListStyle)
```

## executeRowFlex

Feature: Line alignment

Usage:

```javascript
instance.command.executeRowFlex(rowFlex: RowFlex)
```

## executeRowMargin

Feature: Line spacing

Usage:

```javascript
instance.command.executeRowMargin(rowMargin: number)
```

## executeInsertTable

Feature: Insert table

Usage:

```javascript
instance.command.executeInsertTable(row: number, col: number)
```

## executeInsertTableTopRow

Feature: Insert a row up

Usage:

```javascript
instance.command.executeInsertTableTopRow()
```

## executeInsertTableBottomRow

Feature: Insert a row down

Usage:

```javascript
instance.command.executeInsertTableBottomRow()
```

## executeInsertTableLeftCol

Feature: Insert a column to the left

Usage:

```javascript
instance.command.executeInsertTableLeftCol()
```

## executeInsertTableRightCol

Feature: Insert a column to the right

Usage:

```javascript
instance.command.executeInsertTableRightCol()
```

## executeDeleteTableRow

Feature: Deletes the current row

Usage:

```javascript
instance.command.executeDeleteTableRow()
```

## executeDeleteTableCol

Feature: Delete the current column

Usage:

```javascript
instance.command.executeDeleteTableCol()
```

## executeDeleteTable

Feature: Delete the table

Usage:

```javascript
instance.command.executeDeleteTable()
```

## executeMergeTableCell

Feature: Merge tables

Usage:

```javascript
instance.command.executeMergeTableCell()
```

## executeCancelMergeTableCell

Feature: Cancel the merge form

Usage:

```javascript
instance.command.executeCancelMergeTableCell()
```

## executeSplitVerticalTableCell

Feature: Split table cell (vertical)

Usage:

```javascript
instance.command.executeSplitVerticalTableCell()
```

## executeSplitHorizontalTableCell

Feature: Split table cell (horizontal)

Usage:

```javascript
instance.command.executeSplitHorizontalTableCell()
```

## executeTableTdVerticalAlign

Feature: Table cell vertical alignment

Usage:

```javascript
instance.command.executeTableTdVerticalAlign(payload: VerticalAlign)
```

## executeTableBorderType

Feature: Table border type

Usage:

```javascript
instance.command.executeTableBorderType(payload: TableBorder)
```

## executeTableBorderColor

Feature: Table border color

Usage:

```javascript
instance.command.executeTableBorderColor(payload: string)
```

## executeTableTdBorderType

Feature: Table td border type

Usage:

```javascript
instance.command.executeTableTdBorderType(payload: TdBorder)
```

## executeTableTdSlashType

Feature: Table td slash type

Usage:

```javascript
instance.command.executeTableTdSlashType(payload: TdSlash)
```

## executeTableTdBackgroundColor

Feature: Table cell background color

Usage:

```javascript
instance.command.executeTableTdBackgroundColor(payload: string)
```

## executeTableSelectAll

Feature: Select the entire table

Usage:

```javascript
instance.command.executeTableSelectAll()
```

## executeImage

Feature: Insert a picture

Usage:

```javascript
instance.command.executeImage({
  id?: string;
  width: number;
  height: number;
  value: string;
  imgDisplay?: ImageDisplay;
})
```

## executeHyperlink

Feature: Insert a link

Usage:

```javascript
instance.command.executeHyperlink({
  type: ElementType.HYPERLINK,
  value: string,
  url: string,
  valueList: IElement[]
})
```

## executeDeleteHyperlink

Feature: Delete the link

Usage:

```javascript
instance.command.executeDeleteHyperlink()
```

## executeCancelHyperlink

Feature: Unlink

Usage:

```javascript
instance.command.executeCancelHyperlink()
```

## executeEditHyperlink

Feature: Edit the link

Usage:

```javascript
instance.command.executeEditHyperlink(newUrl: string)
```

## executeSeparator

Feature: Insert a dividing line

Usage:

```javascript
instance.command.executeSeparator(dashArray: number[])
```

## executePageBreak

Feature: Page breaks

Usage:

```javascript
instance.command.executePageBreak()
```

## executeAddWatermark

Feature: Add a watermark

Usage:

```javascript
instance.command.executeAddWatermark({
  data: string;
  color?: string;
  opacity?: number;
  size?: number;
  font?: string;
})
```

## executeDeleteWatermark

Feature: Remove the watermark

Usage:

```javascript
instance.command.executeDeleteWatermark()
```

## executeSearch

Feature: 搜索

Usage:

```javascript
instance.command.executeSearch(keyword: string)
```

## executeSearchNavigatePre

Feature: Search Navigation - Previous

Usage:

```javascript
instance.command.executeSearchNavigatePre()
```

## executeSearchNavigateNext

Feature: Search Navigation - Next

Usage:

```javascript
instance.command.executeSearchNavigateNext()
```

## executeReplace

Feature: Search for replacement

Usage:

```javascript
instance.command.executeReplace(newWord: string, option?: IReplaceOption)
```

## executePrint

Feature: Print

Usage:

```javascript
instance.command.executePrint()
```

## executeReplaceImageElement

Feature: Replace the picture

Usage:

```javascript
instance.command.executeReplaceImageElement(newUrl: string)
```

## executeSaveAsImageElement

Feature: Save as picture

Usage:

```javascript
instance.command.executeSaveAsImageElement()
```

## executeChangeImageDisplay

Feature: Change how image rows are displayed

Usage:

```javascript
instance.command.executeChangeImageDisplay(element: IElement, display: ImageDisplay)
```

## executePageMode

Feature: Page mode

Usage:

```javascript
instance.command.executePageMode(pageMode: PageMode)
```

## executePageScale

Feature: Set page scale

Usage:

```javascript
instance.command.executePageScale(scale: number)
```

## executePageScaleRecovery

Feature: Restore the original zoom factor of the page

Usage:

```javascript
instance.command.executePageScaleRecovery()
```

## executePageScaleMinus

Feature: Page zoom out

Usage:

```javascript
instance.command.executePageScaleMinus()
```

## executePageScaleAdd

Feature: Page zoom in

Usage:

```javascript
instance.command.executePageScaleAdd()
```

## executePaperSize

Feature: Set the paper size

Usage:

```javascript
instance.command.executePaperSize(width: number, height: number)
```

## executePaperDirection

Feature: Set the paper orientation

Usage:

```javascript
instance.command.executePaperDirection(paperDirection: PaperDirection)
```

## executeSetPaperMargin

Feature: Set the paper margins

Usage:

```javascript
instance.command.executeSetPaperMargin([top: number, right: number, bottom: number, left: number])
```

## executeSetMainBadge

Feature: Set main badge

Usage:

```javascript
instance.command.executeSetMainBadge(payload: IBadge | null)
```

## executeSetAreaBadge

Feature: Set area badge

Usage:

```javascript
instance.command.executeSetAreaBadge(payload: IAreaBadge[])
```

## executeInsertElementList

Feature: Insert an element

Usage:

```javascript
instance.command.executeInsertElementList(elementList: IElement[], options?: IInsertElementListOption)
```

## executeAppendElementList

Feature: Append elements

Usage:

```javascript
instance.command.executeAppendElementList(elementList: IElement[], options?: IAppendElementListOption)
```

## executeUpdateElementById

Feature: Update element by id

Usage:

```javascript
instance.command.executeUpdateElementById(payload: IUpdateElementByIdOption)
```

## executeDeleteElementById

Feature: Delete element by id

Usage:

```javascript
instance.command.executeDeleteElementById(payload: IDeleteElementByIdOption)
```

## executeSetValue

Feature: Set the editor data

Usage:

```javascript
instance.command.executeSetValue(payload: Partial<IEditorData>, options?: ISetValueOption)
```

## executeRemoveControl

Feature: Delete the control

Usage:

```javascript
instance.command.executeRemoveControl(payload?: IRemoveControlOption)
```

## executeSetLocale

Feature: Set local language

Usage:

```javascript
instance.command.executeSetLocale(locale: string)
```

## executeLocationCatalog

Feature: Locate directory location

Usage:

```javascript
instance.command.executeLocationCatalog(titleId: string)
```

## executeWordTool

Feature: Word Tool (Delete blank lines and leading Spaces)

Usage:

```javascript
instance.command.executeWordTool()
```

## executeSetHTML

Feature: Set the editor HTML data

Usage:

```javascript
instance.command.executeSetHTML(payload: Partial<IEditorHTML)
```

## executeSetGroup

Feature: Set group

Usage:

```javascript
instance.command.executeSetGroup()
```

## executeDeleteGroup

Feature: Delete group

Usage:

```javascript
instance.command.executeDeleteGroup(groupId: string)
```

## executeLocationGroup

Feature: Positioning group position

Usage:

```javascript
instance.command.executeLocationGroup(groupId: string)
```

## executeSetZone

Feature: Set active zone (header, main, footer)

Usage:

```javascript
instance.command.executeSetZone(zone: EditorZone)
```

## executeSetControlValue

Feature: Set control value

Usage:

```javascript
instance.command.executeSetControlValue(payload: ISetControlValueOption)
```

## executeSetControlValueList

Feature: Batch set control value

Usage:

```javascript
instance.command.executeSetControlValueList(payload: ISetControlValueOption[])
```

## executeSetControlExtension

Feature: Set control extension value

Usage:

```javascript
instance.command.executeSetControlExtension(payload: ISetControlExtensionOption)
```

## executeSetControlExtensionList

Feature: Batch set control extension value

Usage:

```javascript
instance.command.executeSetControlExtensionList(payload: ISetControlExtensionOption[])
```

## executeSetControlProperties

Feature: Set control properties

Usage:

```javascript
instance.command.executeSetControlProperties(payload: ISetControlProperties)
```

## executeSetControlPropertiesList

Feature: Batch set control properties

Usage:

```javascript
instance.command.executeSetControlPropertiesList(payload: ISetControlProperties[])
```

## executeSetControlHighlight

Feature: Set control highlight (by keyword)

Usage:

```javascript
instance.command.executeSetControlHighlight(payload: ISetControlHighlightOption)
```

## executeLocationControl

Feature: Positioning and activating control

Usage:

```javascript
instance.command.executeLocationControl(controlId: string, options?: ILocationControlOption)
```

## executeInsertControl

Feature: Insert control

Usage:

```javascript
instance.command.executeInsertControl(payload: IElement)
```

## executeUpdateOptions

Feature: Update options

Usage:

```javascript
instance.command.executeUpdateOptions(payload: IUpdateOption)
```

## executeInsertTitle

Feature: Insert title

Usage:

```javascript
instance.command.executeInsertTitle(payload: IElement)
```

## executeFocus

Feature: focus

Usage:

```javascript
instance.command.executeFocus(payload?: IFocusOption)
```

## executeInsertArea

Feature: insert area element

Usage:

```javascript
const areaId = instance.command.executeInsertArea(payload: IInsertAreaOption)
```

## executeSetAreaProperties

Feature: set area properties

Usage:

```javascript
instance.command.executeSetAreaProperties(payload: ISetAreaPropertiesOption)
```

## executeLocationArea

Feature: positioning area position

Usage:

```javascript
instance.command.executeLocationArea(areaId: string)
```
