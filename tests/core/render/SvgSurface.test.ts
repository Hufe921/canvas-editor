import { afterEach, describe, expect, it, vi } from 'vitest'
import { SvgSurface } from '@/editor/core/render/svg/SvgSurface'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []

  public observe = vi.fn()
  public disconnect = vi.fn()

  constructor(public callback: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this)
  }
}

describe('SvgSurface', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    MockIntersectionObserver.instances = []
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('每页创建一个带尺寸、索引和页面样式的 SVG 根节点', () => {
    const pageContainer = document.createElement('div')
    const surface = new SvgSurface(pageContainer)

    const { page } = surface.create(2, 300, 400, 16)

    expect(page.namespaceURI).toBe(SVG_NAMESPACE)
    expect(page.tagName).toBe('svg')
    expect(page.dataset.index).toBe('2')
    expect(page.getAttribute('viewBox')).toBe('0 0 300 400')
    expect(page.style.width).toBe('300px')
    expect(page.style.height).toBe('400px')
    expect(page.style.display).toBe('block')
    expect(page.style.backgroundColor).toBe('rgb(255, 255, 255)')
    expect(page.style.marginLeft).toBe('auto')
    expect(page.style.marginRight).toBe('auto')
    expect(page.style.marginBottom).toBe('16px')
    expect(page.style.cursor).toBe('text')
    expect(page.style.userSelect).toBe('none')
    expect(pageContainer.children).toHaveLength(1)
    expect(pageContainer.firstElementChild).toBe(page)
  })

  it('resize 保留连续页 CSS 高度且 resizeHeight 同步 viewBox', () => {
    const surface = new SvgSurface(document.createElement('div'))
    const { page } = surface.create(0, 300, 400, 16)

    surface.resize(page, 320, 420, {
      gap: 24,
      updateCssHeight: false
    })

    expect(page.style.width).toBe('320px')
    expect(page.style.height).toBe('400px')
    expect(page.style.marginBottom).toBe('24px')
    expect(page.getAttribute('viewBox')).toBe('0 0 320 400')

    surface.resizeHeight(page, 500)

    expect(page.style.height).toBe('500px')
    expect(page.getAttribute('viewBox')).toBe('0 0 320 500')
  })

  it('订阅可见页面并在断开时清理观察器', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    const surface = new SvgSurface(document.createElement('div'))
    const { page } = surface.create(3, 300, 400, 16)
    const callback = vi.fn()

    surface.observeVisibility([page], callback)
    const observer = MockIntersectionObserver.instances[0]
    observer.callback(
      [
        {
          target: page,
          isIntersecting: true
        } as unknown as IntersectionObserverEntry
      ],
      observer as unknown as IntersectionObserver
    )

    expect(observer.observe).toHaveBeenCalledWith(page)
    expect(callback).toHaveBeenCalledWith(3)
    surface.disconnectVisibility()
    expect(observer.disconnect).toHaveBeenCalledOnce()
  })
})
