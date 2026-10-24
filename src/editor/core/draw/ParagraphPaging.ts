import { ZERO } from '../../dataset/constant/Common'
import { ElementType } from '../../dataset/enum/Element'
import type { IElement } from '../../interface/Element'
import type { IRow } from '../../interface/Row'

export const PARAGRAPH_FLOW_ATTR = [
  'keepTogether',
  'keepWithNext',
  'widowControl',
  'pageBreakBefore'
] as const

interface Group {
  start: number
  end: number
  height: number
  fresh: boolean
}
interface Paragraph {
  start: number
  end: number
  style: IElement
}

/** Row ownership remains unchanged; the pager reserves whole feasible groups. */
export class ParagraphPaging {
  public readonly active: boolean
  private readonly prefix: number[] = [0]
  private readonly groups: Group[][] = []
  private readonly breaks = new Set<number>()

  constructor(private readonly rows: IRow[]) {
    const paragraphs: Paragraph[] = []
    let current: Paragraph | undefined
    this.active = rows.some(row =>
      row.elementList.some(element =>
        PARAGRAPH_FLOW_ATTR.some(key => element[key] === true)
      )
    )
    for (const [i, row] of rows.entries()) {
      delete row.paginationBreakBefore
      this.prefix.push(this.prefix[i] + row.height + (row.offsetY || 0))
      this.groups.push([])
      const first = row.elementList[0]
      const text =
        first &&
        (!first.type ||
          first.type === ElementType.TEXT ||
          first.type === ElementType.SUPERSCRIPT ||
          first.type === ElementType.SUBSCRIPT)
      if (!text) {
        current = undefined
        continue
      }
      if (!current || (first.value === ZERO && !first.listWrap)) {
        current = { start: i, end: i + 1, style: first }
        paragraphs.push(current)
      } else current.end = i + 1
    }
    if (!this.active) return
    const add = (start: number, end: number, fresh: boolean) => {
      const group = {
        start,
        end,
        height: this.prefix[end] - this.prefix[start],
        fresh
      }
      for (let i = start; i < end; i++) this.groups[i].push(group)
    }
    for (const p of paragraphs) {
      if (this.prefix[p.end] <= this.prefix[p.start]) continue
      if (p.style.pageBreakBefore) this.breaks.add(p.start)
      if (p.style.keepTogether) add(p.start, p.end, true)
      if (p.style.widowControl) {
        const visible: number[] = []
        for (let i = p.start; i < p.end; i++) {
          if (this.rows[i].height > 0) visible.push(i)
        }
        if (visible.length > 1 && visible.length <= 3)
          add(p.start, p.end, false)
        else if (visible.length > 3) {
          add(p.start, visible[1] + 1, false)
          add(visible[visible.length - 2], p.end, false)
        }
      }
    }
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i]
      if (!paragraph.style.keepWithNext) continue
      const following = rows[paragraph.end]
      if (
        following &&
        !following.isPageBreak &&
        paragraphs[i + 1]?.start !== paragraph.end
      ) {
        throw new Error(
          'Keeping text with a following object is not supported.'
        )
      }
    }
    for (let i = 0; i < paragraphs.length; i++) {
      const first = paragraphs[i]
      if (!first.style.keepWithNext) continue
      let last = i
      while (
        paragraphs[last]?.style.keepWithNext &&
        paragraphs[last + 1] &&
        paragraphs[last].end === paragraphs[last + 1].start &&
        !paragraphs[last + 1].style.pageBreakBefore
      )
        last++
      if (last > i) add(first.start, paragraphs[last].end, true)
      i = last
    }
  }

  public before(index: number): boolean {
    return this.breaks.has(index)
  }

  public required(
    index: number,
    emptyHeight: number
  ): { height: number; fresh: boolean } {
    const row = this.rows[index]
    let height = row.height + (row.offsetY || 0)
    let fresh = false
    for (const group of this.groups[index]) {
      if (group.height <= emptyHeight + 1e-8)
        height = Math.max(height, this.prefix[group.end] - this.prefix[index])
      else if (group.fresh && index === group.start) fresh = true
    }
    return { height, fresh }
  }
}
