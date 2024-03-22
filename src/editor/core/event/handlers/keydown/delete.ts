import { CanvasEvent } from '../../CanvasEvent'

export function del(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  // 控件整体性验证
  const control = draw.getControl()
  const activeControl = control.getActiveControl()
  if (control.isPartRangeInControlOutside()) return
  const rangeManager = draw.getRange()
  const { startIndex, endIndex } = rangeManager.getRange()
  const elementList = draw.getElementList()
  let curIndex: number | null
  if (activeControl) {
    // 光标在控件内
    curIndex = control.keydown(evt)
  } else if (elementList[endIndex + 1]?.controlId) {
    // 光标在控件前
    curIndex = control.removeControl(endIndex + 1)
  } else {
    // 普通元素
    const position = draw.getPosition()
    const cursorPosition = position.getCursorPosition()
    if (!cursorPosition) return
    const { index } = cursorPosition
    const isCollapsed = rangeManager.getIsCollapsed()
    if (!isCollapsed) {
      draw.spliceElementList(elementList, startIndex + 1, endIndex - startIndex)
    } else {
      draw.spliceElementList(elementList, index + 1, 1)
    }
    curIndex = isCollapsed ? index : startIndex
  }
  if (curIndex === null) return
  draw.getGlobalEvent().setCanvasEventAbility()
  rangeManager.setRange(curIndex, curIndex)
  draw.render({ curIndex })
}
