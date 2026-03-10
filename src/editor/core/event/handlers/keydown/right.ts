import { LocationPosition } from '../../../../dataset/enum/Common'
import { ControlComponent } from '../../../../dataset/enum/Control'
import { EditorMode } from '../../../../dataset/enum/Editor'
import { ElementType } from '../../../../dataset/enum/Element'
import { MoveDirection } from '../../../../dataset/enum/Observer'
import { getNonHideElementIndex } from '../../../../utils/element'
import { isMod } from '../../../../utils/hotkey'
import { CanvasEvent } from '../../CanvasEvent'

export function right(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  const position = draw.getPosition()
  const cursorPosition = position.getCursorPosition()
  if (!cursorPosition) return
  const { index } = cursorPosition
  const positionList = position.getPositionList()

  const hitLineStartIndex = draw.getCursor().getHitLineStartIndex()
  
  // Cursor can be in a logical position before the first character of the line (|ABC)
  // When pressing →, move to the first real character of the line (A|BC)
  const rangeManager = draw.getRange()
  
  if (!evt.shiftKey && !isMod(evt)) {
    // ABC| → |DEF
    if (hitLineStartIndex !== undefined) {
      let nextIndex = index
      
      // |ABC → A|BC
      if (positionList[index]?.isLastLetter) {
        nextIndex = hitLineStartIndex + 1
      }
      
      rangeManager.setRange(nextIndex, nextIndex)

      draw.render({
        curIndex: nextIndex,
        isSetCursor: true,
        isSubmitHistory: false,
        isCompute: false
      })

      evt.preventDefault()
      return
    }
  }

  const positionContext = position.getPositionContext()
  if (index > positionList.length - 1 && !positionContext.isTable) return
  const { startIndex, endIndex } = rangeManager.getRange()
  const isCollapsed = rangeManager.getIsCollapsed()
  let elementList = draw.getElementList()
  // 表单模式下控件移动
  const control = draw.getControl()
  if (
    draw.getMode() === EditorMode.FORM &&
    control.getActiveControl() &&
    (elementList[index + 1]?.controlComponent === ControlComponent.POSTFIX ||
      elementList[index + 1]?.controlComponent === ControlComponent.POST_TEXT)
  ) {
    control.initNextControl({
      direction: MoveDirection.DOWN
    })
    return
  }
  // 单词整体移动
  let moveCount = 1
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

  // When the cursor is at the end of the line (ABC|) and the next index already belongs to the next line
  // In this case, we position the cursor before the first character of the next line (|DEF)
  if (!evt.shiftKey && !isMod(evt)) {
    const nextPosition = positionList[curIndex]
    const currentPosition = positionList[endIndex]

    if (nextPosition && nextPosition.rowNo !== currentPosition.rowNo) {
      rangeManager.setRange(endIndex, endIndex)

      draw.render({
        curIndex: endIndex,
        isSetCursor: true,
        isSubmitHistory: false,
        isCompute: false
      })

      draw.getCursor().drawCursor({
        hitLineStartIndex: curIndex
      })

      evt.preventDefault()
      return
    }
  }

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
  // 表格单元格间跳转
  if (!evt.shiftKey) {
    const element = elementList[endIndex]
    const nextElement = elementList[endIndex + 1]
    // 后一个元素是表格，则进入单元格第一个起始位置
    if (nextElement?.type === ElementType.TABLE) {
      const trList = nextElement.trList!
      const nextTr = trList[0]
      const nextTd = nextTr.tdList[0]
      position.setPositionContext({
        isTable: true,
        index: endIndex + 1,
        trIndex: 0,
        tdIndex: 0,
        tdId: nextTd.id,
        trId: nextTr.id,
        tableId: nextElement.id
      })
      anchorStartIndex = 0
      anchorEndIndex = 0
      draw.getTableTool().render()
    } else if (element.tableId) {
      // 在表格单元格内&单元格元素最后
      if (!nextElement) {
        const originalElementList = draw.getOriginalElementList()
        const trList = originalElementList[positionContext.index!].trList!
        outer: for (let r = 0; r < trList.length; r++) {
          const tr = trList[r]
          if (tr.id !== element.trId) continue
          const tdList = tr.tdList
          for (let d = 0; d < tdList.length; d++) {
            const td = tdList[d]
            if (td.id !== element.tdId) continue
            // 移动到表格后
            if (r === trList.length - 1 && d === tdList.length - 1) {
              position.setPositionContext({
                isTable: false
              })
              anchorStartIndex = positionContext.index!
              anchorEndIndex = anchorStartIndex
              elementList = draw.getElementList()
              draw.getTableTool().dispose()
            } else {
              // 下一个单元格
              let nextTrIndex = r
              let nextTdIndex = d + 1
              if (nextTdIndex > tdList.length - 1) {
                nextTrIndex = r + 1
                nextTdIndex = 0
              }
              const preTr = trList[nextTrIndex]
              const preTd = preTr.tdList[nextTdIndex]
              position.setPositionContext({
                isTable: true,
                index: positionContext.index,
                trIndex: nextTrIndex,
                tdIndex: nextTdIndex,
                tdId: preTd.id,
                trId: preTr.id,
                tableId: element.tableId
              })
              anchorStartIndex = 0
              anchorEndIndex = anchorStartIndex
              draw.getTableTool().render()
            }
            break outer
          }
        }
      }
    }
  }
  // 执行跳转
  const maxElementListIndex = elementList.length - 1
  if (
    anchorStartIndex > maxElementListIndex ||
    anchorEndIndex > maxElementListIndex
  ) {
    return
  }
  // 隐藏元素跳过
  const newElementList = draw.getElementList()
  anchorStartIndex = getNonHideElementIndex(
    newElementList,
    anchorStartIndex,
    LocationPosition.AFTER
  )
  anchorEndIndex = getNonHideElementIndex(
    newElementList,
    anchorEndIndex,
    LocationPosition.AFTER
  )
  // 设置上下文
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
