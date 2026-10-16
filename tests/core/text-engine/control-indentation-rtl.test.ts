import { describe, expect, it, vi, afterEach } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import {
  ControlComponent,
  ControlIndentation,
  ControlType,
  ElementType,
  TextDirection,
  TextEngineMode
} from '@/editor'
import { ZERO } from '@/editor/dataset/constant/Common'
import type { IElement } from '@/editor/interface/Element'
import type { IRow, IRowElement } from '@/editor/interface/Row'

function stubMeasureText() {
  vi.spyOn(CanvasRenderingContext2D.prototype, 'measureText').mockImplementation(
    function (text: string) {
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
    }
  )
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
  formatElementList(main, { editorOptions: options, isForceCompensation: true })
  const draw = new Draw(
    container,
    options,
    { header: [{ value: '\n' }], main, footer: [{ value: '\n' }] },
    new Listener(),
    new EventBus(),
    new Override()
  )
  return { draw, container }
}

function buildControlMain(
  value: string,
  direction: TextDirection
): IElement[] {
  return [
    { value: ZERO },
    {
      type: ElementType.CONTROL,
      value: '',
      direction,
      control: {
        type: ControlType.TEXT,
        value: [{ value }],
        prefix: '{',
        postfix: '}',
        placeholder: '…',
        indentation: ControlIndentation.VALUE_START
      }
    },
    { value: '\n', direction }
  ]
}

/** 各行的值起始视觉坐标（LTR=最小左缘；RTL=最大右缘） */
function valueStartPerRow(
  rows: IRow[],
  isRtl: boolean
): { row: IRow; start: number }[] {
  const out: { row: IRow; start: number }[] = []
  for (const row of rows) {
    const valueEls = row.elementList.filter(
      (el: IRowElement) => el.controlComponent === ControlComponent.VALUE
    )
    if (!valueEls.length) continue
    const start = isRtl
      ? Math.max(
          ...valueEls.map(
            (el: IRowElement) => (el.visualLeft || 0) + (el.metrics?.width || 0)
          )
        )
      : Math.min(...valueEls.map((el: IRowElement) => el.visualLeft || 0))
    out.push({ row, start })
  }
  return out
}

describe('DEFER-006 control indentation (VALUE_START) text-engine rows', () => {
  let draw: Draw | undefined
  let container: HTMLDivElement | undefined
  afterEach(() => {
    draw?.destroy()
    container?.remove()
    draw = undefined
    container = undefined
    vi.restoreAllMocks()
  })

  it('LTR: continuation rows align to the value left edge', async () => {
    stubMeasureText()
    const longValue = 'This is a very long value '.repeat(20)
    ;({ draw, container } = createDraw(
      buildControlMain(longValue, TextDirection.LTR)
    ))
    await (draw as any).layoutHostAdapter.ensureReady()
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const rows = draw!.getOriginalRowList()
    const starts = valueStartPerRow(rows, false)
    expect(starts.length).toBeGreaterThan(1)
    const first = starts[0].start
    for (const { start } of starts.slice(1)) {
      expect(Math.abs(start - first)).toBeLessThan(1)
    }
  })

  it('RTL: continuation rows align to the value right edge (start side)', async () => {
    stubMeasureText()
    const longValue =
      'قيمة طويلة جدًا من أجل اختبار التفاف السطر داخل حقل الإدخال '.repeat(8)
    ;({ draw, container } = createDraw(
      buildControlMain(longValue, TextDirection.RTL)
    ))
    await (draw as any).layoutHostAdapter.ensureReady()
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const rows = draw!.getOriginalRowList()
    const rtlRows = rows.filter(r => r.direction === 'rtl')
    expect(rtlRows.length).toBeGreaterThan(0)
    const starts = valueStartPerRow(rows, true)
    expect(starts.length).toBeGreaterThan(1)
    const first = starts[0].start
    for (const { start } of starts.slice(1)) {
      expect(Math.abs(start - first)).toBeLessThan(1)
    }
  })

  it('auto direction: Arabic value resolves rtl and continuation aligns to right edge', async () => {
    stubMeasureText()
    const longValue =
      'نص عربي طويل جدًا لاختبار محاذاة الاستمرار تلقائيًا وفق اتجاه الفقرة '.repeat(
        6
      )
    ;({ draw, container } = createDraw(
      buildControlMain(longValue, TextDirection.AUTO)
    ))
    await (draw as any).layoutHostAdapter.ensureReady()
    draw!.render({ isSubmitHistory: false, isSetCursor: false })

    const rows = draw!.getOriginalRowList()
    const rtlRows = rows.filter(r => r.direction === 'rtl')
    expect(rtlRows.length).toBeGreaterThan(0)
    const starts = valueStartPerRow(rows, true)
    expect(starts.length).toBeGreaterThan(1)
    const first = starts[0].start
    for (const { start } of starts.slice(1)) {
      expect(Math.abs(start - first)).toBeLessThan(1)
    }
  })
})
