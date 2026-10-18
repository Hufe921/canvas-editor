import type {
  LayoutCaret,
  LayoutCluster,
  LayoutRevision,
  LayoutSource,
  TextLine
} from '../../../interface/Layout'
import type { FontManager } from '../font/FontManager'
import type {
  LayoutParagraphInput,
  LayoutResult,
  ShapedGlyph,
  TextStyleProps
} from '../types'
import { prepareControlLayout } from './ControlLayout'
import { TextLayoutEngine } from './TextLayoutEngine'

export interface ParagraphSourcePosition {
  nodeId?: string
  start: number
  textStart: number
  textEnd: number
}

export interface NativeParagraphInput extends LayoutParagraphInput {
  source: LayoutSource
  revision: LayoutRevision
  positions: ParagraphSourcePosition[]
  emptyStyle: TextStyleProps
  spacingBefore?: number
  spacingAfter?: number
}

export interface NativeParagraphLayout {
  lines: TextLine[]
  /** Transitional paint/hit-test data. Contains no host elements or rows. */
  shaped: LayoutResult
}

const segmenter = new Intl.Segmenter('und', { granularity: 'grapheme' })

/** Native paragraph geometry, independent of Draw, Canvas and LayoutRow. CSS pixels. */
export class TextLayoutService {
  constructor(
    private engine: TextLayoutEngine,
    private fonts: FontManager
  ) {}

  /** Chrome has one visual line, including templates containing line breaks. */
  layoutSingleLine(input: NativeParagraphInput): NativeParagraphLayout {
    return this.layoutParagraph({
      ...input,
      spans: input.spans.map(span => ({
        ...span,
        text: span.text.replace(/[\r\n\u2028\u2029]/g, ' ')
      })),
      availableWidth: Infinity,
      lineWidths: undefined,
      lineOffsets: undefined,
      align: 'left'
    })
  }

  measureText(input: LayoutParagraphInput, prepare = true) {
    if (prepare && input.spans.some(span => span.style.control?.minWidth)) {
      input = prepareControlLayout(
        {
          ...input,
          availableWidth: Infinity,
          source: { scope: 'measure', nodeId: 'measure', start: 0, end: 0 },
          revision: {
            documentRevision: 0,
            fontRevision: this.fonts.getRevision()
          },
          positions: input.spans.flatMap(span =>
            Array.from({ length: span.text.length }, (_, i) => ({
              start: span.logicalIndex,
              textStart: i,
              textEnd: i + 1
            }))
          ),
          emptyStyle: input.spans[0].style
        },
        spans => this.measureText({ ...input, spans }, false).width
      )
    }
    const result = this.engine.layoutParagraph({
      ...input,
      availableWidth: Infinity,
      lineWidths: undefined,
      lineOffsets: undefined,
      align: 'left'
    })
    const boxes = result.lines.map(line =>
      this.lineBox(
        line.glyphs,
        input.spans[0]?.style || { fontFamily: '', fontSize: input.lineHeight }
      )
    )
    return {
      width: Math.max(0, ...result.lines.map(line => line.width)),
      height: boxes.reduce((sum, box) => sum + box.height, 0),
      ascent: boxes[0]?.ascent || 0,
      descent: boxes[0]?.descent || 0
    }
  }

  private lineBox(glyphs: ShapedGlyph[], emptyStyle: TextStyleProps) {
    let ascent = 0
    let descent = 0
    const visible = glyphs.filter(g => !g.style.hidden)
    for (const item of visible.length ? visible : [{ style: emptyStyle }]) {
      const g = item as Partial<ShapedGlyph> & { style: TextStyleProps }
      const metrics =
        g.missing?.metrics || this.fonts.getLineMetrics(g.style, g.font)
      const gap = 'lineGap' in metrics ? metrics.lineGap / 2 : 0
      const margin = g.style.rowMargin ?? 0
      const shift = g.baselineShift || 0
      const ink =
        g.font && g.glyphId != null && !g.inkless
          ? this.fonts.getGlyphOutlineByRef(g.font, g.glyphId, g.style.fontSize)
              .bounds
          : undefined
      ascent = Math.max(
        ascent,
        metrics.ascent + gap + margin - shift + (g.style.padding?.[0] || 0),
        (g.style.objectHeight || 0) + margin,
        ink ? -ink.y1 - shift + (g.dy || 0) + margin : 0
      )
      descent = Math.max(
        descent,
        metrics.descent + gap + margin + shift + (g.style.padding?.[2] || 0),
        (g.style.objectCaptionHeight || 0) + margin,
        ink ? ink.y2 + shift - (g.dy || 0) + margin : 0
      )
    }
    const hidden =
      glyphs.length > 0 ? visible.length === 0 : !!emptyStyle.hidden
    return hidden
      ? { ascent: 0, descent: 0, height: 0, hidden }
      : { ascent, descent, height: ascent + descent, hidden }
  }

  layoutParagraph(input: NativeParagraphInput): NativeParagraphLayout {
    input = prepareControlLayout(
      input,
      spans =>
        this.measureText(
          {
            ...input,
            spans
          },
          false
        ).width,
      (spans, id) => {
        const natural = this.engine.layoutParagraph({
          ...input,
          spans,
          align: 'left'
        })
        for (const line of natural.lines) {
          const first = [...line.glyphs]
            .sort((a, b) => a.charStart - b.charStart)
            .find(
              g =>
                g.style.control?.id === id &&
                ['value', 'placeholder', 'preText'].includes(
                  g.style.control.component
                )
            )
          if (first)
            return (
              (line.inset || 0) +
              line.glyphs
                .filter(g => g.charStart < first.charStart)
                .reduce((sum, g) => sum + Math.max(0, g.ax), 0)
            )
        }
        return 0
      }
    )
    const shaped = this.engine.layoutParagraph(input)
    let y = 0
    const lines = shaped.lines.map((line, lineIndex): TextLine => {
      if (!line.glyphs.length) {
        line.logicalStart = input.source.start
        line.logicalEnd = input.source.start
      }
      const box = this.lineBox(line.glyphs, input.emptyStyle)
      // Compatibility data uses the very same authoritative line box.
      Object.assign(line, {
        height: box.height,
        ascent: box.ascent,
        descent: box.descent
      })
      const spacingBefore =
        !box.hidden && lineIndex === 0 ? input.spacingBefore || 0 : 0
      const spacingAfter =
        !box.hidden && lineIndex === shaped.lines.length - 1
          ? input.spacingAfter || 0
          : 0
      y += spacingBefore
      const indices = line.glyphs.flatMap(
        g => g.logicalIndices || [g.logicalIndexStart, g.logicalIndexEnd]
      )
      const source = {
        ...input.source,
        start:
          lineIndex === 0
            ? input.source.start
            : indices.length
              ? Math.min(...indices)
              : input.source.start,
        end:
          lineIndex === shaped.lines.length - 1
            ? input.source.end
            : indices.length
              ? Math.max(...indices) + 1
              : input.source.end
      }
      const available = input.lineWidths?.[lineIndex] ?? input.availableWidth
      const originX = line.glyphs.length
        ? line.shiftX
        : (input.lineOffsets?.[lineIndex] || 0) +
          (input.align === 'right'
            ? available
            : input.align === 'center'
              ? available / 2
              : 0)
      const node: TextLine = {
        kind: 'textLine',
        id: input.source.nodeId + ':line:' + lineIndex,
        paragraphId: input.source.nodeId,
        source,
        revision: { ...input.revision },
        rect: { x: originX, y, width: line.width, height: box.height },
        hidden: box.hidden,
        direction: input.direction,
        baseline: box.ascent,
        contentHeight: box.height,
        spacingBefore,
        spacingAfter,
        glyphs: [],
        clusters: [],
        inlines: [],
        carets: [],
        empty: line.glyphs.length === 0
      }
      // A cluster may contain base + zero-advance marks or a ligature. Group
      // them before calculating carets; never divide a combining sequence.
      const groups: ShapedGlyph[][] = []
      for (const glyph of line.glyphs) {
        const previous = groups[groups.length - 1]
        if (
          previous &&
          previous[0].charStart === glyph.charStart &&
          previous[0].charEnd === glyph.charEnd &&
          previous[0].font?.faceId === glyph.font?.faceId
        )
          previous.push(glyph)
        else groups.push([glyph])
      }
      for (const group of groups) {
        const g = group[0]
        const text = shaped.paragraphText.slice(g.charStart, g.charEnd)
        if (/^[\u2066-\u2069]+$/u.test(text)) continue
        const left = Math.min(...group.map(g => g.left))
        const right = Math.max(...group.map(g => g.right))
        const carets = this.carets(input, g, text, left, right, box.height).map(
          caret => ({ ...caret, y })
        )
        node.carets.push(...carets)
        const rect = { x: left, y, width: right - left, height: box.height }
        const logicalIndices = [
          ...new Set(
            group.flatMap(
              g => g.logicalIndices || [g.logicalIndexStart, g.logicalIndexEnd]
            )
          )
        ]
        const inlineSource = {
          ...input.source,
          nodeId: input.positions[g.charStart]?.nodeId || input.source.nodeId,
          start: Math.min(...logicalIndices),
          end: Math.max(...logicalIndices) + 1
        }
        const base = {
          id: node.id + ':inline:' + g.charStart,
          source: inlineSource,
          revision: { ...input.revision },
          rect,
          hidden: !!g.style.hidden
        }
        if (g.missing) {
          node.inlines.push({
            ...base,
            kind: 'missingGlyph',
            text: g.missing.text,
            diagnosticId: g.missing.diagnosticId,
            advance: rect.width,
            carets
          })
        } else if (g.style.objectWidth != null) {
          node.inlines.push({
            ...base,
            rect:
              g.style.objectHeight == null
                ? rect
                : {
                    x: left,
                    y: node.rect.y + box.ascent - g.style.objectHeight,
                    width: rect.width,
                    height:
                      g.style.objectHeight + (g.style.objectCaptionHeight || 0)
                  },
            kind: 'inlineObject',
            objectType: g.style.objectType || 'controlSpace',
            advance: rect.width,
            ascent: g.style.objectHeight ?? box.ascent,
            descent: g.style.objectCaptionHeight || 0,
            anchor: carets[0]
          })
        } else if (g.font) {
          const clusterIndex = node.clusters.length
          const cluster: LayoutCluster = {
            textStart: g.charStart,
            textEnd: g.charEnd,
            logicalIndices,
            glyphStart: node.glyphs.length,
            glyphEnd: node.glyphs.length + group.filter(g => !g.inkless).length,
            font: { ...g.font },
            rect,
            carets
          }
          node.clusters.push(cluster)
          for (const glyph of group.filter(g => !g.inkless))
            node.glyphs.push({
              glyphId: glyph.glyphId,
              fontSize: glyph.style.fontSize,
              font: { ...glyph.font! },
              x: glyph.left - originX,
              y: glyph.baselineShift || 0,
              advance: glyph.ax,
              offsetX: glyph.dx,
              offsetY: -glyph.dy,
              clusterIndex,
              color: glyph.style.color || '#000000'
            })
        }
      }
      const labelGroups = new Map<number, ShapedGlyph[]>()
      for (const glyph of line.glyphs) {
        if (!glyph.style.padding) continue
        const key = glyph.logicalIndexStart
        const group = labelGroups.get(key) || []
        group.push(glyph)
        labelGroups.set(key, group)
      }
      node.labels = [...labelGroups.entries()].map(([index, glyphs]) => {
        const labelBox = this.lineBox(
          glyphs.map(g => ({ ...g, style: { ...g.style, rowMargin: 0 } })),
          input.emptyStyle
        )
        const left = Math.min(...glyphs.map(g => g.left))
        return {
          source: {
            ...input.source,
            nodeId:
              input.positions[glyphs[0].charStart]?.nodeId ||
              input.source.nodeId,
            start: index,
            end: index + 1
          },
          rect: {
            x: left,
            y: y + box.ascent - labelBox.ascent,
            width: Math.max(...glyphs.map(g => g.right)) - left,
            height: labelBox.height
          },
          baseline: labelBox.ascent
        }
      })
      // Default-ignorable chrome can be omitted by HB. Retain its source caret
      // at the nearest logical neighbour, including zero-width signature brackets.
      const from = lineIndex ? shaped.lines[lineIndex - 1].textEnd : 0
      const to =
        lineIndex === shaped.lines.length - 1
          ? input.positions.length
          : line.textEnd
      for (let at = from; at < to; at++) {
        if (
          !/^[\u200B-\u200F\u2066-\u2069\uFEFF]$/u.test(
            shaped.paragraphText[at] || ''
          )
        )
          continue
        const position = input.positions[at]
        if (
          !position ||
          position.textEnd === position.textStart ||
          node.carets.some(c => c.position.elementIndex === position.start)
        )
          continue
        const next = [...line.glyphs]
          .sort((a, b) => a.charStart - b.charStart)
          .find(g => g.charStart >= at)
        const previous = [...line.glyphs]
          .sort((a, b) => b.charEnd - a.charEnd)
          .find(g => g.charEnd <= at)
        const neighbour = next || previous
        const rtl = neighbour
          ? !!(neighbour.bidiLevel & 1)
          : input.direction === 'rtl'
        const x = next
          ? rtl
            ? next.right
            : next.left
          : previous
            ? rtl
              ? previous.left
              : previous.right
            : originX
        node.carets.push({
          position: {
            elementIndex: position.start,
            offset: position.textStart
          },
          affinity: 'downstream',
          x,
          y,
          height: box.height,
          bidiLevel: neighbour?.bidiLevel || (rtl ? 1 : 0)
        })
        node.source.start = Math.min(node.source.start, position.start)
        node.source.end = Math.max(node.source.end, position.start + 1)
      }
      if (!node.carets.length)
        node.carets.push({
          position: { elementIndex: input.source.start, offset: 0 },
          affinity: 'downstream',
          x: originX,
          y,
          height: box.height,
          bidiLevel: input.direction === 'rtl' ? 1 : 0
        })
      if (
        lineIndex === 0 &&
        indices.length &&
        input.source.start < Math.min(...indices)
      ) {
        const first = [...node.carets].sort(
          (a, b) =>
            a.position.elementIndex - b.position.elementIndex ||
            a.position.offset - b.position.offset
        )[0]
        node.carets.unshift({
          ...first,
          position: { elementIndex: input.source.start, offset: 0 }
        })
      }
      y += box.height + spacingAfter
      return node
    })
    return { lines, shaped }
  }

  private carets(
    input: NativeParagraphInput,
    glyph: ShapedGlyph,
    text: string,
    left: number,
    right: number,
    height: number
  ): LayoutCaret[] {
    const segments = [...segmenter.segment(text)].filter(
      item => !/^[\u2066-\u2069]+$/u.test(item.segment)
    )
    const boundaries = segments.map(item => item.index)
    const lastSegment = segments[segments.length - 1]
    boundaries.push(
      lastSegment ? lastSegment.index + lastSegment.segment.length : text.length
    )
    return boundaries.map((offset, index) => {
      const last = index === boundaries.length - 1
      const position =
        input.positions[glyph.charStart + offset - (last ? 1 : 0)]
      const fraction = index / Math.max(1, boundaries.length - 1)
      return {
        position: {
          elementIndex: position?.start ?? glyph.logicalIndexStart,
          offset: (last ? position?.textEnd : position?.textStart) ?? 0
        },
        affinity: last ? 'upstream' : 'downstream',
        x:
          left +
          (glyph.bidiLevel & 1 ? 1 - fraction : fraction) * (right - left),
        y: 0,
        height,
        bidiLevel: glyph.bidiLevel
      }
    })
  }
}
