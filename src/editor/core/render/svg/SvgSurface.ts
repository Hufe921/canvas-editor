import type { IPageResizeOption } from '../RenderBackend'
import { SVG_NAMESPACE } from './scene/SvgNodeFactory'

export class SvgSurface {
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
    gap: number
  ): { page: SVGSVGElement } {
    const page = document.createElementNS(SVG_NAMESPACE, 'svg') as SVGSVGElement
    page.style.width = `${width}px`
    page.style.height = `${height}px`
    page.style.display = 'block'
    page.style.backgroundColor = '#ffffff'
    page.style.marginLeft = 'auto'
    page.style.marginRight = 'auto'
    page.style.marginBottom = `${gap}px`
    page.style.cursor = 'text'
    page.style.userSelect = 'none'
    page.setAttribute('data-index', String(pageNo))
    page.setAttribute('viewBox', `0 0 ${width} ${height}`)
    this.pageContainer.append(page)
    return { page }
  }

  public resize(
    page: SVGSVGElement,
    width: number,
    height: number,
    options: IPageResizeOption = {}
  ): void {
    const { gap, updateCssHeight = true } = options
    page.style.width = `${width}px`
    if (updateCssHeight) {
      page.style.height = `${height}px`
    }
    if (gap !== undefined) {
      page.style.marginBottom = `${gap}px`
    }
    const cssHeight = updateCssHeight
      ? height
      : Number.parseFloat(page.style.height) || height
    const viewBox = `0 0 ${width} ${cssHeight}`
    if (page.getAttribute('viewBox') !== viewBox) {
      page.setAttribute('viewBox', viewBox)
    }
  }

  public resizeHeight(page: SVGSVGElement, height: number): void {
    page.style.height = `${height}px`
    const width = Number.parseFloat(page.style.width)
    const viewBox = `0 0 ${width} ${height}`
    if (page.getAttribute('viewBox') !== viewBox) {
      page.setAttribute('viewBox', viewBox)
    }
  }

  public observeVisibility(
    pageList: Element[],
    callback: (pageNo: number) => void
  ): void {
    this.disconnectVisibility()
    this.visibilityObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const pageNo = Number(entry.target.getAttribute('data-index'))
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
