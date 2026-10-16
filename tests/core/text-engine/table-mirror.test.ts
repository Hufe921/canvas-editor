import { describe, expect, it } from 'vitest'
import { TextDirection } from '../../../src/editor/dataset/enum/TextDirection'
import { ElementType } from '../../../src/editor/dataset/enum/Element'
import { TableParticle } from '../../../src/editor/core/draw/particle/table/TableParticle'
import type { IElement } from '../../../src/editor/interface/Element'
import type { DeepRequired } from '../../../src/editor/interface/Common'
import type { IEditorOption } from '../../../src/editor/interface/Editor'

function mockDraw(direction: 'ltr' | 'rtl') {
  const options = {
    direction,
    scale: 1,
    table: { defaultBorderColor: '#000' }
  } as unknown as DeepRequired<IEditorOption>
  return {
    getOptions: () => options,
    getRange: () => ({}),
    options
  } as any
}

describe('DEFER-002 table column mirror', () => {
  it('mirrors when element.direction is rtl (UI alone is not enough)', () => {
    const draw = mockDraw(TextDirection.LTR)
    const particle = new TableParticle(draw)
    const element: IElement = {
      type: ElementType.TABLE,
      value: '',
      direction: TextDirection.RTL,
      width: 300,
      height: 40,
      colgroup: [{ width: 100 }, { width: 100 }, { width: 100 }],
      trList: [
        {
          height: 40,
          tdList: [
            { rowspan: 1, colspan: 1, value: [] },
            { rowspan: 1, colspan: 1, value: [] },
            { rowspan: 1, colspan: 1, value: [] }
          ]
        }
      ]
    }
    particle.computeRowColInfo(element)
    const tds = element.trList![0].tdList
    expect(tds[0].colIndex).toBe(0)
    expect(tds[0].x).toBe(200)
    expect(tds[2].colIndex).toBe(2)
    expect(tds[2].x).toBe(0)
  })

  it('does not remirror undeclared tables when UI is rtl', () => {
    const draw = mockDraw(TextDirection.RTL)
    const particle = new TableParticle(draw)
    const element: IElement = {
      type: ElementType.TABLE,
      value: '',
      width: 300,
      height: 40,
      colgroup: [{ width: 100 }, { width: 100 }, { width: 100 }],
      trList: [
        {
          height: 40,
          tdList: [
            { rowspan: 1, colspan: 1, value: [] },
            { rowspan: 1, colspan: 1, value: [] },
            { rowspan: 1, colspan: 1, value: [] }
          ]
        }
      ]
    }
    particle.computeRowColInfo(element)
    const tds = element.trList![0].tdList
    expect(tds[0].x).toBe(0)
    expect(tds[2].x).toBe(200)
  })

  it('keeps LTR accumulation when UI ltr', () => {
    const draw = mockDraw(TextDirection.LTR)
    const particle = new TableParticle(draw)
    const element: IElement = {
      type: ElementType.TABLE,
      value: '',
      width: 200,
      height: 40,
      colgroup: [{ width: 80 }, { width: 120 }],
      trList: [
        {
          height: 40,
          tdList: [
            { rowspan: 1, colspan: 1, value: [] },
            { rowspan: 1, colspan: 1, value: [] }
          ]
        }
      ]
    }
    particle.computeRowColInfo(element)
    expect(element.trList![0].tdList[0].x).toBe(0)
    expect(element.trList![0].tdList[1].x).toBe(80)
  })
})
