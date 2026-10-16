import { ZERO } from '../../dataset/constant/Common'
import { ElementType } from '../../dataset/enum/Element'
import type { IComputeRowListPayload } from '../../interface/Draw'
import type { IElement } from '../../interface/Element'
import type { IRow } from '../../interface/Row'
import {
  LayoutHostAdapter,
  layoutLastKey
} from '../text-engine-host/LayoutHostAdapter'
import type { LayoutLine, LayoutResult } from '../text-engine/types'

interface ParagraphRows {
  startIndex: number
  endIndex: number
  first: IElement
  last: IElement
  rows: IRow[]
  layout?: LayoutResult
}

type ComputeRows = (
  startIndex: number,
  endIndex: number,
  rowIndex: number
) => IRow[] | null

function shiftLayout(layout: LayoutResult, delta: number): LayoutResult {
  if (!delta) return layout
  return {
    ...layout,
    lines: layout.lines.map(line => ({
      ...line,
      logicalStart: line.logicalStart + delta,
      logicalEnd: line.logicalEnd + delta,
      glyphs: line.glyphs.map(glyph => ({
        ...glyph,
        logicalIndexStart: glyph.logicalIndexStart + delta,
        logicalIndexEnd: glyph.logicalIndexEnd + delta,
        logicalIndices: glyph.logicalIndices?.map(index => index + delta)
      }))
    }))
  }
}

/**
 * A shaped paragraph is the reuse boundary: joining and BiDi can change every
 * line in the edited paragraph. Pagination and positions still run in full.
 * Keep this independent of legacy row-resume snapshots.
 */
export class IncrementalParagraphComputer {
  private elementList: IElement[] | null = null
  private elementCount = 0
  private signature = ''
  private paragraphs: ParagraphRows[] = []

  reset() {
    this.elementList = null
    this.paragraphs = []
  }

  compute(
    payload: IComputeRowListPayload,
    signature: string,
    adapter: LayoutHostAdapter,
    computeRows: ComputeRows
  ): IRow[] | null {
    const elements = payload.elementList
    const starts: number[] = []
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      // These structures have cross-paragraph or mutable post-layout state.
      if (
        (element.type &&
          ![
            ElementType.TEXT,
            ElementType.SUPERSCRIPT,
            ElementType.SUBSCRIPT
          ].includes(element.type)) ||
        element.controlId ||
        element.control ||
        element.controlComponent ||
        element.listId ||
        element.listWrap ||
        element.areaId ||
        element.area ||
        element.isControlMinWidthPlaceholder
      ) {
        this.reset()
        return null
      }
      if (i === 0 || element.value === ZERO) starts.push(i)
    }
    if (!starts.length) {
      this.reset()
      return null
    }

    const scope = payload.layoutScope || 'main'
    const collect = (rows: IRow[], from: number, to: number) => {
      const result: ParagraphRows[] = []
      let rowIndex = 0
      for (let i = from; i < to; i++) {
        const startIndex = starts[i]
        const endIndex = (starts[i + 1] ?? elements.length) - 1
        const paragraphRows: IRow[] = []
        while (
          rowIndex < rows.length && rows[rowIndex].startIndex <= endIndex
        ) {
          paragraphRows.push(rows[rowIndex++])
        }
        result.push({
          startIndex,
          endIndex,
          first: elements[startIndex],
          last: elements[endIndex],
          rows: paragraphRows,
          layout: adapter.getLayout(layoutLastKey(scope, startIndex, endIndex))
        })
      }
      return result
    }

    const fullCompute = () => {
      adapter.replaceParagraphLayouts(scope, [])
      const rows = computeRows(0, elements.length, 0)
      this.reset()
      if (rows) {
        this.paragraphs = collect(rows, 0, starts.length)
        this.elementList = elements
        this.elementCount = elements.length
        this.signature = signature
      }
      return rows
    }

    const range = payload.dirtyRange
    if (
      !range ||
      this.elementList !== elements ||
      signature !== this.signature ||
      !this.paragraphs.length
    ) {
      return fullCompute()
    }

    // Include the preceding element: deleting a paragraph break can merge the
    // edit into the previous paragraph, and insertion at its end changes it.
    const firstIndex = Math.max(range.startIndex - 1, 0)
    let from = 0
    while (from + 1 < starts.length && starts[from + 1] <= firstIndex) from++
    let to = from + 1
    while (to < starts.length && starts[to] < range.endIndex) to++
    const endIndex = starts[to] ?? elements.length
    const delta = elements.length - this.elementCount
    const tailIndex =
      endIndex === elements.length
        ? this.paragraphs.length
        : this.paragraphs.findIndex(p => p.startIndex === endIndex - delta)
    if (tailIndex < from) return fullCompute()
    const prefix = this.paragraphs.slice(0, from)
    const tail = this.paragraphs.slice(tailIndex)
    if (
      prefix.length !== from ||
      tail.length !== starts.length - to ||
      prefix.some(
        (p, i) =>
          p.startIndex !== starts[i] ||
          p.first !== elements[p.startIndex] ||
          p.last !== elements[p.endIndex]
      ) ||
      tail.some(
        (p, i) =>
          p.startIndex + delta !== starts[to + i] ||
          p.first !== elements[p.startIndex + delta] ||
          p.last !== elements[p.endIndex + delta]
      )
    ) {
      return fullCompute()
    }

    const prefixRows = prefix.flatMap(p => p.rows)
    const changedRows = computeRows(starts[from], endIndex, prefixRows.length)
    if (!changedRows) return fullCompute()
    const changed = collect(changedRows, from, to)
    let rowIndex = prefixRows.length + changedRows.length
    const shiftedElements = new Set<IElement>()
    const shiftedTail = tail.map(paragraph => {
      const rows = paragraph.rows.map(row => {
        for (const element of row.elementList) {
          if (shiftedElements.has(element)) continue
          shiftedElements.add(element)
          if (element.sourceIndex !== undefined) element.sourceIndex += delta
          if (element.clusterStart !== undefined) element.clusterStart += delta
          if (element.clusterEnd !== undefined) element.clusterEnd += delta
        }
        return {
          ...row,
          startIndex: row.startIndex + delta,
          rowIndex: rowIndex++,
          engineLine: row.engineLine
            ? shiftLayout(
                {
                  lines: [row.engineLine as LayoutLine],
                  direction: row.engineLine.direction,
                  paragraphText: row.engineParagraphText || ''
                },
                delta
              ).lines[0]
            : undefined
        }
      })
      return {
        ...paragraph,
        startIndex: paragraph.startIndex + delta,
        endIndex: paragraph.endIndex + delta,
        layout: paragraph.layout && shiftLayout(paragraph.layout, delta),
        rows
      }
    })
    this.paragraphs = [...prefix, ...changed, ...shiftedTail]
    this.elementCount = elements.length
    // Drop obsolete absolute-index handles, including deleted paragraphs.
    adapter.replaceParagraphLayouts(
      scope,
      this.paragraphs.flatMap(p =>
        p.layout
          ? [{ startIndex: p.startIndex, endIndex: p.endIndex, layout: p.layout }]
          : []
      )
    )
    return this.paragraphs.flatMap(p => p.rows)
  }
}
