import { ControlComponent } from '../../../dataset/enum/Control'
import { ElementType } from '../../../dataset/enum/Element'
import { IElement } from '../../../interface/Element'
import { ICurrentPosition } from '../../../interface/Position'
import { Draw } from '../Draw'

export class Control {

  private draw: Draw

  constructor(draw: Draw) {
    this.draw = draw
  }

  // 调整起始光标位置到控件合适的位置
  public moveCursorIndex(position: ICurrentPosition) {
    const { index, trIndex, tdIndex, tdValueIndex } = position
    let elementList = this.draw.getOriginalElementList()
    let element: IElement
    if (position.isTable) {
      elementList = elementList[index!].trList![trIndex!].tdList[tdIndex!].value
      element = elementList[tdValueIndex!]
    } else {
      element = elementList[index]
    }
    if (element.type !== ElementType.CONTROL) return
    // VALUE-无需移动
    if (element.controlComponent === ControlComponent.VALUE) return
    // POSTFIX-移动到最后一个后缀字符后
    if (element.controlComponent === ControlComponent.POSTFIX) {
      let startIndex = index + 1
      while (startIndex < elementList.length) {
        const nextElement = elementList[startIndex]
        if (nextElement.controlId !== element.controlId) {
          position.index = startIndex - 1
          break
        }
        startIndex++
      }
    } else if (element.controlComponent === ControlComponent.PREFIX) {
      // PREFIX-移动到最后一个前缀字符后
      let startIndex = index + 1
      while (startIndex < elementList.length) {
        const nextElement = elementList[startIndex]
        if (
          nextElement.controlId !== element.controlId
          || nextElement.controlComponent !== ControlComponent.PREFIX
        ) {
          position.index = startIndex - 1
          break
        }
        startIndex++
      }
    } else if (element.controlComponent === ControlComponent.PLACEHOLDER) {
      // PLACEHOLDER-移动到第一个前缀后
      let startIndex = index - 1
      while (startIndex > 0) {
        const preElement = elementList[startIndex]
        if (
          preElement.controlId !== element.controlId
          || preElement.controlComponent === ControlComponent.PREFIX
        ) {
          position.index = startIndex
          break
        }
        startIndex--
      }
    }
  }

}