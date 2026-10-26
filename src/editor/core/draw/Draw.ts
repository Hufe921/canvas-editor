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
  IElementFillRect,
  IElementStyle,
  ISpliceElementListOption,
  IInsertElementListOption
} from '../../interface/Element'
import { IMarkElementListDeletedOption } from '../../interface/Trace'
import { IRow } from '../../interface/Row'
import { IColumnLayout, IColumnOption } from '../../interface/Column'
import { ColumnManager } from './column/ColumnManager'
import { IncrementalRowComputer } from './IncrementalRowComputer'
import { LayoutEngine } from '../layout/LayoutEngine'
import { TextMeasurer } from '../layout/TextMeasurer'
import { createBackend } from '../render/BackendFactory'
import type { IRenderBackend, RenderPage } from '../render/RenderBackend'
import { DisplayList } from '../render/model/DisplayList'
import { IRenderContext } from '../render/model/RenderContext'
import {
  buildLayerKey,
  buildPageKey,
  buildRepeatHeaderKey,
  buildRowKey,
  buildTableFragmentKey,
  buildZoneKey
} from '../render/svg/scene/SceneKey'
import { convertStringToBase64, deepClone, nextTick } from '../../utils'
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
import { Spellcheck } from './interactive/Spellcheck'
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
import { HintParticle } from './particle/HintParticle'
import { TraceParticle } from './particle/TraceParticle'
import { LabelParticle } from './particle/LabelParticle'
import { Header } from './frame/Header'
import { SuperscriptParticle } from './particle/SuperscriptParticle'
import { SubscriptParticle } from './particle/SubscriptParticle'
import { SeparatorParticle } from './particle/SeparatorParticle'
import { PageBreakParticle } from './particle/PageBreakParticle'
import { Watermark } from './frame/Watermark'
import { WatermarkLayer } from '../../dataset/enum/Watermark'
import {
  BackendType,
  EditorComponent,
  EditorMode,
  EditorZone,
  PageMode,
  PaperDirection
} from '../../dataset/enum/Editor'
import { Control } from './control/Control'
import { CascadeManager } from '../cascade/CascadeManager'
import { Validate } from '../validate/Validate'
import {
  getSlimCloneElementList,
  pickSurroundElementList,
  zipElementList
} from '../../utils/element'
import { CheckboxParticle } from './particle/CheckboxParticle'
import { RadioParticle } from './particle/RadioParticle'
import { DeepRequired, IPadding } from '../../interface/Common'
import { ControlComponent } from '../../dataset/enum/Control'
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
import { ImageDisplay } from '../../dataset/enum/Common'
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
import { AreaTool } from './interactive/AreaTool'
import { Badge } from './frame/Badge'
import { Graffiti } from './graffiti/Graffiti'
import { Magnifier } from './interactive/Magnifier'
import { Accessibility } from '../accessibility/Accessibility'

export class Draw {
  private container: HTMLDivElement
  private pageContainer: HTMLDivElement
  private backend: IRenderBackend
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
  private spellcheck: Spellcheck
  private group: Group
  private area: Area
  private areaTool: AreaTool
  private underline: Underline
  private strikeout: Strikeout
  private highlight: Highlight
  private historyManager: HistoryManager
  private previewer: Previewer
  private imageParticle: ImageParticle
  private laTexParticle: LaTexParticle
  private textMeasurer: TextMeasurer
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
  private hintParticle: HintParticle
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
  // 跨页表格拆分前的原始行列表：增量计算以其为基准（片段行不参与复用定位）
  private rawRowList: IRow[]
  private incrementalRowComputer: IncrementalRowComputer
  private layoutEngine: LayoutEngine
  // maxPageNo 截断发生过（elementList 被裁剪导致行/元素失配），禁用增量
  private isElementListTruncated: boolean
  private pageRowList: IRow[][]
  private pageDirectionList: PaperDirection[]
  private painterStyle: IElementStyle | null
  private painterOptions: IPainterOption | null
  private visiblePageNoList: number[]
  private intersectionPageNo: number
  private printModeData: Required<Omit<IEditorData, 'graffiti'>> | null
  private columnManager: ColumnManager
  private ruler: Ruler

  constructor(
    rootContainer: HTMLElement,
    options: DeepRequired<IEditorOption>,
    data: IEditorData,
    listener: Listener,
    eventBus: EventBus<EventBusMap>,
    override: Override
  ) {
    this.container = this._wrapContainer(rootContainer)
    this.pageNo = 0
    this.renderCount = 0
    this.pagePixelRatio = null
    this.mode = options.mode
    this.options = options
    this.elementList = data.main
    this.pageDirectionList = [options.paperDirection]
    this.listener = listener
    this.eventBus = eventBus
    this.override = override

    this._formatContainer()
    this.pageContainer = this._createPageContainer()
    this.backend = createBackend(options.backend, this.pageContainer)
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
    this.spellcheck = new Spellcheck(this)
    this.group = new Group(this)
    this.area = new Area(this)
    this.areaTool = new AreaTool(this)
    this.underline = new Underline(this)
    this.strikeout = new Strikeout(this)
    this.highlight = new Highlight(this)
    this.previewer = new Previewer(this)
    this.imageParticle = new ImageParticle(this)
    this.laTexParticle = new LaTexParticle(this)
    this.textMeasurer = new TextMeasurer()
    this.textParticle = new TextParticle(this)
    this.tableParticle = new TableParticle(this)
    this.tablePaging = new TablePaging(this)
    this.rawRowList = []
    this.isElementListTruncated = false
    this.incrementalRowComputer = new IncrementalRowComputer(this)
    this.tableTool = new TableTool(this)
    this.tableOperate = new TableOperate(this)
    this.pageNumber = new PageNumber(this)
    this.lineNumber = new LineNumber(this)
    this.waterMark = new Watermark(this)
    this.placeholder = new Placeholder(this)
    this.header = new Header(this, data.header)
    this.footer = new Footer(this, data.footer)
    this.hyperlinkParticle = new HyperlinkParticle(this)
    this.hintParticle = new HintParticle(this)
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
    this.layoutEngine = new LayoutEngine(this)

    this.scrollObserver = new ScrollObserver(this)
    this.selectionObserver = new SelectionObserver(this)
    this.imageObserver = new ImageObserver()
    new MouseObserver(this)

    this.canvasEvent = new CanvasEvent(this)
    this.cursor = new Cursor(this, this.canvasEvent)
    this.globalEvent = new GlobalEvent(this, this.canvasEvent)
    if (!options.displayOnly) {
      // 纯只读浏览（displayOnly）：画布交互与全局事件一并断电——
      // dragover/drop（文件拖放写入通道）、click/dblclick/mouse 系
      // （光标定位/划选 machinery）均不再注册
      this.canvasEvent.register()
      this.globalEvent.register()
    }

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
    this.printModeData = null

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

  public isWordLike(word: string): boolean {
    return this.WORD_LIKE_REG.test(word)
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
      // 留痕删除不移除元素但改变可见性，同样影响布局
      this.incrementalRowComputer.markRangeDirty(elementList, index, count, 0)
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

  public getOriginalWidth(direction = this.options.paperDirection): number {
    const { width, height } = this.options
    return direction === PaperDirection.VERTICAL ? width : height
  }

  public getOriginalHeight(direction = this.options.paperDirection): number {
    const { width, height } = this.options
    return direction === PaperDirection.VERTICAL ? height : width
  }

  public getWidth(direction = this.options.paperDirection): number {
    return Math.floor(this.getOriginalWidth(direction) * this.options.scale)
  }

  public getHeight(direction = this.options.paperDirection): number {
    return Math.floor(this.getOriginalHeight(direction) * this.options.scale)
  }

  public getMainHeight(): number {
    const pageHeight = this.getHeight()
    return pageHeight - this.getMainOuterHeight()
  }

  public getMainOuterHeight(
    pageNo?: number,
    direction?: PaperDirection
  ): number {
    const curDirection =
      direction ||
      (pageNo === undefined
        ? this.options.paperDirection
        : this.getPageDirection(pageNo))
    const margins = this.getMargins(curDirection)
    const headerExtraHeight = this.header.getExtraHeight(pageNo, curDirection)
    const footerExtraHeight = this.footer.getExtraHeight(pageNo, curDirection)
    return margins[0] + margins[2] + headerExtraHeight + footerExtraHeight
  }

  public getCanvasWidth(pageNo = -1): number {
    const pageNoIndex = ~pageNo ? pageNo : this.pageNo
    const canvasPage = this.backend.canvas?.getPage(pageNoIndex)
    if (canvasPage) return canvasPage.width
    const page = this.backend.getPage(pageNoIndex)
    return Number.parseFloat(page.style.width) * this.getPagePixelRatio()
  }

  public getCanvasHeight(pageNo = -1): number {
    const pageNoIndex = ~pageNo ? pageNo : this.pageNo
    const canvasPage = this.backend.canvas?.getPage(pageNoIndex)
    if (canvasPage) return canvasPage.height
    const page = this.backend.getPage(pageNoIndex)
    return Number.parseFloat(page.style.height) * this.getPagePixelRatio()
  }

  public getInnerWidth(direction = this.options.paperDirection): number {
    const width = this.getWidth(direction)
    const margins = this.getMargins(direction)
    return width - margins[1] - margins[3]
  }

  public getColumnLayout(direction?: PaperDirection): IColumnLayout | null {
    return this.columnManager.getLayout(direction)
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
      const {
        table: { tdPadding }
      } = this.options
      return td!.width! - tdPadding[1] - tdPadding[3]
    }
    // 分栏布局下按栏宽计算可用宽度（栏宽为缩放值，还原为未缩放单位）
    const columnLayout = this.getColumnLayout()
    if (columnLayout && columnLayout.count > 1) {
      return columnLayout.width / this.options.scale
    }
    return this.getOriginalInnerWidth()
  }

  public getMargins(direction = this.options.paperDirection): IMargin {
    return <IMargin>(
      this.getOriginalMargins(direction).map(m => m * this.options.scale)
    )
  }

  public getOriginalMargins(direction = this.options.paperDirection): number[] {
    const { margins } = this.options
    return direction === PaperDirection.VERTICAL
      ? margins
      : [margins[1], margins[2], margins[3], margins[0]]
  }

  public getPageDirection(pageNo: number): PaperDirection {
    return this.pageDirectionList[pageNo] || this.options.paperDirection
  }

  public getPageDirectionList(): PaperDirection[] {
    return this.pageDirectionList
  }

  public getPageSize(pageNo: number) {
    const direction = this.getPageDirection(pageNo)
    const margins = this.getMargins(direction)
    const width = this.getWidth(direction)
    return {
      width,
      height: this.getHeight(direction),
      margins,
      innerWidth: width - margins[1] - margins[3]
    }
  }

  // 获取页面容器中的偏移
  public getPageOffset(pageNo: number, isOriginal = false) {
    const getWidth = (direction: PaperDirection) =>
      isOriginal ? this.getOriginalWidth(direction) : this.getWidth(direction)
    const getHeight = (direction: PaperDirection) =>
      isOriginal ? this.getOriginalHeight(direction) : this.getHeight(direction)
    const pageGap = isOriginal ? this.options.pageGap : this.getPageGap()
    let y = 0
    for (let i = 0; i < pageNo; i++) {
      y += getHeight(this.getPageDirection(i)) + pageGap
    }
    // CSS 会居中较窄页面，浮层坐标需补偿水平偏移
    const direction = this.getPageDirection(pageNo)
    const width = getWidth(direction)
    return {
      x: (this._getPageMaxWidth(isOriginal) - width) / 2,
      y
    }
  }

  private _getPageMaxWidth(isOriginal = false) {
    const width = isOriginal ? this.getOriginalWidth() : this.getWidth()
    const isMixed = this.pageDirectionList.some(
      direction => direction !== this.options.paperDirection
    )
    if (!isMixed) return width
    const height = isOriginal ? this.getOriginalHeight() : this.getHeight()
    return Math.max(width, height)
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

  public getPage(pageNo = -1): RenderPage {
    return this.backend.getPage(~pageNo ? pageNo : this.pageNo)
  }

  public getPageList(): RenderPage[] {
    return this.backend.getPageList()
  }

  public getPageCount(): number {
    return this.backend.getPageList().length
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

  public getOptions(): DeepRequired<IEditorOption> {
    return this.options
  }

  public getSearch(): Search {
    return this.search
  }

  public getSpellcheck(): Spellcheck {
    return this.spellcheck
  }

  public getGroup(): Group {
    return this.group
  }

  public getArea(): Area {
    return this.area
  }

  public getAreaTool(): AreaTool {
    return this.areaTool
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

  public getTextMeasurer(): TextMeasurer {
    return this.textMeasurer
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

  public isMainElementList(elementList: IElement[]): boolean {
    return elementList === this.elementList
  }

  public getRawRowList(): IRow[] {
    return this.rawRowList
  }

  public getMainRowList(): IRow[] {
    return this.rowList
  }

  public getIncrementalRowComputer(): IncrementalRowComputer {
    return this.incrementalRowComputer
  }

  public getIsElementListTruncated(): boolean {
    return this.isElementListTruncated
  }

  public getIsControlMinWidthPlaceholder(): boolean {
    return this.layoutEngine.getIsControlMinWidthPlaceholder(this.elementList)
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
        this.incrementalRowComputer.markRangeDirty(
          elementList,
          startIndex,
          1,
          0
        )
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
      this.incrementalRowComputer.markRangeDirty(
        this.elementList,
        1,
        0,
        elementList.length
      )
      curIndex = elementList.length
    } else {
      const appendStart = this.elementList.length
      this.elementList.push(...elementList)
      this.incrementalRowComputer.markRangeDirty(
        this.elementList,
        appendStart,
        0,
        elementList.length
      )
      curIndex = this.elementList.length - 1
    }
    this.range.setRange(curIndex, curIndex)
    this.render({
      curIndex,
      isSubmitHistory
    })
  }

  // 原地修改元素字段的唯一入口（支持多元素、多字段）：
  // 任一值发生变化时自动标记下次渲染全量计算，调用方无需关心脏区间
  public setElementProperty(
    elementList: IElement | IElement[],
    properties: Partial<IElement>
  ) {
    const list = Array.isArray(elementList) ? elementList : [elementList]
    const keys = Object.keys(properties) as (keyof IElement)[]
    for (const element of list) {
      for (const key of keys) {
        const value = properties[key]
        if (element[key] !== value) {
          element[key] = value as never
          this.incrementalRowComputer.markFullDirty()
        }
      }
    }
  }

  // 原地删除元素字段（同 setElementProperty，支持多元素、多字段）
  public deleteElementProperty(
    elementList: IElement | IElement[],
    keys: (keyof IElement)[]
  ) {
    const list = Array.isArray(elementList) ? elementList : [elementList]
    for (const element of list) {
      for (const key of keys) {
        if (key in element) {
          delete element[key]
          this.incrementalRowComputer.markFullDirty()
        }
      }
    }
  }

  public spliceElementList(
    elementList: IElement[],
    start: number,
    deleteCount: number,
    items?: IElement[],
    options?: ISpliceElementListOption
  ) {
    this.incrementalRowComputer.markRangeDirty(
      elementList,
      start,
      deleteCount,
      items?.length ?? 0
    )
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
          // 此处的清理区间已由下方 markRangeDirty 精确覆盖，
          // 不走访问器（避免退化为整页全量计算）
          delete curElement.listId
          delete curElement.listType
          delete curElement.listStyle
          startIndex++
        }
        // 列表信息清理改写了主删除区间之外的元素，扩展脏区间覆盖，
        // 防止增量续算复用到丢失列表缩进/序号的陈旧行
        if (startIndex > endIndex) {
          this.incrementalRowComputer.markRangeDirty(
            elementList,
            endIndex,
            startIndex - endIndex,
            0
          )
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

  public getTablePaging(): TablePaging {
    return this.tablePaging
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

  public getHintParticle(): HintParticle {
    return this.hintParticle
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
    if (!this.backend.canvas) {
      const { mode = this.mode, snapDomFunction } = payload
      const pageList = await this.getSvgPageList(mode)
      if (snapDomFunction) {
        await this.blockParticle.drawIframeToSvgPage(pageList, snapDomFunction)
      }
      return pageList.map(page => {
        const source = new XMLSerializer().serializeToString(page)
        return `data:image/svg+xml;base64,${convertStringToBase64(source)}`
      })
    }
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
    const pageList = this.backend.canvas!.getPageList()
    // 叠加iframe图片
    if (snapDomFunction) {
      await this.blockParticle.drawIframeToPage(pageList, snapDomFunction)
    }
    const dataUrlList = pageList.map(c => c.toDataURL())
    // 还原
    if (pixelRatio) {
      this.setPagePixelRatio(null)
    }
    if (isSwitchMode) {
      this.setMode(currentMode)
    }
    return dataUrlList
  }

  public async getSvgPageList(mode: EditorMode): Promise<SVGSVGElement[]> {
    if (this.backend.canvas) {
      throw new Error('SVG page list requires the SVG backend')
    }
    const currentMode = this.mode
    const isSwitchMode = currentMode !== mode
    try {
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
      this.backend.flush?.()
      return this.backend
        .getPageList()
        .map(page => page.cloneNode(true) as SVGSVGElement)
    } finally {
      if (isSwitchMode) {
        this.setMode(currentMode)
      }
    }
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
      this.getPageList().forEach(c => (c.style.cursor = 'copy'))
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

  public setBackend(payload: BackendType): void {
    if (this.options.backend === payload) return
    this.backend.destroy()
    this.backend.getPageList().forEach(page => page.remove())
    this.options.backend = payload
    this.backend = createBackend(payload, this.pageContainer)
    for (let i = 0; i < this.pageRowList.length; i++) {
      this._createPage(i)
    }
    this._updatePageSizes()
    this.render({
      isLazy: false,
      isCompute: false,
      isSetCursor: false,
      isSubmitHistory: false
    })
  }

  public setPageMode(payload: PageMode) {
    if (!payload || this.options.pageMode === payload) return
    this.options.pageMode = payload
    // 纸张大小重置
    if (payload === PageMode.PAGING) {
      const height = this.getHeight()
      const dpr = this.getPagePixelRatio()
      this.backend.resize(0, this.getWidth(), height, dpr)
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
    this.options.scale = payload
    this._updatePageSizes()
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
    this._updatePageSizes()
    this.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
  }

  public setPaperSize(width: number, height: number) {
    this.options.width = width
    this.options.height = height
    this._updatePageSizes()
    this.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
  }

  public setPaperDirection(payload: PaperDirection) {
    this.options.paperDirection = payload
    this.render({
      isSubmitHistory: false,
      isSetCursor: false
    })
  }

  // 设置光标所在节的纸张方向，首节修改全局方向
  public setPageDirection(payload: PaperDirection | null) {
    if (
      this.isReadonly() ||
      this.isDisabled() ||
      this.zone.getZone() !== EditorZone.MAIN
    ) {
      return
    }
    const { endIndex } = this.range.getRange()
    let pageBreakElement: IElement | null = null
    for (let i = endIndex; i >= 0; i--) {
      if (this.elementList[i].type === ElementType.PAGE_BREAK) {
        pageBreakElement = this.elementList[i]
        break
      }
    }
    if (!pageBreakElement) {
      if (payload) {
        this.setPaperDirection(payload)
      }
      return
    }
    if (payload) {
      pageBreakElement.paperDirection = payload
    } else {
      delete pageBreakElement.paperDirection
    }
    this.render({ curIndex: endIndex })
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
  }

  private _createPageContainer(): HTMLDivElement {
    const pageContainer = document.createElement('div')
    pageContainer.classList.add(`${EDITOR_PREFIX}-page-container`)
    this.container.append(pageContainer)
    return pageContainer
  }

  private _createPage(pageNo: number) {
    const { width, height } = this.getPageSize(pageNo)
    this.backend.create(
      pageNo,
      width,
      height,
      this.getPageGap(),
      this.getPagePixelRatio()
    )
  }

  // 按各页实际尺寸（方向/缩放/DPR）校正页面 canvas 与容器宽度
  private _updatePageSizes() {
    const dpr = this.getPagePixelRatio()
    const isPagingMode = this.getIsPagingMode()
    this.container.style.width = `${this._getPageMaxWidth()}px`
    this.backend.getPageList().forEach((_page, i) => {
      const { width, height } = this.getPageSize(i)
      this.backend.resize(i, width, height, dpr, {
        gap: this.getPageGap(),
        updateCssHeight: isPagingMode
      })
    })
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

  public computeRowList(payload: IComputeRowListPayload) {
    return this.layoutEngine.computeRowList(payload)
  }

  private _computePageList(): IRow[][] {
    const {
      pageMode,
      paperDirection,
      pageNumber: { maxPageNo }
    } = this.options
    const result = this.layoutEngine.computePageList({
      rowList: this.rowList,
      elementList: this.elementList,
      pageMode,
      paperDirection,
      maxPageNo
    })
    this.elementList = result.elementList
    this.pageDirectionList = result.pageDirectionList
    this.isElementListTruncated = result.isElementListTruncated
    if (pageMode === PageMode.CONTINUITY) {
      const height = this.getHeight()
      const marginHeight = this.getMainOuterHeight(0)
      let pageHeight = marginHeight
      // 重置高度
      pageHeight += this.rowList.reduce(
        (pre, cur) => pre + cur.height + (cur.offsetY || 0),
        0
      )
      const pageDom = this.backend.getPage(0)
      const pageDomHeight = Number(pageDom.style.height.replace('px', ''))
      const nextHeight =
        pageHeight > pageDomHeight
          ? pageHeight
          : pageHeight < height
            ? height
            : pageHeight
      this.backend.resizeHeight(0, nextHeight, this.getPagePixelRatio())
    }
    return result.pageRowList
  }

  private _drawHighlight(ctx: IRenderContext, payload: IDrawRowPayload) {
    const { rowList, positionList, elementList } = payload
    const marginHeight = this.getDefaultBasicRowMarginHeight()
    const highlightMarginHeight = this.getHighlightMarginHeight()
    for (let i = 0; i < rowList.length; i++) {
      const curRow = rowList[i]
      // 内容高度：不含段后间距与区域补高
      const rowContentHeight =
        curRow.height -
        (curRow.spacingAfter || 0) -
        (curRow.areaPadding?.height || 0)
      let preHighlight = ''
      for (let j = 0; j < curRow.elementList.length; j++) {
        const element = curRow.elementList[j]
        // 高亮配置：元素 > 控件配置
        const highlight =
          element.highlight ||
          this.control.getControlHighlight(elementList, curRow.startIndex + j)
        if (highlight) {
          // 高亮元素相连需立即绘制，并记录下一元素坐标
          if (preHighlight && preHighlight !== highlight) {
            this.highlight.render(ctx)
          }
          // 当前元素位置信息记录（表格跨页片段行优先使用片段位置）
          const {
            coordinate: {
              leftTop: [x, y]
            }
          } = curRow.fragmentPosition || positionList[curRow.startIndex + j]
          // 元素向左偏移量
          const offsetX = element.left || 0
          this.highlight.recordFillInfo(
            ctx,
            x - offsetX,
            y + marginHeight - highlightMarginHeight, // 先减去行margin，再加上高亮margin
            element.metrics.width + offsetX,
            rowContentHeight - 2 * marginHeight + 2 * highlightMarginHeight,
            highlight
          )
        } else if (preHighlight) {
          // 之前是高亮元素，当前不是需立即绘制
          this.highlight.render(ctx)
        }
        preHighlight = highlight
      }
      this.highlight.render(ctx)
    }
  }

  public drawRow(ctx: IRenderContext, payload: IDrawRowPayload) {
    // 优先绘制高亮元素
    this._drawHighlight(ctx, payload)
    // 绘制元素及文本装饰
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
      keyContext = {},
      isDrawLineBreak = !lineBreak.disabled,
      isDrawWhiteSpace = !whiteSpace.disabled,
      isDrawRange = true
    } = payload
    const isPrintMode = this.isPrintMode()
    const isGraffitiMode = this.isGraffitiMode()
    const { isCrossRowCol, tableId } = this.range.getRange()
    const rowZone = zone ?? EditorZone.MAIN
    const zoneKey = buildZoneKey(rowZone, pageNo)
    const containerKey = keyContext.containerKey ?? zoneKey
    const tablePath = keyContext.tablePath ?? []
    let index = startIndex
    for (let i = 0; i < rowList.length; i++) {
      const curRow = rowList[i]
      const fragment = curRow.tableFragment
      const fragmentKey = fragment
        ? buildTableFragmentKey({
            containerKey,
            tableId:
              elementList[curRow.startIndex]?.id ??
              `table:${curRow.startIndex}`,
            tablePath,
            ...fragment
          })
        : undefined
      if (fragmentKey) {
        ctx.beginGroup?.(fragmentKey, 'table-fragment')
      }
      const rowKey = buildRowKey({
        zoneKey,
        containerKey: fragmentKey ?? containerKey,
        occurrence: i
      })
      ctx.beginGroup?.(rowKey, 'row')
      // 内容高度：不含段后间距与区域补高
      const rowContentHeight =
        curRow.height -
        (curRow.spacingAfter || 0) -
        (curRow.areaPadding?.height || 0)
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
        // 表格跨页片段行：索引以行起始数据索引为基准，
        // 避免同页多片段时选区记录索引漂移
        if (curRow.tableFragment) {
          index = curRow.startIndex + j
        }
        const metrics = element.metrics
        // 当前元素位置信息（表格跨页片段行优先使用片段位置）
        const {
          ascent: offsetY,
          coordinate: {
            leftTop: [x, y]
          }
        } = curRow.fragmentPosition || positionList[curRow.startIndex + j]
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
          this.hyperlinkParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.LABEL) {
          this.textParticle.complete()
          this.labelParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.DATE) {
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
        } else if (element.type === ElementType.SUPERSCRIPT) {
          this.textParticle.complete()
          this.superscriptParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.SUBSCRIPT) {
          this.underline.render(ctx)
          this.textParticle.complete()
          this.subscriptParticle.render(ctx, element, x, y + offsetY)
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
          // 如果是两端对齐，因canvas目前不支持letterSpacing需单独绘制文本
          this.textParticle.record(ctx, element, x, y + offsetY)
          this.textParticle.complete()
        } else if (element.type === ElementType.BLOCK) {
          this.textParticle.complete()
          this.blockParticle.render(ctx, pageNo, element, x, y + offsetY)
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
          this.lineBreakParticle.render(
            ctx,
            element,
            x,
            y + rowContentHeight / 2
          )
        }
        // 空白符绘制
        if (isDrawWhiteSpace && WHITE_SPACE_REG.test(element.value)) {
          this.whiteSpaceParticle.render(
            ctx,
            element,
            x,
            y + rowContentHeight / 2
          )
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
            rowContentHeight - 2 * rowMargin
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
          // 元素向左偏移量
          const offsetX = element.left || 0
          // 下标元素y轴偏移值
          let offsetY = 0
          if (element.type === ElementType.SUBSCRIPT) {
            offsetY = this.subscriptParticle.getOffsetY(element)
          }
          // 占位符不参与颜色计算
          const color = element.control?.underline
            ? this.options.underlineColor
            : element.color
          this.underline.recordFillInfo(
            ctx,
            x - offsetX,
            y + rowContentHeight - rowMargin + offsetY,
            metrics.width + offsetX,
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
            const standardMetrics = this.textMeasurer.measureBasis(
              this.getElementFont(element)
            )
            // 文字渲染位置 + 基线文字下偏移量 - 一半文字高度
            let adjustY =
              y +
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
            // 从行尾开始-绘制最小宽度
            if (startIndex === index) {
              const nextElement = elementList[startIndex + 1]
              if (nextElement && nextElement.value === ZERO) {
                rangeRecord.x = x + metrics.width
                rangeRecord.y = y
                rangeRecord.height = rowContentHeight
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
                rangeRecord.height = rowContentHeight
              }
              rangeRecord.width += rangeWidth
            }
          }
        }
        // 组信息记录
        if (!group.disabled && element.groupIds) {
          this.group.recordFillInfo(
            element,
            x,
            y,
            metrics.width,
            rowContentHeight
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
          const tableIdentity = element.id ?? `table:${curRow.startIndex}`
          // 续页回显表头内容（使用一次性位置列表，不绘制选区）
          if (curRow.repeatTdPositionList?.length) {
            for (const [
              repeatTdIndex,
              { td, positionList: repeatPositionList }
            ] of curRow.repeatTdPositionList.entries()) {
              const trIndex = td.trIndex ?? 0
              const tdIndex = td.tdIndex ?? repeatTdIndex
              const tdIdentity = td.id ?? `td:${trIndex}:${tdIndex}`
              const repeatKey = buildRepeatHeaderKey({
                fragmentKey: fragmentKey ?? rowKey,
                trIndex,
                tdIndex,
                tdId: td.id
              })
              ctx.beginGroup?.(repeatKey, 'repeat-header')
              this.drawRow(ctx, {
                elementList: td.value,
                positionList: repeatPositionList,
                rowList: td.rowList!,
                pageNo,
                startIndex: 0,
                innerWidth: (td.width! - tdPaddingWidth) * scale,
                zone,
                keyContext: {
                  containerKey: repeatKey,
                  tablePath: [
                    ...tablePath,
                    `${tableIdentity}/tr:${trIndex}/${tdIdentity}`
                  ]
                },
                isDrawLineBreak,
                isDrawRange: false
              })
              ctx.endGroup?.()
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
            const trIndex = td.trIndex ?? 0
            const tdIndex = td.tdIndex ?? 0
            const tdIdentity = td.id ?? `td:${trIndex}:${tdIndex}`
            const tdPath = `${tableIdentity}/tr:${trIndex}/${tdIdentity}`
            this.drawRow(ctx, {
              elementList: td.value,
              positionList: td.positionList!,
              rowList,
              pageNo,
              startIndex,
              innerWidth: (td.width! - tdPaddingWidth) * scale,
              zone,
              keyContext: {
                containerKey: `${fragmentKey ?? rowKey}/${tdPath}`,
                tablePath: [...tablePath, tdPath]
              },
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
          positionList[curRow.startIndex]
        )
      }
      // 绘制文字、边框、下划线、删除线
      this.textParticle.complete()
      this.control.drawBorder(ctx)
      this.underline.render(ctx)
      this.strikeout.render(ctx)
      // 冲刷留痕累积
      this.traceParticle.flush(ctx)
      // 绘制批注样式
      this.group.render(ctx)
      // 绘制选区
      const hasRange =
        !isPrintMode &&
        !isGraffitiMode &&
        (Boolean(rangeRecord.width && rangeRecord.height) ||
          (isDrawRange &&
            isCrossRowCol &&
            tableRangeElement &&
            tableRangeElement.id === tableId))
      ctx.beginGroup?.(buildLayerKey(pageNo, 'selection'), 'layer')
      if (hasRange) {
        ctx.beginGroup?.(`${rowKey}:selection`, 'group')
        if (rangeRecord.width && rangeRecord.height) {
          const { x, y, width, height } = rangeRecord
          this.range.render(ctx, x, y, width, height)
        }
        if (
          isDrawRange &&
          isCrossRowCol &&
          tableRangeElement &&
          tableRangeElement.id === tableId
        ) {
          const {
            coordinate: {
              leftTop: [x, y]
            }
          } = curRow.fragmentPosition || positionList[curRow.startIndex]
          this.tableParticle.drawRange(
            ctx,
            tableRangeElement,
            x,
            y,
            curRow.tableFragment
          )
        }
        ctx.endGroup?.()
      }
      ctx.endGroup?.()
      ctx.endGroup?.()
      if (fragmentKey) ctx.endGroup?.()
    }
  }

  private _drawFloat(ctx: IRenderContext, payload: IDrawFloatPayload) {
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
    const canvas = this.backend.canvas
    if (canvas) {
      const ctx = canvas.getContext(pageNo)
      const pageDom = canvas.getPage(pageNo)
      ctx.clearRect(
        0,
        0,
        Math.max(pageDom.width, this.getWidth()),
        Math.max(pageDom.height, this.getHeight())
      )
    }
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
    const { innerWidth } = this.getPageSize(pageNo)
    const ctx = new DisplayList()
    this._clearPage(pageNo)
    ctx.beginGroup(buildPageKey(pageNo), 'page')
    ctx.beginGroup(buildLayerKey(pageNo, 'background'), 'layer')
    // 判断当前激活区域-非正文区域时元素透明度降低
    ctx.globalAlpha = !this.zone.isMainActive() ? inactiveAlpha : 1
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
    ctx.endGroup()
    ctx.beginGroup(buildLayerKey(pageNo, 'control-highlight'), 'layer')
    // 控件高亮
    if (!isPrintMode) {
      this.control.renderHighlightList(ctx, pageNo)
    }
    ctx.endGroup()
    ctx.beginGroup(buildLayerKey(pageNo, 'content'), 'layer')
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
    ctx.endGroup()
    ctx.beginGroup(buildLayerKey(pageNo, 'foreground'), 'layer')
    // 渲染浮于文字上方元素
    this._drawFloat(ctx, {
      pageNo,
      imgDisplays: [ImageDisplay.FLOAT_TOP, ImageDisplay.SURROUND]
    })
    ctx.endGroup()
    ctx.beginGroup(buildLayerKey(pageNo, 'search'), 'layer')
    // 搜索匹配绘制
    if (!isPrintMode && this.search.getSearchKeyword()) {
      this.search.render(ctx, pageNo)
    }
    ctx.endGroup()
    ctx.beginGroup(buildLayerKey(pageNo, 'decoration'), 'layer')
    // 拼写检查错词绘制
    if (!isPrintMode && this.spellcheck.getSpellcheckRangeList().length) {
      this.spellcheck.render(ctx, pageNo)
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
      this.pageBorder.render(ctx, pageNo)
    }
    // 绘制签章
    this.badge.render(ctx, pageNo)
    ctx.endGroup()
    ctx.beginGroup(buildLayerKey(pageNo, 'graffiti'), 'layer')
    // 绘制涂鸦
    if (this.isGraffitiMode()) {
      this.graffiti.render(ctx, pageNo)
    }
    ctx.endGroup()
    ctx.beginGroup(buildLayerKey(pageNo, 'watermark'), 'layer')
    // 绘制水印（顶层）
    if (
      !isContinuityMode &&
      this.options.watermark.data &&
      this.options.watermark.layer === WatermarkLayer.TOP
    ) {
      this.waterMark.render(ctx, pageNo)
    }
    ctx.endGroup()
    ctx.endGroup()
    this.backend.renderPage(pageNo, ctx)
  }

  private _disconnectLazyRender() {
    this.backend.disconnectVisibility()
  }

  private _lazyRender() {
    const positionList = this.position.getOriginalMainPositionList()
    const elementList = this.getOriginalMainElementList()
    this.backend.observeVisibility(pageNo => {
      this._drawPage({
        elementList,
        positionList,
        rowList: this.pageRowList[pageNo],
        pageNo
      })
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
    const oldPageDirectionList = this.pageDirectionList
    // 计算文档信息
    if (isCompute) {
      // 清空拼写检查错词信息
      this.spellcheck.setSpellcheckRangeList(null)
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
      const rowComputePayload: IComputeRowListPayload = {
        startX,
        startY,
        pageHeight,
        isPagingMode,
        innerWidth,
        surroundElementList,
        elementList: this.elementList
      }
      // 行级增量行计算：消费本次编辑的脏区间，从受影响行续算至收敛；
      // 无脏区间或门控不满足时退回全量，行为与未开启时一致
      const incrementalResult = this.incrementalRowComputer.tryCompute(
        this.incrementalRowComputer.consumeDirtyRange(),
        rowComputePayload
      )
      this.rawRowList =
        incrementalResult?.rowList ?? this.computeRowList(rowComputePayload)
      this.incrementalRowComputer.observeLayout()
      // 分页模式下跨页表格在渲染层拆分为按页片段行
      if (isPagingMode) {
        this.rowList = this.tablePaging.splitTableRowAcrossPages(
          this.rawRowList
        )
      } else {
        this.rowList = this.rawRowList
      }
      // 页面信息（maxPageNo 截断会重置该标志）
      this.isElementListTruncated = false
      this.pageRowList = this._computePageList()
      // 位置信息（增量行计算成功时，首个变动行之前的页位置可复用缓存）
      const fromPageNo = incrementalResult
        ? this.incrementalRowComputer.findPageNoOfRow(
            incrementalResult.firstChangedRow
          )
        : undefined
      this.position.computePositionList({ fromPageNo })
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
      if (!this.backend.getPage(i)) {
        this._createPage(i)
      }
    }
    // 移除多余页
    const curPageCount = this.pageRowList.length
    const prePageCount = this.backend.getPageList().length
    if (prePageCount > curPageCount) {
      const deleteCount = prePageCount - curPageCount
      this.backend
        .getPageList()
        .splice(curPageCount, deleteCount)
        .forEach(page => page.remove())
    }
    const isPageDirectionChanged =
      oldPageDirectionList.length !== this.pageDirectionList.length ||
      oldPageDirectionList.some(
        (direction, index) => direction !== this.pageDirectionList[index]
      )
    if (isPageDirectionChanged) {
      this._updatePageSizes()
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
    if (isCompute && this.eventBus.isSubscribe('renderChange')) {
      this.eventBus.emit('renderChange')
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
      // 区域工具重新渲染
      if (isCompute && !this.isReadonly()) {
        this.areaTool.render()
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
    // 光标位置确定后重新锚定区域工具
    this.areaTool.render()
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
    if (this.options.historyMaxRecordCount === 0) return
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
    this.backend.destroy()
  }

  public clearSideEffect() {
    // 预览工具组件
    this.getPreviewer().clearResizer()
    // 表格工具组件
    this.getTableTool().dispose()
    // 区域工具组件
    this.getAreaTool().dispose()
    // 超链接弹窗
    this.getHyperlinkParticle().clearHyperlinkPopup()
    // 悬浮提示弹窗
    this.getHintParticle().clearHintPopup()
    // 留痕悬浮弹窗
    this.getTraceParticle().clearTracePopup()
    // 日期控件
    this.getDateParticle().clearDatePicker()
  }
}
