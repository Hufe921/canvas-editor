import { describe, expect, it } from 'vitest'
import { ControlComponent, ControlType } from '../../../src/editor'
import { Control } from '../../../src/editor/core/draw/control/Control'
import { mapLayoutToRows } from '../../../src/editor/core/text-engine-host/mapToLegacyRow'
import type { IElement } from '../../../src/editor/interface/Element'
import type { IRow, IRowElement } from '../../../src/editor/interface/Row'
import type { LayoutResult } from '../../../src/editor/core/text-engine/types'

function stubControl(): Control {
  // setMinWidth / applyEngine 仅依赖 options.scale
  return new Control({
    getOptions: () => ({ scale: 1, control: {} }),
    getRange: () => ({}),
    getListener: () => ({}),
    getEventBus: () => ({})
  } as any)
}

describe('text-engine control.minWidth / label draw x', () => {
  it('mapLayoutToRows clears stale legacy left', () => {
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
    const rows = mapLayoutToRows({
      layout,
      elementList,
      startRowIndex: 0,
      defaultFont: 'sans',
      defaultSize: 16
    })
    expect(rows[0].elementList[1].left).toBe(0)
  })

  it('applyEngineRowsMinWidth sets postfix left so underline starts after label', () => {
    const control = stubControl()
    const controlMeta = {
      type: ControlType.TEXT,
      value: null,
      minWidth: 160,
      underline: true
    }
    const label = {
      value: '签',
      metrics: {
        width: 16,
        height: 16,
        boundingBoxAscent: 12,
        boundingBoxDescent: 4
      },
      style: '16px sans',
      visualLeft: 0,
      left: 0
    } as IRowElement
    const prefix = {
      value: '\u200c',
      control: controlMeta,
      controlId: 'c1',
      controlComponent: ControlComponent.PREFIX,
      metrics: {
        width: 0,
        height: 16,
        boundingBoxAscent: 12,
        boundingBoxDescent: 4
      },
      style: '16px sans',
      visualLeft: 16,
      left: 999 // stale
    } as IRowElement
    const postfix = {
      value: '\u200c',
      control: controlMeta,
      controlId: 'c1',
      controlComponent: ControlComponent.POSTFIX,
      metrics: {
        width: 0,
        height: 16,
        boundingBoxAscent: 12,
        boundingBoxDescent: 4
      },
      style: '16px sans',
      visualLeft: 16,
      left: 999
    } as IRowElement
    const row: IRow = {
      width: 16,
      height: 24,
      ascent: 16,
      startIndex: 0,
      rowIndex: 0,
      elementList: [label, prefix, postfix],
      engineLine: {
        glyphs: [
          {
            left: 0,
            right: 16,
            ax: 16,
            dx: 0,
            dy: 0,
            charStart: 0,
            charEnd: 1,
            logicalIndexStart: 0,
            logicalIndexEnd: 0,
            bidiLevel: 0,
            style: { fontFamily: 'sans', fontSize: 16, color: '#000' }
          }
        ],
        width: 16,
        height: 24,
        ascent: 16,
        direction: 'ltr'
      }
    }
    control.applyEngineRowsMinWidth([row], 500)
    expect(prefix.left).toBe(0)
    expect(postfix.left).toBe(160)
    expect(row.width).toBe(16 + 160)
    // underline 起点 = abs(postfix) - left = origin + visualLeft
    const rowOrigin = 120
    const underlineStart =
      rowOrigin + (postfix.visualLeft || 0) + (postfix.left || 0) - (postfix.left || 0)
    expect(underlineStart).toBe(rowOrigin + 16)
    expect(underlineStart).toBeGreaterThan(rowOrigin)
  })
})
