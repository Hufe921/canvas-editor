import { NON_NUMBER_STR_REG } from '../../../../dataset/constant/Regular'
import { ControlComponent } from '../../../../dataset/enum/Control'
import { ElementType } from '../../../../dataset/enum/Element'
import {
  IControlContext,
  IControlRuleOption
} from '../../../../interface/Control'
import { IElement } from '../../../../interface/Element'
import { deepClone, omitObject, pickObject } from '../../../../utils'
import { getElementListText, isTextElement } from '../../../../utils/element'
import { TextControl } from '../text/TextControl'
import { Calculator } from './Calculator'
import {
  CONTROL_STYLE_ATTR,
  EDITOR_ELEMENT_STYLE_ATTR
} from '../../../../dataset/constant/Element'

export class NumberControl extends TextControl {
  private isPopup: boolean
  private calculator: Calculator | null

  constructor(element: IElement, control: any) {
    super(element, control)
    this.isPopup = false
    this.calculator = null
  }

  public getIsPopup(): boolean {
    return this.isPopup
  }

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

  private _setCalculatedValue(value: number) {
    // 清空旧值
    const prefixIndex = super.clearValue(
      {},
      {
        isAddPlaceholder: false,
        isIgnoreDeletedRule: true
      }
    )
    if (!~prefixIndex) return

    // 样式赋值元素-默认值的第一个字符样式，否则取默认样式
    const elementList = this.control.getElementList()
    const range = this.control.getRange()
    const valueElement = this.getValue()[0]
    const styleElement = valueElement
      ? pickObject(valueElement, EDITOR_ELEMENT_STYLE_ATTR)
      : pickObject(elementList[range.startIndex], CONTROL_STYLE_ATTR)

    // 属性赋值元素-默认为前缀属性
    const propertyElement = omitObject(
      elementList[prefixIndex],
      EDITOR_ELEMENT_STYLE_ATTR
    )

    // 创建新的元素
    const valueStr = value.toString()
    const data: IElement[] = []

    for (let i = 0; i < valueStr.length; i++) {
      const newElement: IElement = {
        ...styleElement,
        ...propertyElement,
        type: ElementType.TEXT,
        value: valueStr[i],
        controlComponent: ControlComponent.VALUE
      }
      data.push(newElement)
    }

    // 设置值
    this.setValue(data)

    // 重新渲染控件
    this.control.repaintControl({
      curIndex: prefixIndex + data.length
    })

    // 触发控件内容变化事件
    this.control.emitControlContentChange()

    // 销毁弹窗
    this.destroy()
  }

  public awake() {
    // 检查是否启用计算器模式
    const isCalculatorEnabled =
      this.element.control?.numberExclusiveOptions?.calculatorDisabled === false
    if (
      this.isPopup ||
      !isCalculatorEnabled ||
      this.control.getIsDisabledControl() ||
      !this.control.getIsRangeWithinControl()
    ) {
      return
    }
    const { startIndex } = this.control.getRange()
    const elementList = this.control.getElementList()
    if (elementList[startIndex + 1]?.controlId !== this.element.controlId) {
      return
    }

    // 创建计算器实例
    this.calculator = new Calculator({
      control: this.control,
      onCalculate: result => {
        this._setCalculatedValue(result)
      }
    })

    // 显示计算器弹窗
    this.calculator.createPopup()
    this.isPopup = true
  }

  public destroy() {
    if (!this.isPopup) return
    this.calculator?.destroy()
    this.calculator = null
    this.isPopup = false
  }
}
