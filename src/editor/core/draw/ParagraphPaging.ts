import { ZERO } from '../../dataset/constant/Common'
import { isTextLikeElement } from '../../utils/element'
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

  constructor(
    private readonly rows: IRow[],
    isHidden: (element: IElement) => boolean
  ) {
    const paragraphs: Paragraph[] = []
    const owners: Array<Paragraph | undefined> = []
    const displayed: number[] = [0]
    const nextVisible = Array.from(
      { length: rows.length + 1 },
      () => rows.length
    )
    let current: Paragraph | undefined
    for (const [i, row] of rows.entries()) {
      delete row.paginationBreakBefore
      this.prefix.push(this.prefix[i] + row.height + (row.offsetY || 0))
      this.groups.push([])
      const isDisplayed =
        row.height > 0 && row.elementList.some(el => !isHidden(el))
      displayed.push(displayed[i] + Number(isDisplayed))
      const first = row.elementList[0]
      const text = first && isTextLikeElement(first)
      if (!text) {
        current = undefined
        continue
      }
      if (!current || (first.value === ZERO && !first.listWrap)) {
        current = { start: i, end: i + 1, style: first }
        paragraphs.push(current)
      } else current.end = i + 1
      owners[i] = current
    }
    this.active = rows.some(
      (row, i) =>
        displayed[i + 1] > displayed[i] &&
        row.elementList.some(element =>
          PARAGRAPH_FLOW_ATTR.some(key => element[key] === true)
        )
    )
    if (!this.active) return
    for (let i = rows.length - 1; i >= 0; i--) {
      nextVisible[i] =
        displayed[i + 1] > displayed[i] || rows[i].isPageBreak
          ? i
          : nextVisible[i + 1]
    }
    const effective = paragraphs.filter(
      p => displayed[p.end] > displayed[p.start]
    )
    const add = (start: number, end: number, fresh: boolean) => {
      const group = {
        start,
        end,
        height: this.prefix[end] - this.prefix[start],
        fresh
      }
      for (let i = start; i < end; i++) this.groups[i].push(group)
    }
    for (const p of effective) {
      if (p.style.pageBreakBefore) this.breaks.add(p.start)
      if (p.style.keepTogether) add(p.start, p.end, true)
      if (p.style.widowControl) {
        const visible: number[] = []
        for (let i = p.start; i < p.end; i++) {
          if (displayed[i + 1] > displayed[i]) visible.push(i)
        }
        if (visible.length > 1 && visible.length <= 3)
          add(p.start, p.end, false)
        else if (visible.length > 3) {
          add(p.start, visible[1] + 1, false)
          add(visible[visible.length - 2], p.end, false)
        }
      }
    }
    for (let i = 0; i < effective.length; i++) {
      const paragraph = effective[i]
      if (!paragraph.style.keepWithNext) continue
      const followingIndex = nextVisible[paragraph.end]
      const following = rows[followingIndex]
      if (
        following &&
        !following.isPageBreak &&
        (!effective[i + 1] || owners[followingIndex] !== effective[i + 1])
      ) {
        throw new Error(
          'Keeping text with a following object is not supported.'
        )
      }
    }
    for (let i = 0; i < effective.length; i++) {
      const first = effective[i]
      if (!first.style.keepWithNext) continue
      let last = i
      while (
        effective[last]?.style.keepWithNext &&
        effective[last + 1] &&
        owners[nextVisible[effective[last].end]] === effective[last + 1] &&
        !effective[last + 1].style.pageBreakBefore
      )
        last++
      if (last > i) add(first.start, effective[last].end, true)
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
