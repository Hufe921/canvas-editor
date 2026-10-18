import type { IElement } from '../../interface/Element'
import type { LayoutNode } from '../../interface/Layout'
import { DocumentFlow, FlowPlacement } from '../layout/DocumentFlow'
import { translateLayout } from '../layout/translateLayout'
import { createTextRows } from './createTextRows'
import type { ParagraphSpan } from './ElementBridge'
import type { LayoutHostAdapter } from './LayoutHostAdapter'

/** Rebreak at the actual page/column/exclusion interval before host projection. */
export function layoutFlowParagraph(input: {
  adapter: LayoutHostAdapter
  flow: DocumentFlow
  paragraph: ParagraphSpan
  elements: IElement[]
  scope: string
  scale: number
  rowIndex: number
  listOffset: number
  markerGutter: number
  areaTop: number
  defaultFont: string
  defaultSize: number
  defaultAlign?: 'left' | 'right'
}) {
  const { adapter, paragraph, elements, scale, flow } = input
  const page = flow.page(flow.state.pageNo, flow.state.direction)
  const width = Math.max(1, page.width - input.listOffset)
  let constraints: { widths: number[]; offsets: number[] } | undefined
  let placements: FlowPlacement[] = []
  for (let pass = 0; pass < 64; pass++) {
    const native = adapter.layoutParagraph(
      paragraph,
      elements,
      width * scale,
      input.scope,
      input.defaultAlign,
      input.markerGutter,
      constraints
    )
    const cursor = flow.fork()
    placements = native.lines.map((line, index) =>
      cursor.place(
        line.contentHeight,
        line.spacingBefore + (index === 0 ? input.areaTop : 0),
        line.spacingAfter,
        input.listOffset,
        paragraph.direction === 'rtl',
        minimumAdvance(native.shaped.lines[index].glyphs)
      )
    )
    const next = {
      widths: placements.map(p => p.width),
      offsets: placements.map(p => p.x)
    }
    if (JSON.stringify(next) !== JSON.stringify(constraints)) {
      constraints = next
      continue
    }
    flow.state = { ...cursor.state }
    const rows = createTextRows(
      native.lines,
      elements,
      input.rowIndex,
      scale,
      paragraph.rowFlex
    )
    const nodes: LayoutNode[] = native.lines.map((line, index) => {
      const placement = placements[index]
      const page = flow.page(placement.pageNo, placement.direction)
      rows[index].flow = placement
      rows[index].columnIndex =
        input.scope === 'main' ? placement.columnIndex : undefined
      rows[index].isSurround =
        placement.x !== 0 || placement.width < page.width - input.listOffset
      if (index === 0)
        rows[index].offsetY = (rows[index].offsetY || 0) + input.areaTop * scale
      const x =
        page.left +
        page.columns[placement.columnIndex] +
        (paragraph.direction === 'ltr' ? placement.indent || 0 : 0)
      const y =
        placement.y +
        line.spacingBefore +
        (index === 0 ? input.areaTop : 0) -
        line.rect.y
      return {
        ...translateLayout([line], x, y)[0],
        placement: {
          pageNo: placement.pageNo,
          columnIndex: placement.columnIndex
        }
      }
    })
    return { rows, nodes }
  }
  throw new Error(
    'Native paragraph flow did not converge: ' + paragraph.startIndex
  )
}

function minimumAdvance(glyphs: import('../text-engine/types').ShapedGlyph[]) {
  const first = [...glyphs]
    .sort((a, b) => a.charStart - b.charStart)
    .find(g => g.ax > 0)
  if (!first) return 1
  return glyphs
    .filter(g =>
      first.atomic
        ? g.atomic?.start === first.atomic.start
        : g.charStart === first.charStart && g.charEnd === first.charEnd
    )
    .reduce((sum, g) => sum + Math.max(0, g.ax), 0)
}
