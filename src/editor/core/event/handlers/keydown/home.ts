import { CanvasEvent } from '../../CanvasEvent'

export function home(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  if (draw.isReadonly()) return

  const position = draw.getPosition()
  const cursorPosition = position.getCursorPosition()
  if (!cursorPosition) return

  const rangeManager = draw.getRange()
  const { startIndex, endIndex } = rangeManager.getRange()
  const positionList = position.getPositionList()

  // Determine which side is active (same as updown)
  let anchorPosition = cursorPosition

  if (evt.shiftKey && startIndex !== endIndex) {
    if (startIndex === cursorPosition.index) {
      anchorPosition = positionList[endIndex]
    } else {
      anchorPosition = positionList[startIndex]
    }
  }

  const { rowNo } = anchorPosition

  // Find the start of the line based on the active side
  let lineStartIndex = anchorPosition.index
  for (let i = anchorPosition.index - 1; i >= 0; i--) {
    if (positionList[i].rowNo !== rowNo) break
    lineStartIndex = i
  }

  let anchorStart = lineStartIndex
  let anchorEnd = lineStartIndex

  if (evt.shiftKey) {
    if (startIndex !== endIndex) {
      if (startIndex === cursorPosition.index) {
        anchorStart = startIndex
        anchorEnd = lineStartIndex
      } else {
        anchorStart = lineStartIndex
        anchorEnd = endIndex
      }
    } else {
      anchorStart = lineStartIndex
      anchorEnd = startIndex
    }
  }

  if (anchorStart > anchorEnd) {
    [anchorStart, anchorEnd] = [anchorEnd, anchorStart]
  }

  rangeManager.setRange(anchorStart, anchorEnd)

  const isCollapsed = anchorStart === anchorEnd

  draw.render({
    curIndex: isCollapsed ? anchorStart : undefined,
    isSetCursor: isCollapsed,
    isSubmitHistory: false,
    isCompute: false
  })

  evt.preventDefault()
}