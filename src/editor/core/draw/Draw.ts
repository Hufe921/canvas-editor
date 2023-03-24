import { version } from '../../../../package.json'
import { ZERO } from '../../dataset/constant/Common'
import { RowFlex } from '../../dataset/enum/Row'
import { IDrawOption, IDrawPagePayload, IDrawRowPayload, IPainterOptions } from '../../interface/Draw'
import { IEditorData, IEditorOption, IEditorResult } from '../../interface/Editor'
import { IElement, IElementMetrics, IElementFillRect, IElementStyle } from '../../interface/Element'
import { IRow, IRowElement } from '../../interface/Row'
import { deepClone, getUUID, nextTick } from '../../utils'
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
import { EditorComponent, EditorMode, EditorZone, PageMode, PaperDirection } from '../../dataset/enum/Editor'
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
import { EDITOR_COMPONENT, EDITOR_PREFIX } from '../../dataset/constant/Editor'
import { I18n } from '../i18n/I18n'
import { ImageObserver } from '../observer/ImageObserver'
import { Zone } from '../zone/Zone'

export class Draw {

  private container: HTMLDivElement
  private pageContainer: HTMLDivElement
  private pageList: HTMLCanvasElement[]
  private ctxList: CanvasRenderingContext2D[]
  private pageNo: number
  private mode: EditorMode
  private options: DeepRequired<IEditorOption>
  private position: Position
  private zone: Zone
  private headerElementList: IElement[]
  private elementList: IElement[]
  private footerElementList: IElement[]
  private listener: Listener

  private i18n: I18n
  private canvasEvent: CanvasEvent
  private globalEvent: GlobalEvent
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
  private scrollObserver: ScrollObserver
  private selectionObserver: SelectionObserver
  private imageObserver: ImageObserver

  private rowList: IRow[]
  private pageRowList: IRow[][]
  private painterStyle: IElementStyle | null
  private painterOptions: IPainterOptions | null
  private visiblePageNoList: number[]
  private intersectionPageNo: number
  private lazyRenderIntersectionObserver: IntersectionObserver | null

  constructor(
    rootContainer: HTMLElement,
    options: DeepRequired<IEditorOption>,
    data: IEditorData,
    listener: Listener
  ) {
    this.container = this._wrapContainer(rootContainer)
    this.pageList = []
    this.ctxList = []
    this.pageNo = 0
    this.mode = options.mode
    this.options = options
    this.headerElementList = data.header || []
    this.elementList = data.main
    this.footerElementList = data.footer || []
    this.listener = listener

    this._formatContainer()
    this.pageContainer = this._createPageContainer()
    this._createPage(0)

    this.i18n = new I18n()
    this.historyManager = new HistoryManager()
    this.position = new Position(this)
    this.zone = new Zone(this)
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

    this.scrollObserver = new ScrollObserver(this)
    this.selectionObserver = new SelectionObserver()
    this.imageObserver = new ImageObserver()

    this.canvasEvent = new CanvasEvent(this)
    this.cursor = new Cursor(this, this.canvasEvent)
    this.canvasEvent.register()
    this.globalEvent = new GlobalEvent(this, this.canvasEvent)
    this.globalEvent.register()

    this.workerManager = new WorkerManager(this)

    this.rowList = []
    this.pageRowList = []
    this.painterStyle = null
    this.painterOptions = null
    this.visiblePageNoList = []
    this.intersectionPageNo = 0
    this.lazyRenderIntersectionObserver = null

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

  public getOriginalWidth(): number {
    const { paperDirection, width, height } = this.options
    return paperDirection === PaperDirection.VERTICAL ? width : height
  }

  public getOriginalHeight(): number {
    const { paperDirection, width, height } = this.options
    return paperDirection === PaperDirection.VERTICAL ? height : width
  }

  public getWidth(): number {
    return Math.floor(this.getOriginalWidth() * this.options.scale)
  }

  public getHeight(): number {
    return Math.floor(this.getOriginalHeight() * this.options.scale)
  }

  public getMainHeight(): number {
    const pageHeight = this.getHeight()
    const margins = this.getMargins()
    const extraHeight = this.header.getExtraHeight()
    return pageHeight - margins[0] - margins[2] - extraHeight
  }

  public getCanvasWidth(pageNo = -1): number {
    const page = this.getPage(pageNo)
    return page.width
  }

  public getCanvasHeight(pageNo = -1): number {
    const page = this.getPage(pageNo)
    return page.height
  }

  public getInnerWidth(): number {
    const width = this.getWidth()
    const margins = this.getMargins()
    return width - margins[1] - margins[3]
  }

  public getOriginalInnerWidth(): number {
    const width = this.getOriginalWidth()
    const margins = this.getOriginalMargins()
    return width - margins[1] - margins[3]
  }

  public getMargins(): IMargin {
    return <IMargin>this.getOriginalMargins().map(m => m * this.options.scale)
  }

  public getOriginalMargins(): number[] {
    const { margins, paperDirection } = this.options
    return paperDirection === PaperDirection.VERTICAL
      ? margins
      : [margins[1], margins[2], margins[3], margins[0]]
  }

  public getPageGap(): number {
    return this.options.pageGap * this.options.scale
  }

  public getPageNumberBottom(): number {
    const { pageNumber: { bottom }, scale } = this.options
    return bottom * scale
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

  public getPage(pageNo = -1): HTMLCanvasElement {
    return this.pageList[~pageNo ? pageNo : this.pageNo]
  }

  public getPageList(): HTMLCanvasElement[] {
    return this.pageList
  }

  public getRowList(): IRow[] {
    return this.rowList
  }

  public getPageRowList(): IRow[][] {
    return this.pageRowList
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

  public getZone(): Zone {
    return this.zone
  }

  public getRange(): RangeManager {
    return this.range
  }

  public getHeaderElementList(): IElement[] {
    return this.headerElementList
  }

  public getTableElementList(sourceElementList: IElement[]): IElement[] {
    const positionContext = this.position.getPositionContext()
    const { index, trIndex, tdIndex } = positionContext
    return sourceElementList[index!].trList![trIndex!].tdList[tdIndex!].value
  }

  public getElementList(): IElement[] {
    const positionContext = this.position.getPositionContext()
    const elementList = this.getOriginalElementList()
    return positionContext.isTable
      ? this.getTableElementList(elementList)
      : elementList
  }

  public getMainElementList(): IElement[] {
    const positionContext = this.position.getPositionContext()
    return positionContext.isTable
      ? this.getTableElementList(this.elementList)
      : this.elementList
  }

  public getOriginalElementList() {
    const zoneManager = this.getZone()
    return zoneManager.isHeaderActive()
      ? this.header.getElementList()
      : this.elementList
  }

  public getOriginalMainElementList(): IElement[] {
    return this.elementList
  }

  public getFooterElementList(): IElement[] {
    return this.footerElementList
  }

  public insertElementList(payload: IElement[]) {
    if (!payload.length) return
    const isPartRangeInControlOutside = this.control.isPartRangeInControlOutside()
    if (isPartRangeInControlOutside) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    formatElementList(payload, {
      isHandleFirstElement: false,
      editorOptions: this.options
    })
    let curIndex = -1
    // 判断是否在控件内
    const activeControl = this.control.getActiveControl()
    if (activeControl && !this.control.isRangInPostfix()) {
      curIndex = activeControl.setValue(payload)
    } else {
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
      curIndex = startIndex + payload.length
    }
    if (~curIndex) {
      this.range.setRange(curIndex, curIndex)
      this.render({
        curIndex
      })
    }
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

  public getHeader(): Header {
    return this.header
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

  public getImageObserver(): ImageObserver {
    return this.imageObserver
  }

  public getI18n(): I18n {
    return this.i18n
  }

  public getRowCount(): number {
    return this.rowList.length
  }

  public async getDataURL(): Promise<string[]> {
    this.render({
      isLazy: false,
      isCompute: false,
      isSetCursor: false,
      isSubmitHistory: false
    })
    await this.imageObserver.allSettled()
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
      // canvas尺寸发生变化，上下文被重置
      this._initPageContext(this.ctxList[0])
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
    const dpr = window.devicePixelRatio
    this.options.scale = payload
    const width = this.getWidth()
    const height = this.getHeight()
    this.container.style.width = `${width}px`
    this.pageList.forEach((p, i) => {
      p.width = width * dpr
      p.height = height * dpr
      p.style.width = `${width}px`
      p.style.height = `${height}px`
      p.style.marginBottom = `${this.getPageGap()}px`
      this._initPageContext(this.ctxList[i])
    })
    this.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
    if (this.listener.pageScaleChange) {
      this.listener.pageScaleChange(payload)
    }
  }

  public setPageDevicePixel() {
    const dpr = window.devicePixelRatio
    const width = this.getWidth()
    const height = this.getHeight()
    this.pageList.forEach((p, i) => {
      p.width = width * dpr
      p.height = height * dpr
      this._initPageContext(this.ctxList[i])
    })
    this.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
  }

  public setPaperSize(width: number, height: number) {
    const dpr = window.devicePixelRatio
    this.options.width = width
    this.options.height = height
    this.container.style.width = `${width}px`
    this.pageList.forEach((p, i) => {
      p.width = width * dpr
      p.height = height * dpr
      p.style.width = `${width}px`
      p.style.height = `${height}px`
      this._initPageContext(this.ctxList[i])
    })
    this.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
  }

  public setPaperDirection(payload: PaperDirection) {
    const dpr = window.devicePixelRatio
    this.options.paperDirection = payload
    const width = this.getWidth()
    const height = this.getHeight()
    this.container.style.width = `${width}px`
    this.pageList.forEach((p, i) => {
      p.width = width * dpr
      p.height = height * dpr
      p.style.width = `${width}px`
      p.style.height = `${height}px`
      this._initPageContext(this.ctxList[i])
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
    const { width, height, margins, watermark } = this.options
    // 数据
    const data: IEditorData = {
      header: zipElementList(this.headerElementList),
      main: zipElementList(this.elementList)
    }
    return {
      version,
      width,
      height,
      margins,
      watermark: watermark.data ? watermark : undefined,
      data
    }
  }

  private _wrapContainer(rootContainer: HTMLElement): HTMLDivElement {
    const container = document.createElement('div')
    rootContainer.append(container)
    return container
  }

  private _formatContainer() {
    // 容器宽度需跟随纸张宽度
    this.container.style.position = 'relative'
    this.container.style.width = `${this.getWidth()}px`
    this.container.setAttribute(EDITOR_COMPONENT, EditorComponent.MAIN)
  }

  private _createPageContainer(): HTMLDivElement {
    const pageContainer = document.createElement('div')
    pageContainer.classList.add(`${EDITOR_PREFIX}-page-container`)
    this.container.append(pageContainer)
    return pageContainer
  }

  private _createPage(pageNo: number) {
    const width = this.getWidth()
    const height = this.getHeight()
    const canvas = document.createElement('canvas')
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    canvas.style.display = 'block'
    canvas.style.backgroundColor = '#ffffff'
    canvas.style.marginBottom = `${this.getPageGap()}px`
    canvas.setAttribute('data-index', String(pageNo))
    this.pageContainer.append(canvas)
    // 调整分辨率
    const dpr = window.devicePixelRatio
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.cursor = 'text'
    const ctx = canvas.getContext('2d')!
    // 初始化上下文配置
    this._initPageContext(ctx)
    // 缓存上下文
    this.pageList.push(canvas)
    this.ctxList.push(ctx)
  }

  private _initPageContext(ctx: CanvasRenderingContext2D) {
    const dpr = window.devicePixelRatio
    ctx.scale(dpr, dpr)
    // 重置以下属性是因部分浏览器(chrome)会应用css样式
    ctx.letterSpacing = '0px'
    ctx.wordSpacing = '0px'
    ctx.direction = 'ltr'
  }

  private _getFont(el: IElement, scale = 1): string {
    const { defaultSize, defaultFont } = this.options
    const font = el.font || defaultFont
    const size = el.actualSize || el.size || defaultSize
    return `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${size * scale}px ${font}`
  }

  public computeRowList(innerWidth: number, elementList: IElement[]) {
    const { defaultSize, defaultRowMargin, scale, tdPadding, defaultTabWidth } = this.options
    const defaultBasicRowMarginHeight = this.getDefaultBasicRowMarginHeight()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const rowList: IRow[] = []
    if (elementList.length) {
      rowList.push({
        width: 0,
        height: 0,
        ascent: 0,
        elementList: [],
        startIndex: 0,
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
        const tdGap = tdPadding * 2
        // 计算表格行列
        this.tableParticle.computeRowColInfo(element)
        // 计算表格内元素信息
        const trList = element.trList!
        for (let t = 0; t < trList.length; t++) {
          const tr = trList[t]
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            const rowList = this.computeRowList((td.width! - tdGap) * scale, td.value)
            const rowHeight = rowList.reduce((pre, cur) => pre + cur.height, 0)
            td.rowList = rowList
            // 移除缩放导致的行高变化-渲染时会进行缩放调整
            const curTdHeight = (rowHeight + tdGap) / scale
            if (td.height! < curTdHeight) {
              // 内容高度大于当前单元格高度需增加
              const extraHeight = curTdHeight - td.height!
              const changeTr = trList[t + td.rowspan - 1]
              changeTr.height += extraHeight
              changeTr.tdList.forEach(changeTd => {
                changeTd.height! += extraHeight
              })
            }
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
        const headerExtraHeight = this.header.getExtraHeight()
        const marginHeight = margins[0] + margins[2] + headerExtraHeight
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
        const rowMarginHeight = rowMargin * 2 * scale
        if (curPagePreHeight + rowMarginHeight + elementHeight > height) {
          const trList = element.trList!
          // 计算需要移除的行数
          let deleteStart = 0
          let deleteCount = 0
          let preTrHeight = 0
          if (trList.length > 1) {
            for (let r = 0; r < trList.length; r++) {
              const tr = trList[r]
              const trHeight = tr.height * scale
              if (curPagePreHeight + rowMarginHeight + preTrHeight + trHeight > height) {
                // 是否跨列
                if (element.colgroup?.length !== tr.tdList.length) {
                  deleteCount = 0
                }
                break
              } else {
                deleteStart = r + 1
                deleteCount = trList.length - deleteStart
                preTrHeight += trHeight
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
        metrics.height = defaultSize
        metrics.boundingBoxAscent = -rowMargin
        metrics.boundingBoxDescent = -rowMargin
      } else if (element.type === ElementType.PAGE_BREAK) {
        element.width = innerWidth
        metrics.width = innerWidth
        metrics.height = defaultSize
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
        const size = element.size || defaultSize
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
          startIndex: i,
          elementList: [rowElement],
          ascent,
          rowFlex: elementList[i + 1]?.rowFlex,
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

  private _computePageList(): IRow[][] {
    const pageRowList: IRow[][] = [[]]
    const { pageMode } = this.options
    const height = this.getHeight()
    const margins = this.getMargins()
    const headerExtraHeight = this.header.getExtraHeight()
    const marginHeight = margins[0] + margins[2] + headerExtraHeight
    let pageHeight = marginHeight
    let pageNo = 0
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
      this._initPageContext(this.ctxList[0])
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
    return pageRowList
  }

  private _drawRichText(ctx: CanvasRenderingContext2D) {
    this.underline.render(ctx)
    this.strikeout.render(ctx)
    this.highlight.render(ctx)
    this.textParticle.complete()
  }

  public drawRow(ctx: CanvasRenderingContext2D, payload: IDrawRowPayload) {
    const { rowList, pageNo, elementList, positionList, startIndex, zone } = payload
    const { scale, tdPadding } = this.options
    const { isCrossRowCol, tableId } = this.range.getRange()
    let index = startIndex
    for (let i = 0; i < rowList.length; i++) {
      const curRow = rowList[i]
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
        // 当前元素位置信息
        const {
          ascent: offsetY,
          coordinate: {
            leftTop: [x, y]
          }
        } = positionList[curRow.startIndex + j]
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
        const preElement = curRow.elementList[j - 1]
        // 下划线记录
        if (element.underline) {
          this.underline.recordFillInfo(ctx, x, y + curRow.height, metrics.width, 0, element.color)
        } else if (preElement?.underline) {
          this.underline.render(ctx)
        }
        // 删除线记录
        if (element.strikeout) {
          this.strikeout.recordFillInfo(ctx, x, y + curRow.height / 2, metrics.width)
        } else if (preElement?.strikeout) {
          this.strikeout.render(ctx)
        }
        // 元素高亮记录
        if (element.highlight) {
          // 高亮元素相连需立即绘制，并记录下一元素坐标
          if (preElement && preElement.highlight && preElement.highlight !== element.highlight) {
            this.highlight.render(ctx)
          }
          this.highlight.recordFillInfo(ctx, x, y, metrics.width, curRow.height, element.highlight)
        } else if (preElement?.highlight) {
          this.highlight.render(ctx)
        }
        // 选区记录
        const { zone: currentZone, startIndex, endIndex } = this.range.getRange()
        if (currentZone === zone && startIndex !== endIndex && startIndex <= index && index <= endIndex) {
          // 从行尾开始-绘制最小宽度
          if (startIndex === index) {
            const nextElement = elementList[startIndex + 1]
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
        // 绘制表格内元素
        if (element.type === ElementType.TABLE) {
          const tdGap = tdPadding * 2
          for (let t = 0; t < element.trList!.length; t++) {
            const tr = element.trList![t]
            for (let d = 0; d < tr.tdList!.length; d++) {
              const td = tr.tdList[d]
              this.drawRow(ctx, {
                elementList: td.value,
                positionList: td.positionList!,
                rowList: td.rowList!,
                pageNo,
                startIndex: 0,
                innerWidth: (td.width! - tdGap) * scale,
                zone
              })
            }
          }
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
        const { coordinate: { leftTop: [x, y] } } = positionList[curRow.startIndex]
        this.tableParticle.drawRange(ctx, tableRangeElement, x, y)
      }
    }
  }

  private _clearPage(pageNo: number) {
    const ctx = this.ctxList[pageNo]
    const pageDom = this.pageList[pageNo]
    ctx.clearRect(0, 0, pageDom.width, pageDom.height)
    this.blockParticle.clear()
  }

  private _drawPage(payload: IDrawPagePayload) {
    const { elementList, positionList, rowList, pageNo } = payload
    const { inactiveAlpha, pageMode } = this.options
    const innerWidth = this.getInnerWidth()
    const ctx = this.ctxList[pageNo]
    // 判断当前激活区域-激活页眉时主题元素透明度降低
    ctx.globalAlpha = this.zone.isHeaderActive() ? inactiveAlpha : 1
    this._clearPage(pageNo)
    // 绘制背景
    this.background.render(ctx)
    // 绘制页边距
    this.margin.render(ctx, pageNo)
    // 渲染元素
    const index = rowList[0].startIndex
    this.drawRow(ctx, {
      elementList,
      positionList,
      rowList,
      pageNo,
      startIndex: index,
      innerWidth,
      zone: EditorZone.MAIN
    })
    // 绘制页眉
    this.header.render(ctx, pageNo)
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

  private _lazyRender() {
    const positionList = this.position.getOriginalMainPositionList()
    const elementList = this.getOriginalMainElementList()
    this.lazyRenderIntersectionObserver?.disconnect()
    this.lazyRenderIntersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Number((<HTMLCanvasElement>entry.target).dataset.index)
          this.header.render(this.ctxList[index], index)
          this._drawPage({
            elementList,
            positionList,
            rowList: this.pageRowList[index],
            pageNo: index
          })
        }
      })
    })
    this.pageList.forEach(el => {
      this.lazyRenderIntersectionObserver!.observe(el)
    })
  }

  private _immediateRender() {
    const positionList = this.position.getOriginalMainPositionList()
    const elementList = this.getOriginalMainElementList()
    for (let i = 0; i < this.pageRowList.length; i++) {
      this._drawPage({
        elementList,
        positionList,
        rowList: this.pageRowList[i],
        pageNo: i
      })
    }
  }

  public render(payload?: IDrawOption) {
    const { pageMode } = this.options
    const {
      isSubmitHistory = true,
      isSetCursor = true,
      isCompute = true,
      isLazy = true
    } = payload || {}
    let { curIndex } = payload || {}
    const innerWidth = this.getInnerWidth()
    // 计算文档信息
    if (isCompute) {
      // 页眉信息
      this.header.compute()
      // 行信息
      this.rowList = this.computeRowList(innerWidth, this.elementList)
      // 页面信息
      this.pageRowList = this._computePageList()
      // 位置信息
      this.position.computePositionList()
      // 搜索信息
      const searchKeyword = this.search.getSearchKeyword()
      if (searchKeyword) {
        this.search.compute(searchKeyword)
      }
    }
    // 清除光标等副作用
    this.imageObserver.clearAll()
    this.cursor.recoveryCursor()
    // 创建纸张
    for (let i = 0; i < this.pageRowList.length; i++) {
      if (!this.pageList[i]) {
        this._createPage(i)
      }
    }
    // 移除多余页
    const curPageCount = this.pageRowList.length
    const prePageCount = this.pageList.length
    if (prePageCount > curPageCount) {
      const deleteCount = prePageCount - curPageCount
      this.ctxList.splice(curPageCount, deleteCount)
      this.pageList.splice(curPageCount, deleteCount)
        .forEach(page => page.remove())
    }
    // 绘制元素
    // 连续页因为有高度的变化会导致canvas渲染空白，需立即渲染，否则会出现闪动
    if (isLazy && pageMode === PageMode.PAGING) {
      this._lazyRender()
    } else {
      this._immediateRender()
    }
    const positionContext = this.position.getPositionContext()
    // 光标重绘
    if (isSetCursor) {
      const positionList = this.position.getPositionList()
      if (positionContext.isTable) {
        const { index, trIndex, tdIndex } = positionContext
        const elementList = this.getOriginalElementList()
        const tablePositionList = elementList[index!].trList?.[trIndex!].tdList[tdIndex!].positionList
        if (curIndex === undefined && tablePositionList) {
          curIndex = tablePositionList.length - 1
        }
        const tablePosition = tablePositionList?.[curIndex!]
        this.position.setCursorPosition(tablePosition || null)
      } else {
        this.position.setCursorPosition(curIndex !== undefined ? positionList[curIndex] : null)
      }
      this.cursor.drawCursor()
    }
    // 历史记录用于undo、redo
    if (isSubmitHistory) {
      const self = this
      const oldElementList = deepClone(this.elementList)
      const oldHeaderElementList = deepClone(this.header.getElementList())
      const { startIndex, endIndex } = this.range.getRange()
      const pageNo = this.pageNo
      const oldPositionContext = deepClone(positionContext)
      const zone = this.zone.getZone()
      this.historyManager.execute(function () {
        self.zone.setZone(zone)
        self.setPageNo(pageNo)
        self.position.setPositionContext(oldPositionContext)
        self.header.setElementList(oldHeaderElementList)
        self.elementList = deepClone(oldElementList)
        self.range.setRange(startIndex, endIndex)
        self.render({ curIndex, isSubmitHistory: false })
      })
    }
    // 信息变动回调
    nextTick(() => {
      // 表格工具重新渲染
      if (isCompute && !this.isReadonly() && positionContext.isTable) {
        this.tableTool.render()
      }
      // 页眉指示器重新渲染
      if (isCompute && this.zone.isHeaderActive()) {
        this.zone.drawHeaderZoneIndicator()
      }
      // 页面尺寸改变
      if (this.listener.pageSizeChange) {
        this.listener.pageSizeChange(this.pageRowList.length)
      }
      // 文档内容改变
      if (this.listener.contentChange && isSubmitHistory) {
        this.listener.contentChange()
      }
    })
  }

  public destroy() {
    this.container.remove()
    this.globalEvent.removeEvent()
    this.scrollObserver.removeEvent()
    this.selectionObserver.removeEvent()
  }

}