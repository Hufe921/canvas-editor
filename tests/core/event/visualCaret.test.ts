import { afterEach, describe, expect, it } from 'vitest'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'
import { createTestEditor, TestEditorContext } from '../../factories/editor'

function dispatchArrow(
  container: HTMLDivElement,
  key: 'ArrowLeft' | 'ArrowRight',
  shiftKey = false
) {
  const input = container.querySelector('.ce-inputarea')!
  input.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      shiftKey,
      bubbles: true,
      cancelable: true
    })
  )
}

describe('visual caret keyboard navigation', () => {
  let ctx: TestEditorContext
  afterEach(() => ctx?.destroy())

  it('BiDi 行内按视觉位置移动并保留目标亲和性', () => {
    ctx = createTestEditor({
      data: [{ value: 'aבג', direction: TextDirection.RTL }]
    })
    ctx.editor.command.executeSetRange(0, 0)
    expect(ctx.editor.command.getCursorPosition()?.bidiLevel).toBeDefined()

    dispatchArrow(ctx.container, 'ArrowLeft')

    expect(ctx.editor.command.getRange()).toMatchObject({
      bidiAffinity: 'before'
    })
    expect(ctx.editor.command.getRange().startIndex).not.toBe(0)
  })

  it('Shift 扩展仍产生逻辑连续选区', () => {
    ctx = createTestEditor({
      data: [{ value: 'aבג', direction: TextDirection.RTL }]
    })
    ctx.editor.command.executeSetRange(0, 0)
    dispatchArrow(ctx.container, 'ArrowLeft')

    dispatchArrow(ctx.container, 'ArrowLeft', true)

    const range = ctx.editor.command.getRange()
    expect(range.startIndex).toBeLessThan(range.endIndex)
    expect(range.bidiAffinity).toBeDefined()
  })

  it('普通 LTR 行沿用原键盘路径且不生成亲和性', () => {
    ctx = createTestEditor({ data: [{ value: 'abc' }] })
    ctx.editor.command.executeSetRange(1, 1)

    dispatchArrow(ctx.container, 'ArrowRight')

    expect(ctx.editor.command.getRange()).toMatchObject({
      startIndex: 2,
      endIndex: 2,
      bidiAffinity: undefined
    })
  })
})

describe('visual caret boundary', () => {
  let ctx: TestEditorContext
  afterEach(() => ctx?.destroy())

  it('单行视觉边界不按逻辑方向回绕', () => {
    ctx = createTestEditor({
      data: [{ value: 'aב', direction: TextDirection.RTL }]
    })
    const lastIndex = ctx.editor.command.getValue({
      extraPickAttrs: []
    }).data.main.length
    ctx.editor.command.executeSetRange(lastIndex, lastIndex)
    const before = ctx.editor.command.getRange().startIndex

    dispatchArrow(ctx.container, 'ArrowLeft')

    expect(ctx.editor.command.getRange().startIndex).toBe(before)
  })
})
