import { DeleteMovement, TextDirection } from '../../../../dataset/enum/TextDirection'
import { ZERO } from '../../../../dataset/constant/Common'
import { ElementType } from '../../../../dataset/enum/Element'
import { resolveLayoutScope } from '../../../text-engine-host/LayoutHostAdapter'
import type { CanvasEvent } from '../../CanvasEvent'

export interface IVisualDeleteTarget {
  index: number
  cursorIndex: number
}

/**
 * Resolve the element adjacent to the caret in visual order. The existing
 * logical deletion path remains the fallback for legacy rows and controls.
 */
export function getVisualDeleteTarget(
  host: CanvasEvent,
  index: number,
  isBackspace: boolean
): IVisualDeleteTarget | null {
  const draw = host.getDraw()
  if (draw.getOptions().deleteMovement !== DeleteMovement.VISUAL) return null
  const adapter = draw.getLayoutHostAdapter()
  if (!adapter.isReady()) return null

  const elementList = draw.getElementList()
  const element = elementList[index]
  const position = draw.getPosition().getCursorPosition()
  const row = draw.getOriginalRowList().find(row =>
    row.elementList.some(item => item.sourceIndex === index)
  )
  const isRtl =
    ((position?.bidiLevel ?? 0) & 1) === 1 ||
    row?.direction === TextDirection.RTL ||
    element?.direction === TextDirection.RTL
  const positionContext = draw.getPosition().getPositionContext()
  const layoutScope = resolveLayoutScope({
    zone: draw.getZone().getZone(),
    isTable: positionContext.isTable,
    tdId: positionContext.tdId
  })

  let targetIndex: number
  let cursorIndex: number
  if (isRtl && isBackspace) {
    targetIndex =
      adapter.visualNeighbor(index, -1, layoutScope) ?? index + 1
    cursorIndex = index
  } else if (isRtl) {
    targetIndex = index
    cursorIndex = index - 1
  } else if (isBackspace) {
    targetIndex = index
    cursorIndex = index - 1
  } else {
    targetIndex = index + 1
    cursorIndex = index
  }

  const target = elementList[targetIndex]
  if (
    !target ||
    target.value === ZERO ||
    target.controlId ||
    target.type === ElementType.TABLE
  ) {
    return null
  }
  return { index: targetIndex, cursorIndex }
}
