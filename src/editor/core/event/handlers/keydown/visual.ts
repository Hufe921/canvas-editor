import { ControlComponent } from '../../../../dataset/enum/Control'
import { EditorMode } from '../../../../dataset/enum/Editor'
import { getVisualBidiCaret } from '../../../bidi/resolver/BidiCaret'
import { CanvasEvent } from '../../CanvasEvent'

// 仅在 BiDi 行内接管普通左右键；越界、组合键和控件边界沿用原逻辑
export function moveVisualCaret(
  evt: KeyboardEvent,
  host: CanvasEvent,
  step: -1 | 1
): boolean {
  if (evt.ctrlKey || evt.altKey || evt.metaKey) return false
  const draw = host.getDraw()
  const position = draw.getPosition()
  const cursorPosition = position.getCursorPosition()
  if (cursorPosition?.bidiLevel === undefined) return false
  if (
    draw.getMode() === EditorMode.FORM &&
    draw.getControl().getActiveControl()
  ) {
    const elementList = draw.getElementList()
    const boundaryElement =
      step < 0
        ? elementList[cursorPosition.index]
        : elementList[cursorPosition.index + 1]
    const component = boundaryElement?.controlComponent
    if (
      (step < 0 &&
        (component === ControlComponent.PREFIX ||
          component === ControlComponent.PRE_TEXT)) ||
      (step > 0 &&
        (component === ControlComponent.POSTFIX ||
          component === ControlComponent.POST_TEXT))
    ) {
      return false
    }
  }
  const cursor = draw.getCursor()
  const rangeManager = draw.getRange()
  const range = rangeManager.getRange()
  const positionList = position.getPositionList()
  const target = getVisualBidiCaret(
    positionList,
    cursorPosition,
    step,
    range.bidiAffinity,
    cursor.getHitLineStartIndex()
  )
  if (!target) {
    const hasAdjacentRow = positionList.some(
      item =>
        item.pageNo !== cursorPosition.pageNo ||
        item.rowNo !== cursorPosition.rowNo
    )
    if (hasAdjacentRow) return false
    evt.preventDefault()
    return true
  }
  if (target.index < 0) return false
  let startIndex = target.index
  let endIndex = target.index
  if (evt.shiftKey) {
    const activeIndex = cursorPosition.index
    const anchorIndex =
      range.startIndex === range.endIndex
        ? activeIndex
        : activeIndex === range.startIndex
          ? range.endIndex
          : range.startIndex
    startIndex = Math.min(anchorIndex, target.index)
    endIndex = Math.max(anchorIndex, target.index)
  }
  const targetPosition = positionList[target.index]
  if (targetPosition) position.setCursorPosition(targetPosition)
  rangeManager.setRange(startIndex, endIndex)
  const isCollapsed = startIndex === endIndex
  draw.render({
    isSetCursor: false,
    isSubmitHistory: false,
    isCompute: false
  })
  rangeManager.setBidiAffinity(target.affinity)
  if (isCollapsed) {
    cursor.drawCursor({ hitLineStartIndex: target.hitLineStartIndex })
  }
  evt.preventDefault()
  return true
}
