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
import type { IElement } from '@/editor/interface/Element'

function stubMeasureText() {
  vi.spyOn(CanvasRenderingContext2D.prototype, 'measureText').mockImplementation(function (text: string) {
    let width = 0
    for (const ch of text) {
      const cp = ch.codePointAt(0)!
      if ((cp >= 0x200b && cp <= 0x200d) || cp === 0xfeff || cp === 0x2060 || (cp >= 0x2066 && cp <= 0x2069)) continue
      width += cp > 0xff ? 16 : 8
    }
    return { width, actualBoundingBoxAscent: 12.8, actualBoundingBoxDescent: 3.2, fontBoundingBoxAscent: 12.8, fontBoundingBoxDescent: 3.2 } as TextMetrics
  })
}

function createDraw(main: IElement[], opts: Record<string, unknown> = {}) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const options = mergeOption({ defaultDirection: TextDirection.AUTO, textEngine: TextEngineMode.HARFBUZZ, header: { disabled: true }, footer: { disabled: true }, ...opts })
  formatElementList(main, { editorOptions: options, isForceCompensation: true })
  const draw = new Draw(container, options, { header: [{ value: '\n' }], main, footer: [{ value: '\n' }] }, new Listener(), new EventBus(), new Override())
  return { draw, container }
}

describe('RTL Arabic EMR e2e position', () => {
  let draw: Draw | undefined
  let container: HTMLDivElement | undefined
  afterEach(() => { draw?.destroy(); container?.remove(); draw = undefined; container = undefined; vi.restoreAllMocks() })

  it('Arabic text + SELECT control: visualLeft monotonic, no overlap', async () => {
    stubMeasureText()
    const RTL = TextDirection.RTL
    const main: IElement[] = [
      { value: ZERO },
      // Simulated既往史 paragraph
      { value: 'سكري منذ ١٠ سنوات، وارتفاع ضغط الدم منذ سنتين، و', size: 16, direction: RTL },
      { value: 'مرض معدٍ', color: '#FF0000', size: 16, direction: RTL },
      { value: ' منذ سنة. يرجى ذكر أمراض سابقة أخرى. ', size: 16, direction: RTL },
      {
        type: ElementType.CONTROL,
        value: '',
        direction: RTL,
        control: {
          conceptId: '2',
          type: ControlType.SELECT,
          value: null,
          code: null,
          placeholder: 'نعم/لا',
          prefix: '{',
          postfix: '}',
          valueSets: [{ value: 'نعم', code: '98175' }, { value: 'لا', code: '98176' }]
        }
      },
      { value: '\n', direction: RTL }
    ]
    ;({ draw, container } = createDraw(main))

    await (draw as any).layoutHostAdapter.ensureReady()
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const rows = draw!.getOriginalRowList()
    const posList = draw!.getPosition().getOriginalPositionList()
    const elList = draw!.getOriginalElementList()

    // Find all RTL rows
    const rtlRows = rows.filter(r => r.direction === 'rtl')
    expect(rtlRows.length).toBeGreaterThan(0)

    for (const row of rtlRows) {
      // All text-bearing rows must use text-engine
      if (row.elementList.some(e => e.value && e.value !== ZERO && e.value !== '\n')) {
        expect(row.engineLine).toBeTruthy()
      }

      // Check visualLeft monotonicity within each row
      const els = row.elementList.filter(e => e.visualLeft !== undefined && (e.metrics?.width ?? 0) > 0.01)
      const sorted = [...els].sort((a, b) => (a.visualLeft ?? 0) - (b.visualLeft ?? 0))
      for (let i = 1; i < sorted.length; i++) {
        const prevRight = (sorted[i - 1].visualLeft ?? 0) + (sorted[i - 1].metrics?.width ?? 0)
        const curLeft = sorted[i].visualLeft ?? 0
        expect(curLeft).toBeGreaterThanOrEqual(prevRight - 1)
      }

      // Check position engine coordinates are consistent with visualLeft
      for (const el of els) {
        const elIdx = elList.indexOf(el as IElement)
        if (elIdx < 0) continue
        const pos = posList[elIdx]
        if (!pos) continue
        const posLeft = pos.coordinate.leftTop[0]
        // position x should be close to visualLeft + row origin
        // (We can't compute exact row origin here, but we can check relative consistency)
        expect(posLeft).toBeGreaterThanOrEqual(0)
        expect(pos.coordinate.rightTop[0]).toBeGreaterThan(pos.coordinate.leftTop[0])
      }
    }
  })

  it('RTL paragraph with批注 groupIds: highlight positions correct', async () => {
    stubMeasureText()
    const RTL = TextDirection.RTL
    const main: IElement[] = [
      { value: ZERO },
      { value: 'التشخيص: ', size: 16, direction: RTL },
      {
        value: 'هيماتوكريت',
        highlight: '#F2F27F',
        groupIds: ['g1'],
        size: 16,
        direction: RTL,
        rowFlex: 'start' as any
      },
      { value: ' ٣٦.٥٠٪ ', size: 16, direction: RTL },
      { value: '\n', direction: RTL }
    ]
    ;({ draw, container } = createDraw(main))

    await (draw as any).layoutHostAdapter.ensureReady()
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const elList = draw!.getOriginalElementList()
    const posList = draw!.getPosition().getOriginalPositionList()

    // Find the批注 element
    const hlEl = elList.find(e => e.groupIds?.includes('g1'))
    expect(hlEl).toBeTruthy()
    const hlIdx = elList.indexOf(hlEl!)
    const hlPos = posList[hlIdx]
    expect(hlPos).toBeTruthy()

    // The批注 highlight should be within the page content area
    const pageWidth = 820 // default
    expect(hlPos.coordinate.leftTop[0]).toBeGreaterThan(0)
    expect(hlPos.coordinate.rightTop[0]).toBeLessThanOrEqual(pageWidth)
    // The highlight element should have positive width
    expect(hlPos.coordinate.rightTop[0]).toBeGreaterThan(hlPos.coordinate.leftTop[0])
  })

  it('RTL text control: clicking empty value area places caret on the right', async () => {
    stubMeasureText()
    const RTL = TextDirection.RTL
    const main: IElement[] = [
      { value: ZERO },
      { value: 'ملاحظات: ', size: 16, direction: RTL },
      {
        type: ElementType.CONTROL,
        value: '',
        direction: RTL,
        control: {
          type: ControlType.TEXT,
          value: null,
          placeholder: 'ملاحظات إضافية',
          prefix: '{',
          postfix: '}'
        }
      },
      { value: '\n', direction: RTL }
    ]
    ;({ draw, container } = createDraw(main))

    await (draw as any).layoutHostAdapter.ensureReady()
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const posList = draw!.getPosition().getOriginalPositionList()
    const elList = draw!.getOriginalElementList()
    const postfix = elList.findIndex(
      e => e.controlComponent === ControlComponent.POSTFIX
    )
    const postfixX = posList[postfix].coordinate.leftTop[0]
    const prefix = elList.findIndex(
      e => e.controlComponent === ControlComponent.PREFIX
    )
    const prefixX = posList[prefix].coordinate.leftTop[0]

    // RTL 布局下 prefix 应位于右侧（postfix 左侧为视觉起点）
    expect(prefixX).toBeGreaterThan(postfixX)
    // 点击值区域右侧 → 光标吸附到 prefix（RTL 起始），落在右侧
    const hit = draw!.getPosition().getPositionByXY({
      x: prefixX + 2,
      y: 130,
      pageNo: 0
    })
    const caretPos = posList[hit.index]
    expect(caretPos.coordinate.leftTop[0]).toBeGreaterThan(postfixX)
  })

  it('popup position mirrors right edge for RTL bidi level', async () => {
    stubMeasureText()
    ;({ draw, container } = createDraw([
      { value: ZERO },
      { value: '\u0645', direction: TextDirection.RTL }
    ]))
    await (draw as any).layoutHostAdapter.ensureReady()
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const base = {
      coordinate: {
        leftTop: [700, 100] as [number, number],
        rightTop: [720, 100] as [number, number]
      },
      lineHeight: 24,
      pageNo: 0
    }
    const rtl = (draw as any).getPopupPositionStyle({
      ...base,
      bidiLevel: 1
    })
    expect(rtl.right).toBeGreaterThan(0)
    expect(rtl.left).toBeUndefined()
    const ltr = (draw as any).getPopupPositionStyle({
      ...base,
      bidiLevel: 0
    })
    expect(ltr.left).toBe(700)
    expect(ltr.right).toBeUndefined()
  })
})
