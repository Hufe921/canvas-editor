import { ZERO } from '../../../../dataset/constant/Common'
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

  // 首字符非换行符需向前进1，避免光标没有显示在行首
  const isNonZero = positionList[lineStartIndex].value !== ZERO
  if (isNonZero) {
    lineStartIndex--
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
    // eslint-disable-next-line @typescript-eslint/no-extra-semi
    ;[anchorStart, anchorEnd] = [anchorEnd, anchorStart]
  }

  rangeManager.setRange(anchorStart, anchorEnd)

  const isCollapsed = anchorStart === anchorEnd

  draw.render({
    curIndex: isCollapsed ? anchorStart : undefined,
    isSetCursor: isCollapsed,
    isSubmitHistory: false,
    isCompute: false
  })

  // 光标显示下一行首
  if (isNonZero) {
    draw.getCursor().drawCursor({
      hitLineStartIndex: lineStartIndex + 1
    })
  }

  evt.preventDefault()
}
