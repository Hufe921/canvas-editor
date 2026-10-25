import type { RenderPage } from '../render/RenderBackend'

export interface IPagePointer {
  x: number
  y: number
  pageNo: number
  page: RenderPage
}

export function getPagePointer(
  evt: MouseEvent,
  pageContainer: HTMLElement
): IPagePointer | null {
  const target = evt.target
  if (!(target instanceof Element)) return null
  let page: Element | null = target
  while (page && page.parentElement !== pageContainer) {
    if (page === pageContainer) return null
    page = page.parentElement
  }
  if (!page?.hasAttribute('data-index')) return null
  const pageNo = Number(page.getAttribute('data-index'))
  if (!Number.isInteger(pageNo)) return null
  if (!(page instanceof HTMLElement || page instanceof SVGSVGElement)) {
    return null
  }
  const rect = page.getBoundingClientRect()
  const clientWidth =
    (page instanceof HTMLElement ? page.clientWidth : 0) || rect.width
  const clientHeight =
    (page instanceof HTMLElement ? page.clientHeight : 0) || rect.height
  const scaleX = rect.width ? clientWidth / rect.width : 1
  const scaleY = rect.height ? clientHeight / rect.height : 1
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY,
    pageNo,
    page
  }
}
