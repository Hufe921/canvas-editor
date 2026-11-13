import type { DisplayList } from '../model/DisplayList'
import type { IPageResizeOption, IRenderBackend } from '../RenderBackend'
import { SvgRenderer } from './SvgRenderer'
import { SvgSurface } from './SvgSurface'

export class SvgBackend implements IRenderBackend {
  public readonly canvas = null
  private surface: SvgSurface
  private renderer: SvgRenderer
  private pageList: SVGSVGElement[]
  private renderedPages: WeakSet<SVGSVGElement>
  private pendingPages: Map<SVGSVGElement, DisplayList>
  private frameId: number | null

  constructor(pageContainer: HTMLElement) {
    this.surface = new SvgSurface(pageContainer)
    this.renderer = new SvgRenderer()
    this.pageList = []
    this.renderedPages = new WeakSet()
    this.pendingPages = new Map()
    this.frameId = null
  }

  public create(
    pageNo: number,
    width: number,
    height: number,
    gap: number,
    dpr: number
  ): void {
    void dpr
    const { page } = this.surface.create(pageNo, width, height, gap)
    this.pageList.push(page)
  }

  public resize(
    pageNo: number,
    width: number,
    height: number,
    dpr: number,
    options: IPageResizeOption = {}
  ): void {
    void dpr
    this.surface.resize(this.getPage(pageNo), width, height, options)
  }

  public resizeHeight(pageNo: number, height: number, dpr: number): void {
    void dpr
    this.surface.resizeHeight(this.getPage(pageNo), height)
  }

  public renderPage(pageNo: number, displayList: DisplayList): void {
    const page = this.getPage(pageNo)
    if (!this.renderedPages.has(page)) {
      this.renderer.render(page, displayList)
      this.renderedPages.add(page)
      return
    }
    this.pendingPages.set(page, displayList)
    if (this.frameId !== null) return
    this.frameId = requestAnimationFrame(() => this.flush())
  }

  public flush(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
    const pendingPages = Array.from(this.pendingPages)
    this.pendingPages.clear()
    for (const [pendingPage, pendingDisplayList] of pendingPages) {
      this.renderer.render(pendingPage, pendingDisplayList)
    }
  }

  public observeVisibility(callback: (pageNo: number) => void): void {
    this.surface.observeVisibility(this.pageList, callback)
  }

  public disconnectVisibility(): void {
    this.surface.disconnectVisibility()
  }

  public getPage(pageNo: number): SVGSVGElement {
    return this.pageList[pageNo]
  }

  public getPageList(): SVGSVGElement[] {
    return this.pageList
  }

  public destroy(): void {
    this.disconnectVisibility()
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
    this.pendingPages.clear()
  }
}
