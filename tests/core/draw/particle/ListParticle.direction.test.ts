import { describe, expect, it, vi } from 'vitest'
import { ZERO } from '@/editor/dataset/constant/Common'
import { ListParticle } from '@/editor/core/draw/particle/ListParticle'
import type { Draw } from '@/editor/core/draw/Draw'
import { ListStyle, ListType } from '@/editor/dataset/enum/List'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'
import type { IElementPosition } from '@/editor/interface/Element'
import type { IRow, IRowElement } from '@/editor/interface/Row'
import type { IRenderContext } from '@/editor/core/render/model/RenderContext'

function createRow(direction?: TextDirection): IRow {
  const element: IRowElement = {
    value: ZERO,
    style: '16px sans-serif',
    listType: ListType.OL,
    listStyle: ListStyle.DECIMAL,
    metrics: {
      width: 0,
      height: 16,
      boundingBoxAscent: 12,
      boundingBoxDescent: 4
    }
  }
  return {
    width: 20,
    height: 20,
    ascent: 16,
    startIndex: 0,
    rowIndex: 0,
    isList: true,
    listIndex: 0,
    offsetX: 30,
    direction: direction === TextDirection.AUTO ? undefined : direction,
    elementList: [element]
  }
}

function createPosition(x: number): IElementPosition {
  return {
    index: 0,
    value: ZERO,
    pageNo: 0,
    rowNo: 0,
    rowIndex: 0,
    ascent: 16,
    lineHeight: 20,
    left: 0,
    metrics: {
      width: 0,
      height: 16,
      boundingBoxAscent: 12,
      boundingBoxDescent: 4
    },
    isFirstLetter: true,
    isLastLetter: false,
    coordinate: {
      leftTop: [x, 0],
      rightTop: [x, 0],
      leftBottom: [x, 20],
      rightBottom: [x, 20]
    }
  }
}

function createParticle() {
  const draw = {
    getRange: () => ({}),
    getOptions: () => ({
      scale: 1,
      defaultTabWidth: 32,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      list: { inheritStyle: false },
      checkbox: { width: 14, height: 14, gap: 2 }
    })
  } as unknown as Draw
  return new ListParticle(draw)
}

describe('ListParticle direction', () => {
  it('RTL 数字列表标记位于右侧预留区并使用行方向', () => {
    const ctx = {
      direction: 'ltr' as CanvasDirection,
      save: vi.fn(),
      restore: vi.fn(),
      fillText: vi.fn()
    } as unknown as IRenderContext

    createParticle().drawListStyle(
      ctx,
      createRow(TextDirection.RTL),
      createPosition(70)
    )

    expect(ctx.fillText).toHaveBeenCalledWith('1.', 100, 16)
    expect(ctx.direction).toBe(TextDirection.RTL)
  })

  it('LTR 列表标记坐标保持原计算方式', () => {
    const ctx = {
      direction: 'ltr' as CanvasDirection,
      save: vi.fn(),
      restore: vi.fn(),
      fillText: vi.fn()
    } as unknown as IRenderContext

    createParticle().drawListStyle(ctx, createRow(), createPosition(70))

    expect(ctx.fillText).toHaveBeenCalledWith('1.', 40, 16)
    expect(ctx.direction).toBe(TextDirection.LTR)
  })
})
