import { describe, expect, it, vi } from 'vitest'
import { LineNumber } from '@/editor/core/draw/frame/LineNumber'
import { PageNumber } from '@/editor/core/draw/frame/PageNumber'
import { RowFlex } from '@/editor/dataset/enum/Row'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'

function createContext() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({
      width: 50,
      actualBoundingBoxAscent: 10
    }))
  } as unknown as CanvasRenderingContext2D
}

describe('RTL line and page number placement', () => {
  it('places line numbers outside the right page margin for RTL rows', () => {
    const ctx = createContext()
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
      getTextParticle: () => ({
        measureText: () => ({ width: 10, actualBoundingBoxAscent: 8 })
      }),
      getMargins: () => [100, 120, 100, 120],
      getWidth: () => 794,
      getPosition: () => ({
        getOriginalMainPositionList: () => [
          {
            coordinate: { leftBottom: [120, 140] }
          }
        ]
      }),
      getPageRowList: () => [
        [{
          startIndex: 0,
          rowIndex: 0,
          direction: TextDirection.RTL,
          fragmentPosition: null
        }]
      ],
      getOriginalMainElementList: () => [{ value: 'ن' }]
    } as any

    new LineNumber(draw).render(ctx, 0)

    expect(ctx.fillText).toHaveBeenCalledWith('1', 694, 132)
  })

  it('maps LEFT page-number alignment to the physical right in RTL', () => {
    const ctx = createContext()
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
      getMargins: () => [100, 120, 100, 120],
      getPageCount: () => 3,
      getPageRowList: () => [[{ direction: TextDirection.RTL }]],
      getOriginalMainElementList: () => [{ value: 'ن', direction: TextDirection.RTL }],
      getLayoutHostAdapter: () => ({ isReady: () => false })
    } as any

    new PageNumber(draw).render(ctx, 0)

    expect(ctx.fillText).toHaveBeenCalledWith('1', 624, 1063)
  })
})
