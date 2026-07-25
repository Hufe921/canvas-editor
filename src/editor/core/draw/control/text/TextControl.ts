import {
  CONTROL_STYLE_ATTR,
  TEXTLIKE_ELEMENT_TYPE
} from '../../../../dataset/constant/Element'
import { ControlComponent } from '../../../../dataset/enum/Control'
import { KeyMap } from '../../../../dataset/enum/KeyMap'
import { DeepRequired } from '../../../../interface/Common'
import {
  IControlContext,
  IControlInstance,
  IControlRuleOption
} from '../../../../interface/Control'
import { IEditorOption } from '../../../../interface/Editor'
import { IElement } from '../../../../interface/Element'
import { omitObject, pickObject } from '../../../../utils'
import {
  formatElementContext,
  isElementTraceDeleted,
  scanToOwner
} from '../../../../utils/element'
import { Control } from '../Control'

export class TextControl implements IControlInstance {
  protected element: IElement
  protected control: Control
  protected options: DeepRequired<IEditorOption>

  constructor(element: IElement, control: Control) {
    const draw = control.getDraw()
    this.options = draw.getOptions()
    this.element = element
    this.control = control
  }

  public setElement(element: IElement) {
    this.element = element
  }

  public getElement(): IElement {
    return this.element
  }

  public getValue(context: IControlContext = {}): IElement[] {
    const elementList = context.elementList || this.control.getElementList()
    const { startIndex } = context.range || this.control.getRange()
    const startElement = elementList[startIndex]
    const data: IElement[] = []
    if (
      startElement.controlComponent === ControlComponent.VALUE &&
      !isElementTraceDeleted(startElement)
    ) {
      data.push(startElement)
    }
    // 向左查找
    let preIndex = startIndex
    while (preIndex > 0) {
      const next = scanToOwner(
        elementList,
        preIndex,
        -1,
        startElement.controlId!
      )
      if (next < 0) break
      const preElement = elementList[next]
      if (
        preElement.controlId !== startElement.controlId ||
        preElement.controlComponent === ControlComponent.PREFIX ||
        preElement.controlComponent === ControlComponent.PRE_TEXT
      ) {
        break
      }
      if (
        preElement.controlComponent === ControlComponent.VALUE &&
        !isElementTraceDeleted(preElement)
      ) {
        data.unshift(preElement)
      }
      preIndex = next
    }
    // 向右查找
    let nextIndex = startIndex + 1
    while (nextIndex < elementList.length) {
      const next = scanToOwner(
        elementList,
        nextIndex,
        1,
        startElement.controlId!
      )
      if (next < 0 || next >= elementList.length) break
      const nextElement = elementList[next]
      if (
        nextElement.controlId !== startElement.controlId ||
        nextElement.controlComponent === ControlComponent.POSTFIX ||
        nextElement.controlComponent === ControlComponent.POST_TEXT
      ) {
        break
      }
      if (
        nextElement.controlComponent === ControlComponent.VALUE &&
        !isElementTraceDeleted(nextElement)
      ) {
        data.push(nextElement)
      }
      nextIndex = next
    }
    return data
  }

  public setValue(
    data: IElement[],
    context: IControlContext = {},
    options: IControlRuleOption = {}
  ): number {
    // 校验是否可以设置
    if (
      !options.isIgnoreDisabledRule &&
      this.control.getIsDisabledControl(context)
    ) {
      return -1
    }
    const elementList = context.elementList || this.control.getElementList()
    const range = context.range || this.control.getRange()
    // 收缩边界到Value内
    this.control.shrinkBoundary(context)
    const { startIndex, endIndex } = range
    const draw = this.control.getDraw()
    const startElement = elementList[startIndex]
    // 选区跨内层段时，连同内层一起替换。若内层处于 active 先销毁
    const activeControl = this.control.getActiveControl()
    const activeElement = activeControl?.getElement()
    if (
      activeElement &&
      activeElement.controlId &&
      activeElement.controlId !== startElement.controlId
    ) {
      let inRange = false
      for (let i = startIndex; i <= endIndex; i++) {
        if (elementList[i]?.controlId === activeElement.controlId) {
          inRange = true
          break
        }
      }
      if (inRange) {
        this.control.destroyControl({ isEmitEvent: true })
      }
    }
    // 移除选区元素
    if (startIndex !== endIndex) {
      draw.deleteElementList(
        elementList,
        startIndex + 1,
        endIndex - startIndex,
        {
          isIgnoreDeletedRule: options.isIgnoreDeletedRule
        }
      )
    } else {
      // 移除空白占位符
      this.control.removePlaceholder(startIndex, context)
    }
    // 非文本类元素或前缀过渡掉样式属性
    const anchorElement =
      (startElement.type &&
        !TEXTLIKE_ELEMENT_TYPE.includes(startElement.type)) ||
      startElement.controlComponent === ControlComponent.PREFIX ||
      startElement.controlComponent === ControlComponent.PRE_TEXT
        ? pickObject(startElement, [
            'control',
            'controlId',
            ...CONTROL_STYLE_ATTR
          ])
        : omitObject(startElement, ['type'])
    // 插入起始位置
    const start = range.startIndex + 1
    for (let i = 0; i < data.length; i++) {
      const newElement: IElement = {
        ...anchorElement,
        ...data[i],
        controlComponent: ControlComponent.VALUE
      }
      formatElementContext(elementList, [newElement], startIndex, {
        editorOptions: this.options
      })
      draw.getTraceParticle().markElementListInserted([newElement])
      draw.spliceElementList(elementList, start + i, 0, [newElement])
    }
    return start + data.length - 1
  }

  public clearValue(
    context: IControlContext = {},
    options: IControlRuleOption = {}
  ): number {
    // 校验是否可以设置
    if (
      !options.isIgnoreDisabledRule &&
      this.control.getIsDisabledControl(context)
    ) {
      return -1
    }
    const elementList = context.elementList || this.control.getElementList()
    const range =
      context.range || this.control.getValueRange() || this.control.getRange()
    const { startIndex, endIndex } = range
    const deleteStartIndex = startIndex + 1
    const deleteCount = this.control.removePlaceholderInRange(
      elementList,
      deleteStartIndex,
      endIndex - startIndex
    )
    this.control
      .getDraw()
      .deleteElementList(elementList, deleteStartIndex, deleteCount, {
        isIgnoreDeletedRule: options.isIgnoreDeletedRule
      })
    const value = this.getValue({
      range,
      elementList
    })
    if (!value.length) {
      this.control.addPlaceholder(startIndex, context)
    }
    return startIndex
  }

  public keydown(evt: KeyboardEvent): number | null {
    if (this.control.getIsDisabledControl()) {
      return null
    }
    const elementList = this.control.getElementList()
    const range = this.control.getRange()
    // 收缩边界到Value内
    this.control.shrinkBoundary()
    const { startIndex, endIndex } = range
    const startElement = elementList[startIndex]
    const endElement = elementList[endIndex]
    const draw = this.control.getDraw()
    // backspace
    if (evt.key === KeyMap.Backspace) {
      // 移除选区元素
      if (startIndex !== endIndex) {
        draw.deleteElementList(
          elementList,
          startIndex + 1,
          endIndex - startIndex
        )
        const value = this.getValue()
        if (!value.length) {
          this.control.addPlaceholder(startIndex)
        }
        return startIndex
      } else {
        if (
          startElement.controlComponent === ControlComponent.PREFIX ||
          startElement.controlComponent === ControlComponent.PRE_TEXT ||
          endElement.controlComponent === ControlComponent.POSTFIX ||
          endElement.controlComponent === ControlComponent.POST_TEXT ||
          startElement.controlComponent === ControlComponent.PLACEHOLDER
        ) {
          // 前缀、后缀、占位符
          return this.control.removeControl(startIndex)
        } else {
          // 文本
          draw.deleteElementList(elementList, startIndex, 1)
          const value = this.getValue()
          if (!value.length) {
            this.control.addPlaceholder(startIndex - 1)
          }
          return startIndex - 1
        }
      }
    } else if (evt.key === KeyMap.Delete) {
      // 移除选区元素
      if (startIndex !== endIndex) {
        draw.deleteElementList(
          elementList,
          startIndex + 1,
          endIndex - startIndex
        )
        const value = this.getValue()
        if (!value.length) {
          this.control.addPlaceholder(startIndex)
        }
        return startIndex
      } else {
        const endNextElement = elementList[endIndex + 1]
        if (
          ((startElement.controlComponent === ControlComponent.PREFIX ||
            startElement.controlComponent === ControlComponent.PRE_TEXT) &&
            endNextElement.controlComponent === ControlComponent.PLACEHOLDER) ||
          endNextElement.controlComponent === ControlComponent.POSTFIX ||
          endNextElement.controlComponent === ControlComponent.POST_TEXT ||
          startElement.controlComponent === ControlComponent.PLACEHOLDER
        ) {
          // 前缀、后缀、占位符
          return this.control.removeControl(startIndex)
        } else {
          // 文本
          draw.deleteElementList(elementList, startIndex + 1, 1)
          const value = this.getValue()
          if (!value.length) {
            this.control.addPlaceholder(startIndex)
          }
          return startIndex
        }
      }
    }
    return endIndex
  }

  public cut(): number {
    if (this.control.getIsDisabledControl()) {
      return -1
    }
    this.control.shrinkBoundary()
    const { startIndex, endIndex } = this.control.getRange()
    if (startIndex === endIndex) {
      return startIndex
    }
    const draw = this.control.getDraw()
    const elementList = this.control.getElementList()
    draw.deleteElementList(elementList, startIndex + 1, endIndex - startIndex)
    const value = this.getValue()
    if (!value.length) {
      this.control.addPlaceholder(startIndex)
    }
    return startIndex
  }
}
