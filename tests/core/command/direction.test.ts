import { afterEach, describe, expect, it, vi } from 'vitest'
import { EditorZone } from '@/editor/dataset/enum/Editor'
import { ElementType } from '@/editor/dataset/enum/Element'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'
import { createTestEditor, TestEditorContext } from '../../factories/editor'
import { waitMacroTask } from '../../factories/editor'

describe('文本方向命令', () => {
  let ctx: TestEditorContext
  afterEach(() => ctx?.destroy())

  it('setDirection 与 executeDirection 设置并持久化当前段落', () => {
    ctx = createTestEditor({ data: [{ value: 'abc' }] })
    ctx.editor.command.executeSetRange(1, 1)
    expect(ctx.editor.command.getDirection()).toBe(TextDirection.LTR)

    ctx.editor.command.setDirection(TextDirection.RTL)
    expect(ctx.editor.command.getDirection()).toBe(TextDirection.RTL)
    expect(
      ctx.editor.command.getValue().data.main.every(
        element => element.direction === TextDirection.RTL
      )
    ).toBe(true)

    ctx.editor.command.executeDirection(TextDirection.AUTO)
    expect(ctx.editor.command.getDirection()).toBe(TextDirection.AUTO)
  })

  it('getDirection 在空段落回退到默认方向', () => {
    ctx = createTestEditor({
      data: [{ value: '\n' }],
      options: { defaultDirection: TextDirection.RTL }
    })
    ctx.editor.command.executeSetRange(0, 0)

    expect(ctx.editor.command.getDirection()).toBe(TextDirection.RTL)
  })

  it('rangeStyleChange 返回有效方向和恢复默认方向', async () => {
    ctx = createTestEditor({
      data: [{ value: 'abc', direction: TextDirection.RTL }]
    })
    const listener = vi.fn()
    ctx.editor.listener.rangeStyleChange = listener
    ctx.editor.command.executeSetRange(1, 1)
    await waitMacroTask()
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ direction: TextDirection.RTL })
    )

    window.dispatchEvent(new Event('blur'))
    await waitMacroTask()
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ direction: TextDirection.LTR })
    )
  })

  it('页眉和页脚复用同一方向命令', () => {
    ctx = createTestEditor({
      data: {
        header: [{ value: 'header' }],
        main: [{ value: 'main' }],
        footer: [{ value: 'footer' }]
      }
    })
    for (const zone of [EditorZone.HEADER, EditorZone.FOOTER]) {
      ctx.editor.command.executeSetZone(zone)
      ctx.editor.command.executeSetRange(1, 1)
      ctx.editor.command.setDirection(TextDirection.RTL)
      expect(ctx.editor.command.getDirection()).toBe(TextDirection.RTL)
    }
    const { header, footer } = ctx.editor.command.getValue().data
    expect(header?.some(element => element.direction === TextDirection.RTL)).toBe(
      true
    )
    expect(footer?.some(element => element.direction === TextDirection.RTL)).toBe(
      true
    )
  })

  it('表格单元格复用同一方向命令', () => {
    ctx = createTestEditor({
      data: [
        {
          type: ElementType.TABLE,
          value: '',
          colgroup: [{ width: 100 }],
          trList: [
            {
              height: 40,
              tdList: [
                {
                  colspan: 1,
                  rowspan: 1,
                  value: [{ value: 'abc' }]
                }
              ]
            }
          ]
        }
      ]
    })
    const table = ctx.editor.command
      .getValue({ extraPickAttrs: ['id'] })
      .data.main.find(element => element.type === ElementType.TABLE)!
    ctx.editor.command.executeSetPositionContext({
      startIndex: 0,
      endIndex: 0,
      tableId: table.id,
      startTrIndex: 0,
      startTdIndex: 0
    })
    ctx.editor.command.executeSetRange(1, 1, table.id, 0, 0, 0, 0)
    ctx.editor.command.setDirection(TextDirection.RTL)

    const value = ctx.editor.command.getValue().data.main[0]
    expect(
      value.trList?.[0].tdList[0].value.every(
        element => element.direction === TextDirection.RTL
      )
    ).toBe(true)
    expect(ctx.editor.command.getDirection()).toBe(TextDirection.RTL)
  })
})
