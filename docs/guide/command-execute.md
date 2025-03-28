# 执行动作命令

## 使用方式

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
instance.command.commandName()
```

## executeMode

功能：切换编辑器模式（编辑、清洁、只读、表单）

用法：

```javascript
instance.command.executeMode(editorMode: EditorMode)
```

## executeCut

功能：剪切

用法：

```javascript
instance.command.executeCut()
```

## executeCopy

功能：复制

用法：

```javascript
instance.command.executeCopy(payload?: ICopyOption)
```

## executePaste

功能：粘贴

用法：

```javascript
instance.command.executePaste(payload?: IPasteOption)
```

## executeSelectAll

功能：全选

用法：

```javascript
instance.command.executeSelectAll()
```

## executeBackspace

功能：向前删除

用法：

```javascript
instance.command.executeBackspace()
```

## executeSetRange

功能：设置选区

用法：

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

功能：替换选区

用法：

```javascript
instance.command.executeReplaceRange(range: IRange)
```

## executeSetPositionContext

功能：设置位置上下文

用法：

```javascript
instance.command.executeSetPositionContext(range: IRange)
```

## executeForceUpdate

功能：强制重新渲染文档

用法：

```javascript
instance.command.executeForceUpdate(options?: IForceUpdateOption)
```

## executeBlur

功能：设置编辑器失焦

用法：

```javascript
instance.command.executeBlur()
```

## executeUndo

功能：撤销

用法：

```javascript
instance.command.executeUndo()
```

## executeRedo

功能：重做

用法：

```javascript
instance.command.executeRedo()
```

## executePainter

功能：格式刷-复制样式

用法：

```javascript
instance.command.executePainter()
```

## executeApplyPainterStyle

功能：格式刷-应用样式

用法：

```javascript
instance.command.executeApplyPainterStyle()
```

## executeFormat

功能：清除样式

用法：

```javascript
instance.command.executeFormat()
```

## executeFont

功能：设置字体

用法：

```javascript
instance.command.executeFont(font: string)
```

## executeSize

功能：设置字号

用法：

```javascript
instance.command.executeSize(size: number)
```

## executeSizeAdd

功能：增大字号

用法：

```javascript
instance.command.executeSizeAdd()
```

## executeSizeMinus

功能：减小字号

用法：

```javascript
instance.command.executeSizeMinus()
```

## executeBold

功能：字体加粗

用法：

```javascript
instance.command.executeBold()
```

## executeItalic

功能：字体斜体

用法：

```javascript
instance.command.executeItalic()
```

## executeUnderline

功能：下划线

用法：

```javascript
instance.command.executeUnderline(textDecoration?: ITextDecoration)
```

## executeStrikeout

功能：删除线

用法：

```javascript
instance.command.executeStrikeout()
```

## executeSuperscript

功能：上标

用法：

```javascript
instance.command.executeSuperscript()
```

## executeSubscript

功能：上下标

用法：

```javascript
instance.command.executeSubscript()
```

## executeColor

功能：字体颜色

用法：

```javascript
instance.command.executeColor(color: string | null)
```

## executeHighlight

功能：高亮

用法：

```javascript
instance.command.executeHighlight(color: string | null)
```

## executeTitle

功能：标题设置

用法：

```javascript
instance.command.executeTitle(TitleLevel | null)
```

## executeList

功能：列表设置

用法：

```javascript
instance.command.executeList(listType: ListType | null, listStyle?: ListStyle)
```

## executeRowFlex

功能：行对齐

用法：

```javascript
instance.command.executeRowFlex(rowFlex: RowFlex)
```

## executeRowMargin

功能：行间距

用法：

```javascript
instance.command.executeRowMargin(rowMargin: number)
```

## executeInsertTable

功能：插入表格

用法：

```javascript
instance.command.executeInsertTable(row: number, col: number)
```

## executeInsertTableTopRow

功能：向上插入一行

用法：

```javascript
instance.command.executeInsertTableTopRow()
```

## executeInsertTableBottomRow

功能：向下插入一行

用法：

```javascript
instance.command.executeInsertTableBottomRow()
```

## executeInsertTableLeftCol

功能：向左插入一列

用法：

```javascript
instance.command.executeInsertTableLeftCol()
```

## executeInsertTableRightCol

功能：向右插入一列

用法：

```javascript
instance.command.executeInsertTableRightCol()
```

## executeDeleteTableRow

功能：删除当前行

用法：

```javascript
instance.command.executeDeleteTableRow()
```

## executeDeleteTableCol

功能：删除当前列

用法：

```javascript
instance.command.executeDeleteTableCol()
```

## executeDeleteTable

功能：删除表格

用法：

```javascript
instance.command.executeDeleteTable()
```

## executeMergeTableCell

功能：合并表格

用法：

```javascript
instance.command.executeMergeTableCell()
```

## executeCancelMergeTableCell

功能：取消合并表格

用法：

```javascript
instance.command.executeCancelMergeTableCell()
```

## executeSplitVerticalTableCell

功能：分隔当前单元格（垂直方向）

用法：

```javascript
instance.command.executeSplitVerticalTableCell()
```

## executeSplitHorizontalTableCell

功能：分隔当前单元格（水平方向）

用法：

```javascript
instance.command.executeSplitHorizontalTableCell()
```

## executeTableTdVerticalAlign

功能：表格单元格垂直对齐方式

用法：

```javascript
instance.command.executeTableTdVerticalAlign(payload: VerticalAlign)
```

## executeTableBorderType

功能：表格边框类型

用法：

```javascript
instance.command.executeTableBorderType(payload: TableBorder)
```

## executeTableBorderColor

功能：表格边框颜色

用法：

```javascript
instance.command.executeTableBorderColor(payload: string)
```

## executeTableTdBorderType

功能：表格单元格边框类型

用法：

```javascript
instance.command.executeTableTdBorderType(payload: TdBorder)
```

## executeTableTdSlashType

功能：表格单元格内斜线

用法：

```javascript
instance.command.executeTableTdSlashType(payload: TdSlash)
```

## executeTableTdBackgroundColor

功能：表格单元格背景色

用法：

```javascript
instance.command.executeTableTdBackgroundColor(payload: string)
```

## executeTableSelectAll

功能：选中整个表格

用法：

```javascript
instance.command.executeTableSelectAll()
```

## executeImage

功能：插入图片

用法：

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

功能：插入链接

用法：

```javascript
instance.command.executeHyperlink({
  type: ElementType.HYPERLINK,
  value: string,
  url: string,
  valueList: IElement[]
})
```

## executeDeleteHyperlink

功能：删除链接

用法：

```javascript
instance.command.executeDeleteHyperlink()
```

## executeCancelHyperlink

功能：取消链接

用法：

```javascript
instance.command.executeCancelHyperlink()
```

## executeEditHyperlink

功能：编辑链接

用法：

```javascript
instance.command.executeEditHyperlink(newUrl: string)
```

## executeSeparator

功能：插入分割线

用法：

```javascript
instance.command.executeSeparator(dashArray: number[])
```

## executePageBreak

功能：分页符

用法：

```javascript
instance.command.executePageBreak()
```

## executeAddWatermark

功能：添加水印

用法：

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

功能：删除水印

用法：

```javascript
instance.command.executeDeleteWatermark()
```

## executeSearch

功能：搜索

用法：

```javascript
instance.command.executeSearch(keyword: string)
```

## executeSearchNavigatePre

功能：搜索导航-上一个

用法：

```javascript
instance.command.executeSearchNavigatePre()
```

## executeSearchNavigateNext

功能：搜索导航-下一个

用法：

```javascript
instance.command.executeSearchNavigateNext()
```

## executeReplace

功能：搜索替换

用法：

```javascript
instance.command.executeReplace(newWord: string, option?: IReplaceOption)
```

## executePrint

功能：打印

用法：

```javascript
instance.command.executePrint()
```

## executeReplaceImageElement

功能：替换图片

用法：

```javascript
instance.command.executeReplaceImageElement(newUrl: string)
```

## executeSaveAsImageElement

功能：另存为图片

用法：

```javascript
instance.command.executeSaveAsImageElement()
```

## executeChangeImageDisplay

功能：改变图片行显示方式

用法：

```javascript
instance.command.executeChangeImageDisplay(element: IElement, display: ImageDisplay)
```

## executePageMode

功能：页面模式

用法：

```javascript
instance.command.executePageMode(pageMode: PageMode)
```

## executePageScale

功能：设置缩放比例

用法：

```javascript
instance.command.executePageScale(scale: number)
```

## executePageScaleRecovery

功能：恢复页面原始缩放比例

用法：

```javascript
instance.command.executePageScaleRecovery()
```

## executePageScaleMinus

功能：页面缩小

用法：

```javascript
instance.command.executePageScaleMinus()
```

## executePageScaleAdd

功能：页面放大

用法：

```javascript
instance.command.executePageScaleAdd()
```

## executePaperSize

功能：设置纸张大小

用法：

```javascript
instance.command.executePaperSize(width: number, height: number)
```

## executePaperDirection

功能：设置纸张方向

用法：

```javascript
instance.command.executePaperDirection(paperDirection: PaperDirection)
```

## executeSetPaperMargin

功能：设置纸张页边距

用法：

```javascript
instance.command.executeSetPaperMargin([top: number, right: number, bottom: number, left: number])
```

## executeSetMainBadge

功能：设置正文徽章

用法：

```javascript
instance.command.executeSetMainBadge(payload: IBadge | null)
```

## executeSetAreaBadge

功能：设置区域徽章

用法：

```javascript
instance.command.executeSetAreaBadge(payload: IAreaBadge[])
```

## executeInsertElementList

功能：插入元素

用法：

```javascript
instance.command.executeInsertElementList(elementList: IElement[], options?: IInsertElementListOption)
```

## executeAppendElementList

功能：追加元素

用法：

```javascript
instance.command.executeAppendElementList(elementList: IElement[], options?: IAppendElementListOption)
```

## executeUpdateElementById

功能：根据 id 修改元素属性

用法：

```javascript
instance.command.executeUpdateElementById(payload: IUpdateElementByIdOption)
```

## executeDeleteElementById

功能：根据 id 删除元素

用法：

```javascript
instance.command.executeDeleteElementById(payload: IDeleteElementByIdOption)
```

## executeSetValue

功能：设置编辑器数据

用法：

```javascript
instance.command.executeSetValue(payload: Partial<IEditorData>, options?: ISetValueOption)
```

## executeRemoveControl

功能：删除控件

用法：

```javascript
instance.command.executeRemoveControl(payload?: IRemoveControlOption)
```

## executeSetLocale

功能：设置本地语言

用法：

```javascript
instance.command.executeSetLocale(locale: string)
```

## executeLocationCatalog

功能：定位目录位置

用法：

```javascript
instance.command.executeLocationCatalog(titleId: string)
```

## executeWordTool

功能：文字工具（删除空行、行首空格）

用法：

```javascript
instance.command.executeWordTool()
```

## executeSetHTML

功能：设置编辑器 HTML 数据

用法：

```javascript
instance.command.executeSetHTML(payload: Partial<IEditorHTML)
```

## executeSetGroup

功能：设置成组

用法：

```javascript
instance.command.executeSetGroup()
```

## executeDeleteGroup

功能：删除成组

用法：

```javascript
instance.command.executeDeleteGroup(groupId: string)
```

## executeLocationGroup

功能：定位成组位置

用法：

```javascript
instance.command.executeLocationGroup(groupId: string)
```

## executeSetZone

功能：设置激活区域（页眉、正文、页脚）

用法：

```javascript
instance.command.executeSetZone(zone: EditorZone)
```

## executeSetControlValue

功能：设置控件值

用法：

```javascript
instance.command.executeSetControlValue(payload: ISetControlValueOption)
```

## executeSetControlValueList

功能：批量设置控件值

用法：

```javascript
instance.command.executeSetControlValueList(payload: ISetControlValueOption[])
```

## executeSetControlExtension

功能：设置控件扩展值

用法：

```javascript
instance.command.executeSetControlExtension(payload: ISetControlExtensionOption)
```

## executeSetControlExtensionList

功能：批量设置控件扩展值

用法：

```javascript
instance.command.executeSetControlExtensionList(payload: ISetControlExtensionOption[])
```

## executeSetControlProperties

功能：设置控件属性

用法：

```javascript
instance.command.executeSetControlProperties(payload: ISetControlProperties)
```

## executeSetControlPropertiesList

功能：批量设置控件属性

用法：

```javascript
instance.command.executeSetControlPropertiesList(payload: ISetControlProperties[])
```

## executeSetControlHighlight

功能：设置控件高亮（根据关键词）

用法：

```javascript
instance.command.executeSetControlHighlight(payload: ISetControlHighlightOption)
```

## executeLocationControl

功能：定位并激活控件

用法：

```javascript
instance.command.executeLocationControl(controlId: string, options?: ILocationControlOption)
```

## executeInsertControl

功能：插入控件

用法：

```javascript
instance.command.executeInsertControl(payload: IElement)
```

## executeUpdateOptions

功能：修改配置

用法：

```javascript
instance.command.executeUpdateOptions(payload: IUpdateOption)
```

## executeInsertTitle

功能：插入标题

用法：

```javascript
instance.command.executeInsertTitle(payload: IElement)
```

## executeFocus

功能：光标聚焦

用法：

```javascript
instance.command.executeFocus(payload?: IFocusOption)
```

## executeInsertArea

功能： 插入区域

```js
const areaId = instance.command.executeInsertArea(payload: IInsertAreaOption)
```

## executeSetAreaProperties

功能：设置区域属性

```js
instance.command.executeSetAreaProperties(payload: ISetAreaPropertiesOption)
```

## executeLocationArea

功能：定位区域位置

```js
instance.command.executeLocationArea(areaId: string)
```
