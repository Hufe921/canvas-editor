import { describe, expect, it } from 'vitest'
import { Position } from '@/editor/core/position/Position'
import type { Draw } from '@/editor/core/draw/Draw'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'
import type { IRow, IRowElement } from '@/editor/interface/Row'

function createElement(value: string): IRowElement {
  return {
    value,
    style: '16px sans-serif',
    metrics: {
      width: 10,
      height: 16,
      boundingBoxAscent: 12,
      boundingBoxDescent: 4
    }
  }
}

describe('Position direction', () => {
  it('auto 解析的 LTR 行仍为 RTL 片段计算视觉坐标', () => {
    const draw = {
      getEventBus: () => ({}),
      getOptions: () => ({ scale: 1, table: { tdPadding: [0, 0, 0, 0] } }),
      getTraceParticle: () => ({ isTraceHidden: () => false }),
      getColumnLayout: () => null
    } as unknown as Draw
    const row: IRow = {
      width: 40,
      height: 20,
      ascent: 16,
      startIndex: 0,
      rowIndex: 0,
      direction: TextDirection.LTR,
      elementList: ['a', 'ب', 'ج', 'd'].map(createElement)
    }
    const position = new Position(draw)

    const positionList = position.computeRowPosition({ row, innerWidth: 40 })

    expect(positionList.map(item => item.bidiLevel)).toEqual([0, 1, 1, 0])
    expect(positionList.map(item => item.coordinate.leftTop[0])).toEqual([
      0, 20, 10, 30
    ])
    expect(positionList.map(item => item.index)).toEqual([0, 1, 2, 3])
  })

  it('默认 LTR 行不生成 BiDi 数据', () => {
    const draw = {
      getEventBus: () => ({}),
      getOptions: () => ({ scale: 1, table: { tdPadding: [0, 0, 0, 0] } }),
      getTraceParticle: () => ({ isTraceHidden: () => false }),
      getColumnLayout: () => null
    } as unknown as Draw
    const row: IRow = {
      width: 20,
      height: 20,
      ascent: 16,
      startIndex: 0,
      rowIndex: 0,
      elementList: ['a', 'b'].map(createElement)
    }
    const position = new Position(draw)

    const positionList = position.computeRowPosition({ row, innerWidth: 20 })

    expect(positionList.map(item => item.bidiLevel)).toEqual([
      undefined,
      undefined
    ])
    expect(positionList.map(item => item.coordinate.leftTop[0])).toEqual([0, 10])
  })

  it('RTL 右对齐为列表标记预留右侧空间', () => {
    const draw = {
      getEventBus: () => ({}),
      getOptions: () => ({ scale: 1, table: { tdPadding: [0, 0, 0, 0] } }),
      getTraceParticle: () => ({ isTraceHidden: () => false }),
      getColumnLayout: () => null
    } as unknown as Draw
    const zero = createElement('\n')
    zero.metrics.width = 0
    const row: IRow = {
      width: 20,
      height: 20,
      ascent: 16,
      startIndex: 0,
      rowIndex: 0,
      direction: TextDirection.RTL,
      offsetX: 30,
      elementList: [zero, ...['ب', 'ج'].map(createElement)]
    }
    const position = new Position(draw)

    const positionList = position.computeRowPosition({ row, innerWidth: 100 })

    expect(positionList[0].coordinate.leftTop[0]).toBe(70)
    expect(positionList[1].coordinate.leftTop[0]).toBe(60)
    expect(positionList[2].coordinate.leftTop[0]).toBe(50)
  })
})

describe('RTL 行对齐', () => {
  it.each([
    ['start', 90],
    ['end', 10],
    ['center', 50]
  ] as const)('%s 对齐按书写方向计算起点', (rowFlex, expectedX) => {
    const draw = {
      getEventBus: () => ({}),
      getOptions: () => ({ scale: 1, table: { tdPadding: [0, 0, 0, 0] } }),
      getTraceParticle: () => ({ isTraceHidden: () => false }),
      getColumnLayout: () => null
    } as unknown as Draw
    const row: IRow = {
      width: 20,
      height: 20,
      ascent: 16,
      startIndex: 0,
      rowIndex: 0,
      direction: TextDirection.RTL,
      rowFlex: rowFlex as IRow['rowFlex'],
      elementList: ['ب', 'ج'].map(createElement)
    }
    const position = new Position(draw)

    const positionList = position.computeRowPosition({ row, innerWidth: 100 })

    expect(positionList[0].coordinate.leftTop[0]).toBe(expectedX)
  })
})
