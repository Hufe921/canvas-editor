import { ZERO } from '../../../dataset/constant/Common'
import { ElementType } from '../../../dataset/enum/Element'
import { KeyMap } from '../../../dataset/enum/KeyMap'
import { IElement } from '../../../interface/Element'
import { CanvasEvent } from '../CanvasEvent'

export function keydown(evt: KeyboardEvent, host: CanvasEvent) {
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
      const curIndex = index - 1
      rangeManager.setRange(curIndex, curIndex)
      draw.render({
        curIndex,
        isSubmitHistory: false,
        isComputeRowList: false
      })
    }
  } else if (evt.key === KeyMap.Right) {
    if (isReadonly) return
    if (index < positionList.length - 1) {
      const curIndex = index + 1
      rangeManager.setRange(curIndex, curIndex)
      draw.render({
        curIndex,
        isSubmitHistory: false,
        isComputeRowList: false
      })
    }
  } else if (evt.key === KeyMap.Up || evt.key === KeyMap.Down) {
    if (isReadonly) return
    const { rowNo, index, coordinate: { leftTop, rightTop } } = cursorPosition
    if ((evt.key === KeyMap.Up && rowNo !== 0) || (evt.key === KeyMap.Down && rowNo !== draw.getRowCount())) {
      // 下一个光标点所在行位置集合
      const probablePosition = evt.key === KeyMap.Up
        ? positionList.slice(0, index).filter(p => p.rowNo === rowNo - 1)
        : positionList.slice(index, positionList.length - 1).filter(p => p.rowNo === rowNo + 1)
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
          }
        }
        // 当前光标在后
        else if (position.coordinate.leftTop[0] <= leftTop[0] && position.coordinate.rightTop[0] >= leftTop[0]) {
          const curDistance = position.coordinate.rightTop[0] - leftTop[0]
          if (curDistance > maxDistance) {
            maxIndex = position.index
            maxDistance = curDistance
          }
        }
        // 匹配不到
        if (p === probablePosition.length - 1 && maxIndex === 0) {
          maxIndex = position.index
        }
      }
      const curIndex = maxIndex
      rangeManager.setRange(curIndex, curIndex)
      draw.render({
        curIndex,
        isSubmitHistory: false,
        isComputeRowList: false
      })
    }
  } else if (evt.ctrlKey && evt.key === KeyMap.Z) {
    if (isReadonly) return
    historyManager.undo()
    evt.preventDefault()
  } else if (evt.ctrlKey && evt.key === KeyMap.Y) {
    if (isReadonly) return
    historyManager.redo()
    evt.preventDefault()
  } else if (evt.ctrlKey && evt.key === KeyMap.C) {
    host.copy()
    evt.preventDefault()
  } else if (evt.ctrlKey && evt.key === KeyMap.X) {
    host.cut()
    evt.preventDefault()
  } else if (evt.ctrlKey && evt.key === KeyMap.A) {
    host.selectAll()
    evt.preventDefault()
  } else if (evt.ctrlKey && evt.key === KeyMap.S) {
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