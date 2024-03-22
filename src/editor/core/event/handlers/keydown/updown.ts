import { KeyMap } from '../../../../dataset/enum/KeyMap'
import { MoveDirection } from '../../../../dataset/enum/Observer'
import { IElementPosition } from '../../../../interface/Element'
import { CanvasEvent } from '../../CanvasEvent'

export function updown(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  const position = draw.getPosition()
  const cursorPosition = position.getCursorPosition()
  if (!cursorPosition) return
  const rangeManager = draw.getRange()
  const { startIndex, endIndex } = rangeManager.getRange()
  const positionList = position.getPositionList()
  let anchorPosition: IElementPosition = cursorPosition
  // 扩大选区时，判断移动光标点
  if (evt.shiftKey) {
    if (startIndex === cursorPosition.index) {
      anchorPosition = positionList[endIndex]
    } else {
      anchorPosition = positionList[startIndex]
    }
  }
  const {
    index,
    rowNo,
    rowIndex,
    coordinate: {
      leftTop: [curLeftX],
      rightTop: [curRightX]
    }
  } = anchorPosition
  // 向上时在首行、向下时在尾行则忽略
  const isUp = evt.key === KeyMap.Up
  if (
    (isUp && rowIndex === 0) ||
    (!isUp && rowIndex === draw.getRowCount() - 1)
  ) {
    return
  }
  // 查找下一行位置列表
  const probablePosition: IElementPosition[] = []
  if (isUp) {
    let p = index - 1
    while (p > 0) {
      const position = positionList[p]
      p--
      if (position.rowNo === rowNo) continue
      if (probablePosition[0] && probablePosition[0].rowNo !== position.rowNo) {
        break
      }
      probablePosition.unshift(position)
    }
  } else {
    let p = index + 1
    while (p < positionList.length) {
      const position = positionList[p]
      p++
      if (position.rowNo === rowNo) continue
      if (probablePosition[0] && probablePosition[0].rowNo !== position.rowNo) {
        break
      }
      probablePosition.push(position)
    }
  }
  // 查找下一行位置：第一个存在交叉宽度的元素位置
  let nextIndex = 0
  for (let p = 0; p < probablePosition.length; p++) {
    const nextPosition = probablePosition[p]
    const {
      coordinate: {
        leftTop: [nextLeftX],
        rightTop: [nextRightX]
      }
    } = nextPosition
    if (p === probablePosition.length - 1) {
      nextIndex = nextPosition.index
    }
    if (curRightX <= nextLeftX || curLeftX >= nextRightX) continue
    nextIndex = nextPosition.index
    break
  }
  if (!nextIndex) return
  // shift则缩放选区
  let anchorStartIndex = nextIndex
  let anchorEndIndex = nextIndex
  if (evt.shiftKey) {
    if (startIndex !== endIndex) {
      if (startIndex === cursorPosition.index) {
        anchorStartIndex = startIndex
      } else {
        anchorEndIndex = endIndex
      }
    } else {
      if (isUp) {
        anchorEndIndex = endIndex
      } else {
        anchorStartIndex = startIndex
      }
    }
  }
  if (anchorStartIndex > anchorEndIndex) {
    // prettier-ignore
    [anchorStartIndex, anchorEndIndex] = [anchorEndIndex, anchorStartIndex]
  }
  rangeManager.setRange(anchorStartIndex, anchorEndIndex)
  const isCollapsed = anchorStartIndex === anchorEndIndex
  draw.render({
    curIndex: isCollapsed ? anchorStartIndex : undefined,
    isSetCursor: isCollapsed,
    isSubmitHistory: false,
    isCompute: false
  })
  // 将光标移动到可视范围内
  draw.getCursor().moveCursorToVisible({
    cursorPosition: positionList[isUp ? anchorStartIndex : anchorEndIndex],
    direction: isUp ? MoveDirection.UP : MoveDirection.DOWN
  })
}
