import { describe, expect, it } from 'vitest'
import { AbstractRichText } from '@/editor/core/draw/richtext/AbstractRichText'
import type { IElementFillRect } from '@/editor/interface/Element'
import type { IRenderContext } from '@/editor/core/render/model/RenderContext'

class TestRichText extends AbstractRichText {
  public renderedRects: IElementFillRect[] = []

  public render(): void {
    if (this.fillRect.width) this.renderedRects.push({ ...this.fillRect })
    this.clearFillInfo()
  }

  public getRect(): IElementFillRect {
    return { ...this.fillRect }
  }
}

const ctx = {} as IRenderContext

describe('AbstractRichText visual recording', () => {
  it('默认模式保持原来的逻辑宽度累加', () => {
    const richText = new TestRichText()
    richText.recordFillInfo(ctx, 20, 0, 10)
    richText.recordFillInfo(ctx, 10, 0, 10)

    expect(richText.getRect()).toMatchObject({ x: 20, width: 20 })
  })

  it('视觉模式合并反向相邻元素且不跨越间隙', () => {
    const richText = new TestRichText()
    richText.recordFillInfo(ctx, 20, 0, 10, 16, undefined, undefined, true)
    richText.recordFillInfo(ctx, 10, 0, 10, 16, undefined, undefined, true)
    expect(richText.getRect()).toMatchObject({ x: 10, width: 20 })

    richText.recordFillInfo(ctx, 0, 0, 5, 16, undefined, undefined, true)
    richText.render()
    expect(richText.renderedRects).toEqual([
      expect.objectContaining({ x: 10, width: 20 }),
      expect.objectContaining({ x: 0, width: 5 })
    ])
  })
})
