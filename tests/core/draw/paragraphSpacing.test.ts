import { createTestDraw } from '../../factories/draw'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { Underline } from '@/editor/core/draw/richtext/Underline'
import { Highlight } from '@/editor/core/draw/richtext/Highlight'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import { IElement } from '@/editor/interface/Element'

const PAGE_OPTION = {
  width: 794,
  height: 1123,
  margins: [100, 120, 100, 120] as [number, number, number, number],
  header: { disabled: true },
  footer: { disabled: true }
}

async function renderMain(main: IElement[]): Promise<Draw> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const options = mergeOption({ ...PAGE_OPTION })
  formatElementList(main, {
    editorOptions: options,
    isForceCompensation: true
  })
  const draw = await createTestDraw(
    container,
    options,
    { header: [{ value: '\n' }], main, footer: [{ value: '\n' }] },
    new Listener(),
    new EventBus(),
    new Override()
  )
  draw.render()
  return draw
}

describe('段落间距', () => {
  it('段后间距增加段落末行高度，段前间距增加段落首行偏移', async () => {
    const baseDraw = await renderMain([
      { value: 'a' },
      { value: '\n' },
      { value: 'b' },
      { value: '\n' }
    ])
    const baseRowList = baseDraw.getRowList()

    // 段落属性真实归属：换行符归属于其后段落
    // 段落 a = [a]，段落 b = [换行符, b]
    const spacedDraw = await renderMain([
      { value: 'a', spacingAfter: 10 },
      { value: '\n', spacingBefore: 20, spacingAfter: 30 },
      { value: 'b', spacingBefore: 20, spacingAfter: 30 },
      { value: '\n' }
    ])
    const spacedRowList = spacedDraw.getRowList()

    expect(spacedRowList.length).toBe(baseRowList.length)
    // 段落 a 末行高度增加 a 的段后间距（而非下一段换行符上的值）
    expect(spacedRowList[0].height).toBeCloseTo(baseRowList[0].height + 10)
    // 段落 b 首行（换行符引领的行）增加段前偏移
    expect(spacedRowList[1].offsetY || 0).toBeCloseTo(
      (baseRowList[1].offsetY || 0) + 20
    )
    // 段落 b 末行高度增加 b 的段后间距
    expect(spacedRowList[1].height).toBeCloseTo(baseRowList[1].height + 30)
    // 段后间距记录在行上，供选区等视觉绘制剔除
    expect(spacedRowList[0].spacingAfter || 0).toBeCloseTo(10)
    expect(spacedRowList[1].spacingAfter || 0).toBeCloseTo(30)
    expect(
      spacedRowList[1].height - (spacedRowList[1].spacingAfter || 0)
    ).toBeCloseTo(baseRowList[1].height)
  })

  it('点击段前间距空白应定位到该段落，而非页面最后一行', async () => {
    const draw = await renderMain([
      { value: 'a' },
      { value: '\n', spacingBefore: 20 },
      { value: 'b', spacingBefore: 20 },
      { value: '\n' }
    ])
    const position = draw.getPosition()
    const positionList = position.getPositionList()
    const bPosition = positionList.find(p => p.value === 'b')!
    // 段落 b 内容上方段前间距空白的中间位置
    const result = position.getPositionByXY({
      x: bPosition.coordinate.leftTop[0] + 1,
      y: bPosition.coordinate.leftTop[1] - 10
    })
    // 命中段落 b 行首的换行符（b 的前一个元素），而非页面最后一行
    expect(result.index).toBe(bPosition.index - 1)
  })

  describe('段后间距不影响行内装饰绘制', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    async function recordDecorations(spacingAfter?: number) {
      const underlineSpy = vi.spyOn(Underline.prototype, 'recordFillInfo')
      const highlightSpy = vi.spyOn(Highlight.prototype, 'recordFillInfo')
      const draw = await renderMain([
        { value: 'a', underline: true, highlight: '#ff0', spacingAfter },
        { value: '\n' },
        { value: 'b' },
        { value: '\n' }
      ])
      // 默认懒渲染依赖 IntersectionObserver，需立即绘制页面
      draw.render({ isLazy: false, isSubmitHistory: false, isSetCursor: false })
      // recordFillInfo(ctx, x, y, width, height, ...)
      const underlineY = underlineSpy.mock.calls[0][2]
      const highlightHeight = highlightSpy.mock.calls[0][4]!
      vi.restoreAllMocks()
      return { underlineY, highlightHeight }
    }

    it('下划线与高亮仅基于内容高度，不延伸至段后间距', async () => {
      const base = await recordDecorations()
      const spaced = await recordDecorations(30)
      expect(spaced.underlineY).toBeCloseTo(base.underlineY)
      expect(spaced.highlightHeight).toBeCloseTo(base.highlightHeight)
    })
  })
})
