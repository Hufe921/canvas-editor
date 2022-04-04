import { ControlComponent } from '../../../../dataset/enum/Control'
import { IControlInstance } from '../../../../interface/Control'
import { IElement } from '../../../../interface/Element'
import { IRange } from '../../../../interface/Range'
import { Control } from '../Control'

export class TextControl implements IControlInstance {

  private control: Control

  constructor(control: Control) {
    this.control = control
  }

  public shrinkBoundary(elementList: IElement[], range: IRange) {
    const { startIndex, endIndex } = range
    if (startIndex === endIndex) return
    const startElement = elementList[startIndex]
    const endElement = elementList[endIndex]
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

  public removePlaceholder(elementList: IElement[], range: IRange) {
    const { startIndex } = range
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

  public setValue(data: IElement[]): number {
    const elementList = this.control.getElementList()
    const range = this.control.getRange()
    // 收缩边界到Value内
    this.shrinkBoundary(elementList, range)
    const { startIndex, endIndex } = range
    // 移除选区元素
    if (startIndex !== endIndex) {
      elementList.splice(startIndex + 1, endIndex - startIndex)
    } else {
      // 移除空白占位符
      this.removePlaceholder(elementList, range)
    }
    // 插入
    const startElement = elementList[startIndex]
    const start = range.startIndex + 1
    for (let i = 0; i < data.length; i++) {
      elementList.splice(start + i, 0, {
        ...startElement,
        ...data[i],
        controlComponent: ControlComponent.VALUE
      })
    }
    return start + data.length - 1
  }

}