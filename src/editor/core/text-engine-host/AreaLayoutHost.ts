import type { IElement } from '../../interface/Element'
import type { BlockBox, LayoutNode } from '../../interface/Layout'
import { getLayoutFlowHeight } from '../text-engine/layout/layoutProtocol'

/** Reassemble normalized Area runs without introducing persisted wrapper nodes. */
export function groupAreaLayouts(
  nodes: LayoutNode[],
  elements: IElement[],
  width: number,
  inheritedAreaId?: string
): LayoutNode[] {
  const result: LayoutNode[] = []
  for (let index = 0; index < nodes.length; ) {
    const first = nodes[index]
    const element = elements[first.source.start]
    const areaId = element?.areaId
    if (!areaId || areaId === inheritedAreaId) {
      result.push(first)
      index++
      continue
    }
    const children: LayoutNode[] = []
    while (
      index < nodes.length &&
      elements[nodes[index].source.start]?.areaId === areaId
    )
      children.push(nodes[index++])
    const before =
      first.kind === 'textLine'
        ? first.spacingBefore
        : first.kind === 'block'
          ? first.spacingBefore || 0
          : 0
    const hidden = children.every(node => node.hidden)
    const area: BlockBox = {
      kind: 'block',
      blockType: 'area',
      id: first.source.scope + ':area:' + areaId,
      source: {
        ...first.source,
        nodeId: areaId,
        end: children[children.length - 1].source.end
      },
      revision: { ...first.revision },
      rect: {
        x: 0,
        y: first.rect.y - before,
        width,
        height: children.reduce(
          (sum, child) => sum + getLayoutFlowHeight(child),
          0
        )
      },
      hidden,
      children,
      areaId,
      spacingBefore: hidden ? 0 : Math.max(0, element.area?.top || 0),
      borderColor: element.area?.borderColor,
      backgroundColor: element.area?.backgroundColor,
      anchor:
        first.kind === 'textLine'
          ? first.carets[0]
          : first.kind === 'break'
            ? first.caret
            : first.kind === 'block'
              ? first.anchor
              : undefined
    }
    result.push(area)
  }
  return result
}
