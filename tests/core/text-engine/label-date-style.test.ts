import { describe, expect, it } from 'vitest'
import { ElementType } from '../../../src/editor/dataset/enum/Element'
import { TextDirection } from '../../../src/editor/dataset/enum/TextDirection'
import { ZERO } from '../../../src/editor/dataset/constant/Common'
import { ElementBridge } from '../../../src/editor/core/text-engine-host/ElementBridge'
import { LabelParticle } from '../../../src/editor/core/draw/particle/LabelParticle'
import { defaultBadgeOption } from '../../../src/editor/dataset/constant/Badge'
import type { IElement } from '../../../src/editor/interface/Element'
import type { IRow, IRowElement } from '../../../src/editor/interface/Row'

describe('DEFER-023 LABEL / DATE engine style', () => {
  it('ElementBridge maps LABEL label.color onto element.color and span', () => {
    const bridge = new ElementBridge()
    const elementList: IElement[] = [
      { value: ZERO },
      {
        value: '标签',
        type: ElementType.LABEL,
        label: { color: '#ff0000' }
      }
    ]
    const paragraphs = bridge.scanParagraphs(elementList, {
      defaultDirection: TextDirection.LTR,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000000',
      defaultLabelColor: '#1976d2',
      scale: 1
    })
    expect(paragraphs.length).toBe(1)
    expect(elementList[1].color).toBe('#ff0000')
    expect(paragraphs[0].spans[0].style.color).toBe('#ff0000')
  })

  it('ElementBridge uses defaultLabelColor when LABEL has no color', () => {
    const bridge = new ElementBridge()
    const elementList: IElement[] = [
      { value: ZERO },
      { value: 'L', type: ElementType.LABEL }
    ]
    bridge.scanParagraphs(elementList, {
      defaultDirection: TextDirection.LTR,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#111111',
      defaultLabelColor: '#1976d2',
      scale: 1
    })
    expect(elementList[1].color).toBe('#1976d2')
  })

  it('DATE remains text-like in paragraph scan', () => {
    const bridge = new ElementBridge()
    const elementList: IElement[] = [
      { value: ZERO },
      { value: '2024', type: ElementType.DATE, dateId: 'd1' }
    ]
    const paragraphs = bridge.scanParagraphs(elementList, {
      defaultDirection: TextDirection.LTR,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000000',
      scale: 1
    })
    expect(paragraphs[0].spans.length).toBe(1)
    expect(paragraphs[0].text).toBe('2024')
  })
})

describe('LABEL engine padding metrics', () => {
  it('applyEngineRowsMetrics expands box and shifts visualLeft by padLeft', () => {
    const particle = new LabelParticle({
      getOptions: () => ({
        scale: 1,
        defaultSize: 14,
        label: {
          defaultColor: '#1976d2',
          defaultBackgroundColor: '#e3f2fd',
          defaultBorderRadius: 4,
          defaultPadding: [4, 4, 4, 4]
        }
      })
    } as any)
    const label = {
      type: ElementType.LABEL,
      value: '高血压',
      size: 14,
      metrics: {
        width: 42,
        height: 14,
        boundingBoxAscent: 11.2,
        boundingBoxDescent: 2.8
      },
      style: '14px sans',
      visualLeft: 80,
      left: 0
    } as IRowElement
    const after = {
      value: 'x',
      metrics: {
        width: 8,
        height: 14,
        boundingBoxAscent: 11,
        boundingBoxDescent: 3
      },
      style: '14px sans',
      visualLeft: 122,
      left: 0
    } as IRowElement
    const row: IRow = {
      width: 130,
      height: 24,
      ascent: 16,
      startIndex: 0,
      rowIndex: 0,
      elementList: [label, after]
    }
    particle.applyEngineRowsMetrics([row])
    expect(label.visualLeft).toBe(76) // 80 - padLeft(4)
    expect(label.metrics.width).toBe(50) // 42 + 8
    expect(label.metrics.boundingBoxAscent).toBeCloseTo(15.2) // 11.2 + 4
    expect(label.metrics.boundingBoxDescent).toBe(0)
    expect(after.visualLeft).toBe(130) // 122 + 8
    expect(row.width).toBe(138)
  })

  it('does not insert gaps between glyphs inside the same LABEL', () => {
    const particle = new LabelParticle({
      getOptions: () => ({
        scale: 1,
        defaultSize: 14,
        label: {
          defaultColor: '#1976d2',
          defaultBackgroundColor: '#e3f2fd',
          defaultBorderRadius: 4,
          defaultPadding: [4, 4, 4, 4]
        }
      })
    } as any)
    const label = {
      type: ElementType.LABEL,
      value: '高血压',
      size: 14,
      metrics: {
        width: 42,
        height: 14,
        boundingBoxAscent: 11.2,
        boundingBoxDescent: 2.8
      },
      style: '14px sans',
      visualLeft: 80,
      left: 0
    } as IRowElement
    const after = {
      value: 'x',
      metrics: {
        width: 8,
        height: 14,
        boundingBoxAscent: 11,
        boundingBoxDescent: 3
      },
      style: '14px sans',
      visualLeft: 122,
      left: 0
    } as IRowElement
    const glyphs = [
      { left: 80, right: 94, logicalIndexStart: 1, logicalIndexEnd: 1 },
      { left: 94, right: 108, logicalIndexStart: 1, logicalIndexEnd: 1 },
      { left: 108, right: 122, logicalIndexStart: 1, logicalIndexEnd: 1 },
      { left: 122, right: 130, logicalIndexStart: 2, logicalIndexEnd: 2 }
    ]
    const row: IRow = {
      width: 130,
      height: 24,
      ascent: 16,
      startIndex: 0,
      rowIndex: 0,
      elementList: [label, after],
      engineLine: {
        glyphs,
        width: 130
      } as IRow['engineLine']
    }
    particle.applyEngineRowsMetrics([row])
    const out = row.engineLine!.glyphs
    // 标签内三字相对间距保持不变，仅整体盒扩 padding
    expect(out[0].left).toBe(80)
    expect(out[1].left).toBe(94)
    expect(out[2].left).toBe(108)
    // 盒右侧之后的字形才右移 padL+padR
    expect(out[3].left).toBe(130)
    expect(after.visualLeft).toBe(130)
    // 不得原地改入参 glyphs（可能来自 LayoutCache）
    expect(glyphs[3].left).toBe(122)
  })
})

describe('DEFER-005 Badge right option', () => {
  it('default badge right sentinel is -1 (left anchoring)', () => {
    expect(defaultBadgeOption.right).toBe(-1)
    expect(defaultBadgeOption.left).toBe(5)
  })
})
