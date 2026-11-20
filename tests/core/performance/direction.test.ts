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

  it('普通 LTR 标尺重绘不执行 BiDi 方向扫描', async () => {
    const resolveDirection = vi.spyOn(
      BidiResolver.prototype,
      'resolveDirection'
    )
    ctx = createTestEditor({
      data: [{ value: 'plain text' }],
      options: { ruler: { disabled: false } }
    })
    ctx.editor.command.executeForceUpdate()
    await new Promise(resolve => setTimeout(resolve))

    expect(resolveDirection).not.toHaveBeenCalled()
  })

  it('点击、框选、文本拖放和左右键不进入 BiDi 计算', () => {
    ctx = createTestEditor({ data: [{ value: 'abcdef' }] })
    const page = ctx.container.querySelector<HTMLCanvasElement>(
      'canvas[data-index="0"]'
    )!
    Object.defineProperties(page, {
      clientWidth: { value: 794 },
      clientHeight: { value: 1123 }
    })
    page.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 794,
        height: 1123
      }) as DOMRect
    const getPosition = (index: number) => {
      ctx.editor.command.executeSetRange(index, index)
      return ctx.editor.command.getCursorPosition()!
    }
    const start = getPosition(1)
    const end = getPosition(4)
    const drop = getPosition(5)
    const resolve = vi.spyOn(BidiResolver.prototype, 'resolve')
    const resolveDirection = vi.spyOn(
      BidiResolver.prototype,
      'resolveDirection'
    )
    const shape = vi.spyOn(NativeTextShaper.prototype, 'measureElement')
    const dispatchMouse = (
      type: string,
      position: typeof start,
      isRight = false
    ) => {
      const coordinate = isRight
        ? position.coordinate.rightTop
        : position.coordinate.leftTop
      page.dispatchEvent(
        new MouseEvent(type, {
          bubbles: true,
          clientX: coordinate[0] + (isRight ? -1 : 1),
          clientY: coordinate[1] + 1
        })
      )
    }

    dispatchMouse('mousedown', start)
    dispatchMouse('mouseup', start)
    expect(ctx.editor.command.getCursorPosition()?.bidiLevel).toBeUndefined()

    dispatchMouse('mousedown', start)
    dispatchMouse('mousemove', end, true)
    expect(ctx.editor.command.getRange().startIndex).not.toBe(
      ctx.editor.command.getRange().endIndex
    )
    dispatchMouse('mouseup', end, true)

    // 在已有选区上再次按下并移到选区外，走完真实文本拖放链路
    dispatchMouse('mousedown', start)
    dispatchMouse('mousemove', drop, true)
    dispatchMouse('mouseup', drop, true)
    const text = ctx.editor.command
      .getValue()
      .data.main.map(element => element.value)
      .join('')
    expect(text).not.toBe('abcdef')

    ctx.container.querySelector('.ce-inputarea')!.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        cancelable: true
      })
    )
    expect(resolve).not.toHaveBeenCalled()
    expect(resolveDirection).not.toHaveBeenCalled()
    expect(shape).not.toHaveBeenCalled()
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
