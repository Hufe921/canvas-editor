import { NON_NUMBER_STR_REG } from '../../../../dataset/constant/Regular'
import { ControlComponent } from '../../../../dataset/enum/Control'
import {
  IControlContext,
  IControlRuleOption
} from '../../../../interface/Control'
import { IElement } from '../../../../interface/Element'
import { deepClone } from '../../../../utils'
import { getElementListText, isTextElement } from '../../../../utils/element'
import { TextControl } from '../text/TextControl'

export class NumberControl extends TextControl {
  public setValue(
    data: IElement[],
    context: IControlContext = {},
    options: IControlRuleOption = {}
  ): number {
    // 禁止存在非文本元素
    if (
      data.some(el => !isTextElement(el) || NON_NUMBER_STR_REG.test(el.value))
    ) {
      return -1
    }
    // 校验填充数据后是否是数值（任何数字都是可接受的值，只要它是有效的浮点数（即不是 NaN 或 Infinity））
    const elementList = context.elementList || this.control.getElementList()
    const range = context.range || this.control.getRange()
    this.control.shrinkBoundary(context)
    // 找到控件已经存在的元素并插入新元素后验证数值合法性
    const controlElementList = deepClone(data)
    const { startIndex, endIndex } = range
    const startElement = elementList[startIndex]
    if (
      this.control.getIsExistValueByElementListIndex(elementList, startIndex)
    ) {
      // 向左查找
      let preIndex = startIndex
      while (preIndex > 0) {
        const preElement = elementList[preIndex]
        if (
          preElement.controlId !== startElement.controlId ||
          preElement.controlComponent === ControlComponent.PREFIX ||
          preElement.controlComponent === ControlComponent.PRE_TEXT
        ) {
          break
        }
        controlElementList.unshift(preElement)
        preIndex--
      }
      // 向右查找
      let nextIndex = endIndex + 1
      while (nextIndex < elementList.length) {
        const nextElement = elementList[nextIndex]
        if (
          nextElement.controlId !== startElement.controlId ||
          nextElement.controlComponent === ControlComponent.POSTFIX ||
          nextElement.controlComponent === ControlComponent.POST_TEXT
        ) {
          break
        }
        controlElementList.push(nextElement)
        nextIndex++
      }
    }
    // 提取文本
    const text = getElementListText(controlElementList)
    if (Number.isNaN(Number(text)) || !Number.isFinite(Number(text))) {
      return -1
    }
    return super.setValue(data, context, options)
  }
}
