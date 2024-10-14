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
import { formatElementContext } from '../../../../utils/element'
import { Control } from '../Control'
import {EditorMode} from '../../../../dataset/enum/Editor'
import {TrackType} from '../../../../dataset/enum/Track'

export class TextControl implements IControlInstance {
  private element: IElement
  private control: Control
  private options: DeepRequired<IEditorOption>

  constructor(element: IElement, control: Control) {
    this.options = control.getDraw().getOptions()
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
    const isReviewMode = draw.getMode() === EditorMode.REVIEW
    // 移除选区元素
    if(isReviewMode) {
      if(startIndex !== endIndex) {
        const deleteArray = elementList.slice(startIndex + 1, endIndex + 1)
        draw.addReviewInformation(deleteArray, TrackType.DELETE)
      } else {
        this.control.removePlaceholder(startIndex, context)
      }
    } else if (startIndex !== endIndex) {
      draw.spliceElementList(elementList, startIndex + 1, endIndex - startIndex)
    } else {
      // 移除空白占位符
      this.control.removePlaceholder(startIndex, context)
    }

    // 非文本类元素或前缀过渡掉样式属性
    const startElement = elementList[startIndex]
    let anchorElement =
      (startElement.type &&
        !TEXTLIKE_ELEMENT_TYPE.includes(startElement.type)) ||
      startElement.controlComponent === ControlComponent.PREFIX
        ? pickObject(startElement, [
            'control',
            'controlId',
            ...CONTROL_STYLE_ATTR
          ])
        : omitObject(startElement, ['type'])
    // review->edit 去除痕迹有关属性
    if(startElement.trackId && !isReviewMode){
      anchorElement = omitObject(anchorElement,['track','trackId','trackType'])
    }
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
      if(isReviewMode){
        draw.addReviewInformation([newElement],TrackType.INSERT)
        draw.spliceElementList(elementList, endIndex + 1 + i, 0, newElement)
      } else {
        draw.spliceElementList(elementList, start + i, 0, newElement)
      }
    }
    if(isReviewMode) {
      return endIndex + data.length
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
    const range = context.range || this.control.getRange()
    const { startIndex, endIndex } = range
    this.control
      .getDraw()
      .spliceElementList(elementList, startIndex + 1, endIndex - startIndex)
    const value = this.getValue(context)
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
}
