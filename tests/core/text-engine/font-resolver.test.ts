import { BASIC_FONT_MANIFEST } from '@/editor/core/text-engine/font/basicFontManifest'
import { FontManager } from '@/editor/core/text-engine/font/FontManager'
import { HarfBuzzTextShaper } from '@/editor/core/text-engine/shape/HarfBuzzTextShaper'
import { TextScript } from '@/editor/dataset/enum/TextScript'
import { readFileSync } from 'node:fs'
import opentype from 'opentype.js'
import { afterEach, describe, expect, it, vi } from 'vitest'

function file(name: string) {
  const bytes = readFileSync(`public/fonts/${name}-Regular.ttf`)
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length)
}
const arabic = file('NotoNaskhArabic')
const deva = file('NotoSansDevanagari')
const managers: FontManager[] = []
const style = { fontFamily: 'Primary', fontSize: 18 }

function manager(onChange?: () => void) {
  const value = new FontManager(onChange)
  managers.push(value)
  return value
}

/** Small real OpenType fonts make supplementary/sequence gaps deterministic. */
function font(characters: string[]) {
  const path = new opentype.Path()
  path.moveTo(0, 0)
  path.lineTo(400, 0)
  path.lineTo(200, 700)
  path.close()
  const glyphs = [
    new opentype.Glyph({ name: '.notdef', advanceWidth: 500, path })
  ]
  for (const character of characters)
    glyphs.push(
      new opentype.Glyph({
        name: `u${character.codePointAt(0)!.toString(16)}`,
        unicode: character.codePointAt(0),
        advanceWidth: 500,
        path
      })
    )
  return new opentype.Font({
    familyName: 'Test',
    styleName: 'Regular',
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    glyphs
  }).toArrayBuffer()
}

afterEach(() => {
  managers.forEach(value => value.destroy())
  managers.length = 0
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('font registration and coverage resolution', () => {
  it('keeps distinct same-family fragments and deduplicates identical content', async () => {
    const changed = vi.fn()
    const value = manager(changed)
    const firstData = font(['A'])
    const first = await value.registerFace({
      family: 'Primary',
      data: firstData
    })
    const second = await value.registerFace({
      family: 'Primary',
      data: font(['B'])
    })
    expect(first.status).toBe('registered')
    expect(second.status).toBe('registered')
    expect(value.getFaces()).toHaveLength(2)
    expect(value.getFaces()[0].faceId).not.toBe(value.getFaces()[1].faceId)
    expect(value.resolve(style, 'A').covered).toBe(true)
    expect(value.resolve(style, 'B').covered).toBe(true)
    const duplicate = await value.registerFace({
      family: 'Primary',
      data: firstData.slice(0)
    })
    expect(duplicate.status).toBe('duplicate')
    expect(value.getRevision()).toBe(2)
    expect(changed).toHaveBeenCalledTimes(2)
  })

  it.each(
    BASIC_FONT_MANIFEST.map((face, index) => ({
      ...face,
      sample: ['مرحبا', 'नमस्ते', 'สวัสดี'][index]
    }))
  )(
    'validates the self-hosted basic face $family with actual HB coverage',
    async face => {
      const value = manager()
      const bytes = readFileSync(`public/fonts/${face.fileName}`)
      const data = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.length
      )
      await value.init([
        { family: face.family, data, scripts: [...face.scripts] }
      ])
      expect(
        value.resolve({ ...style, fontFamily: face.family }, face.sample)
          .covered
      ).toBe(true)
      expect(value.getPlaceholderMetrics(style).advance).toBeGreaterThan(0)
    }
  )

  it('coalesces concurrent registration of identical binaries', async () => {
    const value = manager()
    const results = await Promise.all([
      value.registerFace({ family: 'Primary', data: arabic }),
      value.registerFace({ family: 'Primary', data: arabic.slice(0) })
    ])
    expect(results.map(result => result.status)).toEqual([
      'registered',
      'duplicate'
    ])
    expect(value.getRevision()).toBe(1)
    expect(value.getFaces()).toHaveLength(1)
  })

  it('owns input bytes and returns detached registration metadata', async () => {
    const value = manager()
    const data = arabic.slice(0)
    const pending = value.registerFace({ family: 'Primary', data })
    new Uint8Array(data).fill(0)
    const result = await pending
    expect(result.status).toBe('registered')
    const faces = value.getFaces()
    faces[0].family = 'changed'
    faces[0].scripts.push(TextScript.THAI)
    expect(value.getFaces()[0].family).toBe('Primary')
    expect(value.getFaces()[0].scripts).toEqual([])
  })

  it('uses a covering fallback before reporting a preferred-family gap', async () => {
    const value = manager()
    await value.init([
      { family: 'Primary', data: deva },
      { family: 'Arabic fallback', data: arabic }
    ])
    const result = value.resolve(style, 'مرحبا')
    expect(result.status).toBe('covered')
    expect(result.font?.ref.family).toBe('Arabic fallback')
    expect(result.attemptedFaces).toHaveLength(2)
    expect(result.missingCharacters).toEqual([])
  })

  it('prioritizes script-tagged fonts and honors fallback opt-out', async () => {
    const value = manager()
    await value.init([
      { family: 'Other', data: arabic },
      { family: 'Preferred Arabic', data: arabic, scripts: [TextScript.ARAB] },
      { family: 'Private', data: font(['𠀀']), fallback: false }
    ])
    expect(value.resolve(style, 'مرحبا').font?.ref.family).toBe(
      'Preferred Arabic'
    )
    expect(value.resolve(style, '𠀀').covered).toBe(false)
    expect(
      value.resolve({ ...style, fontFamily: 'Private' }, '𠀀').covered
    ).toBe(true)
  })

  it('reports missing style separately without synthesizing a bold/italic face', async () => {
    const value = manager()
    await value.init([{ family: 'Primary', data: arabic }])
    const result = value.resolve(
      { ...style, bold: true, italic: true },
      'مرحبا'
    )
    expect(result.covered).toBe(true)
    expect(result.styleMatched).toBe(false)
    expect(result.reason).toBe('missingStyle')
    expect(result.font?.ref).toMatchObject({ weight: 400, style: 'normal' })
    await value.registerFace({
      family: 'Primary',
      data: arabic,
      weight: 700,
      style: 'italic'
    })
    expect(
      value.resolve({ ...style, bold: true, italic: true }, 'مرحبا')
    ).toMatchObject({ covered: true, styleMatched: true })
  })

  it('uses a covering exact-style fallback before a mismatched preferred face', async () => {
    const value = manager()
    await value.init([
      { family: 'Primary', data: arabic },
      { family: 'Bold fallback', data: arabic, weight: 700 }
    ])
    const result = value.resolve({ ...style, bold: true }, 'مرحبا')
    expect(result.styleMatched).toBe(true)
    expect(result.reason).toBeUndefined()
    expect(result.font?.ref).toMatchObject({
      family: 'Bold fallback',
      weight: 700
    })
    expect(value.resolve(style, 'مرحبا').font?.ref.family).toBe('Primary')
  })

  it('does not split combining clusters across two partially covering fonts', async () => {
    const value = manager()
    await value.init([
      { family: 'Primary', data: font(['a']) },
      { family: 'Mark only', data: font(['́']) }
    ])
    const runs = value.resolveText(style, 'á')
    expect(runs).toHaveLength(1)
    expect(runs[0].resolution).toMatchObject({
      status: 'missing',
      reason: 'missingSequence'
    })
    await value.registerFace({ family: 'Complete', data: font(['a', '́']) })
    expect(value.resolveText(style, 'á')[0].resolution.font?.ref.family).toBe(
      'Complete'
    )
  })

  it('switches the whole Arabic joining context instead of individual letters', async () => {
    const value = manager()
    await value.init([
      { family: 'Primary', data: font(['م']) },
      { family: 'Arabic', data: arabic }
    ])
    const runs = value.resolveText(style, 'مرحبا')
    expect(value.resolveText(style, 'م‍رحبا')).toHaveLength(1)
    expect(runs).toHaveLength(1)
    expect(runs[0].text).toBe('مرحبا')
    expect(runs[0].resolution.font?.ref.family).toBe('Arabic')
  })

  it('keeps covered preferred text when other script context needs a fallback', async () => {
    const value = manager()
    await value.init([
      { family: 'Primary', data: font(['A']) },
      { family: 'Arabic', data: arabic }
    ])
    const runs = value.resolveText(style, 'Aمرحبا')
    expect(runs.map(run => run.text)).toEqual(['A', 'مرحبا'])
    expect(runs.map(run => run.resolution.font?.ref.family)).toEqual([
      'Primary',
      'Arabic'
    ])
  })

  it('uses Unicode scalars for supplementary glyphs and gaps', async () => {
    const value = manager()
    await value.init([{ family: 'Primary', data: font(['𠀀']) }])
    expect(value.resolve(style, '𠀀').covered).toBe(true)
    expect(value.resolve(style, '𠀁').missingCharacters).toEqual(['𠀁'])
    const missing = value.resolveText(style, '𠀁')[0]
    expect([missing.start, missing.end]).toEqual([0, 2])
  })

  it('does not report whitespace/format controls as missing ink', async () => {
    const value = manager()
    await value.init([])
    for (const text of [' ', '\n', '\u2066\u2069', '\u200d']) {
      expect(value.resolve(style, text)).toMatchObject({
        status: 'ignored',
        covered: true
      })
    }
    expect(value.resolve(style, 'A')).toMatchObject({ reason: 'missingFace' })
  })

  it('does not call browser measurement to determine font coverage', async () => {
    const value = manager()
    await value.init([{ family: 'Primary', data: arabic }])
    const measure = vi.spyOn(CanvasRenderingContext2D.prototype, 'measureText')
    expect(value.resolve(style, 'مرحبا').covered).toBe(true)
    expect(measure).not.toHaveBeenCalled()
  })

  it('checks actual shaping and rejects unsupported ZWJ/variation sequences', async () => {
    const value = manager()
    await value.init([
      { family: 'Primary', data: font(['👨', '👩', '🇨', '🇳']) }
    ])
    expect(value.resolve(style, '👨‍👩')).toMatchObject({
      covered: false,
      reason: 'missingSequence'
    })
    expect(value.resolve(style, '🇨🇳')).toMatchObject({
      covered: false,
      reason: 'missingSequence'
    })
    expect(value.resolve(style, '👨️')).toMatchObject({
      covered: false,
      reason: 'missingSequence'
    })
  })

  it('distinguishes glyph backend failure from missing characters', async () => {
    const value = manager()
    await value.init([{ family: 'Primary', data: arabic }])
    const selected = value.getFont(style)!
    vi.spyOn(selected.otFont.glyphs, 'get').mockImplementation(() => {
      throw new Error('Outline format unsupported')
    })
    expect(value.resolve(style, 'مرحبا')).toMatchObject({
      covered: false,
      reason: 'unsupportedGlyphFormat',
      missingCharacters: []
    })
  })

  it('invalidates negative coverage when fonts change and supplies actual face refs to HB', async () => {
    const value = manager()
    await value.init([{ family: 'Primary', data: deva }])
    expect(value.resolve(style, 'مرحبا').covered).toBe(false)
    await value.registerFace({ family: 'Arabic', data: arabic })
    expect(value.resolve(style, 'مرحبا').covered).toBe(true)
    const glyphs = new HarfBuzzTextShaper(value).shape({
      text: 'مرحبا',
      textStart: 5,
      textEnd: 10,
      direction: 'rtl',
      style,
      logicalIndexAt: offset => offset
    })
    expect(glyphs.some(glyph => glyph.pathData)).toBe(true)
    expect(glyphs.every(glyph => glyph.font?.family === 'Arabic')).toBe(true)
    expect(
      glyphs.every(glyph => glyph.font?.fontRevision === value.getRevision())
    ).toBe(true)
    expect(Math.min(...glyphs.map(glyph => glyph.charStart))).toBe(5)
  })

  it('keeps explicit placeholder geometry and .notdef metrics separate from real text', async () => {
    const value = manager()
    expect(value.getPlaceholderMetrics(style)).toMatchObject({
      source: 'box',
      font: null
    })
    await value.init([{ family: 'Primary', data: arabic }])
    expect(value.getPlaceholderMetrics(style).source).toBe('notdef')
    expect(value.getPlaceholderMetrics(style).advance).toBeGreaterThan(0)
    const selected = value.getFont(style)!
    vi.spyOn(selected.otFont.glyphs, 'get').mockReturnValueOnce(
      new opentype.Glyph({
        name: '.notdef',
        advanceWidth: 500,
        path: new opentype.Path()
      })
    )
    // A different size requests a fresh outline rather than the cached .notdef.
    expect(value.getPlaceholderMetrics({ ...style, fontSize: 19 }).source).toBe(
      'box'
    )
  })

  it('distinguishes fetch, invalid binary and compressed-format failures', async () => {
    const value = manager()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 404 }))
    )
    expect(
      await value.registerFace({ family: 'Network', url: '/missing.ttf' })
    ).toMatchObject({
      status: 'failed',
      failure: { stage: 'fetch', reason: 'fetchFailed' }
    })
    expect(
      await value.registerFace({ family: 'Invalid', data: new ArrayBuffer(2) })
    ).toMatchObject({
      status: 'failed',
      failure: { stage: 'parse', reason: 'invalidData' }
    })
    const compressed = new Uint8Array([0x77, 0x4f, 0x46, 0x32]).buffer
    expect(
      await value.registerFace({ family: 'WOFF2', data: compressed })
    ).toMatchObject({
      status: 'failed',
      failure: { stage: 'decode', reason: 'invalidData' }
    })
    expect(value.getRevision()).toBe(0)
    expect(value.getFailures()).toHaveLength(3)
  })
})
