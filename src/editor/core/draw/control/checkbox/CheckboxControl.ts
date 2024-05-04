import { ControlComponent } from '../../../../dataset/enum/Control'
import { KeyMap } from '../../../../dataset/enum/KeyMap'
import {
  IControlContext,
  IControlInstance,
  IControlRuleOption
} from '../../../../interface/Control'
import { IElement } from '../../../../interface/Element'
import { Control } from '../Control'

export class CheckboxControl implements IControlInstance {
  protected element: IElement
  protected control: Control

  constructor(element: IElement, control: Control) {
    this.element = element
    this.control = control
  }

  public getElement(): IElement {
    return this.element
  }

  public getCode(): string | null {
    return this.element.control?.code || null
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

  public setValue(): number {
    return -1
  }

  public setSelect(
    codes: string[],
    context: IControlContext = {},
    options: IControlRuleOption = {}
  ) {
    // 校验是否可以设置
    if (!options.isIgnoreDisabledRule && this.control.getIsDisabledControl()) {
      return
    }
    const { control } = this.element
    const elementList = context.elementList || this.control.getElementList()
    const { startIndex } = context.range || this.control.getRange()
    const startElement = elementList[startIndex]
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
      if (preElement.controlComponent === ControlComponent.CHECKBOX) {
        const checkbox = preElement.checkbox!
        checkbox.value = codes.includes(checkbox.code!)
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
      if (nextElement.controlComponent === ControlComponent.CHECKBOX) {
        const checkbox = nextElement.checkbox!
        checkbox.value = codes.includes(checkbox.code!)
      }
      nextIndex++
    }
    control!.code = codes.join(',')
    this.control.repaintControl()
  }

  public keydown(evt: KeyboardEvent): number | null {
    if (this.control.getIsDisabledControl()) {
      return null
    }
    const range = this.control.getRange()
    // 收缩边界到Value内
    this.control.shrinkBoundary()
    const { startIndex, endIndex } = range
    // 删除
    if (evt.key === KeyMap.Backspace || evt.key === KeyMap.Delete) {
      return this.control.removeControl(startIndex)
    }
    return endIndex
  }

  public cut(): number {
    return -1
  }
}
