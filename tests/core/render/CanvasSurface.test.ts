import { afterEach, describe, expect, it, vi } from 'vitest'
import { CanvasSurface } from '@/editor/core/render/canvas/CanvasSurface'

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []

  public observe = vi.fn()
  public disconnect = vi.fn()

  constructor(public callback: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this)
  }
}

function createIntersectionEntry(target: Element, isIntersecting = true) {
  return { target, isIntersecting } as IntersectionObserverEntry
}

function createSurface() {
  const pageContainer = document.createElement('div')
  return {
    pageContainer,
    surface: new CanvasSurface(pageContainer)
  }
}

describe('CanvasSurface', () => {
  afterEach(() => {
    MockIntersectionObserver.instances = []
    vi.unstubAllGlobals()
  })

  it('创建并追加具有 Draw 页面属性的 Canvas', () => {
    const { pageContainer, surface } = createSurface()
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')

    const { page, ctx } = surface.create(2, 600, 800, 20, 2)

    expect(pageContainer.children).toHaveLength(1)
    expect(pageContainer.firstElementChild).toBe(page)
    expect(page.style.width).toBe('600px')
    expect(page.style.height).toBe('800px')
    expect(page.style.display).toBe('block')
    expect(page.style.backgroundColor).toBe('rgb(255, 255, 255)')
    expect(page.style.marginLeft).toBe('auto')
    expect(page.style.marginRight).toBe('auto')
    expect(page.style.marginBottom).toBe('20px')
    expect(page.style.cursor).toBe('text')
    expect(page.dataset.index).toBe('2')
    expect(page.width).toBe(1200)
    expect(page.height).toBe(1600)
    expect(getContext).toHaveBeenCalledWith('2d')
    expect(ctx).toBe(page.getContext('2d'))
  })

  it('初始化上下文的缩放和文本属性', () => {
    const { surface } = createSurface()
    const { ctx } = surface.create(0, 100, 200, 10, 1.5)
    const scale = vi.spyOn(ctx, 'scale')

    expect(scale).toHaveBeenCalledWith(1.5, 1.5)
    expect(ctx.letterSpacing).toBe('0px')
    expect(ctx.wordSpacing).toBe('0px')
    expect(ctx.direction).toBe('ltr')
  })

  it('位图尺寸未变化时不重新初始化上下文', () => {
    const { surface } = createSurface()
    const { page, ctx } = surface.create(0, 100, 200, 10, 2)
    const scale = vi.spyOn(ctx, 'scale')
    scale.mockClear()

    surface.resize(page, ctx, 100, 200, 2)

    expect(page.width).toBe(200)
    expect(page.height).toBe(400)
    expect(scale).not.toHaveBeenCalled()
  })

  it('位图尺寸变化时向下取整并重新初始化上下文', () => {
    const { surface } = createSurface()
    const { page, ctx } = surface.create(0, 100, 200, 10, 2)
    const scale = vi.spyOn(ctx, 'scale')
    scale.mockClear()

    surface.resize(page, ctx, 100.5, 200.5, 1.5)

    expect(page.width).toBe(150)
    expect(page.height).toBe(300)
    expect(scale).toHaveBeenCalledOnce()
    expect(scale).toHaveBeenCalledWith(1.5, 1.5)
    expect(ctx.letterSpacing).toBe('0px')
    expect(ctx.wordSpacing).toBe('0px')
    expect(ctx.direction).toBe('ltr')
  })

  it('连续页 resize 保留 CSS 高度并更新页间距', () => {
    const { surface } = createSurface()
    const { page, ctx } = surface.create(0, 100, 200, 10, 2)

    surface.resize(page, ctx, 120, 240, 2, {
      gap: 24,
      updateCssHeight: false
    })

    expect(page.style.width).toBe('120px')
    expect(page.style.height).toBe('200px')
    expect(page.style.marginBottom).toBe('24px')
    expect(page.height).toBe(400)
  })

  it('按原始高度更新连续页位图并重新初始化上下文', () => {
    const { surface } = createSurface()
    const { page, ctx } = surface.create(0, 100, 200, 10, 1.5)
    const scale = vi.spyOn(ctx, 'scale')
    scale.mockClear()
    let bitmapHeight = 0
    Object.defineProperty(page, 'height', {
      configurable: true,
      get: () => bitmapHeight,
      set: value => {
        bitmapHeight = value
      }
    })

    surface.resizeHeight(page, ctx, 200.5, 1.5)

    expect(page.style.height).toBe('200.5px')
    expect(bitmapHeight).toBe(300.75)
    expect(scale).toHaveBeenCalledOnce()
    expect(scale).toHaveBeenCalledWith(1.5, 1.5)
  })

  it('可见页面仅通过 data-index 通知页码', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    const { surface } = createSurface()
    const visiblePage = document.createElement('div')
    const hiddenPage = document.createElement('div')
    visiblePage.dataset.index = '3'
    hiddenPage.dataset.index = '4'
    const callback = vi.fn()

    surface.observeVisibility([visiblePage, hiddenPage], callback)
    const observer = MockIntersectionObserver.instances[0]
    observer.callback(
      [
        createIntersectionEntry(visiblePage),
        createIntersectionEntry(hiddenPage, false)
      ],
      observer as unknown as IntersectionObserver
    )

    expect(observer.observe).toHaveBeenNthCalledWith(1, visiblePage)
    expect(observer.observe).toHaveBeenNthCalledWith(2, hiddenPage)
    expect(callback).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledWith(3)
  })

  it('重复订阅和取消订阅均断开当前可见性观察器', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    const { surface } = createSurface()
    const page = document.createElement('div')

    surface.observeVisibility([page], vi.fn())
    const firstObserver = MockIntersectionObserver.instances[0]
    surface.observeVisibility([page], vi.fn())
    const secondObserver = MockIntersectionObserver.instances[1]
    surface.disconnectVisibility()

    expect(firstObserver.disconnect).toHaveBeenCalledOnce()
    expect(secondObserver.disconnect).toHaveBeenCalledOnce()
  })
})
