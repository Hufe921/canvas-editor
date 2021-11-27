import { ZERO } from "../../dataset/constant/Common"
import { RowFlex } from "../../dataset/enum/Row"
import { IDrawOption } from "../../interface/Draw"
import { IEditorOption } from "../../interface/Editor"
import { IElement, IElementMetrics, IElementPosition, IElementStyle } from "../../interface/Element"
import { IRow, IRowElement } from "../../interface/Row"
import { deepClone } from "../../utils"
import { Cursor } from "../cursor/Cursor"
import { CanvasEvent } from "../event/CanvasEvent"
import { GlobalEvent } from "../event/GlobalEvent"
import { HistoryManager } from "../history/HistoryManager"
import { Listener } from "../listener/Listener"
import { Position } from "../position/Position"
import { RangeManager } from "../range/RangeManager"
import { Background } from "./frame/Background"
import { Highlight } from "./richtext/Highlight"
import { Margin } from "./frame/Margin"
import { Search } from "./interactive/Search"
import { Strikeout } from "./richtext/Strikeout"
import { Underline } from "./richtext/Underline"
import { ElementType } from "../../dataset/enum/Element"
import { ImageParticle } from "./particle/ImageParticle"
import { TextParticle } from "./particle/TextParticle"
import { PageNumber } from "./frame/PageNumber"

export class Draw {

  private container: HTMLDivElement
  private pageContainer: HTMLDivElement
  private pageList: HTMLCanvasElement[]
  private ctxList: CanvasRenderingContext2D[]
  private pageNo: number
  private options: Required<IEditorOption>
  private position: Position
  private elementList: IElement[]
  private listener: Listener

  private cursor: Cursor
  private range: RangeManager
  private margin: Margin
  private background: Background
  private search: Search
  private underline: Underline
  private strikeout: Strikeout
  private highlight: Highlight
  private historyManager: HistoryManager
  private imageParticle: ImageParticle
  private textParticle: TextParticle
  private pageNumber: PageNumber

  private innerWidth: number
  private rowList: IRow[]
  private painterStyle: IElementStyle | null
  private searchMatchList: number[][] | null

  constructor(
    container: HTMLDivElement,
    options: Required<IEditorOption>,
    elementList: IElement[],
    listener: Listener
  ) {
    this.container = container
    this.pageList = []
    this.ctxList = []
    this.pageNo = 0
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
    this.imageParticle = new ImageParticle(this)
    this.textParticle = new TextParticle(this)
    this.pageNumber = new PageNumber(this)

    const canvasEvent = new CanvasEvent(this)
    this.cursor = new Cursor(this, canvasEvent)
    canvasEvent.register()
    const globalEvent = new GlobalEvent(this, canvasEvent)
    globalEvent.register()

    const { width, margins } = options
    this.innerWidth = width - margins[1] - margins[3]
    this.rowList = []
    this.painterStyle = null
    this.searchMatchList = null

    this.render({ isSetCursor: false })
  }

  public getContainer(): HTMLDivElement {
    return this.container
  }

  public getPageContainer(): HTMLDivElement {
    return this.pageContainer
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

  public getOptions(): Required<IEditorOption> {
    return this.options
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
    return this.elementList
  }

  public getListener(): Listener {
    return this.listener
  }

  public getCursor(): Cursor {
    return this.cursor
  }

  public getImageParticle(): ImageParticle {
    return this.imageParticle
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

  public setPainterStyle(payload: IElementStyle | null) {
    this.painterStyle = payload
    if (this.getPainterStyle()) {
      this.pageList.forEach(c => c.style.cursor = 'copy')
    }
  }

  public getSearchMatch(): number[][] | null {
    return this.searchMatchList
  }

  public setSearchMatch(payload: number[][] | null) {
    this.searchMatchList = payload
  }

  public setDefaultRange() {
    if (!this.elementList.length) return
    setTimeout(() => {
      const curIndex = this.elementList.length - 1
      this.range.setRange(curIndex, curIndex)
      this.range.setRangeStyle()
    })
  }

  private _createPageContainer(): HTMLDivElement {
    // 容器宽度需跟随纸张宽度
    this.container.style.width = `${this.options.width}px`
    const pageContainer = document.createElement('div')
    pageContainer.classList.add('page-container')
    this.container.append(pageContainer)
    return pageContainer
  }

  private _createPage(pageNo: number) {
    const canvas = document.createElement('canvas')
    canvas.style.width = `${this.options.width}px`
    canvas.style.height = `${this.options.height}px`
    canvas.style.marginBottom = `${this.options.pageGap}px`
    canvas.setAttribute('data-index', String(pageNo))
    this.pageContainer.append(canvas)
    // 调整分辨率
    const dpr = window.devicePixelRatio
    canvas.width = parseInt(canvas.style.width) * dpr
    canvas.height = parseInt(canvas.style.height) * dpr
    canvas.style.cursor = 'text'
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    // 缓存上下文
    this.pageList.push(canvas)
    this.ctxList.push(ctx)
  }

  private _getFont(el: IElement): string {
    const { defaultSize, defaultFont } = this.options
    return `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${el.size || defaultSize}px ${el.font || defaultFont}`
  }

  private _computeRowList() {
    const { defaultSize, defaultRowMargin, defaultBasicRowMarginHeight } = this.options
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    const innerWidth = this.innerWidth
    const rowList: IRow[] = []
    if (this.elementList.length) {
      rowList.push({
        width: 0,
        height: 0,
        ascent: 0,
        elementList: [],
        rowFlex: this.elementList?.[1]?.rowFlex
      })
    }
    for (let i = 0; i < this.elementList.length; i++) {
      const curRow: IRow = rowList[rowList.length - 1]
      const element = this.elementList[i]
      const rowMargin = defaultBasicRowMarginHeight * (element.rowMargin || defaultRowMargin)
      let metrics: IElementMetrics = {
        width: 0,
        height: 0,
        boundingBoxAscent: 0,
        boundingBoxDescent: 0
      }
      if (element.type === ElementType.IMAGE) {
        metrics.height = element.height!
        // 图片超出尺寸后自适应
        if (curRow.width + element.width! > innerWidth) {
          // 计算剩余大小
          const surplusWidth = innerWidth - curRow.width
          element.width = surplusWidth
          element.height = element.height! * surplusWidth / element.width
        }
        metrics.width = element.width!
        metrics.boundingBoxAscent = 0
        metrics.boundingBoxDescent = element.height!
      } else {
        metrics.height = element.size || this.options.defaultSize
        ctx.font = this._getFont(element)
        const fontMetrics = this.textParticle.measureText(ctx, element)
        metrics.width = fontMetrics.width
        metrics.boundingBoxAscent = element.value === ZERO ? defaultSize : fontMetrics.actualBoundingBoxAscent
        metrics.boundingBoxDescent = fontMetrics.actualBoundingBoxDescent
      }
      const ascent = metrics.boundingBoxAscent + rowMargin
      const descent = metrics.boundingBoxDescent + rowMargin
      const height = ascent + descent
      const rowElement: IRowElement = {
        ...element,
        metrics,
        style: ctx.font
      }
      // 超过限定宽度
      if (curRow.width + metrics.width > innerWidth || (i !== 0 && element.value === ZERO)) {
        rowList.push({
          width: metrics.width,
          height,
          elementList: [rowElement],
          ascent,
          rowFlex: rowElement.rowFlex
        })
      } else {
        curRow.width += metrics.width
        if (curRow.height < height) {
          curRow.height = height
          if (element.type === ElementType.IMAGE) {
            curRow.ascent = element.height!
          } else {
            curRow.ascent = ascent
          }
        }
        curRow.elementList.push(rowElement)
      }
    }
    this.rowList = rowList
  }

  private _drawElement(positionList: IElementPosition[], rowList: IRow[], pageNo: number) {
    const { margins, width, height } = this.options
    const ctx = this.ctxList[pageNo]
    ctx.clearRect(0, 0, width, height)
    // 绘制背景
    this.background.render(ctx)
    // 绘制页边距
    const leftTopPoint: [number, number] = [margins[3], margins[0]]
    this.margin.render(ctx)
    // 渲染元素
    let x = leftTopPoint[0]
    let y = leftTopPoint[1]
    let index = positionList.length
    for (let i = 0; i < rowList.length; i++) {
      const curRow = rowList[i]
      // 计算行偏移量（行居左、居中、居右）
      if (curRow.rowFlex && curRow.rowFlex !== RowFlex.LEFT) {
        const canvasInnerWidth = width - margins[1] - margins[3]
        if (curRow.rowFlex === RowFlex.CENTER) {
          x += (canvasInnerWidth - curRow.width) / 2
        } else {
          x += canvasInnerWidth - curRow.width
        }
      }
      for (let j = 0; j < curRow.elementList.length; j++) {
        const element = curRow.elementList[j]
        const metrics = element.metrics
        const offsetY = element.type === ElementType.IMAGE
          ? curRow.ascent - element.height!
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
        // 下划线绘制
        if (element.underline) {
          this.underline.render(ctx, x, y + curRow.height, metrics.width)
        }
        // 删除线绘制
        if (element.strikeout) {
          this.strikeout.render(ctx, x, y + curRow.height / 2, metrics.width)
        }
        // 元素高亮
        if (element.highlight) {
          this.highlight.render(ctx, element.highlight, x, y, metrics.width, curRow.height)
        }
        // 元素绘制
        if (element.type === ElementType.IMAGE) {
          this.textParticle.complete()
          this.imageParticle.render(ctx, element, x, y + offsetY)
        } else {
          this.textParticle.record(ctx, element, x, y + offsetY)
        }
        // 选区绘制
        const { startIndex, endIndex } = this.range.getRange()
        if (startIndex !== endIndex && startIndex < index && index <= endIndex) {
          let rangeWidth = metrics.width
          if (rangeWidth === 0 && curRow.elementList.length === 1) {
            rangeWidth = this.options.rangeMinWidth
          }
          this.range.render(ctx, x, y, rangeWidth, curRow.height)
        }
        index++
        x += metrics.width
      }
      this.textParticle.complete()
      x = leftTopPoint[0]
      y += curRow.height
    }
    // 绘制页码
    this.pageNumber.render(ctx, pageNo)
    // 搜索匹配绘制
    if (this.searchMatchList) {
      this.search.render(ctx, pageNo)
    }
  }

  public render(payload?: IDrawOption) {
    let {
      curIndex,
      isSubmitHistory = true,
      isSetCursor = true,
      isComputeRowList = true
    } = payload || {}
    // 计算行信息
    if (isComputeRowList) {
      this._computeRowList()
    }
    // 清除光标等副作用
    this.cursor.recoveryCursor()
    this.position.setPositionList([])
    const positionList = this.position.getPositionList()
    // 按页渲染
    const { margins } = this.options
    const marginHeight = margins[0] + margins[2]
    let pageHeight = marginHeight
    let pageNo = 0
    let pageRowList: IRow[][] = [[]]
    for (let i = 0; i < this.rowList.length; i++) {
      const row = this.rowList[i]
      if (row.height + pageHeight > this.options.height) {
        pageHeight = marginHeight + row.height
        pageRowList.push([row])
        pageNo++
      } else {
        pageHeight += row.height
        pageRowList[pageNo].push(row)
      }
    }
    // 绘制元素
    for (let i = 0; i < pageRowList.length; i++) {
      if (!this.pageList[i]) {
        this._createPage(i)
      }
      const rowList = pageRowList[i]
      this._drawElement(positionList, rowList, i)
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
      if (curIndex === undefined) {
        curIndex = positionList.length - 1
      }
      this.position.setCursorPosition(positionList[curIndex!] || null)
      this.cursor.drawCursor()
    }
    // 历史记录用于undo、redo
    if (isSubmitHistory) {
      const self = this
      const oldElementList = deepClone(this.elementList)
      const { startIndex, endIndex } = this.range.getRange()
      const pageNo = this.pageNo
      this.historyManager.execute(function () {
        self.setPageNo(pageNo)
        self.range.setRange(startIndex, endIndex)
        self.elementList = deepClone(oldElementList)
        self.render({ curIndex, isSubmitHistory: false })
      })
    }
  }

}