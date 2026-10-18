import { IncrementalParagraphComputer } from '@/editor/core/draw/IncrementalParagraphComputer'
import { LayoutHostAdapter } from '@/editor/core/text-engine-host/LayoutHostAdapter'
import { BidiResolver } from '@/editor/core/text-engine/bidi/BidiResolver'
import { FontManager } from '@/editor/core/text-engine/font/FontManager'
import { TextLayoutEngine } from '@/editor/core/text-engine/layout/TextLayoutEngine'
import {
  NativeParagraphInput,
  TextLayoutService
} from '@/editor/core/text-engine/layout/TextLayoutService'
import { HarfBuzzTextShaper } from '@/editor/core/text-engine/shape/HarfBuzzTextShaper'
import type { TextStyleProps } from '@/editor/core/text-engine/types'
import { ElementType } from '@/editor/dataset/enum/Element'
import type { IElement } from '@/editor/interface/Element'
import { mergeOption } from '@/editor/utils/option'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

const fonts = new FontManager()
const shaper = new HarfBuzzTextShaper(fonts)
const engine = new TextLayoutEngine(new BidiResolver(), shaper)
const service = new TextLayoutService(engine, fonts)
const fontData = new Uint8Array(
  readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
).buffer
beforeAll(async () => {
  await fonts.init([{ family: 'Arabic', data: fontData }])
})
afterAll(() => fonts.destroy())

function input(
  text: string,
  extra: Partial<NativeParagraphInput> = {}
): NativeParagraphInput {
  const style: TextStyleProps = {
    fontFamily: 'Arabic',
    fontSize: 20,
    rowMargin: 8
  }
  return {
    spans: [
      {
        text,
        logicalIndex: 2,
        logicalIndices: new Array(text.length).fill(2),
        style
      }
    ],
    source: { scope: 'main', nodeId: 'paragraph', start: 2, end: 3 },
    revision: { documentRevision: 3, fontRevision: fonts.getRevision() },
    positions: Array.from({ length: text.length }, (_, i) => ({
      start: 2,
      textStart: i,
      textEnd: i + 1
    })),
    emptyStyle: style,
    availableWidth: 100,
    direction: 'ltr',
    align: 'left',
    lineHeight: 20,
    wordBreak: 'break-all',
    ...extra
  }
}

describe('T11 native paragraph layout', () => {
  it('uses actual font extents, rowMargin, baseline shift and tracking without Canvas', () => {
    const canvas = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(() => {
        throw new Error('No Canvas metrics')
      })
    try {
      const base = input('abc')
      const natural = fonts.getLineMetrics(base.spans[0].style)
      const line = service.layoutParagraph(base).lines[0]
      expect(line.baseline).toBeCloseTo(
        natural.ascent + natural.lineGap / 2 + 8
      )
      expect(line.contentHeight).toBeCloseTo(
        natural.ascent + natural.descent + natural.lineGap + 16
      )
      base.spans[0].style.rowMargin = 0
      expect(service.layoutParagraph(base).lines[0].contentHeight).toBeCloseTo(
        line.contentHeight - 16
      )
      const width = service.measureText(base).width
      base.spans[0].style.letterSpacing = 3
      expect(service.measureText(base).width - width).toBeCloseTo(9)
      base.spans[0].style.scriptShift = 'super'
      expect(service.layoutParagraph(base).lines[0].baseline).toBeGreaterThan(
        natural.ascent
      )
    } finally {
      canvas.mockRestore()
    }
  })

  it('keeps Arabic joining across row-margin changes and measures the largest margin', () => {
    const request = input('مرحبا', { direction: 'rtl', align: 'left' })
    const normal = service.layoutParagraph(request)
    request.spans = [...'مرحبا'].map((text, index) => ({
      text,
      logicalIndex: 2,
      style: { ...request.emptyStyle, rowMargin: index === 2 ? 20 : 8 }
    }))
    const styled = service.layoutParagraph(request)
    expect(styled.shaped.lines[0].glyphs.map(g => g.glyphId)).toEqual(
      normal.shaped.lines[0].glyphs.map(g => g.glyphId)
    )
    expect(
      styled.lines[0].contentHeight - normal.lines[0].contentHeight
    ).toBeCloseTo(24)
  })

  it('emits an empty content box and insertion caret; paragraph spacing occurs once', () => {
    const result = service.layoutParagraph(
      input('', {
        spans: [],
        spacingBefore: 12,
        spacingAfter: 18,
        direction: 'rtl',
        align: 'right'
      })
    )
    expect(result.lines).toHaveLength(1)
    const line = result.lines[0]
    expect(line.empty).toBe(true)
    expect(line.rect.y).toBe(12)
    expect(line.rect.x).toBe(100)
    expect(line.contentHeight).toBeGreaterThan(0)
    expect(line.spacingAfter).toBe(18)
    expect(line.carets[0]).toMatchObject({
      x: 100,
      position: { elementIndex: 2, offset: 0 }
    })
    const multi = service.layoutParagraph(
      input('مرحبا بالعالم '.repeat(8), { spacingBefore: 12, spacingAfter: 18 })
    )
    expect(multi.lines.length).toBeGreaterThan(3)
    expect(multi.lines.reduce((sum, l) => sum + l.spacingBefore, 0)).toBe(12)
    expect(multi.lines.reduce((sum, l) => sum + l.spacingAfter, 0)).toBe(18)
    for (let i = 1; i < multi.lines.length; i++)
      expect(multi.lines[i].rect.y).toBeCloseTo(
        multi.lines[i - 1].rect.y + multi.lines[i - 1].contentHeight
      )
  })

  it('reshapes final narrow Arabic lines with the same HB IDs as isolated line runs', () => {
    const request = input('مرحبابالعالممرحبا', {
      availableWidth: 35,
      direction: 'rtl',
      align: 'right'
    })
    const result = service.layoutParagraph(request)
    expect(result.lines.length).toBeGreaterThan(2)
    for (const line of result.shaped.lines) {
      const text = result.shaped.paragraphText.slice(
        line.textStart,
        line.textEnd
      )
      const expected = engine.layoutParagraph(
        input(text, { direction: 'rtl', align: 'left', availableWidth: 10000 })
      ).lines[0]
      expect(line.glyphs.map(g => g.glyphId)).toEqual(
        expected.glyphs.map(g => g.glyphId)
      )
      expect(line.width).toBeLessThanOrEqual(35)
    }
  })

  it('retains whitespace, original source offsets and grapheme caret stops under BiDi/kashida', () => {
    const text = 'مرحبا بالعالم العربية، 123 ABC '.repeat(3)
    const result = service.layoutParagraph(
      input(text, {
        direction: 'rtl',
        align: 'justify',
        wordBreak: 'break-word',
        availableWidth: 130
      })
    )
    expect(result.shaped.paragraphText).toBe(text)
    const covered = new Set(
      result.shaped.lines.flatMap(l =>
        l.glyphs.flatMap(g =>
          Array.from(
            { length: g.charEnd - g.charStart },
            (_, i) => g.charStart + i
          )
        )
      )
    )
    expect(covered.size).toBe(text.length)
    expect(
      result.lines
        .flatMap(l => l.carets)
        .every(
          c => c.position.elementIndex === 2 && c.position.offset <= text.length
        )
    ).toBe(true)
    const combining = service.layoutParagraph(
      input('a\u0301😀', { availableWidth: 1 })
    )
    const offsets = combining.lines.flatMap(l =>
      l.carets.map(c => c.position.offset)
    )
    expect(offsets).not.toContain(1)
    expect(offsets).not.toContain(3)
    expect(offsets).toContain(4)
    expect(
      combining.lines
        .flatMap(l => l.inlines)
        .some(n => n.kind === 'missingGlyph')
    ).toBe(true)
  })

  it('keeps alignment, punctuation and scope coordinates consistent on long paragraphs', () => {
    const text = 'مرحبا، بالعالم! '.repeat(100)
    const result = service.layoutParagraph(
      input(text, {
        direction: 'rtl',
        align: 'right',
        availableWidth: 100,
        wordBreak: 'break-word',
        spacingBefore: 9
      })
    )
    expect(result.lines.length).toBeGreaterThan(50)
    result.lines.forEach((line, index) => {
      const shaped = result.shaped.lines[index]
      expect(line.rect.x).toBeCloseTo(100 - line.rect.width)
      expect(line.glyphs[0].x + line.rect.x).toBeCloseTo(shaped.glyphs[0].left)
      expect(line.glyphs.every(g => g.fontSize === 20)).toBe(true)
      expect(line.carets.every(c => c.y === line.rect.y)).toBe(true)
      expect(line.clusters.every(c => c.rect.y === line.rect.y)).toBe(true)
      expect(text.slice(shaped.textStart, shaped.textEnd).trim()).not.toMatch(
        /^[،!]/u
      )
    })
  })

  it('keeps objects typed, explicit element width atomic and hidden paragraphs collapsed', () => {
    const request = input('abcdef')
    request.spans[0].style.explicitWidth = 60
    request.availableWidth = 10
    const explicit = service.layoutParagraph(request)
    expect(explicit.lines).toHaveLength(1)
    expect(explicit.lines[0].rect.width).toBeCloseTo(60)
    const hidden = input('\uFFFC')
    hidden.spans[0].style = {
      ...hidden.spans[0].style,
      hidden: true,
      objectWidth: 0,
      objectHeight: 0
    }
    const collapsed = service.layoutParagraph({
      ...hidden,
      spacingBefore: 20,
      spacingAfter: 20
    }).lines[0]
    expect(collapsed.hidden).toBe(true)
    expect(
      collapsed.contentHeight + collapsed.spacingBefore + collapsed.spacingAfter
    ).toBe(0)
    expect(collapsed.glyphs).toHaveLength(0)
  })

  it('caches detached native nodes with complete rebasing and scope/font isolation', () => {
    const cache = new IncrementalParagraphComputer()
    const compute = vi.fn((value: NativeParagraphInput) =>
      service.layoutParagraph(value)
    )
    const base = input('a\u0301😀', {
      source: { scope: 'td:one', nodeId: 'paragraph', start: 2, end: 3 }
    })
    const first = cache.compute(base, compute)
    expect(first.lines.flatMap(line => line.inlines)).not.toHaveLength(0)
    // Consumers may place/mutate their result without poisoning reuse.
    first.lines[0].rect.x = 9999
    const shifted: NativeParagraphInput = {
      ...base,
      source: { ...base.source, start: 12, end: 13 },
      positions: base.positions.map(position => ({ ...position, start: 12 })),
      spans: base.spans.map(span => ({
        ...span,
        logicalIndex: 12,
        logicalIndices: span.logicalIndices?.map(() => 12)
      }))
    }
    const reused = cache.compute(shifted, compute)
    expect(compute).toHaveBeenCalledTimes(1)
    expect(reused).toEqual(service.layoutParagraph(shifted))
    const other = { ...shifted, source: { ...shifted.source, scope: 'td:two' } }
    cache.compute(other, compute)
    expect(compute).toHaveBeenCalledTimes(2)
    cache.releaseScope('td:one')
    cache.compute(other, compute)
    expect(compute).toHaveBeenCalledTimes(2)
    cache.compute(shifted, compute)
    expect(compute).toHaveBeenCalledTimes(3)
    cache.compute(
      {
        ...shifted,
        revision: { ...shifted.revision, fontRevision: 99 }
      },
      compute
    )
    expect(compute).toHaveBeenCalledTimes(4)
    cache.reset()
    cache.compute(other, compute)
    expect(compute).toHaveBeenCalledTimes(5)
  })

  it('normalizes zoom once at the host boundary, supports tabs, cache invalidation and empty rows', async () => {
    const options = mergeOption({
      autoDownloadFonts: false,
      scale: 2,
      defaultFont: 'Arabic',
      fonts: [{ family: 'Arabic', data: fontData }],
      defaultTabWidth: 32
    })
    const host = new LayoutHostAdapter(() => options)
    await host.ensureReady()
    try {
      const elements: IElement[] = [
        { value: '\u200B', spacingBefore: 5 },
        { value: 'ab', width: 40 },
        { value: '', type: ElementType.TAB },
        { value: '\u200B' }
      ]
      let paragraph = host.scanParagraphs(elements)[0]
      const native = host.layoutParagraph(paragraph, elements, 1000)
      expect(native.lines[0].rect.width).toBeCloseTo(72)
      expect(native.lines[0].inlines[0]).toMatchObject({
        kind: 'inlineObject',
        objectType: 'tab',
        advance: 32
      })
      expect(host.layoutParagraph(paragraph, elements, 1000)).toEqual(native)
      const rows = host.layoutParagraphToRows(paragraph, elements, 1000, 0)
      expect(rows[0].width).toBeCloseTo(144)
      expect(rows[0].elementList[0].value).toBe('\u200B')
      expect(rows[0].offsetY).toBe(10)
      elements[1].width = 70
      paragraph = host.scanParagraphs(elements)[0]
      expect(
        host.layoutParagraph(paragraph, elements, 1000).lines[0].rect.width
      ).toBeCloseTo(102)
      const mixed: IElement[] = [
        { value: '\u200B' },
        ...[...'مرحبا Hello 123 '.repeat(8)].map(value => ({ value }))
      ]
      const mixedParagraph = host.scanParagraphs(mixed)[0]
      const mixedRows = host.layoutParagraphToRows(
        mixedParagraph,
        mixed,
        180,
        0
      )
      const mapped = mixedRows
        .flatMap(row =>
          row.elementList
            .map(el => el.sourceIndex!)
            .filter(index => index !== 0)
        )
        .sort((a, b) => a - b)
      expect(mapped).toEqual(
        Array.from({ length: mixed.length - 1 }, (_, i) => i + 1)
      )
      const empty = host.scanParagraphs(elements)[1]
      expect(
        host.layoutParagraphToRows(empty, elements, 1000, 1)[0].height
      ).toBeGreaterThan(0)
      expect(
        host.layoutParagraph(empty, elements, 1000).lines[0].carets[0].position
          .elementIndex
      ).toBe(3)
    } finally {
      host.destroy()
    }
  })
})
