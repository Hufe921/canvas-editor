import { CanvasEvent } from '../../CanvasEvent'

// 删除光标后隐藏元素，跳过留痕删除元素（痕迹不可移除）
function deleteHideElement(host: CanvasEvent) {
  const draw = host.getDraw()
  const traceParticle = draw.getTraceParticle()
  const rangeManager = draw.getRange()
  const range = rangeManager.getRange()
  // 光标后一个元素为隐藏/留痕删除元素时触发循环
  const elementList = draw.getElementList()
  let index = range.startIndex + 1
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
  // 向后跳过隐藏/留痕删除元素（隐藏元素直接删除，留痕删除元素仅移动光标）
  let hasValidTarget = false
  while (index < elementList.length) {
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
        newIndex = index
      }
    } else {
      // 留痕删除元素仅移动光标：控件整体跳过
      if (element.controlId) {
        newIndex =
          draw
            .getControl()
            .getControlEndIndex(elementList, index, element.controlId!) + 1
      } else {
        newIndex = index + 1
      }
    }
    if (newIndex === null || newIndex >= elementList.length) break
    index = newIndex
  }
  // 更新上下文信息
  if (hasValidTarget && index > range.startIndex + 1) {
    range.startIndex = index - 1
    range.endIndex = index - 1
    rangeManager.replaceRange(range)
    // 更新位置信息
    const position = draw.getPosition()
    const positionList = position.getPositionList()
    position.setCursorPosition(positionList[index - 1])
  }
}

export function del(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  if (draw.isReadonly()) return
  // 可输入性验证
  const rangeManager = draw.getRange()
  if (!rangeManager.getIsCanInput()) return
  const { isCrossRowCol } = rangeManager.getRange()
  let { startIndex, endIndex } = rangeManager.getRange()
  const isCollapsed = rangeManager.getIsCollapsed()
  // 隐藏控件删除 / 跳过留痕删除元素
  const elementList = draw.getElementList()
  const control = draw.getControl()
  if (isCollapsed) {
    deleteHideElement(host)
    // deleteHideElement 可能移动光标，需重新读取 range
    const range = rangeManager.getRange()
    startIndex = range.startIndex
    endIndex = range.endIndex
  }
  // 删除操作
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
  } else if (control.getActiveControl() && control.getIsRangeWithinControl()) {
    // 光标在控件内
    curIndex = control.keydown(evt)
    if (curIndex) {
      control.emitControlContentChange()
    }
  } else if (isCollapsed && elementList[endIndex + 1]?.controlId) {
    // 光标在控件前
    curIndex = control.removeControl(endIndex + 1)
  } else {
    // 普通元素
    const position = draw.getPosition()
    const cursorPosition = position.getCursorPosition()
    if (!cursorPosition) return
    const { index } = cursorPosition
    // 命中图片直接删除
    const positionContext = position.getPositionContext()
    if (positionContext.isDirectHit && positionContext.isImage) {
      draw.deleteElementList(elementList, index, 1)
      curIndex = index - 1
    } else {
      const isCollapsed = rangeManager.getIsCollapsed()
      if (!isCollapsed) {
        draw.deleteElementList(
          elementList,
          startIndex + 1,
          endIndex - startIndex
        )
      } else {
        if (!elementList[index + 1]) return
        draw.deleteElementList(elementList, index + 1, 1)
      }
      curIndex = isCollapsed ? index : startIndex
    }
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
