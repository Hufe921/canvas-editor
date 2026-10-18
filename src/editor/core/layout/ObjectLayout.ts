import type {
  BlockBox,
  BreakNode,
  LayoutCaret,
  LayoutRevision,
  LayoutSource
} from '../../interface/Layout'

export interface ObjectLayoutInput {
  align?: 'left' | 'right' | 'center'
  kind: 'iframe' | 'video' | 'float' | 'separator' | 'page'
  source: LayoutSource
  revision: LayoutRevision
  availableWidth: number
  width?: number
  height: number
  margin: number
  hidden: boolean
  paperDirection?: 'vertical' | 'horizontal'
  objectType?: 'image' | 'latex'
  floatPosition?: { x: number; y: number; pageNo?: number }
}

/** Object geometry and anchors, independent of text shaping and host rows. */
export function layoutObject(input: ObjectLayoutInput): BlockBox | BreakNode {
  const floating = input.kind === 'float'
  const margin =
    input.hidden || floating || input.kind === 'separator'
      ? 0
      : Math.max(0, input.margin)
  const width = floating
    ? Math.max(0, input.width || 0)
    : Math.max(
        0,
        Math.min(input.width ?? input.availableWidth, input.availableWidth)
      )
  const height = input.hidden
    ? 0
    : input.kind === 'page'
      ? margin * 2
      : Math.max(0, input.height)
  const x = floating
    ? 0
    : input.align === 'right'
      ? input.availableWidth - width
      : input.align === 'center'
        ? (input.availableWidth - width) / 2
        : 0
  const anchor: LayoutCaret = {
    position: { elementIndex: input.source.start, offset: 0 },
    affinity: 'downstream',
    x,
    y: 0,
    height: Math.max(height, 1),
    bidiLevel: 0
  }
  const base = {
    id: input.source.nodeId,
    source: { ...input.source },
    revision: { ...input.revision },
    hidden: input.hidden,
    rect: { x, y: input.kind === 'page' ? 0 : margin, width, height }
  }
  if (input.kind === 'page')
    return {
      ...base,
      kind: 'break',
      breakType: 'page',
      paperDirection: input.paperDirection,
      caret: anchor
    }
  return {
    ...base,
    kind: 'block',
    blockType: input.kind,
    children: [],
    anchor,
    outOfFlow: floating,
    spacingBefore: margin,
    spacingAfter: margin,
    objectType: input.objectType,
    floatPosition: input.floatPosition
  }
}
