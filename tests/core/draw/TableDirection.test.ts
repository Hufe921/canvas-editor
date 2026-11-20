import { describe, expect, it, vi } from 'vitest'
import { TableParticle } from '@/editor/core/draw/particle/table/TableParticle'
import type { IRenderContext } from '@/editor/core/render/model/RenderContext'
import type { Draw } from '@/editor/core/draw/Draw'
import { ElementType } from '@/editor/dataset/enum/Element'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'
import type { IElement } from '@/editor/interface/Element'

function createTable(direction?: TextDirection): IElement {
  return {
    type: ElementType.TABLE,
    value: '\n',
    direction,
    colgroup: [{ width: 100 }, { width: 160 }, { width: 80 }],
    trList: [
      {
        height: 40,
        tdList: [
          { colspan: 1, rowspan: 1, value: [{ value: 'A' }] },
          { colspan: 2, rowspan: 1, value: [{ value: 'B' }] }
        ]
      }
    ]
  }
}

function createParticle(defaultDirection = TextDirection.LTR) {
  const draw = {
    getOptions: () => ({
      defaultDirection,
      scale: 1,
      rangeAlpha: 0.3,
      rangeColor: '#000'
    }),
    getRange: () => ({})
  } as unknown as Draw
  return new TableParticle(draw)
}

describe('表格 RTL 物理镜像', () => {
  it('LTR 保持原单元格坐标', () => {
    const table = createTable()
    createParticle().computeRowColInfo(table)
    const [first, second] = table.trList![0].tdList
    expect([first.x, second.x]).toEqual([0, 100])
    expect([first.width, second.width]).toEqual([100, 240])
  })

  it('RTL 只反转物理坐标，不改变逻辑列和合并跨度', () => {
    const table = createTable(TextDirection.RTL)
    createParticle().computeRowColInfo(table)
    const [first, second] = table.trList![0].tdList
    expect([first.x, second.x]).toEqual([240, 0])
    expect([first.colIndex, second.colIndex]).toEqual([0, 1])
    expect([first.colspan, second.colspan]).toEqual([1, 2])
  })

  it('文档默认方向可驱动表格镜像', () => {
    const table = createTable()
    createParticle(TextDirection.RTL).computeRowColInfo(table)
    expect(table.trList![0].tdList[0].x).toBe(240)
  })

  it('RTL 跨列选区按逻辑列覆盖单元格', () => {
    const table = createTable(TextDirection.RTL)
    table.id = 'table'
    const particle = createParticle()
    particle.computeRowColInfo(table)
    ;(particle as any).range = {
      getRange: () => ({
        isCrossRowCol: true,
        tableId: table.id,
        startTdIndex: 0,
        endTdIndex: 1,
        startTrIndex: 0,
        endTrIndex: 0
      })
    }
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn()
    } as unknown as IRenderContext
    particle.drawRange(ctx, table, 0, 0)
    expect(ctx.fillRect).toHaveBeenCalledTimes(2)
    expect(ctx.fillRect).toHaveBeenCalledWith(240, 0, 100, 40)
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 240, 40)
  })
})
