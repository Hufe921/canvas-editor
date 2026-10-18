import { describe, expect, it, vi } from 'vitest'
import { LineNumber } from '@/editor/core/draw/frame/LineNumber'
import { PageNumber } from '@/editor/core/draw/frame/PageNumber'
import { RowFlex } from '@/editor/dataset/enum/Row'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'

function createContext() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(() => {
      throw new Error('Unexpected Canvas text')
    }),
    measureText: vi.fn(() => {
      throw new Error('Unexpected Canvas text')
    })
  } as unknown as CanvasRenderingContext2D
}

function createAdapter(width: number, descent: number) {
  const drawLine = vi.fn()
  return {
    isReady: () => true,
    layoutPlainText: () => ({
      paragraphText: '1',
      lines: [{ width, ascent: 10, descent, glyphs: [] }]
    }),
    getGlyphRenderer: () => ({ drawLine }),
    drawLine
  }
}

describe('RTL line and page number placement', () => {
  it('places line numbers outside the right page margin for RTL rows', () => {
    const ctx = createContext()
    const adapter = createAdapter(10, 8)
    const draw = {
      getOptions: () => ({
        scale: 1,
        defaultDirection: TextDirection.AUTO,
        lineNumber: {
          color: '#000',
          size: 12,
          font: 'sans-serif',
          right: 20,
          type: 'continuity'
        }
      }),
      getLayoutHostAdapter: () => adapter,
      getPageSize: () => ({
        width: 794,
        height: 1123,
        margins: [100, 120, 100, 120]
      }),
      getWidth: () => 794,
      getPosition: () => ({
        getOriginalMainPositionList: () => [
          {
            coordinate: { leftBottom: [120, 140] }
          }
        ]
      }),
      getLayoutPages: () => [
        [
          {
            startIndex: 0,
            rowIndex: 0,
            direction: TextDirection.RTL,
            fragmentPosition: null
          }
        ]
      ],
      getOriginalMainElementList: () => [{ value: 'ن' }]
    } as any

    new LineNumber(draw).render(ctx, 0)

    expect(adapter.drawLine).toHaveBeenCalledWith(
      ctx,
      expect.anything(),
      694,
      132,
      '1'
    )
    expect(ctx.fillText).not.toHaveBeenCalled()
  })

  it('maps LEFT page-number alignment to the physical right in RTL', () => {
    const ctx = createContext()
    const adapter = createAdapter(50, 2)
    const draw = {
      getOptions: () => ({
        scale: 1,
        defaultDirection: TextDirection.AUTO,
        pageNumber: {
          size: 12,
          font: 'sans-serif',
          color: '#000',
          rowFlex: RowFlex.LEFT,
          numberType: 'arabic',
          format: '{pageNo}',
          startPageNo: 1,
          fromPageNo: 0
        }
      }),
      getWidth: () => 794,
      getHeight: () => 1123,
      getPageNumberBottom: () => 60,
      getPageSize: () => ({
        width: 794,
        height: 1123,
        margins: [100, 120, 100, 120]
      }),
      getMargins: () => [100, 120, 100, 120],
      getPageCount: () => 3,
      getLayoutPages: () => [[{ direction: TextDirection.RTL }]],
      getOriginalMainElementList: () => [
        { value: 'ن', direction: TextDirection.RTL }
      ],
      getLayoutHostAdapter: () => adapter
    } as any

    new PageNumber(draw).render(ctx, 0)

    expect(adapter.drawLine).toHaveBeenCalledWith(
      ctx,
      expect.anything(),
      624,
      1063,
      '1'
    )
    expect(ctx.fillText).not.toHaveBeenCalled()
  })
})
