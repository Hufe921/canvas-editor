import { ControlComponent } from '../../../../dataset/enum/Control'
import { ElementType } from '../../../../dataset/enum/Element'
import { KeyMap } from '../../../../dataset/enum/Keymap'
import { IControlInstance, IControlOption } from '../../../../interface/Control'
import { IElement } from '../../../../interface/Element'
import { IRange } from '../../../../interface/Range'
import { Control } from '../Control'

export class TextControl implements IControlInstance {

  private control: Control
  private options: IControlOption

  constructor(control: Control) {
    this.control = control
    this.options = control.getOptions().control
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

  public removeControl(elementList: IElement[], range: IRange): number {
    const { startIndex } = range
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
    // 清除实例
    this.control.destroyControl()
    return leftIndex
  }

  public addPlaceholder(elementList: IElement[], startIndex: number) {
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

  public getValue(): IElement[] {
    const elementList = this.control.getElementList()
    const { startIndex } = this.control.getRange()
    const startElement = elementList[startIndex]
    const data: IElement[] = []
    // 向左查找
    let preIndex = startIndex
    while (preIndex > 0) {
      const preElement = elementList[preIndex]
      if (
        preElement.controlId !== startElement.controlId ||
        preElement.controlComponent === ControlComponent.PREFIX
      ) {
        break
      }
      if (preElement.controlComponent === ControlComponent.VALUE) {
        data.unshift(preElement)
      }
      preIndex--
    }
    // 向右查找
    let nextIndex = startIndex + 1
    while (nextIndex < elementList.length) {
      const nextElement = elementList[nextIndex]
      if (
        nextElement.controlId !== startElement.controlId ||
        nextElement.controlComponent === ControlComponent.POSTFIX
      ) {
        break
      }
      if (nextElement.controlComponent === ControlComponent.VALUE) {
        data.push(nextElement)
      }
      nextIndex++
    }
    return data
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

  public keydown(evt: KeyboardEvent): number {
    const elementList = this.control.getElementList()
    const range = this.control.getRange()
    // 收缩边界到Value内
    this.shrinkBoundary(elementList, range)
    const { startIndex, endIndex } = range
    const startElement = elementList[startIndex]
    const endElement = elementList[endIndex]
    // backspace
    if (evt.key === KeyMap.Backspace) {
      // 移除选区元素
      if (startIndex !== endIndex) {
        elementList.splice(startIndex + 1, endIndex - startIndex)
        const value = this.getValue()
        if (!value.length) {
          this.addPlaceholder(elementList, startIndex)
        }
        return startIndex
      } else {
        if (startElement.controlComponent === ControlComponent.PREFIX) {
          // 前缀
          return this.removeControl(elementList, range)
        } else if (endElement.controlComponent === ControlComponent.POSTFIX) {
          // 后缀
          return this.removeControl(elementList, range)
        } else {
          // 文本
          elementList.splice(startIndex, 1)
          const value = this.getValue()
          if (!value.length) {
            this.addPlaceholder(elementList, startIndex - 1)
          }
          return startIndex - 1
        }
      }
    } else if (evt.key === KeyMap.Delete) {
      // 移除选区元素
      if (startIndex !== endIndex) {
        elementList.splice(startIndex + 1, endIndex - startIndex)
        const value = this.getValue()
        if (!value.length) {
          this.addPlaceholder(elementList, startIndex)
        }
        return startIndex
      } else {
        const endNextElement = elementList[endIndex + 1]
        if (endNextElement.controlComponent === ControlComponent.POSTFIX) {
          // 后缀
          return this.removeControl(elementList, range)
        } else {
          // 文本
          elementList.splice(startIndex + 1, 1)
          const value = this.getValue()
          if (!value.length) {
            this.addPlaceholder(elementList, startIndex)
          }
          return startIndex
        }
      }
    }
    return -1
  }

}