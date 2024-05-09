import { NBSP, WRAP, ZERO } from '../../dataset/constant/Common'
import { EDITOR_ELEMENT_STYLE_ATTR } from '../../dataset/constant/Element'
import {
  titleOrderNumberMapping,
  titleSizeMapping
} from '../../dataset/constant/Title'
import { defaultWatermarkOption } from '../../dataset/constant/Watermark'
import { ImageDisplay } from '../../dataset/enum/Common'
import { ControlComponent } from '../../dataset/enum/Control'
import {
  EditorContext,
  EditorMode,
  EditorZone,
  PageMode,
  PaperDirection
} from '../../dataset/enum/Editor'
import { ElementType } from '../../dataset/enum/Element'
import { ElementStyleKey } from '../../dataset/enum/ElementStyle'
import { ListStyle, ListType } from '../../dataset/enum/List'
import { RowFlex } from '../../dataset/enum/Row'
import { TableBorder, TdBorder, TdSlash } from '../../dataset/enum/table/Table'
import { TitleLevel } from '../../dataset/enum/Title'
import { VerticalAlign } from '../../dataset/enum/VerticalAlign'
import { ICatalog } from '../../interface/Catalog'
import { DeepRequired } from '../../interface/Common'
import {
  IGetControlValueOption,
  IGetControlValueResult,
  ISetControlExtensionOption,
  ISetControlHighlightOption,
  ISetControlProperties,
  ISetControlValueOption
} from '../../interface/Control'
import {
  IAppendElementListOption,
  IDrawImagePayload,
  IDrawOption,
  IForceUpdateOption,
  IGetImageOption,
  IGetValueOption,
  IPainterOption
} from '../../interface/Draw'
import {
  IEditorData,
  IEditorHTML,
  IEditorOption,
  IEditorResult,
  IEditorText
} from '../../interface/Editor'
import { IElement, IElementStyle } from '../../interface/Element'
import { IPasteOption } from '../../interface/Event'
import { IMargin } from '../../interface/Margin'
import { IRange, RangeContext, RangeRect } from '../../interface/Range'
import { IColgroup } from '../../interface/table/Colgroup'
import { ITd } from '../../interface/table/Td'
import { ITr } from '../../interface/table/Tr'
import { ITextDecoration } from '../../interface/Text'
import {
  IGetTitleValueOption,
  IGetTitleValueResult
} from '../../interface/Title'
import { IWatermark } from '../../interface/Watermark'
import { deepClone, downloadFile, getUUID, isObjectEqual } from '../../utils'
import {
  createDomFromElementList,
  formatElementContext,
  formatElementList,
  isTextLikeElement,
  pickElementAttr,
  getElementListByHTML,
  getTextFromElementList,
  zipElementList
} from '../../utils/element'
import { printImageBase64 } from '../../utils/print'
import { Control } from '../draw/control/Control'
import { Draw } from '../draw/Draw'
import { INavigateInfo, Search } from '../draw/interactive/Search'
import { TableTool } from '../draw/particle/table/TableTool'
import { CanvasEvent } from '../event/CanvasEvent'
import { pasteByApi } from '../event/handlers/paste'
import { HistoryManager } from '../history/HistoryManager'
import { I18n } from '../i18n/I18n'
import { Position } from '../position/Position'
import { RangeManager } from '../range/RangeManager'
import { WorkerManager } from '../worker/WorkerManager'

export class CommandAdapt {
  private draw: Draw
  private range: RangeManager
  private position: Position
  private historyManager: HistoryManager
  private canvasEvent: CanvasEvent
  private tableTool: TableTool
  private options: DeepRequired<IEditorOption>
  private control: Control
  private workerManager: WorkerManager
  private searchManager: Search
  private i18n: I18n

  constructor(draw: Draw) {
    this.draw = draw
    this.range = draw.getRange()
    this.position = draw.getPosition()
    this.historyManager = draw.getHistoryManager()
    this.canvasEvent = draw.getCanvasEvent()
    this.tableTool = draw.getTableTool()
    this.options = draw.getOptions()
    this.control = draw.getControl()
    this.workerManager = draw.getWorkerManager()
    this.searchManager = draw.getSearch()
    this.i18n = draw.getI18n()
  }

  public mode(payload: EditorMode) {
    this.draw.setMode(payload)
  }

  public cut() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.canvasEvent.cut()
  }

  public copy() {
    this.canvasEvent.copy()
  }

  public paste(payload?: IPasteOption) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    pasteByApi(this.canvasEvent, payload)
  }

  public selectAll() {
    this.canvasEvent.selectAll()
  }

  public backspace() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const elementList = this.draw.getElementList()
    const { startIndex, endIndex } = this.range.getRange()
    const isCollapsed = startIndex === endIndex
    // 首字符禁止删除
    if (
      isCollapsed &&
      elementList[startIndex].value === ZERO &&
      startIndex === 0
    ) {
      return
    }
    if (!isCollapsed) {
      this.draw.spliceElementList(
        elementList,
        startIndex + 1,
        endIndex - startIndex
      )
    } else {
      this.draw.spliceElementList(elementList, startIndex, 1)
    }
    const curIndex = isCollapsed ? startIndex - 1 : startIndex
    this.range.setRange(curIndex, curIndex)
    this.draw.render({ curIndex })
  }

  public setRange(
    startIndex: number,
    endIndex: number,
    tableId?: string,
    startTdIndex?: number,
    endTdIndex?: number,
    startTrIndex?: number,
    endTrIndex?: number
  ) {
    if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) return
    this.range.setRange(
      startIndex,
      endIndex,
      tableId,
      startTdIndex,
      endTdIndex,
      startTrIndex,
      endTrIndex
    )
    const isCollapsed = startIndex === endIndex
    this.draw.render({
      curIndex: isCollapsed ? startIndex : undefined,
      isCompute: false,
      isSubmitHistory: false,
      isSetCursor: isCollapsed
    })
  }

  public replaceRange(range: IRange) {
    this.setRange(
      range.startIndex,
      range.endIndex,
      range.tableId,
      range.startTdIndex,
      range.endTdIndex,
      range.startTrIndex,
      range.endTrIndex
    )
  }

  public setPositionContext(range: IRange) {
    const { tableId, startTrIndex, startTdIndex } = range
    const elementList = this.draw.getOriginalElementList()
    if (tableId) {
      const tableElementIndex = elementList.findIndex(el => el.id === tableId)
      if (!~tableElementIndex) return
      const tableElement = elementList[tableElementIndex]
      const tr = tableElement.trList![startTrIndex!]
      const td = tr.tdList[startTdIndex!]
      this.position.setPositionContext({
        isTable: true,
        index: tableElementIndex,
        trIndex: startTrIndex,
        tdIndex: startTdIndex,
        tdId: td.id,
        trId: tr.id,
        tableId
      })
    } else {
      this.position.setPositionContext({
        isTable: false
      })
    }
  }

  public forceUpdate(options?: IForceUpdateOption) {
    const { isSubmitHistory = false } = options || {}
    this.range.clearRange()
    this.draw.render({
      isSubmitHistory,
      isSetCursor: false
    })
  }

  public blur() {
    this.range.clearRange()
    this.draw.getCursor().recoveryCursor()
  }

  public undo() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.historyManager.undo()
  }

  public redo() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.historyManager.redo()
  }

  public painter(options: IPainterOption) {
    // 如果单击且已经有样式设置则取消设置
    if (!options.isDblclick && this.draw.getPainterStyle()) {
      this.canvasEvent.clearPainterStyle()
      return
    }
    const selection = this.range.getSelection()
    if (!selection) return
    const painterStyle: IElementStyle = {}
    selection.forEach(s => {
      const painterStyleKeys = EDITOR_ELEMENT_STYLE_ATTR
      painterStyleKeys.forEach(p => {
        const key = p as keyof typeof ElementStyleKey
        if (painterStyle[key] === undefined) {
          painterStyle[key] = s[key] as any
        }
      })
    })
    this.draw.setPainterStyle(painterStyle, options)
  }

  public applyPainterStyle() {
    const isDisabled =
      this.draw.isReadonly() || this.control.getIsDisabledControl()
    if (isDisabled) return
    this.canvasEvent.applyPainterStyle()
  }

  public format() {
    const isDisabled =
      this.draw.isReadonly() || this.control.getIsDisabledControl()
    if (isDisabled) return
    const selection = this.range.getSelectionElementList()
    // 选区设置或设置换行处样式
    let renderOption: IDrawOption = {}
    let changeElementList: IElement[] = []
    if (selection?.length) {
      changeElementList = selection
      renderOption = { isSetCursor: false }
    } else {
      const { endIndex } = this.range.getRange()
      const elementList = this.draw.getElementList()
      const enterElement = elementList[endIndex]
      if (enterElement?.value === ZERO) {
        changeElementList.push(enterElement)
        renderOption = { curIndex: endIndex }
      }
    }
    if (!changeElementList.length) return
    changeElementList.forEach(el => {
      delete el.size
      delete el.font
      delete el.color
      delete el.bold
      delete el.italic
      delete el.underline
      delete el.strikeout
    })
    this.draw.render(renderOption)
  }

  public font(payload: string) {
    const isDisabled =
      this.draw.isReadonly() || this.control.getIsDisabledControl()
    if (isDisabled) return
    const selection = this.range.getSelectionElementList()
    if (selection?.length) {
      selection.forEach(el => {
        el.font = payload
      })
      this.draw.render({ isSetCursor: false })
    } else {
      const { endIndex } = this.range.getRange()
      const elementList = this.draw.getElementList()
      const enterElement = elementList[endIndex]
      if (enterElement?.value === ZERO) {
        enterElement.font = payload
        this.draw.render({ curIndex: endIndex, isCompute: false })
      }
    }
  }

  public size(payload: number) {
    const { minSize, maxSize, defaultSize } = this.options
    if (payload < minSize || payload > maxSize) return
    const isDisabled =
      this.draw.isReadonly() || this.control.getIsDisabledControl()
    if (isDisabled) return
    // 选区设置或设置换行处样式
    let renderOption: IDrawOption = {}
    let changeElementList: IElement[] = []
    const selection = this.range.getTextLikeSelectionElementList()
    if (selection?.length) {
      changeElementList = selection
      renderOption = { isSetCursor: false }
    } else {
      const { endIndex } = this.range.getRange()
      const elementList = this.draw.getElementList()
      const enterElement = elementList[endIndex]
      if (enterElement?.value === ZERO) {
        changeElementList.push(enterElement)
        renderOption = { curIndex: endIndex }
      }
    }
    if (!changeElementList.length) return
    let isExistUpdate = false
    changeElementList.forEach(el => {
      if (
        (!el.size && payload === defaultSize) ||
        (el.size && el.size === payload)
      ) {
        return
      }
      el.size = payload
      isExistUpdate = true
    })
    if (isExistUpdate) {
      this.draw.render(renderOption)
    }
  }

  public sizeAdd() {
    const isDisabled =
      this.draw.isReadonly() || this.control.getIsDisabledControl()
    if (isDisabled) return
    const selection = this.range.getTextLikeSelectionElementList()
    // 选区设置或设置换行处样式
    let renderOption: IDrawOption = {}
    let changeElementList: IElement[] = []
    if (selection?.length) {
      changeElementList = selection
      renderOption = { isSetCursor: false }
    } else {
      const { endIndex } = this.range.getRange()
      const elementList = this.draw.getElementList()
      const enterElement = elementList[endIndex]
      if (enterElement?.value === ZERO) {
        changeElementList.push(enterElement)
        renderOption = { curIndex: endIndex }
      }
    }
    if (!changeElementList.length) return
    const { defaultSize, maxSize } = this.options
    let isExistUpdate = false
    changeElementList.forEach(el => {
      if (!el.size) {
        el.size = defaultSize
      }
      if (el.size >= maxSize) return
      if (el.size + 2 > maxSize) {
        el.size = maxSize
      } else {
        el.size += 2
      }
      isExistUpdate = true
    })
    if (isExistUpdate) {
      this.draw.render(renderOption)
    }
  }

  public sizeMinus() {
    const isDisabled =
      this.draw.isReadonly() || this.control.getIsDisabledControl()
    if (isDisabled) return
    const selection = this.range.getTextLikeSelectionElementList()
    // 选区设置或设置换行处样式
    let renderOption: IDrawOption = {}
    let changeElementList: IElement[] = []
    if (selection?.length) {
      changeElementList = selection
      renderOption = { isSetCursor: false }
    } else {
      const { endIndex } = this.range.getRange()
      const elementList = this.draw.getElementList()
      const enterElement = elementList[endIndex]
      if (enterElement?.value === ZERO) {
        changeElementList.push(enterElement)
        renderOption = { curIndex: endIndex }
      }
    }
    if (!changeElementList.length) return
    const { defaultSize, minSize } = this.options
    let isExistUpdate = false
    changeElementList.forEach(el => {
      if (!el.size) {
        el.size = defaultSize
      }
      if (el.size <= minSize) return
      if (el.size - 2 < minSize) {
        el.size = minSize
      } else {
        el.size -= 2
      }
      isExistUpdate = true
    })
    if (isExistUpdate) {
      this.draw.render(renderOption)
    }
  }

  public bold() {
    const isDisabled =
      this.draw.isReadonly() || this.control.getIsDisabledControl()
    if (isDisabled) return
    const selection = this.range.getSelectionElementList()
    if (selection?.length) {
      const noBoldIndex = selection.findIndex(s => !s.bold)
      selection.forEach(el => {
        el.bold = !!~noBoldIndex
      })
      this.draw.render({ isSetCursor: false })
    } else {
      const { endIndex } = this.range.getRange()
      const elementList = this.draw.getElementList()
      const enterElement = elementList[endIndex]
      if (enterElement?.value === ZERO) {
        enterElement.bold = !enterElement.bold
        this.draw.render({ curIndex: endIndex, isCompute: false })
      }
    }
  }

  public italic() {
    const isDisabled =
      this.draw.isReadonly() || this.control.getIsDisabledControl()
    if (isDisabled) return
    const selection = this.range.getSelectionElementList()
    if (selection?.length) {
      const noItalicIndex = selection.findIndex(s => !s.italic)
      selection.forEach(el => {
        el.italic = !!~noItalicIndex
      })
      this.draw.render({ isSetCursor: false })
    } else {
      const { endIndex } = this.range.getRange()
      const elementList = this.draw.getElementList()
      const enterElement = elementList[endIndex]
      if (enterElement?.value === ZERO) {
        enterElement.italic = !enterElement.italic
        this.draw.render({ curIndex: endIndex, isCompute: false })
      }
    }
  }

  public underline(textDecoration?: ITextDecoration) {
    const isDisabled =
      this.draw.isReadonly() || this.control.getIsDisabledControl()
    if (isDisabled) return
    const selection = this.range.getSelectionElementList()
    if (selection?.length) {
      // 没有设置下划线、当前与之前有一个设置不存在、文本装饰不一致时重设下划线
      const isSetUnderline = selection.some(
        s =>
          !s.underline ||
          (!textDecoration && s.textDecoration) ||
          (textDecoration && !s.textDecoration) ||
          (textDecoration &&
            s.textDecoration &&
            !isObjectEqual(s.textDecoration, textDecoration))
      )
      selection.forEach(el => {
        el.underline = isSetUnderline
        if (isSetUnderline && textDecoration) {
          el.textDecoration = textDecoration
        } else {
          delete el.textDecoration
        }
      })
      this.draw.render({
        isSetCursor: false,
        isCompute: false
      })
    } else {
      const { endIndex } = this.range.getRange()
      const elementList = this.draw.getElementList()
      const enterElement = elementList[endIndex]
      if (enterElement?.value === ZERO) {
        enterElement.underline = !enterElement.underline
        this.draw.render({ curIndex: endIndex, isCompute: false })
      }
    }
  }

  public strikeout() {
    const isDisabled =
      this.draw.isReadonly() || this.control.getIsDisabledControl()
    if (isDisabled) return
    const selection = this.range.getSelectionElementList()
    if (selection?.length) {
      const noStrikeoutIndex = selection.findIndex(s => !s.strikeout)
      selection.forEach(el => {
        el.strikeout = !!~noStrikeoutIndex
      })
      this.draw.render({
        isSetCursor: false,
        isCompute: false
      })
    } else {
      const { endIndex } = this.range.getRange()
      const elementList = this.draw.getElementList()
      const enterElement = elementList[endIndex]
      if (enterElement?.value === ZERO) {
        enterElement.strikeout = !enterElement.strikeout
        this.draw.render({ curIndex: endIndex, isCompute: false })
      }
    }
  }

  public superscript() {
    const isDisabled =
      this.draw.isReadonly() || this.control.getIsDisabledControl()
    if (isDisabled) return
    const selection = this.range.getSelectionElementList()
    if (!selection) return
    const superscriptIndex = selection.findIndex(
      s => s.type === ElementType.SUPERSCRIPT
    )
    selection.forEach(el => {
      // 取消上标
      if (~superscriptIndex) {
        if (el.type === ElementType.SUPERSCRIPT) {
          el.type = ElementType.TEXT
          delete el.actualSize
        }
      } else {
        // 设置上标
        if (
          !el.type ||
          el.type === ElementType.TEXT ||
          el.type === ElementType.SUBSCRIPT
        ) {
          el.type = ElementType.SUPERSCRIPT
        }
      }
    })
    this.draw.render({ isSetCursor: false })
  }

  public subscript() {
    const isDisabled =
      this.draw.isReadonly() || this.control.getIsDisabledControl()
    if (isDisabled) return
    const selection = this.range.getSelectionElementList()
    if (!selection) return
    const subscriptIndex = selection.findIndex(
      s => s.type === ElementType.SUBSCRIPT
    )
    selection.forEach(el => {
      // 取消下标
      if (~subscriptIndex) {
        if (el.type === ElementType.SUBSCRIPT) {
          el.type = ElementType.TEXT
          delete el.actualSize
        }
      } else {
        // 设置下标
        if (
          !el.type ||
          el.type === ElementType.TEXT ||
          el.type === ElementType.SUPERSCRIPT
        ) {
          el.type = ElementType.SUBSCRIPT
        }
      }
    })
    this.draw.render({ isSetCursor: false })
  }

  public color(payload: string | null) {
    const isDisabled =
      this.draw.isReadonly() || this.control.getIsDisabledControl()
    if (isDisabled) return
    const selection = this.range.getSelectionElementList()
    if (selection?.length) {
      selection.forEach(el => {
        if (payload) {
          el.color = payload
        } else {
          delete el.color
        }
      })
      this.draw.render({
        isSetCursor: false,
        isCompute: false
      })
    } else {
      const { endIndex } = this.range.getRange()
      const elementList = this.draw.getElementList()
      const enterElement = elementList[endIndex]
      if (enterElement?.value === ZERO) {
        if (payload) {
          enterElement.color = payload
        } else {
          delete enterElement.color
        }
        this.draw.render({ curIndex: endIndex, isCompute: false })
      }
    }
  }

  public highlight(payload: string | null) {
    const isDisabled =
      this.draw.isReadonly() || this.control.getIsDisabledControl()
    if (isDisabled) return
    const selection = this.range.getSelectionElementList()
    if (selection?.length) {
      selection.forEach(el => {
        if (payload) {
          el.highlight = payload
        } else {
          delete el.highlight
        }
      })
      this.draw.render({
        isSetCursor: false,
        isCompute: false
      })
    } else {
      const { endIndex } = this.range.getRange()
      const elementList = this.draw.getElementList()
      const enterElement = elementList[endIndex]
      if (enterElement?.value === ZERO) {
        if (payload) {
          enterElement.highlight = payload
        } else {
          delete enterElement.highlight
        }
        this.draw.render({ curIndex: endIndex, isCompute: false })
      }
    }
  }

  public title(payload: TitleLevel | null) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    const elementList = this.draw.getElementList()
    // 需要改变的元素列表
    const changeElementList =
      startIndex === endIndex
        ? this.range.getRangeParagraphElementList()
        : elementList.slice(startIndex + 1, endIndex + 1)
    if (!changeElementList || !changeElementList.length) return
    // 设置值
    const titleId = getUUID()
    const titleOptions = this.draw.getOptions().title
    changeElementList.forEach(el => {
      if (!el.type && el.value === ZERO) return
      if (payload) {
        el.level = payload
        el.titleId = titleId
        if (isTextLikeElement(el)) {
          el.size = titleOptions[titleSizeMapping[payload]]
          el.bold = true
        }
      } else {
        if (el.titleId) {
          delete el.titleId
          delete el.level
          delete el.size
          delete el.bold
        }
      }
    })
    // 光标定位
    const isSetCursor = startIndex === endIndex
    const curIndex = isSetCursor ? endIndex : startIndex
    this.draw.render({ curIndex, isSetCursor })
  }

  public list(listType: ListType | null, listStyle?: ListStyle) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.draw.getListParticle().setList(listType, listStyle)
  }

  public rowFlex(payload: RowFlex) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    const rowElementList = this.range.getRangeRowElementList()
    if (!rowElementList) return
    rowElementList.forEach(element => {
      element.rowFlex = payload
    })
    // 光标定位
    const isSetCursor = startIndex === endIndex
    const curIndex = isSetCursor ? endIndex : startIndex
    this.draw.render({ curIndex, isSetCursor })
  }

  public rowMargin(payload: number) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    const rowElementList = this.range.getRangeRowElementList()
    if (!rowElementList) return
    rowElementList.forEach(element => {
      element.rowMargin = payload
    })
    // 光标定位
    const isSetCursor = startIndex === endIndex
    const curIndex = isSetCursor ? endIndex : startIndex
    this.draw.render({ curIndex, isSetCursor })
  }

  public insertTable(row: number, col: number) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const activeControl = this.control.getActiveControl()
    if (activeControl) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    const { defaultTrMinHeight } = this.options.table
    const elementList = this.draw.getElementList()
    let offsetX = 0
    if (elementList[startIndex]?.listId) {
      const positionList = this.position.getPositionList()
      const { rowIndex } = positionList[startIndex]
      const rowList = this.draw.getRowList()
      const row = rowList[rowIndex]
      offsetX = row?.offsetX || 0
    }
    const innerWidth = this.draw.getOriginalInnerWidth() - offsetX
    // colgroup
    const colgroup: IColgroup[] = []
    const colWidth = innerWidth / col
    for (let c = 0; c < col; c++) {
      colgroup.push({
        width: colWidth
      })
    }
    // trlist
    const trList: ITr[] = []
    for (let r = 0; r < row; r++) {
      const tdList: ITd[] = []
      const tr: ITr = {
        height: defaultTrMinHeight,
        tdList
      }
      for (let c = 0; c < col; c++) {
        tdList.push({
          colspan: 1,
          rowspan: 1,
          value: [{ value: ZERO, size: 16 }]
        })
      }
      trList.push(tr)
    }
    const element: IElement = {
      type: ElementType.TABLE,
      value: '',
      colgroup,
      trList
    }
    // 格式化element
    formatElementList([element], {
      editorOptions: this.options
    })
    formatElementContext(elementList, [element], startIndex)
    const curIndex = startIndex + 1
    this.draw.spliceElementList(
      elementList,
      curIndex,
      startIndex === endIndex ? 0 : endIndex - startIndex,
      element
    )
    this.range.setRange(curIndex, curIndex)
    this.draw.render({ curIndex, isSetCursor: false })
  }

  public insertTableTopRow() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, trIndex, tableId } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTr = curTrList[trIndex!]
    // 之前跨行的增加跨行数
    if (curTr.tdList.length < element.colgroup!.length) {
      const curTrNo = curTr.tdList[0].rowIndex!
      for (let t = 0; t < trIndex!; t++) {
        const tr = curTrList[t]
        for (let d = 0; d < tr.tdList.length; d++) {
          const td = tr.tdList[d]
          if (td.rowspan > 1 && td.rowIndex! + td.rowspan >= curTrNo + 1) {
            td.rowspan += 1
          }
        }
      }
    }
    // 增加当前行
    const newTrId = getUUID()
    const newTr: ITr = {
      height: curTr.height,
      id: newTrId,
      tdList: []
    }
    for (let t = 0; t < curTr.tdList.length; t++) {
      const curTd = curTr.tdList[t]
      const newTdId = getUUID()
      newTr.tdList.push({
        id: newTdId,
        rowspan: 1,
        colspan: curTd.colspan,
        value: [
          {
            value: ZERO,
            size: 16,
            tableId,
            trId: newTrId,
            tdId: newTdId
          }
        ]
      })
    }
    curTrList.splice(trIndex!, 0, newTr)
    // 重新设置上下文
    this.position.setPositionContext({
      isTable: true,
      index,
      trIndex,
      tdIndex: 0,
      tdId: newTr.tdList[0].id,
      trId: newTr.id,
      tableId
    })
    this.range.setRange(0, 0)
    // 重新渲染
    this.draw.render({ curIndex: 0 })
    this.tableTool.render()
  }

  public insertTableBottomRow() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, trIndex, tableId } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTr = curTrList[trIndex!]
    const anchorTr =
      curTrList.length - 1 === trIndex ? curTr : curTrList[trIndex! + 1]
    // 之前/当前行跨行的增加跨行数
    if (anchorTr.tdList.length < element.colgroup!.length) {
      const curTrNo = anchorTr.tdList[0].rowIndex!
      for (let t = 0; t < trIndex! + 1; t++) {
        const tr = curTrList[t]
        for (let d = 0; d < tr.tdList.length; d++) {
          const td = tr.tdList[d]
          if (td.rowspan > 1 && td.rowIndex! + td.rowspan >= curTrNo + 1) {
            td.rowspan += 1
          }
        }
      }
    }
    // 增加当前行
    const newTrId = getUUID()
    const newTr: ITr = {
      height: anchorTr.height,
      id: newTrId,
      tdList: []
    }
    for (let t = 0; t < anchorTr.tdList.length; t++) {
      const curTd = anchorTr.tdList[t]
      const newTdId = getUUID()
      newTr.tdList.push({
        id: newTdId,
        rowspan: 1,
        colspan: curTd.colspan,
        value: [
          {
            value: ZERO,
            size: 16,
            tableId,
            trId: newTrId,
            tdId: newTdId
          }
        ]
      })
    }
    curTrList.splice(trIndex! + 1, 0, newTr)
    // 重新设置上下文
    this.position.setPositionContext({
      isTable: true,
      index,
      trIndex: trIndex! + 1,
      tdIndex: 0,
      tdId: newTr.tdList[0].id,
      trId: newTr.id,
      tableId
    })
    this.range.setRange(0, 0)
    // 重新渲染
    this.draw.render({ curIndex: 0 })
    this.tableTool.render()
  }

  public insertTableLeftCol() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, tdIndex, tableId } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTdIndex = tdIndex!
    // 增加列
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      const tdId = getUUID()
      tr.tdList.splice(curTdIndex, 0, {
        id: tdId,
        rowspan: 1,
        colspan: 1,
        value: [
          {
            value: ZERO,
            size: 16,
            tableId,
            trId: tr.id,
            tdId
          }
        ]
      })
    }
    // 重新计算宽度
    const colgroup = element.colgroup!
    colgroup.splice(curTdIndex, 0, {
      width: this.options.table.defaultColMinWidth
    })
    const colgroupWidth = colgroup.reduce((pre, cur) => pre + cur.width, 0)
    const width = this.draw.getOriginalInnerWidth()
    if (colgroupWidth > width) {
      const adjustWidth = (colgroupWidth - width) / colgroup.length
      for (let g = 0; g < colgroup.length; g++) {
        const group = colgroup[g]
        group.width -= adjustWidth
      }
    }
    // 重新设置上下文
    this.position.setPositionContext({
      isTable: true,
      index,
      trIndex: 0,
      tdIndex: curTdIndex,
      tdId: curTrList[0].tdList[curTdIndex].id,
      trId: curTrList[0].id,
      tableId
    })
    this.range.setRange(0, 0)
    // 重新渲染
    this.draw.render({ curIndex: 0 })
    this.tableTool.render()
  }

  public insertTableRightCol() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, tdIndex, tableId } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTdIndex = tdIndex! + 1
    // 增加列
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      const tdId = getUUID()
      tr.tdList.splice(curTdIndex, 0, {
        id: tdId,
        rowspan: 1,
        colspan: 1,
        value: [
          {
            value: ZERO,
            size: 16,
            tableId,
            trId: tr.id,
            tdId
          }
        ]
      })
    }
    // 重新计算宽度
    const colgroup = element.colgroup!
    colgroup.splice(curTdIndex, 0, {
      width: this.options.table.defaultColMinWidth
    })
    const colgroupWidth = colgroup.reduce((pre, cur) => pre + cur.width, 0)
    const width = this.draw.getOriginalInnerWidth()
    if (colgroupWidth > width) {
      const adjustWidth = (colgroupWidth - width) / colgroup.length
      for (let g = 0; g < colgroup.length; g++) {
        const group = colgroup[g]
        group.width -= adjustWidth
      }
    }
    // 重新设置上下文
    this.position.setPositionContext({
      isTable: true,
      index,
      trIndex: 0,
      tdIndex: curTdIndex,
      tdId: curTrList[0].tdList[curTdIndex].id,
      trId: curTrList[0].id,
      tableId
    })
    this.range.setRange(0, 0)
    // 重新渲染
    this.draw.render({ curIndex: 0 })
    this.tableTool.render()
  }

  public deleteTableRow() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, trIndex, tdIndex } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const trList = element.trList!
    const curTr = trList[trIndex!]
    const curTdRowIndex = curTr.tdList[tdIndex!].rowIndex!
    // 如果是最后一行，直接删除整个表格
    if (trList.length <= 1) {
      this.deleteTable()
      return
    }
    // 之前行缩小rowspan
    for (let r = 0; r < curTdRowIndex; r++) {
      const tr = trList[r]
      const tdList = tr.tdList
      for (let d = 0; d < tdList.length; d++) {
        const td = tdList[d]
        if (td.rowIndex! + td.rowspan > curTdRowIndex) {
          td.rowspan--
        }
      }
    }
    // 补跨行
    for (let d = 0; d < curTr.tdList.length; d++) {
      const td = curTr.tdList[d]
      if (td.rowspan > 1) {
        const tdId = getUUID()
        const nextTr = trList[trIndex! + 1]
        nextTr.tdList.splice(d, 0, {
          id: tdId,
          rowspan: td.rowspan - 1,
          colspan: td.colspan,
          value: [
            {
              value: ZERO,
              size: 16,
              tableId: element.id,
              trId: nextTr.id,
              tdId
            }
          ]
        })
      }
    }
    // 删除当前行
    trList.splice(trIndex!, 1)
    // 重新设置上下文
    this.position.setPositionContext({
      isTable: false
    })
    this.range.clearRange()
    // 重新渲染
    this.draw.render({
      curIndex: positionContext.index
    })
    this.tableTool.dispose()
  }

  public deleteTableCol() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, tdIndex, trIndex } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTd = curTrList[trIndex!].tdList[tdIndex!]
    const curColIndex = curTd.colIndex!
    // 如果是最后一列，直接删除整个表格
    const moreTdTr = curTrList.find(tr => tr.tdList.length > 1)
    if (!moreTdTr) {
      this.deleteTable()
      return
    }
    // 跨列处理
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        if (td.colspan > 1) {
          const tdColIndex = td.colIndex!
          // 交叉减去一列
          if (
            tdColIndex <= curColIndex &&
            tdColIndex + td.colspan - 1 >= curColIndex
          ) {
            td.colspan -= 1
          }
        }
      }
    }
    // 删除当前列
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      let start = -1
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        if (td.colIndex === curColIndex) {
          start = d
        }
      }
      if (~start) {
        tr.tdList.splice(start, 1)
      }
    }
    element.colgroup?.splice(curColIndex, 1)
    // 重新设置上下文
    this.position.setPositionContext({
      isTable: false
    })
    this.range.setRange(0, 0)
    // 重新渲染
    this.draw.render({
      curIndex: positionContext.index
    })
    this.tableTool.dispose()
  }

  public deleteTable() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const originalElementList = this.draw.getOriginalElementList()
    originalElementList.splice(positionContext.index!, 1)
    const curIndex = positionContext.index! - 1
    this.position.setPositionContext({
      isTable: false,
      index: curIndex
    })
    this.range.setRange(curIndex, curIndex)
    this.draw.render({ curIndex })
    this.tableTool.dispose()
  }

  public mergeTableCell() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const {
      isCrossRowCol,
      startTdIndex,
      endTdIndex,
      startTrIndex,
      endTrIndex
    } = this.range.getRange()
    if (!isCrossRowCol) return
    const { index } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    let startTd = curTrList[startTrIndex!].tdList[startTdIndex!]
    let endTd = curTrList[endTrIndex!].tdList[endTdIndex!]
    // 交换起始位置
    if (startTd.x! > endTd.x! || startTd.y! > endTd.y!) {
      // prettier-ignore
      [startTd, endTd] = [endTd, startTd]
    }
    const startColIndex = startTd.colIndex!
    const endColIndex = endTd.colIndex! + (endTd.colspan - 1)
    const startRowIndex = startTd.rowIndex!
    const endRowIndex = endTd.rowIndex! + (endTd.rowspan - 1)
    // 选区行列
    const rowCol: ITd[][] = []
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      const tdList: ITd[] = []
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        const tdColIndex = td.colIndex!
        const tdRowIndex = td.rowIndex!
        if (
          tdColIndex >= startColIndex &&
          tdColIndex <= endColIndex &&
          tdRowIndex >= startRowIndex &&
          tdRowIndex <= endRowIndex
        ) {
          tdList.push(td)
        }
      }
      if (tdList.length) {
        rowCol.push(tdList)
      }
    }
    if (!rowCol.length) return
    // 是否是矩形
    const lastRow = rowCol[rowCol.length - 1]
    const leftTop = rowCol[0][0]
    const rightBottom = lastRow[lastRow.length - 1]
    const startX = leftTop.x!
    const startY = leftTop.y!
    const endX = rightBottom.x! + rightBottom.width!
    const endY = rightBottom.y! + rightBottom.height!
    for (let t = 0; t < rowCol.length; t++) {
      const tr = rowCol[t]
      for (let d = 0; d < tr.length; d++) {
        const td = tr[d]
        const tdStartX = td.x!
        const tdStartY = td.y!
        const tdEndX = tdStartX + td.width!
        const tdEndY = tdStartY + td.height!
        // 存在不符合项
        if (
          startX > tdStartX ||
          startY > tdStartY ||
          endX < tdEndX ||
          endY < tdEndY
        ) {
          return
        }
      }
    }
    // 合并单元格
    const mergeTdIdList: string[] = []
    const anchorTd = rowCol[0][0]
    for (let t = 0; t < rowCol.length; t++) {
      const tr = rowCol[t]
      for (let d = 0; d < tr.length; d++) {
        const td = tr[d]
        const isAnchorTd = t === 0 && d === 0
        // 待删除单元id
        if (!isAnchorTd) {
          mergeTdIdList.push(td.id!)
        }
        // 列合并
        if (t === 0 && d !== 0) {
          anchorTd.colspan += td.colspan
        }
        // 行合并
        if (t !== 0) {
          if (anchorTd.colIndex === td.colIndex) {
            anchorTd.rowspan += td.rowspan
          }
        }
      }
    }
    // 移除多余单元格
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      let d = 0
      while (d < tr.tdList.length) {
        const td = tr.tdList[d]
        if (mergeTdIdList.includes(td.id!)) {
          tr.tdList.splice(d, 1)
          d--
        }
        d++
      }
    }
    // 重新渲染
    const curIndex = startTd.value.length - 1
    this.range.setRange(curIndex, curIndex)
    this.draw.render()
    this.tableTool.render()
  }

  public cancelMergeTableCell() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index, tdIndex, trIndex } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    const curTr = curTrList[trIndex!]!
    const curTd = curTr.tdList[tdIndex!]
    if (curTd.rowspan === 1 && curTd.colspan === 1) return
    const colspan = curTd.colspan
    // 设置跨列
    if (curTd.colspan > 1) {
      for (let c = 1; c < curTd.colspan; c++) {
        const tdId = getUUID()
        curTr.tdList.splice(tdIndex! + c, 0, {
          id: tdId,
          rowspan: 1,
          colspan: 1,
          value: [
            {
              value: ZERO,
              size: 16,
              tableId: element.id,
              trId: curTr.id,
              tdId
            }
          ]
        })
      }
      curTd.colspan = 1
    }
    // 设置跨行
    if (curTd.rowspan > 1) {
      for (let r = 1; r < curTd.rowspan; r++) {
        const tr = curTrList[trIndex! + r]
        for (let c = 0; c < colspan; c++) {
          const tdId = getUUID()
          tr.tdList.splice(curTd.colIndex!, 0, {
            id: tdId,
            rowspan: 1,
            colspan: 1,
            value: [
              {
                value: ZERO,
                size: 16,
                tableId: element.id,
                trId: tr.id,
                tdId
              }
            ]
          })
        }
      }
      curTd.rowspan = 1
    }
    // 重新渲染
    const curIndex = curTd.value.length - 1
    this.range.setRange(curIndex, curIndex)
    this.draw.render()
    this.tableTool.render()
  }

  public tableTdVerticalAlign(payload: VerticalAlign) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const rowCol = this.draw.getTableParticle().getRangeRowCol()
    if (!rowCol) return
    for (let r = 0; r < rowCol.length; r++) {
      const row = rowCol[r]
      for (let c = 0; c < row.length; c++) {
        const td = row[c]
        if (
          !td ||
          td.verticalAlign === payload ||
          (!td.verticalAlign && payload === VerticalAlign.TOP)
        ) {
          continue
        }
        // 重设垂直对齐方式
        td.verticalAlign = payload
      }
    }
    const { endIndex } = this.range.getRange()
    this.draw.render({
      curIndex: endIndex
    })
  }

  public tableBorderType(payload: TableBorder) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return
    const { index } = positionContext
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    if (
      (!element.borderType && payload === TableBorder.ALL) ||
      element.borderType === payload
    ) {
      return
    }
    element.borderType = payload
    const { endIndex } = this.range.getRange()
    this.draw.render({
      curIndex: endIndex
    })
  }

  public tableTdBorderType(payload: TdBorder) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const rowCol = this.draw.getTableParticle().getRangeRowCol()
    if (!rowCol) return
    const tdList = rowCol.flat()
    // 存在则设置边框类型，否则取消设置
    const isSetBorderType = tdList.some(
      td => !td.borderTypes?.includes(payload)
    )
    tdList.forEach(td => {
      if (!td.borderTypes) {
        td.borderTypes = []
      }
      const borderTypeIndex = td.borderTypes.findIndex(type => type === payload)
      if (isSetBorderType) {
        if (!~borderTypeIndex) {
          td.borderTypes.push(payload)
        }
      } else {
        if (~borderTypeIndex) {
          td.borderTypes.splice(borderTypeIndex, 1)
        }
      }
      // 不存在边框设置时删除字段
      if (!td.borderTypes.length) {
        delete td.borderTypes
      }
    })
    const { endIndex } = this.range.getRange()
    this.draw.render({
      curIndex: endIndex
    })
  }

  public tableTdSlashType(payload: TdSlash) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const rowCol = this.draw.getTableParticle().getRangeRowCol()
    if (!rowCol) return
    const tdList = rowCol.flat()
    // 存在则设置单元格斜线类型，否则取消设置
    const isSetTdSlashType = tdList.some(
      td => !td.slashTypes?.includes(payload)
    )
    tdList.forEach(td => {
      if (!td.slashTypes) {
        td.slashTypes = []
      }
      const slashTypeIndex = td.slashTypes.findIndex(type => type === payload)
      if (isSetTdSlashType) {
        if (!~slashTypeIndex) {
          td.slashTypes.push(payload)
        }
      } else {
        if (~slashTypeIndex) {
          td.slashTypes.splice(slashTypeIndex, 1)
        }
      }
      // 不存在斜线设置时删除字段
      if (!td.slashTypes.length) {
        delete td.slashTypes
      }
    })
    const { endIndex } = this.range.getRange()
    this.draw.render({
      curIndex: endIndex
    })
  }

  public tableTdBackgroundColor(payload: string) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const rowCol = this.draw.getTableParticle().getRangeRowCol()
    if (!rowCol) return
    for (let r = 0; r < rowCol.length; r++) {
      const row = rowCol[r]
      for (let c = 0; c < row.length; c++) {
        const col = row[c]
        col.backgroundColor = payload
      }
    }
    const { endIndex } = this.range.getRange()
    this.range.setRange(endIndex, endIndex)
    this.draw.render({
      isCompute: false
    })
  }

  public tableSelectAll() {
    const positionContext = this.position.getPositionContext()
    const { index, tableId, isTable } = positionContext
    if (!isTable || !tableId) return
    const { startIndex, endIndex } = this.range.getRange()
    const originalElementList = this.draw.getOriginalElementList()
    const trList = originalElementList[index!].trList!
    // 最后单元格位置
    const endTrIndex = trList.length - 1
    const endTdIndex = trList[endTrIndex].tdList.length - 1
    this.range.replaceRange({
      startIndex,
      endIndex,
      tableId,
      startTdIndex: 0,
      endTdIndex,
      startTrIndex: 0,
      endTrIndex
    })
    this.draw.render({
      isCompute: false,
      isSubmitHistory: false
    })
  }

  public hyperlink(payload: IElement) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const activeControl = this.control.getActiveControl()
    if (activeControl) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    const elementList = this.draw.getElementList()
    const { valueList, url } = payload
    const hyperlinkId = getUUID()
    const newElementList = valueList?.map<IElement>(v => ({
      url,
      hyperlinkId,
      value: v.value,
      type: ElementType.HYPERLINK
    }))
    if (!newElementList) return
    const start = startIndex + 1
    formatElementContext(elementList, newElementList, startIndex)
    this.draw.spliceElementList(
      elementList,
      start,
      startIndex === endIndex ? 0 : endIndex - startIndex,
      ...newElementList
    )
    const curIndex = start + newElementList.length - 1
    this.range.setRange(curIndex, curIndex)
    this.draw.render({ curIndex })
  }

  public getHyperlinkRange(): [number, number] | null {
    let leftIndex = -1
    let rightIndex = -1
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return null
    const elementList = this.draw.getElementList()
    const startElement = elementList[startIndex]
    if (startElement.type !== ElementType.HYPERLINK) return null
    // 向左查找
    let preIndex = startIndex
    while (preIndex > 0) {
      const preElement = elementList[preIndex]
      if (preElement.hyperlinkId !== startElement.hyperlinkId) {
        leftIndex = preIndex + 1
        break
      }
      preIndex--
    }
    // 向右查找
    let nextIndex = startIndex + 1
    while (nextIndex < elementList.length) {
      const nextElement = elementList[nextIndex]
      if (nextElement.hyperlinkId !== startElement.hyperlinkId) {
        rightIndex = nextIndex - 1
        break
      }
      nextIndex++
    }
    // 控件在最后
    if (nextIndex === elementList.length) {
      rightIndex = nextIndex - 1
    }
    if (!~leftIndex || !~rightIndex) return null
    return [leftIndex, rightIndex]
  }

  public deleteHyperlink() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    // 获取超链接索引
    const hyperRange = this.getHyperlinkRange()
    if (!hyperRange) return
    const elementList = this.draw.getElementList()
    const [leftIndex, rightIndex] = hyperRange
    // 删除元素
    this.draw.spliceElementList(
      elementList,
      leftIndex,
      rightIndex - leftIndex + 1
    )
    this.draw.getHyperlinkParticle().clearHyperlinkPopup()
    // 重置画布
    const newIndex = leftIndex - 1
    this.range.setRange(newIndex, newIndex)
    this.draw.render({
      curIndex: newIndex
    })
  }

  public cancelHyperlink() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    // 获取超链接索引
    const hyperRange = this.getHyperlinkRange()
    if (!hyperRange) return
    const elementList = this.draw.getElementList()
    const [leftIndex, rightIndex] = hyperRange
    // 删除属性
    for (let i = leftIndex; i <= rightIndex; i++) {
      const element = elementList[i]
      delete element.type
      delete element.url
      delete element.hyperlinkId
      delete element.underline
    }
    this.draw.getHyperlinkParticle().clearHyperlinkPopup()
    // 重置画布
    const { endIndex } = this.range.getRange()
    this.draw.render({
      curIndex: endIndex,
      isCompute: false
    })
  }

  public editHyperlink(payload: string) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    // 获取超链接索引
    const hyperRange = this.getHyperlinkRange()
    if (!hyperRange) return
    const elementList = this.draw.getElementList()
    const [leftIndex, rightIndex] = hyperRange
    // 替换url
    for (let i = leftIndex; i <= rightIndex; i++) {
      const element = elementList[i]
      element.url = payload
    }
    this.draw.getHyperlinkParticle().clearHyperlinkPopup()
    // 重置画布
    const { endIndex } = this.range.getRange()
    this.draw.render({
      curIndex: endIndex,
      isCompute: false
    })
  }

  public separator(payload: number[]) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const activeControl = this.control.getActiveControl()
    if (activeControl) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    const elementList = this.draw.getElementList()
    let curIndex = -1
    // 光标存在分割线，则判断为修改线段逻辑
    const endElement = elementList[endIndex + 1]
    if (endElement && endElement.type === ElementType.SEPARATOR) {
      if (
        endElement.dashArray &&
        endElement.dashArray.join() === payload.join()
      ) {
        return
      }
      curIndex = endIndex
      endElement.dashArray = payload
    } else {
      const newElement: IElement = {
        value: WRAP,
        type: ElementType.SEPARATOR,
        dashArray: payload
      }
      // 从行头增加分割线
      formatElementContext(elementList, [newElement], startIndex)
      if (startIndex !== 0 && elementList[startIndex].value === ZERO) {
        this.draw.spliceElementList(elementList, startIndex, 1, newElement)
        curIndex = startIndex - 1
      } else {
        this.draw.spliceElementList(elementList, startIndex + 1, 0, newElement)
        curIndex = startIndex
      }
    }
    this.range.setRange(curIndex, curIndex)
    this.draw.render({ curIndex })
  }

  public pageBreak() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const activeControl = this.control.getActiveControl()
    if (activeControl) return
    this.insertElementList([
      {
        type: ElementType.PAGE_BREAK,
        value: WRAP
      }
    ])
  }

  public addWatermark(payload: IWatermark) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const options = this.draw.getOptions()
    const { color, size, opacity, font } = defaultWatermarkOption
    options.watermark.data = payload.data
    options.watermark.color = payload.color || color
    options.watermark.size = payload.size || size
    options.watermark.opacity = payload.opacity || opacity
    options.watermark.font = payload.font || font
    this.draw.render({
      isSetCursor: false,
      isSubmitHistory: false,
      isCompute: false
    })
  }

  public deleteWatermark() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const options = this.draw.getOptions()
    if (options.watermark && options.watermark.data) {
      options.watermark = { ...defaultWatermarkOption }
      this.draw.render({
        isSetCursor: false,
        isSubmitHistory: false,
        isCompute: false
      })
    }
  }

  public image(payload: IDrawImagePayload) {
    const isDisabled =
      this.draw.isReadonly() || this.control.getIsDisabledControl()
    if (isDisabled) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    const { value, width, height } = payload
    this.insertElementList([
      {
        value,
        width,
        height,
        id: getUUID(),
        type: ElementType.IMAGE
      }
    ])
  }

  public search(payload: string | null) {
    this.searchManager.setSearchKeyword(payload)
    this.draw.render({
      isSetCursor: false,
      isSubmitHistory: false
    })
  }

  public searchNavigatePre() {
    const index = this.searchManager.searchNavigatePre()
    if (index === null) return
    this.draw.render({
      isSetCursor: false,
      isSubmitHistory: false,
      isCompute: false,
      isLazy: false
    })
  }

  public searchNavigateNext() {
    const index = this.searchManager.searchNavigateNext()
    if (index === null) return
    this.draw.render({
      isSetCursor: false,
      isSubmitHistory: false,
      isCompute: false,
      isLazy: false
    })
  }

  public getSearchNavigateInfo(): null | INavigateInfo {
    return this.searchManager.getSearchNavigateInfo()
  }

  public replace(payload: string) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    if (!payload || new RegExp(`${ZERO}`, 'g').test(payload)) return
    const matchList = this.draw.getSearch().getSearchMatchList()
    if (!matchList.length) return
    // 匹配index变化的差值
    let pageDiffCount = 0
    let tableDiffCount = 0
    // 匹配搜索词的组标识
    let curGroupId = ''
    // 表格上下文
    let curTdId = ''
    // 搜索值 > 替换值：增加元素；搜索值 < 替换值：减少元素
    let firstMatchIndex = -1
    const elementList = this.draw.getOriginalElementList()
    for (let m = 0; m < matchList.length; m++) {
      const match = matchList[m]
      if (match.type === EditorContext.TABLE) {
        const { tableIndex, trIndex, tdIndex, index, tdId } = match
        if (curTdId && tdId !== curTdId) {
          tableDiffCount = 0
        }
        curTdId = tdId!
        const curTableIndex = tableIndex! + pageDiffCount
        const tableElementList =
          elementList[curTableIndex].trList![trIndex!].tdList[tdIndex!].value
        // 表格内元素
        const curIndex = index + tableDiffCount
        const tableElement = tableElementList[curIndex]
        if (curGroupId === match.groupId) {
          this.draw.spliceElementList(tableElementList, curIndex, 1)
          tableDiffCount--
          continue
        }
        for (let p = 0; p < payload.length; p++) {
          const value = payload[p]
          if (p === 0) {
            tableElement.value = value
          } else {
            this.draw.spliceElementList(tableElementList, curIndex + p, 0, {
              ...tableElement,
              value
            })
            tableDiffCount++
          }
        }
      } else {
        const curIndex = match.index + pageDiffCount
        const element = elementList[curIndex]
        if (
          element.type === ElementType.CONTROL &&
          element.controlComponent !== ControlComponent.VALUE
        ) {
          continue
        }
        if (!~firstMatchIndex) {
          firstMatchIndex = m
        }
        if (curGroupId === match.groupId) {
          this.draw.spliceElementList(elementList, curIndex, 1)
          pageDiffCount--
          continue
        }
        for (let p = 0; p < payload.length; p++) {
          const value = payload[p]
          if (p === 0) {
            element.value = value
          } else {
            this.draw.spliceElementList(elementList, curIndex + p, 0, {
              ...element,
              value
            })
            pageDiffCount++
          }
        }
      }
      curGroupId = match.groupId
    }
    if (!~firstMatchIndex) return
    // 定位-首个被匹配关键词后
    const firstMatch = matchList[firstMatchIndex]
    const firstIndex = firstMatch.index + (payload.length - 1)
    if (firstMatch.type === EditorContext.TABLE) {
      const { tableIndex, trIndex, tdIndex, index } = firstMatch
      const element =
        elementList[tableIndex!].trList![trIndex!].tdList[tdIndex!].value[index]
      this.position.setPositionContext({
        isTable: true,
        index: tableIndex,
        trIndex,
        tdIndex,
        tdId: element.tdId,
        trId: element.trId,
        tableId: element.tableId
      })
    } else {
      this.position.setPositionContext({
        isTable: false
      })
    }
    this.range.setRange(firstIndex, firstIndex)
    // 重新渲染
    this.draw.render({
      curIndex: firstIndex
    })
  }

  public async print() {
    const { scale, printPixelRatio, paperDirection } = this.options
    if (scale !== 1) {
      this.draw.setPageScale(1)
    }
    const width = this.draw.getOriginalWidth()
    const height = this.draw.getOriginalHeight()
    const base64List = await this.draw.getDataURL({
      pixelRatio: printPixelRatio,
      mode: EditorMode.PRINT
    })
    printImageBase64(base64List, {
      width,
      height,
      direction: paperDirection
    })
    if (scale !== 1) {
      this.draw.setPageScale(scale)
    }
  }

  public replaceImageElement(payload: string) {
    const { startIndex } = this.range.getRange()
    const elementList = this.draw.getElementList()
    const element = elementList[startIndex]
    if (!element || element.type !== ElementType.IMAGE) return
    // 替换图片
    element.id = getUUID()
    element.value = payload
    this.draw.render({
      isSetCursor: false
    })
  }

  public saveAsImageElement() {
    const { startIndex } = this.range.getRange()
    const elementList = this.draw.getElementList()
    const element = elementList[startIndex]
    if (!element || element.type !== ElementType.IMAGE) return
    downloadFile(element.value, `${element.id!}.png`)
  }

  public changeImageDisplay(element: IElement, display: ImageDisplay) {
    if (element.imgDisplay === display) return
    element.imgDisplay = display
    if (
      display === ImageDisplay.FLOAT_TOP ||
      display === ImageDisplay.FLOAT_BOTTOM
    ) {
      const positionList = this.position.getPositionList()
      const { startIndex } = this.range.getRange()
      const {
        coordinate: { leftTop }
      } = positionList[startIndex]
      element.imgFloatPosition = {
        x: leftTop[0],
        y: leftTop[1]
      }
    } else {
      delete element.imgFloatPosition
    }
    this.draw.getPreviewer().clearResizer()
    this.draw.render({
      isSetCursor: false
    })
  }

  public getImage(payload?: IGetImageOption): Promise<string[]> {
    return this.draw.getDataURL(payload)
  }

  public getOptions(): DeepRequired<IEditorOption> {
    return this.options
  }

  public getValue(options?: IGetValueOption): IEditorResult {
    return this.draw.getValue(options)
  }

  public getHTML(): IEditorHTML {
    const options = this.options
    const headerElementList = this.draw.getHeaderElementList()
    const mainElementList = this.draw.getOriginalMainElementList()
    const footerElementList = this.draw.getFooterElementList()
    return {
      header: createDomFromElementList(headerElementList, options).innerHTML,
      main: createDomFromElementList(mainElementList, options).innerHTML,
      footer: createDomFromElementList(footerElementList, options).innerHTML
    }
  }

  public getText(): IEditorText {
    const headerElementList = this.draw.getHeaderElementList()
    const mainElementList = this.draw.getOriginalMainElementList()
    const footerElementList = this.draw.getFooterElementList()
    return {
      header: getTextFromElementList(headerElementList),
      main: getTextFromElementList(mainElementList),
      footer: getTextFromElementList(footerElementList)
    }
  }

  public getWordCount(): Promise<number> {
    return this.workerManager.getWordCount()
  }

  public getRange(): IRange {
    return deepClone(this.range.getRange())
  }

  public getRangeText(): string {
    return this.range.toString()
  }

  public getRangeContext(): RangeContext | null {
    const range = this.range.getRange()
    const { startIndex, endIndex } = range
    if (!~startIndex && !~endIndex) return null
    // 选区信息
    const isCollapsed = startIndex === endIndex
    // 元素信息
    const elementList = this.draw.getElementList()
    const startElement = pickElementAttr(
      elementList[isCollapsed ? startIndex : startIndex + 1]
    )
    const endElement = pickElementAttr(elementList[endIndex])
    // 页码信息
    const positionList = this.position.getPositionList()
    const startPageNo = positionList[startIndex].pageNo
    const endPageNo = positionList[endIndex].pageNo
    // 坐标信息（相对编辑器书写区）
    const rangeRects: RangeRect[] = []
    const height = this.draw.getOriginalHeight()
    const pageGap = this.draw.getOriginalPageGap()
    const selectionPositionList = this.position.getSelectionPositionList()
    if (selectionPositionList) {
      // 起始信息及x坐标
      let currentRowNo: number | null = null
      let currentX = 0
      let rangeRect: RangeRect | null = null
      for (let p = 0; p < selectionPositionList.length; p++) {
        const {
          rowNo,
          pageNo,
          coordinate: { leftTop, rightTop },
          lineHeight
        } = selectionPositionList[p]
        // 起始行变化追加选区信息
        if (currentRowNo === null || currentRowNo !== rowNo) {
          if (rangeRect) {
            rangeRects.push(rangeRect)
          }
          rangeRect = {
            x: leftTop[0],
            y: leftTop[1] + pageNo * (height + pageGap),
            width: rightTop[0] - leftTop[0],
            height: lineHeight
          }
          currentRowNo = rowNo
          currentX = leftTop[0]
        } else {
          rangeRect!.width = rightTop[0] - currentX
        }
        // 最后一个元素结束追加选区信息
        if (p === selectionPositionList.length - 1 && rangeRect) {
          rangeRects.push(rangeRect)
        }
      }
    } else {
      const positionList = this.position.getPositionList()
      const position = positionList[endIndex]
      const {
        coordinate: { rightTop },
        pageNo,
        lineHeight
      } = position
      rangeRects.push({
        x: rightTop[0],
        y: rightTop[1] + pageNo * (height + pageGap),
        width: 0,
        height: lineHeight
      })
    }
    // 区域信息
    const zone = this.draw.getZone().getZone()
    // 表格信息
    const isTable = this.position.getPositionContext().isTable
    return deepClone({
      isCollapsed,
      startElement,
      endElement,
      startPageNo,
      endPageNo,
      rangeRects,
      zone,
      isTable
    })
  }

  public getRangeRow(): IElement[] | null {
    const rowElementList = this.range.getRangeRowElementList()
    return rowElementList ? zipElementList(rowElementList) : null
  }

  public getRangeParagraph(): IElement[] | null {
    const paragraphElementList = this.range.getRangeParagraphElementList()
    return paragraphElementList ? zipElementList(paragraphElementList) : null
  }

  public getKeywordRangeList(payload: string): IRange[] {
    return this.range.getKeywordRangeList(payload)
  }

  public pageMode(payload: PageMode) {
    this.draw.setPageMode(payload)
  }

  public pageScaleRecovery() {
    const { scale } = this.options
    if (scale !== 1) {
      this.draw.setPageScale(1)
    }
  }

  public pageScaleMinus() {
    const { scale } = this.options
    const nextScale = scale * 10 - 1
    if (nextScale >= 5) {
      this.draw.setPageScale(nextScale / 10)
    }
  }

  public pageScaleAdd() {
    const { scale } = this.options
    const nextScale = scale * 10 + 1
    if (nextScale <= 30) {
      this.draw.setPageScale(nextScale / 10)
    }
  }

  public paperSize(width: number, height: number) {
    this.draw.setPaperSize(width, height)
  }

  public paperDirection(payload: PaperDirection) {
    this.draw.setPaperDirection(payload)
  }

  public getPaperMargin(): number[] {
    return this.options.margins
  }

  public setPaperMargin(payload: IMargin) {
    return this.draw.setPaperMargin(payload)
  }

  public insertElementList(payload: IElement[]) {
    if (!payload.length) return
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const cloneElementList = deepClone(payload)
    // 格式化上下文信息
    const { startIndex } = this.range.getRange()
    const elementList = this.draw.getElementList()
    formatElementContext(elementList, cloneElementList, startIndex)
    this.draw.insertElementList(cloneElementList)
  }

  public appendElementList(
    elementList: IElement[],
    options?: IAppendElementListOption
  ) {
    if (!elementList.length) return
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.draw.appendElementList(deepClone(elementList), options)
  }

  public setValue(payload: Partial<IEditorData>) {
    this.draw.setValue(payload)
  }

  public removeControl() {
    const { startIndex, endIndex } = this.range.getRange()
    if (startIndex !== endIndex) return
    const elementList = this.draw.getElementList()
    const element = elementList[startIndex]
    if (!element.controlId) return
    // 删除控件
    const control = this.draw.getControl()
    const newIndex = control.removeControl(startIndex)
    if (newIndex === null) return
    // 重新渲染
    this.range.setRange(newIndex, newIndex)
    this.draw.render({
      curIndex: newIndex
    })
  }

  public setLocale(payload: string) {
    this.i18n.setLocale(payload)
  }

  public getLocale(): string {
    return this.i18n.getLocale()
  }

  public getCatalog(): Promise<ICatalog | null> {
    return this.workerManager.getCatalog()
  }

  public locationCatalog(titleId: string) {
    const elementList = this.draw.getMainElementList()
    let newIndex = -1
    for (let e = 0; e < elementList.length; e++) {
      const element = elementList[e]
      if (
        element.titleId === titleId &&
        elementList[e + 1]?.titleId !== titleId
      ) {
        newIndex = e
        break
      }
    }
    if (!~newIndex) return
    this.range.setRange(newIndex, newIndex)
    this.draw.render({
      curIndex: newIndex,
      isCompute: false,
      isSubmitHistory: false
    })
  }

  public wordTool() {
    const elementList = this.draw.getMainElementList()
    let isApply = false
    for (let i = 0; i < elementList.length; i++) {
      const element = elementList[i]
      // 删除空行、行首空格
      if (element.value === ZERO) {
        while (i + 1 < elementList.length) {
          const nextElement = elementList[i + 1]
          if (nextElement.value !== ZERO && nextElement.value !== NBSP) break
          elementList.splice(i + 1, 1)
          isApply = true
        }
      }
    }
    if (!isApply) {
      // 避免输入框光标丢失
      const isCollapsed = this.range.getIsCollapsed()
      this.draw.getCursor().drawCursor({
        isShow: isCollapsed
      })
    } else {
      this.draw.render({
        isSetCursor: false
      })
    }
  }

  public setHTML(payload: Partial<IEditorHTML>) {
    const { header, main, footer } = payload
    const innerWidth = this.draw.getOriginalInnerWidth()
    // 不设置值时数据为undefined，避免覆盖当前数据
    const getElementList = (htmlText?: string) =>
      htmlText !== undefined
        ? getElementListByHTML(htmlText, {
            innerWidth
          })
        : undefined
    this.setValue({
      header: getElementList(header),
      main: getElementList(main),
      footer: getElementList(footer)
    })
  }

  public setGroup(): string | null {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return null
    return this.draw.getGroup().setGroup()
  }

  public deleteGroup(groupId: string) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.draw.getGroup().deleteGroup(groupId)
  }

  public getGroupIds(): Promise<string[]> {
    return this.draw.getWorkerManager().getGroupIds()
  }

  public locationGroup(groupId: string) {
    const elementList = this.draw.getOriginalMainElementList()
    const context = this.draw
      .getGroup()
      .getContextByGroupId(elementList, groupId)
    if (!context) return
    const { isTable, index, trIndex, tdIndex, tdId, trId, tableId, endIndex } =
      context
    this.position.setPositionContext({
      isTable,
      index,
      trIndex,
      tdIndex,
      tdId,
      trId,
      tableId
    })
    this.range.setRange(endIndex, endIndex)
    this.draw.render({
      curIndex: endIndex,
      isCompute: false,
      isSubmitHistory: false
    })
  }

  public setZone(zone: EditorZone) {
    this.draw.getZone().setZone(zone)
  }

  public getControlValue(
    payload: IGetControlValueOption
  ): IGetControlValueResult | null {
    return this.draw.getControl().getValueByConceptId(payload)
  }

  public setControlValue(payload: ISetControlValueOption) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.draw.getControl().setValueByConceptId(payload)
  }

  public setControlExtension(payload: ISetControlExtensionOption) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.draw.getControl().setExtensionByConceptId(payload)
  }

  public setControlProperties(payload: ISetControlProperties) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.draw.getControl().setPropertiesByConceptId(payload)
  }

  public setControlHighlight(payload: ISetControlHighlightOption) {
    this.draw.getControl().setHighlightList(payload)
  }

  public getControlList(): IElement[] {
    return this.draw.getControl().getList()
  }

  public getContainer(): HTMLDivElement {
    return this.draw.getContainer()
  }

  public getTitleValue(
    payload: IGetTitleValueOption
  ): IGetTitleValueResult | null {
    const { conceptId } = payload
    const result: IGetTitleValueResult = []
    const getValue = (elementList: IElement[], zone: EditorZone) => {
      let i = 0
      while (i < elementList.length) {
        const element = elementList[i]
        i++
        if (element.type === ElementType.TABLE) {
          const trList = element.trList!
          for (let r = 0; r < trList.length; r++) {
            const tr = trList[r]
            for (let d = 0; d < tr.tdList.length; d++) {
              const td = tr.tdList[d]
              getValue(td.value, zone)
            }
          }
        }
        if (element?.title?.conceptId !== conceptId) continue
        // 先查找到标题，后循环至同级或上级标题处停止
        const valueList: IElement[] = []
        let j = i
        while (j < elementList.length) {
          const nextElement = elementList[j]
          j++
          if (element.titleId === nextElement.titleId) continue
          if (
            nextElement.level &&
            titleOrderNumberMapping[nextElement.level] <=
              titleOrderNumberMapping[element.level!]
          ) {
            break
          }
          valueList.push(nextElement)
        }
        result.push({
          ...element.title!,
          value: getTextFromElementList(valueList),
          elementList: zipElementList(valueList),
          zone
        })
        i = j
      }
    }
    const data = [
      {
        zone: EditorZone.HEADER,
        elementList: this.draw.getHeaderElementList()
      },
      {
        zone: EditorZone.MAIN,
        elementList: this.draw.getOriginalMainElementList()
      },
      {
        zone: EditorZone.FOOTER,
        elementList: this.draw.getFooterElementList()
      }
    ]
    for (const { zone, elementList } of data) {
      getValue(elementList, zone)
    }
    return result
  }
}
