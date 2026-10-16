import { describe, expect, it, vi, afterEach } from 'vitest'
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
  TextDirection,
  TextEngineMode
} from '@/editor'
import { ZERO } from '@/editor/dataset/constant/Common'
import { SelectControl } from '@/editor/core/draw/control/select/SelectControl'
import { ElementBridge } from '@/editor/core/text-engine-host/ElementBridge'
import { BidiResolver } from '@/editor/core/text-engine/bidi/BidiResolver'
import { BrowserTextShaper } from '@/editor/core/text-engine/shape/BrowserTextShaper'
import { TextLayoutEngine } from '@/editor/core/text-engine/layout/TextLayoutEngine'
import { mapLayoutToRows } from '@/editor/core/text-engine-host/mapToLegacyRow'
import type { IElement } from '@/editor/interface/Element'

function stubMeasureText() {
  const proto = CanvasRenderingContext2D.prototype
  vi.spyOn(proto, 'measureText').mockImplementation(function (text: string) {
    let width = 0
    for (const ch of text) {
      const cp = ch.codePointAt(0)!
      if (
        (cp >= 0x200b && cp <= 0x200d) ||
        cp === 0xfeff ||
        cp === 0x2060 ||
        (cp >= 0x2066 && cp <= 0x2069)
      ) {
        continue
      }
      width += cp > 0xff ? 16 : 8
    }
    return {
      width,
      actualBoundingBoxAscent: 12.8,
      actualBoundingBoxDescent: 3.2,
      fontBoundingBoxAscent: 12.8,
      fontBoundingBoxDescent: 3.2
    } as TextMetrics
  })
}

function createDraw(main: IElement[], opts: Record<string, unknown> = {}) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const options = mergeOption({
    defaultDirection: TextDirection.AUTO,
    textEngine: TextEngineMode.HARFBUZZ,
    header: { disabled: true },
    footer: { disabled: true },
    ...opts
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
  draw.render()
  return { draw, container, options }
}

describe('SELECT setSelect vs PLACEHOLDER overlap / TEXT wrap hit', () => {
  let draw: Draw | undefined
  let container: HTMLDivElement | undefined

  afterEach(() => {
    draw?.destroy()
    container?.remove()
    draw = undefined
    container = undefined
    vi.restoreAllMocks()
  })

  it('hypertensionLevel setSelect(Ⅱ级): placeholder gone, no visualLeft overlap', async () => {
    stubMeasureText()
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
          postfix: '}',
          valueSets: [
            { value: 'Ⅰ级', code: '1' },
            { value: 'Ⅱ级', code: '2' },
            { value: 'Ⅲ级', code: '3' }
          ]
        }
      }
    ]
    ;({ draw, container } = createDraw(main))

    const elementList = draw!.getOriginalElementList()
    const prefixIdx = elementList.findIndex(
      e =>
        e.control?.conceptId === 'hypertensionLevel' &&
        e.controlComponent === ControlComponent.PREFIX
    )
    expect(prefixIdx).toBeGreaterThan(0)

    draw!.getRange().setRange(prefixIdx, prefixIdx)
    draw!.getControl().initControl()
    const active = draw!.getControl().getActiveControl() as SelectControl
    expect(active).toBeTruthy()
    active.setSelect('2')

    const after = draw!.getOriginalElementList()
    const controlEls = after.filter(
      e => e.control?.conceptId === 'hypertensionLevel'
    )
    expect(
      controlEls.filter(
        e => e.controlComponent === ControlComponent.PLACEHOLDER
      )
    ).toHaveLength(0)
    expect(
      controlEls
        .filter(e => e.controlComponent === ControlComponent.VALUE)
        .map(v => v.value)
        .join('')
    ).toBe('Ⅱ级')
    expect(controlEls[0].control?.code).toBe('2')

    const bridge = new ElementBridge()
    const paras = bridge.scanParagraphs(after, {
      defaultDirection: TextDirection.AUTO,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000'
    })
    const para = paras.find(
      p => p.text.includes('高血压') || p.text.includes('Ⅱ')
    )!
    expect(para.text).toMatch(/\{Ⅱ级\}/)
    expect(para.text).not.toMatch(/\{分级\}/)

    const engine = new TextLayoutEngine(
      new BidiResolver(),
      new BrowserTextShaper()
    )
    const layout = engine.layoutParagraph({
      spans: para.spans,
      availableWidth: 800,
      direction: para.direction,
      align: 'left',
      lineHeight: 24,
      lineHeightFactor: 1.5
    })
    const rows = mapLayoutToRows({
      layout,
      elementList: after,
      startRowIndex: 0,
      defaultFont: 'sans-serif',
      defaultSize: 16
    })
    const row = rows.find(r =>
      r.elementList.some(e => e.control?.conceptId === 'hypertensionLevel')
    )!
    const ordered = row.elementList.filter(
      e => e.control?.conceptId === 'hypertensionLevel'
    )
    for (let i = 1; i < ordered.length; i++) {
      const prevRight =
        (ordered[i - 1].visualLeft ?? 0) + ordered[i - 1].metrics.width
      expect(ordered[i].visualLeft ?? 0).toBeGreaterThanOrEqual(prevRight - 0.5)
    }

    const adapter = (draw as any).layoutHostAdapter
    await adapter.ensureReady()
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const liveRow = draw!.getOriginalRowList().find(r =>
      r.elementList.some(e => e.control?.conceptId === 'hypertensionLevel')
    )!
    const liveOrdered = liveRow.elementList.filter(
      e => e.control?.conceptId === 'hypertensionLevel'
    )
    expect(liveRow.engineParagraphText).toContain('{Ⅱ级}')
    expect(liveRow.engineParagraphText).not.toMatch(/\{分级\}/)
    for (let i = 1; i < liveOrdered.length; i++) {
      const prev = liveOrdered[i - 1]
      const cur = liveOrdered[i]
      const prevRight = (prev.visualLeft || 0) + (prev.metrics?.width || 0)
      expect(cur.visualLeft || 0).toBeGreaterThanOrEqual(prevRight - 1)
    }
  })

  it('obesityTip wrapped placeholder: second-line chars enter control', async () => {
    stubMeasureText()
    // `{干预建议}` stub 宽 = 8+16*4+8=80；innerWidth=56 强制控件中段换行
    const main: IElement[] = [
      { value: ZERO },
      { value: '肥胖干预建议：' },
      {
        type: ElementType.CONTROL,
        value: '',
        control: {
          conceptId: 'obesityTip',
          type: ControlType.TEXT,
          value: null,
          placeholder: '干预建议',
          prefix: '{',
          postfix: '}'
        }
      }
    ]
    ;({ draw, container } = createDraw(main, {
      width: 88,
      pageWidth: 88,
      margins: [10, 16, 10, 16]
    }))
    const adapter = (draw as any).layoutHostAdapter
    await adapter.ensureReady()
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const elementList = draw!.getOriginalElementList()
    const rows = draw!.getOriginalRowList()
    const tipRows = rows.filter(r =>
      r.elementList.some(e => e.control?.conceptId === 'obesityTip')
    )
    expect(tipRows.length).toBeGreaterThan(1)

    const positionList = draw!.getPosition().getOriginalPositionList()
    let secondLineElIdx = -1
    for (const row of tipRows.slice(1)) {
      for (let j = 0; j < row.elementList.length; j++) {
        const el = row.elementList[j]
        if (
          el.control?.conceptId === 'obesityTip' &&
          (el.controlComponent === ControlComponent.PLACEHOLDER ||
            el.controlComponent === ControlComponent.POSTFIX)
        ) {
          secondLineElIdx = elementList.indexOf(el as IElement)
          if (secondLineElIdx < 0) secondLineElIdx = row.startIndex + j
          break
        }
      }
      if (~secondLineElIdx) break
    }
    expect(secondLineElIdx).toBeGreaterThan(0)

    const pos = positionList[secondLineElIdx]
    const boxW = pos.coordinate.rightTop[0] - pos.coordinate.leftTop[0]
    expect(boxW).toBeGreaterThan(1)

    const x = (pos.coordinate.leftTop[0] + pos.coordinate.rightTop[0]) / 2
    const y = (pos.coordinate.leftTop[1] + pos.coordinate.leftBottom[1]) / 2

    const byXY = draw!.getPosition().getPositionByXY({ x, y, pageNo: 0 })
    const adjusted = draw!.getPosition().adjustPositionContext({
      x,
      y,
      pageNo: 0
    })!

    expect(byXY.isControl).toBe(true)
    expect(elementList[byXY.index]?.control?.conceptId).toBe('obesityTip')
    expect(adjusted.isControl).toBe(true)
    expect(elementList[adjusted.index]?.control?.conceptId).toBe('obesityTip')
    expect(elementList[adjusted.index]?.controlComponent).toBe(
      ControlComponent.PREFIX
    )
  })

  it('RTL LRI/PDI must not inflate POSTFIX box over {value}', async () => {
    stubMeasureText()
    const main: IElement[] = [
      { value: ZERO, direction: TextDirection.RTL },
      { value: 'الدرجة: ', direction: TextDirection.RTL },
      {
        type: ElementType.CONTROL,
        value: '',
        direction: TextDirection.RTL,
        control: {
          conceptId: 'hypertensionLevel',
          type: ControlType.SELECT,
          value: null,
          code: null,
          placeholder: '分级',
          prefix: '{',
          postfix: '}',
          valueSets: [
            { value: 'Ⅰ级', code: '1' },
            { value: 'Ⅱ级', code: '2' }
          ]
        }
      }
    ]
    ;({ draw, container } = createDraw(main, {
      defaultDirection: TextDirection.AUTO
    }))
    const adapter = (draw as any).layoutHostAdapter
    await adapter.ensureReady()
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const elementList = draw!.getOriginalElementList()
    const prefixIdx = elementList.findIndex(
      e =>
        e.control?.conceptId === 'hypertensionLevel' &&
        e.controlComponent === ControlComponent.PREFIX
    )
    draw!.getRange().setRange(prefixIdx, prefixIdx)
    draw!.getControl().initControl()
    const active = draw!.getControl().getActiveControl() as SelectControl
    active.setSelect('2')
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const after = draw!.getOriginalElementList()
    expect(
      after.filter(
        e =>
          e.control?.conceptId === 'hypertensionLevel' &&
          e.controlComponent === ControlComponent.PLACEHOLDER
      )
    ).toHaveLength(0)

    const liveRow = draw!
      .getOriginalRowList()
      .find(r =>
        r.elementList.some(e => e.control?.conceptId === 'hypertensionLevel')
      )!
    expect(liveRow.engineParagraphText).toContain('\u2066{')
    expect(liveRow.engineParagraphText).toContain('}\u2069')
    expect(liveRow.engineParagraphText).toContain('Ⅱ')
    expect(liveRow.engineParagraphText).not.toMatch(/\{分级\}/)

    const ctrl = liveRow.elementList.filter(
      e => e.control?.conceptId === 'hypertensionLevel'
    )
    const postfix = ctrl.find(
      e => e.controlComponent === ControlComponent.POSTFIX
    )!
    const prefix = ctrl.find(
      e => e.controlComponent === ControlComponent.PREFIX
    )!
    // regression: PDI+`}` union used to make postfix.w cover whole isolate
    expect(postfix.metrics.width).toBeLessThanOrEqual(prefix.metrics.width + 1)
    for (let i = 1; i < ctrl.length; i++) {
      const prev = ctrl[i - 1]
      const cur = ctrl[i]
      const prevRight = (prev.visualLeft || 0) + (prev.metrics?.width || 0)
      expect(cur.visualLeft || 0).toBeGreaterThanOrEqual(prevRight - 0.5)
    }
  })
})
