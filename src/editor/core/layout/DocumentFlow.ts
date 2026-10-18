import type { PaperDirection } from '../../dataset/enum/Editor'

export interface FlowState {
  pageNo: number
  columnIndex: number
  direction: PaperDirection
  y: number
}
export interface FlowPage {
  top: number
  bottom: number
  left: number
  width: number
  columns: number[]
}
export interface FlowExclusion {
  pageNo: number
  x: number
  y: number
  width: number
  height: number
}
export interface FlowPlacement extends FlowState {
  x: number
  width: number
  gap: number
  indent?: number
}

/** CSS-pixel document flow. Scope-local children never advance this cursor. */
export class DocumentFlow {
  state: FlowState
  constructor(
    direction: PaperDirection,
    readonly page: (pageNo: number, direction: PaperDirection) => FlowPage,
    readonly exclusions: FlowExclusion[] = [],
    readonly paged = true
  ) {
    this.state = {
      pageNo: 0,
      columnIndex: 0,
      direction,
      y: page(0, direction).top
    }
  }
  fork() {
    const copy = new DocumentFlow(
      this.state.direction,
      this.page,
      this.exclusions,
      this.paged
    )
    copy.state = { ...this.state }
    return copy
  }
  advance(direction?: PaperDirection) {
    const state = this.state
    const page = this.page(state.pageNo, state.direction)
    if (!direction && state.columnIndex + 1 < page.columns.length)
      state.columnIndex++
    else {
      state.pageNo++
      state.columnIndex = 0
      state.direction = direction || state.direction
    }
    state.y = this.page(state.pageNo, state.direction).top
  }
  /** Tables occupy a complete column window; start after its float exclusions. */
  clearExclusions() {
    for (;;) {
      const page = this.page(this.state.pageNo, this.state.direction)
      const left = page.left + page.columns[this.state.columnIndex]
      const bottom = Math.max(
        this.state.y,
        ...this.exclusions
          .filter(
            rect =>
              rect.pageNo === this.state.pageNo &&
              rect.x < left + page.width &&
              rect.x + rect.width > left &&
              rect.y + rect.height > this.state.y
          )
          .map(rect => rect.y + rect.height)
      )
      this.state.y = bottom
      if (this.paged && bottom >= page.bottom) this.advance()
      else return
    }
  }
  /** Reserve an actual line box; choose the largest free horizontal interval. */
  place(
    height: number,
    before = 0,
    after = 0,
    indent = 0,
    rtl = false,
    minWidth = 1
  ): FlowPlacement {
    let gap = 0
    for (;;) {
      const state = this.state
      const page = this.page(state.pageNo, state.direction)
      if (
        this.paged &&
        state.y > page.top &&
        state.y + before + height + after > page.bottom + 0.001
      ) {
        this.advance()
        gap = 0
        continue
      }
      const left = page.left + (page.columns[state.columnIndex] || 0)
      const effectiveIndent = Math.min(
        indent,
        Math.max(0, page.width - minWidth)
      )
      const start = left + (rtl ? 0 : effectiveIndent)
      const end = left + page.width - (rtl ? effectiveIndent : 0)
      let intervals = [{ left: start, right: Math.max(start + 1, end) }]
      const obstacles = this.exclusions.filter(
        rect =>
          rect.pageNo === state.pageNo &&
          rect.x < end &&
          rect.x + rect.width > start &&
          rect.y < state.y + before + height &&
          rect.y + rect.height > state.y + before
      )
      for (const rect of obstacles)
        intervals = intervals.flatMap(interval => {
          if (rect.x >= interval.right || rect.x + rect.width <= interval.left)
            return [interval]
          return [
            { left: interval.left, right: Math.min(rect.x, interval.right) },
            {
              left: Math.max(rect.x + rect.width, interval.left),
              right: interval.right
            }
          ].filter(i => i.right - i.left >= 1)
        })
      if (obstacles.length)
        intervals = intervals.filter(
          interval =>
            interval.right - interval.left >= Math.min(minWidth, end - start)
        )
      if (!intervals.length) {
        const bottom = Math.min(...obstacles.map(rect => rect.y + rect.height))
        const delta = Math.max(1, bottom - state.y - before)
        state.y += delta
        gap += delta
        continue
      }
      intervals.sort(
        (a, b) =>
          b.right - b.left - (a.right - a.left) ||
          (rtl ? b.left - a.left : a.left - b.left)
      )
      const interval = intervals[0]
      const placement = {
        ...state,
        x: interval.left - left - (rtl ? 0 : effectiveIndent),
        width: interval.right - interval.left,
        gap,
        indent: effectiveIndent
      }
      state.y += before + height + after
      return placement
    }
  }
}
