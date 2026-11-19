import { afterEach, describe, expect, it, vi } from 'vitest'
import { ControlType } from '@/editor/dataset/enum/Control'
import { ElementType } from '@/editor/dataset/enum/Element'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'
import { createTestEditor, TestEditorContext } from '../../factories/editor'

describe('方向文本绘制边界', () => {
  let ctx: TestEditorContext
  afterEach(() => {
    ctx?.destroy()
    vi.restoreAllMocks()
  })

  it('RTL 小数不会被标点规则拆成独立绘制', () => {
    ctx = createTestEditor({
      data: Array.from('39.5℃').map(value => ({
        value,
        direction: TextDirection.RTL
      }))
    })
    const canvas = ctx.container.querySelector('canvas')!
    const fillText = vi.spyOn(canvas.getContext('2d')!, 'fillText')
    fillText.mockClear()

    ctx.editor.command.executeForceUpdate()

    const textList = fillText.mock.calls.map(call => call[0])
    expect(textList).toContain('39.5')
    expect(textList).not.toContain('.')
  })

  it('RTL 行内 LTR run 按自身层级方向绘制', () => {
    ctx = createTestEditor({
      data: Array.from('T：39.5℃，P：80bpm；').map(value => ({
        value,
        direction: TextDirection.RTL
      }))
    })
    const canvas = ctx.container.querySelector('canvas')!
    const context = canvas.getContext('2d')!
    const fillText = vi.spyOn(context, 'fillText')
    const directionList: CanvasDirection[] = []
    fillText.mockImplementation(function (this: CanvasRenderingContext2D, text) {
      if (text.startsWith('T：39.5℃')) directionList.push(this.direction)
    })

    ctx.editor.command.executeForceUpdate()

    expect(directionList).toEqual(['ltr'])
  })

  it('RTL 复选框选项尾部间距不会拆开连写文本', () => {
    ctx = createTestEditor({
      data: [
        {
          type: ElementType.CONTROL,
          value: '',
          direction: TextDirection.RTL,
          control: {
            type: ControlType.CHECKBOX,
            value: null,
            code: '1',
            valueSets: [{ value: 'أوافق', code: '1' }]
          }
        }
      ]
    })
    const canvas = ctx.container.querySelector('canvas')!
    const fillText = vi.spyOn(canvas.getContext('2d')!, 'fillText')
    fillText.mockClear()

    ctx.editor.command.executeForceUpdate()

    const textList = fillText.mock.calls.map(call => call[0])
    expect(textList).toContain('أوافق')
    expect(textList).not.toContain('أواف')
    expect(textList).not.toContain('ق')
  })
})
