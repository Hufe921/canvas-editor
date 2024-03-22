import { ZERO } from '../../../../dataset/constant/Common'
import { CanvasEvent } from '../../CanvasEvent'

export function backspace(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  // 控件整体性验证
  const control = draw.getControl()
  const activeControl = control.getActiveControl()
  if (control.isPartRangeInControlOutside()) return
  const rangeManager = draw.getRange()
  let curIndex: number | null
  if (activeControl) {
    // 光标在控件内
    curIndex = control.keydown(evt)
  } else {
    // 普通元素删除
    const position = draw.getPosition()
    const cursorPosition = position.getCursorPosition()
    if (!cursorPosition) return
    const { index } = cursorPosition
    const { startIndex, endIndex } = rangeManager.getRange()
    const isCollapsed = rangeManager.getIsCollapsed()
    const elementList = draw.getElementList()
    // 判断是否允许删除
    if (isCollapsed && index === 0) {
      const firstElement = elementList[index]
      if (firstElement.value === ZERO) {
        // 取消首字符列表设置
        if (firstElement.listId) {
          draw.getListParticle().unsetList()
        }
        evt.preventDefault()
        return
      }
    }
    //  清空当前行对齐方式
    const startElement = elementList[startIndex]
    if (isCollapsed && startElement.rowFlex && startElement.value === ZERO) {
      const rowList = draw.getRowList()
      const positionList = position.getPositionList()
      const rowNo = positionList[startIndex].rowNo
      const rowFlexElementList = rowList[rowNo].elementList
      rowFlexElementList.forEach(element => {
        delete element.rowFlex
      })
    }
    if (!isCollapsed) {
      draw.spliceElementList(elementList, startIndex + 1, endIndex - startIndex)
    } else {
      draw.spliceElementList(elementList, index, 1)
    }
    curIndex = isCollapsed ? index - 1 : startIndex
  }
  if (curIndex === null) return
  draw.getGlobalEvent().setCanvasEventAbility()
  rangeManager.setRange(curIndex, curIndex)
  draw.render({ curIndex })
}
