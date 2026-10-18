import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { HarfBuzzTextShaper } from '@/editor/core/text-engine'
import { ElementType, ListType, TextDirection } from '@/editor'
import { ZERO } from '@/editor/dataset/constant/Common'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import type { IElement } from '@/editor/interface/Element'
import type { IEditorOption } from '@/editor/interface/Editor'

const font = readFileSync(resolve('public/fonts/NotoNaskhArabic-Regular.ttf'))
const fontData = font.buffer.slice(
  font.byteOffset,
  font.byteOffset + font.length
)
const draws: Draw[] = []

afterEach(() => {
  draws.forEach(draw => draw.destroy())
  draws.length = 0
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

async function setup(
  main: IElement[],
  incrementalCompute: boolean,
  extra: Partial<IEditorOption> = {}
) {
  const options = mergeOption({
    autoDownloadFonts: false,
    width: 320,
    height: 180,
    margins: [20, 20, 20, 20],
    defaultFont: 'Noto Naskh Arabic',
    fonts: [{ family: 'Noto Naskh Arabic', data: fontData }],
    header: { disabled: true },
    footer: { disabled: true },
    lab: { incrementalCompute },
    ...extra
  })
  formatElementList(main, {
    editorOptions: options,
    isForceCompensation: true
  })
  const container = document.createElement('div')
  document.body.appendChild(container)
  const draw = new Draw(
    container,
    options,
    { main, header: [{ value: ZERO }], footer: [{ value: ZERO }] },
    new Listener(),
    new EventBus(),
    new Override()
  )
  draws.push(draw)
  await draw.ready
  render(draw)
  return draw
}

function render(draw: Draw) {
  draw.render({ isSetCursor: false, isSubmitHistory: false, isLazy: false })
}

function documentData(count = 8): IElement[] {
  return Array.from({ length: count }, (_, i) => [
    {
      value: `مرحبا بالعالم ${i} Hello 123 اللغة العربية `.repeat(2),
      direction: i % 2 ? TextDirection.LTR : TextDirection.RTL,
      spacingBefore: i % 3,
      spacingAfter: i % 4
    },
    { value: '\n' }
  ]).flat()
}

function snapshot(draw: Draw) {
  return JSON.parse(
    JSON.stringify({
      native: draw.getPosition().getNativeLines(),
      rows: draw.getLayoutRowList(),
      pages: draw.getLayoutPages(),
      positions: draw.getPosition().getOriginalMainPositionList()
    })
  )
}

function splice(draw: Draw, start: number, count: number, text: string) {
  draw.spliceElementList(
    draw.getOriginalMainElementList(),
    start,
    Math.min(count, draw.getOriginalMainElementList().length - start),
    [...text].map(value => ({ value }))
  )
  render(draw)
}

describe('HarfBuzz paragraph incremental layout', () => {
  it.each([
    [TextDirection.LTR, false],
    [TextDirection.LTR, true],
    [TextDirection.RTL, false],
    [TextDirection.RTL, true]
  ] as const)(
    'excludes paragraph spacing from %s selections (incremental: %s)',
    async (direction, incremental) => {
      const text =
        direction === TextDirection.RTL
          ? 'مرحبا بالعالم اللغة العربية '.repeat(4)
          : 'Hello world '.repeat(4)
      const data = (spacingAfter: number): IElement[] => [
        { value: 'intro' },
        { value: '\n' },
        { value: text, direction, spacingAfter },
        { value: '\n' },
        { value: 'tail' }
      ]
      // Keep this decoration check on one page: actual font extents are
      // taller than the old nominal line box, and spacing can move a row.
      const base = await setup(data(0), incremental, {
        scale: 1.5,
        height: 2000
      })
      const spaced = await setup(data(30), incremental, {
        scale: 1.5,
        height: 2000
      })
      const selectionRects = (draw: Draw) => {
        const elements = draw.getOriginalMainElementList()
        const start = elements.findIndex((el, i) => i > 0 && el.value === ZERO)
        let end = start + 1
        while (end < elements.length && elements[end].value !== ZERO) end++
        draw.getRange().setRange(start, end - 1)
        const range = draw.getRange()
        const paint = vi.spyOn(range, 'render')
        draw.render({
          isCompute: false,
          isLazy: false,
          isSetCursor: false,
          isSubmitHistory: false
        })
        const rects = paint.mock.calls.map(call =>
          call
            .slice(1)
            .map(value =>
              typeof value === 'number' ? Number(value.toFixed(8)) : value
            )
        )
        paint.mockRestore()
        expect(rects.length).toBeGreaterThan(0)
        return rects
      }
      const lastParagraphRow = (draw: Draw) =>
        draw.getLayoutRowList().find(row => row.spacingAfter === 45)!
      expect(lastParagraphRow(spaced)).toBeDefined()
      expect(selectionRects(spaced)).toEqual(selectionRects(base))
      // The selected paragraph is reused after an edit in the preceding one.
      splice(base, 2, 0, 'Z')
      splice(spaced, 2, 0, 'Z')
      expect(lastParagraphRow(spaced)).toBeDefined()
      expect(selectionRects(spaced)).toEqual(selectionRects(base))
    }
  )

  it('reuses clean paragraphs and rebases glyphs and carets', async () => {
    const draw = await setup(documentData(30), true)
    const full = await setup(documentData(30), false)
    expect(snapshot(draw)).toEqual(snapshot(full))
    expect(
      draw
        .getLayoutRowList()
        .some(row => row.nativeLine?.glyphs.some(glyph => glyph.font.faceId))
    ).toBe(true)
    const adapter = draw.getLayoutHostAdapter()
    const layout = vi.spyOn(adapter.getTextLayoutService(), 'layoutParagraph')
    const shape = vi.spyOn(HarfBuzzTextShaper.prototype, 'shape')
    const prefixRow = draw.getRawLayoutRows()[0]
    const editIndex = draw.getRawLayoutRows()[20].startIndex + 3
    splice(draw, editIndex, 0, 'سلام')
    const incrementalShapeCalls = shape.mock.calls.length
    shape.mockClear()
    splice(full, editIndex, 0, 'سلام')
    expect(snapshot(draw)).toEqual(snapshot(full))
    expect(draw.getRawLayoutRows()[0]).toEqual(prefixRow)
    expect(draw.getRawLayoutRows()[0]).not.toBe(prefixRow)
    // Reuse native layout, then rebuild host rows and physical placements.
    // Flow probes natural and constrained widths for the edited paragraph.
    expect(
      layout.mock.calls.filter(([input]) => input.source.scope === 'main')
        .length
    ).toBeGreaterThan(0)
    expect(
      layout.mock.calls.filter(([input]) => input.source.scope === 'main')
        .length
    ).toBeLessThan(5)
    expect(incrementalShapeCalls).toBeLessThan(shape.mock.calls.length)
    const tailIndex = draw.getRawLayoutRows().at(-2)!.startIndex + 2
    const actual = adapter.findLayoutByElementIndex(tailIndex)!
    const expected = full
      .getLayoutHostAdapter()
      .findLayoutByElementIndex(tailIndex)!
    expect(actual).toEqual(expected)
    for (const delta of [-1, 1] as const) {
      expect(adapter.visualNeighbor(tailIndex, delta)).toBe(
        full.getLayoutHostAdapter().visualNeighbor(tailIndex, delta)
      )
    }
  }, 15000)

  it('matches full layout through mixed edits', async () => {
    const draw = await setup(documentData(), true)
    const full = await setup(documentData(), false)
    let seed = 0x18cafe
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 0x100000000
    }
    for (let step = 0; step < 24; step++) {
      const elements = draw.getOriginalMainElementList()
      const index = 1 + Math.floor(random() * (elements.length - 2))
      const count = step % 4 === 0 ? 5 : step % 4 === 1 ? 1 : 0
      const text = step % 4 === 0 ? '' : step % 4 === 2 ? ZERO : 'م😀a\u0301'
      splice(draw, index, count, text)
      splice(full, index, count, text)
      expect(snapshot(draw), `edit ${step}`).toEqual(snapshot(full))
    }
    // A deletion can remove several paragraph boundaries at once.
    splice(draw, 10, 140, '')
    splice(full, 10, 140, '')
    expect(snapshot(draw)).toEqual(snapshot(full))
  }, 20000)

  it('merges batched dirty ranges before reusing clean paragraphs', async () => {
    const draw = await setup(documentData(6), true)
    const full = await setup(documentData(6), false)
    for (const target of [draw, full]) {
      const elements = target.getOriginalMainElementList()
      target.spliceElementList(elements, 20, 1, [{ value: 'ب' }])
      target.spliceElementList(elements, 210, 3, [{ value: 'م' }])
      target.spliceElementList(elements, 5, 0, [{ value: 'ع' }])
      render(target)
    }
    expect(snapshot(draw)).toEqual(snapshot(full))
    // Inserting at the end must update the former trailing empty paragraph.
    const end = draw.getOriginalMainElementList().length
    splice(draw, end, 0, 'نهاية')
    splice(full, end, 0, 'نهاية')
    expect(snapshot(draw)).toEqual(snapshot(full))
  })

  it('invalidates reuse for formatting, scale and cache resets', async () => {
    const draw = await setup(documentData(4), true)
    const full = await setup(documentData(4), false)
    const layout = vi.spyOn(
      draw.getLayoutHostAdapter().getTextLayoutService(),
      'layoutParagraph'
    )
    for (const target of [draw, full]) {
      const elements = target.getOriginalMainElementList()
      target.setElementProperty(elements[4], { size: 30, bold: true })
      target.spliceElementList(elements, 5, 0, [{ value: 'م' }])
      render(target)
    }
    expect(
      layout.mock.calls.filter(([input]) => input.source.scope === 'main')
        .length
    ).toBeGreaterThan(1)
    expect(snapshot(draw)).toEqual(snapshot(full))
    layout.mockClear()
    for (const target of [draw, full]) {
      target.getOptions().scale = 1.4
      splice(target, 5, 0, 'ب')
    }
    expect(
      layout.mock.calls.filter(([input]) => input.source.scope === 'main')
        .length
    ).toBeGreaterThan(1)
    expect(snapshot(draw)).toEqual(snapshot(full))
    layout.mockClear()
    draw.getLayoutHostAdapter().invalidate()
    full.getLayoutHostAdapter().invalidate()
    splice(draw, 5, 0, 'ج')
    splice(full, 5, 0, 'ج')
    expect(
      layout.mock.calls.filter(([input]) => input.source.scope === 'main')
        .length
    ).toBeGreaterThan(1)
    expect(snapshot(draw)).toEqual(snapshot(full))
  })

  it('matches keyboard input and undo/redo, then resumes reuse', async () => {
    const draw = await setup(documentData(5), true)
    const full = await setup(documentData(5), false)
    const adapter = draw.getLayoutHostAdapter()
    const layout = vi.spyOn(adapter.getTextLayoutService(), 'layoutParagraph')
    for (const target of [draw, full]) {
      target.getHistoryManager().recovery()
      target.submitHistory(20)
    }
    for (const key of ['input', 'Enter', 'Backspace', 'Delete']) {
      layout.mockClear()
      for (const target of [draw, full]) {
        target.getRange().setRange(20, 20)
        target
          .getPosition()
          .setCursorPosition(target.getPosition().getPositionList()[20])
        if (key === 'input') {
          target.getCanvasEvent().input('مرحبا')
        } else {
          target.getCanvasEvent().keydown(new KeyboardEvent('keydown', { key }))
        }
      }
      expect(snapshot(draw), key).toEqual(snapshot(full))
      expect(
        layout.mock.calls.filter(([input]) => input.source.scope === 'main')
          .length
      ).toBeGreaterThan(0)
      expect(
        layout.mock.calls.filter(([input]) => input.source.scope === 'main')
          .length
      ).toBeLessThan(5)
    }
    for (const action of ['undo', 'redo'] as const) {
      draw.getHistoryManager()[action]()
      full.getHistoryManager()[action]()
      expect(snapshot(draw), action).toEqual(snapshot(full))
    }
    layout.mockClear()
    splice(draw, 5, 0, 'ع')
    splice(full, 5, 0, 'ع')
    expect(snapshot(draw)).toEqual(snapshot(full))
    expect(
      layout.mock.calls.filter(([input]) => input.source.scope === 'main')
        .length
    ).toBeGreaterThan(0)
    expect(
      layout.mock.calls.filter(([input]) => input.source.scope === 'main')
        .length
    ).toBeLessThan(5)
  })

  it.each(['image', 'list', 'column'])(
    'falls back for %s layout',
    async structure => {
      const data = documentData(3)
      if (structure === 'image') {
        data.splice(2, 0, {
          id: 'inline-image',
          type: ElementType.IMAGE,
          value: '',
          width: 20,
          height: 20
        })
      } else if (structure === 'list') {
        data[0].listId = 'list'
        data[0].listType = ListType.OL
      }
      const extra = structure === 'column' ? { column: { count: 2 } } : {}
      const draw = await setup(structuredClone(data), true, extra)
      const full = await setup(structuredClone(data), false, extra)
      const scan = vi.spyOn(draw.getLayoutHostAdapter(), 'scanParagraphs')
      splice(draw, 5, 0, 'ب')
      splice(full, 5, 0, 'ب')
      expect(snapshot(draw)).toEqual(snapshot(full))
      expect(scan.mock.calls[0][2]).toBe(0)
    }
  )

  it('invalidates missing glyph nodes when fonts arrive, then resumes reuse', async () => {
    const draw = await setup(documentData(4), true, { fonts: [] })
    const full = await setup(documentData(4), false, { fonts: [] })
    expect(
      draw
        .getLayoutRowList()
        .some(row =>
          row.nativeLine?.inlines.some(item => item.kind === 'missingGlyph')
        )
    ).toBe(true)
    for (const target of [draw, full]) {
      await target.registerFonts([
        { family: 'Noto Naskh Arabic', data: fontData }
      ])
      render(target)
    }
    expect(snapshot(draw)).toEqual(snapshot(full))
    expect(
      draw
        .getLayoutRowList()
        .some(row =>
          row.nativeLine?.inlines.some(item => item.kind === 'missingGlyph')
        )
    ).toBe(false)
    const layout = vi.spyOn(
      draw.getLayoutHostAdapter().getTextLayoutService(),
      'layoutParagraph'
    )
    splice(draw, 8, 0, 'abc')
    splice(full, 8, 0, 'abc')
    expect(snapshot(draw)).toEqual(snapshot(full))
    expect(
      layout.mock.calls.filter(([input]) => input.source.scope === 'main')
        .length
    ).toBeGreaterThan(0)
    expect(
      layout.mock.calls.filter(([input]) => input.source.scope === 'main')
        .length
    ).toBeLessThan(5)
  })

  it('handles empty paragraphs and boundary deletions', async () => {
    const data: IElement[] = [
      { value: '\n', spacingBefore: 4 },
      { value: '\n', spacingBefore: 8 },
      { value: 'مرحبا بالعالم' },
      { value: '2', type: ElementType.SUPERSCRIPT },
      { value: '\n', spacingAfter: 3 },
      { value: 'Hello العربية' },
      { value: '\n' }
    ]
    const draw = await setup(structuredClone(data), true)
    const full = await setup(structuredClone(data), false)
    for (const [start, count, text] of [
      [2, 1, ''],
      [1, 0, ZERO + ZERO],
      [3, 5, 'ب'],
      [1, 1000, ''],
      [1, 0, 'عالم' + ZERO + 'آخر']
    ] as const) {
      splice(draw, start, count, text)
      splice(full, start, count, text)
      expect(snapshot(draw)).toEqual(snapshot(full))
    }
  })
})
