import type { IComputeRange } from '../../interface/Draw'

/** List identity is the scope: cells, frames and main never share indices. */
export class DirtyRangeTracker {
  private ranges = new WeakMap<object, IComputeRange>()
  private fullDirty = new WeakSet<object>()
  private epoch = 0
  private consumedEpoch = new WeakMap<object, number>()

  constructor(private onFullDirty?: () => void) {}

  markRangeDirty(
    scope: object,
    start: number,
    deleteCount: number,
    insertCount: number
  ) {
    const previous = this.ranges.get(scope)
    const delta = insertCount - deleteCount
    // Map both old interval endpoints through this splice. A deletion may
    // swallow the entire previous interval; insertions can expand its tail.
    const map = (index: number) =>
      index <= start
        ? index
        : index >= start + deleteCount
          ? index + delta
          : start + insertCount
    this.ranges.set(scope, {
      startIndex: Math.min(start, previous ? map(previous.startIndex) : start),
      endIndex: Math.max(
        start + Math.max(insertCount, 1),
        previous ? map(previous.endIndex) : 0
      )
    })
  }

  markFullDirty(scope?: object) {
    if (scope) {
      this.ranges.delete(scope)
      this.fullDirty.add(scope)
    } else {
      this.ranges = new WeakMap()
      this.epoch++
    }
    this.onFullDirty?.()
  }

  consumeDirtyRange(scope: { length: number }): IComputeRange | undefined {
    const range = this.ranges.get(scope)
    this.ranges.delete(scope)
    const full =
      this.fullDirty.delete(scope) ||
      (this.consumedEpoch.get(scope) || 0) !== this.epoch
    this.consumedEpoch.set(scope, this.epoch)
    if (full || !range) return undefined
    return {
      startIndex: Math.max(0, Math.min(range.startIndex, scope.length)),
      endIndex: Math.min(range.endIndex + 1, scope.length)
    }
  }
}
