import { ControlComponent, ControlType } from '../../../dataset/enum/Control'
import { EditorZone } from '../../../dataset/enum/Editor'
import { ElementType } from '../../../dataset/enum/Element'
import { DeepRequired } from '../../../interface/Common'
import {
  IControl,
  IControlContext,
  IControlHighlight,
  IControlInitOption,
  IControlInstance,
  IControlOption,
  IControlRuleOption,
  IGetControlValueOption,
  IGetControlValueResult,
  ISetControlExtensionOption,
  ISetControlProperties,
  ISetControlValueOption
} from '../../../interface/Control'
import { IEditorData, IEditorOption } from '../../../interface/Editor'
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
import { RadioControl } from './radio/RadioControl'
import { ControlSearch } from './interactive/ControlSearch'
import { ControlBorder } from './richtext/Border'
import { SelectControl } from './select/SelectControl'
import { TextControl } from './text/TextControl'

interface IMoveCursorResult {
  newIndex: number
  newElement: IElement
}
export class Control {
  private controlBorder: ControlBorder
  private draw: Draw
  private range: RangeManager
  private listener: Listener
  private eventBus: EventBus<EventBusMap>
  private controlSearch: ControlSearch
  private options: DeepRequired<IEditorOption>
  private controlOptions: IControlOption
  private activeControl: IControlInstance | null

  constructor(draw: Draw) {
    this.controlBorder = new ControlBorder(draw)

    this.draw = draw
    this.range = draw.getRange()
    this.listener = draw.getListener()
    this.eventBus = draw.getEventBus()
    this.controlSearch = new ControlSearch(this)

    this.options = draw.getOptions()
    this.controlOptions = this.options.control
    this.activeControl = null
  }

  // 搜索高亮匹配
  public setHighlightList(payload: IControlHighlight[]) {
    this.controlSearch.setHighlightList(payload)
  }

  public computeHighlightList() {
    const highlightList = this.controlSearch.getHighlightList()
    if (highlightList.length) {
      this.controlSearch.computeHighlightList()
    }
  }

  public renderHighlightList(ctx: CanvasRenderingContext2D, pageNo: number) {
    const highlightMatchResult = this.controlSearch.getHighlightMatchResult()
    if (highlightMatchResult.length) {
      this.controlSearch.renderHighlightList(ctx, pageNo)
    }
  }

  public getDraw(): Draw {
    return this.draw
  }

  // 过滤控件辅助元素（前后缀、背景提示）
  public filterAssistElement(elementList: IElement[]): IElement[] {
    return elementList.filter(element => {
      if (element.type === ElementType.TABLE) {
        const trList = element.trList!
        for (let r = 0; r < trList.length; r++) {
          const tr = trList[r]
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            td.value = this.filterAssistElement(td.value)
          }
        }
      }
      if (!element.controlId) return true
      if (element.control?.minWidth) {
        if (
          element.controlComponent === ControlComponent.PREFIX ||
          element.controlComponent === ControlComponent.POSTFIX
        ) {
          element.value = ''
          return true
        }
      }
      return (
        element.controlComponent !== ControlComponent.PREFIX &&
        element.controlComponent !== ControlComponent.POSTFIX &&
        element.controlComponent !== ControlComponent.PLACEHOLDER
      )
    })
  }

  // 是否属于控件可以捕获事件的选区
  public getIsRangeCanCaptureEvent(): boolean {
    if (!this.activeControl) return false
    const { startIndex, endIndex } = this.getRange()
    if (!~startIndex && !~endIndex) return false
    const elementList = this.getElementList()
    const startElement = elementList[startIndex]
    // 闭合光标在后缀处
    if (
      startIndex === endIndex &&
      startElement.controlComponent === ControlComponent.POSTFIX
    ) {
      return true
    }
    // 在控件内
    const endElement = elementList[endIndex]
    if (
      startElement.controlId &&
      startElement.controlId === endElement.controlId &&
      endElement.controlComponent !== ControlComponent.POSTFIX
    ) {
      return true
    }
    return false
  }

  // 判断选区是否在后缀处
  public getIsRangeInPostfix(): boolean {
    if (!this.activeControl) return false
    const { startIndex, endIndex } = this.getRange()
    if (startIndex !== endIndex) return false
    const elementList = this.getElementList()
    const element = elementList[startIndex]
    return element.controlComponent === ControlComponent.POSTFIX
  }

  // 判断选区是否在控件内
  public getIsRangeWithinControl(): boolean {
    const { startIndex, endIndex } = this.getRange()
    if (!~startIndex && !~endIndex) return false
    const elementList = this.getElementList()
    const startElement = elementList[startIndex]
    const endElement = elementList[endIndex]
    if (
      startElement.controlId &&
      startElement.controlId === endElement.controlId &&
      endElement.controlComponent !== ControlComponent.POSTFIX
    ) {
      return true
    }
    return false
  }

  public getIsDisabledControl(): boolean {
    return !!this.activeControl?.getElement().control?.disabled
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

  public shrinkBoundary(context: IControlContext = {}) {
    this.range.shrinkBoundary(context)
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
    } else if (control.type === ControlType.RADIO) {
      this.activeControl = new RadioControl(element, this)
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

  public repaintControl(curIndex?: number) {
    if (curIndex === undefined) {
      this.range.clearRange()
      this.draw.render({
        isSetCursor: false
      })
    } else {
      this.range.setRange(curIndex, curIndex)
      this.draw.render({
        curIndex
      })
    }
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
      let isHasSubmitHistory = false
      let index = startIndex
      while (index < elementList.length) {
        const curElement = elementList[index]
        if (curElement.controlId !== startElement.controlId) break
        if (curElement.controlComponent === ControlComponent.PLACEHOLDER) {
          // 删除占位符时替换前一个历史记录
          if (!isHasSubmitHistory) {
            isHasSubmitHistory = true
            this.draw.getHistoryManager().popUndo()
            this.draw.submitHistory(startIndex)
          }
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
        color: this.controlOptions.placeholderColor
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
    const result: IGetControlValueResult = []
    const getValue = (elementList: IElement[], zone: EditorZone) => {
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
              getValue(td.value, zone)
            }
          }
        }
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
            zone,
            value: textControlValue || null,
            innerText: textControlValue || null
          })
        } else if (
          type === ControlType.SELECT ||
          type === ControlType.CHECKBOX ||
          type === ControlType.RADIO
        ) {
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
            zone,
            value: code || null,
            innerText: innerText || null
          })
        }
        i = j
      }
    }
    const data = [
      {
        zone: EditorZone.HEADER,
        elementList: this.draw.getHeaderElementList()
      },
      {
        zone: EditorZone.MAIN,
        elementList: this.draw.getOriginalMainElementList()
      },
      {
        zone: EditorZone.FOOTER,
        elementList: this.draw.getFooterElementList()
      }
    ]
    for (const { zone, elementList } of data) {
      getValue(elementList, zone)
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
        const controlRule: IControlRuleOption = {
          isIgnoreDisabledRule: true
        }
        if (type === ControlType.TEXT) {
          const formatValue = [{ value }]
          formatElementList(formatValue, {
            isHandleFirstElement: false,
            editorOptions: this.options
          })
          const text = new TextControl(element, this)
          if (value) {
            text.setValue(formatValue, controlContext, controlRule)
          } else {
            text.clearValue(controlContext, controlRule)
          }
        } else if (type === ControlType.SELECT) {
          const select = new SelectControl(element, this)
          if (value) {
            select.setSelect(value, controlContext, controlRule)
          } else {
            select.clearSelect(controlContext, controlRule)
          }
        } else if (type === ControlType.CHECKBOX) {
          const checkbox = new CheckboxControl(element, this)
          const codes = value?.split(',') || []
          checkbox.setSelect(codes, controlContext, controlRule)
        } else if (type === ControlType.RADIO) {
          const radio = new RadioControl(element, this)
          const codes = value ? [value] : []
          radio.setSelect(codes, controlContext, controlRule)
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
    const setExtension = (elementList: IElement[]) => {
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
              setExtension(td.value)
            }
          }
        }
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
    const data = [
      this.draw.getHeaderElementList(),
      this.draw.getOriginalMainElementList(),
      this.draw.getFooterElementList()
    ]
    for (const elementList of data) {
      setExtension(elementList)
    }
  }

  public setPropertiesByConceptId(payload: ISetControlProperties) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const { conceptId, properties } = payload
    let isExistUpdate = false
    const pageComponentData: IEditorData = {
      header: this.draw.getHeaderElementList(),
      main: this.draw.getOriginalMainElementList(),
      footer: this.draw.getFooterElementList()
    }
    for (const key in pageComponentData) {
      const elementList = pageComponentData[<keyof IEditorData>key]!
      let i = 0
      while (i < elementList.length) {
        const element = elementList[i]
        i++
        if (element?.control?.conceptId !== conceptId) continue
        isExistUpdate = true
        element.control = {
          ...element.control,
          ...properties,
          value: element.control.value
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
    if (!isExistUpdate) return
    // 强制更新
    for (const key in pageComponentData) {
      const pageComponentKey = <keyof IEditorData>key
      const elementList = zipElementList(pageComponentData[pageComponentKey]!)
      pageComponentData[pageComponentKey] = elementList
      formatElementList(elementList, {
        editorOptions: this.options
      })
    }
    this.draw.setEditorData(pageComponentData)
    this.draw.render({
      isSetCursor: false
    })
  }

  public getList(): IElement[] {
    const data = [
      this.draw.getHeader().getElementList(),
      this.draw.getOriginalMainElementList(),
      this.draw.getFooter().getElementList()
    ]
    const controlElementList: IElement[] = []
    for (const elementList of data) {
      for (let e = 0; e < elementList.length; e++) {
        const element = elementList[e]
        if (element.controlId) {
          controlElementList.push(element)
        }
      }
    }
    return zipElementList(controlElementList)
  }

  public recordBorderInfo(x: number, y: number, width: number, height: number) {
    this.controlBorder.recordBorderInfo(x, y, width, height)
  }

  public drawBorder(ctx: CanvasRenderingContext2D) {
    this.controlBorder.render(ctx)
  }
}
