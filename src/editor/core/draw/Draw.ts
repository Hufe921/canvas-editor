import { version } from '../../../../package.json'
import { ZERO } from '../../dataset/constant/Common'
import { RowFlex } from '../../dataset/enum/Row'
import { IDrawOption, IDrawRowPayload, IDrawRowResult, IPainterOptions } from '../../interface/Draw'
import { IEditorOption, IEditorResult } from '../../interface/Editor'
import { IElement, IElementMetrics, IElementPosition, IElementFillRect, IElementStyle } from '../../interface/Element'
import { IRow, IRowElement } from '../../interface/Row'
import { deepClone, getUUID } from '../../utils'
import { Cursor } from '../cursor/Cursor'
import { CanvasEvent } from '../event/CanvasEvent'
import { GlobalEvent } from '../event/GlobalEvent'
import { HistoryManager } from '../history/HistoryManager'
import { Listener } from '../listener/Listener'
import { Position } from '../position/Position'
import { RangeManager } from '../range/RangeManager'
import { Background } from './frame/Background'
import { Highlight } from './richtext/Highlight'
import { Margin } from './frame/Margin'
import { Search } from './interactive/Search'
import { Strikeout } from './richtext/Strikeout'
import { Underline } from './richtext/Underline'
import { ElementType } from '../../dataset/enum/Element'
import { ImageParticle } from './particle/ImageParticle'
import { LaTexParticle } from './particle/latex/LaTexParticle'
import { TextParticle } from './particle/TextParticle'
import { PageNumber } from './frame/PageNumber'
import { ScrollObserver } from '../observer/ScrollObserver'
import { SelectionObserver } from '../observer/SelectionObserver'
import { TableParticle } from './particle/table/TableParticle'
import { TableTool } from './particle/table/TableTool'
import { HyperlinkParticle } from './particle/HyperlinkParticle'
import { Header } from './frame/Header'
import { SuperscriptParticle } from './particle/Superscript'
import { SubscriptParticle } from './particle/Subscript'
import { SeparatorParticle } from './particle/Separator'
import { PageBreakParticle } from './particle/PageBreak'
import { Watermark } from './frame/Watermark'
import { EditorMode, PageMode } from '../../dataset/enum/Editor'
import { Control } from './control/Control'
import { zipElementList } from '../../utils/element'
import { CheckboxParticle } from './particle/CheckboxParticle'
import { DeepRequired } from '../../interface/Common'
import { ControlComponent } from '../../dataset/enum/Control'
import { formatElementList } from '../../utils/element'
import { WorkerManager } from '../worker/WorkerManager'
import { Previewer } from './particle/previewer/Previewer'

export class Draw {

  private container: HTMLDivElement
  private pageContainer: HTMLDivElement
  private pageList: HTMLCanvasElement[]
  private ctxList: CanvasRenderingContext2D[]
  private pageNo: number
  private mode: EditorMode
  private options: DeepRequired<IEditorOption>
  private position: Position
  private elementList: IElement[]
  private listener: Listener

  private canvasEvent: CanvasEvent
  private cursor: Cursor
  private range: RangeManager
  private margin: Margin
  private background: Background
  private search: Search
  private underline: Underline
  private strikeout: Strikeout
  private highlight: Highlight
  private historyManager: HistoryManager
  private previewer: Previewer
  private imageParticle: ImageParticle
  private laTexParticle: LaTexParticle
  private textParticle: TextParticle
  private tableParticle: TableParticle
  private tableTool: TableTool
  private pageNumber: PageNumber
  private waterMark: Watermark
  private header: Header
  private hyperlinkParticle: HyperlinkParticle
  private separatorParticle: SeparatorParticle
  private pageBreakParticle: PageBreakParticle
  private superscriptParticle: SuperscriptParticle
  private subscriptParticle: SubscriptParticle
  private checkboxParticle: CheckboxParticle
  private control: Control
  private workerManager: WorkerManager

  private rowList: IRow[]
  private painterStyle: IElementStyle | null
  private painterOptions: IPainterOptions | null
  private searchKeyword: string | null
  private visiblePageNoList: number[]
  private intersectionPageNo: number

  constructor(
    container: HTMLDivElement,
    options: DeepRequired<IEditorOption>,
    elementList: IElement[],
    listener: Listener
  ) {
    this.container = container
    this.pageList = []
    this.ctxList = []
    this.pageNo = 0
    this.mode = options.mode
    this.options = options
    this.elementList = elementList
    this.listener = listener

    this.pageContainer = this._createPageContainer()
    this._createPage(0)

    this.historyManager = new HistoryManager()
    this.position = new Position(this)
    this.range = new RangeManager(this)
    this.margin = new Margin(this)
    this.background = new Background(this)
    this.search = new Search(this)
    this.underline = new Underline(this)
    this.strikeout = new Strikeout(this)
    this.highlight = new Highlight(this)
    this.previewer = new Previewer(this)
    this.imageParticle = new ImageParticle(this)
    this.laTexParticle = new LaTexParticle(this)
    this.textParticle = new TextParticle(this)
    this.tableParticle = new TableParticle(this)
    this.tableTool = new TableTool(this)
    this.pageNumber = new PageNumber(this)
    this.waterMark = new Watermark(this)
    this.header = new Header(this)
    this.hyperlinkParticle = new HyperlinkParticle(this)
    this.separatorParticle = new SeparatorParticle()
    this.pageBreakParticle = new PageBreakParticle(this)
    this.superscriptParticle = new SuperscriptParticle()
    this.subscriptParticle = new SubscriptParticle()
    this.checkboxParticle = new CheckboxParticle(this)
    this.control = new Control(this)

    new ScrollObserver(this)
    new SelectionObserver()

    this.canvasEvent = new CanvasEvent(this)
    this.cursor = new Cursor(this, this.canvasEvent)
    this.canvasEvent.register()
    const globalEvent = new GlobalEvent(this, this.canvasEvent)
    globalEvent.register()

    this.workerManager = new WorkerManager(this)

    this.rowList = []
    this.painterStyle = null
    this.painterOptions = null
    this.searchKeyword = null
    this.visiblePageNoList = []
    this.intersectionPageNo = 0

    this.render({ isSetCursor: false })
  }

  public getMode(): EditorMode {
    return this.mode
  }

  public setMode(payload: EditorMode) {
    this.mode = payload
  }

  public isReadonly() {
    return this.mode === EditorMode.READONLY
  }

  public getWidth(): number {
    return Math.floor(this.options.width * this.options.scale)
  }

  public getHeight(): number {
    return Math.floor(this.options.height * this.options.scale)
  }

  public getCanvasWidth(): number {
    const page = this.getPage()
    return page.width
  }

  public getCanvasHeight(): number {
    const page = this.getPage()
    return page.height
  }

  public getInnerWidth(): number {
    const width = this.getWidth()
    const margins = this.getMargins()
    return width - margins[1] - margins[3]
  }

  public getOriginalInnerWidth(): number {
    const { width, margins } = this.options
    return width - margins[1] - margins[3]
  }

  public getMargins(): number[] {
    return this.options.margins.map(m => m * this.options.scale)
  }

  public getPageGap(): number {
    return this.options.pageGap * this.options.scale
  }

  public getPageNumberBottom(): number {
    return this.options.pageNumberBottom * this.options.scale
  }

  public getHeaderTop(): number {
    return this.options.headerTop * this.options.scale
  }

  public getMarginIndicatorSize(): number {
    return this.options.marginIndicatorSize * this.options.scale
  }

  public getDefaultBasicRowMarginHeight(): number {
    return this.options.defaultBasicRowMarginHeight * this.options.scale
  }

  public getTdPadding(): number {
    return this.options.tdPadding * this.options.scale
  }

  public getContainer(): HTMLDivElement {
    return this.container
  }

  public getPageContainer(): HTMLDivElement {
    return this.pageContainer
  }

  public getVisiblePageNoList(): number[] {
    return this.visiblePageNoList
  }

  public setVisiblePageNoList(payload: number[]) {
    this.visiblePageNoList = payload
    if (this.listener.visiblePageNoListChange) {
      this.listener.visiblePageNoListChange(this.visiblePageNoList)
    }
  }

  public getIntersectionPageNo(): number {
    return this.intersectionPageNo
  }

  public setIntersectionPageNo(payload: number) {
    this.intersectionPageNo = payload
    if (this.listener.intersectionPageNoChange) {
      this.listener.intersectionPageNoChange(this.intersectionPageNo)
    }
  }

  public getPageNo(): number {
    return this.pageNo
  }

  public setPageNo(payload: number) {
    this.pageNo = payload
  }

  public getPage(): HTMLCanvasElement {
    return this.pageList[this.pageNo]
  }

  public getPageList(): HTMLCanvasElement[] {
    return this.pageList
  }

  public getCtx(): CanvasRenderingContext2D {
    return this.ctxList[this.pageNo]
  }

  public getOptions(): DeepRequired<IEditorOption> {
    return this.options
  }

  public getSearch(): Search {
    return this.search
  }

  public getHistoryManager(): HistoryManager {
    return this.historyManager
  }

  public getPosition(): Position {
    return this.position
  }

  public getRange(): RangeManager {
    return this.range
  }

  public getElementList(): IElement[] {
    const positionContext = this.position.getPositionContext()
    if (positionContext.isTable) {
      const { index, trIndex, tdIndex } = positionContext
      return this.elementList[index!].trList![trIndex!].tdList[tdIndex!].value
    }
    return this.elementList
  }

  public insertElementList(payload: IElement[]) {
    if (!payload.length) return
    const activeControl = this.control.getActiveControl()
    if (activeControl) return
    const isPartRangeInControlOutside = this.control.isPartRangeInControlOutside()
    if (isPartRangeInControlOutside) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    formatElementList(payload, {
      isHandleFirstElement: false,
      editorOptions: this.options
    })
    const elementList = this.getElementList()
    const isCollapsed = startIndex === endIndex
    const start = startIndex + 1
    if (!isCollapsed) {
      elementList.splice(start, endIndex - startIndex)
    }
    const positionContext = this.position.getPositionContext()
    for (let i = 0; i < payload.length; i++) {
      const element = payload[i]
      if (positionContext.isTable) {
        element.tdId = positionContext.tdId
        element.trId = positionContext.trId
        element.tableId = positionContext.tableId
      }
      elementList.splice(start + i, 0, element)
    }
    const curIndex = startIndex + payload.length
    this.range.setRange(curIndex, curIndex)
    this.render({
      curIndex
    })
  }

  public getOriginalElementList() {
    return this.elementList
  }

  public getCanvasEvent(): CanvasEvent {
    return this.canvasEvent
  }

  public getListener(): Listener {
    return this.listener
  }

  public getCursor(): Cursor {
    return this.cursor
  }

  public getPreviewer(): Previewer {
    return this.previewer
  }

  public getImageParticle(): ImageParticle {
    return this.imageParticle
  }

  public getTableTool(): TableTool {
    return this.tableTool
  }

  public getHyperlinkParticle(): HyperlinkParticle {
    return this.hyperlinkParticle
  }

  public getControl(): Control {
    return this.control
  }

  public getWorkerManager(): WorkerManager {
    return this.workerManager
  }

  public getRowCount(): number {
    return this.rowList.length
  }

  public getDataURL(): string[] {
    return this.pageList.map(c => c.toDataURL())
  }

  public getPainterStyle(): IElementStyle | null {
    return this.painterStyle && Object.keys(this.painterStyle).length ? this.painterStyle : null
  }

  public getPainterOptions(): IPainterOptions | null {
    return this.painterOptions
  }

  public setPainterStyle(payload: IElementStyle | null, options?: IPainterOptions) {
    this.painterStyle = payload
    this.painterOptions = options || null
    if (this.getPainterStyle()) {
      this.pageList.forEach(c => c.style.cursor = 'copy')
    }
  }

  public getSearchKeyword(): string | null {
    return this.searchKeyword
  }

  public setSearchKeyword(payload: string | null) {
    this.searchKeyword = payload
  }

  public setDefaultRange() {
    if (!this.elementList.length) return
    setTimeout(() => {
      const curIndex = this.elementList.length - 1
      this.range.setRange(curIndex, curIndex)
      this.range.setRangeStyle()
    })
  }

  public setPageMode(payload: PageMode) {
    if (!payload || this.options.pageMode === payload) return
    this.options.pageMode = payload
    // ??????????????????
    if (payload === PageMode.PAGING) {
      const { height } = this.options
      const dpr = window.devicePixelRatio
      const canvas = this.pageList[0]
      canvas.style.height = `${height}px`
      canvas.height = height * dpr
    }
    this.render({ isSubmitHistory: false, isSetCursor: false })
    // ??????
    setTimeout(() => {
      if (this.listener.pageModeChange) {
        this.listener.pageModeChange(payload)
      }
    })
  }

  public setPageScale(payload: number) {
    this.options.scale = payload
    const width = this.getWidth()
    const height = this.getHeight()
    this.container.style.width = `${width}px`
    this.pageList.forEach(p => {
      p.width = width
      p.height = height
      p.style.width = `${width}px`
      p.style.height = `${height}px`
      p.style.marginBottom = `${this.getPageGap()}px`
    })
    this.render({ isSubmitHistory: false, isSetCursor: false })
    if (this.listener.pageScaleChange) {
      this.listener.pageScaleChange(payload)
    }
  }

  public getValue(): IEditorResult {
    // ??????
    const { width, height, margins, watermark } = this.options
    // ??????
    const data = zipElementList(this.elementList)
    return {
      version,
      width,
      height,
      margins,
      watermark: watermark.data ? watermark : undefined,
      data
    }
  }

  private _createPageContainer(): HTMLDivElement {
    // ?????????????????????????????????
    this.container.style.width = `${this.getWidth()}px`
    const pageContainer = document.createElement('div')
    pageContainer.classList.add('page-container')
    this.container.append(pageContainer)
    return pageContainer
  }

  private _createPage(pageNo: number) {
    const width = this.getWidth()
    const height = this.getHeight()
    const canvas = document.createElement('canvas')
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    canvas.style.marginBottom = `${this.getPageGap()}px`
    canvas.setAttribute('data-index', String(pageNo))
    this.pageContainer.append(canvas)
    // ???????????????
    const dpr = window.devicePixelRatio
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.cursor = 'text'
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    // ???????????????
    this.pageList.push(canvas)
    this.ctxList.push(ctx)
  }

  private _getFont(el: IElement, scale = 1): string {
    const { defaultSize, defaultFont } = this.options
    const font = el.font || defaultFont
    const size = el.actualSize || el.size || defaultSize
    return `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${size * scale}px ${font}`
  }

  private _computeRowList(innerWidth: number, elementList: IElement[]) {
    const { defaultSize, defaultRowMargin, scale, tdPadding, defaultTabWidth } = this.options
    const defaultBasicRowMarginHeight = this.getDefaultBasicRowMarginHeight()
    const tdGap = tdPadding * 2
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const rowList: IRow[] = []
    if (elementList.length) {
      rowList.push({
        width: 0,
        height: 0,
        ascent: 0,
        elementList: [],
        rowFlex: elementList?.[1]?.rowFlex
      })
    }
    for (let i = 0; i < elementList.length; i++) {
      const curRow: IRow = rowList[rowList.length - 1]
      const element = elementList[i]
      const rowMargin = defaultBasicRowMarginHeight * (element.rowMargin || defaultRowMargin)
      const metrics: IElementMetrics = {
        width: 0,
        height: 0,
        boundingBoxAscent: 0,
        boundingBoxDescent: 0
      }
      if (element.type === ElementType.IMAGE || element.type === ElementType.LATEX) {
        const elementWidth = element.width! * scale
        const elementHeight = element.height! * scale
        // ??????????????????????????????
        if (curRow.width + elementWidth > innerWidth) {
          // ??????????????????
          const surplusWidth = innerWidth - curRow.width
          element.width = surplusWidth
          element.height = elementHeight * surplusWidth / elementWidth
          metrics.width = element.width
          metrics.height = element.height
          metrics.boundingBoxDescent = element.height
        } else {
          metrics.width = elementWidth
          metrics.height = elementHeight
          metrics.boundingBoxDescent = elementHeight
        }
        metrics.boundingBoxAscent = 0
      } else if (element.type === ElementType.TABLE) {
        // ??????????????????
        this.tableParticle.computeRowColInfo(element)
        // ???????????????????????????
        const trList = element.trList!
        for (let t = 0; t < trList.length; t++) {
          const tr = trList[t]
          let maxTrHeight = 0
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            const rowList = this._computeRowList((td.width! - tdGap) * scale, td.value)
            const rowHeight = rowList.reduce((pre, cur) => pre + cur.height, 0)
            td.rowList = rowList
            // ?????????????????????????????????-??????????????????????????????
            const curTrHeight = (rowHeight + tdGap) / scale
            if (maxTrHeight < curTrHeight) {
              maxTrHeight = curTrHeight
            }
          }
          if (maxTrHeight > tr.height) {
            tr.height = maxTrHeight
          }
        }
        // ??????????????????????????????
        this.tableParticle.computeRowColInfo(element)
        // ?????????????????????
        const tableHeight = trList.reduce((pre, cur) => pre + cur.height, 0)
        const tableWidth = element.colgroup!.reduce((pre, cur) => pre + cur.width, 0)
        element.width = tableWidth
        element.height = tableHeight
        const elementWidth = tableWidth * scale
        const elementHeight = tableHeight * scale
        metrics.width = elementWidth
        metrics.height = elementHeight
        metrics.boundingBoxDescent = elementHeight
        metrics.boundingBoxAscent = 0
        // ??????????????????(????????????)
        const margins = this.getMargins()
        const height = this.getHeight()
        const marginHeight = margins[0] + margins[2]
        let curPagePreHeight = marginHeight
        for (let r = 0; r < rowList.length; r++) {
          const row = rowList[r]
          if (row.height + curPagePreHeight > height || rowList[r - 1]?.isPageBreak) {
            curPagePreHeight = marginHeight + row.height
          } else {
            curPagePreHeight += row.height
          }
        }
        // ??????????????????????????????
        const rowMarginHeight = rowMargin * 2
        if (curPagePreHeight + rowMarginHeight + elementHeight > height) {
          const trList = element.trList!
          // ???????????????????????????
          let deleteStart = 0
          let deleteCount = 0
          let preTrHeight = 0
          if (trList.length > 1) {
            for (let r = 0; r < trList.length; r++) {
              const tr = trList[r]
              if (curPagePreHeight + rowMarginHeight + preTrHeight + tr.height > height) {
                // ????????????
                if (element.colgroup?.length !== tr.tdList.length) {
                  deleteCount = 0
                }
                break
              } else {
                deleteStart = r + 1
                deleteCount = trList.length - deleteStart
                preTrHeight += tr.height
              }
            }
          }
          if (deleteCount) {
            const cloneTrList = trList.splice(deleteStart, deleteCount)
            const cloneTrHeight = cloneTrList.reduce((pre, cur) => pre + cur.height, 0)
            element.height -= cloneTrHeight
            metrics.height -= cloneTrHeight
            metrics.boundingBoxDescent -= cloneTrHeight
            // ??????????????????
            const cloneElement = deepClone(element)
            cloneElement.trList = cloneTrList
            cloneElement.id = getUUID()
            elementList.splice(i + 1, 0, cloneElement)
            // ???????????????????????????????????????
            const positionContext = this.position.getPositionContext()
            if (positionContext.isTable && positionContext.trIndex === deleteStart) {
              positionContext.index! += 1
              positionContext.trIndex = 0
              this.position.setPositionContext(positionContext)
            }
          }
        }
      } else if (element.type === ElementType.SEPARATOR) {
        element.width = innerWidth
        metrics.width = innerWidth
        metrics.height = this.options.defaultSize
        metrics.boundingBoxAscent = -rowMargin
        metrics.boundingBoxDescent = -rowMargin
      } else if (element.type === ElementType.PAGE_BREAK) {
        element.width = innerWidth
        metrics.width = innerWidth
        metrics.height = this.options.defaultSize
      } else if (
        element.type === ElementType.CHECKBOX ||
        element.controlComponent === ControlComponent.CHECKBOX
      ) {
        const { width, height, gap } = this.options.checkbox
        const elementWidth = (width + gap * 2) * scale
        element.width = elementWidth
        metrics.width = elementWidth
        metrics.height = height * scale
      } else if (element.type === ElementType.TAB) {
        metrics.width = defaultTabWidth * scale
        metrics.height = defaultSize * scale
        metrics.boundingBoxDescent = 0
        metrics.boundingBoxAscent = metrics.height
      } else {
        // ?????????????????????????????????
        const size = element.size || this.options.defaultSize
        if (element.type === ElementType.SUPERSCRIPT || element.type === ElementType.SUBSCRIPT) {
          element.actualSize = Math.ceil(size * 0.6)
        }
        metrics.height = (element.actualSize || size) * scale
        ctx.font = this._getFont(element)
        const fontMetrics = this.textParticle.measureText(ctx, element)
        metrics.width = fontMetrics.width * scale
        if (element.letterSpacing) {
          metrics.width += element.letterSpacing * scale
        }
        metrics.boundingBoxAscent = (element.value === ZERO ? defaultSize : fontMetrics.actualBoundingBoxAscent) * scale
        metrics.boundingBoxDescent = fontMetrics.actualBoundingBoxDescent * scale
        if (element.type === ElementType.SUPERSCRIPT) {
          metrics.boundingBoxAscent += metrics.height / 2
        } else if (element.type === ElementType.SUBSCRIPT) {
          metrics.boundingBoxDescent += metrics.height / 2
        }
      }
      const ascent = metrics.boundingBoxAscent + rowMargin
      const descent = metrics.boundingBoxDescent + rowMargin
      const height = ascent + descent
      const rowElement: IRowElement = Object.assign(element, {
        metrics,
        style: this._getFont(element, scale)
      })
      // ??????????????????
      const preElement = elementList[i - 1]
      if (
        (preElement && preElement.type === ElementType.TABLE)
        || curRow.width + metrics.width > innerWidth
        || (i !== 0 && element.value === ZERO)
      ) {
        rowList.push({
          width: metrics.width,
          height,
          elementList: [rowElement],
          ascent,
          rowFlex: rowElement.rowFlex,
          isPageBreak: element.type === ElementType.PAGE_BREAK
        })
      } else {
        curRow.width += metrics.width
        if (curRow.height < height) {
          curRow.height = height
          if (element.type === ElementType.IMAGE || element.type === ElementType.LATEX) {
            curRow.ascent = metrics.height
          } else {
            curRow.ascent = ascent
          }
        }
        curRow.elementList.push(rowElement)
      }
    }
    return rowList
  }

  private _drawRow(ctx: CanvasRenderingContext2D, payload: IDrawRowPayload): IDrawRowResult {
    const { positionList, rowList, pageNo, startX, startY, startIndex, innerWidth } = payload
    const { scale, tdPadding } = this.options
    const { isCrossRowCol, tableId } = this.range.getRange()
    const tdGap = tdPadding * 2
    let x = startX
    let y = startY
    let index = startIndex
    for (let i = 0; i < rowList.length; i++) {
      const curRow = rowList[i]
      // ???????????????????????????????????????????????????
      if (curRow.rowFlex && curRow.rowFlex !== RowFlex.LEFT) {
        if (curRow.rowFlex === RowFlex.CENTER) {
          x += (innerWidth - curRow.width) / 2
        } else {
          x += innerWidth - curRow.width
        }
      }
      // ??????td????????????
      const tablePreX = x
      const tablePreY = y
      // ??????????????????
      const rangeRecord: IElementFillRect = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
      let tableRangeElement: IElement | null = null
      for (let j = 0; j < curRow.elementList.length; j++) {
        const element = curRow.elementList[j]
        const metrics = element.metrics
        const offsetY = element.type === ElementType.IMAGE || element.type === ElementType.LATEX
          ? curRow.ascent - metrics.height
          : curRow.ascent
        const positionItem: IElementPosition = {
          pageNo,
          index,
          value: element.value,
          rowNo: i,
          metrics,
          ascent: offsetY,
          lineHeight: curRow.height,
          isLastLetter: j === curRow.elementList.length - 1,
          coordinate: {
            leftTop: [x, y],
            leftBottom: [x, y + curRow.height],
            rightTop: [x + metrics.width, y],
            rightBottom: [x + metrics.width, y + curRow.height]
          }
        }
        positionList.push(positionItem)
        // ????????????
        if (element.type === ElementType.IMAGE) {
          this.textParticle.complete()
          this.imageParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.LATEX) {
          this.textParticle.complete()
          this.laTexParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.TABLE) {
          if (isCrossRowCol) {
            rangeRecord.x = x
            rangeRecord.y = y
            tableRangeElement = element
          }
          this.tableParticle.render(ctx, element, x, y)
        } else if (element.type === ElementType.HYPERLINK) {
          this.textParticle.complete()
          this.hyperlinkParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.SUPERSCRIPT) {
          this.textParticle.complete()
          this.superscriptParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.SUBSCRIPT) {
          this.textParticle.complete()
          this.subscriptParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.SEPARATOR) {
          this.separatorParticle.render(ctx, element, x, y)
        } else if (element.type === ElementType.PAGE_BREAK) {
          if (this.mode !== EditorMode.CLEAN) {
            this.pageBreakParticle.render(ctx, element, x, y)
          }
        } else if (
          element.type === ElementType.CHECKBOX ||
          element.controlComponent === ControlComponent.CHECKBOX
        ) {
          this.textParticle.complete()
          this.checkboxParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.TAB) {
          this.textParticle.complete()
        } else {
          this.textParticle.record(ctx, element, x, y + offsetY)
        }
        // ???????????????
        if (element.underline) {
          this.underline.render(ctx, element.color!, x, y + curRow.height, metrics.width)
        }
        // ???????????????
        if (element.strikeout) {
          this.strikeout.render(ctx, x, y + curRow.height / 2, metrics.width)
        }
        // ????????????
        if (element.highlight) {
          this.highlight.render(ctx, element.highlight, x, y, metrics.width, curRow.height)
        }
        // ????????????
        const { startIndex, endIndex } = this.range.getRange()
        if (startIndex !== endIndex && startIndex <= index && index <= endIndex) {
          // ???????????????-??????????????????
          if (startIndex === index) {
            const nextElement = this.elementList[startIndex + 1]
            if (nextElement && nextElement.value === ZERO) {
              rangeRecord.x = x + metrics.width
              rangeRecord.y = y
              rangeRecord.height = curRow.height
              rangeRecord.width += this.options.rangeMinWidth
            }
          } else {
            const positionContext = this.position.getPositionContext()
            // ????????????????????????
            if (
              (!positionContext.isTable && !element.tdId)
              || positionContext.tdId === element.tdId
            ) {
              let rangeWidth = metrics.width
              // ??????????????????
              if (rangeWidth === 0 && curRow.elementList.length === 1) {
                rangeWidth = this.options.rangeMinWidth
              }
              // ??????????????????????????????
              if (!rangeRecord.width) {
                rangeRecord.x = x
                rangeRecord.y = y
                rangeRecord.height = curRow.height
              }
              rangeRecord.width += rangeWidth
            }
          }
        }
        index++
        x += metrics.width
        // ?????????????????????
        if (element.type === ElementType.TABLE) {
          for (let t = 0; t < element.trList!.length; t++) {
            const tr = element.trList![t]
            for (let d = 0; d < tr.tdList!.length; d++) {
              const td = tr.tdList[d]
              td.positionList = []
              const drawRowResult = this._drawRow(ctx, {
                positionList: td.positionList,
                rowList: td.rowList!,
                pageNo,
                startIndex: 0,
                startX: (td.x! + tdPadding) * scale + tablePreX,
                startY: td.y! * scale + tablePreY,
                innerWidth: (td.width! - tdGap) * scale
              })
              x = drawRowResult.x
              y = drawRowResult.y
            }
          }
          // ????????????x???y
          x = tablePreX
          y = tablePreY
        }
      }
      this.textParticle.complete()
      // ????????????
      if (rangeRecord.width && rangeRecord.height) {
        const { x, y, width, height } = rangeRecord
        this.range.render(ctx, x, y, width, height)
      }
      if (isCrossRowCol && tableRangeElement && tableRangeElement.id === tableId) {
        this.tableParticle.drawRange(ctx, tableRangeElement, x, y)
      }
      x = startX
      y += curRow.height
    }
    return { x, y, index }
  }

  private _drawPage(positionList: IElementPosition[], rowList: IRow[], pageNo: number) {
    const { pageMode } = this.options
    const margins = this.getMargins()
    const innerWidth = this.getInnerWidth()
    const ctx = this.ctxList[pageNo]
    const pageDom = this.pageList[pageNo]
    ctx.clearRect(0, 0, pageDom.width, pageDom.height)
    // ????????????
    this.background.render(ctx)
    // ???????????????
    const leftTopPoint: [number, number] = [margins[3], margins[0]]
    this.margin.render(ctx)
    // ????????????
    let x = leftTopPoint[0]
    let y = leftTopPoint[1]
    let index = positionList.length
    const drawRowResult = this._drawRow(ctx, {
      positionList,
      rowList,
      pageNo,
      startIndex: index,
      startX: x,
      startY: y,
      innerWidth
    })
    x = drawRowResult.x
    y = drawRowResult.y
    index = drawRowResult.index
    // ????????????
    this.header.render(ctx)
    // ????????????
    this.pageNumber.render(ctx, pageNo)
    // ??????????????????
    if (this.searchKeyword) {
      this.search.render(ctx, pageNo)
    }
    // ????????????
    if (pageMode !== PageMode.CONTINUITY && this.options.watermark.data) {
      this.waterMark.render(ctx)
    }
  }

  public render(payload?: IDrawOption) {
    const { pageMode } = this.options
    const {
      isSubmitHistory = true,
      isSetCursor = true,
      isComputeRowList = true
    } = payload || {}
    let { curIndex } = payload || {}
    const height = this.getHeight()
    const innerWidth = this.getInnerWidth()
    // ???????????????
    if (isComputeRowList) {
      this.rowList = this._computeRowList(innerWidth, this.elementList)
      if (this.searchKeyword) {
        this.search.compute(this.searchKeyword)
      }
    }
    // ????????????????????????
    this.cursor.recoveryCursor()
    this.position.setPositionList([])
    const positionList = this.position.getOriginalPositionList()
    // ????????????
    const margins = this.getMargins()
    const marginHeight = margins[0] + margins[2]
    let pageHeight = marginHeight
    let pageNo = 0
    const pageRowList: IRow[][] = [[]]
    if (pageMode === PageMode.CONTINUITY) {
      pageRowList[0] = this.rowList
      // ????????????
      pageHeight += this.rowList.reduce((pre, cur) => pre + cur.height, 0)
      const dpr = window.devicePixelRatio
      const pageDom = this.pageList[0]
      const pageDomHeight = Number(pageDom.style.height.replace('px', ''))
      if (pageHeight > pageDomHeight) {
        pageDom.style.height = `${pageHeight}px`
        pageDom.height = pageHeight * dpr
      } else {
        const reduceHeight = pageHeight < height ? height : pageHeight
        pageDom.style.height = `${reduceHeight}px`
        pageDom.height = reduceHeight * dpr
      }
    } else {
      for (let i = 0; i < this.rowList.length; i++) {
        const row = this.rowList[i]
        if (row.height + pageHeight > height || this.rowList[i - 1]?.isPageBreak) {
          pageHeight = marginHeight + row.height
          pageRowList.push([row])
          pageNo++
        } else {
          pageHeight += row.height
          pageRowList[pageNo].push(row)
        }
      }
    }
    // ????????????
    for (let i = 0; i < pageRowList.length; i++) {
      if (!this.pageList[i]) {
        this._createPage(i)
      }
      const rowList = pageRowList[i]
      this._drawPage(positionList, rowList, i)
    }
    // ???????????????
    setTimeout(() => {
      const curPageCount = pageRowList.length
      const prePageCount = this.pageList.length
      if (prePageCount > curPageCount) {
        const deleteCount = prePageCount - curPageCount
        this.ctxList.splice(curPageCount, deleteCount)
        this.pageList.splice(curPageCount, deleteCount)
          .forEach(page => page.remove())
      }
    })
    // ????????????
    if (isSetCursor) {
      const positionContext = this.position.getPositionContext()
      if (positionContext.isTable) {
        const { index, trIndex, tdIndex } = positionContext
        const tablePositionList = this.elementList[index!].trList?.[trIndex!].tdList[tdIndex!].positionList
        if (curIndex === undefined && tablePositionList) {
          curIndex = tablePositionList.length - 1
        }
        const tablePosition = tablePositionList?.[curIndex!]
        this.position.setCursorPosition(tablePosition || null)
      } else {
        if (curIndex === undefined) {
          curIndex = positionList.length - 1
        }
        this.position.setCursorPosition(positionList[curIndex!] || null)
      }
      this.cursor.drawCursor()
    }
    // ??????????????????undo???redo
    if (isSubmitHistory) {
      const self = this
      const oldElementList = deepClone(this.elementList)
      const { startIndex, endIndex } = this.range.getRange()
      const pageNo = this.pageNo
      const oldPositionContext = deepClone(this.position.getPositionContext())
      this.historyManager.execute(function () {
        self.setPageNo(pageNo)
        self.position.setPositionContext(oldPositionContext)
        self.elementList = deepClone(oldElementList)
        self.range.setRange(startIndex, endIndex)
        self.render({ curIndex, isSubmitHistory: false })
      })
    }

    // ??????????????????
    setTimeout(() => {
      // ??????????????????
      if (this.listener.pageSizeChange) {
        this.listener.pageSizeChange(pageRowList.length)
      }
      // ??????????????????
      if (this.listener.contentChange && isSubmitHistory) {
        this.listener.contentChange()
      }
    })
  }

}