import { afterEach, describe, expect, it, vi } from 'vitest'
import { PageMode } from '@/editor/dataset/enum/Editor'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { CanvasRenderer } from '@/editor/core/render/canvas/CanvasRenderer'
import { DisplayList } from '@/editor/core/render/model/DisplayList'
import { mergeOption } from '@/editor/utils/option'
import { createTestEditor } from '../../factories/editor'

describe('Draw DisplayList 集成', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('真实编辑器的页面绘制经过 CanvasRenderer', () => {
    const render = vi.spyOn(CanvasRenderer.prototype, 'render')
    const container = document.createElement('div')
    document.body.append(container)
    const draw = new Draw(
      container,
      mergeOption(),
      {
        header: [{ value: '\n' }],
        main: [{ value: 'DisplayList' }, { value: '\n' }],
        footer: [{ value: '\n' }]
      },
      new Listener(),
      new EventBus(),
      new Override()
    )

    draw.render({ isLazy: false, isSubmitHistory: false })

    expect(render).toHaveBeenCalled()
    const displayList = render.mock.calls[0][1]
    expect(displayList).toBeInstanceOf(DisplayList)
    expect(displayList.getOperations().length).toBeGreaterThan(0)
    draw.destroy()
  })

  it('水平和垂直标尺直接使用各自的 Canvas 上下文绘制', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const draw = new Draw(
      container,
      mergeOption({ ruler: { disabled: false } }),
      {
        header: [{ value: '\n' }],
        main: [{ value: '\n' }],
        footer: [{ value: '\n' }]
      },
      new Listener(),
      new EventBus(),
      new Override()
    )
    const scale = vi.spyOn(CanvasRenderingContext2D.prototype, 'scale')
    scale.mockClear()

    draw.getRuler().render()

    expect(scale).toHaveBeenCalledTimes(2)
    draw.destroy()
  })

  it('连续页高度变化后切换分页不会累乘 DPR', () => {
    vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(2)
    const { editor, container, destroy } = createTestEditor({
      data: Array.from({ length: 80 }, () => ({ value: 'line\n' })),
      options: { pageMode: PageMode.CONTINUITY }
    })
    const page = container.querySelector('canvas')!
    const ctx = page.getContext('2d')!
    for (const key of ['width', 'height'] as const) {
      let value = page[key]
      Object.defineProperty(page, key, {
        configurable: true,
        get: () => value,
        set: (nextValue: number) => {
          value = nextValue
          ctx.resetTransform()
        }
      })
    }
    const expandedHeight = page.style.height

    editor.command.executeSetValue({
      main: Array.from({ length: 60 }, () => ({ value: 'line\n' }))
    })

    expect(page.style.height).not.toBe(expandedHeight)
    editor.command.executePageMode(PageMode.PAGING)

    expect(page.getContext('2d')!.getTransform().a).toBe(2)
    destroy()
  })
})
