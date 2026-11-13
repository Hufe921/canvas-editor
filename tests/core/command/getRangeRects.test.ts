import { afterEach, describe, expect, it } from 'vitest'
import { EditorZone } from '@/editor/dataset/enum/Editor'
import { ElementType } from '@/editor/dataset/enum/Element'
import type { IRange } from '@/editor/interface/Range'
import { createTestEditor, TestEditorContext } from '../../factories/editor'

function createTable(id = 'table-1') {
  return {
    id,
    type: ElementType.TABLE,
    value: '',
    colgroup: [{ width: 200 }, { width: 200 }],
    trList: [
      {
        height: 60,
        tdList: [
          { colspan: 1, rowspan: 1, value: [{ value: 'ab\ncd' }] },
          { colspan: 1, rowspan: 1, value: [{ value: 'ef' }] }
        ]
      }
    ]
  }
}

describe('getRangeRects', () => {
  let ctx: TestEditorContext
  afterEach(() => ctx?.destroy())

  it('查询指定跨行选区且不改变当前选区', () => {
    ctx = createTestEditor({ data: [{ value: 'ab\ncd\ne' }] })
    const targetRange: IRange = { startIndex: 0, endIndex: 4 }
    ctx.editor.command.executeSetRange(
      targetRange.startIndex,
      targetRange.endIndex
    )
    const expected = ctx.editor.command.getRangeContext()!.rangeRects
    expect(expected.length).toBeGreaterThan(1)

    ctx.editor.command.executeSetRange(5, 5)
    const actual = ctx.editor.command.getRangeRects(targetRange)
    expect(actual).toEqual(expected)
    expect(ctx.editor.command.getRange()).toMatchObject({
      startIndex: 5,
      endIndex: 5
    })

    actual[0].x += 1
    expect(ctx.editor.command.getRangeRects(targetRange)).toEqual(expected)
  })

  it('折叠选区返回与当前光标一致的零宽矩形', () => {
    ctx = createTestEditor({ data: [{ value: 'abc' }] })
    ctx.editor.command.executeSetRange(1, 1)
    const expected = ctx.editor.command.getRangeContext()!.rangeRects

    ctx.editor.command.executeSetRange(0, 0)
    expect(
      ctx.editor.command.getRangeRects({ startIndex: 1, endIndex: 1 })
    ).toEqual(expected)
    expect(expected).toHaveLength(1)
    expect(expected[0].width).toBe(0)
    expect(expected[0].height).toBeGreaterThan(0)
  })

  it('支持文档起点的光标和选区', () => {
    ctx = createTestEditor({ data: [{ value: 'abc' }] })
    const caretRects = ctx.editor.command.getRangeRects({
      startIndex: -1,
      endIndex: -1
    })
    const selectionRects = ctx.editor.command.getRangeRects({
      startIndex: -1,
      endIndex: 0
    })

    expect(caretRects).toHaveLength(1)
    expect(caretRects[0].width).toBe(0)
    expect(selectionRects).toHaveLength(1)
    expect(selectionRects[0].width).toBeGreaterThan(0)
    expect(selectionRects[0].x).toBe(caretRects[0].x)
    expect(selectionRects[0].y).toBe(caretRects[0].y)
  })

  it('跨页选区包含对应页面偏移', () => {
    ctx = createTestEditor({
      data: [
        { value: '第一页' },
        { type: ElementType.PAGE_BREAK, value: '\n' },
        { value: '第二页' }
      ]
    })
    const targetRange: IRange = { startIndex: 0, endIndex: 6 }
    ctx.editor.command.executeSetRange(
      targetRange.startIndex,
      targetRange.endIndex
    )
    const expected = ctx.editor.command.getRangeContext()!.rangeRects
    expect(expected.length).toBeGreaterThan(1)
    expect(new Set(expected.map(rect => rect.y)).size).toBeGreaterThan(1)

    ctx.editor.command.executeSetRange(0, 0)
    expect(ctx.editor.command.getRangeRects(targetRange)).toEqual(expected)
  })

  it('表格单元格内选区使用单元格位置列表', () => {
    ctx = createTestEditor({ data: [createTable(), { value: '\n' }] })
    const targetRange: IRange = {
      startIndex: 0,
      endIndex: 3,
      tableId: 'table-1',
      startTrIndex: 0,
      endTrIndex: 0,
      startTdIndex: 0,
      endTdIndex: 0,
      zone: EditorZone.MAIN
    }
    ctx.editor.command.executeSetPositionContext(targetRange)
    ctx.editor.command.executeSetRange(0, 3, 'table-1', 0, 0, 0, 0)
    const expected = ctx.editor.command.getRangeContext()!.rangeRects
    expect(expected.length).toBeGreaterThan(1)

    ctx.editor.command.executeSetPositionContext({
      startIndex: 0,
      endIndex: 0,
      zone: EditorZone.MAIN
    })
    ctx.editor.command.executeSetRange(0, 0)
    expect(ctx.editor.command.getRangeRects(targetRange)).toEqual(expected)
    expect(ctx.editor.command.getRangeContext()!.isTable).toBe(false)
    expect(ctx.editor.command.getRange()).toMatchObject({
      startIndex: 0,
      endIndex: 0,
      zone: EditorZone.MAIN
    })
    expect(
      ctx.editor.command.getRangeRects({
        ...targetRange,
        endTdIndex: 1,
        isCrossRowCol: true
      })
    ).toEqual([])
  })

  for (const zone of [EditorZone.HEADER, EditorZone.FOOTER]) {
    it(`${zone}选区使用对应区域的位置列表`, () => {
      ctx = createTestEditor({
        data: {
          header: [{ value: 'ab\ncd' }],
          main: [{ value: 'main' }],
          footer: [{ value: 'ef\ngh' }]
        }
      })
      const targetRange: IRange = { startIndex: 0, endIndex: 3, zone }
      ctx.editor.command.executeSetZone(zone)
      ctx.editor.command.executeSetRange(0, 3)
      const expected = ctx.editor.command.getRangeContext()!.rangeRects
      expect(expected.length).toBeGreaterThan(1)

      ctx.editor.command.executeSetZone(EditorZone.MAIN)
      ctx.editor.command.executeSetRange(0, 0)
      expect(ctx.editor.command.getRangeRects(targetRange)).toEqual(expected)
      expect(ctx.editor.command.getRange()).toMatchObject({
        startIndex: 0,
        endIndex: 0,
        zone: EditorZone.MAIN
      })
    })
  }

  it('支持嵌套表格单元格', () => {
    const innerTable = createTable('inner-table')
    const outerTable: any = createTable('outer-table')
    outerTable.trList[0].tdList[0].value = [innerTable]
    ctx = createTestEditor({ data: [outerTable, { value: '\n' }] })
    const rects = ctx.editor.command.getRangeRects({
      startIndex: 0,
      endIndex: 1,
      tableId: 'inner-table',
      startTrIndex: 0,
      endTrIndex: 0,
      startTdIndex: 0,
      endTdIndex: 0,
      zone: EditorZone.MAIN
    })
    expect(rects).toHaveLength(1)
    expect(rects[0].width).toBeGreaterThan(0)
  })

  it('非法范围返回空数组', () => {
    ctx = createTestEditor({ data: [{ value: 'abc' }] })
    const invalidRangeList: IRange[] = [
      { startIndex: -2, endIndex: -2 },
      { startIndex: 2, endIndex: 1 },
      { startIndex: 0, endIndex: 99 }
    ]
    for (const range of invalidRangeList) {
      expect(ctx.editor.command.getRangeRects(range)).toEqual([])
    }
  })
})
