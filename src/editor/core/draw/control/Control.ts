import { ControlComponent, ControlType } from '../../../dataset/enum/Control'
import { ElementType } from '../../../dataset/enum/Element'
import { IControlInitOption, IControlInstance, IControlOption } from '../../../interface/Control'
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
  private options: IControlOption
  private activeControl: IControlInstance | null

  constructor(draw: Draw) {
    this.draw = draw
    this.range = draw.getRange()
    this.options = draw.getOptions().control
    this.activeControl = null
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

  public getElementList(): IElement[] {
    return this.draw.getElementList()
  }

  public getRange() {
    return this.range.getRange()
  }

  public getActiveControl(): IControlInstance | null {
    return this.activeControl
  }

  public initControl() {
    const elementList = this.getElementList()
    const range = this.getRange()
    const element = elementList[range.startIndex]
    // 判断控件是否已经激活
    if (this.activeControl) {
      const controlElement = this.activeControl.getElement()
      if (element.controlId === controlElement.controlId) return
    }
    // 销毁旧激活控件
    this.destroyControl()
    // 激活控件
    if (element.control!.type === ControlType.TEXT) {
      this.activeControl = new TextControl(element, this)
    }
  }

  public destroyControl() {
    if (this.activeControl) {
      this.activeControl = null
    }
  }

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

  public removeControl(startIndex: number): number {
    const elementList = this.getElementList()
    const startElement = elementList[startIndex]
    let leftIndex = -1
    let rightIndex = -1
    // 向左查找
    let preIndex = startIndex
    while (preIndex > 0) {
      const preElement = elementList[preIndex]
      if (preElement.controlId !== startElement.controlId) {
        leftIndex = preIndex
        break
      }
      preIndex--
    }
    // 向右查找
    let nextIndex = startIndex + 1
    while (nextIndex < elementList.length) {
      const nextElement = elementList[nextIndex]
      if (nextElement.controlId !== startElement.controlId) {
        rightIndex = nextIndex - 1
        break
      }
      nextIndex++
    }
    if (!~leftIndex || !~rightIndex) return -1
    // 删除元素
    elementList.splice(leftIndex + 1, rightIndex - leftIndex)
    return leftIndex
  }

  public shrinkBoundary() {
    const elementList = this.getElementList()
    const range = this.getRange()
    const { startIndex, endIndex } = range
    const startElement = elementList[startIndex]
    const endElement = elementList[endIndex]
    if (startIndex === endIndex) {
      if (startElement.controlComponent === ControlComponent.PLACEHOLDER) {
        // 找到第一个placeholder字符
        let index = startIndex - 1
        while (index > 0) {
          const preElement = elementList[index]
          if (
            preElement.controlId !== startElement.controlId ||
            preElement.controlComponent === ControlComponent.PREFIX
          ) {
            console.log(index)
            range.startIndex = index
            range.endIndex = index
            break
          }
          index--
        }
      }
    } else {
      // 首、尾为占位符时，收缩到最后一个前缀字符后
      if (
        startElement.controlComponent === ControlComponent.PLACEHOLDER ||
        endElement.controlComponent === ControlComponent.PLACEHOLDER
      ) {
        let index = endIndex - 1
        while (index > 0) {
          const preElement = elementList[index]
          if (
            preElement.controlId !== endElement.controlId
            || preElement.controlComponent === ControlComponent.PREFIX
          ) {
            range.startIndex = index
            range.endIndex = index
            return
          }
          index--
        }
      }
      // 向右查找到第一个Value
      if (startElement.controlComponent === ControlComponent.PREFIX) {
        let index = startIndex + 1
        while (index < elementList.length) {
          const nextElement = elementList[index]
          if (
            nextElement.controlId !== startElement.controlId
            || nextElement.controlComponent === ControlComponent.VALUE
          ) {
            range.startIndex = index - 1
            break
          } else if (nextElement.controlComponent === ControlComponent.PLACEHOLDER) {
            range.startIndex = index - 1
            range.endIndex = index - 1
            return
          }
          index++
        }
      }
      // 向左查找到第一个Value
      if (endElement.controlComponent !== ControlComponent.VALUE) {
        let index = startIndex - 1
        while (index > 0) {
          const preElement = elementList[index]
          if (
            preElement.controlId !== startElement.controlId
            || preElement.controlComponent === ControlComponent.VALUE
          ) {
            range.startIndex = index
            break
          } else if (preElement.controlComponent === ControlComponent.PLACEHOLDER) {
            range.startIndex = index
            range.endIndex = index
            return
          }
          index--
        }
      }
    }
  }

  public removePlaceholder(startIndex: number) {
    const elementList = this.getElementList()
    const startElement = elementList[startIndex]
    const nextElement = elementList[startIndex + 1]
    if (
      startElement.controlComponent === ControlComponent.PLACEHOLDER ||
      nextElement.controlComponent === ControlComponent.PLACEHOLDER
    ) {
      let index = startIndex
      while (index < elementList.length) {
        const curElement = elementList[index]
        if (curElement.controlId !== startElement.controlId) break
        if (curElement.controlComponent === ControlComponent.PLACEHOLDER) {
          elementList.splice(index, 1)
        } else {
          index++
        }
      }
    }
  }

  public addPlaceholder(startIndex: number) {
    const elementList = this.getElementList()
    const startElement = elementList[startIndex]
    const control = startElement.control!
    const placeholderStrList = control.placeholder.split('')
    for (let p = 0; p < placeholderStrList.length; p++) {
      const value = placeholderStrList[p]
      elementList.splice(startIndex + p + 1, 0, {
        value,
        controlId: startElement.controlId,
        type: ElementType.CONTROL,
        control: startElement.control,
        controlComponent: ControlComponent.PLACEHOLDER,
        color: this.options.placeholderColor
      })
    }
  }

  public setValue(data: IElement[]): number {
    if (!this.activeControl) {
      throw new Error('active control is null')
    }
    return this.activeControl.setValue(data)
  }

  public keydown(evt: KeyboardEvent): number {
    if (!this.activeControl) {
      throw new Error('active control is null')
    }
    return this.activeControl.keydown(evt)
  }

  public cut(): number {
    if (!this.activeControl) {
      throw new Error('active control is null')
    }
    return this.activeControl.cut()
  }

}