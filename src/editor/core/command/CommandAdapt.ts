import { NBSP, WRAP, ZERO } from '../../dataset/constant/Common'
import {
  AREA_CONTEXT_ATTR,
  EDITOR_ELEMENT_STYLE_ATTR,
  EDITOR_ROW_ATTR,
  LIST_CONTEXT_ATTR,
  TABLE_CONTEXT_ATTR
} from '../../dataset/constant/Element'
import {
  titleOrderNumberMapping,
  titleSizeMapping
} from '../../dataset/constant/Title'
import { defaultWatermarkOption } from '../../dataset/constant/Watermark'
import { ImageDisplay, LocationPosition } from '../../dataset/enum/Common'
import { ControlComponent } from '../../dataset/enum/Control'
import {
  EditorMode,
  EditorZone,
  PageMode,
  PaperDirection
} from '../../dataset/enum/Editor'
import { ElementType } from '../../dataset/enum/Element'
import { ElementStyleKey } from '../../dataset/enum/ElementStyle'
import { ListStyle, ListType } from '../../dataset/enum/List'
import { MoveDirection } from '../../dataset/enum/Observer'
import { RowFlex } from '../../dataset/enum/Row'
import { TableBorder, TdBorder, TdSlash } from '../../dataset/enum/table/Table'
import { TitleLevel } from '../../dataset/enum/Title'
import { VerticalAlign } from '../../dataset/enum/VerticalAlign'
import { ICatalog } from '../../interface/Catalog'
import { DeepRequired } from '../../interface/Common'
import {
  IGetControlValueOption,
  IGetControlValueResult,
  ILocationControlOption,
  IRemoveControlOption,
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
  IEditorText,
  IFocusOption,
  ISetValueOption,
  IUpdateOption
} from '../../interface/Editor'
import {
  IDeleteElementByIdOption,
  IElement,
  IElementPosition,
  IElementStyle,
  IGetElementByIdOption,
  IInsertElementListOption,
  IUpdateElementByIdOption
} from '../../interface/Element'
import {
  ICopyOption,
  IPasteOption,
  IPositionContextByEventOption,
  IPositionContextByEventResult,
  ITableInfoByEvent
} from '../../interface/Event'
import { IMargin } from '../../interface/Margin'
import { ILocationPosition } from '../../interface/Position'
import { IRange, RangeContext, RangeRect } from '../../interface/Range'
import { IReplaceOption, ISearchResultContext } from '../../interface/Search'
import { ITextDecoration } from '../../interface/Text'
import {
  IGetTitleValueOption,
  IGetTitleValueResult
} from '../../interface/Title'
import { IWatermark } from '../../interface/Watermark'
import {
  cloneProperty,
  deepClone,
  downloadFile,
  getUUID,
  isNumber,
  isObjectEqual
} from '../../utils'
import {
  createDomFromElementList,
  formatElementContext,
  formatElementList,
  isTextLikeElement,
  pickElementAttr,
  getElementListByHTML,
  getTextFromElementList,
  zipElementList,
  getAnchorElement
} from '../../utils/element'
import { mergeOption } from '../../utils/option'
import { printImageBase64 } from '../../utils/print'
import { Control } from '../draw/control/Control'
import { Draw } from '../draw/Draw'
import { INavigateInfo, Search } from '../draw/interactive/Search'
import { TableOperate } from '../draw/particle/table/TableOperate'
import { CanvasEvent } from '../event/CanvasEvent'
import { pasteByApi } from '../event/handlers/paste'
import { HistoryManager } from '../history/HistoryManager'
import { I18n } from '../i18n/I18n'
import { Position } from '../position/Position'
import { RangeManager } from '../range/RangeManager'
import { WorkerManager } from '../worker/WorkerManager'
import { Zone } from '../zone/Zone'
import {
  IGetAreaValueOption,
  IGetAreaValueResult,
  IInsertAreaOption,
  ILocationAreaOption,
  ISetAreaPropertiesOption
} from '../../interface/Area'
import { IAreaBadge, IBadge } from '../../interface/Badge'
import { IRichtextOption } from '../../interface/Command'

export class CommandAdapt {
  private draw: Draw
  private range: RangeManager
  private position: Position
  private historyManager: HistoryManager
  private canvasEvent: CanvasEvent
  private options: DeepRequired<IEditorOption>
  private control: Control
  private workerManager: WorkerManager
  private searchManager: Search
  private i18n: I18n
  private zone: Zone
  private tableOperate: TableOperate

  constructor(draw: Draw) {
    this.draw = draw
    this.range = draw.getRange()
    this.position = draw.getPosition()
    this.historyManager = draw.getHistoryManager()
    this.canvasEvent = draw.getCanvasEvent()
    this.options = draw.getOptions()
    this.control = draw.getControl()
    this.workerManager = draw.getWorkerManager()
    this.searchManager = draw.getSearch()
    this.i18n = draw.getI18n()
    this.zone = draw.getZone()
    this.tableOperate = draw.getTableOperate()
  }

  public mode(payload: EditorMode) {
    this.draw.setMode(payload)
  }

  public cut() {
    const isDisabled = this.draw.isReadonly() || this.draw.isDisabled()
    if (isDisabled) return
    this.canvasEvent.cut()
  }

  public copy(payload?: ICopyOption) {
    this.canvasEvent.copy(payload)
  }

  public paste(payload?: IPasteOption) {
    const isDisabled = this.draw.isReadonly() || this.draw.isDisabled()
    if (isDisabled) return
    pasteByApi(this.canvasEvent, payload)
  }

  public selectAll() {
    this.canvasEvent.selectAll()
  }

  public backspace() {
    const isDisabled = this.draw.isReadonly() || this.draw.isDisabled()
    if (isDisabled) return
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
    const isDisabled = this.draw.isReadonly() || this.draw.isDisabled()
    if (isDisabled) return
    this.canvasEvent.applyPainterStyle()
  }

  public format(options?: IRichtextOption) {
    const { isIgnoreDisabledRule = false } = options || {}
    const isDisabled =
      !isIgnoreDisabledRule &&
      (this.draw.isReadonly() || this.draw.isDisabled())
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
      EDITOR_ELEMENT_STYLE_ATTR.forEach(attr => {
        delete el[attr]
      })
    })
    this.draw.render(renderOption)
  }

  public font(payload: string, options?: IRichtextOption) {
    const { isIgnoreDisabledRule = false } = options || {}
    const isDisabled =
      !isIgnoreDisabledRule &&
      (this.draw.isReadonly() || this.draw.isDisabled())
    if (isDisabled) return
    const selection = this.range.getSelectionElementList()
    if (selection?.length) {
      selection.forEach(el => {
        el.font = payload
      })
      this.draw.render({ isSetCursor: false })
    } else {
      let isSubmitHistory = true
      const { endIndex } = this.range.getRange()
      const elementList = this.draw.getElementList()
      const enterElement = elementList[endIndex]
      if (enterElement?.value === ZERO) {
        enterElement.font = payload
      } else {
        this.range.setDefaultStyle({
          font: payload
        })
        isSubmitHistory = false
      }
      this.draw.render({
        isSubmitHistory,
        curIndex: endIndex,
        isCompute: false
      })
    }
  }

  public size(payload: number, options?: IRichtextOption) {
    const { isIgnoreDisabledRule = false } = options || {}
    const isDisabled =
      !isIgnoreDisabledRule &&
      (this.draw.isReadonly() || this.draw.isDisabled())
    if (isDisabled) return
    const { minSize, maxSize, defaultSize } = this.options
    if (payload < minSize || payload > maxSize) return
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
      } else {
        this.range.setDefaultStyle({
          size: payload
        })
        this.draw.render({
          curIndex: endIndex,
          isCompute: false,
          isSubmitHistory: false
        })
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

  public sizeAdd(options?: IRichtextOption) {
    const { isIgnoreDisabledRule = false } = options || {}
    const isDisabled =
      !isIgnoreDisabledRule &&
      (this.draw.isReadonly() || this.draw.isDisabled())
    if (isDisabled) return
    const { defaultSize, maxSize } = this.options
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
      } else {
        const style = this.range.getDefaultStyle()
        const anchorSize = style?.size || enterElement.size || defaultSize
        this.range.setDefaultStyle({
          size: anchorSize + 2 > maxSize ? maxSize : anchorSize + 2
        })
        this.draw.render({
          curIndex: endIndex,
          isCompute: false,
          isSubmitHistory: false
        })
      }
    }
    if (!changeElementList.length) return
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

  public sizeMinus(options?: IRichtextOption) {
    const { isIgnoreDisabledRule = false } = options || {}
    const isDisabled =
      !isIgnoreDisabledRule &&
      (this.draw.isReadonly() || this.draw.isDisabled())
    if (isDisabled) return
    const { defaultSize, minSize } = this.options
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
      } else {
        const style = this.range.getDefaultStyle()
        const anchorSize = style?.size || enterElement.size || defaultSize
        this.range.setDefaultStyle({
          size: anchorSize - 2 < minSize ? minSize : anchorSize - 2
        })
        this.draw.render({
          curIndex: endIndex,
          isCompute: false,
          isSubmitHistory: false
        })
      }
    }
    if (!changeElementList.length) return
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

  public bold(options?: IRichtextOption) {
    const { isIgnoreDisabledRule = false } = options || {}
    const isDisabled =
      !isIgnoreDisabledRule &&
      (this.draw.isReadonly() || this.draw.isDisabled())
    if (isDisabled) return
    const selection = this.range.getSelectionElementList()
    if (selection?.length) {
      const noBoldIndex = selection.findIndex(s => !s.bold)
      selection.forEach(el => {
        el.bold = !!~noBoldIndex
      })
      this.draw.render({ isSetCursor: false })
    } else {
      let isSubmitHistory = true
      const { endIndex } = this.range.getRange()
      const elementList = this.draw.getElementList()
      const enterElement = elementList[endIndex]
      if (enterElement?.value === ZERO) {
        enterElement.bold = !enterElement.bold
      } else {
        this.range.setDefaultStyle({
          bold: enterElement.bold ? false : !this.range.getDefaultStyle()?.bold
        })
        isSubmitHistory = false
      }
      this.draw.render({
        isSubmitHistory,
        curIndex: endIndex,
        isCompute: false
      })
    }
  }

  public italic(options?: IRichtextOption) {
    const { isIgnoreDisabledRule = false } = options || {}
    const isDisabled =
      !isIgnoreDisabledRule &&
      (this.draw.isReadonly() || this.draw.isDisabled())
    if (isDisabled) return
    const selection = this.range.getSelectionElementList()
    if (selection?.length) {
      const noItalicIndex = selection.findIndex(s => !s.italic)
      selection.forEach(el => {
        el.italic = !!~noItalicIndex
      })
      this.draw.render({ isSetCursor: false })
    } else {
      let isSubmitHistory = true
      const { endIndex } = this.range.getRange()
      const elementList = this.draw.getElementList()
      const enterElement = elementList[endIndex]
      if (enterElement?.value === ZERO) {
        enterElement.italic = !enterElement.italic
      } else {
        this.range.setDefaultStyle({
          italic: enterElement.italic
            ? false
            : !this.range.getDefaultStyle()?.italic
        })
        isSubmitHistory = false
      }
      this.draw.render({
        isSubmitHistory,
        curIndex: endIndex,
        isCompute: false
      })
    }
  }

  public underline(
    textDecoration?: ITextDecoration,
    options?: IRichtextOption
  ) {
    const { isIgnoreDisabledRule = false } = options || {}
    const isDisabled =
      !isIgnoreDisabledRule &&
      (this.draw.isReadonly() || this.draw.isDisabled())
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
      let isSubmitHistory = true
      const { endIndex } = this.range.getRange()
      const elementList = this.draw.getElementList()
      const enterElement = elementList[endIndex]
      if (enterElement?.value === ZERO) {
        enterElement.underline = !enterElement.underline
      } else {
        this.range.setDefaultStyle({
          underline: enterElement?.underline
            ? false
            : !this.range.getDefaultStyle()?.underline
        })
        isSubmitHistory = false
      }
      this.draw.render({
        isSubmitHistory,
        curIndex: endIndex,
        isCompute: false
      })
    }
  }

  public strikeout(options?: IRichtextOption) {
    const { isIgnoreDisabledRule = false } = options || {}
    const isDisabled =
      !isIgnoreDisabledRule &&
      (this.draw.isReadonly() || this.draw.isDisabled())
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
      let isSubmitHistory = true
      const { endIndex } = this.range.getRange()
      const elementList = this.draw.getElementList()
      const enterElement = elementList[endIndex]
      if (enterElement?.value === ZERO) {
        enterElement.strikeout = !enterElement.strikeout
      } else {
        this.range.setDefaultStyle({
          strikeout: enterElement.strikeout
            ? false
            : !this.range.getDefaultStyle()?.strikeout
        })
        isSubmitHistory = false
      }
      this.draw.render({
        isSubmitHistory,
        curIndex: endIndex,
        isCompute: false
      })
    }
  }

  public superscript(options?: IRichtextOption) {
    const { isIgnoreDisabledRule = false } = options || {}
    const isDisabled =
      !isIgnoreDisabledRule &&
      (this.draw.isReadonly() || this.draw.isDisabled())
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

  public subscript(options?: IRichtextOption) {
    const { isIgnoreDisabledRule = false } = options || {}
    const isDisabled =
      !isIgnoreDisabledRule &&
      (this.draw.isReadonly() || this.draw.isDisabled())
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

  public color(payload: string | null, options?: IRichtextOption) {
    const { isIgnoreDisabledRule = false } = options || {}
    const isDisabled =
      !isIgnoreDisabledRule &&
      (this.draw.isReadonly() || this.draw.isDisabled())
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
      let isSubmitHistory = true
      const { endIndex } = this.range.getRange()
      const elementList = this.draw.getElementList()
      const enterElement = elementList[endIndex]
      if (enterElement?.value === ZERO) {
        if (payload) {
          enterElement.color = payload
        } else {
          delete enterElement.color
        }
      } else {
        this.range.setDefaultStyle({
          color: payload || undefined
        })
        isSubmitHistory = false
      }
      this.draw.render({
        isSubmitHistory,
        curIndex: endIndex,
        isCompute: false
      })
    }
  }

  public highlight(payload: string | null, options?: IRichtextOption) {
    const { isIgnoreDisabledRule = false } = options || {}
    const isDisabled =
      !isIgnoreDisabledRule &&
      (this.draw.isReadonly() || this.draw.isDisabled())
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
      let isSubmitHistory = true
      const { endIndex } = this.range.getRange()
      const elementList = this.draw.getElementList()
      const enterElement = elementList[endIndex]
      if (enterElement?.value === ZERO) {
        if (payload) {
          enterElement.highlight = payload
        } else {
          delete enterElement.highlight
        }
      } else {
        this.range.setDefaultStyle({
          highlight: payload || undefined
        })
        isSubmitHistory = false
      }
      this.draw.render({
        isSubmitHistory,
        curIndex: endIndex,
        isCompute: false
      })
    }
  }

  public title(payload: TitleLevel | null) {
    const isDisabled = this.draw.isReadonly() || this.draw.isDisabled()
    if (isDisabled) return
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
          delete el.title
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
    const isDisabled = this.draw.isReadonly() || this.draw.isDisabled()
    if (isDisabled) return
    const activeControl = this.control.getActiveControl()
    if (activeControl) return
    this.tableOperate.insertTable(row, col)
  }

  public insertTableTopRow() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.tableOperate.insertTableTopRow()
  }

  public insertTableBottomRow() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.tableOperate.insertTableBottomRow()
  }

  public insertTableLeftCol() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.tableOperate.insertTableLeftCol()
  }

  public insertTableRightCol() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.tableOperate.insertTableRightCol()
  }

  public deleteTableRow() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.tableOperate.deleteTableRow()
  }

  public deleteTableCol() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.tableOperate.deleteTableCol()
  }

  public deleteTable() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.tableOperate.deleteTable()
  }

  public mergeTableCell() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.tableOperate.mergeTableCell()
  }

  public cancelMergeTableCell() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.tableOperate.cancelMergeTableCell()
  }

  public splitVerticalTableCell() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.tableOperate.splitVerticalTableCell()
  }

  public splitHorizontalTableCell() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.tableOperate.splitHorizontalTableCell()
  }

  public tableTdVerticalAlign(payload: VerticalAlign) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.tableOperate.tableTdVerticalAlign(payload)
  }

  public tableBorderType(payload: TableBorder) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.tableOperate.tableBorderType(payload)
  }

  public tableBorderColor(payload: string) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.tableOperate.tableBorderColor(payload)
  }

  public tableTdBorderType(payload: TdBorder) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.tableOperate.tableTdBorderType(payload)
  }

  public tableTdSlashType(payload: TdSlash) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.tableOperate.tableTdSlashType(payload)
  }

  public tableTdBackgroundColor(payload: string) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    this.tableOperate.tableTdBackgroundColor(payload)
  }

  public tableSelectAll() {
    this.tableOperate.tableSelectAll()
  }

  public hyperlink(payload: IElement) {
    const isDisabled = this.draw.isReadonly() || this.draw.isDisabled()
    if (isDisabled) return
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
    formatElementContext(elementList, newElementList, startIndex, {
      editorOptions: this.options
    })
    this.draw.spliceElementList(
      elementList,
      start,
      startIndex === endIndex ? 0 : endIndex - startIndex,
      newElementList
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
    const isDisabled = this.draw.isReadonly() || this.draw.isDisabled()
    if (isDisabled) return
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
    const isDisabled = this.draw.isReadonly() || this.draw.isDisabled()
    if (isDisabled) return
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
    const isDisabled = this.draw.isReadonly() || this.draw.isDisabled()
    if (isDisabled) return
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
    const isDisabled = this.draw.isReadonly() || this.draw.isDisabled()
    if (isDisabled) return
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
      formatElementContext(elementList, [newElement], startIndex, {
        editorOptions: this.options
      })
      if (startIndex !== 0 && elementList[startIndex].value === ZERO) {
        this.draw.spliceElementList(elementList, startIndex, 1, [newElement])
        curIndex = startIndex - 1
      } else {
        this.draw.spliceElementList(elementList, startIndex + 1, 0, [
          newElement
        ])
        curIndex = startIndex
      }
    }
    this.range.setRange(curIndex, curIndex)
    this.draw.render({ curIndex })
  }

  public pageBreak() {
    const isDisabled = this.draw.isReadonly() || this.draw.isDisabled()
    if (isDisabled) return
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
    const { color, size, opacity, font, gap } = defaultWatermarkOption
    options.watermark.data = payload.data
    options.watermark.color = payload.color || color
    options.watermark.size = payload.size || size
    options.watermark.opacity = payload.opacity || opacity
    options.watermark.font = payload.font || font
    options.watermark.repeat = !!payload.repeat
    options.watermark.gap = payload.gap || gap
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

  public image(payload: IDrawImagePayload): string | null {
    const isDisabled = this.draw.isReadonly() || this.draw.isDisabled()
    if (isDisabled) return null
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return null
    const imageId = payload.id || getUUID()
    this.insertElementList([
      {
        ...payload,
        id: imageId,
        type: ElementType.IMAGE
      }
    ])
    return imageId
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

  public replace(payload: string, option?: IReplaceOption) {
    this.draw.getSearch().replace(payload, option)
  }

  public async print() {
    const { scale, printPixelRatio, paperDirection, width, height } =
      this.options
    if (scale !== 1) {
      this.draw.setPageScale(1)
    }
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
    const { startIndex, endIndex } = this.range.getRange()
    if (
      display === ImageDisplay.SURROUND ||
      display === ImageDisplay.FLOAT_TOP ||
      display === ImageDisplay.FLOAT_BOTTOM
    ) {
      const positionList = this.position.getPositionList()
      const {
        pageNo,
        coordinate: { leftTop }
      } = positionList[startIndex]
      element.imgFloatPosition = {
        pageNo,
        x: leftTop[0],
        y: leftTop[1]
      }
    } else {
      delete element.imgFloatPosition
    }
    this.draw.getPreviewer().clearResizer()
    this.draw.render({
      isSetCursor: true,
      curIndex: endIndex
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

  public getValueAsync(options?: IGetValueOption): Promise<IEditorResult> {
    return this.draw.getWorkerManager().getValue(options)
  }

  public getAreaValue(
    options?: IGetAreaValueOption
  ): IGetAreaValueResult | null {
    return this.draw.getArea().getAreaValue(options)
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

  public getCursorPosition(): IElementPosition | null {
    return this.position.getCursorPosition()
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
    const selectionText = this.range.toString()
    const selectionElementList = zipElementList(
      this.range.getSelectionElementList() || []
    )
    // 元素信息
    const elementList = this.draw.getElementList()
    const startElement = pickElementAttr(
      elementList[isCollapsed ? startIndex : startIndex + 1],
      {
        extraPickAttrs: ['id', 'controlComponent']
      }
    )
    const endElement = pickElementAttr(elementList[endIndex], {
      extraPickAttrs: ['id', 'controlComponent']
    })
    // 页码信息、行信息
    const rowList = this.draw.getRowList()
    const positionList = this.position.getPositionList()
    const startPosition = positionList[startIndex]
    const endPosition = positionList[endIndex]
    const startPageNo = startPosition.pageNo
    const endPageNo = endPosition.pageNo
    const startRowNo = startPosition.rowIndex
    const endRowNo = endPosition.rowIndex
    // 列信息
    const startRow = rowList[startRowNo]
    const endRow = rowList[endRowNo]
    let startColNo = 0
    let endColNo = 0
    // 以光标显示位置为准
    if (!this.draw.getCursor().getHitLineStartIndex()) {
      // 换行符不计算列数量
      startColNo =
        startRow.elementList[0]?.value === ZERO
          ? startPosition.index! - startRow.startIndex
          : startPosition.index! - startRow.startIndex + 1
    }
    // 光标闭合时列位置相同
    if (startPosition === endPosition) {
      endColNo = startColNo
    } else {
      endColNo =
        endRow.elementList[0]?.value === ZERO
          ? endPosition.index! - endRow.startIndex
          : endPosition.index! - endRow.startIndex + 1
    }

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
    const { isTable, trIndex, tdIndex, index } =
      this.position.getPositionContext()
    let tableElement: IElement | null = null
    if (isTable) {
      const originalElementList = this.draw.getOriginalElementList()
      const originTableElement = originalElementList[index!] || null
      if (originTableElement) {
        tableElement = zipElementList([originTableElement])[0]
      }
    }
    // 标题信息
    let titleId: string | null = null
    let titleStartPageNo: number | null = null
    let start = startIndex - 1
    while (start > 0) {
      const curElement = elementList[start]
      const preElement = elementList[start - 1]
      if (curElement.titleId && curElement.titleId !== preElement?.titleId) {
        titleId = curElement.titleId
        titleStartPageNo = positionList[start].pageNo
        break
      }
      start--
    }
    return deepClone<RangeContext>({
      isCollapsed,
      startElement,
      endElement,
      startPageNo,
      endPageNo,
      startRowNo,
      endRowNo,
      startColNo,
      endColNo,
      rangeRects,
      zone,
      isTable,
      trIndex: trIndex ?? null,
      tdIndex: tdIndex ?? null,
      tableElement,
      selectionText,
      selectionElementList,
      titleId,
      titleStartPageNo
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

  public getKeywordContext(payload: string): ISearchResultContext[] | null {
    const rangeList = this.getKeywordRangeList(payload)
    if (!rangeList.length) return null
    const searchResultContextList: ISearchResultContext[] = []
    const positionList = this.position.getOriginalMainPositionList()
    const elementList = this.draw.getOriginalMainElementList()
    for (let r = 0; r < rangeList.length; r++) {
      const range = rangeList[r]
      const { startIndex, endIndex, tableId, startTrIndex, startTdIndex } =
        range
      let keywordPositionList: IElementPosition[] = positionList
      if (range.tableId) {
        const tableElement = elementList.find(el => el.id === tableId)
        if (tableElement) {
          keywordPositionList =
            tableElement.trList?.[startTrIndex!]?.tdList?.[startTdIndex!]
              ?.positionList || []
        }
      }
      // 获取关键词始末位置
      const startPosition = deepClone(keywordPositionList[startIndex])
      const endPosition = deepClone(keywordPositionList[endIndex])
      searchResultContextList.push({
        range,
        startPosition,
        endPosition
      })
    }
    return searchResultContextList
  }

  public pageMode(payload: PageMode) {
    this.draw.setPageMode(payload)
  }

  public pageScale(scale: number) {
    if (scale === this.options.scale) return
    this.draw.setPageScale(scale)
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

  public setMainBadge(payload: IBadge | null) {
    this.draw.getBadge().setMainBadge(payload)
    this.draw.render({
      isCompute: false,
      isSubmitHistory: false
    })
  }

  public setAreaBadge(payload: IAreaBadge[]) {
    this.draw.getBadge().setAreaBadgeMap(payload)
    this.draw.render({
      isCompute: false,
      isSubmitHistory: false
    })
  }

  public insertElementList(
    payload: IElement[],
    options: IInsertElementListOption = {}
  ) {
    if (!payload.length) return
    const isDisabled = this.draw.isReadonly() || this.draw.isDisabled()
    if (isDisabled) return
    const { isReplace = true } = options
    // 如果配置不替换时，需收缩选区至末尾
    if (!isReplace) {
      this.range.shrinkRange()
    }
    const cloneElementList = deepClone(payload)
    // 格式化上下文信息
    const { startIndex } = this.range.getRange()
    const elementList = this.draw.getElementList()
    formatElementContext(elementList, cloneElementList, startIndex, {
      isBreakWhenWrap: true,
      editorOptions: this.options
    })
    this.draw.insertElementList(cloneElementList, options)
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

  public updateElementById(payload: IUpdateElementByIdOption) {
    const { id, conceptId } = payload
    if (!id && !conceptId) return
    const updateElementInfoList: {
      elementList: IElement[]
      index: number
    }[] = []
    function getElementInfoById(elementList: IElement[]) {
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
              getElementInfoById(td.value)
            }
          }
        }
        if (
          (id && element.id === id) ||
          (conceptId && element.conceptId === conceptId)
        ) {
          updateElementInfoList.push({
            elementList,
            index: i - 1
          })
        }
      }
    }
    // 优先正文再页眉页脚
    const data = [
      this.draw.getOriginalMainElementList(),
      this.draw.getHeaderElementList(),
      this.draw.getFooterElementList()
    ]
    for (const elementList of data) {
      getElementInfoById(elementList)
    }
    // 更新内容
    if (!updateElementInfoList.length) return
    for (let i = 0; i < updateElementInfoList.length; i++) {
      const { elementList, index } = updateElementInfoList[i]
      // 重新格式化元素
      const oldElement = elementList[index]
      const newElement = zipElementList(
        [
          {
            ...oldElement,
            ...payload.properties
          }
        ],
        {
          extraPickAttrs: ['id']
        }
      )
      // 区域上下文提取
      cloneProperty<IElement>(AREA_CONTEXT_ATTR, oldElement, newElement[0])
      formatElementList(newElement, {
        isHandleFirstElement: false,
        editorOptions: this.options
      })
      elementList[index] = newElement[0]
    }
    this.draw.render({
      isSetCursor: false
    })
  }

  public deleteElementById(payload: IDeleteElementByIdOption) {
    const { id, conceptId } = payload
    if (!id && !conceptId) return
    let isExistDelete = false
    function deleteElement(elementList: IElement[]) {
      let i = 0
      while (i < elementList.length) {
        const element = elementList[i]
        if (element.type === ElementType.TABLE) {
          const trList = element.trList!
          for (let r = 0; r < trList.length; r++) {
            const tr = trList[r]
            for (let d = 0; d < tr.tdList.length; d++) {
              const td = tr.tdList[d]
              deleteElement(td.value)
            }
          }
        }
        if (
          (id && element.id === id) ||
          (conceptId && element.conceptId === conceptId)
        ) {
          isExistDelete = true
          elementList.splice(i, 1)
          i--
        }
        i++
      }
    }
    // 优先正文再页眉页脚
    const data = [
      this.draw.getOriginalMainElementList(),
      this.draw.getHeaderElementList(),
      this.draw.getFooterElementList()
    ]
    for (const elementList of data) {
      deleteElement(elementList)
    }
    if (!isExistDelete) return
    this.draw.render({
      isSetCursor: false
    })
  }

  public getElementById(payload: IGetElementByIdOption): IElement[] {
    const { id, conceptId } = payload
    const result: IElement[] = []
    if (!id && !conceptId) return result
    const getElement = (elementList: IElement[]) => {
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
              getElement(td.value)
            }
          }
        }
        if (
          (id && element.id !== id) ||
          (conceptId && element.conceptId !== conceptId)
        ) {
          continue
        }
        result.push(element)
      }
    }
    const data = [
      this.draw.getHeaderElementList(),
      this.draw.getOriginalMainElementList(),
      this.draw.getFooterElementList()
    ]
    for (const elementList of data) {
      getElement(elementList)
    }
    return zipElementList(result, {
      extraPickAttrs: ['id']
    })
  }

  public setValue(payload: Partial<IEditorData>, options?: ISetValueOption) {
    this.draw.setValue(payload, options)
  }

  public removeControl(payload?: IRemoveControlOption) {
    if (payload?.id || payload?.conceptId) {
      const { id, conceptId } = payload
      let isExistRemove = false
      const remove = (elementList: IElement[]) => {
        let i = elementList.length - 1
        while (i >= 0) {
          const element = elementList[i]
          if (element.type === ElementType.TABLE) {
            const trList = element.trList!
            for (let r = 0; r < trList.length; r++) {
              const tr = trList[r]
              for (let d = 0; d < tr.tdList.length; d++) {
                const td = tr.tdList[d]
                remove(td.value)
              }
            }
          }
          i--
          if (
            !element.control ||
            (id && element.controlId !== id) ||
            (conceptId && element.control.conceptId !== conceptId)
          ) {
            continue
          }
          isExistRemove = true
          elementList.splice(i + 1, 1)
        }
      }
      const data = [
        this.draw.getHeaderElementList(),
        this.draw.getOriginalMainElementList(),
        this.draw.getFooterElementList()
      ]
      for (const elementList of data) {
        remove(elementList)
      }
      if (isExistRemove) {
        this.draw.render({
          isSetCursor: false
        })
      }
    } else {
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
  }

  public translate(path: string): string {
    return this.i18n.t(path)
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
    const elementList = this.draw.getOriginalMainElementList()
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
    this.position.setPositionContext({
      isTable: false
    })
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
    return this.draw.getControl().getValueById(payload)
  }

  public setControlValue(payload: ISetControlValueOption) {
    this.draw.getControl().setValueListById([payload])
  }

  public setControlValueList(payload: ISetControlValueOption[]) {
    this.draw.getControl().setValueListById(payload)
  }

  public setControlExtension(payload: ISetControlExtensionOption) {
    this.draw.getControl().setExtensionListById([payload])
  }

  public setControlExtensionList(payload: ISetControlExtensionOption[]) {
    this.draw.getControl().setExtensionListById(payload)
  }

  public setControlProperties(payload: ISetControlProperties) {
    this.draw.getControl().setPropertiesListById([payload])
  }

  public setControlPropertiesList(payload: ISetControlProperties[]) {
    this.draw.getControl().setPropertiesListById(payload)
  }

  public setControlHighlight(payload: ISetControlHighlightOption) {
    this.draw.getControl().setHighlightList(payload)
    this.draw.render({
      isSubmitHistory: false
    })
  }

  public updateOptions(payload: IUpdateOption) {
    const newOption = mergeOption(payload)
    Object.entries(newOption).forEach(([key, value]) => {
      Reflect.set(this.options, key, value)
    })
    this.forceUpdate()
  }

  public getControlList(): IElement[] {
    return this.draw.getControl().getList()
  }

  public locationControl(controlId: string, options?: ILocationControlOption) {
    function location(
      elementList: IElement[],
      zone: EditorZone
    ): ILocationPosition | null {
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
              const locationContext = location(td.value, zone)
              if (locationContext) {
                return {
                  ...locationContext,
                  positionContext: {
                    isTable: true,
                    index: i - 1,
                    trIndex: r,
                    tdIndex: d,
                    tdId: element.tdId,
                    trId: element.trId,
                    tableId: element.tableId
                  }
                }
              }
            }
          }
        }
        if (element?.controlId !== controlId) continue
        let curIndex = i - 1
        if (options?.position === LocationPosition.OUTER_AFTER) {
          // 控件外面最后
          if (
            !(
              element.controlComponent === ControlComponent.POSTFIX &&
              elementList[i + 1]?.controlComponent !==
                ControlComponent.POST_TEXT
            )
          ) {
            continue
          }
        } else if (options?.position === LocationPosition.OUTER_BEFORE) {
          // 控件外面最前
          curIndex -= 1
        } else if (options?.position === LocationPosition.AFTER) {
          // 控件内部最后
          curIndex -= 1
          if (
            element.controlComponent !== ControlComponent.PLACEHOLDER &&
            element.controlComponent !== ControlComponent.POSTFIX &&
            element.controlComponent !== ControlComponent.POST_TEXT
          ) {
            continue
          }
        } else {
          // 控件内部最前（默认）
          if (
            (element.controlComponent !== ControlComponent.PREFIX &&
              element.controlComponent !== ControlComponent.PRE_TEXT) ||
            elementList[i]?.controlComponent === ControlComponent.PREFIX ||
            elementList[i]?.controlComponent === ControlComponent.PRE_TEXT
          ) {
            continue
          }
        }
        return {
          zone,
          range: {
            startIndex: curIndex,
            endIndex: curIndex
          },
          positionContext: {
            isTable: false
          }
        }
      }
      return null
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
    for (const context of data) {
      const locationContext = location(context.elementList, context.zone)
      if (locationContext) {
        // 设置区域、上下文、光标信息
        this.setZone(locationContext.zone)
        this.position.setPositionContext(locationContext.positionContext)
        this.range.replaceRange(locationContext.range)
        this.draw.render({
          curIndex: locationContext.range.startIndex,
          isCompute: false,
          isSubmitHistory: false
        })
        break
      }
    }
  }

  public insertControl(payload: IElement) {
    const isDisabled = this.draw.isReadonly() || this.draw.isDisabled()
    if (isDisabled) return
    const cloneElement = deepClone(payload)
    // 格式化上下文信息
    const { startIndex } = this.range.getRange()
    const elementList = this.draw.getElementList()
    const copyElement = getAnchorElement(elementList, startIndex)
    if (!copyElement) return
    const cloneAttr = [
      ...TABLE_CONTEXT_ATTR,
      ...EDITOR_ROW_ATTR,
      ...LIST_CONTEXT_ATTR,
      ...AREA_CONTEXT_ATTR
    ]
    cloneProperty<IElement>(cloneAttr, copyElement, cloneElement)
    // 插入控件
    this.draw.insertElementList([cloneElement])
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

  public getPositionContextByEvent(
    evt: MouseEvent,
    options: IPositionContextByEventOption = {}
  ): IPositionContextByEventResult | null {
    const pageIndex = (<HTMLElement>evt.target)?.dataset.index
    if (!pageIndex) return null
    const { isMustDirectHit = true } = options
    const pageNo = Number(pageIndex)
    const positionContext = this.position.getPositionByXY({
      x: evt.offsetX,
      y: evt.offsetY,
      pageNo
    })
    const {
      isDirectHit,
      isTable,
      index,
      trIndex,
      tdIndex,
      tdValueIndex,
      zone
    } = positionContext
    // 非直接命中或选区不一致时返回空值
    if (
      (isMustDirectHit && !isDirectHit) ||
      (zone && zone !== this.zone.getZone())
    ) {
      return null
    }
    // 命中元素信息
    let tableInfo: ITableInfoByEvent | null = null
    let element: IElement | null = null
    const elementList = this.draw.getOriginalElementList()
    let position: IElementPosition | null = null
    const positionList = this.position.getOriginalPositionList()
    if (isTable) {
      const td = elementList[index!].trList?.[trIndex!].tdList[tdIndex!]
      element = td?.value[tdValueIndex!] || null
      position = td?.positionList?.[tdValueIndex!] || null
      tableInfo = {
        element: elementList[index!],
        trIndex: trIndex!,
        tdIndex: tdIndex!
      }
    } else {
      element = elementList[index] || null
      position = positionList[index] || null
    }
    // 元素包围信息
    let rangeRect: RangeRect | null = null
    if (position) {
      const {
        pageNo,
        coordinate: { leftTop, rightTop },
        lineHeight
      } = position
      const height = this.draw.getOriginalHeight()
      const pageGap = this.draw.getOriginalPageGap()
      rangeRect = {
        x: leftTop[0],
        y: leftTop[1] + pageNo * (height + pageGap),
        width: rightTop[0] - leftTop[0],
        height: lineHeight
      }
    }
    return {
      pageNo,
      element,
      rangeRect,
      tableInfo
    }
  }

  public insertTitle(payload: IElement) {
    const isDisabled = this.draw.isReadonly() || this.draw.isDisabled()
    if (isDisabled) return
    const cloneElement = deepClone(payload)
    // 格式化上下文信息
    const { startIndex } = this.range.getRange()
    const elementList = this.draw.getElementList()
    const copyElement = getAnchorElement(elementList, startIndex)
    if (!copyElement) return
    const cloneAttr = [
      ...TABLE_CONTEXT_ATTR,
      ...EDITOR_ROW_ATTR,
      ...LIST_CONTEXT_ATTR,
      ...AREA_CONTEXT_ATTR
    ]
    cloneElement.valueList?.forEach(valueItem => {
      cloneProperty<IElement>(cloneAttr, copyElement, valueItem)
    })
    // 插入标题
    this.draw.insertElementList([cloneElement])
  }

  public focus(payload?: IFocusOption) {
    const {
      position = LocationPosition.AFTER,
      isMoveCursorToVisible = true,
      rowNo,
      range
    } = payload || {}
    let curIndex = -1
    if (range) {
      // 根据选区定位
      this.range.replaceRange(range)
      curIndex =
        position === LocationPosition.BEFORE ? range.startIndex : range.endIndex
    } else if (isNumber(rowNo)) {
      // 根据行号定位
      const rowList = this.draw.getOriginalRowList()
      curIndex =
        position === LocationPosition.BEFORE
          ? rowList[rowNo]?.startIndex
          : rowList[rowNo + 1]?.startIndex - 1
      if (!isNumber(curIndex)) return
      this.range.setRange(curIndex, curIndex)
    } else {
      // 默认文档首尾
      curIndex =
        position === LocationPosition.BEFORE
          ? 0
          : this.draw.getOriginalMainElementList().length - 1
      this.range.setRange(curIndex, curIndex)
    }
    // 光标存在且闭合时定位
    const renderParams: IDrawOption = {
      isCompute: false,
      isSetCursor: false,
      isSubmitHistory: false
    }
    if (~curIndex && this.range.getIsCollapsed()) {
      renderParams.curIndex = curIndex
      renderParams.isSetCursor = true
    }
    this.draw.render(renderParams)
    // 移动滚动条到可见区域
    if (isMoveCursorToVisible) {
      const positionList = this.draw.getPosition().getPositionList()
      this.draw.getCursor().moveCursorToVisible({
        cursorPosition: positionList[curIndex],
        direction: MoveDirection.DOWN
      })
    }
  }

  public insertArea(payload: IInsertAreaOption) {
    return this.draw.getArea().insertArea(payload)
  }

  public setAreaProperties(payload: ISetAreaPropertiesOption) {
    this.draw.getArea().setAreaProperties(payload)
  }

  public locationArea(areaId: string, options?: ILocationAreaOption) {
    const context = this.draw.getArea().getContextByAreaId(areaId, options)
    if (!context) return
    const {
      range: { endIndex },
      elementPosition
    } = context
    this.position.setPositionContext({
      isTable: false
    })
    this.range.setRange(endIndex, endIndex)
    this.draw.render({
      isSetCursor: false,
      isCompute: false,
      isSubmitHistory: false
    })
    // 移动到可见区域
    const cursor = this.draw.getCursor()
    this.position.setCursorPosition(elementPosition)
    cursor.drawCursor({
      hitLineStartIndex: endIndex
    })
    cursor.moveCursorToVisible({
      cursorPosition: elementPosition,
      direction: MoveDirection.UP
    })
  }
}
