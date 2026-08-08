import { VisualRect } from '../types'

/**
 * Merge visually adjacent (or overlapping) rectangles on the same baseline band.
 * Input must already use visual left/right — do not assume logical index order.
 */
export function mergeVisualRects(items: VisualRect[]): VisualRect[] {
  if (!items.length) return []
  const sorted = [...items].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y
    return a.left - b.left
  })
  const result: VisualRect[] = []
  let cur = { ...sorted[0] }
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i]
    const sameBand =
      Math.abs(cur.y - next.y) < 0.5 &&
      Math.abs(cur.height - next.height) < 0.5
    if (sameBand && next.left <= cur.right + 0.5) {
      cur.right = Math.max(cur.right, next.right)
      cur.left = Math.min(cur.left, next.left)
    } else {
      result.push(cur)
      cur = { ...next }
    }
  }
  result.push(cur)
  return result
}
