import { ZERO } from '../../../../dataset/constant/Common'
import { CanvasEvent } from '../../CanvasEvent'

// 删除光标前隐藏元素
function backspaceHideElement(host: CanvasEvent) {
  const draw = host.getDraw()
  const rangeManager = draw.getRange()
  const range = rangeManager.getRange()
  // 光标所在位置为隐藏元素时触发循环删除
  const elementList = draw.getElementList()
  const element = elementList[range.startIndex]
  if (!element.hide && !element.control?.hide && !element.area?.hide) return
  // 向前删除所有隐藏元素
  let index = range.startIndex
  while (index > 0) {
    const element = elementList[index]
    let newIndex: number | null = null
    if (element.controlId) {
      newIndex = draw.getControl().removeControl(index)
      if (newIndex !== null) {
        index = newIndex
      }
    } else {
      draw.spliceElementList(elementList, index, 1)
      newIndex = index - 1
      index--
    }
    const newElement = elementList[newIndex!]
    if (
      !newElement ||
      (!newElement.hide && !newElement.control?.hide && !newElement.area?.hide)
    ) {
      // 更新上下文信息
      if (newIndex) {
        // 更新选区信息
        range.startIndex = newIndex
        range.endIndex = newIndex
        rangeManager.replaceRange(range)
        // 更新位置信息
        const position = draw.getPosition()
        const positionList = position.getPositionList()
        position.setCursorPosition(positionList[newIndex])
      }
      break
    }
  }
}

export function backspace(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  if (draw.isReadonly()) return
  // 可输入性验证
  const rangeManager = draw.getRange()
  if (!rangeManager.getIsCanInput()) return
  // 隐藏元素删除
  if (rangeManager.getIsCollapsed()) {
    backspaceHideElement(host)
  }
  // 删除操作
  const control = draw.getControl()
  const { startIndex, endIndex, isCrossRowCol } = rangeManager.getRange()
  let curIndex: number | null
  if (isCrossRowCol) {
    // 表格跨行列选中时清空单元格内容
    const rowCol = draw.getTableParticle().getRangeRowCol()
    if (!rowCol) return
    let isDeleted = false
    for (let r = 0; r < rowCol.length; r++) {
      const row = rowCol[r]
      for (let c = 0; c < row.length; c++) {
        const col = row[c]
        if (col.value.length > 1) {
          draw.spliceElementList(col.value, 1, col.value.length - 1)
          isDeleted = true
        }
      }
    }
    // 删除成功后定位
    curIndex = isDeleted ? 0 : null
  } else if (
    control.getActiveControl() &&
    control.getIsRangeCanCaptureEvent()
  ) {
    // 光标在控件内
    curIndex = control.keydown(evt)
    if (curIndex) {
      control.emitControlContentChange()
    }
  } else {
    // 普通元素删除
    const cursorPosition = draw.getPosition().getCursorPosition()
    if (!cursorPosition) return
    const { index } = cursorPosition
    const isCollapsed = rangeManager.getIsCollapsed()
    const elementList = draw.getElementList()
    // 判断是否允许删除
    if (isCollapsed && index === 0) {
      const firstElement = elementList[index]
      // 检查是否在表格单元格内
      const positionContext = draw.getPosition().getPositionContext()
      if (positionContext.isTable && firstElement.tableId) {
        // 检查是否是分页表格，如果是则跳转到上一页表格的对应单元格
        const originalElementList = draw.getOriginalElementList()
        const currentElement = originalElementList[positionContext.index!]
        if (currentElement?.pagingId && (currentElement.pagingIndex ?? 0) > 0) {
          // 查找上一页的表格
          let prevTableIndex = -1
          for (let i = positionContext.index! - 1; i >= 0; i--) {
            if (originalElementList[i]?.pagingId === currentElement.pagingId) {
              prevTableIndex = i
              break
            }
          }
          if (~prevTableIndex) {
            const prevElement = originalElementList[prevTableIndex]
            const prevTrList = prevElement.trList!
            // 找到上一页表格的最后一行（非重复表头）
            let lastTrIndex = prevTrList.length - 1
            while (lastTrIndex >= 0 && prevTrList[lastTrIndex].pagingRepeat) {
              lastTrIndex--
            }
            if (lastTrIndex >= 0) {
              const lastTr = prevTrList[lastTrIndex]
              // 查找当前单元格所在列在上一页对应位置的单元格
              const curTdColIndex = positionContext.tdIndex ?? 0
              let targetTdIndex = -1
              for (let d = 0; d < lastTr.tdList.length; d++) {
                const td = lastTr.tdList[d]
                if (
                  td.colIndex === curTdColIndex ||
                  (td.colIndex! + td.colspan - 1 >= curTdColIndex &&
                    td.colIndex! <= curTdColIndex)
                ) {
                  targetTdIndex = d
                  break
                }
              }
              if (~targetTdIndex) {
                // 先删除当前单元格的第一个元素（如果存在且不是ZERO占位符）
                if (firstElement.value !== ZERO) {
                  draw.spliceElementList(elementList, 0, 1)
                }
                const targetTd = lastTr.tdList[targetTdIndex]
                const position = draw.getPosition()
                position.setPositionContext({
                  isTable: true,
                  index: prevTableIndex,
                  trIndex: lastTrIndex,
                  tdIndex: targetTdIndex,
                  tdId: targetTd.id,
                  trId: lastTr.id,
                  tableId: prevElement.id
                })
                // 跳转到目标单元格的最后一个元素
                const targetIndex = targetTd.value.length - 1
                rangeManager.setRange(targetIndex, targetIndex)
                draw.render({
                  curIndex: targetIndex,
                  isSetCursor: true,
                  isSubmitHistory: false
                })
                draw.getTableTool().render()
                evt.preventDefault()
                return
              }
            }
          }
        }
      }
      if (firstElement.value === ZERO) {
        // 取消首字符列表设置
        if (firstElement.listId) {
          draw.getListParticle().unsetList()
        }
        evt.preventDefault()
        return
      }
    }
    //  替换当前行对齐方式
    const startElement = elementList[startIndex]
    if (isCollapsed && startElement.rowFlex && startElement.value === ZERO) {
      const rowFlexElementList = rangeManager.getRangeRowElementList()
      if (rowFlexElementList) {
        const preElement = elementList[startIndex - 1]
        rowFlexElementList.forEach(element => {
          element.rowFlex = preElement?.rowFlex
        })
      }
    }
    if (!isCollapsed) {
      draw.spliceElementList(elementList, startIndex + 1, endIndex - startIndex)
    } else {
      draw.spliceElementList(elementList, index, 1)
    }
    curIndex = isCollapsed ? index - 1 : startIndex
  }
  draw.getGlobalEvent().setCanvasEventAbility()
  if (curIndex === null) {
    rangeManager.setRange(startIndex, startIndex)
    draw.render({
      curIndex: startIndex,
      isSubmitHistory: false
    })
  } else {
    rangeManager.setRange(curIndex, curIndex)
    draw.render({
      curIndex
    })
  }
}
