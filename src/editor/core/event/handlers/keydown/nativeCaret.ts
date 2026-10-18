import { EditorMode } from '../../../../dataset/enum/Editor'
import { ElementType } from '../../../../dataset/enum/Element'
import { CaretMovement } from '../../../../dataset/enum/TextDirection'
import { isApple } from '../../../../utils/ua'
import type { CanvasEvent } from '../../CanvasEvent'

/** Keep fixed anchor and active native affinity separate during Shift moves. */
export function moveNativeCaret(
  evt: KeyboardEvent,
  host: CanvasEvent,
  delta: 1 | -1,
  vertical = false
): boolean {
  const draw = host.getDraw()
  const position = draw.getPosition()
  if (!position.moveNativeCaret || (isApple ? evt.altKey : evt.ctrlKey))
    return false
  if (
    draw.getMode() === EditorMode.FORM &&
    draw.getControl().getActiveControl()
  )
    return false
  const range = draw.getRange()
  const { startIndex, endIndex, isCrossRowCol } = range.getRange()
  if (isCrossRowCol || startIndex < 0) return false
  const collapsed = startIndex === endIndex
  const anchor = position.getCursorPosition()?.index ?? startIndex
  const focus = collapsed
    ? startIndex
    : anchor === startIndex
      ? endIndex
      : startIndex
  let target = position.moveNativeCaret(
    focus,
    delta,
    draw.getOptions().caretMovement !== CaretMovement.LOGICAL,
    vertical
  )
  if (!target) return false
  const elements = draw.getElementList()
  // Enter/leave objects and table scopes through their existing host contracts.
  const from = Math.min(focus, target.index),
    to = Math.max(focus, target.index)
  if (elements.slice(from + 1, to + 1).some(e => e.type === ElementType.TABLE))
    return false
  if (!evt.shiftKey && !collapsed)
    target = position.getNativeCaret(delta < 0 ? startIndex : endIndex)
  if (!target) return false
  const controlId = elements[focus]?.controlId
  if (controlId && elements[target.index]?.controlId !== controlId) return false
  const fixed = evt.shiftKey ? anchor : target.index
  range.setRange(Math.min(fixed, target.index), Math.max(fixed, target.index))
  position.setNativeCaretHint(target)
  const isCollapsed = fixed === target.index
  draw.render({
    curIndex: isCollapsed ? target.index : undefined,
    isSetCursor: isCollapsed,
    isCompute: false,
    isSubmitHistory: false
  })
  evt.preventDefault()
  return true
}
