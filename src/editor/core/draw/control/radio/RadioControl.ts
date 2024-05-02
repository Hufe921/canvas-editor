import { ControlComponent } from '../../../../dataset/enum/Control'
import {
  IControlContext,
  IControlRuleOption
} from '../../../../interface/Control'
import { CheckboxControl } from '../checkbox/CheckboxControl'

export class RadioControl extends CheckboxControl {
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
      if (preElement.controlComponent === ControlComponent.RADIO) {
        const radio = preElement.radio!
        radio.value = codes.includes(radio.code!)
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
      if (nextElement.controlComponent === ControlComponent.RADIO) {
        const radio = nextElement.radio!
        radio.value = codes.includes(radio.code!)
      }
      nextIndex++
    }
    control!.code = codes.join(',')
    this.control.repaintControl()
  }
}
