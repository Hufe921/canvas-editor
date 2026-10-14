import { describe, it, expect, afterEach } from 'vitest'
import { EditorZone } from '@/editor/dataset/enum/Editor'
import { ElementType } from '@/editor/dataset/enum/Element'
import { ZERO } from '@/editor/dataset/constant/Common'
import type { IElement } from '@/editor/interface/Element'
import type { ILocatedRange } from '@/editor/interface/Range'
import { createTestEditor } from '../../factories/editor'

function nested(): IElement[] {
  return [{ value: 'Body' }, {
    type: ElementType.TABLE, id: 'outer', value: '',
    colgroup: [{ width: 400 }], trList: [{ id: 'outer-row', height: 140,
      tdList: [{ id: 'outer-cell', colspan: 1, rowspan: 1, value: [{
        type: ElementType.TABLE, id: 'inner', value: '',
        colgroup: [{ width: 180 }, { width: 180 }], trList: [{
          id: 'inner-row', height: 80, tdList: ['left', 'right'].map(id => ({
            id, colspan: 1, rowspan: 1, value: [{ value: '🔔 é' }]
          }))
        }]
      }] }]
    }] }]
}
const located = (cellId = 'left'): ILocatedRange => ({
  zone: EditorZone.MAIN, tablePath: [
    { tableId: 'outer', rowId: 'outer-row', cellId: 'outer-cell' },
    { tableId: 'inner', rowId: 'inner-row', cellId }
  ], startIndex: 0, endIndex: 1, sourceText: ZERO + '🔔 é'
})

describe('stable nested range restoration and element geometry', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('restores repeated text into the exact nested cell and exposes cloned boxes', () => {
    ctx = createTestEditor({ data: nested() })
    const command = ctx.editor.command
    const before = command.getValue().data
    command.executeRestoreRange(located())
    expect(command.getRangeContext()?.selectionText).toContain('🔔')
    expect(command.getRangeContext()?.tdIndex).toBe(0)
    const left = command.getLocatedElementRects(located())
    command.executeRestoreRange(located('right'))
    expect(command.getRangeContext()?.tdIndex).toBe(1)
    const right = command.getLocatedElementRects(located('right'))
    expect(right.at(-1)?.x).toBeGreaterThan(left.at(-1)?.x ?? 0)
    expect(right.at(-1)?.height).toBeGreaterThan(0)
    right[0].x = -999
    expect(command.getLocatedElementRects(located('right'))[0].x).not.toBe(-999)
    expect(command.getValue().data).toEqual(before)
    command.executeSize(22)
    expect(command.getRangeContext()?.selectionElementList.some(item => item.size === 22)).toBe(true)
    command.executeUndo()
    expect(command.getValue().data).toEqual(before)
  })

  it('rejects stale text, ownership, indices and depth without changing context or range', () => {
    ctx = createTestEditor({ data: nested() })
    const command = ctx.editor.command
    command.executeRestoreRange(located('right'))
    const before = command.getValue().data
    const range = command.getRangeContext()
    let changes = 0
    ctx.editor.eventBus.on('rangeChange', () => { changes++ })
    for (const input of [
      { ...located(), sourceText: ZERO + 'changed' },
      { ...located(), endIndex: 999 },
      { ...located(), startIndex: -1 },
      { ...located(), tablePath: [...located().tablePath, ...located().tablePath] },
      { ...located(), tablePath: Array.from({ length: 9 }, () => located().tablePath[0]) },
      located('unknown')
    ]) {
      expect(() => command.executeRestoreRange(input)).toThrow()
      expect(() => command.getLocatedElementRects(input)).toThrow()
      expect(command.getRangeContext()).toEqual(range)
      expect(command.getValue().data).toEqual(before)
    }
    expect(changes).toBe(0)
  })

  it('rejects grapheme boundaries split across formatting elements', () => {
    ctx = createTestEditor({ data: [{ value: 'e', bold: true }, { value: '́', italic: true }] })
    const command = ctx.editor.command
    const input: ILocatedRange = { zone: EditorZone.MAIN, tablePath: [],
      startIndex: 0, endIndex: 1, sourceText: ZERO + 'é' }
    expect(() => command.executeRestoreRange(input)).toThrow(/Unicode/)
    command.executeRestoreRange({ ...input, endIndex: 2 })
    expect(command.getRangeContext()?.selectionText).toContain('é')
  })

  it('switches from a deep cell to an enabled header and back without stale cell context', () => {
    ctx = createTestEditor({ data: { header: [{ value: 'Header' }], main: nested(), footer: [] },
      options: { header: { disabled: false, editable: true } } })
    const command = ctx.editor.command
    command.executeRestoreRange(located())
    command.executeRestoreRange({ zone: EditorZone.HEADER, tablePath: [],
      startIndex: 0, endIndex: 1, sourceText: ZERO + 'Header' })
    expect(command.getRangeContext()?.zone).toBe(EditorZone.HEADER)
    expect(command.getRangeContext()?.isTable).toBe(false)
    command.executeRestoreRange(located('right'))
    expect(command.getRangeContext()?.zone).toBe(EditorZone.MAIN)
    expect(command.getRangeContext()?.tdIndex).toBe(1)
  })
})
