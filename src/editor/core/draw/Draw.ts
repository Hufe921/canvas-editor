import { version } from '../../../../package.json'
import { ZERO } from '../../dataset/constant/Common'
import { RowFlex } from '../../dataset/enum/Row'
import {
  IAppendElementListOption,
  IComputeRowListPayload,
  IDrawFloatPayload,
  IDrawOption,
  IDrawPagePayload,
  IDrawRowPayload,
  IGetImageOption,
  IGetOriginValueOption,
  IGetValueOption,
  IPainterOption
} from '../../interface/Draw'
import {
  IEditorData,
  IEditorOption,
  IEditorResult,
  ISetValueOption
} from '../../interface/Editor'
import {
  IElement,
  IElementMetrics,
  IElementFillRect,
  IElementStyle,
  ISpliceElementListOption,
  IInsertElementListOption
} from '../../interface/Element'
import { IMarkElementListDeletedOption } from '../../interface/Trace'
import { IRow, IRowElement } from '../../interface/Row'
import { IColumnLayout, IColumnOption } from '../../interface/Column'
import { ColumnManager } from './column/ColumnManager'
import {
  LayoutHostAdapter,
  type ParagraphSpan
} from '../text-engine-host'
import { mergeVisualRects } from '../text-engine'
import { containsShapingScript } from '../text-engine/utils/scriptFont'
import type { VisualRect } from '../text-engine/types'
import { deepClone, nextTick } from '../../utils'
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
import { TraceType } from '../../dataset/enum/Trace'
import { ImageParticle } from './particle/ImageParticle'
import { LaTexParticle } from './particle/latex/LaTexParticle'
import { TextParticle } from './particle/TextParticle'
import { PageNumber } from './frame/PageNumber'
import { ScrollObserver } from '../observer/ScrollObserver'
import { SelectionObserver } from '../observer/SelectionObserver'
import { TableParticle } from './particle/table/TableParticle'
import { TablePaging } from './particle/table/TablePaging'
import { TableTool } from './particle/table/TableTool'
import { Ruler } from './ruler/Ruler'
import { HyperlinkParticle } from './particle/HyperlinkParticle'
import { TraceParticle } from './particle/TraceParticle'
import { LabelParticle } from './particle/LabelParticle'
import { Header } from './frame/Header'
import { SuperscriptParticle } from './particle/SuperscriptParticle'
import { SubscriptParticle } from './particle/SubscriptParticle'
import { SeparatorParticle } from './particle/SeparatorParticle'
import { PageBreakParticle } from './particle/PageBreakParticle'
import { Watermark } from './frame/Watermark'
import { WatermarkLayer } from '../../dataset/enum/Watermark'
import { TextDirection } from '../../dataset/enum/TextDirection'
import {
  EditorComponent,
  EditorMode,
  EditorZone,
  PageMode,
  PaperDirection,
  WordBreak
} from '../../dataset/enum/Editor'
import { Control } from './control/Control'
import { CascadeManager } from '../cascade/CascadeManager'
import { Validate } from '../validate/Validate'
import {
  deleteSurroundElementList,
  getIsBlockElement,
  getSlimCloneElementList,
  pickSurroundElementList,
  zipElementList
} from '../../utils/element'
import { CheckboxParticle } from './particle/CheckboxParticle'
import { RadioParticle } from './particle/RadioParticle'
import { DeepRequired, IPadding } from '../../interface/Common'
import {
  ControlComponent,
  ControlIndentation
} from '../../dataset/enum/Control'
import { formatElementList } from '../../utils/element'
import { shrinkColgroupToWidth } from '../../utils/table'
import { WorkerManager } from '../worker/WorkerManager'
import { Previewer } from './particle/previewer/Previewer'
import { DateParticle } from './particle/date/DateParticle'
import { IMargin } from '../../interface/Margin'
import { BlockParticle } from './particle/block/BlockParticle'
import { EDITOR_COMPONENT, EDITOR_PREFIX } from '../../dataset/constant/Editor'
import { I18n } from '../i18n/I18n'
import { ImageObserver } from '../observer/ImageObserver'
import { Zone } from '../zone/Zone'
import { Footer } from './frame/Footer'
import {
  IMAGE_ELEMENT_TYPE,
  TEXTLIKE_ELEMENT_TYPE
} from '../../dataset/constant/Element'
import { ListParticle } from './particle/ListParticle'
import { Placeholder } from './frame/Placeholder'
import { EventBus } from '../event/eventbus/EventBus'
import { EventBusMap } from '../../interface/EventBus'
import { Group } from './interactive/Group'
import { Override } from '../override/Override'
import { FlexDirection, ImageDisplay } from '../../dataset/enum/Common'
import {
  PUNCTUATION_REG,
  WHITE_SPACE_REG
} from '../../dataset/constant/Regular'
import { LineBreakParticle } from './particle/LineBreakParticle'
import { WhiteSpaceParticle } from './particle/WhiteSpaceParticle'
import { MouseObserver } from '../observer/MouseObserver'
import { LineNumber } from './frame/LineNumber'
import { PageBorder } from './frame/PageBorder'
import { ITd } from '../../interface/table/Td'
import { Actuator } from '../actuator/Actuator'
import { TableOperate } from './particle/table/TableOperate'
import { Area } from './interactive/Area'
import { Badge } from './frame/Badge'
import { Graffiti } from './graffiti/Graffiti'
import { Magnifier } from './interactive/Magnifier'
import { Accessibility } from '../accessibility/Accessibility'

export class Draw {
  private container: HTMLDivElement
  private pageContainer: HTMLDivElement
  private pageList: HTMLCanvasElement[]
  private ctxList: CanvasRenderingContext2D[]
  private pageNo: number
  private renderCount: number
  private pagePixelRatio: number | null
  private mode: EditorMode
  private options: DeepRequired<IEditorOption>
  private position: Position
  private zone: Zone
  private elementList: IElement[]
  private listener: Listener
  private eventBus: EventBus<EventBusMap>
  private override: Override

  private i18n: I18n
  private canvasEvent: CanvasEvent
  private globalEvent: GlobalEvent
  private cursor: Cursor
  private range: RangeManager
  private margin: Margin
  private background: Background
  private badge: Badge
  private magnifier: Magnifier
  private search: Search
  private group: Group
  private area: Area
  private underline: Underline
  private strikeout: Strikeout
  private highlight: Highlight
  private historyManager: HistoryManager
  private previewer: Previewer
  private imageParticle: ImageParticle
  private laTexParticle: LaTexParticle
  private textParticle: TextParticle
  private tableParticle: TableParticle
  private tablePaging: TablePaging
  private tableTool: TableTool
  private tableOperate: TableOperate
  private pageNumber: PageNumber
  private lineNumber: LineNumber
  private waterMark: Watermark
  private placeholder: Placeholder
  private header: Header
  private footer: Footer
  private hyperlinkParticle: HyperlinkParticle
  private traceParticle: TraceParticle
  private labelParticle: LabelParticle
  private dateParticle: DateParticle
  private separatorParticle: SeparatorParticle
  private pageBreakParticle: PageBreakParticle
  private superscriptParticle: SuperscriptParticle
  private subscriptParticle: SubscriptParticle
  private checkboxParticle: CheckboxParticle
  private radioParticle: RadioParticle
  private blockParticle: BlockParticle
  private listParticle: ListParticle
  private lineBreakParticle: LineBreakParticle
  private whiteSpaceParticle: WhiteSpaceParticle
  private control: Control
  private cascadeManager: CascadeManager
  private validate: Validate
  private pageBorder: PageBorder
  private workerManager: WorkerManager
  private scrollObserver: ScrollObserver
  private selectionObserver: SelectionObserver
  private imageObserver: ImageObserver
  private graffiti: Graffiti
  private accessibility: Accessibility

  private LETTER_REG: RegExp
  private WORD_LIKE_REG: RegExp
  private rowList: IRow[]
  private pageRowList: IRow[][]
  private painterStyle: IElementStyle | null
  private painterOptions: IPainterOption | null
  private visiblePageNoList: number[]
  private intersectionPageNo: number
  private lazyRenderIntersectionObserver: IntersectionObserver | null
  private printModeData: Required<Omit<IEditorData, 'graffiti'>> | null
  private controlMinWidthPlaceholderElementListSet: WeakSet<IElement[]>
  private columnManager: ColumnManager
  private ruler: Ruler
  private layoutHostAdapter: LayoutHostAdapter
  private legacyRtlWarned: boolean

  constructor(
    rootContainer: HTMLElement,
    options: DeepRequired<IEditorOption>,
    data: IEditorData,
    listener: Listener,
    eventBus: EventBus<EventBusMap>,
    override: Override
  ) {
    this.container = this._wrapContainer(rootContainer)
    this.pageList = []
    this.ctxList = []
    this.pageNo = 0
    this.renderCount = 0
    this.pagePixelRatio = null
    this.mode = options.mode
    this.options = options
    this.elementList = data.main
    this.listener = listener
    this.eventBus = eventBus
    this.override = override

    this._formatContainer()
    this.pageContainer = this._createPageContainer()
    this._createPage(0)

    this.i18n = new I18n(options.locale)
    this.historyManager = new HistoryManager(this)
    this.position = new Position(this)
    this.zone = new Zone(this)
    this.range = new RangeManager(this)
    this.margin = new Margin(this)
    this.background = new Background(this)
    this.badge = new Badge(this)
    this.magnifier = new Magnifier(this)
    this.search = new Search(this)
    this.group = new Group(this)
    this.area = new Area(this)
    this.underline = new Underline(this)
    this.strikeout = new Strikeout(this)
    this.highlight = new Highlight(this)
    this.previewer = new Previewer(this)
    this.imageParticle = new ImageParticle(this)
    this.laTexParticle = new LaTexParticle(this)
    this.textParticle = new TextParticle(this)
    this.tableParticle = new TableParticle(this)
    this.tablePaging = new TablePaging(this)
    this.tableTool = new TableTool(this)
    this.tableOperate = new TableOperate(this)
    this.pageNumber = new PageNumber(this)
    this.lineNumber = new LineNumber(this)
    this.waterMark = new Watermark(this)
    this.placeholder = new Placeholder(this)
    this.header = new Header(this, data.header)
    this.footer = new Footer(this, data.footer)
    this.hyperlinkParticle = new HyperlinkParticle(this)
    this.traceParticle = new TraceParticle(this)
    this.labelParticle = new LabelParticle(this)
    this.dateParticle = new DateParticle(this)
    this.separatorParticle = new SeparatorParticle(this)
    this.pageBreakParticle = new PageBreakParticle(this)
    this.superscriptParticle = new SuperscriptParticle()
    this.subscriptParticle = new SubscriptParticle()
    this.checkboxParticle = new CheckboxParticle(this)
    this.radioParticle = new RadioParticle(this)
    this.blockParticle = new BlockParticle(this)
    this.listParticle = new ListParticle(this)
    this.lineBreakParticle = new LineBreakParticle(this)
    this.whiteSpaceParticle = new WhiteSpaceParticle(this)
    this.control = new Control(this)
    this.cascadeManager = new CascadeManager(this)
    this.validate = new Validate(this)
    this.pageBorder = new PageBorder(this)
    this.graffiti = new Graffiti(this, data.graffiti)
    this.columnManager = new ColumnManager(this)
    this.ruler = new Ruler(this)
    this.legacyRtlWarned = false
    this.layoutHostAdapter = new LayoutHostAdapter(
      () => this.options,
      () => ({
        isDesignMode: this.isDesignMode(),
        isAreaHideDisabled: this.isAreaHideDisabled(),
        isTraceHidden: (el: IElement) => this.traceParticle.isTraceHidden(el)
      })
    )
    // HarfBuzz path: warm up fonts/WASM without blocking first paint
    if (this.layoutHostAdapter.isHarfBuzzMode()) {
      this.layoutHostAdapter.ensureReady().then(() => {
        this.render({ isSetCursor: false, isSubmitHistory: false })
      })
    }

    this.scrollObserver = new ScrollObserver(this)
    this.selectionObserver = new SelectionObserver(this)
    this.imageObserver = new ImageObserver()
    new MouseObserver(this)

    this.canvasEvent = new CanvasEvent(this)
    this.cursor = new Cursor(this, this.canvasEvent)
    this.canvasEvent.register()
    this.globalEvent = new GlobalEvent(this, this.canvasEvent)
    this.globalEvent.register()

    this.workerManager = new WorkerManager(this)
    new Actuator(this)
    this.accessibility = new Accessibility(this)

    const { letterClass } = options
    this.LETTER_REG = new RegExp(`[${letterClass.join('')}]`)
    this.WORD_LIKE_REG = new RegExp(
      `${letterClass.map(letter => `[^${letter}][${letter}]`).join('|')}`
    )
    this.rowList = []
    this.pageRowList = []
    this.painterStyle = null
    this.painterOptions = null
    this.visiblePageNoList = []
    this.intersectionPageNo = 0
    this.lazyRenderIntersectionObserver = null
    this.printModeData = null
    this.controlMinWidthPlaceholderElementListSet = new WeakSet()

    // 打印模式优先设置打印数据
    if (this.mode === EditorMode.PRINT) {
      this.setPrintData()
    }
    this.render({
      isInit: true,
      isSetCursor: false,
      isFirstRender: true
    })
    // 级联规则初始化全量执行
    this.cascadeManager.executeAll()
  }

  // 设置打印数据
  public setPrintData() {
    this.printModeData = {
      header: this.header.getElementList(),
      main: this.elementList,
      footer: this.footer.getElementList()
    }
    // 过滤控件辅助元素
    const clonePrintModeData = deepClone(this.printModeData)
    const editorDataKeys: (keyof Omit<IEditorData, 'graffiti'>)[] = [
      'header',
      'main',
      'footer'
    ]
    editorDataKeys.forEach(key => {
      clonePrintModeData[key] = this.control.filterAssistElement(
        clonePrintModeData[key]
      )
    })
    this.setEditorData(clonePrintModeData)
  }

  // 还原打印数据
  public clearPrintData() {
    if (this.printModeData) {
      this.setEditorData(this.printModeData)
      this.printModeData = null
    }
  }

  public getLetterReg(): RegExp {
    return this.LETTER_REG
  }

  public getMode(): EditorMode {
    return this.mode
  }

  public setMode(payload: EditorMode) {
    if (this.mode === payload) return
    // 设置打印模式
    if (payload === EditorMode.PRINT) {
      this.setPrintData()
    }
    // 取消打印模式
    if (this.mode === EditorMode.PRINT) {
      this.clearPrintData()
    }
    this.clearSideEffect()
    this.range.clearRange()
    this.mode = payload
    this.options.mode = payload
    this.render({
      isSetCursor: false,
      isSubmitHistory: false
    })
  }

  public isReadonly() {
    if (this.area.getActiveAreaInfo()?.area?.mode) {
      return this.area.isReadonly()
    }
    switch (this.mode) {
      case EditorMode.DESIGN:
        return false
      case EditorMode.READONLY:
      case EditorMode.PRINT:
      case EditorMode.GRAFFITI:
      case EditorMode.TRACE:
        return true
      case EditorMode.FORM:
        return !this.control.getIsRangeWithinControl()
      default:
        return false
    }
  }

  public isDisabled() {
    if (this.mode === EditorMode.DESIGN) return false
    const { startIndex, endIndex } = this.range.getRange()
    const elementList = this.getElementList()
    // 优先判断表格单元格
    if (this.getTd()?.disabled) return true
    if (startIndex === endIndex) {
      const startElement = elementList[startIndex]
      const nextElement = elementList[startIndex + 1]
      return !!(
        (startElement?.title?.disabled &&
          nextElement?.title?.disabled &&
          startElement.titleId === nextElement.titleId) ||
        (startElement?.control?.disabled &&
          nextElement?.control?.disabled &&
          startElement.controlId === nextElement.controlId)
      )
    }
    const selectionElementList = elementList.slice(startIndex + 1, endIndex + 1)
    return selectionElementList.some(
      element => element.title?.disabled || element.control?.disabled
    )
  }

  public isDesignMode() {
    return this.mode === EditorMode.DESIGN
  }

  public isPrintMode() {
    return this.mode === EditorMode.PRINT
  }

  public isAreaHideDisabled() {
    return (
      this.isDesignMode() ||
      (this.isPrintMode() &&
        this.options.modeRule[EditorMode.PRINT].areaHideDisabled)
    )
  }

  public isGraffitiMode() {
    return this.mode === EditorMode.GRAFFITI
  }

  public isTraceMode() {
    return this.mode === EditorMode.TRACE
  }

  public setTraceEnabled(enabled: boolean) {
    // 留痕查看模式下不允许切换记录开关，避免查看态偷偷改数据
    if (this.mode === EditorMode.TRACE) return
    if (!this.options.trace.disabled === enabled) return
    this.options.trace.disabled = !enabled
    this.render({
      isSetCursor: false,
      isSubmitHistory: false
    })
  }

  public setRulerEnabled(enabled: boolean) {
    if (!this.options.ruler.disabled === enabled) return
    this.ruler.setEnabled(enabled)
  }

  // 删除元素：trace 启用时软删除（保留在原位仅打标），否则硬删除
  public deleteElementList(
    elementList: IElement[],
    index: number,
    count: number = 1,
    options?: IMarkElementListDeletedOption
  ) {
    if (!this.options.trace.disabled) {
      return this.traceParticle.markElementListDeleted(
        elementList.slice(index, index + count),
        options
      )
    } else {
      this.spliceElementList(elementList, index, count, undefined, {
        isIgnoreDeletedRule: options?.isIgnoreDeletedRule
      })
      return []
    }
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
    return pageHeight - this.getMainOuterHeight()
  }

  public getMainOuterHeight(pageNo?: number): number {
    const margins = this.getMargins()
    const headerExtraHeight = this.header.getExtraHeight(pageNo)
    const footerExtraHeight = this.footer.getExtraHeight(pageNo)
    return margins[0] + margins[2] + headerExtraHeight + footerExtraHeight
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

  public getColumnLayout(): IColumnLayout | null {
    return this.columnManager.getLayout()
  }

  public setColumnConfig(config: IColumnOption | null): void {
    if (this.options.pageMode === PageMode.CONTINUITY) return
    this.columnManager.setConfig(config)
  }

  public getOriginalInnerWidth(): number {
    const width = this.getOriginalWidth()
    const margins = this.getOriginalMargins()
    return width - margins[1] - margins[3]
  }

  public getContextInnerWidth(): number {
    const positionContext = this.position.getPositionContext()
    if (positionContext.isTable) {
      const elementList = this.getOriginalElementList()
      const td = this.position.getTableTdByContext(elementList, positionContext)
      const tdPadding = this.getTdPadding()
      return td!.width! - tdPadding[1] - tdPadding[3]
    }
    // 分栏布局下按栏宽计算可用宽度（栏宽为缩放值，还原为未缩放单位）
    const columnLayout = this.getColumnLayout()
    if (columnLayout && columnLayout.count > 1) {
      return columnLayout.width / this.options.scale
    }
    return this.getOriginalInnerWidth()
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

  public getOriginalPageGap(): number {
    return this.options.pageGap
  }

  public getPageNumberBottom(): number {
    const {
      pageNumber: { bottom },
      scale
    } = this.options
    return bottom * scale
  }

  public getMarginIndicatorSize(): number {
    return this.options.marginIndicatorSize * this.options.scale
  }

  public getDefaultBasicRowMarginHeight(): number {
    return this.options.defaultBasicRowMarginHeight * this.options.scale
  }

  public getHighlightMarginHeight(): number {
    return this.options.highlightMarginHeight * this.options.scale
  }

  public getTdPadding(): IPadding {
    const {
      table: { tdPadding },
      scale
    } = this.options
    return <IPadding>tdPadding.map(m => m * scale)
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
    if (this.eventBus.isSubscribe('visiblePageNoListChange')) {
      this.eventBus.emit('visiblePageNoListChange', this.visiblePageNoList)
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
    if (this.eventBus.isSubscribe('intersectionPageNoChange')) {
      this.eventBus.emit('intersectionPageNoChange', this.intersectionPageNo)
    }
  }

  public getPageNo(): number {
    return this.pageNo
  }

  public setPageNo(payload: number) {
    this.pageNo = payload
  }

  public getRenderCount(): number {
    return this.renderCount
  }

  public getPage(pageNo = -1): HTMLCanvasElement {
    return this.pageList[~pageNo ? pageNo : this.pageNo]
  }

  public getPageList(): HTMLCanvasElement[] {
    return this.pageList
  }

  public getPageCount(): number {
    return this.pageList.length
  }

  public getTableRowList(sourceElementList: IElement[]): IRow[] {
    const positionContext = this.position.getPositionContext()
    return this.position.getTableTdByContext(
      sourceElementList,
      positionContext
    )!.rowList!
  }

  public getOriginalRowList() {
    const zoneManager = this.getZone()
    if (zoneManager.isHeaderActive()) {
      return this.header.getRowList()
    }
    if (zoneManager.isFooterActive()) {
      return this.footer.getRowList()
    }
    return this.rowList
  }

  public getRowList(): IRow[] {
    const positionContext = this.position.getPositionContext()
    return positionContext.isTable
      ? this.getTableRowList(this.getOriginalElementList())
      : this.getOriginalRowList()
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

  public getGroup(): Group {
    return this.group
  }

  public getArea(): Area {
    return this.area
  }

  public getBadge(): Badge {
    return this.badge
  }

  public getMagnifier(): Magnifier {
    return this.magnifier
  }

  public getHistoryManager(): HistoryManager {
    return this.historyManager
  }

  public getPosition(): Position {
    return this.position
  }

  public getLayoutHostAdapter(): LayoutHostAdapter {
    return this.layoutHostAdapter
  }

  public getZone(): Zone {
    return this.zone
  }

  public getColumnManager(): ColumnManager {
    return this.columnManager
  }

  public getRange(): RangeManager {
    return this.range
  }

  public getLineBreakParticle(): LineBreakParticle {
    return this.lineBreakParticle
  }

  public getTextParticle(): TextParticle {
    return this.textParticle
  }

  public getStrikeout(): Strikeout {
    return this.strikeout
  }

  public getUnderline(): Underline {
    return this.underline
  }

  public getSubscriptParticle(): SubscriptParticle {
    return this.subscriptParticle
  }

  public getSuperscriptParticle(): SuperscriptParticle {
    return this.superscriptParticle
  }

  public getHeaderElementList(): IElement[] {
    return this.header.getElementList()
  }

  public getTableElementList(sourceElementList: IElement[]): IElement[] {
    const positionContext = this.position.getPositionContext()
    return (
      this.position.getTableTdByContext(sourceElementList, positionContext)
        ?.value || []
    )
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
    if (zoneManager.isHeaderActive()) {
      return this.getHeaderElementList()
    }
    if (zoneManager.isFooterActive()) {
      return this.getFooterElementList()
    }
    return this.elementList
  }

  public getOriginalMainElementList(): IElement[] {
    return this.elementList
  }

  public getFooterElementList(): IElement[] {
    return this.footer.getElementList()
  }

  public getTd(): ITd | null {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return null
    return this.position.getTableTdByContext(
      this.getOriginalElementList(),
      positionContext
    )
  }

  public insertElementList(
    payload: IElement[],
    options: IInsertElementListOption = {}
  ) {
    if (!payload.length || !this.range.getIsCanInput()) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    const { isSubmitHistory = true } = options
    formatElementList(payload, {
      isHandleFirstElement: false,
      editorOptions: this.options
    })
    this.traceParticle.markElementListInserted(payload)
    let curIndex = -1
    // 判断是否在控件内
    let activeControl = this.control.getActiveControl()
    // 光标在控件内如果当前没有被激活，需要手动激活
    if (!activeControl && this.control.getIsRangeWithinControl()) {
      this.control.initControl()
      activeControl = this.control.getActiveControl()
    }
    if (activeControl && this.control.getIsRangeWithinControl()) {
      curIndex = activeControl.setValue(payload, undefined, {
        isIgnoreDisabledRule: true
      })
      this.control.emitControlContentChange()
    } else {
      const elementList = this.getElementList()
      const isCollapsed = startIndex === endIndex
      const start = startIndex + 1
      if (!isCollapsed) {
        this.deleteElementList(elementList, start, endIndex - startIndex)
      }
      this.spliceElementList(elementList, start, 0, payload)
      curIndex = startIndex + payload.length
      // 列表前如有换行符则删除-因为列表内已存在
      const preElement = elementList[start - 1]
      if (
        payload[0].listId &&
        preElement &&
        !preElement.listId &&
        preElement?.value === ZERO &&
        (!preElement.type || preElement.type === ElementType.TEXT)
      ) {
        elementList.splice(startIndex, 1)
        curIndex -= 1
      }
    }
    if (~curIndex) {
      this.range.setRange(curIndex, curIndex)
      this.render({
        curIndex,
        isSubmitHistory
      })
    }
  }

  public appendElementList(
    elementList: IElement[],
    options: IAppendElementListOption = {}
  ) {
    if (!elementList.length) return
    formatElementList(elementList, {
      isHandleFirstElement: false,
      editorOptions: this.options
    })
    this.traceParticle.markElementListInserted(elementList)
    let curIndex: number
    const { isPrepend, isSubmitHistory = true } = options
    if (isPrepend) {
      this.elementList.splice(1, 0, ...elementList)
      curIndex = elementList.length
    } else {
      this.elementList.push(...elementList)
      curIndex = this.elementList.length - 1
    }
    this.range.setRange(curIndex, curIndex)
    this.render({
      curIndex,
      isSubmitHistory
    })
  }

  public spliceElementList(
    elementList: IElement[],
    start: number,
    deleteCount: number,
    items?: IElement[],
    options?: ISpliceElementListOption
  ) {
    const { isIgnoreDeletedRule = false } = options || {}
    const { group, modeRule } = this.options
    if (deleteCount > 0) {
      // 当最后元素与开始元素列表信息不一致时：清除当前列表信息
      const endIndex = start + deleteCount
      const endElement = elementList[endIndex]
      const endElementListId = endElement?.listId
      if (
        endElementListId &&
        elementList[start - 1]?.listId !== endElementListId
      ) {
        let startIndex = endIndex
        while (startIndex < elementList.length) {
          const curElement = elementList[startIndex]
          if (
            curElement.listId !== endElementListId ||
            curElement.value === ZERO
          ) {
            break
          }
          delete curElement.listId
          delete curElement.listType
          delete curElement.listStyle
          startIndex++
        }
      }
      // 非明确忽略删除规则 && 非设计模式 && 非光标在控件内(控件内控制) =》 校验删除规则
      if (
        !isIgnoreDeletedRule &&
        !this.isDesignMode() &&
        !this.control.getIsRangeWithinControl()
      ) {
        const tdDeletable = this.getTd()?.deletable
        let deleteIndex = endIndex - 1
        while (deleteIndex >= start) {
          const deleteElement = elementList[deleteIndex]
          // 删除痕迹不可移除
          if (
            deleteElement?.trace?.length &&
            deleteElement.trace[deleteElement.trace.length - 1].type ===
              TraceType.DELETED
          ) {
            deleteIndex--
            continue
          }
          if (
            deleteElement?.hide ||
            deleteElement?.control?.hide ||
            deleteElement?.area?.hide ||
            (tdDeletable !== false &&
              deleteElement?.control?.deletable !== false &&
              (!deleteElement.controlId ||
                this.mode !== EditorMode.FORM ||
                !modeRule[this.mode].controlDeletableDisabled) &&
              deleteElement?.title?.deletable !== false &&
              (group.deletable !== false || !deleteElement.groupIds?.length) &&
              (deleteElement?.area?.deletable !== false ||
                deleteElement?.areaIndex !== 0))
          ) {
            elementList.splice(deleteIndex, 1)
          }
          deleteIndex--
        }
      } else {
        // 留痕删除记录不可移除
        let deleteIndex = endIndex - 1
        while (deleteIndex >= start) {
          const deleteElement = elementList[deleteIndex]
          if (
            !deleteElement?.trace?.length ||
            deleteElement.trace[deleteElement.trace.length - 1].type !==
              TraceType.DELETED
          ) {
            elementList.splice(deleteIndex, 1)
          }
          deleteIndex--
        }
      }
    }
    // 循环添加，避免使用解构影响性能
    if (items?.length) {
      for (let i = 0; i < items.length; i++) {
        elementList.splice(start + i, 0, items[i])
      }
    }
  }

  public getCanvasEvent(): CanvasEvent {
    return this.canvasEvent
  }

  public getGlobalEvent(): GlobalEvent {
    return this.globalEvent
  }

  public getListener(): Listener {
    return this.listener
  }

  public getEventBus(): EventBus<EventBusMap> {
    return this.eventBus
  }

  public getOverride(): Override {
    return this.override
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

  public getRuler(): Ruler {
    return this.ruler
  }

  public getTableOperate(): TableOperate {
    return this.tableOperate
  }

  public getTableParticle(): TableParticle {
    return this.tableParticle
  }

  public getBlockParticle(): BlockParticle {
    return this.blockParticle
  }

  public getHeader(): Header {
    return this.header
  }

  public getFooter(): Footer {
    return this.footer
  }

  public getHyperlinkParticle(): HyperlinkParticle {
    return this.hyperlinkParticle
  }

  public getTraceParticle(): TraceParticle {
    return this.traceParticle
  }

  public getDateParticle(): DateParticle {
    return this.dateParticle
  }

  public getListParticle(): ListParticle {
    return this.listParticle
  }

  public getCheckboxParticle(): CheckboxParticle {
    return this.checkboxParticle
  }

  public getRadioParticle(): RadioParticle {
    return this.radioParticle
  }

  public getControl(): Control {
    return this.control
  }

  public getCascadeManager(): CascadeManager {
    return this.cascadeManager
  }

  public getValidate(): Validate {
    return this.validate
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

  public getGraffiti(): Graffiti {
    return this.graffiti
  }

  public getAccessibility(): Accessibility {
    return this.accessibility
  }

  public getRowCount(): number {
    return this.getRowList().length
  }

  public async getDataURL(payload: IGetImageOption = {}): Promise<string[]> {
    const { pixelRatio, mode, snapDomFunction } = payload
    // 放大像素比
    if (pixelRatio) {
      this.setPagePixelRatio(pixelRatio)
    }
    // 不同模式
    const currentMode = this.mode
    const isSwitchMode = !!mode && currentMode !== mode
    if (isSwitchMode) {
      this.setMode(mode)
    }
    this.render({
      isLazy: false,
      isCompute: false,
      isSetCursor: false,
      isSubmitHistory: false
    })
    await this.imageObserver.allSettled()
    // 叠加iframe图片
    if (snapDomFunction) {
      await this.blockParticle.drawIframeToPage(this.pageList, snapDomFunction)
    }
    const dataUrlList = this.pageList.map(c => c.toDataURL())
    // 还原
    if (pixelRatio) {
      this.setPagePixelRatio(null)
    }
    if (isSwitchMode) {
      this.setMode(currentMode)
    }
    return dataUrlList
  }

  public getPainterStyle(): IElementStyle | null {
    return this.painterStyle && Object.keys(this.painterStyle).length
      ? this.painterStyle
      : null
  }

  public getPainterOptions(): IPainterOption | null {
    return this.painterOptions
  }

  public setPainterStyle(
    payload: IElementStyle | null,
    options?: IPainterOption
  ) {
    this.painterStyle = payload
    this.painterOptions = options || null
    if (this.getPainterStyle()) {
      this.pageList.forEach(c => (c.style.cursor = 'copy'))
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

  public getIsPagingMode(): boolean {
    return this.options.pageMode === PageMode.PAGING
  }

  public setPageMode(payload: PageMode) {
    if (!payload || this.options.pageMode === payload) return
    this.options.pageMode = payload
    // 纸张大小重置
    if (payload === PageMode.PAGING) {
      const { height } = this.options
      const dpr = this.getPagePixelRatio()
      const canvas = this.pageList[0]
      canvas.style.height = `${height}px`
      canvas.height = height * dpr
      // canvas尺寸发生变化，上下文被重置
      this._initPageContext(this.ctxList[0])
    } else {
      // 连页模式：移除懒加载监听&清空页眉页脚计算数据
      this._disconnectLazyRender()
      this.header.recovery()
      this.footer.recovery()
      this.zone.setZone(EditorZone.MAIN)
    }
    const { startIndex } = this.range.getRange()
    const isCollapsed = this.range.getIsCollapsed()
    this.render({
      isSetCursor: true,
      curIndex: startIndex,
      isSubmitHistory: false
    })
    // 重新定位避免事件监听丢失
    if (!isCollapsed) {
      this.cursor.drawCursor({
        isShow: false
      })
    }
    // 回调
    setTimeout(() => {
      if (this.listener.pageModeChange) {
        this.listener.pageModeChange(payload)
      }
      if (this.eventBus.isSubscribe('pageModeChange')) {
        this.eventBus.emit('pageModeChange', payload)
      }
    })
  }

  public setPageScale(payload: number) {
    const dpr = this.getPagePixelRatio()
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
    const cursorPosition = this.position.getCursorPosition()
    this.render({
      isSubmitHistory: false,
      isSetCursor: !!cursorPosition,
      curIndex: cursorPosition?.index
    })
    if (this.listener.pageScaleChange) {
      this.listener.pageScaleChange(payload)
    }
    if (this.eventBus.isSubscribe('pageScaleChange')) {
      this.eventBus.emit('pageScaleChange', payload)
    }
  }

  public getPagePixelRatio(): number {
    return this.pagePixelRatio || window.devicePixelRatio
  }

  public setPagePixelRatio(payload: number | null) {
    if (
      (!this.pagePixelRatio && payload === window.devicePixelRatio) ||
      payload === this.pagePixelRatio
    ) {
      return
    }
    this.pagePixelRatio = payload
    this.setPageDevicePixel()
  }

  public setPageDevicePixel() {
    const dpr = this.getPagePixelRatio()
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
    this.options.width = width
    this.options.height = height
    const dpr = this.getPagePixelRatio()
    const realWidth = this.getWidth()
    const realHeight = this.getHeight()
    this.container.style.width = `${realWidth}px`
    this.pageList.forEach((p, i) => {
      p.width = realWidth * dpr
      p.height = realHeight * dpr
      p.style.width = `${realWidth}px`
      p.style.height = `${realHeight}px`
      this._initPageContext(this.ctxList[i])
    })
    this.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
  }

  public setPaperDirection(payload: PaperDirection) {
    const dpr = this.getPagePixelRatio()
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

  public getOriginValue(
    options: IGetOriginValueOption = {}
  ): Required<IEditorData> {
    const { pageNo } = options
    let mainElementList = this.elementList
    if (
      Number.isInteger(pageNo) &&
      pageNo! >= 0 &&
      pageNo! < this.pageRowList.length
    ) {
      mainElementList = this.pageRowList[pageNo!].flatMap(
        row => row.elementList
      )
    }
    // 同步block的最新数据
    this.blockParticle.update()
    const data: Required<IEditorData> = {
      header: this.getHeaderElementList(),
      main: mainElementList,
      footer: this.getFooterElementList(),
      graffiti: this.graffiti.getValue()
    }
    return data
  }

  public getValue(options: IGetValueOption = {}): IEditorResult {
    const originData = this.getOriginValue(options)
    const { extraPickAttrs } = options
    const data: IEditorData = {
      header: zipElementList(originData.header, {
        extraPickAttrs
      }),
      main: zipElementList(originData.main, {
        extraPickAttrs,
        isClassifyArea: true
      }),
      footer: zipElementList(originData.footer, {
        extraPickAttrs
      }),
      graffiti: originData.graffiti
    }
    return {
      version,
      data,
      options: deepClone(this.options)
    }
  }

  public setValue(payload: Partial<IEditorData>, options?: ISetValueOption) {
    const { header, main, footer } = deepClone(payload)
    if (!header && !main && !footer) return
    const { isSetCursor = false } = options || {}
    const pageComponentData = [header, main, footer]
    pageComponentData.forEach(data => {
      if (!data) return
      formatElementList(data, {
        editorOptions: this.options,
        isForceCompensation: true
      })
    })
    this.setEditorData({
      header,
      main,
      footer
    })
    // 渲染&计算&清空历史记录
    this.historyManager.recovery()
    const curIndex = isSetCursor
      ? main?.length
        ? main.length - 1
        : 0
      : undefined
    if (curIndex !== undefined) {
      this.range.setRange(curIndex, curIndex)
    }
    this.render({
      curIndex,
      isSetCursor,
      isFirstRender: true
    })
    // 数据替换后级联规则全量重算
    this.cascadeManager.executeAll()
  }

  public setEditorData(payload: Partial<Omit<IEditorData, 'graffiti'>>) {
    const { header, main, footer } = payload
    if (header) {
      this.header.setElementList(header)
    }
    if (main) {
      this.elementList = main
    }
    if (footer) {
      this.footer.setElementList(footer)
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
    this.syncUiDirection()
  }

  /**
   * Sync LTR/RTL mode class for chrome that opts in via CSS.
   * 不得给画布容器设 dir=rtl：绝对定位光标（left+right）在 RTL 包含块下会忽略 left，
   * 导致光标绘制/碰撞与正文物理坐标错位。正文命中只认 canvas 坐标。
   */
  public syncUiDirection() {
    const isRtl = this.options.direction === TextDirection.RTL
    this.container.removeAttribute('dir')
    this.container.classList.toggle(`${EDITOR_PREFIX}-ui-rtl`, isRtl)
    // 标尺是壳层 chrome，切换方向后需立即按新方向镜像重绘
    // （构造期 _formatContainer 早于 ruler 初始化，用可选链跳过）
    this.ruler?.refresh()
  }

  private _createPageContainer(): HTMLDivElement {
    const pageContainer = document.createElement('div')
    pageContainer.classList.add(`${EDITOR_PREFIX}-page-container`)
    // 锁定物理方向，避免祖先 dir 影响页内绝对定位与点击坐标
    pageContainer.setAttribute('dir', 'ltr')
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
    const dpr = this.getPagePixelRatio()
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
    const dpr = this.getPagePixelRatio()
    ctx.scale(dpr, dpr)
    // 重置以下属性是因部分浏览器(chrome)会应用css样式
    ctx.letterSpacing = '0px'
    ctx.wordSpacing = '0px'
    ctx.direction = 'ltr'
  }

  public getElementFont(el: IElement, scale = 1): string {
    const { defaultSize, defaultFont } = this.options
    const font = el.font || defaultFont
    const size = el.actualSize || el.size || defaultSize
    return `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${
      size * scale
    }px ${font}`
  }

  public getElementSize(el: IElement) {
    return el.actualSize || el.size || this.options.defaultSize
  }

  public getElementRowMargin(el: IElement) {
    const {
      defaultSize,
      defaultBasicRowMarginHeight,
      defaultRowMargin,
      scale
    } = this.options
    // 字体在12-30之间，行间距不变，小于12按比例缩小，大于30按比例放大
    const fontSize = el.size || defaultSize
    let ratio = 1
    if (fontSize < 12) {
      ratio = fontSize / 12
    } else if (fontSize > 30) {
      ratio = 1 + (fontSize - 30) / 30
    }
    return (
      defaultBasicRowMarginHeight *
      ratio *
      (el.rowMargin ?? defaultRowMargin) *
      scale
    )
  }

  /**
   * 块级/浮层嵌入：引擎段扫描会跳过，须单独走 legacy 插行。
   * 默认 IMAGE/LATEX、已展开 CONTROL chrome 走段内 object/text，勿列入。
   */
  private _isEngineHostBlockedElement(el: IElement): boolean {
    const type = el.type
    if (
      type === ElementType.TABLE ||
      type === ElementType.BLOCK ||
      type === ElementType.AREA
    ) {
      return true
    }
    if (type === ElementType.IMAGE || type === ElementType.LATEX) {
      const d = el.imgDisplay
      // INLINE 与默认一致走引擎内联（与周边文本同行，RTL 下不分离）；
      // 仅浮层/环绕图强制 legacy 单独处理
      return (
        d === ImageDisplay.SURROUND ||
        d === ImageDisplay.FLOAT_TOP ||
        d === ImageDisplay.FLOAT_BOTTOM
      )
    }
    return false
  }

  /** 清除引擎投影到 IElement 上的布局字段，避免回退 legacy 后误用 visualLeft / left */
  private _clearStaleEngineLayout(elementList: IElement[]) {
    for (let i = 0; i < elementList.length; i++) {
      const el = elementList[i] as IElement & {
        visualLeft?: number
        visualIndex?: number
        clusterStart?: number
        clusterEnd?: number
        left?: number
      }
      delete el.visualLeft
      delete el.visualIndex
      delete el.clusterStart
      delete el.clusterEnd
      // legacy minWidth 残留的 left 会让下划线 x-left 落到边距
      delete el.left
      if (el.type === ElementType.TABLE && el.trList) {
        for (const tr of el.trList) {
          for (const td of tr.tdList) {
            if (td.value?.length) this._clearStaleEngineLayout(td.value)
          }
        }
      }
    }
  }

  /** text-engine rows always draw via GlyphRenderer (Arabic run fillText joining). */
  private rowUsesGlyphRenderer(row: IRow): boolean {
    return !!row.engineLine?.glyphs?.length
  }

  private getRowElementPosition(
    row: IRow,
    positionList: import('../../interface/Element').IElementPosition[],
    element: IElement & { sourceIndex?: number },
    elementOffset: number
  ) {
    if (row.fragmentPosition) return row.fragmentPosition
    const sourceIndex = element.sourceIndex
    const fallbackIndex = row.startIndex + elementOffset
    return (
      (sourceIndex !== undefined ? positionList[sourceIndex] : undefined) ||
      positionList[fallbackIndex] ||
      (sourceIndex !== undefined
        ? positionList.find(item => item?.index === sourceIndex)
        : undefined)
    )
  }

  /**
   * 弹层（超链接/下拉/日期/计算器）DOM 定位样式。
   * RTL（bidiLevel 为奇）时右对齐元素右缘，LTR 时左对齐元素左缘，
   * 与书写方向镜像；top 统一在元素基线下方。
   */
  public getPopupPositionStyle(
    position: import('../../interface/Element').IElementPosition,
    topOffset = 0,
    direction?: 'ltr' | 'rtl'
  ): { left?: number; right?: number; top: number } {
    const {
      coordinate: { leftTop, rightTop },
      lineHeight,
      pageNo,
      bidiLevel
    } = position
    const isRtl = direction
      ? direction === 'rtl'
      : ((bidiLevel ?? 0) & 1) === 1
    const height = this.getHeight()
    const pageGap = this.getPageGap()
    const currentPageNo = pageNo ?? this.getPageNo()
    const preY = currentPageNo * (height + pageGap)
    const top = leftTop[1] + preY + lineHeight + topOffset
    if (isRtl) {
      const right = this.getWidth() - rightTop[0]
      return { right, top }
    }
    return { left: leftTop[0], top }
  }

  private getEngineHighlightRect(
    row: IRow,
    element: IRowElement,
    position: import('../../interface/Element').IElementPosition
  ): { x: number; width: number } | undefined {
    if (!row.engineLine || element.sourceIndex === undefined) return
    const sourceIndex = element.sourceIndex
    const glyphs = row.engineLine.glyphs.filter(g => {
      if (g.logicalIndices?.length) {
        return g.logicalIndices.includes(sourceIndex)
      }
      const from = Math.min(g.logicalIndexStart, g.logicalIndexEnd)
      const to = Math.max(g.logicalIndexStart, g.logicalIndexEnd)
      return sourceIndex >= from && sourceIndex <= to
    })
    if (!glyphs.length) return
    const left = Math.min(...glyphs.map(g => g.left))
    const right = Math.max(...glyphs.map(g => g.right))
    const originX =
      position.coordinate.leftTop[0] -
      (element.visualLeft || 0) -
      (element.left || 0)
    return { x: originX + left, width: Math.max(0, right - left) }
  }

  /**
   * Resolve a text-engine element to its visual highlight rectangle.
   * Search results use source indexes, while engine rows may reorder those
   * elements visually for bidi layout.
   */
  public getEngineHighlightRectByIndex(
    sourceIndex: number,
    position: import('../../interface/Element').IElementPosition,
    rowList: IRow[] = this.getOriginalRowList()
  ): { x: number; width: number } | undefined {
    for (const row of rowList) {
      if (!row.engineLine) continue
      const element = row.elementList.find(
        item => item.sourceIndex === sourceIndex
      )
      if (!element) continue
      return this.getEngineHighlightRect(row, element, position)
    }
    return
  }

  /**
   * GlyphRenderer 按整行绘制：跳过留痕软删与 hide（与 TextParticle / #1447 一致）。
   * hide 须先在 ElementBridge 中零宽占位，再在此跳过绘制，避免只滤 paint 留下空白洞。
   */
  private isGlyphPaintSkipped(element: IElement | undefined): boolean {
    if (!element || this.isDesignMode()) return false
    return (
      !!element.hide ||
      !!element.control?.hide ||
      (!!element.area?.hide && !this.isAreaHideDisabled()) ||
      this.traceParticle.isTraceHidden(element)
    )
  }

  private filterEngineLineForPaint(
    line: import('../text-engine/types').LayoutLine,
    elementList: IElement[]
  ): import('../text-engine/types').LayoutLine {
    if (this.isDesignMode()) return line
    const glyphs = line.glyphs.filter(g => {
      const from = Math.min(g.logicalIndexStart, g.logicalIndexEnd)
      const to = Math.max(g.logicalIndexStart, g.logicalIndexEnd)
      for (let li = from; li <= to; li++) {
        if (this.isGlyphPaintSkipped(elementList[li])) return false
      }
      return true
    })
    return glyphs.length === line.glyphs.length ? line : { ...line, glyphs }
  }

  /**
   * text-engine 选区校正：按 engineLine 字形左右边界并集，
   * 并对复杂文种用与绘制相同的 font 测整段墨迹宽，防止选区短于 fillText。
   */
  private _correctEngineSelectionRects(
    ctx: CanvasRenderingContext2D,
    curRow: IRow,
    positionList: import('../../interface/Element').IElementPosition[],
    rects: VisualRect[],
    selStart: number,
    selEnd: number
  ): VisualRect[] {
    if (!curRow.engineLine?.glyphs?.length || selStart === selEnd) {
      return rects
    }
    const anchor = curRow.elementList.find(
      el => el.visualLeft !== undefined && el.value !== ZERO
    )
    const anchorPos =
      curRow.fragmentPosition ||
      positionList[
        anchor
          ? anchor.sourceIndex ??
            curRow.startIndex + curRow.elementList.indexOf(anchor)
          : curRow.startIndex
      ]
    if (!anchor || !anchorPos) return rects
    const originX =
      anchorPos.coordinate.leftTop[0] -
      (anchor.visualLeft || 0) -
      (anchor.left || 0)
    const y = anchorPos.coordinate.leftTop[1]
    const height = curRow.height
    // 编辑器约定：高亮 (selStart, selEnd]
    const from = selStart + 1
    const to = selEnd
    if (from > to) return rects

    const glyphRects: VisualRect[] = []
    for (const g of curRow.engineLine.glyphs) {
      const gFrom = Math.min(g.logicalIndexStart, g.logicalIndexEnd)
      const gTo = Math.max(g.logicalIndexStart, g.logicalIndexEnd)
      if (gTo < from || gFrom > to) continue
      const count = Math.max(1, gTo - gFrom + 1)
      const boxW = Math.max(g.right - g.left, 0)
      const odd = (g.bidiLevel & 1) === 1
      for (let li = Math.max(gFrom, from); li <= Math.min(gTo, to); li++) {
        const each = boxW > 0.01 ? boxW / count : 0
        const offset = odd ? gTo - li : li - gFrom
        const left = originX + g.left + offset * each
        const right = left + (each > 0.01 ? each : Math.max(boxW, 0))
        glyphRects.push({ left, right: Math.max(right, left), y, height })
      }
    }
    const base = glyphRects.length ? glyphRects : rects

    // 复杂文种：按选中逻辑子串测宽，把同行选区右缘扩到墨迹宽
    const para = curRow.engineParagraphText
    if (!para || !curRow.engineLine) return base
    let minChar = Infinity
    let maxChar = -1
    let paintStyle = curRow.engineLine.glyphs[0]?.style
    for (const g of curRow.engineLine.glyphs) {
      const gFrom = Math.min(g.logicalIndexStart, g.logicalIndexEnd)
      const gTo = Math.max(g.logicalIndexStart, g.logicalIndexEnd)
      if (gTo < from || gFrom > to) continue
      minChar = Math.min(minChar, g.charStart)
      maxChar = Math.max(maxChar, g.charEnd)
      paintStyle = g.style
    }
    if (minChar === Infinity || maxChar <= minChar || !paintStyle) {
      return base
    }
    const slice = para.slice(minChar, maxChar)
    if (!slice || !containsShapingScript(slice)) return base
    ctx.save()
    ctx.font = `${paintStyle.italic ? 'italic ' : ''}${
      paintStyle.bold ? 'bold ' : ''
    }${paintStyle.fontSize}px ${paintStyle.fontFamily}`
    const measured = ctx.measureText(slice)
    const inkRight =
      measured.actualBoundingBoxRight != null &&
      measured.actualBoundingBoxLeft != null
        ? Math.max(
            measured.width,
            measured.actualBoundingBoxRight - measured.actualBoundingBoxLeft
          )
        : measured.width
    ctx.restore()
    // 选区在复杂段内的视觉起点
    let runLeft = Infinity
    for (const g of curRow.engineLine.glyphs) {
      const gFrom = Math.min(g.logicalIndexStart, g.logicalIndexEnd)
      const gTo = Math.max(g.logicalIndexStart, g.logicalIndexEnd)
      if (gTo < from || gFrom > to) continue
      runLeft = Math.min(runLeft, originX + g.left)
    }
    if (runLeft === Infinity) return base
    const needRight = runLeft + inkRight
    return base.map(r =>
      Math.abs(r.y - y) < 0.5 && r.right < needRight
        ? { ...r, left: Math.min(r.left, runLeft), right: needRight }
        : r
    )
  }

  /**
   * Paint-time overlay of live element styles onto engine glyphs.
   * Does not mutate the cached LayoutLine (color 等 isCompute:false 依赖此路径).
   */
  private _syncEngineLineStyles(
    line: import('../text-engine/types').LayoutLine,
    elementList: IElement[]
  ): import('../text-engine/types').LayoutLine {
    const {
      defaultFont,
      defaultSize,
      defaultColor,
      defaultHyperlinkColor,
      label: { defaultColor: defaultLabelColor },
      scale
    } = this.options
    return {
      ...line,
      glyphs: line.glyphs.map(g => {
        const el = elementList[g.logicalIndexStart]
        if (!el) return g
        if (el.type === ElementType.HYPERLINK) {
          this.hyperlinkParticle.ensureDefaults(el)
        }
        if (el.type === ElementType.LABEL) {
          this.labelParticle.ensureDefaults(el)
        }
        const isSuper = el.type === ElementType.SUPERSCRIPT
        const isSub = el.type === ElementType.SUBSCRIPT
        const baseSize = el.size || defaultSize
        const paintSize =
          (isSuper || isSub ? Math.ceil(baseSize * 0.6) : baseSize) * scale
        const scriptShift = isSuper ? 'super' : isSub ? 'sub' : undefined
        const baselineShift = isSuper
          ? -paintSize / 2
          : isSub
            ? paintSize / 2
            : 0
        const fallbackColor =
          el.type === ElementType.HYPERLINK
            ? defaultHyperlinkColor
            : el.type === ElementType.LABEL
              ? defaultLabelColor
              : defaultColor
        return {
          ...g,
          baselineShift,
          style: {
            ...g.style,
            // 保留整形时按 script 解析的字体，避免 sync 回落 defaultFont 打断阿语连写
            fontFamily: el.font || g.style.fontFamily || defaultFont,
            fontSize: paintSize,
            bold: el.bold,
            italic: el.italic,
            color: el.color || fallbackColor,
            letterSpacing: el.letterSpacing,
            scriptShift
          }
        }
      })
    }
  }

  private _createSpecialEngineRow(
    element: IElement,
    index: number,
    innerWidth: number,
    rowIndex: number
  ): IRow {
    const { scale, defaultSize } = this.options
    const rowMargin = this.getElementRowMargin(element)
    if (element.type === ElementType.SEPARATOR) {
      const {
        separator: { lineWidth: defaultLineWidth }
      } = this.options
      const lineWidth = element.lineWidth || defaultLineWidth
      element.width = innerWidth / scale
      // 与 legacy computeRowList 保持同一套 metrics → height/ascent
      const metrics = {
        width: innerWidth,
        height: lineWidth * scale,
        boundingBoxAscent: -rowMargin,
        boundingBoxDescent: -rowMargin + lineWidth * scale
      }
      const ascent = metrics.boundingBoxAscent + rowMargin
      const height =
        rowMargin +
        metrics.boundingBoxAscent +
        metrics.boundingBoxDescent +
        rowMargin
      return {
        width: innerWidth,
        height,
        ascent,
        startIndex: index,
        rowIndex,
        elementList: [
          {
            ...element,
            metrics,
            style: ''
          }
        ]
      }
    }
    // PAGE_BREAK：legacy 仅设 metrics.height=defaultSize，bbox 为 0
    element.width = innerWidth / scale
    const size = element.size || defaultSize
    const metrics = {
      width: innerWidth,
      height: size,
      boundingBoxAscent: 0,
      boundingBoxDescent: 0
    }
    const ascent = metrics.boundingBoxAscent + rowMargin
    const height =
      rowMargin +
      metrics.boundingBoxAscent +
      metrics.boundingBoxDescent +
      rowMargin
    return {
      width: innerWidth,
      height,
      ascent,
      startIndex: index,
      rowIndex,
      isPageBreak: true,
      elementList: [
        {
          ...element,
          metrics,
          style: ''
        }
      ]
    }
  }

  /** Paragraph list indent (marker width + nested level), same as legacy offsetX. */
  private _getEngineParagraphListOffset(
    paragraph: ParagraphSpan,
    elementList: IElement[],
    listStyleMap: Map<string, number>
  ): number {
    const { scale } = this.options
    const anchor =
      elementList[paragraph.startIndex]?.listId
        ? elementList[paragraph.startIndex]
        : elementList[paragraph.startIndex + 1]
    if (!anchor?.listId) return 0
    const indent = anchor.listLevel
      ? this.listParticle.LIST_INDENT_WIDTH * anchor.listLevel * scale
      : 0
    return (listStyleMap.get(anchor.listId) || 0) + indent
  }

  /**
   * text-engine 行补齐列表元数据（isList/offsetX/listIndex），
   * 否则工具栏 setList 虽写入 listId，却不缩进、不绘项目符号。
   */
  private _applyEngineListMetaToRows(
    rows: IRow[],
    listStyleMap: Map<string, number>,
    listIndexMap: Map<string, number>
  ) {
    const { scale } = this.options
    for (const row of rows) {
      const listAnchor =
        row.elementList.find(el => el.listId && el.value === ZERO) ||
        row.elementList.find(el => !!el.listId)
      if (!listAnchor?.listId) continue
      const listId = listAnchor.listId
      if (listAnchor.value === ZERO && !listAnchor.listWrap) {
        if (listIndexMap.has(listId)) {
          listIndexMap.set(listId, (listIndexMap.get(listId) ?? 0) + 1)
        } else {
          listIndexMap.set(listId, 0)
        }
      }
      const indent = listAnchor.listLevel
        ? this.listParticle.LIST_INDENT_WIDTH * listAnchor.listLevel * scale
        : 0
      row.isList = true
      // RTL：左侧不再套 offsetX，gutter 留在内容区右侧（布局宽已减 listOffset）
      const isRtl =
        row.direction === 'rtl' || listAnchor.direction === TextDirection.RTL
      row.offsetX = isRtl ? 0 : (listStyleMap.get(listId) || 0) + indent
      row.listIndex = listIndexMap.get(listId) ?? 0
    }
  }

  /**
   * text-engine 行补齐 ControlIndentation.VALUE_START：
   * 控件值换行时，续行从「值起始侧」对齐（LTR 值左缘、RTL 值右缘），
   * 与 legacy computeRowList 的 offsetX 语义一致。仅平移本行 visualLeft，
   * 不写 offsetX，避免与引擎行右对齐 / 列表 offsetX 二次叠加。
   */
  private _applyEngineControlIndentation(rows: IRow[]) {
    if (!rows.length) return
    const valueStartByControl = new Map<string, number>()
    const seenByControl = new Set<string>()
    for (const row of rows) {
      const isRtl = row.direction === 'rtl'
      // 本行出现且带视觉坐标的 VALUE_START 控件值
      const rowValueStart = new Map<string, number>()
      for (const el of row.elementList) {
        if (
          !el.controlId ||
          el.control?.indentation !== ControlIndentation.VALUE_START ||
          el.visualLeft === undefined
        ) {
          continue
        }
        // 值起点 = 首个非 PREFIX 元素（PRE_TEXT / PLACEHOLDER / VALUE），与 legacy 一致
        if (
          el.controlComponent !== ControlComponent.PRE_TEXT &&
          el.controlComponent !== ControlComponent.PLACEHOLDER &&
          el.controlComponent !== ControlComponent.VALUE
        ) {
          continue
        }
        const right = (el.visualLeft || 0) + (el.metrics?.width || 0)
        const cur = rowValueStart.get(el.controlId)
        const next =
          cur === undefined
            ? (isRtl ? right : el.visualLeft || 0)
            : isRtl
              ? Math.max(cur, right)
              : Math.min(cur, el.visualLeft || 0)
        rowValueStart.set(el.controlId, next)
      }
      for (const [controlId, thisRowStart] of rowValueStart) {
        if (!seenByControl.has(controlId)) {
          seenByControl.add(controlId)
          valueStartByControl.set(controlId, thisRowStart)
          continue
        }
        const firstRowStart = valueStartByControl.get(controlId)!
        const delta = firstRowStart - thisRowStart
        if (Math.abs(delta) < 0.01) continue
        this._shiftEngineRowVisual(row, delta)
      }
    }
  }

  /**
   * 平移 text-engine 行内全部元素的 visualLeft 与 engineLine 字形（拷贝，避免污染
   * LayoutCache），不改变行宽。与 LabelParticle.applyEngineRowsMetrics 一致。
   */
  private _shiftEngineRowVisual(row: IRow, delta: number) {
    for (const el of row.elementList) {
      if (el.visualLeft !== undefined) {
        el.visualLeft += delta
      }
    }
    if (row.engineLine?.glyphs?.length) {
      row.engineLine = {
        ...row.engineLine,
        glyphs: row.engineLine.glyphs.map(g => ({
          ...g,
          left: g.left + delta,
          right: g.right + delta
        }))
      }
    }
  }

  private _appendParagraphEngineRows(
    rowList: IRow[],
    paragraph: ParagraphSpan,
    elementList: IElement[],
    width: number,
    rowIndex: number,
    layoutScope: string,
    defaultAlign?: 'left' | 'right'
  ): number {
    const zeroEl =
      elementList[paragraph.startIndex]?.value === ZERO
        ? elementList[paragraph.startIndex]
        : null
    const rows = this.layoutHostAdapter.layoutParagraphToRows(
      paragraph,
      elementList,
      width,
      rowIndex,
      layoutScope,
      defaultAlign
    )
    if (!rows?.length) {
      if (!zeroEl) return rowIndex
      // 与正文引擎行一致：fontSize * defaultRowMargin * 1.5（勿用 size*margin 压成半行）
      const { defaultSize, defaultFont, defaultRowMargin, scale } =
        this.options
      const fontSize = (zeroEl.size || defaultSize) * (scale || 1)
      const lineHeightFactor = (defaultRowMargin || 1) * 1.5
      const height = fontSize * lineHeightFactor
      const ascent = height * 0.8
      rowList.push({
        width: 0,
        height,
        ascent,
        direction: paragraph.direction,
        rowFlex: paragraph.rowFlex,
        startIndex: paragraph.startIndex,
        elementList: [
          Object.assign(zeroEl, {
            metrics: {
              width: 0,
              height: fontSize,
              boundingBoxAscent: ascent,
              boundingBoxDescent: Math.max(0, height - ascent)
            },
            style: `${zeroEl.size || defaultSize}px ${
              zeroEl.font || defaultFont
            }`,
            visualLeft: 0,
            bidiLevel: paragraph.direction === 'rtl' ? 1 : 0
          }) as IRowElement
        ],
        rowIndex: rowIndex++
      })
      return rowIndex
    }
    if (zeroEl) {
      const first = rows[0]
      const lefts = first.elementList.map(el => el.visualLeft ?? 0)
      const rights = first.elementList.map(
        el => (el.visualLeft ?? 0) + (el.metrics?.width ?? 0)
      )
      const visualLeft =
        paragraph.direction === 'rtl'
          ? Math.max(0, ...rights, first.width)
          : Math.min(...lefts, 0)
      first.elementList.unshift(
        Object.assign(zeroEl, {
          metrics: {
            width: 0,
            height: first.height,
            boundingBoxAscent: first.ascent,
            boundingBoxDescent: Math.max(0, first.height - first.ascent)
          },
          style: `${zeroEl.size || this.options.defaultSize}px ${
            zeroEl.font || this.options.defaultFont
          }`,
          visualLeft,
          left: 0,
          bidiLevel: paragraph.direction === 'rtl' ? 1 : 0
        }) as IRowElement
      )
      first.startIndex = paragraph.startIndex
    }
    this.control.applyEngineRowsMinWidth(rows, width)
    this.labelParticle.applyEngineRowsMetrics(rows)
    this._applyEngineControlIndentation(rows)
    for (const row of rows) {
      this.collapseHiddenEngineRow(row)
      row.rowIndex = rowIndex++
      rowList.push(row)
    }
    return rowIndex
  }

  /** 与 legacy computeRowList 一致：行内非换行符元素全隐藏时折叠行高 (#1447) */
  private collapseHiddenEngineRow(row: IRow) {
    if (this.isDesignMode() || row.height <= 0) return
    const visibleElements = row.elementList.filter(el => el.value !== ZERO)
    const isAllHidden =
      visibleElements.length > 0 &&
      visibleElements.every(
        el =>
          el.hide ||
          el.control?.hide ||
          (el.area?.hide && !this.isAreaHideDisabled()) ||
          this.traceParticle.isTraceHidden(el)
      )
    if (isAllHidden) {
      row.height = 0
    }
  }

  private _computeRowListByTextEngine(
    elementList: IElement[],
    width: number,
    layoutScope: string,
    defaultDirection?: TextDirection,
    defaultAlign?: 'left' | 'right'
  ): IRow[] | null {
    const paragraphs = this.layoutHostAdapter.scanParagraphs(
      elementList,
      defaultDirection
    )
    const paraByStart = new Map(
      paragraphs.map(p => [p.startIndex, p] as const)
    )
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const listStyleMap = this.listParticle.computeListStyle(ctx, elementList)
    const listIndexMap: Map<string, number> = new Map()
    const rowList: IRow[] = []
    let rowIndex = 0
    let i = 0
    while (i < elementList.length) {
      const el = elementList[i]
      if (
        el.type === ElementType.SEPARATOR ||
        el.type === ElementType.PAGE_BREAK
      ) {
        rowList.push(
          this._createSpecialEngineRow(el, i, width, rowIndex++)
        )
        i++
        continue
      }
      // 表格/浮层图/Block 等：legacy 单元素插行（forceLegacy 避免递归进引擎）
      if (this._isEngineHostBlockedElement(el)) {
        this._clearStaleEngineLayout([el])
        const subRows = this.computeRowList({
          innerWidth: width,
          elementList: [el],
          forceLegacy: true,
          layoutScope
        })
        for (const row of subRows) {
          row.startIndex = i
          row.rowIndex = rowIndex++
          // 行内元素对齐到主列表引用，保留 legacy 算好的 metrics/style
          if (row.elementList.length === 1) {
            const computed = row.elementList[0]
            row.elementList[0] = Object.assign(el, {
              metrics: computed.metrics,
              style: computed.style,
              left: computed.left
            }) as import('../../interface/Row').IRowElement
          }
          rowList.push(row)
        }
        i++
        continue
      }
      const paragraph = paraByStart.get(i)
      if (paragraph) {
        const listOffset = this._getEngineParagraphListOffset(
          paragraph,
          elementList,
          listStyleMap
        )
        const paraRowStart = rowList.length
        rowIndex = this._appendParagraphEngineRows(
          rowList,
          paragraph,
        elementList,
        Math.max(1, width - listOffset),
        rowIndex,
        layoutScope,
        defaultAlign
        )
        this._applyEngineListMetaToRows(
          rowList.slice(paraRowStart),
          listStyleMap,
          listIndexMap
        )
        i = paragraph.endIndex + 1
        continue
      }
      i++
    }
    return rowList.length ? rowList : null
  }

  /**
   * legacy 渲染器为逐字符 LTR，不做 Bidi/连字整形；声明 textEngine=legacy 时
   * RTL 内容无法正确渲染。此处仅对「显式 legacy」模式给出一次性警告，
   * harfbuzz 模式下的 forceLegacy（表格外壳/浮层图）不触发。
   */
  private _warnLegacyRtlIfNeeded(elementList: IElement[]) {
    if (this.legacyRtlWarned) return
    if (this.layoutHostAdapter.isHarfBuzzMode()) return
    const hasRtl = elementList.some(el => {
      if (el.direction === TextDirection.RTL) return true
      const value = el.value
      return !!value && /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/.test(value)
    })
    if (hasRtl) {
      this.legacyRtlWarned = true
      console.warn(
        '[canvas-editor] textEngine 为 legacy，无法正确渲染 RTL 内容，' +
          '请将 textEngine 改为 "harfbuzz"'
      )
    }
  }

  /**
   * 引擎行补齐分栏 columnIndex 与环绕图偏移。
   * 引擎按整段以 innerWidth 排版，这里按行累计高度模拟 legacy 的分栏游标，
   * 并对与环绕图纵向相交的行设置 offsetX，使正文从图片右侧开始而非重叠。
   */
  private _applyEngineRowGeometry(
    rows: IRow[],
    p: {
      startX: number
      startY: number
      pageHeight: number
      isPagingMode: boolean
      innerWidth: number
      surroundElementList: IElement[]
    }
  ) {
    const {
      startX,
      startY,
      pageHeight,
      isPagingMode,
      surroundElementList
    } = p
    const { scale } = this.options
    const layout =
      isPagingMode ? this.columnManager.getLayout() : null
    const isColumnEnabled = !!layout && layout.count > 1
    let y = startY
    let pageNo = 0
    let currentColumn = 0
    for (const row of rows) {
      const rowOffsetY = row.offsetY || 0
      if (isPagingMode && pageHeight) {
        const curMainOuterHeight = this.getMainOuterHeight(pageNo)
        const isOverflow =
          y - startY + curMainOuterHeight + row.height + rowOffsetY > pageHeight
        if (isOverflow) {
          if (
            isColumnEnabled &&
            layout &&
            currentColumn < layout.count - 1
          ) {
            currentColumn += 1
            y = startY
          } else {
            pageNo += 1
            currentColumn = 0
            y = startY
          }
        }
      }
      if (isColumnEnabled) {
        row.columnIndex = currentColumn
      }
      // 环绕图：与行纵向相交时，正文从图片右侧开始
      if (surroundElementList.length) {
        const columnOffset = isColumnEnabled
          ? (layout!.offsets[currentColumn] || 0)
          : 0
        const rowStartX = startX + columnOffset
        for (const s of surroundElementList) {
          const floatPosition = s.imgFloatPosition
          if (
            !floatPosition ||
            floatPosition.pageNo !== pageNo ||
            !s.width ||
            !s.height
          ) {
            continue
          }
          const rect = {
            x: floatPosition.x * scale,
            y: floatPosition.y * scale,
            width: s.width * scale,
            height: s.height * scale
          }
          if (
            y >= rect.y + rect.height ||
            y + row.height <= rect.y ||
            rect.x >= rowStartX + row.width
          ) {
            continue
          }
          // 图片在正文行起点左侧 → 平移整行到图片右侧
          if (rect.x + rect.width > rowStartX + 0.01) {
            const offset = rect.x + rect.width - rowStartX
            row.offsetX = (row.offsetX || 0) + offset
            row.isSurround = true
          }
        }
      }
      y += row.height + rowOffsetY
    }
  }

  public computeRowList(payload: IComputeRowListPayload) {
    const {
      innerWidth,
      elementList,
      isPagingMode = false,
      isFromTable = false,
      startX = 0,
      startY = 0,
      pageHeight = 0,
      surroundElementList = [],
      forceLegacy = false,
      layoutScope = 'main',
      defaultDirection,
      defaultAlign
    } = payload
    // text-engine：段落走引擎（含单元格）；TABLE/浮层图等在引擎循环内 forceLegacy
    if (!forceLegacy && this.layoutHostAdapter.isReady()) {
      // 分栏时按列宽排版，避免整段以整行宽换行后套栏偏移导致列间覆盖
      const layout =
        isPagingMode && !isFromTable ? this.columnManager.getLayout() : null
      const isColumnEnabled = !!layout && layout.count > 1
      const engineWidth = isColumnEnabled ? layout!.width : innerWidth
      const engineRows = this._computeRowListByTextEngine(
        elementList,
        engineWidth,
        layoutScope,
        defaultDirection,
        defaultAlign
      )
      if (engineRows) {
        // 表格单元格/页眉页脚等子布局不做分栏与环绕处理
        if (!isFromTable && layoutScope === 'main') {
          this._applyEngineRowGeometry(engineRows, {
            startX,
            startY,
            pageHeight,
            isPagingMode,
            innerWidth,
            surroundElementList
          })
        }
        return engineRows
      }
    }
    this._warnLegacyRtlIfNeeded(elementList)
    // legacy 前清掉引擎残留 visualLeft，防止表格/图片行定位错乱
    this._clearStaleEngineLayout(elementList)
    const {
      defaultSize,
      scale,
      imgCaption,
      table: { tdPadding, defaultColMinWidth, overflow },
      defaultTabWidth
    } = this.options
    const defaultBasicRowMarginHeight = this.getDefaultBasicRowMarginHeight()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    // 还原最小宽度控件占位
    if (this.controlMinWidthPlaceholderElementListSet.has(elementList)) {
      for (let i = elementList.length - 1; i >= 0; i--) {
        if (elementList[i].isControlMinWidthPlaceholder) {
          elementList.splice(i, 1)
        }
      }
      this.controlMinWidthPlaceholderElementListSet.delete(elementList)
    }
    // 计算列表偏移宽度
    const listStyleMap = this.listParticle.computeListStyle(ctx, elementList)
    const rowList: IRow[] = []
    const layout =
      isPagingMode && !isFromTable ? this.columnManager.getLayout() : null
    const isColumnEnabled = !!layout && layout.count > 1
    if (elementList.length) {
      rowList.push({
        width: 0,
        height: 0,
        ascent: 0,
        elementList: [],
        startIndex: 0,
        rowIndex: 0,
        rowFlex: elementList?.[0]?.rowFlex || elementList?.[1]?.rowFlex,
        ...(isColumnEnabled ? { columnIndex: 0 } : {})
      })
    }
    // 起始位置及页码计算
    let x = startX
    let y = startY
    let pageNo = 0
    // 分页模式下按页计算起始 Y（页眉/页脚禁用时该页起始位置上移）
    let pageStartY = startY
    if (isPagingMode && !isFromTable) {
      pageStartY = this.getMargins()[0] + this.getHeader().getExtraHeight(0)
      y = pageStartY
    }
    // 列表位置
    // 不同 listId 独立计数，避免父列表与子列表序号互相影响
    const listIndexMap: Map<string, number> = new Map()
    // 控件最小宽度
    let controlRealWidth = 0
    // 分栏游标
    let currentColumn = 0
    for (let i = 0; i < elementList.length; i++) {
      const curRow: IRow = rowList[rowList.length - 1]
      const element = elementList[i]
      const rowMargin = this.getElementRowMargin(element)
      const metrics: IElementMetrics = {
        width: 0,
        height: 0,
        boundingBoxAscent: 0,
        boundingBoxDescent: 0
      }
      // 实际可用宽度
      const offsetX =
        curRow.offsetX ||
        (element.listId &&
          (listStyleMap.get(element.listId) || 0) +
            (element.listLevel
              ? this.listParticle.LIST_INDENT_WIDTH * element.listLevel * scale
              : 0)) ||
        0
      const rowMaxWidth = isColumnEnabled && layout ? layout.width : innerWidth
      const availableWidth = rowMaxWidth - offsetX
      // 增加起始位置坐标偏移量
      const isStartElement = curRow.elementList.length === 1
      x += isStartElement ? offsetX : 0
      y += isStartElement ? curRow.offsetY || 0 : 0
      if (
        (element.hide ||
          element.control?.hide ||
          (element.area?.hide && !this.isAreaHideDisabled()) ||
          this.traceParticle.isTraceHidden(element)) &&
        !this.isDesignMode()
      ) {
        const preElement = curRow.elementList[curRow.elementList.length - 1]
        metrics.height =
          preElement?.metrics.height || this.options.defaultSize * scale
        metrics.boundingBoxAscent = preElement?.metrics.boundingBoxAscent || 0
        metrics.boundingBoxDescent = preElement?.metrics.boundingBoxDescent || 0
      } else if (
        element.type === ElementType.IMAGE ||
        element.type === ElementType.LATEX
      ) {
        // 浮动图片无需计算数据
        if (
          element.imgDisplay === ImageDisplay.SURROUND ||
          element.imgDisplay === ImageDisplay.FLOAT_TOP ||
          element.imgDisplay === ImageDisplay.FLOAT_BOTTOM
        ) {
          metrics.width = 0
          metrics.height = 0
          metrics.boundingBoxDescent = 0
        } else {
          const elementWidth = element.width! * scale
          const elementHeight = element.height! * scale
          // 图片超出尺寸后自适应（图片大小大于可用宽度时）
          if (elementWidth > availableWidth) {
            const adaptiveHeight =
              (elementHeight * availableWidth) / elementWidth
            element.width = availableWidth / scale
            element.height = adaptiveHeight / scale
            metrics.width = availableWidth
            metrics.height = adaptiveHeight
            metrics.boundingBoxDescent = adaptiveHeight
          } else {
            metrics.width = elementWidth
            metrics.height = elementHeight
            metrics.boundingBoxDescent = elementHeight
          }
          // 增加题注高度
          if (element.imgCaption?.value) {
            const fontSize = element.imgCaption.size || imgCaption.size
            const captionTop = element.imgCaption.top ?? imgCaption.top
            const captionHeight = (fontSize + captionTop) * scale
            metrics.boundingBoxAscent += captionHeight
          }
        }
      } else if (element.type === ElementType.TABLE) {
        const tdPaddingWidth = tdPadding[1] + tdPadding[3]
        const tdPaddingHeight = tdPadding[0] + tdPadding[2]
        // 表格跨页在渲染层拆分行（数据层保持单一表格）
        const trList = element.trList!
        // 重置tr高度：行高不可低于一个单元格最小高度
        const tdMinHeight =
          tdPaddingHeight + defaultSize + (rowMargin * 2) / scale
        for (let t = 0; t < trList.length; t++) {
          const tr = trList[t]
          // 行高默认当前最小高度，后续根据内容自适应
          tr.height = Math.max(tdMinHeight, tr.minHeight || 0)
          tr.minHeight = tr.height
        }
        // 表格不允许超出正文区域时：等比例压缩列宽至内容区内，并清除横向偏移
        if (!overflow) {
          shrinkColgroupToWidth(
            element.colgroup!,
            this.getOriginalInnerWidth(),
            defaultColMinWidth
          )
          element.translateX = 0
        }
        // 计算表格行列
        this.tableParticle.computeRowColInfo(element)
        // 计算表格内元素信息
        for (let t = 0; t < trList.length; t++) {
          const tr = trList[t]
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            const rowList = this.computeRowList({
              innerWidth: (td.width! - tdPaddingWidth) * scale,
              elementList: td.value,
              isFromTable: true,
              isPagingMode,
              defaultDirection: element.direction || TextDirection.AUTO,
              defaultAlign:
                element.direction === TextDirection.RTL ? 'right' : 'left',
              layoutScope: td.id ? `td:${td.id}` : `td:anon-${t}-${d}`
            })
            const rowHeight = rowList.reduce((pre, cur) => pre + cur.height, 0)
            td.rowList = rowList
            // 移除缩放导致的行高变化-渲染时会进行缩放调整
            const curTdHeight = rowHeight / scale + tdPaddingHeight
            // 内容高度大于当前单元格高度需增加
            if (td.height! < curTdHeight) {
              const extraHeight = curTdHeight - td.height!
              const changeTr = trList[t + td.rowspan - 1]
              changeTr.height += extraHeight
              changeTr.tdList.forEach(changeTd => {
                changeTd.height! += extraHeight
                if (!changeTd.realHeight) {
                  changeTd.realHeight = changeTd.height!
                } else {
                  changeTd.realHeight! += extraHeight
                }
              })
            }
            // 当前单元格最小高度及真实高度（包含跨列）
            let curTdMinHeight = 0
            let curTdRealHeight = 0
            let i = 0
            while (i < td.rowspan) {
              const curTr = trList[i + t] || trList[t]
              curTdMinHeight += curTr.minHeight!
              curTdRealHeight += curTr.height!
              i++
            }
            td.realMinHeight = curTdMinHeight
            td.realHeight = curTdRealHeight
            td.mainHeight = curTdHeight
          }
        }
        // 单元格高度大于实际内容高度需减少
        const reduceTrList = this.tableParticle.getTrListGroupByCol(trList)
        for (let t = 0; t < reduceTrList.length; t++) {
          const tr = reduceTrList[t]
          let reduceHeight = -1
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            const curTdRealHeight = td.realHeight!
            const curTdHeight = td.mainHeight!
            const curTdMinHeight = td.realMinHeight!
            // 获取最大可减少高度
            const curReduceHeight =
              curTdHeight < curTdMinHeight
                ? curTdRealHeight - curTdMinHeight
                : curTdRealHeight - curTdHeight
            if (!~reduceHeight || curReduceHeight < reduceHeight) {
              reduceHeight = curReduceHeight
            }
          }
          if (reduceHeight > 0) {
            const changeTr = trList[t]
            changeTr.height -= reduceHeight
            changeTr.tdList.forEach(changeTd => {
              changeTd.height! -= reduceHeight
              changeTd.realHeight! -= reduceHeight
            })
          }
        }
        // 需要重新计算表格内值
        this.tableParticle.computeRowColInfo(element)
        // 计算出表格高度
        const tableHeight = this.tableParticle.getTableHeight(element)
        const tableWidth = this.tableParticle.getTableWidth(element)
        element.width = tableWidth
        element.height = tableHeight
        const elementWidth = tableWidth * scale
        const elementHeight = tableHeight * scale
        metrics.width = elementWidth
        metrics.height = elementHeight
        metrics.boundingBoxDescent = elementHeight
        metrics.boundingBoxAscent = -rowMargin
        // 后一个元素也是表格则移除行间距
        if (elementList[i + 1]?.type === ElementType.TABLE) {
          metrics.boundingBoxAscent -= rowMargin
        }
      } else if (element.type === ElementType.SEPARATOR) {
        const {
          separator: { lineWidth: defaultLineWidth }
        } = this.options
        const lineWidth = element.lineWidth || defaultLineWidth
        element.width = availableWidth / scale
        metrics.width = availableWidth
        metrics.height = lineWidth * scale
        metrics.boundingBoxAscent = -rowMargin
        metrics.boundingBoxDescent = -rowMargin + metrics.height
      } else if (element.type === ElementType.PAGE_BREAK) {
        element.width = availableWidth / scale
        metrics.width = availableWidth
        metrics.height = defaultSize
      } else if (
        element.type === ElementType.RADIO ||
        element.controlComponent === ControlComponent.RADIO
      ) {
        const { width, height, gap } = this.options.radio
        const elementWidth = width + gap * 2
        element.width = elementWidth
        metrics.width = elementWidth * scale
        metrics.height = height * scale
      } else if (
        element.type === ElementType.CHECKBOX ||
        element.controlComponent === ControlComponent.CHECKBOX
      ) {
        const { width, height, gap } = this.options.checkbox
        const elementWidth = width + gap * 2
        element.width = elementWidth
        metrics.width = elementWidth * scale
        metrics.height = height * scale
      } else if (element.type === ElementType.TAB) {
        metrics.width = defaultTabWidth * scale
        metrics.height = defaultSize * scale
        metrics.boundingBoxDescent = 0
        metrics.boundingBoxAscent =
          this.textParticle.getBasisWordBoundingBoxAscent(ctx, ctx.font)
      } else if (element.isControlMinWidthPlaceholder) {
        metrics.width = (element.width || 0) * scale
        metrics.height = defaultSize * scale
        ctx.font = this.getElementFont(element)
        const basisMetrics = this.textParticle.measureBasisWord(
          ctx,
          element.font!
        )
        metrics.boundingBoxAscent = basisMetrics.actualBoundingBoxAscent * scale
        metrics.boundingBoxDescent =
          basisMetrics.actualBoundingBoxDescent * scale
      } else if (element.type === ElementType.BLOCK) {
        if (!element.width) {
          metrics.width = availableWidth
        } else {
          const elementWidth = element.width * scale
          metrics.width = Math.min(elementWidth, availableWidth)
        }
        metrics.height = element.height! * scale
        metrics.boundingBoxDescent = metrics.height
        metrics.boundingBoxAscent = 0
      } else if (element.type === ElementType.LABEL) {
        const {
          defaultSize,
          label: { defaultPadding }
        } = this.options
        ctx.font = this.getElementFont(element)
        const fontMetrics = this.textParticle.measureText(ctx, element)
        metrics.width =
          (fontMetrics.width + defaultPadding[1] + defaultPadding[3]) * scale
        metrics.height = (element.size || defaultSize) * scale
        metrics.boundingBoxDescent = 0
        metrics.boundingBoxAscent =
          (defaultPadding[0] + fontMetrics.actualBoundingBoxAscent) * scale
      } else {
        // 设置上下标真实字体尺寸
        const size = element.size || defaultSize
        if (
          element.type === ElementType.SUPERSCRIPT ||
          element.type === ElementType.SUBSCRIPT
        ) {
          element.actualSize = Math.ceil(size * 0.6)
        }
        metrics.height = (element.actualSize || size) * scale
        ctx.font = this.getElementFont(element)
        const fontMetrics = this.textParticle.measureText(ctx, element)
        metrics.width = fontMetrics.width * scale
        if (element.letterSpacing) {
          metrics.width += element.letterSpacing * scale
        }
        // 使用基于字体的基准度量以确保一致的行高，避免字符特定度量导致的布局跳动
        const basisMetrics = this.textParticle.measureBasisWord(
          ctx,
          element.font!
        )
        metrics.boundingBoxAscent = basisMetrics.actualBoundingBoxAscent * scale
        metrics.boundingBoxDescent =
          basisMetrics.actualBoundingBoxDescent * scale
        if (element.type === ElementType.SUPERSCRIPT) {
          metrics.boundingBoxAscent += metrics.height / 2
        } else if (element.type === ElementType.SUBSCRIPT) {
          metrics.boundingBoxDescent += metrics.height / 2
        }
      }
      const ascent =
        !element.hide &&
        !this.traceParticle.isTraceHidden(element) &&
        ((element.imgDisplay !== ImageDisplay.INLINE &&
          element.type === ElementType.IMAGE) ||
          element.type === ElementType.LATEX)
          ? metrics.height + rowMargin
          : metrics.boundingBoxAscent + rowMargin
      const height =
        rowMargin +
        metrics.boundingBoxAscent +
        metrics.boundingBoxDescent +
        rowMargin
      const rowElement: IRowElement = Object.assign(element, {
        metrics,
        left: 0,
        style: this.getElementFont(element, scale)
      })
      // 控件开始时统计宽度，结束时消费最小宽度并补充跨行占位
      if (
        rowElement.control?.minWidth &&
        !rowElement.isControlMinWidthPlaceholder &&
        !this.traceParticle.isTraceHidden(rowElement)
      ) {
        if (rowElement.controlComponent) {
          controlRealWidth += metrics.width
        }
        if (rowElement.controlComponent === ControlComponent.POSTFIX) {
          const controlMinWidth = rowElement.control.minWidth * scale
          const extraWidth = controlMinWidth - controlRealWidth
          const rowRemainingWidth = Math.max(
            availableWidth - curRow.width - rowElement.metrics.width,
            0
          )
          // 设置最小宽度控件属性（字符偏移量）
          this.control.setMinWidthControlInfo({
            row: curRow,
            rowElement,
            availableWidth,
            controlRealWidth
          })
          let placeholderWidth = extraWidth - rowRemainingWidth
          const placeholderList: IElement[] = []
          while (placeholderWidth > 0) {
            const width = Math.min(placeholderWidth, availableWidth)
            placeholderList.push({
              ...rowElement,
              value: '',
              width: width / scale,
              left: 0,
              isControlMinWidthPlaceholder: true
            } as IElement)
            placeholderWidth -= width
          }
          if (placeholderList.length) {
            elementList.splice(i + 1, 0, ...placeholderList)
            this.controlMinWidthPlaceholderElementListSet.add(elementList)
          }
          controlRealWidth = 0
        }
      }
      // 超过限定宽度
      const preElement = elementList[i - 1]
      let nextElement = elementList[i + 1]
      // 累计行宽 + 当前元素宽度 + 排版宽度(英文单词整体宽度 + 后面标点符号宽度)
      let curRowWidth = curRow.width + metrics.width
      if (this.options.wordBreak === WordBreak.BREAK_WORD) {
        if (
          (!preElement?.type || preElement?.type === ElementType.TEXT) &&
          (!element.type || element.type === ElementType.TEXT)
        ) {
          // 英文单词
          const word = `${preElement?.value || ''}${element.value}`
          if (this.WORD_LIKE_REG.test(word)) {
            const { width, endElement } = this.textParticle.measureWord(
              ctx,
              elementList,
              i
            )
            // 后面存在元素 && 单词宽度大于行可用宽度，无需折行
            const wordWidth = width * scale
            if (endElement && wordWidth <= availableWidth) {
              curRowWidth += wordWidth
              nextElement = endElement
            }
          }
          // 标点符号
          const punctuationWidth = this.textParticle.measurePunctuationWidth(
            ctx,
            nextElement
          )
          curRowWidth += punctuationWidth * scale
        }
      }
      // 列表信息
      if (element.listId && element.value === ZERO && !element.listWrap) {
        if (listIndexMap.has(element.listId)) {
          listIndexMap.set(
            element.listId,
            (listIndexMap.get(element.listId) ?? 0) + 1
          )
        } else {
          listIndexMap.set(element.listId, 0)
        }
      }
      // 计算四周环绕导致的元素偏移量
      const surroundPosition = this.position.setSurroundPosition({
        pageNo,
        rowElement,
        row: curRow,
        rowElementRect: {
          x,
          y,
          height,
          width: metrics.width
        },
        availableWidth,
        surroundElementList
      })
      x = surroundPosition.x
      curRowWidth += surroundPosition.rowIncreaseWidth
      x += metrics.width
      // 是否强制换行
      const isForceBreak =
        element.type === ElementType.SEPARATOR ||
        element.type === ElementType.TABLE ||
        preElement?.type === ElementType.TABLE ||
        preElement?.type === ElementType.BLOCK ||
        element.type === ElementType.BLOCK ||
        preElement?.imgDisplay === ImageDisplay.INLINE ||
        element.imgDisplay === ImageDisplay.INLINE ||
        preElement?.listId !== element.listId ||
        (preElement?.areaId !== element.areaId &&
          !(element.area?.hide && !this.isAreaHideDisabled())) ||
        (element.control?.flexDirection === FlexDirection.COLUMN &&
          (element.controlComponent === ControlComponent.CHECKBOX ||
            element.controlComponent === ControlComponent.RADIO) &&
          preElement?.controlComponent === ControlComponent.VALUE) ||
        (i !== 0 &&
          element.value === ZERO &&
          !(element.area?.hide && !this.isAreaHideDisabled()))
      // 是否宽度不足导致换行
      const isWidthNotEnough = curRowWidth > availableWidth
      const isWrap = isForceBreak || isWidthNotEnough
      // 新行数据处理
      if (isWrap) {
        const row: IRow = {
          width: metrics.width,
          height,
          startIndex: i,
          elementList: [rowElement],
          ascent,
          rowIndex: curRow.rowIndex + 1,
          rowFlex: elementList[i]?.rowFlex || elementList[i + 1]?.rowFlex,
          isPageBreak: element.type === ElementType.PAGE_BREAK,
          ...(isColumnEnabled ? { columnIndex: currentColumn } : {})
        }
        // 控件缩进
        if (
          rowElement.controlComponent !== ControlComponent.PREFIX &&
          rowElement.control?.indentation === ControlIndentation.VALUE_START
        ) {
          // 查找到非前缀的第一个元素位置
          const preStartIndex = curRow.elementList.findIndex(
            el =>
              el.controlId === rowElement.controlId &&
              el.controlComponent !== ControlComponent.PREFIX
          )
          if (~preStartIndex) {
            const preRowPositionList = this.position.computeRowPosition({
              row: curRow,
              innerWidth: this.getInnerWidth()
            })
            const valueStartPosition = preRowPositionList[preStartIndex]
            if (valueStartPosition) {
              row.offsetX = valueStartPosition.coordinate.leftTop[0]
            }
          }
        }
        // 列表缩进
        if (element.listId) {
          row.isList = true
          row.offsetX =
            (listStyleMap.get(element.listId!) || 0) +
            (element.listLevel
              ? this.listParticle.LIST_INDENT_WIDTH * element.listLevel * scale
              : 0)
          row.listIndex = listIndexMap.get(element.listId!) ?? 0
        }
        // Y轴偏移量
        row.offsetY =
          !isFromTable &&
          element.area?.top &&
          element.areaId !== elementList[i - 1]?.areaId
            ? element.area.top * scale
            : 0
        rowList.push(row)
      } else {
        curRow.width += metrics.width
        // 减小块元素前第一行空行行高
        if (
          i === 0 &&
          (getIsBlockElement(elementList[1]) || !!elementList[1]?.areaId)
        ) {
          curRow.height = defaultBasicRowMarginHeight
          curRow.ascent = defaultBasicRowMarginHeight
        } else if (curRow.height < height) {
          curRow.height = height
          curRow.ascent = ascent
        }
        curRow.elementList.push(rowElement)
      }
      // 行结束时逻辑
      if (isWrap || i === elementList.length - 1) {
        // 行内全部为隐藏元素时 => 行高折叠（仅当行内不止换行符一个元素时）
        if (!this.isDesignMode() && curRow.height > 0) {
          const visibleElements = curRow.elementList.filter(
            el => el.value !== ZERO
          )
          const isAllHidden =
            visibleElements.length > 0 &&
            visibleElements.every(
              el =>
                el.hide ||
                el.control?.hide ||
                (el.area?.hide && !this.isAreaHideDisabled()) ||
                this.traceParticle.isTraceHidden(el)
            )
          if (isAllHidden) {
            curRow.height = 0
          }
        }
        // 换行原因：宽度不足
        curRow.isWidthNotEnough = isWidthNotEnough && !isForceBreak
        // 两端对齐、分散对齐
        if (
          !curRow.isSurround &&
          (preElement?.rowFlex === RowFlex.JUSTIFY ||
            (preElement?.rowFlex === RowFlex.ALIGNMENT &&
              curRow.isWidthNotEnough))
        ) {
          // 忽略换行符及尾部元素间隔设置
          const rowElementList =
            curRow.elementList[0]?.value === ZERO
              ? curRow.elementList.slice(1)
              : curRow.elementList
          const gap =
            (availableWidth - curRow.width) / (rowElementList.length - 1)
          for (let e = 0; e < rowElementList.length - 1; e++) {
            const el = rowElementList[e]
            el.metrics.width += gap
          }
          curRow.width = availableWidth
        }
      }
      // 重新计算坐标、页码、下一行首行元素环绕交叉
      if (isWrap) {
        const columnOffset = !layout ? 0 : layout.offsets[currentColumn] || 0
        x = startX + columnOffset
        y += curRow.height
        if (isPagingMode && !isFromTable && pageHeight) {
          const curMainOuterHeight = this.getMainOuterHeight(pageNo)
          const isOverflow =
            y - pageStartY + curMainOuterHeight + height > pageHeight
          const isPageBreakElement = element.type === ElementType.PAGE_BREAK
          if (isOverflow || isPageBreakElement) {
            if (
              !isPageBreakElement &&
              isColumnEnabled &&
              layout &&
              currentColumn < layout.count - 1
            ) {
              currentColumn += 1
              y = pageStartY
              x = startX + (layout.offsets[currentColumn] || 0)
            } else {
              // 删除多余四周环绕型元素
              deleteSurroundElementList(surroundElementList, pageNo)
              pageNo += 1
              currentColumn = 0
              pageStartY =
                this.getMargins()[0] + this.getHeader().getExtraHeight(pageNo)
              y = pageStartY
              x = startX + (layout ? layout.offsets[0] || 0 : 0)
            }
          }
        }
        // 同步新行的栏索引（栏游标可能在翻栏/翻页逻辑中变化）
        const nextRow = rowList[rowList.length - 1]
        if (nextRow && isColumnEnabled && nextRow.columnIndex !== undefined) {
          nextRow.columnIndex = currentColumn
        }
        // 计算下一行第一个元素是否存在环绕交叉
        rowElement.left = 0
        const surroundPosition = this.position.setSurroundPosition({
          pageNo,
          rowElement,
          row: nextRow,
          rowElementRect: {
            x,
            y,
            height,
            width: metrics.width
          },
          availableWidth,
          surroundElementList
        })
        x = surroundPosition.x
        x += metrics.width
      }
    }
    return rowList
  }

  private _computePageList(): IRow[][] {
    const pageRowList: IRow[][] = [[]]
    const {
      pageMode,
      pageNumber: { maxPageNo }
    } = this.options
    const height = this.getHeight()
    let pageNo = 0
    if (pageMode === PageMode.CONTINUITY) {
      const marginHeight = this.getMainOuterHeight(0)
      let pageHeight = marginHeight
      pageRowList[0] = this.rowList
      // 重置高度
      pageHeight += this.rowList.reduce(
        (pre, cur) => pre + cur.height + (cur.offsetY || 0),
        0
      )
      const dpr = this.getPagePixelRatio()
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
      // 每页页眉/页脚禁用状态可能不同，按页计算外部占位高度
      let pageHeight = this.getMainOuterHeight(0)
      let prevColumnIndex: number | undefined = undefined
      for (let i = 0; i < this.rowList.length; i++) {
        const row = this.rowList[i]
        const rowOffsetY = row.offsetY || 0
        // 分栏内栏切换：重置当前页累计高度，留在本页
        const columnChanged =
          prevColumnIndex !== undefined &&
          row.columnIndex !== undefined &&
          row.columnIndex > 0 &&
          row.columnIndex !== prevColumnIndex
        if (columnChanged) {
          pageHeight = this.getMainOuterHeight(pageNo) + row.height + rowOffsetY
          pageRowList[pageNo].push(row)
        } else if (
          row.height + rowOffsetY + pageHeight > height ||
          this.rowList[i - 1]?.isPageBreak
        ) {
          if (Number.isInteger(maxPageNo) && pageNo >= maxPageNo!) {
            // 跨页表格片段共享元素索引：按片段边界裁剪表格，
            // 保留已展示片段内容，不能直接按共享索引整体截断
            const fragment = row.tableFragment
            const tableElement = this.elementList[row.startIndex]
            if (
              fragment &&
              tableElement?.type === ElementType.TABLE &&
              this.tablePaging.truncateTableByFragment(
                tableElement,
                fragment,
                this.elementList
              )
            ) {
              this.elementList = this.elementList.slice(0, row.startIndex + 1)
            } else {
              this.elementList = this.elementList.slice(0, row.startIndex)
            }
            break
          }
          pageNo++
          pageHeight = this.getMainOuterHeight(pageNo) + row.height + rowOffsetY
          pageRowList.push([row])
        } else {
          pageHeight += row.height + rowOffsetY
          pageRowList[pageNo].push(row)
        }
        prevColumnIndex = row.columnIndex
      }
    }
    return pageRowList
  }

  private _drawHighlight(
    ctx: CanvasRenderingContext2D,
    payload: IDrawRowPayload
  ) {
    const { rowList, positionList, elementList } = payload
    const marginHeight = this.getDefaultBasicRowMarginHeight()
    const highlightMarginHeight = this.getHighlightMarginHeight()
    for (let i = 0; i < rowList.length; i++) {
      const curRow = rowList[i]
      for (let j = 0; j < curRow.elementList.length; j++) {
        const element = curRow.elementList[j]
        const preElement = curRow.elementList[j - 1]
        // 高亮配置：元素 > 控件配置
          const highlight =
            element.highlight ||
            this.control.getControlHighlight(
              elementList,
              element.sourceIndex ?? curRow.startIndex + j
            )
        if (highlight) {
          // 高亮元素相连需立即绘制，并记录下一元素坐标
          if (
            preElement &&
            preElement.highlight &&
            preElement.highlight !== element.highlight
          ) {
            this.highlight.render(ctx)
          }
          // 当前元素位置信息记录（表格跨页片段行优先使用片段位置）
          const position = this.getRowElementPosition(
            curRow,
            positionList,
            element,
            j
          )
          if (!position) continue
          const {
            coordinate: {
              leftTop: [x, y]
            }
          } = position
          // 元素向左偏移量
          const offsetX = element.left || 0
          const engineRect = this.getEngineHighlightRect(
            curRow,
            element,
            position
          )
          this.highlight.recordFillInfo(
            ctx,
            engineRect?.x ?? x - offsetX,
            y + marginHeight - highlightMarginHeight, // 先减去行margin，再加上高亮margin
            engineRect?.width ?? element.metrics.width + offsetX,
            curRow.height - 2 * marginHeight + 2 * highlightMarginHeight,
            highlight
          )
        } else if (preElement?.highlight) {
          // 之前是高亮元素，当前不是需立即绘制
          this.highlight.render(ctx)
        }
      }
      this.highlight.render(ctx)
    }
  }

  public drawRow(ctx: CanvasRenderingContext2D, payload: IDrawRowPayload) {
    // 优先绘制高亮元素
    this._drawHighlight(ctx, payload)
    // 绘制元素、下划线、删除线、选区
    const {
      scale,
      table: { tdPadding },
      group,
      lineBreak,
      whiteSpace
    } = this.options
    const {
      rowList,
      pageNo,
      elementList,
      positionList,
      startIndex,
      zone,
      isDrawLineBreak = !lineBreak.disabled,
      isDrawWhiteSpace = !whiteSpace.disabled,
      isDrawRange = true
    } = payload
    const isPrintMode = this.isPrintMode()
    const isGraffitiMode = this.isGraffitiMode()
    const { isCrossRowCol, tableId } = this.range.getRange()
    let index = startIndex
    for (let i = 0; i < rowList.length; i++) {
      const curRow = rowList[i]
      // 选区绘制记录（legacy：单矩形 width+=；text-engine：视觉矩形列表）
      const rangeRecord: IElementFillRect = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
      const rangeVisualRects: VisualRect[] = []
      const isTextEngineRow = !!curRow.engineLine
      let tableRangeElement: IElement | null = null
      for (let j = 0; j < curRow.elementList.length; j++) {
        const element = curRow.elementList[j]
        // 表格跨页片段行：索引以行起始数据索引为基准，
        // 避免同页多片段时选区记录索引漂移
        if (curRow.tableFragment) {
          index = curRow.startIndex + j
        }
        const metrics = element.metrics
        // 当前元素位置信息（表格跨页片段行优先使用片段位置）
        const position = this.getRowElementPosition(
          curRow,
          positionList,
          element,
          j
        )
        if (!position) continue
        const {
          ascent: offsetY,
          coordinate: {
            leftTop: [x, y]
          }
        } = position
        const preElement = curRow.elementList[j - 1]
        // 元素绘制
        if (
          (element.hide ||
            element.control?.hide ||
            (element.area?.hide && !this.isAreaHideDisabled()) ||
            this.traceParticle.isTraceHidden(element)) &&
          !this.isDesignMode()
        ) {
          // 控件隐藏时不绘制
          this.textParticle.complete()
        } else if (element.type === ElementType.IMAGE) {
          this.textParticle.complete()
          // 浮动图片单独绘制
          if (
            element.imgDisplay !== ImageDisplay.SURROUND &&
            element.imgDisplay !== ImageDisplay.FLOAT_TOP &&
            element.imgDisplay !== ImageDisplay.FLOAT_BOTTOM
          ) {
            this.imageParticle.render(ctx, element, x, y + offsetY)
          }
        } else if (element.type === ElementType.LATEX) {
          this.textParticle.complete()
          this.laTexParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.TABLE) {
          if (isCrossRowCol) {
            rangeRecord.x = x
            rangeRecord.y = y
            tableRangeElement = element
          }
          this.tableParticle.render(ctx, element, x, y, curRow.tableFragment)
        } else if (element.type === ElementType.HYPERLINK) {
          this.textParticle.complete()
          // text-engine：与正文一致走 GlyphRenderer（RTL 连写/visualLeft）；Particle 仅 legacy
          this.hyperlinkParticle.ensureDefaults(element)
          if (!this.rowUsesGlyphRenderer(curRow)) {
            this.hyperlinkParticle.render(ctx, element, x, y + offsetY)
          }
        } else if (element.type === ElementType.LABEL) {
          this.textParticle.complete()
          // text-engine：文字走 GlyphRenderer；背景仍画，避免 RTL 双绘
          this.labelParticle.ensureDefaults(element)
          if (this.rowUsesGlyphRenderer(curRow)) {
            // positionList 已是绝对坐标；勿用行内 visualLeft 当 canvas x
            this.labelParticle.renderBackground(
              ctx,
              element,
              x,
              y + offsetY
            )
          } else {
            this.labelParticle.render(ctx, element, x, y + offsetY)
          }
        } else if (element.type === ElementType.DATE) {
          // text-engine：与正文一致走 GlyphRenderer，避免 TextParticle 双绘
          if (this.rowUsesGlyphRenderer(curRow)) {
            this.textParticle.complete()
          } else {
            const nextElement = curRow.elementList[j + 1]
            // 释放之前的
            if (!preElement || preElement.dateId !== element.dateId) {
              this.textParticle.complete()
            }
            this.textParticle.record(ctx, element, x, y + offsetY)
            if (!nextElement || nextElement.dateId !== element.dateId) {
              // 手动触发渲染
              this.textParticle.complete()
            }
          }
        } else if (element.type === ElementType.SUPERSCRIPT) {
          this.textParticle.complete()
          // text-engine：上下标由 GlyphRenderer（baselineShift）绘制，避免与 Particle 双绘
          if (!this.rowUsesGlyphRenderer(curRow)) {
            this.superscriptParticle.render(ctx, element, x, y + offsetY)
          }
        } else if (element.type === ElementType.SUBSCRIPT) {
          this.underline.render(ctx)
          this.textParticle.complete()
          if (!this.rowUsesGlyphRenderer(curRow)) {
            this.subscriptParticle.render(ctx, element, x, y + offsetY)
          }
        } else if (element.type === ElementType.SEPARATOR) {
          this.separatorParticle.render(ctx, element, x, y)
        } else if (element.type === ElementType.PAGE_BREAK) {
          if (this.mode !== EditorMode.CLEAN && !isPrintMode) {
            this.pageBreakParticle.render(ctx, element, x, y)
          }
        } else if (
          element.type === ElementType.CHECKBOX ||
          element.controlComponent === ControlComponent.CHECKBOX
        ) {
          this.textParticle.complete()
          this.checkboxParticle.render({
            ctx,
            x,
            y: y + offsetY,
            index: j,
            row: curRow
          })
        } else if (
          element.type === ElementType.RADIO ||
          element.controlComponent === ControlComponent.RADIO
        ) {
          this.textParticle.complete()
          this.radioParticle.render({
            ctx,
            x,
            y: y + offsetY,
            index: j,
            row: curRow
          })
        } else if (element.type === ElementType.TAB) {
          this.textParticle.complete()
        } else if (
          element.rowFlex === RowFlex.ALIGNMENT ||
          element.rowFlex === RowFlex.JUSTIFY
        ) {
          // HarfBuzz path 行交给 GlyphRenderer；否则走 TextParticle
          if (!this.rowUsesGlyphRenderer(curRow)) {
            this.textParticle.record(ctx, element, x, y + offsetY)
            this.textParticle.complete()
          }
        } else if (element.type === ElementType.BLOCK) {
          this.textParticle.complete()
          this.blockParticle.render(ctx, pageNo, element, x, y + offsetY)
        } else if (this.rowUsesGlyphRenderer(curRow)) {
          // Skip TextParticle — drawn via GlyphRenderer below
        } else {
          // 如果当前元素设置左偏移，则上一元素立即绘制
          if (element.left) {
            this.textParticle.complete()
          }
          this.textParticle.record(ctx, element, x, y + offsetY)
          // 如果设置字宽、字间距、标点符号（避免浏览器排版缩小间距）需单独绘制
          if (
            element.width ||
            element.letterSpacing ||
            PUNCTUATION_REG.test(element.value)
          ) {
            this.textParticle.complete()
          }
        }
        // 换行符绘制
        if (
          isDrawLineBreak &&
          !isPrintMode &&
          this.mode !== EditorMode.CLEAN &&
          !curRow.isWidthNotEnough &&
          j === curRow.elementList.length - 1
        ) {
          this.lineBreakParticle.render(ctx, element, x, y + curRow.height / 2)
        }
        // 空白符绘制
        if (isDrawWhiteSpace && WHITE_SPACE_REG.test(element.value)) {
          this.whiteSpaceParticle.render(ctx, element, x, y + curRow.height / 2)
        }
        // 边框绘制（目前仅支持控件）
        if (element.control?.border) {
          // 不同控件边框立刻绘制
          if (
            preElement?.control?.border &&
            preElement.controlId !== element.controlId
          ) {
            this.control.drawBorder(ctx)
          }
          // 当前元素位置信息记录
          const rowMargin = this.getElementRowMargin(element)
          this.control.recordBorderInfo(
            x,
            y + rowMargin,
            element.metrics.width,
            curRow.height - 2 * rowMargin
          )
        } else if (preElement?.control?.border) {
          this.control.drawBorder(ctx)
        }
        // 下划线记录
        if (element.underline || element.control?.underline) {
          // 下标元素下划线单独绘制
          if (
            preElement?.type === ElementType.SUBSCRIPT &&
            element.type !== ElementType.SUBSCRIPT
          ) {
            this.underline.render(ctx)
          }
          // 行间距
          const rowMargin = this.getElementRowMargin(element)
          // 优先用 position.left：text-engine 的 position.x 已含 left，
          // 若 element.left 在定位后被清掉，用 element.left 会使 x-offsetX 失效、底线右漂
          const posItem = this.getRowElementPosition(
            curRow,
            positionList,
            element,
            j
          )
          const offsetX = posItem?.left || element.left || 0
          // 下标元素y轴偏移值
          let subOffsetY = 0
          if (element.type === ElementType.SUBSCRIPT) {
            subOffsetY = this.subscriptParticle.getOffsetY(element)
          }
          // 占位符不参与颜色计算
          const color = element.control?.underline
            ? this.options.underlineColor
            : element.color
          // text-engine：基线 + descent（Underline.render 会再 +2*lineWidth）
          // legacy：贴行底
          const underlineY = curRow.engineLine
            ? y +
              offsetY +
              Math.max(0, metrics.boundingBoxDescent) +
              subOffsetY
            : y + curRow.height - rowMargin + subOffsetY
          let underlineX = x - offsetX
          let underlineW = metrics.width + offsetX
          if (underlineW < 0) {
            underlineX = x
            underlineW = -underlineW
          }
          // minWidth 后缀空隙：从控件内上一内容右缘接到 postfix 位，避免输入后底线断层右漂
          if (
            curRow.engineLine &&
            element.controlComponent === ControlComponent.POSTFIX &&
            offsetX !== 0 &&
            element.control?.minWidth
          ) {
            let gapStart = underlineX
            for (let k = j - 1; k >= 0; k--) {
              const prev = curRow.elementList[k]
              if (prev.controlId !== element.controlId) break
              if (
                prev.controlComponent === ControlComponent.VALUE ||
                prev.controlComponent === ControlComponent.PREFIX ||
                prev.controlComponent === ControlComponent.PLACEHOLDER
              ) {
                const prevPos = this.getRowElementPosition(
                  curRow,
                  positionList,
                  prev,
                  k
                )
                if (prevPos) {
                  gapStart =
                    prevPos.coordinate.leftTop[0] + (prev.metrics?.width || 0)
                }
                break
              }
            }
            if (curRow.direction === 'rtl') {
              // RTL：postfix 已左移，空隙在标签左侧，底线从 postfix 向右接到内容
              underlineX = x
              underlineW = Math.max(0, gapStart - x)
            } else {
              underlineX = gapStart
              underlineW = Math.max(0, x - gapStart)
            }
          }
          this.underline.recordFillInfo(
            ctx,
            underlineX,
            underlineY,
            underlineW,
            0,
            color,
            element.textDecoration?.style
          )
        } else if (preElement?.underline || preElement?.control?.underline) {
          this.underline.render(ctx)
        }
        // 删除线记录
        if (element.strikeout) {
          // 仅文本类元素支持删除线
          if (!element.type || TEXTLIKE_ELEMENT_TYPE.includes(element.type)) {
            // 字体大小不同时需立即绘制
            if (
              preElement &&
              ((preElement.type === ElementType.SUBSCRIPT &&
                element.type !== ElementType.SUBSCRIPT) ||
                (preElement.type === ElementType.SUPERSCRIPT &&
                  element.type !== ElementType.SUPERSCRIPT) ||
                this.getElementSize(preElement) !==
                  this.getElementSize(element))
            ) {
              this.strikeout.render(ctx)
            }
            // 基线文字测量信息
            const standardMetrics = this.textParticle.measureBasisWord(
              ctx,
              this.getElementFont(element)
            )
            // text-engine：穿过字身中部（相对基线）；legacy：原公式
            let adjustY = curRow.engineLine
              ? y + offsetY - metrics.height * 0.3
              : y +
                offsetY +
                standardMetrics.actualBoundingBoxDescent * scale -
                metrics.height / 2
            // 上下标位置调整
            if (element.type === ElementType.SUBSCRIPT) {
              adjustY += this.subscriptParticle.getOffsetY(element)
            } else if (element.type === ElementType.SUPERSCRIPT) {
              adjustY += this.superscriptParticle.getOffsetY(element)
            }
            this.strikeout.recordFillInfo(ctx, x, adjustY, metrics.width)
          }
        } else if (preElement?.strikeout) {
          this.strikeout.render(ctx)
        }
        // 留痕装饰
        this.traceParticle.render({
          ctx,
          element,
          x,
          y,
          curRow,
          metrics,
          offsetY,
          scale
        })
        // 选区记录
        const {
          zone: currentZone,
          startIndex,
          endIndex
        } = this.range.getRange()
        if (
          isDrawRange &&
          currentZone === zone &&
          startIndex !== endIndex &&
          startIndex <= index &&
          index <= endIndex
        ) {
          const positionContext = this.position.getPositionContext()
          // 表格需限定上下文
          if (
            (!positionContext.isTable && !element.tdId) ||
            positionContext.tdId === element.tdId
          ) {
            // text-engine：按 visualLeft 字盒收集（行末再用 engineLine 校正墨迹）
            if (isTextEngineRow) {
              if (startIndex === index) {
                const nextElement = elementList[startIndex + 1]
                if (nextElement && nextElement.value === ZERO) {
                  const left = x + metrics.width
                  rangeVisualRects.push({
                    left,
                    right: left + this.options.rangeMinWidth,
                    y,
                    height: curRow.height
                  })
                }
              } else {
                // 零宽组合符也要纳入，否则印地/泰文选区盖不住连写
                const rangeWidth =
                  metrics.width > 0
                    ? metrics.width
                    : curRow.elementList.length === 1
                      ? this.options.rangeMinWidth
                      : 0
                rangeVisualRects.push({
                  left: x,
                  right: x + Math.max(rangeWidth, 0),
                  y,
                  height: curRow.height
                })
              }
            } else if (startIndex === index) {
              // 从行尾开始-绘制最小宽度
              const nextElement = elementList[startIndex + 1]
              if (nextElement && nextElement.value === ZERO) {
                rangeRecord.x = x + metrics.width
                rangeRecord.y = y
                rangeRecord.height = curRow.height
                rangeRecord.width += this.options.rangeMinWidth
              }
            } else {
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
        // 组信息记录
        if (!group.disabled && element.groupIds) {
          const engineRect = this.getEngineHighlightRect(curRow, element, {
            coordinate: {
              leftTop: [x, y]
            }
          } as import('../../interface/Element').IElementPosition)
          this.group.recordFillInfo(
            element,
            engineRect?.x ?? x,
            y,
            engineRect?.width ?? metrics.width,
            curRow.height
          )
        }
        index++
        // 绘制表格内元素
        if (
          element.type === ElementType.TABLE &&
          !element.hide &&
          !this.traceParticle.isTraceHidden(element)
        ) {
          const tdPaddingWidth = tdPadding[1] + tdPadding[3]
          const fragment = curRow.tableFragment
          // 续页回显表头内容（使用一次性位置列表，不绘制选区）
          if (curRow.repeatTdPositionList?.length) {
            for (const {
              td,
              positionList: repeatPositionList
            } of curRow.repeatTdPositionList) {
              this.drawRow(ctx, {
                elementList: td.value,
                positionList: repeatPositionList,
                rowList: td.rowList!,
                pageNo,
                startIndex: 0,
                innerWidth: (td.width! - tdPaddingWidth) * scale,
                zone,
                isDrawLineBreak,
                isDrawRange: false
              })
            }
          }
          // 遍历片段范围行与进位合并单元格，仅绘制窗口内的内容行
          const fragmentTdList = fragment
            ? this.tableParticle.getFragmentTdList(element, fragment)
            : element.trList!.flatMap(tr => tr.tdList)
          for (const td of fragmentTdList) {
            let rowList = td.rowList!
            let startIndex = 0
            if (fragment) {
              const [windowStart, windowEnd] =
                this.tableParticle.getTdWindowInFragment(td, element, fragment)
              if (windowEnd <= windowStart) continue
              if (windowStart > 0 || windowEnd < td.height!) {
                const visible = this.tableParticle.getTdVisibleRowListByWindow(
                  td,
                  windowStart,
                  windowEnd
                )
                rowList = visible.rowList
                startIndex = visible.startIndex
              }
            }
            this.drawRow(ctx, {
              elementList: td.value,
              positionList: td.positionList!,
              rowList,
              pageNo,
              startIndex,
              innerWidth: (td.width! - tdPaddingWidth) * scale,
              zone,
              isDrawLineBreak
            })
          }
        }
      }
      // 绘制列表样式
      if (curRow.isList && curRow.height > 0) {
          this.listParticle.drawListStyle(
            ctx,
            curRow,
            positionList[
              curRow.elementList[0]?.sourceIndex ?? curRow.startIndex
            ]
        )
      }
      // 绘制文字、边框、下划线、删除线
      this.textParticle.complete()
      // 仅在 HarfBuzz 产出 path 时用 GlyphRenderer（连字）；否则 TextParticle 已按 visualLeft 画完
      if (this.rowUsesGlyphRenderer(curRow) && curRow.engineLine) {
        const anchor = curRow.elementList.find(
          el =>
            el.visualLeft !== undefined &&
            el.value !== ZERO &&
            !this.isGlyphPaintSkipped(el)
        )
          const anchorPos =
            curRow.fragmentPosition ||
            positionList[
              anchor
                ? anchor.sourceIndex ??
                  curRow.startIndex + curRow.elementList.indexOf(anchor)
                : curRow.startIndex
            ]
        if (anchor && anchorPos) {
          // leftTop = rowOrigin + visualLeft + left；原点须回到 rowOrigin
          const originX =
            anchorPos.coordinate.leftTop[0] -
            (anchor.visualLeft || 0) -
            (anchor.left || 0)
          const baselineY = anchorPos.coordinate.leftTop[1] + curRow.ascent
          // isCompute:false（如改颜色）时同步 live 样式，避免画到缓存里的旧 style
          const liveLine = this._syncEngineLineStyles(
            curRow.engineLine as import('../text-engine/types').LayoutLine,
            elementList
          )
          const paintLine = this.filterEngineLineForPaint(liveLine, elementList)
          if (paintLine.glyphs.length) {
            this.layoutHostAdapter.getGlyphRenderer().drawLine(
              ctx,
              paintLine,
              originX,
              baselineY,
              curRow.engineParagraphText
            )
          }
        }
      }
      this.control.drawBorder(ctx)
      this.underline.render(ctx)
      this.strikeout.render(ctx)
      // 冲刷留痕累积
      this.traceParticle.flush(ctx)
      // 绘制批注样式
      this.group.render(ctx)
      // 绘制选区
      if (!isPrintMode && !isGraffitiMode) {
        if (rangeVisualRects.length) {
          // 复杂文种：用 engineLine 字形盒 + measureText 墨迹校正，避免选区短于连写
          const {
            startIndex: selStart,
            endIndex: selEnd
          } = this.range.getRange()
          const corrected = this._correctEngineSelectionRects(
            ctx,
            curRow,
            positionList,
            rangeVisualRects,
            selStart,
            selEnd
          )
          const merged = mergeVisualRects(corrected)
          for (const rect of merged) {
            this.range.render(
              ctx,
              rect.left,
              rect.y,
              rect.right - rect.left,
              rect.height
            )
          }
        } else if (rangeRecord.width && rangeRecord.height) {
          const { x, y, width, height } = rangeRecord
          this.range.render(ctx, x, y, width, height)
        }
        if (
          isDrawRange &&
          isCrossRowCol &&
          tableRangeElement &&
          tableRangeElement.id === tableId
        ) {
          const position = this.getRowElementPosition(
            curRow,
            positionList,
            tableRangeElement,
            0
          )
          if (!position) continue
          const {
            coordinate: {
              leftTop: [x, y]
            }
          } = position
          this.tableParticle.drawRange(
            ctx,
            tableRangeElement,
            x,
            y,
            curRow.tableFragment
          )
        }
      }
    }
  }

  private _drawFloat(
    ctx: CanvasRenderingContext2D,
    payload: IDrawFloatPayload
  ) {
    const floatPositionList = this.position.getFloatPositionList()
    const { imgDisplays, pageNo } = payload
    for (let e = 0; e < floatPositionList.length; e++) {
      const floatPosition = floatPositionList[e]
      const element = floatPosition.element
      if (
        (pageNo === floatPosition.pageNo ||
          floatPosition.zone === EditorZone.HEADER ||
          floatPosition.zone == EditorZone.FOOTER) &&
        element.imgDisplay &&
        imgDisplays.includes(element.imgDisplay) &&
        element.type === ElementType.IMAGE
      ) {
        const { x, y } = this.position.getFloatPositionCoordinate(floatPosition)
        this.imageParticle.render(ctx, element, x, y)
      }
    }
  }

  private _clearPage(pageNo: number) {
    const ctx = this.ctxList[pageNo]
    const pageDom = this.pageList[pageNo]
    ctx.clearRect(
      0,
      0,
      Math.max(pageDom.width, this.getWidth()),
      Math.max(pageDom.height, this.getHeight())
    )
    this.blockParticle.clear()
  }

  private _drawPage(payload: IDrawPagePayload) {
    const { elementList, positionList, rowList, pageNo } = payload
    const {
      inactiveAlpha,
      pageMode,
      header,
      footer,
      pageNumber,
      lineNumber,
      pageBorder
    } = this.options
    const isPrintMode = this.mode === EditorMode.PRINT
    const isContinuityMode = pageMode === PageMode.CONTINUITY
    const innerWidth = this.getInnerWidth()
    const ctx = this.ctxList[pageNo]
    // 判断当前激活区域-非正文区域时元素透明度降低
    ctx.globalAlpha = !this.zone.isMainActive() ? inactiveAlpha : 1
    this._clearPage(pageNo)
    // 绘制背景
    if (
      !isPrintMode ||
      !this.options.modeRule[EditorMode.PRINT]?.backgroundDisabled
    ) {
      this.background.render(ctx, pageNo)
    }
    // 绘制区域
    if (!isPrintMode) {
      this.area.render(ctx, pageNo)
    }
    // 绘制分栏分隔线
    this.columnManager.drawSeparator(ctx, pageNo)
    // 绘制水印（底层）
    if (
      !isContinuityMode &&
      this.options.watermark.data &&
      this.options.watermark.layer === WatermarkLayer.BOTTOM
    ) {
      this.waterMark.render(ctx, pageNo)
    }
    // 绘制页边距
    if (!isPrintMode) {
      this.margin.render(ctx, pageNo)
    }
    // 渲染衬于文字下方元素
    this._drawFloat(ctx, {
      pageNo,
      imgDisplays: [ImageDisplay.FLOAT_BOTTOM]
    })
    // 控件高亮
    if (!isPrintMode) {
      this.control.renderHighlightList(ctx, pageNo)
    }
    // 渲染元素
    const index = rowList[0]?.startIndex
    this.drawRow(ctx, {
      elementList,
      positionList,
      rowList,
      pageNo,
      startIndex: index,
      innerWidth,
      zone: EditorZone.MAIN
    })
    if (this.getIsPagingMode()) {
      // 绘制页眉
      if (!header.disabled) {
        this.header.render(ctx, pageNo)
      }
      // 绘制页码
      if (!pageNumber.disabled) {
        this.pageNumber.render(ctx, pageNo)
      }
      // 绘制页脚
      if (!footer.disabled) {
        this.footer.render(ctx, pageNo)
      }
    }
    // 渲染浮于文字上方元素
    this._drawFloat(ctx, {
      pageNo,
      imgDisplays: [ImageDisplay.FLOAT_TOP, ImageDisplay.SURROUND]
    })
    // 搜索匹配绘制
    if (!isPrintMode && this.search.getSearchKeyword()) {
      this.search.render(ctx, pageNo)
    }
    // 绘制空白占位符
    if (this.elementList.length <= 1 && !this.elementList[0]?.listId) {
      this.placeholder.render(ctx)
    }
    // 渲染行数
    if (!lineNumber.disabled) {
      this.lineNumber.render(ctx, pageNo)
    }
    // 绘制页面边框
    if (!pageBorder.disabled) {
      this.pageBorder.render(ctx)
    }
    // 绘制签章
    this.badge.render(ctx, pageNo)
    // 绘制涂鸦
    if (this.isGraffitiMode()) {
      this.graffiti.render(ctx, pageNo)
    }
    // 绘制水印（顶层）
    if (
      !isContinuityMode &&
      this.options.watermark.data &&
      this.options.watermark.layer === WatermarkLayer.TOP
    ) {
      this.waterMark.render(ctx, pageNo)
    }
  }

  private _disconnectLazyRender() {
    this.lazyRenderIntersectionObserver?.disconnect()
  }

  private _lazyRender() {
    const positionList = this.position.getOriginalMainPositionList()
    const elementList = this.getOriginalMainElementList()
    this._disconnectLazyRender()
    this.lazyRenderIntersectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Number((<HTMLCanvasElement>entry.target).dataset.index)
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
    this.renderCount++
    const { header, footer } = this.options
    const {
      isSubmitHistory = true,
      isSetCursor = true,
      isCompute = true,
      isLazy = true,
      isInit = false,
      isSourceHistory = false,
      isFirstRender = false
    } = payload || {}
    let { curIndex } = payload || {}
    const innerWidth = this.getInnerWidth()
    const isPagingMode = this.getIsPagingMode()
    // 缓存当前页数信息
    const oldPageSize = this.pageRowList.length
    // 计算文档信息
    if (isCompute) {
      // 清空浮动元素位置信息
      this.position.setFloatPositionList([])
      if (isPagingMode) {
        // 分栏信息
        this.columnManager.compute()
        // 页眉信息
        if (!header.disabled) {
          this.header.compute()
        }
        // 页脚信息
        if (!footer.disabled) {
          this.footer.compute()
        }
      }
      // 行信息
      const margins = this.getMargins()
      const pageHeight = this.getHeight()
      const extraHeight = this.header.getExtraHeight()
      const startX = margins[3]
      const startY = margins[0] + extraHeight
      const surroundElementList = pickSurroundElementList(this.elementList)
      this.rowList = this.computeRowList({
        startX,
        startY,
        pageHeight,
        isPagingMode,
        innerWidth,
        surroundElementList,
        elementList: this.elementList,
        layoutScope: 'main'
      })
      // 分页模式下跨页表格在渲染层拆分为按页片段行
      if (isPagingMode) {
        this.rowList = this.tablePaging.splitTableRowAcrossPages(this.rowList)
      }
      // 页面信息
      this.pageRowList = this._computePageList()
      // 位置信息
      this.position.computePositionList()
      // 区域信息
      this.area.compute()
      if (!this.isPrintMode()) {
        // 搜索信息
        const searchKeyword = this.search.getSearchKeyword()
        if (searchKeyword) {
          this.search.compute(searchKeyword)
        }
        // 控件关键词高亮
        this.control.computeHighlightList()
      }
      // 涂鸦信息
      if (this.isGraffitiMode()) {
        this.graffiti.compute()
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
      this.pageList
        .splice(curPageCount, deleteCount)
        .forEach(page => page.remove())
    }
    // 绘制元素
    // 连续页因为有高度的变化会导致canvas渲染空白，需立即渲染，否则会出现闪动
    if (isLazy && isPagingMode) {
      this._lazyRender()
    } else {
      this._immediateRender()
    }
    // 光标重绘
    if (isSetCursor) {
      curIndex = this.setCursor(curIndex)
    } else if (this.range.getIsSelection()) {
      // 存在选区时仅定位避免事件无法捕获
      this.cursor.focus()
    }
    // 历史记录用于undo、redo（非首次渲染内容变更 || 第一次存在光标时）
    if (
      (isSubmitHistory && !isFirstRender) ||
      (curIndex !== undefined && this.historyManager.isStackEmpty())
    ) {
      this.submitHistory(curIndex)
    }
    // 信息变动回调
    nextTick(() => {
      // 选区样式
      this.range.setRangeStyle()
      // 重新唤起弹窗类控件
      if (isCompute && this.control.getActiveControl()) {
        this.control.reAwakeControl()
      }
      // 表格工具重新渲染
      if (
        isCompute &&
        !this.isReadonly() &&
        this.position.getPositionContext().isTable
      ) {
        this.tableTool.render()
      }
      // 页眉指示器重新渲染
      if (isCompute && !this.zone.isMainActive()) {
        this.zone.drawZoneIndicator()
      }
      // 标尺重新渲染
      if (isCompute) {
        this.ruler.render()
      }
      // 页数改变
      if (oldPageSize !== this.pageRowList.length) {
        if (this.listener.pageSizeChange) {
          this.listener.pageSizeChange(this.pageRowList.length)
        }
        if (this.eventBus.isSubscribe('pageSizeChange')) {
          this.eventBus.emit('pageSizeChange', this.pageRowList.length)
        }
      }
      // 文档内容改变
      if ((isSubmitHistory || isSourceHistory) && !isInit) {
        if (this.listener.contentChange) {
          this.listener.contentChange()
        }
        if (this.eventBus.isSubscribe('contentChange')) {
          this.eventBus.emit('contentChange')
        }
      }
    })
  }

  public setCursor(curIndex: number | undefined) {
    const positionContext = this.position.getPositionContext()
    const positionList = this.position.getPositionList()
    if (positionContext.isTable) {
      const elementList = this.getOriginalElementList()
      const tablePositionList = this.position.getTableTdByContext(
        elementList,
        positionContext
      )?.positionList
      if (tablePositionList?.length) {
        if (curIndex === undefined) {
          curIndex = tablePositionList.length - 1
        } else if (curIndex > tablePositionList.length - 1) {
          // 光标索引超出单元格位置（如内容被截断）：收缩到末尾有效位置
          curIndex = tablePositionList.length - 1
        }
      }
      const tablePosition = tablePositionList?.[curIndex!]
      this.position.setCursorPosition(tablePosition || null)
      // 跨页表格光标所在片段可能变化，光标确定后重新锚定表格工具
      this.tableTool.render()
    } else {
      this.position.setCursorPosition(
        curIndex !== undefined ? positionList[curIndex] : null
      )
    }
    // 定位到图片元素并且位置发生变化
    let isShowCursor = true
    if (
      curIndex !== undefined &&
      positionContext.isImage &&
      positionContext.isDirectHit
    ) {
      const elementList = this.getElementList()
      const element = elementList[curIndex]
      if (IMAGE_ELEMENT_TYPE.includes(element.type!)) {
        isShowCursor = false
        const position = this.position.getCursorPosition()
        this.previewer.updateResizer(element, position)
      }
    }
    this.cursor.drawCursor({
      isShow: isShowCursor
    })
    return curIndex
  }

  public submitHistory(curIndex: number | undefined) {
    const positionContext = this.position.getPositionContext()
    const oldElementList = getSlimCloneElementList(this.elementList)
    const oldHeaderElementList = getSlimCloneElementList(
      this.header.getElementList()
    )
    const oldFooterElementList = getSlimCloneElementList(
      this.footer.getElementList()
    )
    const oldRange = deepClone(this.range.getRange())
    const pageNo = this.pageNo
    const oldPositionContext = deepClone(positionContext)
    const zone = this.zone.getZone()
    this.historyManager.execute(() => {
      this.zone.setZone(zone)
      this.setPageNo(pageNo)
      this.position.setPositionContext(deepClone(oldPositionContext))
      this.header.setElementList(deepClone(oldHeaderElementList))
      this.footer.setElementList(deepClone(oldFooterElementList))
      this.elementList = deepClone(oldElementList)
      this.range.replaceRange(deepClone(oldRange))
      this.render({
        curIndex,
        isSubmitHistory: false,
        isSourceHistory: true
      })
    })
  }

  public destroy() {
    this.container.remove()
    this.globalEvent.removeEvent()
    this.scrollObserver.removeEvent()
    this.selectionObserver.removeEvent()
    this.workerManager.destroy()
    this.magnifier.destroy()
    this.accessibility.destroy()
    this.ruler.dispose()
    this.lazyRenderIntersectionObserver?.disconnect()
  }

  public clearSideEffect() {
    // 预览工具组件
    this.getPreviewer().clearResizer()
    // 表格工具组件
    this.getTableTool().dispose()
    // 超链接弹窗
    this.getHyperlinkParticle().clearHyperlinkPopup()
    // 留痕悬浮弹窗
    this.getTraceParticle().clearTracePopup()
    // 日期控件
    this.getDateParticle().clearDatePicker()
  }
}
