import {
  EDITOR_COMPONENT,
  EDITOR_PREFIX
} from '../../../../dataset/constant/Editor'
import { EDITOR_ELEMENT_STYLE_ATTR } from '../../../../dataset/constant/Element'
import { ControlComponent } from '../../../../dataset/enum/Control'
import { EditorComponent } from '../../../../dataset/enum/Editor'
import { KeyMap } from '../../../../dataset/enum/KeyMap'
import { IControlInstance } from '../../../../interface/Control'
import { IElement } from '../../../../interface/Element'
import { omitObject, splitText } from '../../../../utils'
import { formatElementContext } from '../../../../utils/element'
import { Control } from '../Control'

export class SelectControl implements IControlInstance {
  private element: IElement
  private control: Control
  private isPopup: boolean
  private selectDom: HTMLDivElement | null

  constructor(element: IElement, control: Control) {
    this.element = element
    this.control = control
    this.isPopup = false
    this.selectDom = null
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

  public keydown(evt: KeyboardEvent): number {
    const elementList = this.control.getElementList()
    const range = this.control.getRange()
    // 收缩边界到Value内
    this.control.shrinkBoundary()
    const { startIndex, endIndex } = range
    const startElement = elementList[startIndex]
    const endElement = elementList[endIndex]
    // backspace
    if (evt.key === KeyMap.Backspace) {
      // 清空选项
      if (startIndex !== endIndex) {
        return this.clearSelect()
      } else {
        if (
          startElement.controlComponent === ControlComponent.PREFIX ||
          endElement.controlComponent === ControlComponent.POSTFIX ||
          startElement.controlComponent === ControlComponent.PLACEHOLDER
        ) {
          // 前缀、后缀、占位符
          return this.control.removeControl(startIndex)
        } else {
          // 清空选项
          return this.clearSelect()
        }
      }
    } else if (evt.key === KeyMap.Delete) {
      // 移除选区元素
      if (startIndex !== endIndex) {
        // 清空选项
        return this.clearSelect()
      } else {
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
          // 清空选项
          return this.clearSelect()
        }
      }
    }
    return endIndex
  }

  public cut(): number {
    this.control.shrinkBoundary()
    const { startIndex, endIndex } = this.control.getRange()
    if (startIndex === endIndex) {
      return startIndex
    }
    // 清空选项
    return this.clearSelect()
  }

  public clearSelect(): number {
    const elementList = this.control.getElementList()
    const { startIndex } = this.control.getRange()
    const startElement = elementList[startIndex]
    let leftIndex = -1
    let rightIndex = -1
    // 向左查找
    let preIndex = startIndex
    while (preIndex > 0) {
      const preElement = elementList[preIndex]
      if (
        preElement.controlId !== startElement.controlId ||
        preElement.controlComponent === ControlComponent.PREFIX
      ) {
        leftIndex = preIndex
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
        rightIndex = nextIndex - 1
        break
      }
      nextIndex++
    }
    if (!~leftIndex || !~rightIndex) return -1
    // 删除元素
    const draw = this.control.getDraw()
    draw.spliceElementList(elementList, leftIndex + 1, rightIndex - leftIndex)
    // 增加占位符
    this.control.addPlaceholder(preIndex)
    this.element.control!.code = null
    return preIndex
  }

  public setSelect(code: string) {
    const control = this.element.control!
    const valueSets = control.valueSets
    if (!Array.isArray(valueSets) || !valueSets.length) return
    // 转换code
    const valueSet = valueSets.find(v => v.code === code)
    if (!valueSet) return
    // 清空选项
    const startIndex = this.clearSelect()
    this.control.removePlaceholder(startIndex)
    // 插入
    const elementList = this.control.getElementList()
    const startElement = elementList[startIndex]
    const anchorElement =
      startElement.controlComponent === ControlComponent.PREFIX
        ? omitObject(startElement, EDITOR_ELEMENT_STYLE_ATTR)
        : startElement
    const start = startIndex + 1
    const data = splitText(valueSet.value)
    const draw = this.control.getDraw()
    for (let i = 0; i < data.length; i++) {
      const newElement: IElement = {
        ...anchorElement,
        value: data[i],
        controlComponent: ControlComponent.VALUE
      }
      formatElementContext(elementList, [newElement], startIndex)
      draw.spliceElementList(elementList, start + i, 0, newElement)
    }
    // render
    const newIndex = start + data.length - 1
    this.control.repaintControl(newIndex)
    // 设置状态
    this.element.control!.code = code
    this.destroy()
  }

  private _createSelectPopupDom() {
    const control = this.element.control!
    const valueSets = control.valueSets
    if (!Array.isArray(valueSets) || !valueSets.length) return
    const position = this.control.getPosition()
    if (!position) return
    // dom树：<div><ul><li>item</li></ul></div>
    const selectPopupContainer = document.createElement('div')
    selectPopupContainer.classList.add(`${EDITOR_PREFIX}-select-control-popup`)
    selectPopupContainer.setAttribute(EDITOR_COMPONENT, EditorComponent.POPUP)
    const ul = document.createElement('ul')
    for (let v = 0; v < valueSets.length; v++) {
      const valueSet = valueSets[v]
      const li = document.createElement('li')
      const code = this.getCode()
      if (code === valueSet.code) {
        li.classList.add('active')
      }
      li.onclick = () => {
        this.setSelect(valueSet.code)
      }
      li.append(document.createTextNode(valueSet.value))
      ul.append(li)
    }
    selectPopupContainer.append(ul)
    // 定位
    const {
      coordinate: {
        leftTop: [left, top]
      },
      lineHeight
    } = position
    const preY = this.control.getPreY()
    selectPopupContainer.style.left = `${left}px`
    selectPopupContainer.style.top = `${top + preY + lineHeight}px`
    // 追加至container
    const container = this.control.getContainer()
    container.append(selectPopupContainer)
    this.selectDom = selectPopupContainer
  }

  public awake() {
    if (this.isPopup) return
    const { startIndex } = this.control.getRange()
    const elementList = this.control.getElementList()
    if (elementList[startIndex + 1]?.controlId !== this.element.controlId) {
      return
    }
    this._createSelectPopupDom()
    this.isPopup = true
  }

  public destroy() {
    if (!this.isPopup) return
    this.selectDom?.remove()
    this.isPopup = false
  }
}
