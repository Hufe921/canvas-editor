import type { Draw } from '../draw/Draw'
import type { RenderPage } from '../render/RenderBackend'

export interface IPageLayoutSize {
  width: number
  height: number
}

export interface IPageLayoutOffset {
  x: number
  y: number
}

export interface IPageLayoutResult {
  width: number
  height: number
  offsetList: IPageLayoutOffset[]
  isMultiPage: boolean
}

interface IApplyPageLayoutOption {
  container: HTMLElement
  pageContainer: HTMLElement
  pageList: RenderPage[]
  pageGap: number
  isMultiple: boolean
  layout: IPageLayoutResult
}

interface IPageLayoutUpdateOption {
  pageList: RenderPage[]
  pageWidth: number
  pageHeight: number
  pageGap: number
  minPageWidth: number
  isMultiple: boolean
  isPageDirectionChanged: boolean
}

const WIDTH_EPSILON = 1e-8

export function computeSinglePageLayout(
  pageSizeList: IPageLayoutSize[],
  gap: number
): IPageLayoutResult {
  const safeGap = Math.max(0, gap)
  const width = Math.max(0, ...pageSizeList.map(size => size.width))
  let y = 0
  const offsetList = pageSizeList.map(size => {
    const offset = {
      x: (width - size.width) / 2,
      y
    }
    y += size.height + safeGap
    return offset
  })
  return {
    width,
    height: y,
    offsetList,
    isMultiPage: false
  }
}

// 多页视图只改变页面在屏幕上的排列，不改变文档分页结果。
// 每行按可用宽度贪心装页，并以该行最大页高推进下一行。
export function computeMultiplePageLayout(
  pageSizeList: IPageLayoutSize[],
  gap: number,
  availableWidth: number
): IPageLayoutResult {
  if (!pageSizeList.length) {
    return {
      width: 0,
      height: 0,
      offsetList: [],
      isMultiPage: false
    }
  }
  const safeGap = Math.max(0, gap)
  const maxPageWidth = Math.max(...pageSizeList.map(size => size.width))
  const width = Math.max(maxPageWidth, Math.floor(availableWidth))
  const offsetList: IPageLayoutOffset[] = Array.from(
    { length: pageSizeList.length },
    () => ({ x: 0, y: 0 })
  )
  let rowStartIndex = 0
  let rowWidth = 0
  let rowHeight = 0
  let rowY = 0
  let rowPageCount = 0
  let isMultiPage = false

  const commitRow = () => {
    if (!rowPageCount) return
    let x = (width - rowWidth) / 2
    for (let i = rowStartIndex; i < rowStartIndex + rowPageCount; i++) {
      const size = pageSizeList[i]
      offsetList[i] = { x, y: rowY }
      x += size.width + safeGap
    }
    isMultiPage ||= rowPageCount > 1
    rowY += rowHeight + safeGap
  }

  for (let i = 0; i < pageSizeList.length; i++) {
    const size = pageSizeList[i]
    const candidateWidth = rowPageCount
      ? rowWidth + safeGap + size.width
      : size.width
    if (rowPageCount && candidateWidth - width > WIDTH_EPSILON) {
      commitRow()
      rowStartIndex = i
      rowWidth = 0
      rowHeight = 0
      rowPageCount = 0
    }
    rowWidth = rowPageCount ? rowWidth + safeGap + size.width : size.width
    rowHeight = Math.max(rowHeight, size.height)
    rowPageCount++
  }
  commitRow()

  return {
    width,
    height: rowY,
    offsetList,
    isMultiPage
  }
}

function setStyle(element: RenderPage, property: string, value: string) {
  if (element.style.getPropertyValue(property) === value) return
  element.style.setProperty(property, value)
}

function applyPageLayout({
  container,
  pageContainer,
  pageList,
  pageGap,
  isMultiple,
  layout
}: IApplyPageLayoutOption) {
  const { width, height, offsetList } = layout
  setStyle(container, 'width', `${width}px`)
  setStyle(pageContainer, 'height', isMultiple ? `${height}px` : '')
  pageList.forEach((page, pageNo) => {
    if (isMultiple) {
      const { x, y } = offsetList[pageNo]
      setStyle(page, 'position', 'absolute')
      setStyle(page, 'left', `${x}px`)
      setStyle(page, 'top', `${y}px`)
      setStyle(page, 'margin', '0px')
      return
    }
    setStyle(page, 'position', '')
    setStyle(page, 'left', '')
    setStyle(page, 'top', '')
    setStyle(page, 'margin', '')
    setStyle(page, 'margin-left', 'auto')
    setStyle(page, 'margin-right', 'auto')
    setStyle(page, 'margin-bottom', `${pageGap}px`)
  })
}

export class PageLayoutManager {
  private draw: Draw
  private container: HTMLElement
  private pageContainer: HTMLElement
  private state: IPageLayoutResult | null = null
  private observer: ResizeObserver | null = null
  private frameId: number | null = null
  private pageList: RenderPage[] | null = null
  private pageCount = 0
  private pageWidth = 0
  private pageHeight = 0
  private pageGap = 0
  private minPageWidth = 0
  private containerWidth = 0
  private availableWidth = 0

  constructor(draw: Draw) {
    this.draw = draw
    this.container = draw.getContainer()
    this.pageContainer = draw.getPageContainer()
  }

  public getOffset(pageNo: number): IPageLayoutOffset | null {
    if (!this.state) return null
    return this.state.offsetList[pageNo] || { x: 0, y: 0 }
  }

  public isActive(): boolean {
    return !!this.state
  }

  public isMultiPage(): boolean {
    return !!this.state?.isMultiPage
  }

  public update(payload: IPageLayoutUpdateOption) {
    const {
      pageList,
      pageWidth,
      pageHeight,
      pageGap,
      minPageWidth,
      isMultiple,
      isPageDirectionChanged
    } = payload
    // 默认单页不做全页布局计算，也不创建尺寸观察者
    if (!isMultiple && !this.state) return
    this.minPageWidth = minPageWidth
    if (isMultiple && !this.state) {
      this.containerWidth = Math.floor(
        this.container.parentElement!.clientWidth
      )
    }
    const availableWidth = isMultiple
      ? Math.max(minPageWidth, this.containerWidth)
      : 0
    const isUnchanged =
      this.state &&
      isMultiple &&
      this.pageList === pageList &&
      this.pageCount === pageList.length &&
      !isPageDirectionChanged &&
      this.pageWidth === pageWidth &&
      this.pageHeight === pageHeight &&
      this.pageGap === pageGap &&
      this.availableWidth === availableWidth
    if (isUnchanged) return

    const layout = isMultiple
      ? computeMultiplePageLayout(
          pageList.map((_, pageNo) => this.draw.getPageSize(pageNo)),
          pageGap,
          availableWidth
        )
      : {
          width: minPageWidth,
          height: 0,
          offsetList: [],
          isMultiPage: false
        }
    applyPageLayout({
      container: this.container,
      pageContainer: this.pageContainer,
      pageList,
      pageGap,
      isMultiple,
      layout
    })
    this.state = isMultiple ? layout : null
    this.pageList = isMultiple ? pageList : null
    this.pageCount = pageList.length
    this.pageWidth = pageWidth
    this.pageHeight = pageHeight
    this.pageGap = pageGap
    this.availableWidth = availableWidth
    if (isMultiple) {
      this._observe()
    } else {
      this._disconnect()
    }
  }

  public destroy() {
    this._disconnect()
  }

  private _observe() {
    if (this.observer) return
    this.observer = new ResizeObserver(() => {
      if (!this.state) return
      this.containerWidth = Math.floor(
        this.container.parentElement!.clientWidth
      )
      const availableWidth = Math.max(this.minPageWidth, this.containerWidth)
      if (Math.abs(availableWidth - this.state.width) < 1) return
      if (this.frameId !== null) {
        cancelAnimationFrame(this.frameId)
      }
      this.frameId = requestAnimationFrame(() => {
        this.frameId = null
        const cursorPosition = this.draw.getPosition().getCursorPosition()
        this.draw.render({
          isSubmitHistory: false,
          isSetCursor: !!cursorPosition,
          curIndex: cursorPosition?.index
        })
      })
    })
    this.observer.observe(this.container.parentElement!)
  }

  private _disconnect() {
    this.observer?.disconnect()
    this.observer = null
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
  }
}
