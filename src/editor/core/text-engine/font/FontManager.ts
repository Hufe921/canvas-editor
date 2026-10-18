import { TextScript } from '../../../dataset/enum/TextScript'
import type { FontCoverageReason } from '../../../interface/FontCoverage'
import { EditorRuntimeError } from '../../EditorLifecycle'
import { harfBuzzRuntime } from '../HarfBuzzRuntime'
import { GlyphOutlineCache } from './GlyphOutline'
import {
  FontBinaryError,
  fontBinaryFormat,
  normalizeFontBinary
} from './fontBinary'
import {
  equalFontData,
  fontContentKey,
  fontContextUnits,
  isCoverageIgnorable,
  isVariationSelector,
  textScript
} from './fontCoverage'
import type { Face as HbFace, Font as HbFont } from 'harfbuzzjs'
import opentype, { Font as OtFont } from 'opentype.js'
import type {
  FontBinaryFormat,
  FontPlaceholderMetrics,
  FontRegistrationFailure,
  FontRegistrationResult,
  IEditorFontFace,
  RegisteredFontFace
} from '../../../interface/TextEngine'
import type { TextStyleProps } from '../types'

export interface FontInstance {
  key: string
  ref: import('../../../interface/Layout').LayoutFontRef
  hbFont: HbFont
  otFont: OtFont
  unitsPerEm: number
  size: number
  pxPerUnit: number
  unsupportedColorTables: boolean
}

interface FaceRecord {
  info: RegisteredFontFace
  face: HbFace
  ot: OtFont
  buffer: ArrayBuffer
  warnings: FontRegistrationFailure[]
}

export interface FontCoverageCheck {
  covered: boolean
  reason?: 'missingGlyph' | 'missingSequence' | 'unsupportedGlyphFormat'
  missingCharacters: string[]
  missingSequences: string[]
}

export interface FontResolveOptions {
  direction?: 'ltr' | 'rtl'
  script?: string
  language?: string
}

export interface FontResolution extends Omit<FontCoverageCheck, 'reason'> {
  reason?: FontCoverageReason
  status: 'covered' | 'ignored' | 'missing'
  font: FontInstance | null
  styleMatched: boolean
  attemptedFaces: string[]
  missingFace: boolean
}

export interface ResolvedFontRun {
  text: string
  start: number
  end: number
  resolution: FontResolution
}

export class FontManager {
  private fonts = new Map<string, FontInstance>()
  private faceCache = new Map<string, FaceRecord>()
  private pending = new Map<
    string,
    {
      buffer: ArrayBuffer
      promise: Promise<FontRegistrationResult>
    }
  >()
  private outlines = new GlyphOutlineCache()
  private coverage = new Map<string, FontCoverageCheck>()
  private failures = new Map<string, FontRegistrationFailure>()
  private ready = false
  private revision = 0
  private defaultFamily = 'sans-serif'
  private destroyed = false
  private controller = new AbortController()
  private documentFaces = new Set<FontFace>()

  constructor(private onChange?: () => void) {}

  isReady(): boolean {
    return this.ready && this.faceCache.size > 0
  }

  getRevision(): number {
    return this.revision
  }

  getFaces(): RegisteredFontFace[] {
    return [...this.faceCache.values()].map(({ info }) => ({
      ...info,
      scripts: [...info.scripts]
    }))
  }

  getFailures(): FontRegistrationFailure[] {
    return [...this.failures.values()].map(failure => ({ ...failure }))
  }

  async init(faces: IEditorFontFace[], defaultFamily?: string): Promise<void> {
    this.assertAlive()
    await harfBuzzRuntime.initialize()
    this.assertAlive()
    if (defaultFamily) this.defaultFamily = defaultFamily
    for (const face of faces) await this.registerFace(face)
    this.ready = true
  }

  async registerFace(
    input: IEditorFontFace,
    signal?: AbortSignal
  ): Promise<FontRegistrationResult> {
    this.assertActive(signal)
    if (!input || typeof input.family !== 'string') {
      return this.failed(
        { family: '' },
        'parse',
        'invalidDescriptor',
        'Font family must be a nonempty string'
      )
    }
    if (
      input.data &&
      Object.prototype.toString.call(input.data) !== '[object ArrayBuffer]'
    ) {
      return this.failed(
        input,
        'parse',
        'invalidData',
        'Font data must be an ArrayBuffer'
      )
    }
    // Own both descriptor and bytes before the first await.
    const face: IEditorFontFace = {
      ...input,
      family: input.family?.trim(),
      data: input.data?.slice(0),
      scripts: [...(input.scripts || [])]
    }
    await harfBuzzRuntime.initialize()
    this.assertActive(signal)
    if (
      !face.family ||
      !Number.isFinite(face.weight ?? 400) ||
      (face.weight ?? 400) < 1 ||
      (face.weight ?? 400) > 1000 ||
      (face.style && !['normal', 'italic'].includes(face.style))
    ) {
      return this.failed(
        face,
        'parse',
        'invalidDescriptor',
        'Invalid font descriptor'
      )
    }
    let buffer = face.data
    if (!buffer && face.url) {
      try {
        const response = await fetch(face.url, {
          signal: this.controller.signal
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        buffer = await response.arrayBuffer()
      } catch (error) {
        this.assertActive(signal)
        return this.failed(face, 'fetch', 'fetchFailed', String(error))
      }
    }
    this.assertActive(signal)
    if (!buffer) {
      return this.failed(
        face,
        'fetch',
        'missingData',
        'No font binary supplied'
      )
    }
    if (!buffer.byteLength) {
      return this.failed(face, 'parse', 'invalidData', 'Empty font binary')
    }
    const format = fontBinaryFormat(buffer)
    try {
      buffer = (await normalizeFontBinary(buffer, this.controller.signal)).data
      this.assertActive(signal)
    } catch (error) {
      this.assertActive(signal)
      return this.failed(
        face,
        format === 'woff' || format === 'woff2' ? 'decode' : 'parse',
        error instanceof FontBinaryError ? error.reason : 'invalidData',
        String(error),
        format
      )
    }
    const metadata = JSON.stringify([
      face.family.toLowerCase(),
      face.weight ?? 400,
      face.style ?? 'normal',
      face.resourceId || '',
      face.fallback !== false,
      [...new Set(face.scripts)].sort()
    ])
    const identity = `${metadata}:${fontContentKey(new Uint8Array(buffer))}`
    let key = identity
    // Hash collisions cannot make different binaries silently replace a face.
    for (
      let suffix = 1;
      this.faceCache.has(key) || this.pending.has(key);
      suffix++
    ) {
      const cached = this.faceCache.get(key)
      if (cached && equalFontData(cached.buffer, buffer)) {
        this.failures.delete(this.requestKey(face))
        return {
          status: 'duplicate',
          face: { ...cached.info, scripts: [...cached.info.scripts] },
          warnings: cached.warnings.map(warning => ({ ...warning }))
        }
      }
      const pending = this.pending.get(key)
      if (pending && equalFontData(pending.buffer, buffer)) {
        let result: FontRegistrationResult
        try {
          result = await pending.promise
        } catch (error) {
          this.assertActive(signal)
          if (error instanceof DOMException && error.name === 'AbortError')
            return this.registerFace(face, signal)
          throw error
        }
        this.assertActive(signal)
        return result.status === 'failed'
          ? { ...result, failure: { ...result.failure } }
          : {
              ...result,
              status: 'duplicate',
              face: { ...result.face, scripts: [...result.face.scripts] },
              warnings: [...result.warnings]
            }
      }
      key = `${identity}:${suffix}`
    }
    const registration = this.loadFace(face, buffer, key, format, signal)
    this.pending.set(key, { buffer, promise: registration })
    try {
      return await registration
    } finally {
      if (this.pending.get(key)?.promise === registration)
        this.pending.delete(key)
    }
  }

  private async loadFace(
    descriptor: IEditorFontFace,
    buffer: ArrayBuffer,
    key: string,
    format: FontBinaryFormat,
    signal?: AbortSignal
  ): Promise<FontRegistrationResult> {
    let ot: OtFont
    let face: HbFace
    try {
      const hb = harfBuzzRuntime.getModule()
      face = new hb.Face(new hb.Blob(buffer), 0)
      const hasOutlines = ['glyf', 'CFF ', 'CFF2'].some(
        tag => !!face.referenceTable(tag)?.length
      )
      const hasColor = ['COLR', 'SVG ', 'CBDT', 'sbix'].some(
        tag => !!face.referenceTable(tag)?.length
      )
      if (!hasOutlines && hasColor)
        return this.failed(
          descriptor,
          'parse',
          'unsupportedGlyphFormat',
          'Color-only font glyphs require an unsupported rendering backend',
          format
        )
      ot = opentype.parse(buffer)
      if (
        face.upem <= 0 ||
        !face.referenceTable('cmap')?.length ||
        !Number.isFinite(ot.unitsPerEm) ||
        ot.unitsPerEm <= 0
      ) {
        throw new Error('Font has no usable metrics or character map')
      }
    } catch (error) {
      return this.failed(
        descriptor,
        'parse',
        'invalidData',
        String(error),
        format
      )
    }
    const warnings: FontRegistrationFailure[] = []
    let documentFace: FontFace | null = null
    if (typeof FontFace !== 'undefined' && typeof document !== 'undefined') {
      try {
        documentFace = await new FontFace(descriptor.family, buffer, {
          weight: String(descriptor.weight ?? 400),
          style: descriptor.style ?? 'normal'
        }).load()
      } catch (error) {
        this.assertActive(signal)
        warnings.push({
          family: descriptor.family,
          stage: 'register',
          reason: 'browserRegistrationFailed',
          message: String(error),
          format
        })
      }
    }
    this.assertActive(signal)
    if (documentFace) {
      document.fonts.add(documentFace)
      this.documentFaces.add(documentFace)
    }
    const info: RegisteredFontFace = {
      faceId: key,
      family: descriptor.family,
      weight: descriptor.weight ?? 400,
      style: descriptor.style ?? 'normal',
      scripts: [...(descriptor.scripts || [])],
      fallback: descriptor.fallback !== false,
      resourceId: descriptor.resourceId || '',
      format,
      unitsPerEm: ot.unitsPerEm
    }
    this.faceCache.set(key, { face, ot, buffer, info, warnings })
    this.ready = true
    this.failures.delete(this.requestKey(descriptor))
    const browserFailureKey = `${this.requestKey(descriptor)}:document`
    if (warnings.length) {
      this.failures.set(browserFailureKey, warnings[0])
      if (this.failures.size > 256) {
        this.failures.delete(this.failures.keys().next().value!)
      }
    } else this.failures.delete(browserFailureKey)
    this.revision++
    this.fonts.clear()
    this.outlines.clear()
    this.coverage.clear()
    this.onChange?.()
    return {
      status: 'registered',
      face: { ...info, scripts: [...info.scripts] },
      warnings
    }
  }

  private requestKey(face: IEditorFontFace): string {
    return JSON.stringify([
      face.family,
      face.weight,
      face.style,
      face.resourceId,
      face.url
    ])
  }

  private failed(
    face: IEditorFontFace,
    stage: FontRegistrationFailure['stage'],
    reason: FontRegistrationFailure['reason'],
    message: string,
    format?: FontBinaryFormat
  ): FontRegistrationResult {
    const failure = { family: face.family, stage, reason, message, format }
    this.failures.set(this.requestKey(face), failure)
    if (this.failures.size > 256)
      this.failures.delete(this.failures.keys().next().value!)
    console.warn('[text-engine] Font load failed', face.family, stage, message)
    return { status: 'failed', failure }
  }

  private candidates(style: TextStyleProps, script: string): FaceRecord[] {
    const family = (style.fontFamily || this.defaultFamily).toLowerCase()
    const weight = style.bold ? 700 : 400
    const italic = style.italic ? 'italic' : 'normal'
    const rank = ({ info }: FaceRecord) => {
      const preferred = info.family.toLowerCase() === family
      const tagged = info.scripts.some(
        tag =>
          tag === script ||
          (script === TextScript.HANI && tag === TextScript.HANS)
      )
      const exact = info.weight === weight && info.style === italic
      return (preferred ? 0 : tagged ? 2 : 4) + (exact ? 0 : 1)
    }
    return [...this.faceCache.values()]
      .filter(
        ({ info }) => info.family.toLowerCase() === family || info.fallback
      )
      .sort((a, b) => rank(a) - rank(b))
  }

  private instance(record: FaceRecord, size: number): FontInstance {
    const key = `${record.info.faceId}:${size}`
    let font = this.fonts.get(key)
    if (!font) {
      const hbFont = new (harfBuzzRuntime.getModule().Font)(record.face)
      hbFont.setScale(record.face.upem, record.face.upem)
      font = {
        key,
        hbFont,
        otFont: record.ot,
        unitsPerEm: record.face.upem,
        size,
        pxPerUnit: size / record.face.upem,
        // Bitmap strikes and COLRv1 paints are not monochrome outline glyphs.
        unsupportedColorTables: !!(
          record.face.referenceTable('sbix')?.length ||
          record.face.referenceTable('CBDT')?.length ||
          (record.face.referenceTable('COLR')?.[1] || 0) > 0
        ),
        ref: {
          faceId: record.info.faceId,
          family: record.info.family,
          weight: record.info.weight,
          style: record.info.style,
          fontRevision: this.revision
        }
      }
      this.fonts.set(key, font)
      if (this.fonts.size > 256)
        this.fonts.delete(this.fonts.keys().next().value!)
    }
    return font
  }

  /** Compatibility for callers without text; coverage selection uses resolve. */
  getFont(style: TextStyleProps): FontInstance | null {
    const first = this.candidates(style, TextScript.ZYYY)[0]
    return first ? this.instance(first, style.fontSize) : null
  }

  checkCoverage(
    font: FontInstance,
    text: string,
    options: FontResolveOptions = {}
  ): FontCoverageCheck {
    const key = JSON.stringify([
      font.ref.faceId,
      text,
      options.direction,
      options.script,
      options.language
    ])
    const cached = this.coverage.get(key)
    if (cached)
      return {
        ...cached,
        missingCharacters: [...cached.missingCharacters],
        missingSequences: [...cached.missingSequences]
      }
    const missingCharacters: string[] = []
    const missingSequences: string[] = []
    let previous: number | undefined
    for (const scalar of text) {
      const cp = scalar.codePointAt(0)!
      if (cp >= 0xd800 && cp <= 0xdfff) missingSequences.push(scalar)
      else if (isVariationSelector(cp)) {
        if (
          previous === undefined ||
          !font.hbFont.variationGlyph(previous, cp)
        ) {
          missingSequences.push(text)
        }
      } else if (
        !isCoverageIgnorable(scalar) &&
        (!font.hbFont.nominalGlyph(cp) || !font.otFont.charToGlyphIndex(scalar))
      ) {
        missingCharacters.push(scalar)
      }
      if (!isCoverageIgnorable(scalar)) previous = cp
    }
    let reason: FontCoverageCheck['reason'] = missingCharacters.length
      ? 'missingGlyph'
      : missingSequences.length
        ? 'missingSequence'
        : undefined
    if (!reason && !isCoverageIgnorable(text)) {
      const hb = harfBuzzRuntime.getModule()
      const buffer = new hb.Buffer()
      try {
        buffer.addText(text)
        buffer.setFlags(hb.BufferFlag.REMOVE_DEFAULT_IGNORABLES)
        const requestedScript = options.script || textScript(text)
        const script =
          requestedScript === TextScript.HANS
            ? TextScript.HANI
            : requestedScript
        buffer.setDirection(
          (options.direction ||
            ([TextScript.ARAB, TextScript.HEBR].includes(script as TextScript)
              ? 'rtl'
              : 'ltr')) === 'rtl'
            ? hb.Direction.RTL
            : hb.Direction.LTR
        )
        if (options.language) buffer.setLanguage(options.language)
        if (
          ![TextScript.ZYYY, TextScript.ZZZZ, TextScript.ZSYE].includes(
            script as TextScript
          )
        )
          buffer.setScript(script)
        buffer.guessSegmentProperties()
        hb.shape(font.hbFont, buffer)
        const glyphs = buffer.getGlyphInfos()
        if (
          !glyphs.length ||
          glyphs.some(
            glyph =>
              !glyph.codepoint &&
              !isCoverageIgnorable(text.slice(glyph.cluster, glyph.cluster + 1))
          )
        ) {
          reason = 'missingSequence'
          missingSequences.push(text)
        } else if (
          fontContextUnits(text).some(unit => {
            const emojiSequence =
              /\u200d|\p{Emoji_Modifier}|\u20e3|[\u{e0020}-\u{e007f}]/u.test(
                unit.text
              ) || unit.text.match(/\p{Regional_Indicator}/gu)?.length === 2
            if (
              !emojiSequence ||
              !/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(
                unit.text
              )
            )
              return false
            return (
              glyphs.filter(
                glyph =>
                  glyph.cluster >= unit.start &&
                  glyph.cluster < unit.end &&
                  this.getGlyphOutline(font, glyph.codepoint).status === 'ready'
              ).length > 1
            )
          })
        ) {
          reason = 'missingSequence'
          missingSequences.push(text)
        } else if (
          glyphs.some(glyph => {
            if (
              isCoverageIgnorable(text.slice(glyph.cluster, glyph.cluster + 1))
            )
              return false
            return (
              this.getGlyphOutline(font, glyph.codepoint).status !== 'ready'
            )
          })
        )
          reason = 'unsupportedGlyphFormat'
      } catch {
        reason = 'unsupportedGlyphFormat'
      } finally {
        buffer.clearContents()
      }
    }
    const result: FontCoverageCheck = {
      covered: !reason,
      reason,
      missingCharacters: [...new Set(missingCharacters)],
      missingSequences: [...new Set(missingSequences)]
    }
    this.coverage.set(key, result)
    if (this.coverage.size > 2048)
      this.coverage.delete(this.coverage.keys().next().value!)
    return {
      ...result,
      missingCharacters: [...result.missingCharacters],
      missingSequences: [...result.missingSequences]
    }
  }

  resolve(
    style: TextStyleProps,
    text: string,
    options: FontResolveOptions = {}
  ): FontResolution {
    if (isCoverageIgnorable(text))
      return {
        status: 'ignored',
        covered: true,
        font: this.getFont(style),
        styleMatched: true,
        attemptedFaces: [],
        missingFace: false,
        missingCharacters: [],
        missingSequences: []
      }
    const records = this.candidates(style, options.script || textScript(text))
    const attemptedFaces: string[] = []
    const checks: FontCoverageCheck[] = []
    let styleFallback: FontResolution | null = null
    for (const record of records) {
      const font = this.instance(record, style.fontSize)
      attemptedFaces.push(record.info.faceId)
      const check = this.checkCoverage(font, text, options)
      checks.push(check)
      if (check.covered) {
        const styleMatched =
          record.info.weight === (style.bold ? 700 : 400) &&
          record.info.style === (style.italic ? 'italic' : 'normal')
        const resolution: FontResolution = {
          ...check,
          status: 'covered',
          font,
          styleMatched,
          reason: styleMatched ? undefined : 'missingStyle',
          attemptedFaces,
          missingFace: false
        }
        if (styleMatched) return resolution
        styleFallback ??= resolution
      }
    }
    if (styleFallback) return styleFallback
    const missingCharacters = [
      ...new Set(
        [...text].filter(scalar => {
          const cp = scalar.codePointAt(0)!
          return (
            !isCoverageIgnorable(scalar) &&
            !(cp >= 0xd800 && cp <= 0xdfff) &&
            records.every(
              record =>
                !this.instance(record, style.fontSize).hbFont.nominalGlyph(cp)
            )
          )
        })
      )
    ]
    const backendUnavailable = [...this.failures.values()].some(
      failure =>
        failure.family.toLowerCase() === style.fontFamily.toLowerCase() &&
        failure.reason === 'unsupportedGlyphFormat'
    )
    const reason =
      backendUnavailable ||
      checks.some(check => check.reason === 'unsupportedGlyphFormat')
        ? 'unsupportedGlyphFormat'
        : missingCharacters.length
          ? 'missingGlyph'
          : 'missingSequence'
    return {
      status: 'missing',
      covered: false,
      reason: records.length || backendUnavailable ? reason : 'missingFace',
      font: null,
      styleMatched: false,
      attemptedFaces,
      missingFace: !records.length,
      missingCharacters,
      missingSequences: reason === 'missingSequence' ? [text] : []
    }
  }

  resolveText(
    style: TextStyleProps,
    text: string,
    options: FontResolveOptions = {}
  ): ResolvedFontRun[] {
    if (!text) return []
    const whole = this.resolve(style, text, options)
    if (
      whole.covered &&
      (whole.status === 'ignored' ||
        whole.font?.ref.family.toLowerCase() === style.fontFamily.toLowerCase())
    ) {
      return [{ text, start: 0, end: text.length, resolution: whole }]
    }
    const units = fontContextUnits(text).map(unit => ({
      ...unit,
      resolution: this.resolve(style, unit.text, options)
    }))
    for (let index = 0; index < units.length; index++) {
      const current = units[index].resolution
      if (current.status !== 'ignored') continue
      const adjacent =
        units[index - 1]?.resolution.font ||
        units.slice(index + 1).find(unit => unit.resolution.font)?.resolution
          .font
      if (adjacent) current.font = adjacent
    }
    const runs: ResolvedFontRun[] = []
    for (const unit of units) {
      const last = runs.at(-1)
      if (
        last &&
        last.resolution.font?.ref.faceId === unit.resolution.font?.ref.faceId &&
        last.resolution.covered &&
        unit.resolution.covered &&
        last.resolution.reason === unit.resolution.reason
      ) {
        last.text += unit.text
        last.end = unit.end
      } else runs.push(unit)
    }
    return runs
  }

  getGlyphOutlineByRef(
    ref: import('../../../interface/Layout').LayoutFontRef,
    glyphId: number,
    size: number
  ) {
    this.assertAlive()
    const record = this.faceCache.get(ref.faceId)
    if (!record) throw new Error(`Unknown font face for glyph ${glyphId}`)
    return this.getGlyphOutline(this.instance(record, size), glyphId)
  }

  getGlyphOutline(font: FontInstance, glyphId: number) {
    this.assertAlive()
    return this.outlines.get(font, glyphId)
  }

  getLineMetrics(
    style: TextStyleProps,
    ref?: import('../../../interface/Layout').LayoutFontRef
  ) {
    const record = ref ? this.faceCache.get(ref.faceId) : undefined
    const font = record
      ? this.instance(record, style.fontSize)
      : this.getFont(style)
    if (!font)
      return {
        ascent: style.fontSize * 0.8,
        descent: style.fontSize * 0.2,
        lineGap: 0
      }
    const extents = font.hbFont.hExtents()
    return {
      ascent: Math.max(0, extents.ascender * font.pxPerUnit),
      descent: Math.max(0, -extents.descender * font.pxPerUnit),
      lineGap: Math.max(0, extents.lineGap * font.pxPerUnit)
    }
  }

  getPlaceholderMetrics(style: TextStyleProps): FontPlaceholderMetrics {
    const font = this.getFont(style)
    if (font) {
      const advance = font.hbFont.glyphHAdvance(0) * font.pxPerUnit
      const extents = font.hbFont.hExtents()
      let drawable = false
      try {
        drawable = this.getGlyphOutline(font, 0).status === 'ready'
      } catch {
        // An explicit box is required when the .notdef backend is unavailable.
      }
      if (advance > 0 && drawable)
        return {
          source: 'notdef',
          font: { ...font.ref },
          advance,
          ascent: Math.max(0, extents.ascender * font.pxPerUnit),
          descent: Math.max(0, -extents.descender * font.pxPerUnit)
        }
    }
    return {
      source: 'box',
      font: null,
      advance: Math.max(8, style.fontSize * 0.75),
      ascent: style.fontSize * 0.8,
      descent: style.fontSize * 0.2
    }
  }

  private assertActive(signal?: AbortSignal) {
    this.assertAlive()
    if (signal?.aborted)
      throw new DOMException('Font registration aborted', 'AbortError')
  }

  private assertAlive() {
    if (this.destroyed) throw new EditorRuntimeError('EDITOR_DESTROYED')
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.controller.abort()
    for (const face of this.documentFaces) document.fonts.delete(face)
    this.documentFaces.clear()
    this.pending.clear()
    this.fonts.clear()
    this.faceCache.clear()
    this.outlines.clear()
    this.coverage.clear()
    this.failures.clear()
    this.ready = false
  }
}
