import { ListParticle } from '@/editor/core/draw/particle/ListParticle'
import { LayoutHostAdapter } from '@/editor/core/text-engine-host/LayoutHostAdapter'
import { collectListMarkers } from '@/editor/core/text-engine-host/ListMarker'
import { ZERO } from '@/editor/dataset/constant/Common'
import {
  ControlComponent,
  ControlIndentation,
  ControlType
} from '@/editor/dataset/enum/Control'
import { ElementType } from '@/editor/dataset/enum/Element'
import { ListStyle, ListType } from '@/editor/dataset/enum/List'
import { RowFlex } from '@/editor/dataset/enum/Row'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'
import type { IElement } from '@/editor/interface/Element'
import { formatElementList, zipElementList } from '@/editor/utils/element'
import { mergeOption } from '@/editor/utils/option'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it } from 'vitest'

const data = new Uint8Array(
  readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
).buffer
const adapters: LayoutHostAdapter[] = []
afterEach(() => adapters.splice(0).forEach(adapter => adapter.destroy()))
async function setup(scale = 1) {
  const options = mergeOption({
    defaultFont: 'Arabic',
    defaultSize: 16,
    scale,
    autoDownloadFonts: false,
    fonts: [{ family: 'Arabic', data }]
  })
  const adapter = new LayoutHostAdapter(() => options)
  adapters.push(adapter)
  await adapter.ensureReady()
  return {
    options,
    adapter,
    layout(elements: IElement[], width = 300) {
      const paragraph = adapter.scanParagraphs(elements)[0]
      return {
        native: adapter.layoutParagraph(paragraph, elements, width * scale),
        rows: adapter.layoutParagraphToRows(
          paragraph,
          elements,
          width * scale,
          0
        )
      }
    }
  }
}
function control(
  value: string,
  flex = RowFlex.LEFT,
  minWidth = 160
): IElement[] {
  const meta = {
    type: ControlType.TEXT,
    value: null,
    minWidth,
    rowFlex: flex,
    indentation: ControlIndentation.VALUE_START,
    underline: true
  }
  return [
    ControlComponent.PREFIX,
    ControlComponent.VALUE,
    ControlComponent.POSTFIX
  ].map((component, i) => ({
    value: ['[', value, ']'][i],
    type: ElementType.CONTROL,
    controlId: 'c',
    control: meta,
    controlComponent: component
  }))
}

describe('T14 native controls, labels and list markers', () => {
  for (const scale of [0.75, 1, 2])
    for (const direction of [TextDirection.LTR, TextDirection.RTL]) {
      it(`reserves minWidth before wrapping, keeps source and zoom once: ${scale}/${direction}`, async () => {
        const { layout } = await setup(scale)
        const elements = [{ value: ZERO, direction }, ...control('abc')]
        const before = elements.map(e => ({ ...e }))
        const { native, rows } = layout(elements)
        expect(native.lines[0].rect.width).toBeCloseTo(160)
        expect(rows[0].width).toBeCloseTo(160 * scale)
        expect(
          native.lines[0].inlines.some(
            n => n.kind === 'inlineObject' && n.objectType === 'controlSpace'
          )
        ).toBe(true)
        expect(elements.map(e => e.value)).toEqual(before.map(e => e.value))
        expect(elements.some(e => e.isControlMinWidthPlaceholder)).toBe(false)
        expect(rows[0].elementList.every(e => e.left === 0)).toBe(true)
        const again = layout(elements).rows
        expect(again.map(r => r.engineLine)).toEqual(
          rows.map(r => r.engineLine)
        )
      })
    }
  it('positions CENTER/RIGHT content without changing HB glyphs or model values', async () => {
    const { layout } = await setup()
    const results = [RowFlex.LEFT, RowFlex.CENTER, RowFlex.RIGHT].map(
      flex => layout([{ value: ZERO }, ...control('abc', flex)]).native
    )
    const ink = results.map(
      result =>
        result.shaped.lines[0].glyphs.find(
          g => g.style.control?.component === 'value' && g.ax > 0
        )!
    )
    expect(ink[1].left).toBeGreaterThan(ink[0].left)
    expect(ink[2].left).toBeGreaterThan(ink[1].left)
    expect(ink.map(g => g.glyphId)).toEqual([
      ink[0].glyphId,
      ink[0].glyphId,
      ink[0].glyphId
    ])
    expect(results.map(r => r.lines[0].rect.width)).toEqual([160, 160, 160])
  })
  it('wraps long control values within VALUE_START inset and reserves multi-line minimums', async () => {
    const { layout } = await setup()
    const elements = [
      { value: ZERO },
      { value: 'label ' },
      ...control('long value '.repeat(12))
    ]
    const result = layout(elements, 100).native
    expect(result.lines.length).toBeGreaterThan(4)
    const shaped = result.shaped.lines
    const first = shaped[0].glyphs.find(
      g => g.style.control?.component === 'value'
    )!
    for (const line of shaped.slice(1)) {
      expect(line.inset).toBeCloseTo(first.left)
      expect(Math.max(...line.glyphs.map(g => g.right))).toBeLessThanOrEqual(
        100.01
      )
    }
    const wide = layout(
      [{ value: ZERO }, ...control('', RowFlex.LEFT, 450)],
      100
    ).native
    expect(wide.lines.length).toBeGreaterThan(3)
    expect(wide.lines.reduce((w, l) => w + l.rect.width, 0)).toBeCloseTo(450)
    const projected = layout(
      [{ value: ZERO }, ...control('', RowFlex.LEFT, 450)],
      100
    ).rows
    for (const row of projected) {
      const advance = row.elementList.reduce(
        (sum, element) => sum + element.metrics.width,
        0
      )
      expect(advance).toBeCloseTo(row.width)
    }
    const indented = layout(
      [
        { value: ZERO },
        { value: 'label ' },
        ...control('a', RowFlex.LEFT, 450)
      ],
      100
    ).native
    expect(
      indented.lines.every(line => line.rect.x + line.rect.width <= 100.01)
    ).toBe(true)
  })
  it('includes asymmetric label padding in wrapping/height and preserves RTL joining', async () => {
    const { layout } = await setup()
    for (const text of ['label', 'مرحبا']) {
      const plain = layout([{ value: ZERO }, { value: text }]).native
      const padded = layout([
        { value: ZERO },
        {
          value: text,
          type: ElementType.LABEL,
          label: { padding: [3, 7, 11, 13] }
        }
      ]).native
      expect(
        padded.lines[0].rect.width - plain.lines[0].rect.width
      ).toBeCloseTo(20)
      expect(
        padded.lines[0].contentHeight - plain.lines[0].contentHeight
      ).toBeCloseTo(14)
      expect(padded.shaped.lines[0].glyphs.map(g => g.glyphId)).toEqual(
        plain.shaped.lines[0].glyphs.map(g => g.glyphId)
      )
      const wrapped = layout(
        [
          { value: ZERO },
          { value: '123456' },
          {
            value: text,
            type: ElementType.LABEL,
            label: { padding: [3, 7, 11, 13] }
          }
        ],
        padded.lines[0].rect.width + 1
      ).native
      const lines = wrapped.lines.filter(
        l => l.source.end > 2 && l.source.start <= 2
      )
      expect(lines).toHaveLength(1)
    }
  })
  it('counts continuations once, reserves actual multi-digit marker widths at every zoom', async () => {
    for (const scale of [0.75, 2]) {
      const { adapter, options } = await setup(scale)
      const elements: IElement[] = []
      for (let i = 0; i < 101; i++)
        elements.push(
          {
            value: ZERO,
            listId: 'list',
            listType: ListType.OL,
            listStyle: ListStyle.DECIMAL,
            listLevel: i % 3
          },
          { value: 'item', listId: 'list' },
          { value: ZERO, listId: 'list', listWrap: true }
        )
      const markers = collectListMarkers(elements)
      expect(markers).toHaveLength(101)
      expect(markers[99].text).toBe('100.')
      const particle = new ListParticle({
        getOptions: () => options,
        getRange: () => ({}),
        getLayoutHostAdapter: () => adapter
      } as any)
      const widths = particle.computeNativeListStyle(elements)
      const max = Math.max(
        ...markers.map(
          m =>
            adapter.layoutListMarker(elements, m.anchor, m.text, 'ltr').lines[0]
              .rect.width
        )
      )
      expect(widths.get('list')).toBeCloseTo((max + 10) * scale)
      expect(particle.computeNativeListStyle([]).size).toBe(0)
    }
  })
  it('tracks missing control placeholder/value text against original source and drops old fillers', async () => {
    const { adapter, options } = await setup()
    const elements: IElement[] = [{ value: ZERO }, ...control('字')]
    elements[2].controlComponent = ControlComponent.PLACEHOLDER
    const inputs = adapter.collectFontCoverage([{ scope: 'main', elements }])
    const missing = inputs.find(input => input.text.includes('字'))!
    expect(missing.positions[missing.text.indexOf('字')]).toMatchObject({
      start: 2,
      textStart: 0,
      textEnd: 1
    })
    elements.push({ value: '', isControlMinWidthPlaceholder: true })
    formatElementList(elements, { editorOptions: options })
    expect(elements.some(e => e.isControlMinWidthPlaceholder)).toBe(false)
    expect(JSON.stringify(zipElementList(elements))).not.toContain(
      'isControlMinWidthPlaceholder'
    )
  })
  it('uses control minimums for intrinsic cell measurement and collapses hidden controls', async () => {
    const { adapter, layout } = await setup(2)
    const elements: IElement[] = [{ value: ZERO }, ...control('a')]
    const paragraph = adapter.scanParagraphs(elements)[0]
    expect(adapter.measureParagraph(paragraph).width).toBeCloseTo(160)
    elements.slice(1).forEach(element => {
      element.control!.hide = true
    })
    const hidden = layout(elements).native
    expect(hidden.lines[0].hidden).toBe(true)
    expect(hidden.lines[0].rect.width).toBe(0)
    expect(
      hidden.lines[0].inlines.some(
        item =>
          item.kind === 'inlineObject' &&
          item.objectType === 'controlSpace' &&
          !item.hidden
      )
    ).toBe(false)
  })
  it('continues numbering by list identity across nested and wrapped items', () => {
    const elements: IElement[] = [
      { value: ZERO, listId: 'outer', listType: ListType.OL },
      { value: ZERO, listId: 'inner', listType: ListType.OL, listLevel: 1 },
      {
        value: ZERO,
        listId: 'inner',
        listType: ListType.OL,
        listLevel: 1,
        listWrap: true
      },
      { value: ZERO },
      { value: ZERO, listId: 'outer', listType: ListType.OL }
    ]
    expect(collectListMarkers(elements).map(marker => marker.text)).toEqual([
      '1.',
      '1.',
      '2.'
    ])
  })
})
