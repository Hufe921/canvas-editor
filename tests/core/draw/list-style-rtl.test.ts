import { describe, expect, it, vi } from 'vitest'
import { ZERO } from '../../../src/editor/dataset/constant/Common'
import { ListStyle, ListType } from '../../../src/editor'
import { ListParticle } from '../../../src/editor/core/draw/particle/ListParticle'
import type { IRow, IRowElement } from '../../../src/editor/interface/Row'
import type { DeepRequired } from '../../../src/editor/interface/Common'
import type { IEditorOption } from '../../../src/editor/interface/Editor'

function mockDraw() {
  const options = {
    scale: 1,
    defaultTabWidth: 4,
    defaultFont: 'sans-serif',
    defaultSize: 16,
    checkbox: { width: 14, height: 14, gap: 5 },
    list: { inheritStyle: false }
  } as unknown as DeepRequired<IEditorOption>
  return {
    getOptions: () => options,
    getRange: () => ({}),
    getCheckboxParticle: () => ({ render: vi.fn() })
  } as any
}

function makeCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    font: '',
    direction: 'ltr',
    textAlign: 'left',
    measureText: vi.fn(() => ({ width: 12 })),
    fillText: vi.fn()
  } as unknown as CanvasRenderingContext2D
}

function makeRow(direction: 'ltr' | 'rtl', listType: ListType): IRow {
  return {
    direction,
    offsetX: direction === 'rtl' ? 0 : 24,
    listIndex: 0,
    ascent: 12,
    width: 200,
    isList: true,
    startIndex: 0,
    rowIndex: 0,
    height: 20,
    elementList: [
      {
        value: ZERO,
        listId: 'L1',
        listType,
        listStyle: ListStyle.DECIMAL,
        metrics: {
          width: 0,
          height: 16,
          boundingBoxAscent: 12,
          boundingBoxDescent: 4
        }
      } as IRowElement
    ]
  }
}

describe('ListParticle RTL style direction', () => {
  it('ordered marker uses rtl direction and right-aligns in right gutter', () => {
    const particle = new ListParticle(mockDraw())
    const ctx = makeCtx()

    // listStyleWidth = ceil((12 + LIST_GAP 10)) = 22
    particle.drawListStyle(ctx, makeRow('rtl', ListType.OL), {
      coordinate: { leftTop: [648, 100] }
    } as any)

    expect(ctx.direction).toBe('rtl')
    expect(ctx.textAlign).toBe('right')
    // 右对齐：标记右缘在内容右缘 + gutter 宽（22），间距落在标记左侧
    expect(ctx.fillText).toHaveBeenCalledWith('1.', 648 + 22, 112)
  })

  it('ordered marker keeps ltr direction and left-aligns for ltr rows', () => {
    const particle = new ListParticle(mockDraw())
    const ctx = makeCtx()

    particle.drawListStyle(ctx, makeRow('ltr', ListType.OL), {
      coordinate: { leftTop: [120, 100] }
    } as any)

    expect(ctx.direction).toBe('ltr')
    expect(ctx.textAlign).toBe('left')
    expect(ctx.fillText).toHaveBeenCalledWith('1.', 120 - 24, 112)
  })
})
