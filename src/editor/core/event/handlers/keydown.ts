import { ZERO } from '../../../dataset/constant/Common'
import { ElementType } from '../../../dataset/enum/Element'
import { KeyMap } from '../../../dataset/enum/KeyMap'
import { IElement, IElementPosition } from '../../../interface/Element'
import { isMod } from '../../../utils/hotkey'
import { CanvasEvent } from '../CanvasEvent'

export function keydown(evt: KeyboardEvent, host: CanvasEvent) {
  if (host.isComposing) return
  const draw = host.getDraw()
  const position = draw.getPosition()
  const cursorPosition = position.getCursorPosition()
  if (!cursorPosition) return
  const isReadonly = draw.isReadonly()
  const historyManager = draw.getHistoryManager()
  const elementList = draw.getElementList()
  const positionList = position.getPositionList()
  const { index } = cursorPosition
  const rangeManager = draw.getRange()
  const { startIndex, endIndex } = rangeManager.getRange()
  const isCollapsed = startIndex === endIndex
  // 当前激活控件
  const control = draw.getControl()
  const isPartRangeInControlOutside = control.isPartRangeInControlOutside()
  const activeControl = control.getActiveControl()
  if (evt.key === KeyMap.Backspace) {
    if (isReadonly || isPartRangeInControlOutside) return
    let curIndex: number
    if (activeControl) {
      curIndex = control.keydown(evt)
    } else {
      // 判断是否允许删除
      if (isCollapsed && elementList[index].value === ZERO && index === 0) {
        evt.preventDefault()
        return
      }
      if (!isCollapsed) {
        elementList.splice(startIndex + 1, endIndex - startIndex)
      } else {
        elementList.splice(index, 1)
      }
      curIndex = isCollapsed ? index - 1 : startIndex
    }
    rangeManager.setRange(curIndex, curIndex)
    draw.render({ curIndex })
  } else if (evt.key === KeyMap.Delete) {
    if (isReadonly || isPartRangeInControlOutside) return
    let curIndex: number
    if (activeControl) {
      curIndex = control.keydown(evt)
    } else if (elementList[endIndex + 1]?.type === ElementType.CONTROL) {
      curIndex = control.removeControl(endIndex + 1)
    } else {
      if (!isCollapsed) {
        elementList.splice(startIndex + 1, endIndex - startIndex)
      } else {
        elementList.splice(index + 1, 1)
      }
      curIndex = isCollapsed ? index : startIndex
    }
    rangeManager.setRange(curIndex, curIndex)
    draw.render({ curIndex })
  } else if (evt.key === KeyMap.Enter) {
    if (isReadonly || isPartRangeInControlOutside) return
    // 表格需要上下文信息
    const positionContext = position.getPositionContext()
    let restArg = {}
    if (positionContext.isTable) {
      const { tdId, trId, tableId } = positionContext
      restArg = { tdId, trId, tableId }
    }
    const enterText: IElement = {
      value: ZERO,
      ...restArg
    }
    let curIndex: number
    if (activeControl) {
      curIndex = control.setValue([enterText])
    } else {
      if (isCollapsed) {
        elementList.splice(index + 1, 0, enterText)
      } else {
        elementList.splice(startIndex + 1, endIndex - startIndex, enterText)
      }
      curIndex = index + 1
    }
    rangeManager.setRange(curIndex, curIndex)
    draw.render({ curIndex })
    evt.preventDefault()
  } else if (evt.key === KeyMap.Left) {
    if (isReadonly) return
    if (index > 0) {
      const curIndex = startIndex - 1
      // shift则缩放选区
      let anchorStartIndex = curIndex
      let anchorEndIndex = curIndex
      const cursorPosition = position.getCursorPosition()
      if (evt.shiftKey && cursorPosition) {
        if (startIndex !== endIndex) {
          if (startIndex === cursorPosition.index) {
            // 减小选区
            anchorStartIndex = startIndex
            anchorEndIndex = endIndex - 1
          } else {
            anchorStartIndex = curIndex
            anchorEndIndex = endIndex
          }
        } else {
          anchorEndIndex = endIndex
        }
      }
      if (!~anchorStartIndex || !~anchorEndIndex) return
      rangeManager.setRange(anchorStartIndex, anchorEndIndex)
      const isCollapsed = anchorStartIndex === anchorEndIndex
      draw.render({
        curIndex: isCollapsed ? anchorStartIndex : undefined,
        isSetCursor: isCollapsed,
        isSubmitHistory: false,
        isComputeRowList: false
      })
      evt.preventDefault()
    }
  } else if (evt.key === KeyMap.Right) {
    if (isReadonly) return
    if (index < positionList.length) {
      const curIndex = endIndex + 1
      // shift则缩放选区
      let anchorStartIndex = curIndex
      let anchorEndIndex = curIndex
      const cursorPosition = position.getCursorPosition()
      if (evt.shiftKey && cursorPosition) {
        if (startIndex !== endIndex) {
          if (startIndex === cursorPosition.index) {
            // 增大选区
            anchorStartIndex = startIndex
            anchorEndIndex = curIndex
          } else {
            anchorStartIndex = startIndex + 1
            anchorEndIndex = endIndex
          }
        } else {
          anchorStartIndex = startIndex
        }
      }
      const maxElementListIndex = elementList.length - 1
      if (anchorStartIndex > maxElementListIndex || anchorEndIndex > maxElementListIndex) return
      rangeManager.setRange(anchorStartIndex, anchorEndIndex)
      const isCollapsed = anchorStartIndex === anchorEndIndex
      draw.render({
        curIndex: isCollapsed ? anchorStartIndex : undefined,
        isSetCursor: isCollapsed,
        isSubmitHistory: false,
        isComputeRowList: false
      })
      evt.preventDefault()
    }
  } else if (evt.key === KeyMap.Up || evt.key === KeyMap.Down) {
    if (isReadonly) return
    let anchorPosition: IElementPosition = cursorPosition
    const isUp = evt.key === KeyMap.Up
    if (evt.shiftKey) {
      if (startIndex === cursorPosition.index) {
        anchorPosition = positionList[endIndex]
      } else {
        anchorPosition = positionList[startIndex]
      }
    }
    const { rowNo, index, pageNo, coordinate: { leftTop, rightTop } } = anchorPosition
    if ((isUp && rowNo !== 0) || (!isUp && rowNo !== draw.getRowCount())) {
      // 下一个光标点所在行位置集合
      const probablePosition = isUp
        ? positionList.slice(0, index)
          .filter(p => p.rowNo === rowNo - 1 && pageNo === p.pageNo)
        : positionList.slice(index, positionList.length - 1)
          .filter(p => p.rowNo === rowNo + 1 && pageNo === p.pageNo)
      // 查找与当前位置元素点交叉最多的位置
      let maxIndex = 0
      let maxDistance = 0
      for (let p = 0; p < probablePosition.length; p++) {
        const position = probablePosition[p]
        // 当前光标在前
        if (position.coordinate.leftTop[0] >= leftTop[0] && position.coordinate.leftTop[0] <= rightTop[0]) {
          const curDistance = rightTop[0] - position.coordinate.leftTop[0]
          if (curDistance > maxDistance) {
            maxIndex = position.index
            maxDistance = curDistance
            break
          }
        }
        // 当前光标在后
        else if (position.coordinate.leftTop[0] <= leftTop[0] && position.coordinate.rightTop[0] >= leftTop[0]) {
          const curDistance = position.coordinate.rightTop[0] - leftTop[0]
          if (curDistance > maxDistance) {
            maxIndex = position.index
            maxDistance = curDistance
            break
          }
        }
        // 匹配不到
        if (p === probablePosition.length - 1 && maxIndex === 0) {
          maxIndex = position.index
        }
      }
      const curIndex = maxIndex
      // shift则缩放选区
      let anchorStartIndex = curIndex
      let anchorEndIndex = curIndex
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
        [anchorStartIndex, anchorEndIndex] = [anchorEndIndex, anchorStartIndex]
      }
      rangeManager.setRange(anchorStartIndex, anchorEndIndex)
      const isCollapsed = anchorStartIndex === anchorEndIndex
      draw.render({
        curIndex: isCollapsed ? anchorStartIndex : undefined,
        isSetCursor: isCollapsed,
        isSubmitHistory: false,
        isComputeRowList: false
      })
    }
  } else if (isMod(evt) && evt.key === KeyMap.Z) {
    if (isReadonly) return
    historyManager.undo()
    evt.preventDefault()
  } else if (isMod(evt) && evt.key === KeyMap.Y) {
    if (isReadonly) return
    historyManager.redo()
    evt.preventDefault()
  } else if (isMod(evt) && evt.key === KeyMap.C) {
    host.copy()
    evt.preventDefault()
  } else if (isMod(evt) && evt.key === KeyMap.X) {
    host.cut()
    evt.preventDefault()
  } else if (isMod(evt) && evt.key === KeyMap.A) {
    host.selectAll()
    evt.preventDefault()
  } else if (isMod(evt) && evt.key === KeyMap.S) {
    if (isReadonly) return
    const listener = draw.getListener()
    if (listener.saved) {
      listener.saved(draw.getValue())
    }
    evt.preventDefault()
  } else if (evt.key === KeyMap.ESC) {
    host.clearPainterStyle()
    evt.preventDefault()
  } else if (evt.key === KeyMap.TAB) {
    draw.insertElementList([{
      type: ElementType.TAB,
      value: ''
    }])
    evt.preventDefault()
  }
}