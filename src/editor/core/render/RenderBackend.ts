import type { DisplayList } from './model/DisplayList'

export type RenderPage = HTMLElement | SVGSVGElement

export interface IPageResizeOption {
  gap?: number
  updateCssHeight?: boolean
}

export interface ICanvasCapability {
  getPage(pageNo: number): HTMLCanvasElement
  getPageList(): HTMLCanvasElement[]
  getContext(pageNo: number): CanvasRenderingContext2D
}

export interface IRenderBackend {
  readonly canvas: ICanvasCapability | null
  create(
    pageNo: number,
    width: number,
    height: number,
    gap: number,
    dpr: number
  ): void
  resize(
    pageNo: number,
    width: number,
    height: number,
    dpr: number,
    options?: IPageResizeOption
  ): void
  resizeHeight(pageNo: number, height: number, dpr: number): void
  renderPage(pageNo: number, displayList: DisplayList): void
  flush?(): void
  observeVisibility(callback: (pageNo: number) => void): void
  disconnectVisibility(): void
  getPage(pageNo: number): RenderPage
  getPageList(): RenderPage[]
  destroy(): void
}
