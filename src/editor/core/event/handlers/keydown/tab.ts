import { ElementType } from '../../../../dataset/enum/Element'
import { MoveDirection } from '../../../../dataset/enum/Observer'
import { IElement } from '../../../../interface/Element'
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
  } else {
    // 插入tab符
    const tabElement: IElement = {
      type: ElementType.TAB,
      value: ''
    }
    const rangeManager = draw.getRange()
    const { startIndex } = rangeManager.getRange()
    const elementList = draw.getElementList()
    formatElementContext(elementList, [tabElement], startIndex)
    draw.insertElementList([tabElement])
  }
}
