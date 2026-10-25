export class CanvasSurface {
  private pageContainer: HTMLElement
  private visibilityObserver: IntersectionObserver | null

  constructor(pageContainer: HTMLElement) {
    this.pageContainer = pageContainer
    this.visibilityObserver = null
  }

  public create(
    pageNo: number,
    width: number,
    height: number,
    gap: number,
    dpr: number
  ) {
    const page = document.createElement('canvas')
    page.style.width = `${width}px`
    page.style.height = `${height}px`
    page.style.display = 'block'
    page.style.backgroundColor = '#ffffff'
    page.style.marginLeft = 'auto'
    page.style.marginRight = 'auto'
    page.style.marginBottom = `${gap}px`
    page.setAttribute('data-index', String(pageNo))
    this.pageContainer.append(page)
    page.width = width * dpr
    page.height = height * dpr
    page.style.cursor = 'text'
    const ctx = page.getContext('2d')!
    this.initializeContext(ctx, dpr)
    return { page, ctx }
  }

  private initializeContext(ctx: CanvasRenderingContext2D, dpr: number): void {
    ctx.scale(dpr, dpr)
    ctx.letterSpacing = '0px'
    ctx.wordSpacing = '0px'
    ctx.direction = 'ltr'
  }

  public resize(
    page: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    dpr: number,
    options: { gap?: number; updateCssHeight?: boolean } = {}
  ): void {
    const { gap, updateCssHeight = true } = options
    page.style.width = `${width}px`
    if (updateCssHeight) {
      page.style.height = `${height}px`
    }
    if (gap !== undefined) {
      page.style.marginBottom = `${gap}px`
    }
    const canvasHeight = updateCssHeight
      ? height
      : Number.parseFloat(page.style.height) || height
    const pixelWidth = Math.floor(width * dpr)
    const pixelHeight = Math.floor(canvasHeight * dpr)
    if (page.width === pixelWidth && page.height === pixelHeight) return
    page.width = pixelWidth
    page.height = pixelHeight
    this.initializeContext(ctx, dpr)
  }

  public resizeHeight(
    page: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    height: number,
    dpr: number
  ): void {
    page.style.height = `${height}px`
    page.height = height * dpr
    this.initializeContext(ctx, dpr)
  }

  public observeVisibility(
    pageList: Element[],
    callback: (pageNo: number) => void
  ): void {
    this.disconnectVisibility()
    this.visibilityObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const pageNo = Number((entry.target as HTMLElement).dataset.index)
          callback(pageNo)
        }
      })
    })
    pageList.forEach(page => this.visibilityObserver!.observe(page))
  }

  public disconnectVisibility(): void {
    this.visibilityObserver?.disconnect()
    this.visibilityObserver = null
  }
}
