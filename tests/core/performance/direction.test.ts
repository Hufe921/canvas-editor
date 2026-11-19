import { afterEach, describe, expect, it, vi } from 'vitest'
import { BidiResolver } from '@/editor/core/bidi/resolver/BidiResolver'
import { NativeTextShaper } from '@/editor/core/bidi/shape/NativeTextShaper'
import { HyperlinkParticle } from '@/editor/core/draw/particle/HyperlinkParticle'
import { ElementType } from '@/editor/dataset/enum/Element'
import { createTestEditor, TestEditorContext } from '../../factories/editor'

describe('默认 LTR 性能路径', () => {
  let ctx: TestEditorContext
  afterEach(() => {
    ctx?.destroy()
    vi.restoreAllMocks()
  })

  it('长文档多次重绘不执行 BiDi 解析或原生上下文塑形', () => {
    const resolve = vi.spyOn(BidiResolver.prototype, 'resolve')
    const resolveDirection = vi.spyOn(
      BidiResolver.prototype,
      'resolveDirection'
    )
    const shape = vi.spyOn(NativeTextShaper.prototype, 'measureElement')
    const data = Array.from({ length: 2000 }, (_, index) => ({
      value: (index + 1) % 40 === 0 ? '\n' : 'a'
    }))

    ctx = createTestEditor({ data })
    ctx.editor.command.executeForceUpdate()
    ctx.editor.command.executeForceUpdate()
    ctx.editor.command.executeSetRange(3, 3)

    expect(resolve).not.toHaveBeenCalled()
    expect(resolveDirection).not.toHaveBeenCalled()
    expect(shape).not.toHaveBeenCalled()
    expect(ctx.editor.command.getCursorPosition()?.bidiLevel).toBeUndefined()
  })

  it('普通超链接沿用原绘制路径', () => {
    const render = vi.spyOn(HyperlinkParticle.prototype, 'render')

    ctx = createTestEditor({
      data: [
        {
          type: ElementType.HYPERLINK,
          value: '',
          valueList: [{ value: 'link' }],
          url: 'https://example.com'
        }
      ]
    })
    ctx.editor.command.executeForceUpdate()

    expect(render).toHaveBeenCalled()
  })
})

describe('默认 LTR 画布状态', () => {
  let ctx: TestEditorContext
  afterEach(() => {
    ctx?.destroy()
    vi.restoreAllMocks()
  })

  it('普通文本重绘不写入 Canvas direction', () => {
    ctx = createTestEditor({ data: [{ value: 'plain text' }] })
    const setter = vi.spyOn(
      CanvasRenderingContext2D.prototype,
      'direction',
      'set'
    )

    ctx.editor.command.executeForceUpdate()

    expect(setter).not.toHaveBeenCalled()
  })
})
