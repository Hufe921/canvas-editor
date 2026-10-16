import { describe, it, expect, afterEach, vi } from 'vitest'
import { ControlType } from '@/editor/dataset/enum/Control'
import { ElementType } from '@/editor/dataset/enum/Element'
import { Draw } from '@/editor/core/draw/Draw'
import { Highlight } from '@/editor/core/draw/richtext/Highlight'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import type { IElement, IElementFillRect } from '@/editor/interface/Element'
import { formatElementList } from '@/editor/utils/element'
import { mergeOption } from '@/editor/utils/option'

type IHighlightRect = IElementFillRect & { color?: string }

describe('高亮背景绘制', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  function buildTwoControlMain(
    control4: Record<string, unknown> = {},
    control5: Record<string, unknown> = {}
  ): IElement[] {
    return [
      { value: 'control4: ' },
      {
        type: ElementType.CONTROL,
        value: '',
        control: {
          conceptId: 'control4',
          type: ControlType.TEXT,
          value: [{ value: 'Comparison' }],
          ...control4
        }
      },
      { value: '  control5: ' },
      {
        type: ElementType.CONTROL,
        value: '',
        control: {
          conceptId: 'control5',
          type: ControlType.TEXT,
          value: [{ value: 'Findings' }],
          ...control5
        }
      },
      { value: '\n' }
    ]
  }

  function renderWithHighlightSpy(
    main: IElement[],
    optionOverrides: Record<string, unknown> = {}
  ) {
    const rects: IHighlightRect[] = []
    vi.spyOn(Highlight.prototype, 'render').mockImplementation(function (
      this: any
    ) {
      if (this.fillRect?.width) {
        rects.push({ ...this.fillRect, color: this.fillColor })
      }
      this.clearFillInfo()
    })
    const container = document.createElement('div')
    document.body.appendChild(container)
    const options = mergeOption({
      width: 794,
      height: 1123,
      margins: [100, 120, 100, 120],
      ...optionOverrides
    })
    formatElementList(main, {
      editorOptions: options,
      isForceCompensation: true
    })
    const draw = new Draw(
      container,
      options,
      { header: [{ value: '\n' }], main, footer: [{ value: '\n' }] },
      new Listener(),
      new EventBus(),
      new Override()
    )
    // 测试环境 IntersectionObserver 为桩，需强制立即渲染
    draw.render({ isLazy: false, isSubmitHistory: false })
    return { draw, rects }
  }

  it('同行多个控件穿插普通文本时控件背景色不错位', () => {
    const { rects } = renderWithHighlightSpy(buildTwoControlMain(), {
      control: {
        existValueBackgroundColor: '#eaf3fd'
      }
    })
    // 每个控件独立绘制一个高亮区域
    expect(rects.length).toBe(2)
    // 两个高亮区域不相交：中间普通文本不被高亮覆盖
    const [first, second] = rects
    expect(second.x).toBeGreaterThanOrEqual(first.x + first.width)
  })

  it('控件级背景色优先于全局配置', () => {
    const { rects } = renderWithHighlightSpy(
      buildTwoControlMain({ existValueBackgroundColor: '#ff0000' }),
      {
        control: {
          existValueBackgroundColor: '#eaf3fd'
        }
      }
    )
    expect(rects.length).toBe(2)
    expect(rects[0].color).toBe('#ff0000')
    expect(rects[1].color).toBe('#eaf3fd')
  })

  it('setControlProperties 实时更新单个控件背景色', () => {
    const { draw, rects } = renderWithHighlightSpy(buildTwoControlMain(), {
      control: {
        existValueBackgroundColor: '#eaf3fd'
      }
    })
    expect(rects.every(rect => rect.color === '#eaf3fd')).toBe(true)
    rects.length = 0
    draw.getControl().setPropertiesListById([
      {
        conceptId: 'control4',
        properties: { existValueBackgroundColor: '#00ff00' },
        isSubmitHistory: false
      }
    ])
    // 强制立即渲染（绕过测试环境懒渲染桩）
    draw.render({ isLazy: false, isSubmitHistory: false })
    expect(rects.length).toBe(2)
    expect(rects[0].color).toBe('#00ff00')
    expect(rects[1].color).toBe('#eaf3fd')
  })
})
