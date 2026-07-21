import { ZERO } from '../../../../dataset/constant/Common'
import { ElementType } from '../../../../dataset/enum/Element'
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
      if (firstElement.value === ZERO) {
        // 分割表格：在分割后的非首个分片的首行首格按删除键，光标应跳转到上一个分片末尾
        const position = draw.getPosition()
        const positionContext = position.getPositionContext()
        if (
          positionContext.isTable &&
          positionContext.trIndex === 0 &&
          positionContext.tdIndex === 0
        ) {
          const originalElementList = draw.getOriginalElementList()
          const curTableElement = originalElementList[positionContext.index!]
          if (
            curTableElement?.pagingId &&
            (curTableElement.pagingIndex ?? 0) > 0
          ) {
            // 查找上一个分片（pagingIndex - 1）
            const targetPagingIndex =
              (curTableElement.pagingIndex ?? 0) - 1
            const preTableElement = originalElementList.find(
              item =>
                item.pagingId === curTableElement.pagingId &&
                item.pagingIndex === targetPagingIndex
            )
            if (preTableElement) {
              // 先删除当前单元格中的 ZERO 元素
              draw.spliceElementList(elementList, index, 1)
              const preIndex = originalElementList.indexOf(preTableElement)
              const curTd =
                curTableElement.trList?.[positionContext.trIndex!]?.tdList?.[
                  positionContext.tdIndex!
                ]
              const curColIndex = curTd?.colIndex ?? 0
              const preTrList = preTableElement.trList!
              const lastTr = preTrList[preTrList.length - 1]
              const targetTdIndex = lastTr.tdList.findIndex(
                td =>
                  curColIndex >= (td.colIndex ?? 0) &&
                  curColIndex < (td.colIndex ?? 0) + td.colspan
              )
              const fallbackTdIndex = lastTr.tdList.length - 1
              const finalTdIndex = ~targetTdIndex
                ? targetTdIndex
                : fallbackTdIndex
              const targetTd = lastTr.tdList[finalTdIndex]
              position.setPositionContext({
                isTable: true,
                index: preIndex,
                trIndex: preTrList.length - 1,
                tdIndex: finalTdIndex,
                tdId: targetTd.id,
                trId: lastTr.id,
                tableId: preTableElement.id
              })
              const newIndex = targetTd.value.length - 1
              rangeManager.setRange(newIndex, newIndex)
              draw.render({
                curIndex: newIndex,
                isSetCursor: true,
                isSubmitHistory: false
              })
              draw.getTableTool().render()
              evt.preventDefault()
              return
            }
          }
        }
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
    // 如果在标题中删除内容，恢复titleId
    const preElement =
      startElement.value === ZERO ? elementList[startIndex - 1] : startElement
    const nextElement = elementList[endIndex + 1]
    if (
      preElement?.titleId &&
      nextElement?.titleId &&
      preElement.level === nextElement.level &&
      preElement.titleId !== nextElement.titleId
    ) {
      const preTitleId = preElement.titleId
      const nextTitleId = nextElement.titleId
      // 循环处理后面的元素修改为前面标题的titleId
      let nextIndex = endIndex + 1
      while (
        nextIndex < elementList.length &&
        elementList[nextIndex]?.titleId === nextTitleId
      ) {
        elementList[nextIndex].titleId = preTitleId
        nextIndex++
      }
    }
    if (!isCollapsed) {
      draw.spliceElementList(elementList, startIndex + 1, endIndex - startIndex)
    } else {
      const currentElement = elementList[index]
      if (currentElement?.type === ElementType.TABLE && currentElement.pagingId) {
        const msg =
          draw
            .getI18n()
            .t('contextmenu.table.cannotDeleteSplitTable') ||
          '分割表格不支持通过光标删除'
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          window.alert(msg)
        }
        evt.preventDefault()
        return
      }
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
