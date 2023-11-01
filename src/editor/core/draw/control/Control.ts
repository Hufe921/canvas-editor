import { ControlComponent, ControlType } from '../../../dataset/enum/Control'
import { ElementType } from '../../../dataset/enum/Element'
import {
  IControl,
  IControlContext,
  IControlInitOption,
  IControlInstance,
  IControlOption,
  IGetControlValueOption,
  IGetControlValueResult,
  ISetControlExtensionOption,
  ISetControlValueOption
} from '../../../interface/Control'
import { IEditorData } from '../../../interface/Editor'
import { IElement, IElementPosition } from '../../../interface/Element'
import { EventBusMap } from '../../../interface/EventBus'
import { IRange } from '../../../interface/Range'
import { deepClone, nextTick, splitText } from '../../../utils'
import {
  formatElementContext,
  formatElementList,
  pickElementAttr,
  zipElementList
} from '../../../utils/element'
import { EventBus } from '../../event/eventbus/EventBus'
import { Listener } from '../../listener/Listener'
import { RangeManager } from '../../range/RangeManager'
import { Draw } from '../Draw'
import { CheckboxControl } from './checkbox/CheckboxControl'
import { SelectControl } from './select/SelectControl'
import { TextControl } from './text/TextControl'

interface IMoveCursorResult {
  newIndex: number
  newElement: IElement
}
export class Control {
  private draw: Draw
  private range: RangeManager
  private listener: Listener
  private eventBus: EventBus<EventBusMap>
  private options: IControlOption
  private activeControl: IControlInstance | null

  constructor(draw: Draw) {
    this.draw = draw
    this.range = draw.getRange()
    this.listener = draw.getListener()
    this.eventBus = draw.getEventBus()

    this.options = draw.getOptions().control
    this.activeControl = null
  }

  public getDraw(): Draw {
    return this.draw
  }

  // 过滤控件辅助元素（前后缀、背景提示）
  public filterAssistElement(
    payload: Required<IEditorData>
  ): Required<IEditorData> {
    const editorDataKeys: (keyof IEditorData)[] = ['header', 'main', 'footer']
    editorDataKeys.forEach(key => {
      payload[key] = payload[key].filter(element => {
        if (element.type !== ElementType.CONTROL || element.control?.minWidth) {
          return true
        }
        return (
          element.controlComponent !== ControlComponent.PREFIX &&
          element.controlComponent !== ControlComponent.POSTFIX &&
          element.controlComponent !== ControlComponent.PLACEHOLDER
        )
      })
    })
    return payload
  }

  // 判断选区部分在控件边界外
  public isPartRangeInControlOutside(): boolean {
    const { startIndex, endIndex } = this.getRange()
    if (!~startIndex && !~endIndex) return false
    const elementList = this.getElementList()
    const startElement = elementList[startIndex]
    const endElement = elementList[endIndex]
    if (
      (startElement?.type === ElementType.CONTROL ||
        endElement?.type === ElementType.CONTROL) &&
      startElement.controlId !== endElement.controlId
    ) {
      return true
    }
    return false
  }

  // 判断选区是否在后缀处
  public isRangInPostfix(): boolean {
    if (!this.activeControl) return false
    const { startIndex, endIndex } = this.getRange()
    if (startIndex !== endIndex) return false
    const elementList = this.getElementList()
    const element = elementList[startIndex]
    return element.controlComponent === ControlComponent.POSTFIX
  }

  // 判断选区是否在控件内
  public isRangeWithinControl(): boolean {
    const { startIndex, endIndex } = this.getRange()
    if (!~startIndex && !~endIndex) return false
    const elementList = this.getElementList()
    const startElement = elementList[startIndex]
    const endElement = elementList[endIndex]
    if (
      (startElement.type === ElementType.CONTROL ||
        endElement.type === ElementType.CONTROL) &&
      endElement.controlComponent !== ControlComponent.POSTFIX &&
      startElement.controlId === endElement.controlId
    ) {
      return true
    }
    return false
  }

  public getContainer(): HTMLDivElement {
    return this.draw.getContainer()
  }

  public getElementList(): IElement[] {
    return this.draw.getElementList()
  }

  public getPosition(): IElementPosition | null {
    const positionList = this.draw.getPosition().getPositionList()
    const { endIndex } = this.range.getRange()
    return positionList[endIndex] || null
  }

  public getPreY(): number {
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    return this.draw.getPageNo() * (height + pageGap)
  }

  public getRange(): IRange {
    return this.range.getRange()
  }

  public shrinkBoundary() {
    this.range.shrinkBoundary()
  }

  public getActiveControl(): IControlInstance | null {
    return this.activeControl
  }

  public initControl() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const elementList = this.getElementList()
    const range = this.getRange()
    const element = elementList[range.startIndex]
    // 判断控件是否已经激活
    if (this.activeControl) {
      // 列举控件唤醒下拉弹窗
      if (this.activeControl instanceof SelectControl) {
        this.activeControl.awake()
      }
      const controlElement = this.activeControl.getElement()
      if (element.controlId === controlElement.controlId) return
    }
    // 销毁旧激活控件
    this.destroyControl()
    // 激活控件
    const control = element.control!
    if (control.type === ControlType.TEXT) {
      this.activeControl = new TextControl(element, this)
    } else if (control.type === ControlType.SELECT) {
      const selectControl = new SelectControl(element, this)
      this.activeControl = selectControl
      selectControl.awake()
    } else if (control.type === ControlType.CHECKBOX) {
      this.activeControl = new CheckboxControl(element, this)
    }
    // 激活控件回调
    nextTick(() => {
      const controlChangeListener = this.listener.controlChange
      const isSubscribeControlChange =
        this.eventBus.isSubscribe('controlChange')
      if (!controlChangeListener && !isSubscribeControlChange) return
      let payload: IControl
      const value = this.activeControl?.getValue()
      if (value && value.length) {
        payload = zipElementList(value)[0].control!
      } else {
        payload = pickElementAttr(deepClone(element)).control!
      }
      if (controlChangeListener) {
        controlChangeListener(payload)
      }
      if (isSubscribeControlChange) {
        this.eventBus.emit('controlChange', payload)
      }
    })
  }

  public destroyControl() {
    if (this.activeControl) {
      if (this.activeControl instanceof SelectControl) {
        this.activeControl.destroy()
      }
      this.activeControl = null
      // 销毁控件回调
      nextTick(() => {
        const controlChangeListener = this.listener.controlChange
        const isSubscribeControlChange =
          this.eventBus.isSubscribe('controlChange')
        if (!controlChangeListener && !isSubscribeControlChange) return
        if (controlChangeListener) {
          controlChangeListener(null)
        }
        if (isSubscribeControlChange) {
          this.eventBus.emit('controlChange', null)
        }
      })
    }
  }

  public repaintControl(curIndex: number) {
    this.range.setRange(curIndex, curIndex)
    this.draw.render({
      curIndex
    })
  }

  public moveCursor(position: IControlInitOption): IMoveCursorResult {
    const { index, trIndex, tdIndex, tdValueIndex } = position
    let elementList = this.draw.getOriginalElementList()
    let element: IElement
    const newIndex = position.isTable ? tdValueIndex! : index
    if (position.isTable) {
      elementList = elementList[index!].trList![trIndex!].tdList[tdIndex!].value
      element = elementList[tdValueIndex!]
    } else {
      element = elementList[index]
    }
    if (element.controlComponent === ControlComponent.VALUE) {
      // VALUE-无需移动
      return {
        newIndex,
        newElement: element
      }
    } else if (element.controlComponent === ControlComponent.POSTFIX) {
      // POSTFIX-移动到最后一个后缀字符后
      let startIndex = newIndex + 1
      while (startIndex < elementList.length) {
        const nextElement = elementList[startIndex]
        if (nextElement.controlId !== element.controlId) {
          return {
            newIndex: startIndex - 1,
            newElement: elementList[startIndex - 1]
          }
        }
        startIndex++
      }
    } else if (element.controlComponent === ControlComponent.PREFIX) {
      // PREFIX-移动到最后一个前缀字符后
      let startIndex = newIndex + 1
      while (startIndex < elementList.length) {
        const nextElement = elementList[startIndex]
        if (
          nextElement.controlId !== element.controlId ||
          nextElement.controlComponent !== ControlComponent.PREFIX
        ) {
          return {
            newIndex: startIndex - 1,
            newElement: elementList[startIndex - 1]
          }
        }
        startIndex++
      }
    } else if (element.controlComponent === ControlComponent.PLACEHOLDER) {
      // PLACEHOLDER-移动到第一个前缀后
      let startIndex = newIndex - 1
      while (startIndex > 0) {
        const preElement = elementList[startIndex]
        if (
          preElement.controlId !== element.controlId ||
          preElement.controlComponent === ControlComponent.PREFIX
        ) {
          return {
            newIndex: startIndex,
            newElement: elementList[startIndex]
          }
        }
        startIndex--
      }
    }
    return {
      newIndex,
      newElement: element
    }
  }

  public removeControl(
    startIndex: number,
    context: IControlContext = {}
  ): number | null {
    const elementList = context.elementList || this.getElementList()
    const startElement = elementList[startIndex]
    const { deletable = true } = startElement.control!
    if (!deletable) return null
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
    // 控件在最后
    if (nextIndex === elementList.length) {
      rightIndex = nextIndex - 1
    }
    if (!~leftIndex && !~rightIndex) return startIndex
    leftIndex = ~leftIndex ? leftIndex : 0
    // 删除元素
    this.draw.spliceElementList(
      elementList,
      leftIndex + 1,
      rightIndex - leftIndex
    )
    return leftIndex
  }

  public removePlaceholder(startIndex: number, context: IControlContext = {}) {
    const elementList = context.elementList || this.getElementList()
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
          this.draw.spliceElementList(elementList, index, 1)
        } else {
          index++
        }
      }
    }
  }

  public addPlaceholder(startIndex: number, context: IControlContext = {}) {
    const elementList = context.elementList || this.getElementList()
    const startElement = elementList[startIndex]
    const control = startElement.control!
    if (!control.placeholder) return
    const placeholderStrList = splitText(control.placeholder)
    for (let p = 0; p < placeholderStrList.length; p++) {
      const value = placeholderStrList[p]
      const newElement: IElement = {
        value,
        controlId: startElement.controlId,
        type: ElementType.CONTROL,
        control: startElement.control,
        controlComponent: ControlComponent.PLACEHOLDER,
        color: this.options.placeholderColor
      }
      formatElementContext(elementList, [newElement], startIndex)
      this.draw.spliceElementList(
        elementList,
        startIndex + p + 1,
        0,
        newElement
      )
    }
  }

  public setValue(data: IElement[]): number {
    if (!this.activeControl) {
      throw new Error('active control is null')
    }
    return this.activeControl.setValue(data)
  }

  public keydown(evt: KeyboardEvent): number | null {
    if (!this.activeControl) {
      throw new Error('active control is null')
    }
    return this.activeControl.keydown(evt)
  }

  public cut(): number {
    if (!this.activeControl) {
      throw new Error('active control is null')
    }
    return this.activeControl.cut()
  }

  public getValueByConceptId(
    payload: IGetControlValueOption
  ): IGetControlValueResult {
    const { conceptId } = payload
    const elementList = [
      ...this.draw.getHeaderElementList(),
      ...this.draw.getOriginalMainElementList(),
      ...this.draw.getFooterElementList()
    ]
    const result: IGetControlValueResult = []
    let i = 0
    while (i < elementList.length) {
      const element = elementList[i]
      i++
      if (element?.control?.conceptId !== conceptId) continue
      const { type, code, valueSets } = element.control!
      let j = i
      let textControlValue = ''
      while (j < elementList.length) {
        const nextElement = elementList[j]
        if (nextElement.controlId !== element.controlId) break
        if (
          type === ControlType.TEXT &&
          nextElement.controlComponent === ControlComponent.VALUE
        ) {
          textControlValue += nextElement.value
        }
        j++
      }
      if (type === ControlType.TEXT) {
        result.push({
          ...element.control,
          value: textControlValue || null,
          innerText: textControlValue || null
        })
      } else if (type === ControlType.SELECT || type === ControlType.CHECKBOX) {
        const innerText = code
          ?.split(',')
          .map(
            selectCode =>
              valueSets?.find(valueSet => valueSet.code === selectCode)?.value
          )
          .filter(Boolean)
          .join('')
        result.push({
          ...element.control,
          value: code || null,
          innerText: innerText || null
        })
      }
      i = j
    }
    return result
  }

  public setValueByConceptId(payload: ISetControlValueOption) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    let isExistSet = false
    const { conceptId, value } = payload
    // 设置值
    const setValue = (elementList: IElement[]) => {
      let i = 0
      while (i < elementList.length) {
        const element = elementList[i]
        i++
        // 表格下钻处理
        if (element.type === ElementType.TABLE) {
          const trList = element.trList!
          for (let r = 0; r < trList.length; r++) {
            const tr = trList[r]
            for (let d = 0; d < tr.tdList.length; d++) {
              const td = tr.tdList[d]
              setValue(td.value)
            }
          }
        }
        if (element?.control?.conceptId !== conceptId) continue
        isExistSet = true
        const { type } = element.control!
        // 当前控件结束索引
        let currentEndIndex = i
        while (currentEndIndex < elementList.length) {
          const nextElement = elementList[currentEndIndex]
          if (nextElement.controlId !== element.controlId) break
          currentEndIndex++
        }
        // 模拟光标选区上下文
        const fakeRange = {
          startIndex: i - 1,
          endIndex: currentEndIndex - 2
        }
        const controlContext: IControlContext = {
          range: fakeRange,
          elementList
        }
        if (type === ControlType.TEXT) {
          const formatValue = [{ value }]
          formatElementList(formatValue, {
            isHandleFirstElement: false,
            editorOptions: this.draw.getOptions()
          })
          const text = new TextControl(element, this)
          if (value) {
            text.setValue(formatValue, controlContext)
          } else {
            text.clearValue(controlContext)
          }
        } else if (type === ControlType.SELECT) {
          const select = new SelectControl(element, this)
          if (value) {
            select.setSelect(value, controlContext)
          } else {
            select.clearSelect(controlContext)
          }
        } else if (type === ControlType.CHECKBOX) {
          const checkbox = new CheckboxControl(element, this)
          const checkboxElementList = elementList.slice(
            fakeRange.startIndex + 1,
            fakeRange.endIndex + 1
          )
          const codes = value?.split(',') || []
          for (const checkElement of checkboxElementList) {
            if (checkElement.controlComponent === ControlComponent.CHECKBOX) {
              const checkboxItem = checkElement.checkbox!
              checkboxItem.value = codes.includes(checkboxItem.code!)
            }
          }
          checkbox.setSelect(controlContext)
        }
        // 修改后控件结束索引
        let newEndIndex = i
        while (newEndIndex < elementList.length) {
          const nextElement = elementList[newEndIndex]
          if (nextElement.controlId !== element.controlId) break
          newEndIndex++
        }
        i = newEndIndex
      }
    }
    // 页眉、内容区、页脚同时处理
    const data = [
      this.draw.getHeaderElementList(),
      this.draw.getOriginalMainElementList(),
      this.draw.getFooterElementList()
    ]
    for (const elementList of data) {
      setValue(elementList)
    }
    if (isExistSet) {
      this.draw.render({
        isSetCursor: false
      })
    }
  }

  public setExtensionByConceptId(payload: ISetControlExtensionOption) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const { conceptId, extension } = payload
    const data = [
      this.draw.getHeaderElementList(),
      this.draw.getOriginalMainElementList(),
      this.draw.getFooterElementList()
    ]
    for (const elementList of data) {
      let i = 0
      while (i < elementList.length) {
        const element = elementList[i]
        i++
        if (element?.control?.conceptId !== conceptId) continue
        element.control.extension = extension
        // 修改后控件结束索引
        let newEndIndex = i
        while (newEndIndex < elementList.length) {
          const nextElement = elementList[newEndIndex]
          if (nextElement.controlId !== element.controlId) break
          newEndIndex++
        }
        i = newEndIndex
      }
    }
  }
}
