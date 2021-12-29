import { ZERO } from "../../dataset/constant/Common"
import { RowFlex } from "../../dataset/enum/Row"
import { IDrawOption, IDrawRowPayload, IDrawRowResult } from "../../interface/Draw"
import { IEditorOption } from "../../interface/Editor"
import { IElement, IElementMetrics, IElementPosition, IElementFillRect, IElementStyle } from "../../interface/Element"
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
import { GlobalObserver } from "../observer/GlobalObserver"
import { TableParticle } from "./particle/table/TableParticle"
import { ISearchResult } from "../../interface/Search"
import { TableTool } from "./particle/table/TableTool"
import { HyperlinkParticle } from "./particle/HyperlinkParticle"

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
  private imageParticle: ImageParticle
  private textParticle: TextParticle
  private tableParticle: TableParticle
  private tableTool: TableTool
  private pageNumber: PageNumber
  private hyperlinkParticle: HyperlinkParticle

  private rowList: IRow[]
  private painterStyle: IElementStyle | null
  private searchMatchList: ISearchResult[] | null
  private visiblePageNoList: number[]
  private intersectionPageNo: number

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
    this.tableParticle = new TableParticle(this)
    this.tableTool = new TableTool(this)
    this.pageNumber = new PageNumber(this)
    this.hyperlinkParticle = new HyperlinkParticle(this)
    new GlobalObserver(this)

    this.canvasEvent = new CanvasEvent(this)
    this.cursor = new Cursor(this, this.canvasEvent)
    this.canvasEvent.register()
    const globalEvent = new GlobalEvent(this, this.canvasEvent)
    globalEvent.register()

    this.rowList = []
    this.painterStyle = null
    this.searchMatchList = null
    this.visiblePageNoList = []
    this.intersectionPageNo = 0

    this.render({ isSetCursor: false })
  }

  public getWidth(): number {
    return Math.floor(this.options.width * this.options.scale)
  }

  public getHeight(): number {
    return Math.floor(this.options.height * this.options.scale)
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
    const positionContext = this.position.getPositionContext()
    if (positionContext.isTable) {
      const { index, trIndex, tdIndex } = positionContext
      return this.elementList[index!].trList![trIndex!].tdList[tdIndex!].value
    }
    return this.elementList
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

  public getImageParticle(): ImageParticle {
    return this.imageParticle
  }

  public getTableTool(): TableTool {
    return this.tableTool
  }

  public getHyperlinkParticle(): HyperlinkParticle {
    return this.hyperlinkParticle
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

  public getSearchMatch(): ISearchResult[] | null {
    return this.searchMatchList
  }

  public setSearchMatch(payload: ISearchResult[] | null) {
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

  private _getFont(el: IElement, scale: number = 1): string {
    const { defaultSize, defaultFont } = this.options
    return `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${(el.size || defaultSize) * scale}px ${el.font || defaultFont}`
  }

  private _computeRowList(innerWidth: number, elementList: IElement[]) {
    const { defaultSize, defaultRowMargin, scale, tdPadding } = this.options
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
      let metrics: IElementMetrics = {
        width: 0,
        height: 0,
        boundingBoxAscent: 0,
        boundingBoxDescent: 0
      }
      if (element.type === ElementType.IMAGE) {
        const elementWidth = element.width! * scale
        const elementHeight = element.height! * scale
        // 图片超出尺寸后自适应
        if (curRow.width + elementWidth > innerWidth) {
          // 计算剩余大小
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
      } else {
        metrics.height = (element.size || this.options.defaultSize) * scale
        ctx.font = this._getFont(element)
        const fontMetrics = this.textParticle.measureText(ctx, element)
        metrics.width = fontMetrics.width * scale
        metrics.boundingBoxAscent = (element.value === ZERO ? defaultSize : fontMetrics.actualBoundingBoxAscent) * scale
        metrics.boundingBoxDescent = fontMetrics.actualBoundingBoxDescent * scale
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
        (preElement && preElement.type === ElementType.TABLE)
        || curRow.width + metrics.width > innerWidth
        || (i !== 0 && element.value === ZERO)
      ) {
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
      // 计算行偏移量（行居左、居中、居右）
      if (curRow.rowFlex && curRow.rowFlex !== RowFlex.LEFT) {
        if (curRow.rowFlex === RowFlex.CENTER) {
          x += (innerWidth - curRow.width) / 2
        } else {
          x += innerWidth - curRow.width
        }
      }
      // 当前td所在位置
      let tablePreX = x
      let tablePreY = y
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
        const offsetY = element.type === ElementType.IMAGE
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
          this.textParticle.complete()
          this.imageParticle.render(ctx, element, x, y + offsetY)
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
        } else {
          this.textParticle.record(ctx, element, x, y + offsetY)
        }
        // 下划线绘制
        if (element.underline) {
          this.underline.render(ctx, element.color!, x, y + curRow.height, metrics.width)
        }
        // 删除线绘制
        if (element.strikeout) {
          this.strikeout.render(ctx, x, y + curRow.height / 2, metrics.width)
        }
        // 元素高亮
        if (element.highlight) {
          this.highlight.render(ctx, element.highlight, x, y, metrics.width, curRow.height)
        }
        // 选区记录
        const { startIndex, endIndex } = this.range.getRange()
        if (startIndex !== endIndex && startIndex < index && index <= endIndex) {
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
      this.textParticle.complete()
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

  private _drawPage(positionList: IElementPosition[], rowList: IRow[], pageNo: number) {
    const width = this.getWidth()
    const height = this.getHeight()
    const margins = this.getMargins()
    const innerWidth = this.getInnerWidth()
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
    const height = this.getHeight()
    const innerWidth = this.getInnerWidth()
    // 计算行信息
    if (isComputeRowList) {
      this.rowList = this._computeRowList(innerWidth, this.elementList)
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
    let pageRowList: IRow[][] = [[]]
    for (let i = 0; i < this.rowList.length; i++) {
      const row = this.rowList[i]
      if (row.height + pageHeight > height) {
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
        self.range.setRange(startIndex, endIndex)
        self.elementList = deepClone(oldElementList)
        self.render({ curIndex, isSubmitHistory: false })
      })
    }

    // 页面改变
    setTimeout(() => {
      if (this.listener.pageSizeChange) {
        this.listener.pageSizeChange(pageRowList.length)
      }
    })
  }

}