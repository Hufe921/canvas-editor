import { afterEach, describe, expect, it, vi } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { createBackend } from '@/editor/core/render/BackendFactory'
import { CanvasBackend } from '@/editor/core/render/canvas/CanvasBackend'
import { DisplayList } from '@/editor/core/render/model/DisplayList'
import { mergeOption } from '@/editor/utils/option'

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []

  public observe = vi.fn()
  public disconnect = vi.fn()

  constructor(public callback: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this)
  }
}

function createBackendWithContainer() {
  const pageContainer = document.createElement('div')
  return {
    pageContainer,
    backend: new CanvasBackend(pageContainer)
  }
}

describe('CanvasBackend', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    MockIntersectionObserver.instances = []
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('默认工厂创建 Canvas 页面并保留 Draw 的 DOM 结构', () => {
    const pageContainer = document.createElement('div')
    const backend = createBackend(mergeOption().backend, pageContainer)

    expect(backend).toBeInstanceOf(CanvasBackend)

    const container = document.createElement('div')
    document.body.append(container)
    const draw = new Draw(
      container,
      mergeOption(),
      {
        header: [{ value: '\n' }],
        main: [{ value: 'Canvas' }, { value: '\n' }],
        footer: [{ value: '\n' }]
      },
      new Listener(),
      new EventBus(),
      new Override()
    )

    const editorContainer = container.firstElementChild as HTMLElement
    const drawPageContainer = editorContainer.querySelector(
      '.ce-page-container'
    ) as HTMLElement
    const page = drawPageContainer.firstElementChild as HTMLCanvasElement
    expect(editorContainer.getAttribute('editor-component')).toBe('main')
    expect(page.tagName).toBe('CANVAS')
    expect(page.dataset.index).toBe('0')
    expect(page.style.display).toBe('block')
    expect(page.style.backgroundColor).toBe('rgb(255, 255, 255)')
    expect(page.style.marginLeft).toBe('auto')
    expect(page.style.marginRight).toBe('auto')
    expect(page.style.cursor).toBe('text')
    expect(draw.getPageList()).toEqual([page])
    expect(draw.getPage()).toBe(page)
    expect(draw['backend'].canvas?.getContext(0)).toBe(page.getContext('2d'))
    draw.destroy()
  })

  it('管理页面尺寸并提供显式 Canvas 上下文能力', () => {
    const { pageContainer, backend } = createBackendWithContainer()

    backend.create(0, 300, 400, 16, 2)

    const page = backend.getPage(0) as HTMLCanvasElement
    expect(pageContainer.firstElementChild).toBe(page)
    expect(backend.getPageList()).toEqual([page])
    expect(page.width).toBe(600)
    expect(page.height).toBe(800)
    expect(page.style.marginBottom).toBe('16px')
    expect(backend.canvas).toBe(backend)
    expect(backend.canvas?.getContext(0)).toBe(page.getContext('2d'))

    backend.resize(0, 320, 420, 2, {
      gap: 24,
      updateCssHeight: false
    })
    expect(page.style.width).toBe('320px')
    expect(page.style.height).toBe('400px')
    expect(page.style.marginBottom).toBe('24px')

    backend.resizeHeight(0, 500, 2)
    expect(page.style.height).toBe('500px')
    expect(page.height).toBe(1000)
  })

  it('通过页面编号重放 DisplayList', () => {
    const { backend } = createBackendWithContainer()
    backend.create(0, 300, 400, 16, 1)
    const ctx = backend.canvas!.getContext(0)
    const fillRect = vi.spyOn(ctx, 'fillRect')
    const displayList = new DisplayList()
    displayList.fillStyle = '#00ff00'
    displayList.fillRect(1, 2, 3, 4)

    backend.renderPage(0, displayList)

    expect(ctx.fillStyle).toBe('#00ff00')
    expect(fillRect).toHaveBeenCalledWith(1, 2, 3, 4)
  })

  it('订阅可见页面并在销毁时断开观察器', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    const { backend } = createBackendWithContainer()
    backend.create(3, 300, 400, 16, 1)
    const callback = vi.fn()

    backend.observeVisibility(callback)
    const observer = MockIntersectionObserver.instances[0]
    observer.callback(
      [
        {
          target: backend.getPage(0),
          isIntersecting: true
        } as unknown as IntersectionObserverEntry
      ],
      observer as unknown as IntersectionObserver
    )

    expect(observer.observe).toHaveBeenCalledWith(backend.getPage(0))
    expect(callback).toHaveBeenCalledWith(3)
    backend.disconnectVisibility()
    expect(observer.disconnect).toHaveBeenCalledOnce()

    backend.observeVisibility(callback)
    const nextObserver = MockIntersectionObserver.instances[1]
    backend.destroy()
    expect(nextObserver.disconnect).toHaveBeenCalledOnce()
  })
})
