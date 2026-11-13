import { afterEach, describe, expect, it, vi } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { BackendType, PageLayout } from '@/editor/dataset/enum/Editor'
import { ElementType } from '@/editor/dataset/enum/Element'
import type { IElement } from '@/editor/interface/Element'
import { mergeOption } from '@/editor/utils/option'

class MockResizeObserver {
  static instances: MockResizeObserver[] = []

  public observe = vi.fn()
  public disconnect = vi.fn()
  public unobserve = vi.fn()

  constructor(public callback: ResizeObserverCallback) {
    MockResizeObserver.instances.push(this)
  }
}

function createMain(pageCount: number): IElement[] {
  const main: IElement[] = []
  for (let i = 0; i < pageCount; i++) {
    main.push({ value: `第${i + 1}页\n` })
    if (i < pageCount - 1) {
      main.push({ type: ElementType.PAGE_BREAK, value: '\n' })
    }
  }
  return main
}

const drawList: Draw[] = []

function createDraw(
  options: {
    pageCount?: number
    pageLayout?: PageLayout
    backend?: BackendType
    width?: number
    height?: number
    scale?: number
    rootWidth?: number
  } = {}
) {
  let rootWidth = options.rootWidth ?? 900
  const root = document.createElement('div')
  Object.defineProperty(root, 'clientWidth', {
    configurable: true,
    get: () => rootWidth
  })
  document.body.append(root)
  const draw = new Draw(
    root,
    mergeOption({
      width: options.width ?? 300,
      height: options.height ?? 400,
      scale: options.scale ?? 1,
      pageGap: 20,
      ...(options.pageLayout ? { pageLayout: options.pageLayout } : {}),
      ...(options.backend ? { backend: options.backend } : {})
    }),
    {
      header: [{ value: '\n' }],
      main: createMain(options.pageCount ?? 3),
      footer: [{ value: '\n' }]
    },
    new Listener(),
    new EventBus(),
    new Override()
  )
  drawList.push(draw)
  return {
    draw,
    root,
    setRootWidth: (width: number) => {
      rootWidth = width
    }
  }
}

describe('多页视图', () => {
  afterEach(() => {
    while (drawList.length) {
      drawList.pop()?.destroy()
    }
    document.body.innerHTML = ''
    MockResizeObserver.instances = []
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('默认关闭并保持原有单页垂直布局', () => {
    const { draw } = createDraw()

    expect(mergeOption().pageLayout).toBe(PageLayout.SINGLE)
    expect(draw.getOptions().pageLayout).toBe(PageLayout.SINGLE)
    expect(draw.isMultiPageLayout()).toBe(false)
    expect(draw.getPageOffset(0)).toEqual({ x: 0, y: 0 })
    expect(draw.getPageOffset(1)).toEqual({ x: 0, y: 420 })
    expect(draw.getPageOffset(2)).toEqual({ x: 0, y: 840 })
    expect(draw.getContainer().style.width).toBe('300px')
    expect(draw.getPage(1).style.position).toBe('')
  })

  it('默认单页不创建观察者，重渲染不读取页面定位样式', () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    const { draw } = createDraw()
    const styleReaderList = draw
      .getPageList()
      .map(page => vi.spyOn(page.style, 'getPropertyValue'))

    draw.render({ isSubmitHistory: false, isSetCursor: false })

    expect(MockResizeObserver.instances).toHaveLength(0)
    styleReaderList.forEach(styleReader => {
      expect(styleReader).not.toHaveBeenCalled()
    })
  })

  it('开启后按行列定位页面且末行独立居中', () => {
    const { draw } = createDraw({ pageLayout: PageLayout.MULTIPLE })
    const pageList = draw.getPageList()

    expect(draw.isMultiPageLayout()).toBe(true)
    expect(draw.getPageOffset(0)).toEqual({ x: 140, y: 0 })
    expect(draw.getPageOffset(1)).toEqual({ x: 460, y: 0 })
    expect(draw.getPageOffset(2)).toEqual({ x: 300, y: 420 })
    expect(draw.getContainer().style.width).toBe('900px')
    expect(draw.getPageContainer().style.height).toBe('840px')
    expect(pageList[0].style.position).toBe('absolute')
    expect(pageList[1].style.left).toBe('460px')
    expect(pageList[1].style.top).toBe('0px')
    expect(pageList[2].style.left).toBe('300px')
    expect(pageList[2].style.top).toBe('420px')
  })

  it('多页布局输入不变时不读取容器宽度或页面定位样式', () => {
    const { draw, root } = createDraw({ pageLayout: PageLayout.MULTIPLE })
    const rootWidthReader = vi.spyOn(root, 'clientWidth', 'get')
    const styleReaderList = draw
      .getPageList()
      .map(page => vi.spyOn(page.style, 'getPropertyValue'))

    draw.render({ isSubmitHistory: false, isSetCursor: false })

    expect(rootWidthReader).not.toHaveBeenCalled()
    styleReaderList.forEach(styleReader => {
      expect(styleReader).not.toHaveBeenCalled()
    })
  })

  it('运行时切回单页会清理多页定位样式', () => {
    const { draw } = createDraw({ pageLayout: PageLayout.MULTIPLE })

    draw.setPageLayout(PageLayout.SINGLE)

    expect(draw.isMultiPageLayout()).toBe(false)
    expect(draw.getPageOffset(1)).toEqual({ x: 0, y: 420 })
    expect(draw.getPage(1).style.position).toBe('')
    expect(draw.getPage(1).style.left).toBe('')
    expect(draw.getPage(1).style.marginLeft).toBe('auto')
    expect(draw.getPageContainer().style.height).toBe('')
  })

  it('缩放后同步重排并正确换算原始坐标', () => {
    const { draw } = createDraw({
      pageLayout: PageLayout.MULTIPLE,
      width: 400
    })

    expect(draw.getPageOffset(1).y).toBe(0)
    expect(draw.getPageOffset(2).y).toBe(420)
    draw.setPageScale(0.5)

    expect(draw.getPageOffset(0)).toEqual({ x: 140, y: 0 })
    expect(draw.getPageOffset(1)).toEqual({ x: 350, y: 0 })
    expect(draw.getPageOffset(2)).toEqual({ x: 560, y: 0 })
    expect(draw.getPageOffset(1, true)).toEqual({ x: 700, y: 0 })
  })

  it('容器宽度变化后自动重排', () => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    let frameCallback: FrameRequestCallback | null = null
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        frameCallback = callback
        return 1
      })
    )
    const { draw, setRootWidth } = createDraw({
      pageLayout: PageLayout.MULTIPLE,
      rootWidth: 500
    })
    expect(draw.isMultiPageLayout()).toBe(false)

    setRootWidth(900)
    const observer = MockResizeObserver.instances[0]
    observer.callback([], observer as unknown as ResizeObserver)
    expect(frameCallback).not.toBeNull()
    frameCallback!(0)

    expect(draw.isMultiPageLayout()).toBe(true)
    expect(draw.getPageOffset(1)).toEqual({ x: 460, y: 0 })
  })

  it('页数减少后移除过期页面和布局偏移', () => {
    const { draw } = createDraw({
      pageCount: 5,
      pageLayout: PageLayout.MULTIPLE
    })
    expect(draw.getPageOffset(4)).toEqual({ x: 300, y: 840 })

    draw.setEditorData({ main: createMain(2) })
    draw.render({ isSubmitHistory: false, isSetCursor: false })

    expect(draw.getPageList()).toHaveLength(2)
    expect(draw.getPageContainer().style.height).toBe('420px')
    expect(draw.getPageOffset(1)).toEqual({ x: 460, y: 0 })
    expect(draw.getPageOffset(4)).toEqual({ x: 0, y: 0 })
  })

  it('SVG 后端使用相同的多页坐标', () => {
    const { draw } = createDraw({
      pageLayout: PageLayout.MULTIPLE,
      backend: BackendType.SVG
    })

    expect(draw.getPageOffset(1)).toEqual({ x: 460, y: 0 })
    expect(draw.getPage(1).style.position).toBe('absolute')
    expect(draw.getPage(1).style.left).toBe('460px')
    expect(draw.getPage(1).style.top).toBe('0px')
  })
})
