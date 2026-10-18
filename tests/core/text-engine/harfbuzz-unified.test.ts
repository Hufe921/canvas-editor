import { ElementBridge } from '@/editor/core/text-engine-host/ElementBridge'
import { BidiResolver } from '@/editor/core/text-engine/bidi/BidiResolver'
import { FontManager } from '@/editor/core/text-engine/font/FontManager'
import { TextLayoutEngine } from '@/editor/core/text-engine/layout/TextLayoutEngine'
import { HarfBuzzTextShaper } from '@/editor/core/text-engine/shape/HarfBuzzTextShaper'
import type { StyleRun, TextSpan } from '@/editor/core/text-engine/types'
import { ElementType } from '@/editor/dataset/enum/Element'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'
import { readFileSync } from 'node:fs'
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi
} from 'vitest'

const fm = new FontManager()
const shaper = new HarfBuzzTextShaper(fm)
const engine = new TextLayoutEngine(new BidiResolver(), shaper)
const samples = [
  {
    family: 'Latin',
    file: 'tests/fixtures/fonts/NotoSans-Latin-Regular.woff2',
    text: 'office AV',
    script: 'latn'
  },
  {
    family: 'CJK',
    file: 'tests/fixtures/fonts/NotoSansSC-Regular.woff2',
    text: '中文汉字',
    script: 'hani'
  },
  {
    family: 'Arabic',
    file: 'public/fonts/NotoNaskhArabic-Regular.ttf',
    text: 'مرحبا',
    script: 'arab'
  },
  {
    family: 'Deva',
    file: 'public/fonts/NotoSansDevanagari-Regular.ttf',
    text: 'नमस्ते',
    script: 'deva'
  },
  {
    family: 'Thai',
    file: 'public/fonts/NotoSansThai-Regular.ttf',
    text: 'สวัสดี',
    script: 'thai'
  }
]
function run(text: string, family = 'Latin', script?: string): StyleRun {
  return {
    text,
    script,
    direction: script === 'arab' ? 'rtl' : 'ltr',
    style: { fontFamily: family, fontSize: 20 },
    textStart: 7,
    textEnd: 7 + text.length,
    logicalIndexAt: offset => offset + 20
  }
}
function layout(spans: TextSpan[], width = 500) {
  return engine.layoutParagraph({
    spans,
    availableWidth: width,
    direction: 'ltr',
    align: 'left',
    lineHeight: 30,
    wordBreak: 'break-all'
  })
}
beforeAll(async () => {
  await fm.init(
    samples.map(sample => ({
      family: sample.family,
      data: new Uint8Array(readFileSync(sample.file)).buffer
    }))
  )
})
afterEach(() => vi.restoreAllMocks())
afterAll(() => fm.destroy())

describe('unified HarfBuzz shaping', () => {
  it.each(samples)('shapes $family with native glyphs', sample => {
    const glyphs = shaper.shape(run(sample.text, sample.family, sample.script))
    expect(glyphs.length).toBeGreaterThan(0)
    expect(glyphs.every(g => g.glyphId > 0 && !g.missing)).toBe(true)
  })

  it('applies tracking once per grapheme cluster', () => {
    const text = 'q\u0307b'
    const input = run(text)
    const plain = shaper.shape(input)
    const tracked = shaper.shape({
      ...input,
      style: { ...input.style, letterSpacing: 2 }
    })
    const clusters = new Set(plain.map(g => g.charStart))
    expect(plain.length).toBeGreaterThan(clusters.size)
    expect(
      tracked.reduce((s, g) => s + g.ax, 0) -
        plain.reduce((s, g) => s + g.ax, 0)
    ).toBeCloseTo(clusters.size * 2)
    const spans = [...text].map((text, i) => ({
      text,
      logicalIndex: i,
      style: {
        fontFamily: 'Latin',
        fontSize: 20,
        color: i === 1 ? '#f00' : '#000'
      }
    }))
    const runs = engine.getShapingRuns(spans, 'ltr')
    expect(runs).toHaveLength(1)
    expect(runs[0].text).toBe(text)
    const narrow = layout(spans, 1)
    const base = narrow.lines[0].glyphs
    expect(base.filter(g => g.charStart === 0)).toHaveLength(2)
    expect(narrow.lines[1].glyphs[0].charStart).toBe(2)
  })

  it('tracks spaces but not standalone default-ignorable controls', () => {
    const input = run('a a')
    const plain = shaper.shape(input)
    const tracked = shaper.shape({
      ...input,
      style: { ...input.style, letterSpacing: 2 }
    })
    expect(
      tracked.reduce((sum, glyph) => sum + glyph.ax, 0) -
        plain.reduce((sum, glyph) => sum + glyph.ax, 0)
    ).toBeCloseTo(6)
    const ignored = shaper.shape({
      ...run('\u2066\u2069'),
      style: { ...input.style, letterSpacing: 2 }
    })
    expect(ignored.reduce((sum, glyph) => sum + glyph.ax, 0)).toBe(0)
  })

  it('itemizes adjacent scripts while preserving common characters and UTF-16 offsets', () => {
    const text = 'office 中文 नमस्ते สวัสดี'
    const spans = [
      { text, logicalIndex: 1, style: { fontFamily: 'Latin', fontSize: 20 } }
    ]
    const runs = engine.getShapingRuns(spans, 'ltr')
    expect(runs.map(r => r.script)).toEqual(['latn', 'hani', 'deva', 'thai'])
    expect(runs.map(r => r.text).join('')).toBe(text)
    const glyphs = layout(spans).lines.flatMap(l => l.glyphs)
    expect(glyphs.every(g => !g.missing && g.font && g.glyphId > 0)).toBe(true)
    expect(new Set(glyphs.map(g => g.font?.family)).size).toBe(4)
  })

  it('reports unsupported text as placeholders without a browser fallback', () => {
    const glyphs = shaper.shape(run('𠀀😀'))
    expect(glyphs).toHaveLength(2)
    expect(glyphs.every(g => g.missing?.kind === 'missingGlyph')).toBe(true)
    expect(glyphs.map(g => [g.charStart, g.charEnd])).toEqual([
      [7, 9],
      [9, 11]
    ])
    expect(glyphs.every(g => g.ax > 0)).toBe(true)
    const empty = new FontManager()
    expect(
      new HarfBuzzTextShaper(empty).shape(run('abc'))[0].missing
    ).toBeTruthy()
    empty.destroy()
  })

  it('uses independent object advances with no font/shaper calls and scales bridge tracking', () => {
    const bridge = new ElementBridge()
    const paragraphs = bridge.scanParagraphs(
      [
        { value: 'a', letterSpacing: 2 },
        { value: '', type: ElementType.IMAGE, width: 30, height: 40 },
        { value: '', type: ElementType.CHECKBOX }
      ],
      {
        defaultDirection: TextDirection.LTR,
        defaultFont: 'Latin',
        defaultSize: 20,
        defaultColor: '#000',
        scale: 2
      }
    )
    expect(paragraphs[0].spans[0].style.letterSpacing).toBe(4)
    const objects = paragraphs[0].spans.slice(1)
    const shape = vi.spyOn(shaper, 'shape')
    const resolve = vi.spyOn(fm, 'resolveText')
    const result = layout(objects)
    expect(shape).not.toHaveBeenCalled()
    expect(resolve).not.toHaveBeenCalled()
    expect(result.lines[0].glyphs.map(g => g.ax)).toEqual([60, 48])
    expect(result.lines[0].ascent).toBeGreaterThanOrEqual(80)
    const zero = shaper.shape({
      ...run('\uFFFC'),
      style: { ...run('').style, objectWidth: 0 }
    })
    expect(zero[0].ax).toBe(0)
    expect(zero[0].missing).toBeUndefined()
  })
})
