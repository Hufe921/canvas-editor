import { afterEach, describe, expect, it, vi } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { ElementType } from '@/editor/dataset/enum/Element'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []

  public observe = vi.fn()
  public disconnect = vi.fn()

  constructor(public callback: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this)
  }
}

function createIntersectionEntry(target: Element) {
  return { target, isIntersecting: true } as IntersectionObserverEntry
}

describe('LazyRender', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    MockIntersectionObserver.instances = []
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('同步绘制可见页且异步回调不重复绘制', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    const drawPage = vi
      .spyOn(Draw.prototype as any, '_drawPage')
      .mockImplementation(() => {})
    const container = document.createElement('div')
    document.body.append(container)
    const draw = new Draw(
      container,
      mergeOption(),
      {
        header: [{ value: '\n' }],
        main: [
          { value: '第一页\n' },
          { type: ElementType.PAGE_BREAK, value: '\n' },
          { value: '第二页\n' }
        ],
        footer: [{ value: '\n' }]
      },
      new Listener(),
      new EventBus(),
      new Override()
    )

    expect(drawPage).toHaveBeenCalledWith(
      expect.objectContaining({ pageNo: 0 })
    )
    expect(drawPage).not.toHaveBeenCalledWith(
      expect.objectContaining({ pageNo: 1 })
    )

    draw.render({
      isCompute: false,
      isSetCursor: false,
      isSubmitHistory: false
    })
    const pageZeroRenderCount = drawPage.mock.calls.filter(
      ([payload]) => (payload as { pageNo: number }).pageNo === 0
    ).length
    const observer = MockIntersectionObserver.instances.at(-1)!
    observer.callback(
      [createIntersectionEntry(draw.getPage(0))],
      observer as unknown as IntersectionObserver
    )
    expect(
      drawPage.mock.calls.filter(
        ([payload]) => (payload as { pageNo: number }).pageNo === 0
      )
    ).toHaveLength(pageZeroRenderCount)

    observer.callback(
      [createIntersectionEntry(draw.getPage(1))],
      observer as unknown as IntersectionObserver
    )
    expect(drawPage).toHaveBeenCalledWith(
      expect.objectContaining({ pageNo: 1 })
    )
    draw.destroy()
  })
})
