import { ElementType } from '../../../../dataset/enum/Element'
import { isMod } from '../../../../utils/hotkey'
import { CanvasEvent } from '../../CanvasEvent'

export function left(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  const position = draw.getPosition()
  const cursorPosition = position.getCursorPosition()
  if (!cursorPosition) return
  const positionContext = position.getPositionContext()
  const { index } = cursorPosition
  if (index <= 0 && !positionContext.isTable) return
  const rangeManager = draw.getRange()
  const { startIndex, endIndex } = rangeManager.getRange()
  const isCollapsed = rangeManager.getIsCollapsed()
  const elementList = draw.getElementList()
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
  // 表格单元格间跳转
  if (!evt.shiftKey) {
    const element = elementList[startIndex]
    // 之前是表格则进入最后一个单元格最后一个元素
    if (element.type === ElementType.TABLE) {
      const trList = element.trList!
      const lastTrIndex = trList.length - 1
      const lastTr = trList[lastTrIndex]
      const lastTdIndex = lastTr.tdList.length - 1
      const lastTd = lastTr.tdList[lastTdIndex]
      position.setPositionContext({
        isTable: true,
        index: startIndex,
        trIndex: lastTrIndex,
        tdIndex: lastTdIndex,
        tdId: lastTd.id,
        trId: lastTr.id,
        tableId: element.id
      })
      anchorStartIndex = lastTd.value.length - 1
      anchorEndIndex = anchorStartIndex
      draw.getTableTool().render()
    } else if (element.tableId) {
      // 在表格单元格内&在首位则往前移动单元格
      if (startIndex === 0) {
        const originalElementList = draw.getOriginalElementList()
        const trList = originalElementList[positionContext.index!].trList!
        outer: for (let r = 0; r < trList.length; r++) {
          const tr = trList[r]
          if (tr.id !== element.trId) continue
          const tdList = tr.tdList
          for (let d = 0; d < tdList.length; d++) {
            const td = tdList[d]
            if (td.id !== element.tdId) continue
            // 移动到表格前
            if (r === 0 && d === 0) {
              position.setPositionContext({
                isTable: false
              })
              anchorStartIndex = positionContext.index! - 1
              anchorEndIndex = anchorStartIndex
              draw.getTableTool().dispose()
            } else {
              // 上一个单元格
              let preTrIndex = r
              let preTdIndex = d - 1
              if (preTdIndex < 0) {
                preTrIndex = r - 1
                preTdIndex = trList[preTrIndex].tdList.length - 1
              }
              const preTr = trList[preTrIndex]
              const preTd = preTr.tdList[preTdIndex]
              position.setPositionContext({
                isTable: true,
                index: positionContext.index,
                trIndex: preTrIndex,
                tdIndex: preTdIndex,
                tdId: preTd.id,
                trId: preTr.id,
                tableId: element.id
              })
              anchorStartIndex = preTd.value.length - 1
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
