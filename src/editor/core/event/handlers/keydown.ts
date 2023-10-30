import { EditorMode, EditorZone } from '../../..'
import { ZERO } from '../../../dataset/constant/Common'
import { ElementType } from '../../../dataset/enum/Element'
import { KeyMap } from '../../../dataset/enum/KeyMap'
import { MoveDirection } from '../../../dataset/enum/Observer'
import { IElement, IElementPosition } from '../../../interface/Element'
import { formatElementContext } from '../../../utils/element'
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
  const activeControl = control.getActiveControl()
  if (evt.key === KeyMap.Backspace) {
    if (isReadonly || control.isPartRangeInControlOutside()) return
    let curIndex: number | null
    if (activeControl) {
      curIndex = control.keydown(evt)
    } else {
      // 判断是否允许删除
      if (isCollapsed && elementList[index].value === ZERO && index === 0) {
        evt.preventDefault()
        return
      }
      //  清空当前行对齐方式
      const startElement = elementList[startIndex]
      if (isCollapsed && startElement.rowFlex && startElement.value === ZERO) {
        const rowList = draw.getRowList()
        const rowNo = positionList[startIndex].rowNo
        const rowFlexElementList = rowList[rowNo].elementList
        rowFlexElementList.forEach(element => {
          delete element.rowFlex
        })
      }
      if (!isCollapsed) {
        draw.spliceElementList(
          elementList,
          startIndex + 1,
          endIndex - startIndex
        )
      } else {
        draw.spliceElementList(elementList, index, 1)
      }
      curIndex = isCollapsed ? index - 1 : startIndex
    }
    if (curIndex === null) return
    rangeManager.setRange(curIndex, curIndex)
    draw.render({ curIndex })
  } else if (evt.key === KeyMap.Delete) {
    if (isReadonly || control.isPartRangeInControlOutside()) return
    let curIndex: number | null
    if (activeControl) {
      curIndex = control.keydown(evt)
    } else if (elementList[endIndex + 1]?.type === ElementType.CONTROL) {
      curIndex = control.removeControl(endIndex + 1)
    } else {
      if (!isCollapsed) {
        draw.spliceElementList(
          elementList,
          startIndex + 1,
          endIndex - startIndex
        )
      } else {
        draw.spliceElementList(elementList, index + 1, 1)
      }
      curIndex = isCollapsed ? index : startIndex
    }
    if (curIndex === null) return
    rangeManager.setRange(curIndex, curIndex)
    draw.render({ curIndex })
  } else if (evt.key === KeyMap.Enter) {
    if (isReadonly || control.isPartRangeInControlOutside()) return
    const enterText: IElement = {
      value: ZERO
    }
    const startElement = elementList[startIndex]
    const endElement = elementList[endIndex]
    // 列表块内换行
    if (evt.shiftKey && startElement.listId) {
      enterText.listWrap = true
    }
    // 标题结尾处回车无需格式化
    if (
      !(
        endElement.titleId &&
        endElement.titleId !== elementList[endIndex + 1]?.titleId
      )
    ) {
      formatElementContext(elementList, [enterText], startIndex)
    }
    let curIndex: number
    if (activeControl && !control.isRangInPostfix()) {
      curIndex = control.setValue([enterText])
    } else {
      if (isCollapsed) {
        draw.spliceElementList(elementList, index + 1, 0, enterText)
      } else {
        draw.spliceElementList(
          elementList,
          startIndex + 1,
          endIndex - startIndex,
          enterText
        )
      }
      curIndex = index + 1
    }
    if (~curIndex) {
      rangeManager.setRange(curIndex, curIndex)
      draw.render({ curIndex })
    }
    evt.preventDefault()
  } else if (evt.key === KeyMap.Left) {
    if (isReadonly) return
    if (index > 0) {
      const cursorPosition = position.getCursorPosition()
      // 单词整体移动
      let moveCount = 1
      if (isMod(evt)) {
        const LETTER_REG = draw.getLetterReg()
        // 起始位置
        const moveStartIndex =
          evt.shiftKey && !isCollapsed && startIndex === cursorPosition?.index
            ? endIndex
            : startIndex
        if (LETTER_REG.test(elementList[moveStartIndex]?.value)) {
          let i = moveStartIndex - 1
          while (i > 0) {
            const element = elementList[i]
            if (!LETTER_REG.test(element.value)) {
              break
            }
            moveCount++
            i--
          }
        }
      }
      const curIndex = startIndex - moveCount
      // shift则缩放选区
      let anchorStartIndex = curIndex
      let anchorEndIndex = curIndex
      if (evt.shiftKey && cursorPosition) {
        if (startIndex !== endIndex) {
          if (startIndex === cursorPosition.index) {
            // 减小选区
            anchorStartIndex = startIndex
            anchorEndIndex = endIndex - moveCount
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
      const isAnchorCollapsed = anchorStartIndex === anchorEndIndex
      draw.render({
        curIndex: isAnchorCollapsed ? anchorStartIndex : undefined,
        isSetCursor: isAnchorCollapsed,
        isSubmitHistory: false,
        isCompute: false
      })
      evt.preventDefault()
    }
  } else if (evt.key === KeyMap.Right) {
    if (isReadonly) return
    if (index < positionList.length) {
      const cursorPosition = position.getCursorPosition()
      let moveCount = 1
      // 单词整体移动
      if (isMod(evt)) {
        const LETTER_REG = draw.getLetterReg()
        // 起始位置
        const moveStartIndex =
          evt.shiftKey && !isCollapsed && startIndex === cursorPosition?.index
            ? endIndex
            : startIndex
        if (LETTER_REG.test(elementList[moveStartIndex + 1]?.value)) {
          let i = moveStartIndex + 2
          while (i < elementList.length) {
            const element = elementList[i]
            if (!LETTER_REG.test(element.value)) {
              break
            }
            moveCount++
            i++
          }
        }
      }
      const curIndex = endIndex + moveCount
      // shift则缩放选区
      let anchorStartIndex = curIndex
      let anchorEndIndex = curIndex
      if (evt.shiftKey && cursorPosition) {
        if (startIndex !== endIndex) {
          if (startIndex === cursorPosition.index) {
            // 增大选区
            anchorStartIndex = startIndex
            anchorEndIndex = curIndex
          } else {
            anchorStartIndex = startIndex + moveCount
            anchorEndIndex = endIndex
          }
        } else {
          anchorStartIndex = startIndex
        }
      }
      const maxElementListIndex = elementList.length - 1
      if (
        anchorStartIndex > maxElementListIndex ||
        anchorEndIndex > maxElementListIndex
      ) {
        return
      }
      rangeManager.setRange(anchorStartIndex, anchorEndIndex)
      const isAnchorCollapsed = anchorStartIndex === anchorEndIndex
      draw.render({
        curIndex: isAnchorCollapsed ? anchorStartIndex : undefined,
        isSetCursor: isAnchorCollapsed,
        isSubmitHistory: false,
        isCompute: false
      })
      evt.preventDefault()
    }
  } else if (evt.key === KeyMap.Up || evt.key === KeyMap.Down) {
    if (isReadonly) return
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
        if (
          probablePosition[0] &&
          probablePosition[0].rowNo !== position.rowNo
        ) {
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
        if (
          probablePosition[0] &&
          probablePosition[0].rowNo !== position.rowNo
        ) {
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
  } else if (isMod(evt) && evt.key === KeyMap.Z) {
    if (isReadonly && draw.getMode() !== EditorMode.FORM) return
    historyManager.undo()
    evt.preventDefault()
  } else if (isMod(evt) && evt.key === KeyMap.Y) {
    if (isReadonly && draw.getMode() !== EditorMode.FORM) return
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
    const eventBus = draw.getEventBus()
    if (eventBus.isSubscribe('saved')) {
      eventBus.emit('saved', draw.getValue())
    }
    evt.preventDefault()
  } else if (evt.key === KeyMap.ESC) {
    // 退出格式刷
    host.clearPainterStyle()
    // 退出页眉页脚编辑
    const zoneManager = draw.getZone()
    if (!zoneManager.isMainActive()) {
      zoneManager.setZone(EditorZone.MAIN)
    }
    evt.preventDefault()
  } else if (evt.key === KeyMap.TAB) {
    const tabElement: IElement = {
      type: ElementType.TAB,
      value: ''
    }
    formatElementContext(elementList, [tabElement], startIndex)
    draw.insertElementList([tabElement])
    evt.preventDefault()
  }
}
