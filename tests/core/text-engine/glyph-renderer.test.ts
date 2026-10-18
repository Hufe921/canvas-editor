import { BidiResolver } from '@/editor/core/text-engine/bidi/BidiResolver'
import { FontCoverageTracker } from '@/editor/core/text-engine/font/FontCoverageTracker'
import { FontManager } from '@/editor/core/text-engine/font/FontManager'
import { TextLayoutEngine } from '@/editor/core/text-engine/layout/TextLayoutEngine'
import { GlyphRenderer } from '@/editor/core/text-engine/render/GlyphRenderer'
import { HarfBuzzTextShaper } from '@/editor/core/text-engine/shape/HarfBuzzTextShaper'
import type { ShapedGlyph } from '@/editor/core/text-engine/types'
import { readFileSync } from 'node:fs'
import opentype from 'opentype.js'
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi
} from 'vitest'

const samples = [
  ['Latin', 'office AV', 'tests/fixtures/fonts/NotoSans-Latin-Regular.woff2'],
  ['CJK', '中文汉字', 'tests/fixtures/fonts/NotoSansSC-Regular.woff2'],
  ['Arabic', 'مرحبا', 'public/fonts/NotoNaskhArabic-Regular.ttf'],
  ['Deva', 'नमस्ते', 'public/fonts/NotoSansDevanagari-Regular.ttf'],
  ['Thai', 'สวัสดี', 'public/fonts/NotoSansThai-Regular.ttf']
]
const managers: FontManager[] = []
async function manager() {
  const fm = new FontManager()
  managers.push(fm)
  await fm.init(
    samples.map(([family, , path]) => ({
      family,
      data: new Uint8Array(readFileSync(path)).buffer
    }))
  )
  return fm
}
let fm: FontManager
beforeAll(async () => {
  fm = await manager()
})
afterAll(() => managers.forEach(value => value.destroy()))
afterEach(() => vi.restoreAllMocks())
function layout(value: FontManager, text: string, family = 'Latin') {
  const engine = new TextLayoutEngine(
    new BidiResolver(),
    new HarfBuzzTextShaper(value)
  )
  return engine.layoutParagraph({
    spans: [
      {
        text,
        logicalIndex: 0,
        style: { fontFamily: family, fontSize: 20, color: '#e00000' }
      }
    ],
    availableWidth: 500,
    direction: family === 'Arabic' ? 'rtl' : 'ltr',
    align: 'left',
    lineHeight: 30
  })
}
function outline(value: FontManager, glyph: ShapedGlyph) {
  return (
    glyph.font &&
    value.getGlyphOutlineByRef(glyph.font, glyph.glyphId, glyph.style.fontSize)
  )
}
function guardedContext() {
  const ctx = document.createElement('canvas').getContext('2d')!
  vi.spyOn(ctx, 'fillText').mockImplementation(() => {
    throw new Error('Browser text painting used')
  })
  vi.spyOn(ctx, 'measureText').mockImplementation(() => {
    throw new Error('Browser metrics used')
  })
  return ctx
}

describe('HB glyph outline painting', () => {
  it.each(samples)(
    'paints %s using its shaped outlines and HB positions',
    (family, text) => {
      const result = layout(fm, text, family)
      const ctx = guardedContext()
      const translate = vi.spyOn(ctx, 'translate')
      const fill = vi.spyOn(ctx, 'fill')
      const line = result.lines[0]
      new GlyphRenderer(fm).drawLine(
        ctx,
        line,
        15,
        60,
        'a different source must not be reshaped'
      )
      const painted = line.glyphs.filter(
        g => outline(fm, g)?.status === 'ready'
      )
      expect(fill).toHaveBeenCalledTimes(painted.length)
      expect(translate.mock.calls).toEqual(
        painted.map(g => [15 + g.left + g.dx, 60 - g.dy])
      )
      expect(painted.every(g => g.font?.family === family)).toBe(true)
      expect(
        painted.every(
          g => outline(fm, g)!.bounds!.x2 > outline(fm, g)!.bounds!.x1
        )
      ).toBe(true)
      expect(ctx.fillText).not.toHaveBeenCalled()
      expect(ctx.measureText).not.toHaveBeenCalled()
    }
  )

  it('paints zero-advance marks and independent super/sub baselines, keeping context state', () => {
    const line = layout(fm, 'q\u0301').lines[0]
    expect(
      line.glyphs.some(g => g.ax === 0 && outline(fm, g)?.status === 'ready')
    ).toBe(true)
    const ctx = guardedContext()
    ctx.fillStyle = '#123456'
    const translated = vi.spyOn(ctx, 'translate')
    const colors: string[] = []
    vi.spyOn(ctx, 'fill').mockImplementation(() => {
      colors.push(ctx.fillStyle as string)
    })
    const renderer = new GlyphRenderer(fm)
    const base = line.glyphs[0]
    renderer.drawGlyph(
      ctx,
      {
        ...base,
        baselineShift: -10,
        style: { ...base.style, color: '#ff0000' }
      },
      5,
      40
    )
    renderer.drawGlyph(
      ctx,
      {
        ...base,
        baselineShift: 10,
        style: { ...base.style, color: '#0000ff' }
      },
      5,
      40
    )
    expect(translated.mock.calls).toEqual([
      [5 + base.left + base.dx, 30 - base.dy],
      [5 + base.left + base.dx, 50 - base.dy]
    ])
    expect(colors).toEqual(['#ff0000', '#0000ff'])
    expect(ctx.fillStyle).toBe('#123456')
    const fill = ctx.fill as ReturnType<typeof vi.fn>
    fill.mockClear()
    renderer.drawLine(ctx, line, 5, 40)
    expect(fill).toHaveBeenCalledTimes(line.glyphs.length)
  })

  it('paints CFF cubic outlines through the same backend', async () => {
    const path = new opentype.Path()
    path.moveTo(0, 0)
    path.curveTo(0, 700, 500, 700, 500, 0)
    path.close()
    const bytes = new opentype.Font({
      familyName: 'Cubic',
      styleName: 'Regular',
      unitsPerEm: 1000,
      ascender: 800,
      descender: -200,
      glyphs: [
        new opentype.Glyph({ name: '.notdef', advanceWidth: 500, path }),
        new opentype.Glyph({ name: 'A', unicode: 65, advanceWidth: 600, path })
      ]
    }).toArrayBuffer()
    const value = new FontManager()
    managers.push(value)
    await value.init([{ family: 'Cubic', data: bytes }])
    const result = layout(value, 'A', 'Cubic')
    const ctx = guardedContext()
    const cubic = vi.spyOn(ctx, 'bezierCurveTo')
    new GlyphRenderer(value).drawLine(ctx, result.lines[0], 0, 30)
    expect(cubic).toHaveBeenCalled()
    expect(result.lines[0].width).toBeCloseTo(12)
  })

  it('uses one outline/color for a cross-color ligature, and live colors without new outlines', () => {
    const engine = new TextLayoutEngine(
      new BidiResolver(),
      new HarfBuzzTextShaper(fm)
    )
    const result = engine.layoutParagraph({
      spans: [...'office'].map((text, i) => ({
        text,
        logicalIndex: i,
        style: {
          fontFamily: 'Latin',
          fontSize: 20,
          color: i === 2 ? '#ff0000' : '#0000ff'
        }
      })),
      availableWidth: 500,
      direction: 'ltr',
      align: 'left',
      lineHeight: 30
    })
    const ligature = result.lines[0].glyphs.find(
      g => g.charEnd - g.charStart === 3
    )!
    expect(ligature.style.color).toBe('#0000ff')
    const ctx = guardedContext()
    const fill = vi.spyOn(ctx, 'fill')
    new GlyphRenderer(fm).drawGlyph(ctx, ligature, 0, 30)
    new GlyphRenderer(fm).drawGlyph(
      ctx,
      { ...ligature, style: { ...ligature.style, color: '#00ff00' } },
      0,
      30
    )
    expect(fill).toHaveBeenCalledTimes(2)
    expect(ligature.style.color).toBe('#0000ff')
  })

  it('distinguishes empty whitespace, skipped objects and explicit missing boxes', () => {
    const renderer = new GlyphRenderer(fm)
    const ctx = guardedContext()
    const fill = vi.spyOn(ctx, 'fill')
    const base = layout(fm, ' ').lines[0].glyphs[0]
    expect(outline(fm, base)?.status).toBe('empty')
    renderer.drawGlyph(ctx, base, 0, 30)
    renderer.drawGlyph(
      ctx,
      { ...base, style: { ...base.style, objectWidth: 25 } },
      0,
      30
    )
    expect(fill).not.toHaveBeenCalled()
    const empty = new FontManager()
    managers.push(empty)
    const ignored = layout(empty, ' \n\u2066\u2069').lines[0]
    expect(ignored.glyphs.every(glyph => glyph.inkless)).toBe(true)
    renderer.drawLine(ctx, ignored, 0, 30)
    expect(fill).not.toHaveBeenCalled()
    const missing = layout(empty, '😀').lines[0]
    const box = vi.spyOn(ctx, 'strokeRect')
    renderer.drawLine(ctx, missing, 0, 30)
    expect(box).toHaveBeenCalledOnce()
    box.mockClear()
    fill.mockClear()
    // A usable .notdef is painted from the same registered face as its metrics.
    renderer.drawLine(ctx, layout(fm, '😀').lines[0], 0, 30)
    expect(fill).toHaveBeenCalledOnce()
    expect(box).not.toHaveBeenCalled()
  })

  it('reports COLR/SVG glyphs as unsupported while other glyphs in the face still work', async () => {
    const value = new FontManager()
    managers.push(value)
    await value.init([
      {
        family: 'Latin',
        data: new Uint8Array(readFileSync(samples[0][2])).buffer
      }
    ])
    const style = { fontFamily: 'Latin', fontSize: 20 }
    const font = value.getFont(style)!
    const glyphId = font.hbFont.nominalGlyph(65)!
    Reflect.set(font.otFont.tables, 'colr', {
      baseGlyphRecords: [{ glyphID: glyphId }]
    })
    const bId = font.hbFont.nominalGlyph(66)!
    Reflect.set(
      font.otFont.tables,
      'svg',
      new Map([[bId, new Uint8Array([1])]])
    )
    expect(value.resolve(style, 'A')).toMatchObject({
      reason: 'unsupportedGlyphFormat',
      covered: false,
      missingCharacters: []
    })
    expect(value.resolve(style, 'B').reason).toBe('unsupportedGlyphFormat')
    expect(value.resolve(style, 'C').covered).toBe(true)
    const bitmap = value.getFont({ ...style, fontSize: 21 })!
    bitmap.unsupportedColorTables = true
    const space = value.getGlyphOutline(bitmap, bitmap.hbFont.nominalGlyph(32)!)
    expect(space.status).toBe('empty')
    expect(value.getGlyphOutline(bitmap, glyphId).status).toBe('unsupported')

    const tracker = new FontCoverageTracker()
    tracker.update(
      tracker.begin(),
      [
        {
          text: 'A',
          style,
          direction: 'ltr',
          positions: [
            {
              scope: 'main',
              nodeId: '1',
              start: 0,
              end: 1,
              textStart: 0,
              textEnd: 1
            }
          ]
        }
      ],
      value,
      false
    )
    expect(tracker.getReport().issues[0].reason).toBe('unsupportedGlyphFormat')
    expect(layout(value, 'A').lines[0].glyphs[0].missing).toBeTruthy()
  })

  it('classifies color-only font registration as an unsupported backend rather than missing data', async () => {
    const bytes = new Uint8Array(
      readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
    )
    const view = new DataView(bytes.buffer)
    let changed = false
    for (let i = 0; i < view.getUint16(4); i++) {
      const start = 12 + i * 16
      if (new TextDecoder().decode(bytes.slice(start, start + 4)) === 'glyf') {
        // Simulate a bitmap-only sfnt directory while retaining real cmap/metrics.
        bytes.set(new TextEncoder().encode('sbix'), start)
        changed = true
      }
    }
    expect(changed).toBe(true)
    const value = new FontManager()
    managers.push(value)
    await value.init([])
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await value.registerFace({
      family: 'ColorOnly',
      data: bytes.buffer
    })
    expect(result).toMatchObject({
      status: 'failed',
      failure: { reason: 'unsupportedGlyphFormat' }
    })
    expect(
      value.resolve({ fontFamily: 'ColorOnly', fontSize: 20 }, 'A').reason
    ).toBe('unsupportedGlyphFormat')
  })

  it('reuses immutable face/glyph/size outlines and evicts old entries', async () => {
    const value = await manager()
    const font = value.getFont({ fontFamily: 'CJK', fontSize: 20 })!
    const outline = value.getGlyphOutline(font, 1)
    expect(value.getGlyphOutline(font, 1)).toBe(outline)
    expect(Object.isFrozen(outline.commands)).toBe(true)
    for (let id = 2; id < 1200; id++) value.getGlyphOutline(font, id)
    expect(value.getGlyphOutline(font, 1)).not.toBe(outline)
    const large = value.getFont({ fontFamily: 'CJK', fontSize: 40 })!
    const id = font.hbFont.nominalGlyph(0x4e2d)!
    const smallBounds = value.getGlyphOutline(font, id).bounds!
    const largeBounds = value.getGlyphOutline(large, id).bounds!
    expect(largeBounds.x2).toBeCloseTo(smallBounds.x2 * 2)
  })
})
