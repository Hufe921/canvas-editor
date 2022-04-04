import { ControlComponent, ControlType } from '../../../dataset/enum/Control'
import { ElementType } from '../../../dataset/enum/Element'
import { IControlInitOption, IControlInitResult, IControlInstance } from '../../../interface/Control'
import { IElement } from '../../../interface/Element'
import { RangeManager } from '../../range/RangeManager'
import { Draw } from '../Draw'
import { TextControl } from './text/TextControl'

interface IMoveCursorResult {
  newIndex: number;
  newElement: IElement;
}
export class Control {

  private draw: Draw
  private range: RangeManager
  private activeControl: IControlInstance | null

  constructor(draw: Draw) {
    this.draw = draw
    this.range = draw.getRange()
    this.activeControl = null
  }

  public getElementList(): IElement[] {
    return this.draw.getElementList()
  }

  public getRange() {
    return this.range.getRange()
  }

  public getActiveControl(): IControlInstance | null {
    return this.activeControl
  }

  // 判断选区部分在控件边界外
  public isPartRangeInControlOutside(): boolean {
    const { startIndex, endIndex } = this.getRange()
    if (!~startIndex && !~endIndex) return false
    const elementList = this.getElementList()
    const startElement = elementList[startIndex]
    const endElement = elementList[endIndex]
    if (
      (startElement.type === ElementType.CONTROL || endElement.type === ElementType.CONTROL)
      && startElement.controlId !== endElement.controlId
    ) {
      return true
    }
    return false
  }

  public initControl(option: IControlInitOption): IControlInitResult {
    // 调整光标位置
    const { newIndex, newElement } = this.moveCursor(option)
    const control = newElement.control!
    // 销毁激活控件
    this.destroyControl()
    // 激活控件
    if (control.type === ControlType.TEXT) {
      this.activeControl = new TextControl(this)
    }
    return { newIndex }
  }

  // 调整起始光标位置到控件合适的位置
  public moveCursor(position: IControlInitOption): IMoveCursorResult {
    const { index, trIndex, tdIndex, tdValueIndex } = position
    let elementList = this.draw.getOriginalElementList()
    let element: IElement
    const newIndex = position.isTable ? tdValueIndex! : index
    if (position.isTable) {
      elementList = elementList[index!].trList![trIndex!].tdList[tdIndex!].value
      element = elementList[tdValueIndex!]
    } else {
      element = elementList[index]
    }
    if (element.controlComponent === ControlComponent.VALUE) {
      // VALUE-无需移动
      return {
        newIndex,
        newElement: element
      }
    } else if (element.controlComponent === ControlComponent.POSTFIX) {
      // POSTFIX-移动到最后一个后缀字符后
      let startIndex = index + 1
      while (startIndex < elementList.length) {
        const nextElement = elementList[startIndex]
        if (nextElement.controlId !== element.controlId) {
          return {
            newIndex: startIndex - 1,
            newElement: elementList[startIndex - 1]
          }
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
          return {
            newIndex: startIndex - 1,
            newElement: elementList[startIndex - 1]
          }
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
          return {
            newIndex: startIndex,
            newElement: elementList[startIndex]
          }
        }
        startIndex--
      }
    }
    return {
      newIndex,
      newElement: element
    }
  }

  public destroyControl() {
    if (this.activeControl) {
      this.activeControl = null
    }
  }

  public setValue(data: IElement[]): number {
    if (!this.activeControl) {
      throw new Error('active control is null')
    }
    return this.activeControl.setValue(data)
  }

}