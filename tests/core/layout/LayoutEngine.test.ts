import { describe, expect, it, vi } from 'vitest'
import { LayoutEngine } from '@/editor/core/layout/LayoutEngine'
import { ElementType } from '@/editor/dataset/enum/Element'
import { PageMode, PaperDirection } from '@/editor/dataset/enum/Editor'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'
import type { IRow } from '@/editor/interface/Row'
import type { Draw } from '@/editor/core/draw/Draw'

function createRow(
  height: number,
  startIndex: number,
  overrides: Partial<IRow> = {}
): IRow {
  return {
    width: 100,
    height,
    ascent: height,
    startIndex,
    rowIndex: startIndex,
    elementList: [],
    ...overrides
  }
}

function createDraw(overrides: Record<string, unknown> = {}): Draw {
  return {
    getHeight: () => 150,
    getMainOuterHeight: () => 10,
    isMainElementList: () => false,
    getFootnote: () => ({
      isReferenceExist: () => false,
      getReservedHeight: () => 0,
      getRowHeight: () => 0,
      getSeparatorHeight: () => 0,
      getMaxPageHeight: () => 0
    }),
    getTablePaging: () => ({ truncateTableByFragment: () => false }),
    ...overrides
  } as unknown as Draw
}

function createRowLayoutDraw(): Draw {
  const textMetrics = {
    width: 10,
    actualBoundingBoxAscent: 8,
    actualBoundingBoxDescent: 2,
    actualBoundingBoxLeft: 0,
    actualBoundingBoxRight: 10,
    fontBoundingBoxAscent: 8,
    fontBoundingBoxDescent: 2
  }
  return createDraw({
    getListParticle: () => ({
      computeListStyle: () => new Map<string, number>()
    }),
    getTextParticle: () => ({
      measureText: () => textMetrics,
      measureBasisWord: () => textMetrics,
      getBasisWordBoundingBoxAscent: () => 8,
      measureWord: () => ({ width: 0, endElement: null }),
      measurePunctuationWidth: () => 0,
      clearNativeTextShaperCache: () => undefined
    }),
    getOptions: () => ({
      defaultSize: 16,
      scale: 1,
      imgCaption: { size: 12, top: 0 },
      table: {
        tdPadding: [0, 0, 0, 0],
        defaultColMinWidth: 40,
        overflow: false
      },
      defaultTabWidth: 16,
      paperDirection: PaperDirection.VERTICAL,
      incrementalCompute: false,
      wordBreak: 0
    }),
    getElementFont: () => '16px sans-serif',
    getElementRowMargin: () => 0,
    getDefaultBasicRowMarginHeight: () => 0,
    getMargins: () => [0, 0, 0, 0],
    isDesignMode: () => false,
    isAreaHideDisabled: () => false,
    isWordLike: () => false,
    getTraceParticle: () => ({ isTraceHidden: () => false }),
    getPosition: () => ({
      setSurroundPosition: (payload: { rowElementRect: { x: number } }) => ({
        x: payload.rowElementRect.x,
        rowIncreaseWidth: 0
      })
    }),
    getArea: () => ({ applyMinHeight: () => undefined })
  })
}

describe('LayoutEngine', () => {
  it('按页高和行偏移拆分行列表', () => {
    const rowList = [
      createRow(60, 0),
      createRow(50, 1, { offsetY: 10 }),
      createRow(40, 2)
    ]
    const engine = new LayoutEngine(createDraw())

    const result = engine.computePageList({
      rowList,
      elementList: [],
      pageMode: PageMode.PAGING,
      paperDirection: PaperDirection.VERTICAL
    })

    expect(result.pageRowList).toEqual([[rowList[0], rowList[1]], [rowList[2]]])
    expect(result.pageDirectionList).toEqual([
      PaperDirection.VERTICAL,
      PaperDirection.VERTICAL
    ])
    expect(result.isElementListTruncated).toBe(false)
  })

  it('连续页保留单页行列表且不计算分页高度', () => {
    const rowList = [createRow(100, 0), createRow(200, 1)]
    const draw = createDraw({
      getHeight: () => {
        throw new Error('连续页不应读取分页高度')
      },
      getMainOuterHeight: () => {
        throw new Error('连续页不应读取页外占位高度')
      }
    })
    const engine = new LayoutEngine(draw)

    const result = engine.computePageList({
      rowList,
      elementList: [],
      pageMode: PageMode.CONTINUITY,
      paperDirection: PaperDirection.HORIZONTAL
    })

    expect(result.pageRowList).toEqual([rowList])
    expect(result.pageDirectionList).toEqual([PaperDirection.HORIZONTAL])
  })

  it('maxPageNo 截断后续元素并保留截断标记', () => {
    const rowList = [createRow(100, 0), createRow(100, 1), createRow(20, 2)]
    const elementList = [{ value: 'a' }, { value: 'b' }, { value: 'c' }]
    const engine = new LayoutEngine(createDraw())

    const result = engine.computePageList({
      rowList,
      elementList,
      pageMode: PageMode.PAGING,
      paperDirection: PaperDirection.VERTICAL,
      maxPageNo: 0
    })

    expect(result.pageRowList).toEqual([[rowList[0]]])
    expect(result.elementList).toEqual([elementList[0]])
    expect(result.isElementListTruncated).toBe(true)
  })

  it('区域补高填满当前页并将剩余高度结转到下一行', () => {
    const rowList = [
      createRow(100, 0),
      createRow(100, 1, {
        areaPadding: { areaId: 'area-1', height: 60 }
      }),
      createRow(50, 2, { offsetY: 10 })
    ]
    const engine = new LayoutEngine(
      createDraw({
        getHeight: () => 200,
        getMainOuterHeight: () => 20
      })
    )

    const result = engine.computePageList({
      rowList,
      elementList: [],
      pageMode: PageMode.PAGING,
      paperDirection: PaperDirection.VERTICAL
    })

    expect(rowList[1].height).toBe(80)
    expect(rowList[1].areaPadding).toEqual({
      areaId: 'area-1',
      height: 40
    })
    expect(rowList[2].offsetY).toBe(30)
    expect(rowList[2].areaPaddingCarry).toEqual({
      areaId: 'area-1',
      height: 20
    })
    expect(result.pageRowList).toEqual([[rowList[0], rowList[1]], [rowList[2]]])
  })

  it('分页符后的页面应用新纸张方向', () => {
    const rowList = [createRow(20, 0, { isPageBreak: true }), createRow(20, 1)]
    rowList[0].paperDirection = PaperDirection.HORIZONTAL
    const engine = new LayoutEngine(createDraw())

    const result = engine.computePageList({
      rowList,
      elementList: [],
      pageMode: PageMode.PAGING,
      paperDirection: PaperDirection.VERTICAL
    })

    expect(result.pageRowList).toEqual([[rowList[0]], [rowList[1]]])
    expect(result.pageDirectionList).toEqual([
      PaperDirection.VERTICAL,
      PaperDirection.HORIZONTAL
    ])
  })

  it('按可用宽度对简单文本断行', () => {
    const engine = new LayoutEngine(createRowLayoutDraw())

    const rowList = engine.computeRowList({
      innerWidth: 20,
      elementList: [{ value: 'a' }, { value: 'b' }, { value: 'c' }]
    })

    expect(rowList).toHaveLength(2)
    expect(rowList.map(row => row.width)).toEqual([20, 10])
    expect(
      rowList.map(row => row.elementList.map(element => element.value).join(''))
    ).toEqual(['ab', 'c'])
  })

  it('默认 LTR 仅使用原测量路径', () => {
    const draw = createRowLayoutDraw()
    const particle = draw.getTextParticle()
    const measureText = vi.fn(particle.measureText)
    const measureTextInContext = vi.fn()
    draw.getTextParticle = () =>
      Object.assign(particle, {
        measureText,
        measureTextInContext
      })
    const engine = new LayoutEngine(draw)

    engine.computeRowList({
      innerWidth: 100,
      elementList: [{ value: 'a' }, { value: 'b' }, { value: 'c' }]
    })

    expect(measureText).toHaveBeenCalledTimes(3)
    expect(measureTextInContext).not.toHaveBeenCalled()
  })

  it('RTL 文本使用上下文测量并标记行方向', () => {
    const draw = createRowLayoutDraw()
    const particle = draw.getTextParticle()
    const measureText = vi.fn(particle.measureText)
    const measureTextInContext = vi.fn(() => 12)
    draw.getTextParticle = () =>
      Object.assign(particle, {
        measureText,
        measureTextInContext
      })
    const engine = new LayoutEngine(draw)

    const rowList = engine.computeRowList({
      innerWidth: 100,
      elementList: [
        { value: 'ا', direction: TextDirection.RTL },
        { value: 'ب', direction: TextDirection.RTL }
      ]
    })

    expect(rowList).toHaveLength(1)
    expect(rowList[0].width).toBe(24)
    expect(rowList[0].direction).toBe(TextDirection.RTL)
    expect(measureTextInContext).toHaveBeenCalledTimes(2)
    expect(measureText).not.toHaveBeenCalled()
  })

  it('auto 的 LTR 段落保留方向以支持后续 RTL 混排', () => {
    const draw = createRowLayoutDraw()
    const particle = draw.getTextParticle()
    const measureTextInContext = vi.fn(() => 10)
    draw.getTextParticle = () =>
      Object.assign(particle, { measureTextInContext })
    const engine = new LayoutEngine(draw)

    const rowList = engine.computeRowList({
      innerWidth: 100,
      elementList: [
        { value: 'a', direction: TextDirection.AUTO },
        { value: 'ب', direction: TextDirection.AUTO }
      ]
    })

    expect(rowList[0].direction).toBe(TextDirection.LTR)
    expect(measureTextInContext).toHaveBeenCalledTimes(2)
  })

  it('旋转图片按外接框尺寸参与文档排版', () => {
    const element = {
      type: ElementType.IMAGE,
      value: 'data:image/png;base64,',
      width: 89,
      height: 32,
      imgRotation: 90
    }
    const engine = new LayoutEngine(createRowLayoutDraw())

    const rowList = engine.computeRowList({
      innerWidth: 500,
      elementList: [element]
    })

    expect(rowList).toHaveLength(1)
    expect(rowList[0].width).toBeCloseTo(32)
    expect(rowList[0].height).toBeCloseTo(89)
    expect(rowList[0].elementList[0].metrics.width).toBeCloseTo(32)
    expect(rowList[0].elementList[0].metrics.height).toBeCloseTo(89)
    expect(element.width).toBe(89)
    expect(element.height).toBe(32)
  })
})
