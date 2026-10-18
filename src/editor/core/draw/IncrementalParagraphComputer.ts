import type {
  LayoutCaret,
  LayoutSource,
  TextLine
} from '../../interface/Layout'
import type {
  NativeParagraphInput,
  NativeParagraphLayout
} from '../text-engine/layout/TextLayoutService'

/** Rebase every source-bearing native field; text/glyph offsets stay local. */
function rebase(layout: NativeParagraphLayout, delta: number) {
  const source = (value: LayoutSource) => ({
    ...value,
    start: value.start + delta,
    end: value.end + delta
  })
  const caret = (value: LayoutCaret) => ({
    ...value,
    position: {
      ...value.position,
      elementIndex: value.position.elementIndex + delta
    }
  })
  const line = (value: TextLine): TextLine => ({
    ...value,
    source: source(value.source),
    marker: value.marker && line(value.marker),
    labels: value.labels?.map(label => ({
      ...label,
      source: source(label.source)
    })),
    carets: value.carets.map(caret),
    clusters: value.clusters.map(cluster => ({
      ...cluster,
      logicalIndices: cluster.logicalIndices.map(index => index + delta),
      carets: cluster.carets.map(caret)
    })),
    inlines: value.inlines.map(inline => ({
      ...inline,
      source: source(inline.source),
      ...(inline.kind === 'missingGlyph'
        ? { carets: inline.carets.map(caret) }
        : { anchor: caret(inline.anchor) })
    }))
  })
  return {
    lines: layout.lines.map(line),
    shaped: {
      ...layout.shaped,
      lines: layout.shaped.lines.map(value => ({
        ...value,
        logicalStart: value.logicalStart + delta,
        logicalEnd: value.logicalEnd + delta,
        glyphs: value.glyphs.map(glyph => ({
          ...glyph,
          logicalIndexStart: glyph.logicalIndexStart + delta,
          logicalIndexEnd: glyph.logicalIndexEnd + delta,
          logicalIndices: glyph.logicalIndices?.map(index => index + delta)
        }))
      }))
    }
  }
}

/**
 * Bounded native paragraph cache. Owns no host elements, IRows, page placements
 * or legacy snapshots. Inputs include fonts, source identity and flow widths.
 */
export class IncrementalParagraphComputer {
  private cache = new Map<string, NativeParagraphLayout>()

  reset() {
    this.cache.clear()
  }

  releaseScope(scope: string) {
    for (const key of this.cache.keys()) {
      const cachedScope = JSON.parse(key).source.scope as string
      if (cachedScope === scope || cachedScope.startsWith(`${scope}/`))
        this.cache.delete(key)
    }
  }

  compute(
    input: NativeParagraphInput,
    compute: (input: NativeParagraphInput) => NativeParagraphLayout
  ): NativeParagraphLayout {
    const start = input.source.start
    const relative = {
      ...input,
      source: { ...input.source, start: 0, end: input.source.end - start },
      spans: input.spans.map(span => ({
        ...span,
        logicalIndex: span.logicalIndex - start,
        logicalIndices: span.logicalIndices?.map(index => index - start)
      })),
      positions: input.positions.map(position => ({
        nodeId: position.nodeId,
        start: position.start - start,
        textStart: position.textStart,
        textEnd: position.textEnd
      }))
    }
    // JSON normally conflates Infinity (unbounded flow) with null.
    const key = JSON.stringify(relative, (_, value) =>
      typeof value === 'number' && !Number.isFinite(value)
        ? String(value)
        : value
    )
    let result = this.cache.get(key)
    if (!result) {
      result = structuredClone(rebase(compute(input), -start))
      if (this.cache.size >= 256)
        this.cache.delete(this.cache.keys().next().value!)
      this.cache.set(key, result)
    } else {
      this.cache.delete(key)
      this.cache.set(key, result)
    }
    // Projection/flow consumers can mutate their own result, never the cache.
    return rebase(structuredClone(result), start)
  }
}
