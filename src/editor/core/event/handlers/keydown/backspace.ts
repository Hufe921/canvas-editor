import { ZERO } from '../../../../dataset/constant/Common'
import { CanvasEvent } from '../../CanvasEvent'

// 删除光标前隐藏元素，跳过留痕删除元素（痕迹不可移除）
function backspaceHideElement(host: CanvasEvent) {
  const draw = host.getDraw()
  const traceParticle = draw.getTraceParticle()
  const rangeManager = draw.getRange()
  const range = rangeManager.getRange()
  // 光标所在位置为隐藏/留痕删除元素时触发循环
  const elementList = draw.getElementList()
  let index = range.startIndex
  const element = elementList[index]
  if (
    !element ||
    (!element.hide &&
      !element.control?.hide &&
      !element.area?.hide &&
      !traceParticle.isTraceHidden(element))
  ) {
    return
  }
  // 向前跳过隐藏/留痕删除元素（隐藏元素直接删除，留痕删除元素仅移动光标）
  let hasValidTarget = false
  while (index > 0) {
    const element = elementList[index]
    const isHide = element.hide || element.control?.hide || element.area?.hide
    const isTraceHidden = traceParticle.isTraceHidden(element)
    if (!isHide && !isTraceHidden) {
      hasValidTarget = true
      break
    }
    let newIndex: number | null
    if (isHide) {
      // 隐藏元素直接删除
      if (element.controlId) {
        newIndex = draw.getControl().removeControl(index)
      } else {
        draw.spliceElementList(elementList, index, 1)
        newIndex = index - 1
      }
    } else {
      // 留痕删除元素仅移动光标：控件整体跳过
      if (element.controlId) {
        newIndex =
          draw
            .getControl()
            .getControlStartIndex(elementList, index, element.controlId!) - 1
      } else {
        newIndex = index - 1
      }
    }
    if (newIndex === null || newIndex < 0) break
    index = newIndex
  }
  // 更新上下文信息
  if (hasValidTarget && index !== range.startIndex) {
    range.startIndex = index
    range.endIndex = index
    rangeManager.replaceRange(range)
    // 更新位置信息
    const position = draw.getPosition()
    const positionList = position.getPositionList()
    position.setCursorPosition(positionList[index])
  }
}

export function backspace(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  if (draw.isReadonly()) return
  // 可输入性验证
  const rangeManager = draw.getRange()
  if (!rangeManager.getIsCanInput()) return
  // 隐藏元素删除 / 跳过留痕删除元素
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
          draw.deleteElementList(col.value, 1, col.value.length - 1, {
            tdDeletable: col.deletable !== false
          })
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
        // 取消首字符列表设置
        if (firstElement.listId) {
          if (firstElement.listLevel) {
            // 子列表段首 Backspace：先降级而非退出
            draw.getListParticle().decreaseListLevel()
          } else {
            draw.getListParticle().unsetList()
          }
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
      draw.deleteElementList(elementList, startIndex + 1, endIndex - startIndex)
    } else {
      draw.deleteElementList(elementList, index, 1)
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
