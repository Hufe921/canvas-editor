import { layoutNativeSnapshot } from '../../factories/native-row'
import { createTestTextShaper } from '../../factories/text-shaper'
import { describe, expect, it } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import {
  ControlComponent,
  ControlType,
  ElementType,
  TextDirection
} from '@/editor'
import { ZERO } from '@/editor/dataset/constant/Common'
import type { IElement } from '@/editor/interface/Element'
import { ElementBridge } from '@/editor/core/text-engine-host/ElementBridge'
import { BidiResolver } from '@/editor/core/text-engine/bidi/BidiResolver'
import { TextLayoutEngine } from '@/editor/core/text-engine/layout/TextLayoutEngine'

async function renderMain(main: IElement[]): Promise<Draw> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const options = mergeOption({
    autoDownloadFonts: false,
    defaultDirection: TextDirection.AUTO,

    header: { disabled: true },
    footer: { disabled: true }
  })
  formatElementList(main, {
    editorOptions: options,
    isForceCompensation: true
  })
  const draw = new Draw(
    container,
    options,
    { header: [{ value: '\n' }], main, footer: [{ value: '\n' }] },
    new Listener(),
    new EventBus(),
    new Override()
  )
  await draw.ready
  draw.render()
  return draw
}

describe('control placeholder hit-test', () => {
  it('LTR control braces stay contiguous without LRI', async () => {
    const control = {
      type: ControlType.SELECT,
      value: null,
      placeholder: '分级',
      prefix: '{',
      postfix: '}'
    }
    const raw: IElement[] = [
      { value: ZERO },
      { value: '高血压分级：' },
      {
        type: ElementType.CONTROL,
        value: '',
        control
      }
    ]
    formatElementList(raw, {
      editorOptions: mergeOption({ defaultDirection: TextDirection.AUTO }),
      isForceCompensation: true
    })
    const bridge = new ElementBridge()
    const paras = bridge.scanParagraphs(raw, {
      defaultDirection: TextDirection.AUTO,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000'
    })
    const para = paras.find(p => p.text.includes('高血压'))!
    expect(para.direction).toBe('ltr')
    expect(para.text).not.toContain('\u2066')
    expect(para.text).toContain('{分级}')

    const engine = new TextLayoutEngine(
      new BidiResolver(),
      createTestTextShaper()
    )
    const layout = engine.layoutParagraph({
      spans: para.spans,
      availableWidth: 800,
      direction: para.direction,
      align: 'left',
      lineHeight: 24,
      lineHeightFactor: 1.5
    })
    const rows = await layoutNativeSnapshot({
      layout,
      elementList: raw,
      startRowIndex: 0,
      defaultFont: 'sans-serif',
      defaultSize: 16
    })
    const prefix = rows[0].elementList.find(
      e => e.controlComponent === ControlComponent.PREFIX
    )!
    const ph = rows[0].elementList.filter(
      e => e.controlComponent === ControlComponent.PLACEHOLDER
    )
    expect(prefix.metrics.width).toBeGreaterThan(4)
    expect(ph.every(e => e.metrics.width > 4)).toBe(true)
    expect((prefix.bidiLevel ?? 0) & 1).toBe(0)
    ph.forEach(e => expect((e.bidiLevel ?? 0) & 1).toBe(0))

    const colon = rows[0].elementList.find(e => e.value === '：')!
    const ordered = [colon, prefix, ...ph]
    for (let i = 1; i < ordered.length; i++) {
      const prev = ordered[i - 1]
      const cur = ordered[i]
      const prevRight = (prev.visualLeft || 0) + prev.metrics.width
      expect(cur.visualLeft || 0).toBeGreaterThanOrEqual(prevRight - 0.5)
    }
  })

  it('click left half of PREFIX stays inside control (activatable)', async () => {
    const main: IElement[] = [
      { value: ZERO },
      { value: '高血压分级：' },
      {
        type: ElementType.CONTROL,
        value: '',
        control: {
          conceptId: 'hypertensionLevel',
          type: ControlType.SELECT,
          value: null,
          code: null,
          placeholder: '分级',
          prefix: '{',
          postfix: '}'
        }
      }
    ]
    const draw = await renderMain(main)
    try {
      const elementList = draw.getOriginalElementList()
      const positionList = draw.getPosition().getOriginalPositionList()
      const prefixIdx = elementList.findIndex(
        e => e.controlComponent === ControlComponent.PREFIX
      )
      const phIdx = elementList.findIndex(
        e => e.controlComponent === ControlComponent.PLACEHOLDER
      )
      expect(prefixIdx).toBeGreaterThan(0)
      expect(phIdx).toBeGreaterThan(0)

      const prefixPos = positionList[prefixIdx]
      expect(Number.isFinite(prefixPos.coordinate.leftTop[1])).toBe(true)
      expect(prefixPos.metrics.width).toBeGreaterThan(4)

      const leftX =
        prefixPos.coordinate.leftTop[0] +
        (prefixPos.coordinate.rightTop[0] - prefixPos.coordinate.leftTop[0]) *
          0.25
      const y =
        (prefixPos.coordinate.leftTop[1] + prefixPos.coordinate.leftBottom[1]) /
        2

      const byXY = draw.getPosition().getPositionByXY({
        x: leftX,
        y,
        pageNo: 0
      })
      // 左半不得落到控件外（旧逻辑会到「：」）
      expect(byXY.isDirectHit).toBe(true)
      expect(byXY.isControl).toBe(true)
      expect(elementList[byXY.index]?.controlId).toBeTruthy()

      const adjusted = draw.getPosition().adjustPositionContext({
        x: leftX,
        y,
        pageNo: 0
      })!
      expect(elementList[adjusted.index]?.controlId).toBeTruthy()
      expect(adjusted.index).toBe(prefixIdx)

      // PLACEHOLDER 中点仍吸附到 PREFIX
      const phPos = positionList[phIdx]
      const hitPh = draw.getPosition().adjustPositionContext({
        x: (phPos.coordinate.leftTop[0] + phPos.coordinate.rightTop[0]) / 2,
        y: (phPos.coordinate.leftTop[1] + phPos.coordinate.leftBottom[1]) / 2,
        pageNo: 0
      })!
      expect(hitPh.index).toBe(prefixIdx)
    } finally {
      draw.destroy()
      draw.getContainer().remove()
    }
  })
})
