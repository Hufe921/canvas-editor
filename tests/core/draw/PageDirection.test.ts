import { describe, expect, it, vi } from 'vitest'
import { LineNumber } from '@/editor/core/draw/frame/LineNumber'
import { PageNumber } from '@/editor/core/draw/frame/PageNumber'
import type { Draw } from '@/editor/core/draw/Draw'
import type { IRenderContext } from '@/editor/core/render/model/RenderContext'
import { NumberType } from '@/editor/dataset/enum/Common'
import { LineNumberType } from '@/editor/dataset/enum/LineNumber'
import { RowFlex } from '@/editor/dataset/enum/Row'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'

function createContext() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn()
  } as unknown as IRenderContext
}

function renderLineNumber(direction: TextDirection) {
  const ctx = createContext()
  const draw = {
    getOptions: () => ({
      scale: 1,
      defaultDirection: direction,
      lineNumber: {
        color: '#000',
        size: 16,
        font: 'Arial',
        right: 10,
        type: LineNumberType.PAGE
      }
    }),
    getPageSize: () => ({ width: 800, margins: [50, 60, 50, 100] }),
    getPosition: () => ({
      getOriginalMainPositionList: () => [
        { coordinate: { leftBottom: [100, 100] } }
      ]
    }),
    getPageRowList: () => [[{ startIndex: 0, rowIndex: 0 }]],
    getTextMeasurer: () => ({
      measure: () => ({ width: 20, actualBoundingBoxAscent: 12 })
    })
  } as unknown as Draw
  new LineNumber(draw).render(ctx, 0)
  return ctx
}

function renderPageNumber(direction: TextDirection, rowFlex: RowFlex) {
  const ctx = createContext()
  const draw = {
    getOptions: () => ({
      scale: 1,
      defaultDirection: direction,
      pageNumber: {
        size: 16,
        font: 'Arial',
        color: '#000',
        rowFlex,
        numberType: NumberType.ARABIC,
        format: '{pageNo}',
        startPageNo: 1,
        fromPageNo: 0
      }
    }),
    getPageSize: () => ({
      width: 800,
      height: 1000,
      margins: [50, 60, 50, 100]
    }),
    getPageNumberBottom: () => 30,
    getTextMeasurer: () => ({ measureText: () => ({ width: 20 }) })
  } as unknown as Draw
  new PageNumber(draw).render(ctx, 0)
  return ctx
}

describe('RTL 页面附属结构镜像', () => {
  it('行号只切换物理侧，LTR 坐标保持不变', () => {
    expect(renderLineNumber(TextDirection.LTR).fillText).toHaveBeenCalledWith(
      '1',
      70,
      88
    )
    expect(renderLineNumber(TextDirection.RTL).fillText).toHaveBeenCalledWith(
      '1',
      750,
      88
    )
  })

  it('页码左右对齐随页面方向交换，居中不变', () => {
    expect(
      renderPageNumber(TextDirection.LTR, RowFlex.LEFT).fillText
    ).toHaveBeenCalledWith('1', 100, 970)
    expect(
      renderPageNumber(TextDirection.RTL, RowFlex.LEFT).fillText
    ).toHaveBeenCalledWith('1', 720, 970)
    expect(
      renderPageNumber(TextDirection.RTL, RowFlex.RIGHT).fillText
    ).toHaveBeenCalledWith('1', 100, 970)
    expect(
      renderPageNumber(TextDirection.RTL, RowFlex.CENTER).fillText
    ).toHaveBeenCalledWith('1', 390, 970)
  })
})
