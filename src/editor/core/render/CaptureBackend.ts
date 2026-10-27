import type {
  ICanvasCapability,
  IPageResizeOption,
  IRenderBackend,
  RenderPage
} from './RenderBackend'
import type { DisplayList } from './model/DisplayList'

// 透传代理后端：转发全部能力到目标后端，同时录制每页的 DisplayList
export class CaptureBackend implements IRenderBackend {
  private displayListMap: Map<number, DisplayList>

  constructor(private readonly target: IRenderBackend) {
    this.displayListMap = new Map()
  }

  public get canvas(): ICanvasCapability | null {
    return this.target.canvas
  }

  public create(
    pageNo: number,
    width: number,
    height: number,
    gap: number,
    dpr: number
  ): void {
    this.target.create(pageNo, width, height, gap, dpr)
  }

  public resize(
    pageNo: number,
    width: number,
    height: number,
    dpr: number,
    options?: IPageResizeOption
  ): void {
    this.target.resize(pageNo, width, height, dpr, options)
  }

  public resizeHeight(pageNo: number, height: number, dpr: number): void {
    this.target.resizeHeight(pageNo, height, dpr)
  }

  public renderPage(pageNo: number, displayList: DisplayList): void {
    this.displayListMap.set(pageNo, displayList)
    this.target.renderPage(pageNo, displayList)
  }

  public flush(): void {
    this.target.flush?.()
  }

  public observeVisibility(callback: (pageNo: number) => void): void {
    this.target.observeVisibility(callback)
  }

  public disconnectVisibility(): void {
    this.target.disconnectVisibility()
  }

  public getPage(pageNo: number): RenderPage {
    return this.target.getPage(pageNo)
  }

  public getPageList(): RenderPage[] {
    return this.target.getPageList()
  }

  public destroy(): void {
    this.target.destroy()
  }

  public getDisplayListList(): DisplayList[] {
    const displayListList: DisplayList[] = []
    for (let pageNo = 0; ; pageNo++) {
      const displayList = this.displayListMap.get(pageNo)
      if (!displayList) break
      displayListList.push(displayList)
    }
    return displayListList
  }
}
