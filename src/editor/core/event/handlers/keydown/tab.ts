import { ElementType } from '../../../../dataset/enum/Element'
import { IElement } from '../../../../interface/Element'
import { formatElementContext } from '../../../../utils/element'
import { CanvasEvent } from '../../CanvasEvent'

export function tab(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  const tabElement: IElement = {
    type: ElementType.TAB,
    value: ''
  }
  const rangeManager = draw.getRange()
  const { startIndex } = rangeManager.getRange()
  const elementList = draw.getElementList()
  formatElementContext(elementList, [tabElement], startIndex)
  draw.insertElementList([tabElement])
  evt.preventDefault()
}
