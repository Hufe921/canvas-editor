import {
  CONTROL_STYLE_ATTR,
  EDITOR_ELEMENT_STYLE_ATTR,
  TEXTLIKE_ELEMENT_TYPE
} from '../../../../dataset/constant/Element'
import { ControlComponent } from '../../../../dataset/enum/Control'
import { ElementType } from '../../../../dataset/enum/Element'
import { KeyMap } from '../../../../dataset/enum/KeyMap'
import {
  IControlContext,
  IControlInstance,
  IControlRuleOption
} from '../../../../interface/Control'
import { IElement } from '../../../../interface/Element'
import { omitObject, pickObject } from '../../../../utils'
import { formatElementContext } from '../../../../utils/element'
import { Draw } from '../../Draw'
import { DatePicker } from '../../particle/date/DatePicker'
import { Control } from '../Control'
import {EditorMode} from '../../../../dataset/enum/Editor'
import {TrackType} from '../../../../dataset/enum/Track'

export class DateControl implements IControlInstance {
  private draw: Draw
  private element: IElement
  private control: Control
  private isPopup: boolean
  private datePicker: DatePicker | null

  constructor(element: IElement, control: Control) {
    const draw = control.getDraw()
    this.draw = draw
    this.element = element
    this.control = control
    this.isPopup = false
    this.datePicker = null
  }

  public setElement(element: IElement) {
    this.element = element
  }

  public getElement(): IElement {
    return this.element
  }

  public getIsPopup(): boolean {
    return this.isPopup
  }

  public getValueRange(context: IControlContext = {}): [number, number] | null {
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
      nextIndex++
    }
    if (preIndex === nextIndex) return null
    return [preIndex, nextIndex - 1]
  }

  public getValue(context: IControlContext = {}): IElement[] {
    const elementList = context.elementList || this.control.getElementList()
    const range = this.getValueRange(context)
    if (!range) return []
    const data: IElement[] = []
    const [startIndex, endIndex] = range
    for (let i = startIndex; i <= endIndex; i++) {
      const element = elementList[i]
      if (element.controlComponent === ControlComponent.VALUE && element.trackType !== TrackType.DELETE) {
        data.push(element)
      }
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
    // 移除选区元素
    if (startIndex !== endIndex) {
      draw.spliceElementList(elementList, startIndex + 1, endIndex - startIndex)
    } else {
      // 移除空白占位符
      this.control.removePlaceholder(startIndex, context)
    }
    // 非文本类元素或前缀过渡掉样式属性
    const startElement = elementList[startIndex]
    const anchorElement =
      (startElement.type &&
        !TEXTLIKE_ELEMENT_TYPE.includes(startElement.type)) ||
      startElement.controlComponent === ControlComponent.PREFIX
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
      formatElementContext(elementList, [newElement], startIndex)
      draw.spliceElementList(elementList, start + i, 0, newElement)
    }
    return start + data.length - 1
  }

  public clearSelect(
    context: IControlContext = {},
    options: IControlRuleOption = {}
  ): number {
    const { isIgnoreDisabledRule = false, isAddPlaceholder = true } = options
    // 校验是否可以设置
    if (!isIgnoreDisabledRule && this.control.getIsDisabledControl(context)) {
      return -1
    }
    const range = this.getValueRange(context)
    if (!range) return -1
    const [leftIndex, rightIndex] = range
    if (!~leftIndex || !~rightIndex) return -1
    const elementList = context.elementList || this.control.getElementList()
    // 删除元素
    const draw = this.control.getDraw()
    const isReviewMode = draw.getMode() === EditorMode.REVIEW
    const currentUser = draw.getOptions().user.name
    if(isReviewMode) {
      const deleteArray = elementList.slice(leftIndex +1 , rightIndex +1 )
      const len = deleteArray.length
      let startNum = leftIndex + 1
      for(let i = 0; i < len; i++) {
        const element = deleteArray[i]
        if(element.trackType === TrackType.INSERT && element.track?.author === currentUser){
          draw.spliceElementList(elementList, startNum + i, 1)
          startNum--
        } else {
          draw.addReviewInformation([element], TrackType.DELETE)
        }
      }
      return leftIndex

    } else {
      draw.spliceElementList(elementList, leftIndex + 1, rightIndex - leftIndex)
      // 增加占位符
      if (isAddPlaceholder) {
        this.control.addPlaceholder(leftIndex, context)
      }
      return leftIndex
    }

  }

  public setSelect(
    date: string,
    context: IControlContext = {},
    options: IControlRuleOption = {}
  ) {
    // 校验是否可以设置
    if (
      !options.isIgnoreDisabledRule &&
      this.control.getIsDisabledControl(context)
    ) {
      return
    }
    const elementList = context.elementList || this.control.getElementList()
    const range = context.range || this.control.getRange()
    // 样式赋值元素-默认值的第一个字符样式，否则取默认样式
    const valueElement = this.getValue(context)[0]
    const styleElement = valueElement
      ? pickObject(valueElement, EDITOR_ELEMENT_STYLE_ATTR)
      : pickObject(elementList[range.startIndex], CONTROL_STYLE_ATTR)
    // 清空选项
    const prefixIndex = this.clearSelect(context, {
      isAddPlaceholder: false
    })
    if (!~prefixIndex) return
    // 属性赋值元素-默认为前缀属性
    const propertyElement = omitObject(
      elementList[prefixIndex],
      EDITOR_ELEMENT_STYLE_ATTR
    )
    const start = prefixIndex + 1
    const draw = this.control.getDraw()
    const isReviewMode = draw.getMode() === EditorMode.REVIEW
    for (let i = 0; i < date.length; i++) {
      const newElement: IElement = {
        ...styleElement,
        ...propertyElement,
        type: ElementType.TEXT,
        value: date[i],
        controlComponent: ControlComponent.VALUE
      }
      formatElementContext(elementList, [newElement], prefixIndex)
      if(isReviewMode){
        draw.addReviewInformation([newElement],TrackType.INSERT)
      }
      draw.spliceElementList(elementList, start + i, 0, newElement)
    }
    // 重新渲染控件
    if (!context.range) {
      const newIndex = start + date.length - 1
      this.control.repaintControl({
        curIndex: newIndex
      })
      this.destroy()
    }
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
    const isReviewMode = draw.getMode() === EditorMode.REVIEW
    const currentUser = draw.getOptions().user.name

    // backspace
    if (evt.key === KeyMap.Backspace) {
      // 审阅模式
      if(isReviewMode) {
        if(startIndex === endIndex) {
          if (
            startElement.controlComponent === ControlComponent.PREFIX ||
            endElement.controlComponent === ControlComponent.POSTFIX ||
            startElement.controlComponent === ControlComponent.PLACEHOLDER
          ) {
            // 前缀、后缀、占位符
            return this.control.removeControl(startIndex)
          }
          if(startElement.trackType === TrackType.INSERT && startElement.track?.author === currentUser){
            draw.spliceElementList(elementList, startIndex, 1)
          } else {
            draw.addReviewInformation([startElement], TrackType.DELETE)
          }
          return startIndex - 1
        } else {
          const deleteArray = elementList.slice(startIndex+1, endIndex+1)
          const len = deleteArray.length
          let startNum = startIndex + 1
          for(let i = 0; i < len; i++) {
            const element = deleteArray[i]
            if(element.trackType === TrackType.INSERT && element.track?.author === currentUser){
              draw.spliceElementList(elementList, startNum + i, 1)
              startNum--
            } else {
              draw.addReviewInformation([element], TrackType.DELETE)
            }
          }
          return startIndex
        }
      } else if (!isReviewMode && startIndex !== endIndex) {
        draw.spliceElementList(
          elementList,
          startIndex + 1,
          endIndex - startIndex
        )
        const value = this.getValue()
        if (!value.length) {
          this.control.addPlaceholder(startIndex)
        }
        return startIndex
      } else if(!isReviewMode && startIndex === endIndex){
        if (
          startElement.controlComponent === ControlComponent.PREFIX ||
          endElement.controlComponent === ControlComponent.POSTFIX ||
          startElement.controlComponent === ControlComponent.PLACEHOLDER
        ) {
          // 前缀、后缀、占位符
          return this.control.removeControl(startIndex)
        } else {
          // 文本
          draw.spliceElementList(elementList, startIndex, 1)
          const value = this.getValue()
          if (!value.length) {
            this.control.addPlaceholder(startIndex - 1)
          }
          return startIndex - 1
        }
      }
    } else if (evt.key === KeyMap.Delete) {
      // 审阅模式
      if(isReviewMode) {
        const endNextElement = elementList[endIndex + 1]
        if(startIndex === endIndex) {
          if (
            (startElement.controlComponent === ControlComponent.PREFIX &&
              endNextElement.controlComponent === ControlComponent.PLACEHOLDER) ||
            endNextElement.controlComponent === ControlComponent.POSTFIX ||
            startElement.controlComponent === ControlComponent.PLACEHOLDER
          ) {
            // 前缀、后缀、占位符
            return this.control.removeControl(startIndex)
          } else {
            if(endNextElement.trackType === TrackType.INSERT && endNextElement.track?.author === currentUser){
              draw.spliceElementList(elementList, endIndex+1, 1)
              return endIndex
            } else {
              draw.addReviewInformation([endNextElement], TrackType.DELETE)
              return endIndex + 1
            }
          }
        } else {
          const deleteArray = elementList.slice(startIndex+1, endIndex+1)
          const len = deleteArray.length
          let startNum = startIndex + 1
          for(let i = 0; i < len; i++) {
            const element = deleteArray[i]
            if(element.trackType === TrackType.INSERT && element.track?.author === currentUser){
              draw.spliceElementList(elementList, startNum + i, 1)
              startNum--
            } else {
              draw.addReviewInformation([element], TrackType.DELETE)
            }
          }
          return endIndex
        }
      }
      // 移除选区元素
      else if (!isReviewMode && startIndex !== endIndex) {
        draw.spliceElementList(
          elementList,
          startIndex + 1,
          endIndex - startIndex
        )
        const value = this.getValue()
        if (!value.length) {
          this.control.addPlaceholder(startIndex)
        }
        return startIndex
      } if(!isReviewMode && startIndex === endIndex){
        const endNextElement = elementList[endIndex + 1]
        if (
          (startElement.controlComponent === ControlComponent.PREFIX &&
            endNextElement.controlComponent === ControlComponent.PLACEHOLDER) ||
          endNextElement.controlComponent === ControlComponent.POSTFIX ||
          startElement.controlComponent === ControlComponent.PLACEHOLDER
        ) {
          // 前缀、后缀、占位符
          return this.control.removeControl(startIndex)
        } else {
          // 文本
          draw.spliceElementList(elementList, startIndex + 1, 1)
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
    draw.spliceElementList(elementList, startIndex + 1, endIndex - startIndex)
    const value = this.getValue()
    if (!value.length) {
      this.control.addPlaceholder(startIndex)
    }
    return startIndex
  }

  public awake() {
    if (this.isPopup || this.control.getIsDisabledControl()) return
    const position = this.control.getPosition()
    if (!position) return
    const elementList = this.draw.getElementList()
    const { startIndex } = this.control.getRange()
    if (elementList[startIndex + 1]?.controlId !== this.element.controlId) {
      return
    }
    // 渲染日期控件
    this.datePicker = new DatePicker(this.draw, {
      onSubmit: this._setDate.bind(this)
    })
    const value =
      this.getValue()
        .map(el => el.value)
        .join('') || ''
    const dateFormat = this.element.control?.dateFormat
    this.datePicker.render({
      value,
      position,
      dateFormat
    })
    // 弹窗状态
    this.isPopup = true
  }

  public destroy() {
    if (!this.isPopup) return
    this.datePicker?.destroy()
    this.isPopup = false
  }

  private _setDate(date: string) {
    if (!date) {
      this.clearSelect()
    } else {
      this.setSelect(date)
    }
    this.destroy()
  }
}
