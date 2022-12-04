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
import { ControlComponent, ImageDisplay } from '../../dataset/enum/Control'
import { formatElementList } from '../../utils/element'
import { WorkerManager } from '../worker/WorkerManager'
import { Previewer } from './particle/previewer/Previewer'
import { DateParticle } from './particle/date/DateParticle'
import { IMargin } from '../../interface/Margin'
import { BlockParticle } from './particle/block/BlockParticle'

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
  private dateParticle: DateParticle
  private separatorParticle: SeparatorParticle
  private pageBreakParticle: PageBreakParticle
  private superscriptParticle: SuperscriptParticle
  private subscriptParticle: SubscriptParticle
  private checkboxParticle: CheckboxParticle
  private blockParticle: BlockParticle
  private control: Control
  private workerManager: WorkerManager

  private rowList: IRow[]
  private painterStyle: IElementStyle | null
  private painterOptions: IPainterOptions | null
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
    this.dateParticle = new DateParticle(this)
    this.separatorParticle = new SeparatorParticle()
    this.pageBreakParticle = new PageBreakParticle(this)
    this.superscriptParticle = new SuperscriptParticle()
    this.subscriptParticle = new SubscriptParticle()
    this.checkboxParticle = new CheckboxParticle(this)
    this.blockParticle = new BlockParticle(this)
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

  public getMargins(): IMargin {
    return <IMargin>this.options.margins.map(m => m * this.options.scale)
  }

  public getOriginalMargins(): number[] {
    return this.options.margins
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

  public getDateParticle(): DateParticle {
    return this.dateParticle
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
    // 纸张大小重置
    if (payload === PageMode.PAGING) {
      const { height } = this.options
      const dpr = window.devicePixelRatio
      const canvas = this.pageList[0]
      canvas.style.height = `${height}px`
      canvas.height = height * dpr
    }
    this.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
    // 回调
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
    this.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
    if (this.listener.pageScaleChange) {
      this.listener.pageScaleChange(payload)
    }
  }

  public setPaperSize(width: number, height: number) {
    this.options.width = width
    this.options.height = height
    this.container.style.width = `${width}px`
    this.pageList.forEach(p => {
      p.width = width
      p.height = height
      p.style.width = `${width}px`
      p.style.height = `${height}px`
    })
    this.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
  }

  public setPaperMargin(payload: IMargin) {
    this.options.margins = payload
    this.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
  }

  public getValue(): IEditorResult {
    // 配置
    const { width, height, margins, watermark, header } = this.options
    // 数据
    const data = zipElementList(this.elementList)
    return {
      version,
      width,
      height,
      margins,
      header: header.data ? header : undefined,
      watermark: watermark.data ? watermark : undefined,
      data
    }
  }

  private _createPageContainer(): HTMLDivElement {
    // 容器宽度需跟随纸张宽度
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
    // 调整分辨率
    const dpr = window.devicePixelRatio
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.cursor = 'text'
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    // 缓存上下文
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
        // 图片超出尺寸后自适应
        const curRowWidth = element.imgDisplay === ImageDisplay.INLINE ? 0 : curRow.width
        if (curRowWidth + elementWidth > innerWidth) {
          // 计算剩余大小
          const surplusWidth = innerWidth - curRowWidth
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
        // 计算表格行列
        this.tableParticle.computeRowColInfo(element)
        // 计算表格内元素信息
        const trList = element.trList!
        for (let t = 0; t < trList.length; t++) {
          const tr = trList[t]
          let maxTrHeight = 0
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            const rowList = this._computeRowList((td.width! - tdGap) * scale, td.value)
            const rowHeight = rowList.reduce((pre, cur) => pre + cur.height, 0)
            td.rowList = rowList
            // 移除缩放导致的行高变化-渲染时会进行缩放调整
            const curTrHeight = (rowHeight + tdGap) / scale
            if (maxTrHeight < curTrHeight) {
              maxTrHeight = curTrHeight
            }
          }
          if (maxTrHeight > tr.height) {
            tr.height = maxTrHeight
          }
        }
        // 需要重新计算表格内值
        this.tableParticle.computeRowColInfo(element)
        // 计算出表格高度
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
        // 表格分页处理(拆分表格)
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
        // 表格高度超过页面高度
        const rowMarginHeight = rowMargin * 2
        if (curPagePreHeight + rowMarginHeight + elementHeight > height) {
          const trList = element.trList!
          // 计算需要移除的行数
          let deleteStart = 0
          let deleteCount = 0
          let preTrHeight = 0
          if (trList.length > 1) {
            for (let r = 0; r < trList.length; r++) {
              const tr = trList[r]
              if (curPagePreHeight + rowMarginHeight + preTrHeight + tr.height > height) {
                // 是否跨列
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
            // 追加拆分表格
            const cloneElement = deepClone(element)
            cloneElement.trList = cloneTrList
            cloneElement.id = getUUID()
            elementList.splice(i + 1, 0, cloneElement)
            // 换页的是当前行则改变上下文
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
      } else if (element.type === ElementType.BLOCK) {
        const innerWidth = this.getInnerWidth()
        if (!element.width) {
          metrics.width = innerWidth
        } else {
          const elementWidth = element.width * scale
          metrics.width = elementWidth > innerWidth ? innerWidth : elementWidth
        }
        metrics.height = element.height! * scale
        metrics.boundingBoxDescent = metrics.height
        metrics.boundingBoxAscent = 0
      } else {
        // 设置上下标真实字体尺寸
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
      // 超过限定宽度
      const preElement = elementList[i - 1]
      if (
        preElement?.type === ElementType.TABLE
        || preElement?.type === ElementType.BLOCK
        || element.type === ElementType.BLOCK
        || preElement?.imgDisplay === ImageDisplay.INLINE
        || element.imgDisplay === ImageDisplay.INLINE
        || curRow.width + metrics.width > innerWidth
        || (i !== 0 && element.value === ZERO)
      ) {
        // 两端对齐
        if (preElement?.rowFlex === RowFlex.ALIGNMENT && curRow.width + metrics.width > innerWidth) {
          const gap = (innerWidth - curRow.width) / curRow.elementList.length
          for (let e = 0; e < curRow.elementList.length; e++) {
            const el = curRow.elementList[e]
            el.metrics.width += gap
          }
          curRow.width = innerWidth
        }
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

  private _drawRichText(ctx: CanvasRenderingContext2D) {
    this.underline.render(ctx)
    this.strikeout.render(ctx)
    this.highlight.render(ctx)
    this.textParticle.complete()
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
      // 计算行偏移量（行居中、居右）
      if (curRow.rowFlex === RowFlex.CENTER) {
        x += (innerWidth - curRow.width) / 2
      } else if (curRow.rowFlex === RowFlex.RIGHT) {
        x += innerWidth - curRow.width
      }
      // 当前td所在位置
      const tablePreX = x
      const tablePreY = y
      // 选区绘制记录
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
        const offsetY =
          (element.imgDisplay !== ImageDisplay.INLINE && element.type === ElementType.IMAGE)
            || element.type === ElementType.LATEX
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
        // 元素绘制
        if (element.type === ElementType.IMAGE) {
          this._drawRichText(ctx)
          this.imageParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.LATEX) {
          this._drawRichText(ctx)
          this.laTexParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.TABLE) {
          if (isCrossRowCol) {
            rangeRecord.x = x
            rangeRecord.y = y
            tableRangeElement = element
          }
          this.tableParticle.render(ctx, element, x, y)
        } else if (element.type === ElementType.HYPERLINK) {
          this._drawRichText(ctx)
          this.hyperlinkParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.DATE) {
          this._drawRichText(ctx)
          this.dateParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.SUPERSCRIPT) {
          this._drawRichText(ctx)
          this.superscriptParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.SUBSCRIPT) {
          this._drawRichText(ctx)
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
          this._drawRichText(ctx)
          this.checkboxParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.TAB) {
          this._drawRichText(ctx)
        } else if (element.rowFlex === RowFlex.ALIGNMENT) {
          // 如果是两端对齐，因canvas目前不支持letterSpacing需单独绘制文本
          this.textParticle.record(ctx, element, x, y + offsetY)
          this._drawRichText(ctx)
        } else if (element.type === ElementType.BLOCK) {
          this._drawRichText(ctx)
          this.blockParticle.render(pageNo, element, x, y)
        } else {
          this.textParticle.record(ctx, element, x, y + offsetY)
        }
        // 下划线记录
        if (element.underline) {
          this.underline.recordFillInfo(ctx, x, y + curRow.height, metrics.width, 0, element.color)
        }
        // 删除线记录
        if (element.strikeout) {
          this.strikeout.recordFillInfo(ctx, x, y + curRow.height / 2, metrics.width)
        }
        // 元素高亮记录
        if (element.highlight) {
          this.highlight.recordFillInfo(ctx, x, y, metrics.width, curRow.height, element.highlight)
        }
        // 选区记录
        const { startIndex, endIndex } = this.range.getRange()
        if (startIndex !== endIndex && startIndex <= index && index <= endIndex) {
          // 从行尾开始-绘制最小宽度
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
            // 表格需限定上下文
            if (
              (!positionContext.isTable && !element.tdId)
              || positionContext.tdId === element.tdId
            ) {
              let rangeWidth = metrics.width
              // 最小选区宽度
              if (rangeWidth === 0 && curRow.elementList.length === 1) {
                rangeWidth = this.options.rangeMinWidth
              }
              // 记录第一次位置、行高
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
        // 绘制表格内元素
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
          // 恢复初始x、y
          x = tablePreX
          y = tablePreY
        }
      }
      // 绘制富文本及文字
      this._drawRichText(ctx)
      // 绘制选区
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

  private _clearPage(pageNo: number) {
    const ctx = this.ctxList[pageNo]
    const pageDom = this.pageList[pageNo]
    ctx.clearRect(0, 0, pageDom.width, pageDom.height)
    this.blockParticle.clear()
  }

  private _drawPage(positionList: IElementPosition[], rowList: IRow[], pageNo: number) {
    const { pageMode } = this.options
    const margins = this.getMargins()
    const innerWidth = this.getInnerWidth()
    const ctx = this.ctxList[pageNo]
    this._clearPage(pageNo)
    // 绘制背景
    this.background.render(ctx)
    // 绘制页边距
    const leftTopPoint: [number, number] = [margins[3], margins[0]]
    this.margin.render(ctx)
    // 渲染元素
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
    // 绘制页眉
    this.header.render(ctx)
    // 绘制页码
    this.pageNumber.render(ctx, pageNo)
    // 搜索匹配绘制
    if (this.search.getSearchKeyword()) {
      this.search.render(ctx, pageNo)
    }
    // 绘制水印
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
    // 计算行信息
    if (isComputeRowList) {
      this.rowList = this._computeRowList(innerWidth, this.elementList)
      const searchKeyword = this.search.getSearchKeyword()
      if (searchKeyword) {
        this.search.compute(searchKeyword)
      }
    }
    // 清除光标等副作用
    this.cursor.recoveryCursor()
    this.position.setPositionList([])
    const positionList = this.position.getOriginalPositionList()
    // 按页渲染
    const margins = this.getMargins()
    const marginHeight = margins[0] + margins[2]
    let pageHeight = marginHeight
    let pageNo = 0
    const pageRowList: IRow[][] = [[]]
    if (pageMode === PageMode.CONTINUITY) {
      pageRowList[0] = this.rowList
      // 重置高度
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
    // 绘制元素
    for (let i = 0; i < pageRowList.length; i++) {
      if (!this.pageList[i]) {
        this._createPage(i)
      }
      const rowList = pageRowList[i]
      this._drawPage(positionList, rowList, i)
    }
    // 移除多余页
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
    // 光标重绘
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
    // 历史记录用于undo、redo
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

    // 信息变动回调
    setTimeout(() => {
      // 页面尺寸改变
      if (this.listener.pageSizeChange) {
        this.listener.pageSizeChange(pageRowList.length)
      }
      // 文档内容改变
      if (this.listener.contentChange && isSubmitHistory) {
        this.listener.contentChange()
      }
    })
  }

}