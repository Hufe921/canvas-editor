import { DirtyRangeTracker } from '@/editor/core/draw/DirtyRangeTracker'
import { describe, expect, it, vi } from 'vitest'

describe('scope dirty range tracking', () => {
  it('keeps main, cells and frames independent and consumes once', () => {
    const tracker = new DirtyRangeTracker()
    const main = new Array(50)
    const cell = new Array(20)
    const header = new Array(30)
    tracker.markRangeDirty(main, 5, 1, 3)
    tracker.markRangeDirty(cell, 10, 2, 0)
    tracker.markRangeDirty(header, 2, 0, 1)
    expect(tracker.consumeDirtyRange(main)).toEqual({
      startIndex: 5,
      endIndex: 9
    })
    expect(tracker.consumeDirtyRange(cell)).toEqual({
      startIndex: 10,
      endIndex: 12
    })
    expect(tracker.consumeDirtyRange(header)).toEqual({
      startIndex: 2,
      endIndex: 4
    })
    expect(tracker.consumeDirtyRange(main)).toBeUndefined()
  })

  it('maps batched edits through insertions and overlapping deletions', () => {
    const tracker = new DirtyRangeTracker()
    const list = new Array(100)
    tracker.markRangeDirty(list, 40, 0, 10)
    tracker.markRangeDirty(list, 5, 0, 2)
    tracker.markRangeDirty(list, 20, 40, 1)
    expect(tracker.consumeDirtyRange(list)).toEqual({
      startIndex: 5,
      endIndex: 22
    })
    tracker.markRangeDirty(list, 95, 5, 0)
    list.length = 95
    expect(tracker.consumeDirtyRange(list)).toEqual({
      startIndex: 95,
      endIndex: 95
    })
  })

  it('full dirty dominates later edits, independently in each scope', () => {
    const invalidate = vi.fn()
    const tracker = new DirtyRangeTracker(invalidate)
    const a = new Array(30)
    const b = new Array(30)
    tracker.markFullDirty()
    tracker.markRangeDirty(a, 3, 0, 1)
    tracker.markRangeDirty(b, 4, 0, 1)
    expect(tracker.consumeDirtyRange(a)).toBeUndefined()
    expect(tracker.consumeDirtyRange(b)).toBeUndefined()
    tracker.markRangeDirty(a, 3, 0, 1)
    tracker.markRangeDirty(b, 4, 0, 1)
    tracker.markFullDirty(a)
    tracker.markRangeDirty(a, 8, 0, 1)
    expect(tracker.consumeDirtyRange(a)).toBeUndefined()
    expect(tracker.consumeDirtyRange(b)).toEqual({ startIndex: 4, endIndex: 6 })
    expect(invalidate).toHaveBeenCalledTimes(2)
  })
})
