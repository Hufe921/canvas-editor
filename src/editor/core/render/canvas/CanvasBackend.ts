import type { DisplayList } from '../model/DisplayList'
import type {
  ICanvasCapability,
  IPageResizeOption,
  IRenderBackend
} from '../RenderBackend'
import { CanvasRenderer } from './CanvasRenderer'
import { CanvasSurface } from './CanvasSurface'

export class CanvasBackend implements IRenderBackend, ICanvasCapability {
  public readonly canvas: ICanvasCapability
  private surface: CanvasSurface
  private renderer: CanvasRenderer
  private pageList: HTMLCanvasElement[]

  constructor(pageContainer: HTMLElement) {
    this.canvas = this
    this.surface = new CanvasSurface(pageContainer)
    this.renderer = new CanvasRenderer()
    this.pageList = []
  }

  public create(
    pageNo: number,
    width: number,
    height: number,
    gap: number,
    dpr: number
  ): void {
    const { page } = this.surface.create(pageNo, width, height, gap, dpr)
    this.pageList.push(page)
  }

  public resize(
    pageNo: number,
    width: number,
    height: number,
    dpr: number,
    options: IPageResizeOption = {}
  ): void {
    this.surface.resize(
      this.getPage(pageNo),
      this.getContext(pageNo),
      width,
      height,
      dpr,
      options
    )
  }

  public resizeHeight(pageNo: number, height: number, dpr: number): void {
    this.surface.resizeHeight(
      this.getPage(pageNo),
      this.getContext(pageNo),
      height,
      dpr
    )
  }

  public renderPage(pageNo: number, displayList: DisplayList): void {
    this.renderer.render(this.getContext(pageNo), displayList)
  }

  public observeVisibility(callback: (pageNo: number) => void): void {
    this.surface.observeVisibility(this.pageList, callback)
  }

  public disconnectVisibility(): void {
    this.surface.disconnectVisibility()
  }

  public getPage(pageNo: number): HTMLCanvasElement {
    return this.pageList[pageNo]
  }

  public getPageList(): HTMLCanvasElement[] {
    return this.pageList
  }

  public getContext(pageNo: number): CanvasRenderingContext2D {
    return this.getPage(pageNo).getContext('2d')!
  }

  public destroy(): void {
    this.disconnectVisibility()
  }
}
