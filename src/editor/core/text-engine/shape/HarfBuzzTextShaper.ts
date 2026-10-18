import {
  fontContextUnits,
  isCoverageIgnorable,
  textScript
} from '../font/fontCoverage'
import { coverageIssueId } from '../font/FontCoverageTracker'
import { harfBuzzRuntime } from '../HarfBuzzRuntime'
import { shapeInlineObject } from './InlineObjectShaper'
import { FontManager, type FontInstance } from '../font/FontManager'
import { ShapedGlyph, StyleRun } from '../types'
import { ITextShaper } from './ITextShaper'

/**
 * All covered text uses HarfBuzz glyph IDs, advances and offsets.
 * Uncovered text uses explicit diagnostics/placeholders; never browser shaping.
 */
export class HarfBuzzTextShaper implements ITextShaper {
  constructor(private fontManager: FontManager) {}

  shape(run: StyleRun): ShapedGlyph[] {
    if (run.style.objectWidth != null) {
      return shapeInlineObject(run)
    }
    return this.fontManager
      .resolveText(run.style, run.text, {
        direction: run.direction,
        script: run.script,
        language: run.language
      })
      .flatMap(segment => {
        if (segment.resolution.status === 'missing') {
          return this.shapeMissing(
            {
              ...run,
              text: segment.text,
              textStart: run.textStart + segment.start,
              textEnd: run.textStart + segment.end
            },
            segment.resolution.reason!
          )
        }
        const font = segment.resolution.font
        const style = font
          ? {
              ...run.style,
              fontFamily: font.ref.family,
              bold: font.ref.weight >= 600,
              italic: font.ref.style === 'italic'
            }
          : run.style
        return this.shapeResolved(
          {
            ...run,
            text: segment.text,
            style,
            textStart: run.textStart + segment.start,
            textEnd: run.textStart + segment.end
          },
          font
        )
      })
  }

  private shapeMissing(
    run: StyleRun,
    reason: import('../../../interface/FontCoverage').FontCoverageReason
  ): ShapedGlyph[] {
    return fontContextUnits(run.text).map(unit => {
      const metrics = this.fontManager.getPlaceholderMetrics(run.style)
      const invisible = isCoverageIgnorable(unit.text)
      const charStart = run.textStart + unit.start
      const charEnd = run.textStart + unit.end
      const font = this.fontManager.getFont(run.style)
      const outline =
        !invisible && metrics.source === 'notdef' && font
          ? this.fontManager.getGlyphOutline(font, 0)
          : undefined
      return {
        glyphId: 0,
        inkless: invisible || undefined,
        font: metrics.font || undefined,
        missing: invisible
          ? undefined
          : {
              kind: 'missingGlyph',
              text: unit.text,
              metrics,
              diagnosticId: coverageIssueId(
                run.style.fontFamily,
                run.style,
                textScript(unit.text),
                reason
              )
            },
        cluster: unit.start,
        ax: invisible ? 0 : metrics.advance + (run.style.letterSpacing || 0),
        dx: 0,
        dy: 0,
        charStart,
        charEnd,
        logicalIndexStart: run.logicalIndexAt(charStart),
        logicalIndexEnd: run.logicalIndexAt(charEnd - 1),
        logicalIndices: this.getVisibleLogicalIndices(
          run,
          unit.start,
          unit.end
        ),
        left: 0,
        right: 0,
        style: run.style,
        bidiLevel: run.direction === 'rtl' ? 1 : 0,
        pathData: outline?.pathData
      }
    })
  }

  private shapeResolved(
    run: StyleRun,
    fontInst: FontInstance | null
  ): ShapedGlyph[] {
    if (!run.text.length) return []
    if (!fontInst) return this.shapeMissing(run, 'missingFace')

    const {
      Buffer: HbBuffer,
      BufferFlag,
      Direction,
      shape
    } = harfBuzzRuntime.getModule()
    const buffer = new HbBuffer()
    buffer.addText(run.text)
    buffer.setFlags(BufferFlag.REMOVE_DEFAULT_IGNORABLES)
    buffer.setDirection(run.direction === 'rtl' ? Direction.RTL : Direction.LTR)
    const script = run.script === 'hans' ? 'hani' : run.script
    if (script && !['zyyy', 'zzzz', 'zsye'].includes(script))
      buffer.setScript(script)
    if (run.language) buffer.setLanguage(run.language)
    buffer.guessSegmentProperties()
    shape(fontInst.hbFont, buffer)
    const paired = buffer.getGlyphInfosAndPositions() as Array<{
      codepoint: number
      cluster: number
      xAdvance: number
      xOffset: number
      yOffset: number
    }>
    buffer.clearContents()
    // Reused by all glyphs and marks in a cluster, avoiding quadratic scans.
    const clusters = [...new Set(paired.map(g => g.cluster))].sort(
      (a, b) => a - b
    )
    const clusterEnds = new Map(
      clusters.map((cluster, index) => [
        cluster,
        clusters[index + 1] ?? run.text.length
      ])
    )
    if (!paired?.length && !isCoverageIgnorable(run.text))
      return this.shapeMissing(run, 'missingSequence')
    if (
      paired.some(
        g =>
          g.codepoint === 0 &&
          !isCoverageIgnorable(
            run.text.slice(
              g.cluster,
              clusterEnds.get(g.cluster) ?? run.text.length
            )
          )
      )
    )
      return this.shapeMissing(run, 'missingGlyph')

    const scale = fontInst.pxPerUnit
    const glyphs = paired.map(g => {
      const clusterEnd = clusterEnds.get(g.cluster) ?? run.text.length
      const charStart = run.textStart + g.cluster
      const charEnd = run.textStart + Math.max(clusterEnd, g.cluster + 1)
      const shaped: ShapedGlyph = {
        glyphId: g.codepoint,
        font: { ...fontInst.ref },
        cluster: g.cluster,
        ax: g.xAdvance * scale,
        dx: g.xOffset * scale,
        dy: g.yOffset * scale,
        charStart,
        charEnd,
        logicalIndexStart: run.logicalIndexAt(charStart),
        logicalIndexEnd: run.logicalIndexAt(Math.max(charStart, charEnd - 1)),
        logicalIndices: this.getVisibleLogicalIndices(
          run,
          g.cluster,
          clusterEnd
        ),
        left: 0,
        right: 0,
        style: run.style,
        bidiLevel: run.direction === 'rtl' ? 1 : 0
      }
      shaped.pathData = this.fontManager.getGlyphOutline(
        fontInst,
        g.codepoint
      ).pathData
      return shaped
    })

    // Tracking is a layout addition, once per cluster (never per mark glyph).
    const spacing = run.style.letterSpacing || 0
    if (spacing) {
      for (let i = 0; i < glyphs.length; i++) {
        const glyph = glyphs[i]
        if (glyphs[i + 1]?.cluster === glyph.cluster) continue
        if (
          !/^[\p{Default_Ignorable_Code_Point}]*$/u.test(
            run.text.slice(glyph.cluster, glyph.charEnd - run.textStart)
          )
        )
          glyph.ax += spacing
      }
    }
    return glyphs
  }

  private getVisibleLogicalIndices(
    run: StyleRun,
    start: number,
    end: number
  ): number[] {
    const indices: number[] = []
    for (let i = start; i < end; i++) {
      if (/^[\u2066-\u2069]$/u.test(run.text[i])) continue
      indices.push(run.logicalIndexAt(run.textStart + i))
    }
    return indices
  }
}
