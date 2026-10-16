import { describe, expect, it } from 'vitest'
import { mapLayoutToRows } from '../../../src/editor/core/text-engine-host/mapToLegacyRow'
import type { IElement } from '../../../src/editor/interface/Element'
import type { LayoutResult } from '../../../src/editor/core/text-engine/types'

function makeLayout(bold?: boolean, color = '#000'): LayoutResult {
  const style = {
    fontFamily: 'sans-serif',
    fontSize: 16,
    bold,
    color
  }
  return {
    direction: 'ltr',
    paragraphText: 'ab',
    lines: [
      {
        glyphs: [
          {
            glyphId: 1,
            cluster: 0,
            ax: 10,
            dx: 0,
            dy: 0,
            charStart: 0,
            charEnd: 1,
            logicalIndexStart: 1,
            logicalIndexEnd: 1,
            left: 0,
            right: 10,
            style,
            bidiLevel: 0
          },
          {
            glyphId: 2,
            cluster: 1,
            ax: 10,
            dx: 0,
            dy: 0,
            charStart: 1,
            charEnd: 2,
            logicalIndexStart: 2,
            logicalIndexEnd: 2,
            left: 10,
            right: 20,
            style,
            bidiLevel: 0
          }
        ],
        width: 20,
        height: 24,
        ascent: 19,
        descent: 5,
        textStart: 0,
        textEnd: 2,
        logicalStart: 1,
        logicalEnd: 2,
        direction: 'ltr',
        shiftX: 0
      }
    ]
  }
}

describe('text-engine live styles', () => {
  it('mapLayoutToRows keeps elementList references for isCompute:false', () => {
    const elementList: IElement[] = [
      { value: '\u200B' },
      { value: 'a' },
      { value: 'b' }
    ]
    const rows = mapLayoutToRows({
      layout: makeLayout(),
      elementList,
      startRowIndex: 0,
      defaultFont: 'sans-serif',
      defaultSize: 16
    })
    expect(rows[0].elementList[0]).toBe(elementList[1])
    expect(rows[0].elementList[1]).toBe(elementList[2])

    elementList[1].underline = true
    elementList[2].strikeout = true
    expect(rows[0].elementList[0].underline).toBe(true)
    expect(rows[0].elementList[1].strikeout).toBe(true)
  })

  it('bold style on elements is visible via shared row element refs', () => {
    const elementList: IElement[] = [
      { value: '\u200B' },
      { value: 'a', bold: true },
      { value: 'b', bold: true }
    ]
    const rows = mapLayoutToRows({
      layout: makeLayout(true),
      elementList,
      startRowIndex: 0,
      defaultFont: 'sans-serif',
      defaultSize: 16
    })
    expect(rows[0].elementList[0].bold).toBe(true)
    expect(rows[0].elementList[0].style).toContain('bold')
  })
})
