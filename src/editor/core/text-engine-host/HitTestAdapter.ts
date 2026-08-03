import {
  CaretMetrics,
  LayoutLine,
  LayoutResult,
  ShapedGlyph
} from '../text-engine/types'

/**
 * Host caret convention: index N means caret is after element N.
 * Glyph coordinates are visual (left → right on the line).
 */
export class HitTestAdapter {
  /**
   * Caret x for host after-index. Odd bidi → trailing edge is glyph.left;
   * even → glyph.right.
   */
  caretMetrics(
    layout: LayoutResult,
    hostAfterIndex: number,
    hitLineStart = false
  ): CaretMetrics | null {
    for (const line of layout.lines) {
      if (hitLineStart && line.glyphs.length) {
        return {
          x: this.visualLineStartX(line),
          y: 0,
          height: line.height,
          affinity: 'before'
        }
      }
      if (!this.lineTouchesIndex(line, hostAfterIndex)) continue

      for (const g of line.glyphs) {
        if (
          hostAfterIndex < g.logicalIndexStart ||
          hostAfterIndex > g.logicalIndexEnd
        ) {
          continue
        }
        return {
          x: this.afterEdgeX(g, hostAfterIndex),
          y: 0,
          height: line.height,
          affinity: 'after'
        }
      }
    }
    // Paragraph / line end: place after last visual glyph of last matching line
    for (let i = layout.lines.length - 1; i >= 0; i--) {
      const line = layout.lines[i]
      if (!line.glyphs.length) continue
      if (hostAfterIndex >= line.logicalEnd) {
        const last = line.glyphs[line.glyphs.length - 1]
        const odd = (last.bidiLevel & 1) === 1
        return {
          x: odd ? last.left : last.right,
          y: 0,
          height: line.height,
          affinity: 'after'
        }
      }
    }
    return null
  }

  /**
   * Map line-local x to host after-index (caret after that element).
   */
  pointToLogicalIndex(
    layout: LayoutResult,
    x: number,
    lineIndex: number
  ): number | null {
    const line = layout.lines[lineIndex]
    if (!line) return null
    if (!line.glyphs.length) return line.logicalStart
    const minLeft = Math.min(...line.glyphs.map(g => g.left))
    const maxRight = Math.max(...line.glyphs.map(g => g.right))
    // 行外空白：RTL 左侧→逻辑尾、右侧→逻辑首；LTR 相反
    if (line.direction === 'rtl') {
      if (x < minLeft) return line.logicalEnd
      if (x > maxRight) return line.logicalStart
    } else {
      if (x < minLeft) return line.logicalStart
      if (x > maxRight) return line.logicalEnd
    }
    for (const g of line.glyphs) {
      if (x < g.right) {
        return this.offsetInGlyph(g, x)
      }
    }
    return line.direction === 'rtl' ? line.logicalStart : line.logicalEnd
  }

  /**
   * Visual neighbor of host after-index. delta -1 = screen-left, +1 = screen-right.
   * @param paraStartIndex optional ZERO index inserted at visual line-start
   */
  visualNeighbor(
    layout: LayoutResult,
    hostAfterIndex: number,
    delta: 1 | -1,
    paraStartIndex?: number
  ): number | null {
    const slots = this.buildVisualCaretSlots(layout, paraStartIndex)
    if (!slots.length) return null
    const at = slots.findIndex(s => s.index === hostAfterIndex)
    if (at < 0) return null
    const next = slots[at + delta]
    return next === undefined ? null : next.index
  }

  findLineByLogicalIndex(
    layout: LayoutResult,
    logicalIndex: number
  ): LayoutLine | null {
    for (const line of layout.lines) {
      if (
        logicalIndex >= line.logicalStart &&
        logicalIndex <= line.logicalEnd
      ) {
        return line
      }
    }
    return layout.lines[layout.lines.length - 1] || null
  }

  private lineTouchesIndex(line: LayoutLine, index: number): boolean {
    if (!line.glyphs.length) return false
    if (index >= line.logicalStart && index <= line.logicalEnd) return true
    // allow after last of line
    return index === line.logicalEnd
  }

  private visualLineStartX(line: LayoutLine): number {
    if (!line.glyphs.length) return 0
    if (line.direction === 'rtl') {
      return Math.max(...line.glyphs.map(g => g.right))
    }
    return line.glyphs[0].left
  }

  /** Trailing edge for "after hostAfterIndex" within glyph */
  private afterEdgeX(g: ShapedGlyph, hostAfterIndex: number): number {
    const from = g.logicalIndexStart
    const to = g.logicalIndexEnd
    const odd = (g.bidiLevel & 1) === 1
    const count = Math.max(1, to - from + 1)
    const each = (g.right - g.left) / count
    if (count === 1) {
      return odd ? g.left : g.right
    }
    // Slice glyph box LTR; RTL run places higher logical indices toward the left
    if (odd) {
      return g.left + (to - hostAfterIndex) * each
    }
    return g.left + (hostAfterIndex - from + 1) * each
  }

  /**
   * Click → host after-index.
   * LTR: left half → previous (after prev); right half → after this.
   * RTL: left half → after this; right half → previous.
   */
  private offsetInGlyph(g: ShapedGlyph, x: number): number {
    const width = Math.max(g.right - g.left, 1)
    const from = g.logicalIndexStart
    const to = g.logicalIndexEnd
    const count = Math.max(1, to - from + 1)
    const odd = (g.bidiLevel & 1) === 1
    if (count === 1) {
      const mid = g.left + width / 2
      if (odd) {
        return x < mid ? from : from - 1 >= 0 ? from - 1 : from
      }
      return x < mid ? from - 1 >= 0 ? from - 1 : from : from
    }
    const ratio = Math.max(0, Math.min(1, (x - g.left) / width))
    if (odd) {
      const slot = Math.floor((1 - ratio) * count)
      const li = from + Math.min(count - 1, Math.max(0, slot))
      const localMid =
        g.left + (to - li) * (width / count) + width / count / 2
      // Refine with half: keep li as after-index when on trailing side
      return x < localMid ? li : li - 1
    }
    const internal = Math.round(ratio * (count - 1))
    const li = from + internal
    const localLeft = g.left + (li - from) * (width / count)
    const mid = localLeft + width / count / 2
    return x < mid ? li - 1 : li
  }

  private buildVisualCaretSlots(
    layout: LayoutResult,
    paraStartIndex?: number
  ): Array<{ index: number; x: number }> {
    const slots: Array<{ index: number; x: number }> = []
    for (const line of layout.lines) {
      for (const g of line.glyphs) {
        for (let li = g.logicalIndexStart; li <= g.logicalIndexEnd; li++) {
          slots.push({ index: li, x: this.afterEdgeX(g, li) })
        }
      }
    }
    if (
      paraStartIndex !== undefined &&
      layout.lines[0] &&
      !slots.some(s => s.index === paraStartIndex)
    ) {
      slots.push({
        index: paraStartIndex,
        x: this.visualLineStartX(layout.lines[0])
      })
    }
    slots.sort((a, b) => a.x - b.x || a.index - b.index)
    return slots
  }
}
