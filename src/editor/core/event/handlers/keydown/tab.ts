import { ZERO } from '../../../../dataset/constant/Common'
import { EDITOR_ELEMENT_STYLE_ATTR } from '../../../../dataset/constant/Element'
import { ElementType } from '../../../../dataset/enum/Element'
import { MoveDirection } from '../../../../dataset/enum/Observer'
import { IElement } from '../../../../interface/Element'
import { pickObject } from '../../../../utils'
import { formatElementContext } from '../../../../utils/element'
import { CanvasEvent } from '../../CanvasEvent'

export function tab(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  evt.preventDefault()
  // 在控件上下文时，tab键控制控件之间移动
  const control = draw.getControl()
  const activeControl = control.getActiveControl()
  if (activeControl && control.getIsRangeWithinControl()) {
    control.initNextControl({
      direction: evt.shiftKey ? MoveDirection.UP : MoveDirection.DOWN
    })
    return
  }
  const rangeManager = draw.getRange()
  const elementList = draw.getElementList()
  const { startIndex, endIndex } = rangeManager.getRange()
  // 列表项行首 Tab/Shift+Tab：缩进 / 反缩进
  const isCollapsed = rangeManager.getIsCollapsed()
  const endElement = elementList[endIndex]
  const preElement = elementList[endIndex - 1]
  if (
    isCollapsed &&
    endElement?.listId &&
    !endElement.listWrap &&
    (endElement.value === ZERO ||
      (preElement?.value === ZERO &&
        !preElement?.listWrap &&
        preElement.listId === endElement.listId))
  ) {
    if (evt.shiftKey) {
      draw.getListParticle().decreaseListLevel()
    } else {
      draw.getListParticle().increaseListLevel()
    }
    return
  }
  // 插入tab符
  const anchorStyle = rangeManager.getRangeAnchorStyle(elementList, endIndex)
  // 仅复制样式
  const copyStyle = anchorStyle
    ? pickObject(anchorStyle, EDITOR_ELEMENT_STYLE_ATTR)
    : null
  const tabElement: IElement = {
    ...copyStyle,
    type: ElementType.TAB,
    value: ''
  }
  formatElementContext(elementList, [tabElement], startIndex, {
    editorOptions: draw.getOptions()
  })
  draw.insertElementList([tabElement])
}
