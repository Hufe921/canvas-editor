import { layoutNativeSnapshot } from '../../factories/native-row'
import { describe, expect, it } from 'vitest'
import { ControlComponent, ControlType } from '../../../src/editor'
import type { IElement } from '../../../src/editor/interface/Element'
import type { LayoutResult } from '../../../src/editor/core/text-engine/types'

describe('text-engine control.minWidth / label draw x', () => {
  it('native output ignores stale legacy left without mutating the source', async () => {
    const elementList: IElement[] = [
      { value: 'A' },
      {
        value: '\u200c',
        control: {
          type: ControlType.TEXT,
          value: null,
          minWidth: 160,
          underline: true
        },
        controlComponent: ControlComponent.POSTFIX,
        left: 200
      } as IElement
    ]
    const layout = {
      direction: 'ltr',
      paragraphText: 'A\u200c',
      lines: [
        {
          glyphs: [
            {
              glyphId: 1,
              cluster: 0,
              left: 0,
              right: 10,
              ax: 10,
              dx: 0,
              dy: 0,
              charStart: 0,
              charEnd: 1,
              logicalIndexStart: 0,
              logicalIndexEnd: 0,
              bidiLevel: 0,
              style: { fontFamily: 'sans', fontSize: 16, color: '#000' }
            },
            {
              glyphId: 2,
              cluster: 1,
              left: 10,
              right: 10,
              ax: 0,
              dx: 0,
              dy: 0,
              charStart: 1,
              charEnd: 2,
              logicalIndexStart: 1,
              logicalIndexEnd: 1,
              bidiLevel: 0,
              style: { fontFamily: 'sans', fontSize: 16, color: '#000' }
            }
          ],
          width: 10,
          height: 24,
          ascent: 16,
          descent: 4,
          direction: 'ltr',
          logicalStart: 0,
          logicalEnd: 1,
          textStart: 0,
          textEnd: 2,
          shiftX: 0
        }
      ]
    } as LayoutResult
    const rows = await layoutNativeSnapshot({
      layout,
      elementList,
      startRowIndex: 0,
      defaultFont: 'sans',
      defaultSize: 16
    })
    expect(rows[0].elementList[1].left).toBe(0)
    expect(elementList[1]).toHaveProperty('left', 200)
  })
})
