import type {
  LayoutCaret,
  LayoutNode,
  LayoutRect
} from '../../interface/Layout'

/** Translate nodes in one scope; nested cell children keep their own origin. */
export function translateLayout(
  nodes: LayoutNode[],
  x: number,
  y: number
): LayoutNode[] {
  const rect = (value: LayoutRect) => ({
    ...value,
    x: value.x + x,
    y: value.y + y
  })
  const caret = (value: LayoutCaret) => ({
    ...value,
    x: value.x + x,
    y: value.y + y
  })
  return nodes.map(node => {
    switch (node.kind) {
      case 'textLine':
        return {
          ...node,
          rect: rect(node.rect),
          marker: node.marker
            ? (translateLayout([node.marker], x, y)[0] as typeof node.marker)
            : undefined,
          kind: node.kind,
          labels: node.labels?.map(label => ({
            ...label,
            rect: rect(label.rect)
          })),
          glyphs: node.glyphs,
          clusters: node.clusters.map(c => ({
            ...c,
            rect: rect(c.rect),
            carets: c.carets.map(caret)
          })),
          carets: node.carets.map(caret),
          inlines: translateLayout(node.inlines, x, y) as typeof node.inlines
        }
      case 'tableFragment':
        return {
          ...node,
          rect: rect(node.rect),
          cells: node.cells.map(cell => ({
            ...cell,
            rect: rect(cell.rect),
            clip: cell.clip ? rect(cell.clip) : undefined,
            contentRect: rect(cell.contentRect)
          }))
        }
      case 'inlineObject':
        return { ...node, rect: rect(node.rect), anchor: caret(node.anchor) }
      case 'missingGlyph':
        return {
          ...node,
          rect: rect(node.rect),
          carets: node.carets.map(caret)
        }
      case 'break':
        return { ...node, rect: rect(node.rect), caret: caret(node.caret) }
      case 'block':
        return {
          ...node,
          rect: rect(node.rect),
          anchor: node.anchor ? caret(node.anchor) : undefined,
          children: translateLayout(node.children, x, y)
        }
    }
  })
}
