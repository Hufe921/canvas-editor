import type { PathCommand } from 'opentype.js'
import type { FontInstance } from './FontManager'

export interface GlyphInkBounds {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface GlyphOutline {
  status: 'ready' | 'empty' | 'unsupported'
  /** Baseline-relative CSS pixels; already Y-down, with no HB offsets applied. */
  commands: readonly PathCommand[]
  pathData?: string
  bounds?: GlyphInkBounds
}

const EMPTY_COMMANDS = Object.freeze([])

/** Per-manager, bounded outlines from exactly the face/glyph/size used by HB. */
export class GlyphOutlineCache {
  private entries = new Map<string, { outline: GlyphOutline; bytes: number }>()
  private bytes = 0

  get(font: FontInstance, glyphId: number): GlyphOutline {
    const key = JSON.stringify([font.ref.faceId, glyphId, font.size])
    const cached = this.entries.get(key)
    if (cached) {
      this.entries.delete(key)
      this.entries.set(key, cached)
      return cached.outline
    }
    let outline: GlyphOutline
    try {
      // Color glyphs must not silently lose their palette or SVG/bitmap layers.
      const tables = font.otFont.tables
      const colored =
        font.unsupportedColorTables ||
        tables.colr?.baseGlyphRecords?.some(
          (record: { glyphID: number }) => record.glyphID === glyphId
        ) ||
        tables.svg?.has(glyphId)
      const path = font.otFont.glyphs.get(glyphId).getPath(0, 0, font.size)
      // Empty whitespace remains inkless even in a face with color tables.
      // Visible empty glyphs are rejected separately by coverage checking.
      if (colored && path.commands.length) {
        throw new Error('Color glyph backend is unsupported')
      }
      const commands = path.commands.map(command =>
        Object.freeze({ ...command })
      )
      outline = commands.length
        ? {
            status: 'ready',
            commands: Object.freeze(commands),
            pathData: path.toPathData(3),
            bounds: Object.freeze(path.getBoundingBox())
          }
        : { status: 'empty', commands: EMPTY_COMMANDS }
    } catch {
      outline = { status: 'unsupported', commands: EMPTY_COMMANDS }
    }
    Object.freeze(outline)
    const bytes =
      outline.commands.length * 64 + (outline.pathData?.length || 0) * 2
    if (bytes <= 4 * 1024 * 1024) {
      this.entries.set(key, { outline, bytes })
      this.bytes += bytes
      while (this.entries.size > 1024 || this.bytes > 4 * 1024 * 1024) {
        const oldest = this.entries.keys().next().value!
        this.bytes -= this.entries.get(oldest)!.bytes
        this.entries.delete(oldest)
      }
    }
    return outline
  }

  clear() {
    this.entries.clear()
    this.bytes = 0
  }
}
