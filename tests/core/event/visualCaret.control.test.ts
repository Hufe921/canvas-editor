import { afterEach, describe, expect, it } from 'vitest'
import { moveVisualCaret } from '@/editor/core/event/handlers/keydown/visual'
import { CanvasEvent } from '@/editor/core/event/CanvasEvent'
import {
  ControlComponent,
  ControlType
} from '@/editor/dataset/enum/Control'
import { EditorMode } from '@/editor/dataset/enum/Editor'
import { ElementType } from '@/editor/dataset/enum/Element'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'
import { createTestEditor, TestEditorContext } from '../../factories/editor'

function dispatchArrow(container: HTMLDivElement, key: string) {
  container.querySelector('.ce-inputarea')!.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true
    })
  )
}

describe('visual caret in controls', () => {
  let ctx: TestEditorContext
  afterEach(() => ctx?.destroy())

  it('控件值在普通模式按视觉位置移动', () => {
    ctx = createTestEditor({
      data: [
        {
          type: ElementType.CONTROL,
          value: '',
          direction: TextDirection.RTL,
          control: {
            type: ControlType.TEXT,
            value: [{ value: 'aב', direction: TextDirection.RTL }]
          }
        }
      ]
    })
    let valueIndex = -1
    for (let index = 0; index < 8; index++) {
      ctx.editor.command.executeSetRange(index, index)
      if (ctx.editor.command.getCursorPosition()?.bidiLevel !== undefined) {
        valueIndex = index
        break
      }
    }
    expect(valueIndex).toBeGreaterThanOrEqual(0)
    const before = ctx.editor.command.getRange().startIndex

    dispatchArrow(ctx.container, 'ArrowLeft')

    expect(ctx.editor.command.getRange().startIndex).not.toBe(before)
    expect(ctx.editor.command.getRange().bidiAffinity).toBeDefined()
  })

  it('表单模式控件后缀边界保留原有关键字处理', () => {
    const evt = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      cancelable: true
    })
    const draw = {
      getMode: () => EditorMode.FORM,
      getControl: () => ({ getActiveControl: () => ({}) }),
      getPosition: () => ({
        getCursorPosition: () => ({ index: 0, bidiLevel: 1 })
      }),
      getElementList: () => [
        { value: 'a' },
        { value: '', controlComponent: ControlComponent.POSTFIX }
      ]
    }
    const host = { getDraw: () => draw } as unknown as CanvasEvent

    expect(moveVisualCaret(evt, host, 1)).toBe(false)
    expect(evt.defaultPrevented).toBe(false)
  })
})
