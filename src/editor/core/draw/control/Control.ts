import {
  ControlComponent,
  ControlState,
  ControlType
} from '../../../dataset/enum/Control'
import { EditorZone } from '../../../dataset/enum/Editor'
import { ElementType } from '../../../dataset/enum/Element'
import { DeepRequired } from '../../../interface/Common'
import {
  IControl,
  IControlChangeOption,
  IControlChangeResult,
  IControlContentChangeResult,
  IControlContext,
  IControlHighlight,
  IControlInitOption,
  IControlInstance,
  IControlOption,
  IControlRuleOption,
  IDestroyControlOption,
  IGetControlValueOption,
  IGetControlValueResult,
  IInitNextControlOption,
  INextControlContext,
  IRepaintControlOption,
  ISetControlExtensionOption,
  ISetControlProperties,
  ISetControlRowFlexOption,
  ISetControlValueOption
} from '../../../interface/Control'
import { IEditorData, IEditorOption } from '../../../interface/Editor'
import { IElement, IElementPosition } from '../../../interface/Element'
import { EventBusMap } from '../../../interface/EventBus'
import { IRange } from '../../../interface/Range'
import { deepClone, omitObject, pickObject, splitText } from '../../../utils'
import {
  formatElementContext,
  formatElementList,
  getNonHideElementIndex,
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
import { DateControl } from './date/DateControl'
import { NumberControl } from './number/NumberControl'
import { MoveDirection } from '../../../dataset/enum/Observer'
import {
  CONTROL_CONTEXT_ATTR,
  CONTROL_STYLE_ATTR,
  LIST_CONTEXT_ATTR,
  TITLE_CONTEXT_ATTR
} from '../../../dataset/constant/Element'
import { IRowElement } from '../../../interface/Row'
import { RowFlex } from '../../../dataset/enum/Row'
import { ZERO } from '../../../dataset/constant/Common'

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
  private activeControlValue: IElement[]

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
    this.activeControlValue = []
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
    return elementList.filter((element, index) => {
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
      } else {
        // 控件存在值时无需过滤前后文本
        if (
          element.control?.preText &&
          element.controlComponent === ControlComponent.PRE_TEXT
        ) {
          let isExistValue = false
          let start = index + 1
          while (start < elementList.length) {
            const nextElement = elementList[start]
            if (element.controlId !== nextElement.controlId) break
            if (nextElement.controlComponent === ControlComponent.VALUE) {
              isExistValue = true
              break
            }
            start++
          }
          return isExistValue
        }
        if (
          element.control?.postText &&
          element.controlComponent === ControlComponent.POST_TEXT
        ) {
          let isExistValue = false
          let start = index - 1
          while (start < elementList.length) {
            const preElement = elementList[start]
            if (element.controlId !== preElement.controlId) break
            if (preElement.controlComponent === ControlComponent.VALUE) {
              isExistValue = true
              break
            }
            start--
          }
          return isExistValue
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
      startElement?.controlId &&
      startElement.controlId === endElement.controlId &&
      endElement.controlComponent !== ControlComponent.POSTFIX
    ) {
      return true
    }
    return false
  }

  // 是否元素包含完整控件元素
  public getIsElementListContainFullControl(elementList: IElement[]): boolean {
    if (!elementList.some(element => element.controlId)) return false
    let prefixCount = 0
    let postfixCount = 0
    for (let e = 0; e < elementList.length; e++) {
      const element = elementList[e]
      if (element.controlComponent === ControlComponent.PREFIX) {
        prefixCount++
      } else if (element.controlComponent === ControlComponent.POSTFIX) {
        postfixCount++
      }
    }
    if (!prefixCount || !postfixCount) return false
    return prefixCount === postfixCount
  }

  public getIsDisabledControl(context: IControlContext = {}): boolean {
    if (this.draw.isDesignMode() || !this.activeControl) return false
    const { startIndex, endIndex } = context.range || this.range.getRange()
    if (startIndex === endIndex && ~startIndex && ~endIndex) {
      const elementList = context.elementList || this.getElementList()
      const startElement = elementList[startIndex]
      if (startElement.controlComponent === ControlComponent.POSTFIX) {
        return false
      }
    }
    return !!this.activeControl.getElement()?.control?.disabled
  }

  public getIsDisabledPasteControl(context: IControlContext = {}): boolean {
    if (this.draw.isDesignMode() || !this.activeControl) return false
    const { startIndex, endIndex } = context.range || this.range.getRange()
    if (startIndex === endIndex && ~startIndex && ~endIndex) {
      const elementList = context.elementList || this.getElementList()
      const startElement = elementList[startIndex]
      if (startElement.controlComponent === ControlComponent.POSTFIX) {
        return false
      }
    }
    return !!this.activeControl.getElement()?.control?.pasteDisabled
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
    const pageNo = this.getPosition()?.pageNo ?? this.draw.getPageNo()
    return pageNo * (height + pageGap)
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

  public getControlElementList(context: IControlContext = {}): IElement[] {
    const elementList = context.elementList || this.getElementList()
    const { startIndex } = context.range || this.getRange()
    const startElement = elementList[startIndex]
    if (!startElement?.controlId) return []
    const data: IElement[] = []
    // 向左查找
    let preIndex = startIndex
    while (preIndex > 0) {
      const preElement = elementList[preIndex]
      if (preElement.controlId !== startElement.controlId) break
      data.unshift(preElement)
      preIndex--
    }
    // 向右查找
    let nextIndex = startIndex + 1
    while (nextIndex < elementList.length) {
      const nextElement = elementList[nextIndex]
      if (nextElement.controlId !== startElement.controlId) break
      data.push(nextElement)
      nextIndex++
    }
    return data
  }

  public updateActiveControlValue() {
    if (this.activeControl) {
      this.activeControlValue = this.getControlElementList()
    }
  }

  public initControl() {
    const elementList = this.getElementList()
    const range = this.getRange()
    const element = elementList[range.startIndex]
    // 判断控件是否已经激活
    if (this.activeControl) {
      // 弹窗类控件唤醒弹窗，后缀处移除弹窗
      if (
        this.activeControl instanceof SelectControl ||
        this.activeControl instanceof DateControl
      ) {
        if (element.controlComponent === ControlComponent.POSTFIX) {
          this.activeControl.destroy()
        } else {
          this.activeControl.awake()
        }
      }
      const controlElement = this.activeControl.getElement()
      if (element.controlId === controlElement.controlId) {
        // 更新缓存控件数据
        this.updateActiveControlValue()
        return
      }
    }
    // 销毁旧激活控件
    this.destroyControl()
    // 激活控件
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
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
    } else if (control.type === ControlType.DATE) {
      const dateControl = new DateControl(element, this)
      this.activeControl = dateControl
      dateControl.awake()
    } else if (control.type === ControlType.NUMBER) {
      this.activeControl = new NumberControl(element, this)
    }
    // 缓存控件数据
    this.updateActiveControlValue()
    // 激活控件回调
    const isSubscribeControlChange = this.eventBus.isSubscribe('controlChange')
    if (this.listener.controlChange || isSubscribeControlChange) {
      let control: IControl
      const value = this.activeControlValue
      if (value?.length) {
        control = zipElementList(value)[0].control!
      } else {
        control = pickElementAttr(deepClone(element)).control!
        control.value = []
      }
      const payload: IControlChangeResult = {
        control,
        controlId: element.controlId!,
        state: ControlState.ACTIVE
      }
      this.listener.controlChange?.(payload)
      if (isSubscribeControlChange) {
        this.eventBus.emit('controlChange', payload)
      }
    }
  }

  public destroyControl(options: IDestroyControlOption = {}) {
    if (!this.activeControl) return
    const { isEmitEvent = true } = options
    if (
      this.activeControl instanceof SelectControl ||
      this.activeControl instanceof DateControl
    ) {
      this.activeControl.destroy()
    }
    // 销毁控件回调
    if (isEmitEvent) {
      const isSubscribeControlChange =
        this.eventBus.isSubscribe('controlChange')
      if (this.listener.controlChange || isSubscribeControlChange) {
        let control: IControl
        const value = this.activeControlValue
        const activeElement = this.activeControl.getElement()
        if (value?.length) {
          control = zipElementList(value)[0].control!
        } else {
          control = pickElementAttr(deepClone(activeElement)).control!
          control.value = []
        }
        const payload: IControlChangeResult = {
          control,
          controlId: activeElement.controlId!,
          state: ControlState.INACTIVE
        }
        this.listener.controlChange?.(payload)
        if (isSubscribeControlChange) {
          this.eventBus.emit('controlChange', payload)
        }
      }
    }
    // 清空变量
    this.activeControl = null
    this.activeControlValue = []
  }

  public repaintControl(options: IRepaintControlOption = {}) {
    const {
      curIndex,
      isCompute = true,
      isSubmitHistory = true,
      isSetCursor = true
    } = options
    // 重新渲染
    if (curIndex === undefined) {
      this.range.clearRange()
      this.draw.render({
        isCompute,
        isSubmitHistory,
        isSetCursor: false
      })
    } else {
      this.range.setRange(curIndex, curIndex)
      this.draw.render({
        curIndex,
        isCompute,
        isSetCursor,
        isSubmitHistory
      })
    }
  }

  public emitControlContentChange(options?: IControlChangeOption) {
    const isSubscribeControlContentChange = this.eventBus.isSubscribe(
      'controlContentChange'
    )
    if (
      !isSubscribeControlContentChange &&
      !this.listener.controlContentChange
    ) {
      return
    }
    const controlElement =
      options?.controlElement || this.activeControl?.getElement()
    if (!controlElement) return
    // 控件被删除不触发事件
    const elementList = options?.context?.elementList || this.getElementList()
    const { startIndex } = options?.context?.range || this.getRange()
    if (!elementList[startIndex]?.controlId) return
    // 格式化回调数据
    const controlValue =
      options?.controlValue || this.getControlElementList(options?.context)
    let control: IControl
    if (controlValue?.length) {
      control = zipElementList(controlValue)[0].control!
    } else {
      control = controlElement.control!
      control.value = []
    }
    if (!control) return
    const payload: IControlContentChangeResult = {
      control,
      controlId: controlElement.controlId!
    }
    this.listener.controlContentChange?.(payload)
    if (isSubscribeControlContentChange) {
      this.eventBus.emit('controlContentChange', payload)
    }
  }

  public reAwakeControl() {
    if (!this.activeControl) return
    const elementList = this.getElementList()
    const range = this.getRange()
    const element = elementList[range.startIndex]
    this.activeControl.setElement(element)
    if (
      (this.activeControl instanceof DateControl ||
        this.activeControl instanceof SelectControl) &&
      this.activeControl.getIsPopup()
    ) {
      this.activeControl.destroy()
      this.activeControl.awake()
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
    // 隐藏元素移动光标
    if (element.control?.hide) {
      const nonHideIndex = getNonHideElementIndex(elementList, newIndex)
      return {
        newIndex: nonHideIndex,
        newElement: elementList[nonHideIndex]
      }
    }
    // 控件内移动光标
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
    } else if (
      element.controlComponent === ControlComponent.PREFIX ||
      element.controlComponent === ControlComponent.PRE_TEXT
    ) {
      // PREFIX或前文本-移动到最后一个前缀字符后
      let startIndex = newIndex + 1
      while (startIndex < elementList.length) {
        const nextElement = elementList[startIndex]
        if (
          nextElement.controlId !== element.controlId ||
          (nextElement.controlComponent !== ControlComponent.PREFIX &&
            nextElement.controlComponent !== ControlComponent.PRE_TEXT)
        ) {
          return {
            newIndex: startIndex - 1,
            newElement: elementList[startIndex - 1]
          }
        }
        startIndex++
      }
    } else if (
      element.controlComponent === ControlComponent.PLACEHOLDER ||
      element.controlComponent === ControlComponent.POST_TEXT
    ) {
      // PLACEHOLDER或后文本-移动到第一个前缀或内容后
      let startIndex = newIndex - 1
      while (startIndex > 0) {
        const preElement = elementList[startIndex]
        if (
          preElement.controlId !== element.controlId ||
          preElement.controlComponent === ControlComponent.VALUE ||
          preElement.controlComponent === ControlComponent.PREFIX ||
          preElement.controlComponent === ControlComponent.PRE_TEXT
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
    // 设计模式 || 元素隐藏 => 不验证删除权限
    if (!this.draw.isDesignMode() && !startElement?.control?.hide) {
      const { deletable = true } = startElement.control!
      if (!deletable) return null
    }
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
          elementList.splice(index, 1)
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
    // 优先使用默认控件样式
    const anchorElementStyleAttr = pickObject(startElement, CONTROL_STYLE_ATTR)
    for (let p = 0; p < placeholderStrList.length; p++) {
      const value = placeholderStrList[p]
      const newElement: IElement = {
        ...anchorElementStyleAttr,
        value: value === '\n' ? ZERO : value,
        controlId: startElement.controlId,
        type: ElementType.CONTROL,
        control: startElement.control,
        controlComponent: ControlComponent.PLACEHOLDER,
        color: this.controlOptions.placeholderColor
      }
      formatElementContext(elementList, [newElement], startIndex, {
        editorOptions: this.options
      })
      this.draw.spliceElementList(elementList, startIndex + p + 1, 0, [
        newElement
      ])
    }
  }

  public setValue(data: IElement[]): number {
    if (!this.activeControl) {
      throw new Error('active control is null')
    }
    return this.activeControl.setValue(data)
  }

  public setControlProperties(
    properties: Partial<IControl>,
    context: IControlContext = {}
  ) {
    const elementList = context.elementList || this.getElementList()
    const { startIndex } = context.range || this.getRange()
    const startElement = elementList[startIndex]
    // 向左查找
    let preIndex = startIndex
    while (preIndex > 0) {
      const preElement = elementList[preIndex]
      if (preElement.controlId !== startElement.controlId) break
      preElement.control = {
        ...preElement.control!,
        ...properties
      }
      preIndex--
    }
    // 向右查找
    let nextIndex = startIndex + 1
    while (nextIndex < elementList.length) {
      const nextElement = elementList[nextIndex]
      if (nextElement.controlId !== startElement.controlId) break
      nextElement.control = {
        ...nextElement.control!,
        ...properties
      }
      nextIndex++
    }
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

  public getValueById(payload: IGetControlValueOption): IGetControlValueResult {
    const { id, conceptId, areaId } = payload
    const result: IGetControlValueResult = []
    if (!id && !conceptId) return result
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
        if (
          !element.control ||
          (id && element.controlId !== id) ||
          (conceptId && element.control.conceptId !== conceptId) ||
          (areaId && element.areaId !== areaId)
        ) {
          continue
        }
        const { type, code, valueSets } = element.control
        let j = i
        let textControlValue = ''
        const textControlElementList = []
        while (j < elementList.length) {
          const nextElement = elementList[j]
          if (nextElement.controlId !== element.controlId) break
          if (
            (type === ControlType.TEXT ||
              type === ControlType.DATE ||
              type === ControlType.NUMBER) &&
            nextElement.controlComponent === ControlComponent.VALUE
          ) {
            textControlValue += nextElement.value
            textControlElementList.push(
              omitObject(nextElement, CONTROL_CONTEXT_ATTR)
            )
          }
          j++
        }
        if (
          type === ControlType.TEXT ||
          type === ControlType.DATE ||
          type === ControlType.NUMBER
        ) {
          result.push({
            ...element.control,
            zone,
            value: textControlValue || null,
            innerText: textControlValue || null,
            elementList: zipElementList(textControlElementList)
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

  public setValueListById(payload: ISetControlValueOption[]) {
    if (!payload.length) return
    let isExistSet = false
    let isExistSubmitHistory = false
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
        if (!element.control) continue
        // 获取设置值优先id、conceptId、areaId
        const payloadItem = payload.find(
          p =>
            (p.id && element.controlId === p.id) ||
            (p.conceptId && element.control!.conceptId === p.conceptId) ||
            (p.areaId && element.areaId === p.areaId)
        )
        if (!payloadItem) continue
        const { value, isSubmitHistory = true } = payloadItem
        // 只要存在一次保存历史均记录
        isExistSet = true
        if (isSubmitHistory) {
          isExistSubmitHistory = true
        }
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
          const formatValue = Array.isArray(value)
            ? value
            : value
            ? [{ value }]
            : []
          if (formatValue.length) {
            formatElementList(formatValue, {
              isHandleFirstElement: false,
              editorOptions: this.options
            })
          }
          const text = new TextControl(element, this)
          this.activeControl = text
          if (formatValue.length) {
            text.setValue(formatValue, controlContext, controlRule)
          } else {
            text.clearValue(controlContext, controlRule)
          }
        } else if (type === ControlType.SELECT) {
          if (Array.isArray(value)) continue
          const select = new SelectControl(element, this)
          this.activeControl = select
          if (value) {
            select.setSelect(value, controlContext, controlRule)
          } else {
            select.clearSelect(controlContext, controlRule)
          }
        } else if (type === ControlType.CHECKBOX) {
          if (Array.isArray(value)) continue
          const checkbox = new CheckboxControl(element, this)
          this.activeControl = checkbox
          const codes = value ? value.split(',') : []
          checkbox.setSelect(codes, controlContext, controlRule)
        } else if (type === ControlType.RADIO) {
          if (Array.isArray(value)) continue
          const radio = new RadioControl(element, this)
          this.activeControl = radio
          const codes = value ? [value] : []
          radio.setSelect(codes, controlContext, controlRule)
        } else if (type === ControlType.DATE) {
          if (Array.isArray(value)) continue
          const date = new DateControl(element, this)
          this.activeControl = date
          if (value) {
            date.setSelect(value, controlContext, controlRule)
          } else {
            date.clearSelect(controlContext, controlRule)
          }
        } else if (type === ControlType.NUMBER) {
          const formatValue = Array.isArray(value)
            ? value
            : value
            ? [{ value }]
            : []
          if (formatValue.length) {
            formatElementList(formatValue, {
              isHandleFirstElement: false,
              editorOptions: this.options
            })
          }
          const text = new NumberControl(element, this)
          this.activeControl = text
          if (formatValue.length) {
            text.setValue(formatValue, controlContext, controlRule)
          } else {
            text.clearValue(controlContext, controlRule)
          }
        }
        // 控件值变更事件
        this.emitControlContentChange({
          context: controlContext
        })
        // 模拟控件激活后销毁
        this.activeControl = null
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
    // 销毁旧控件
    this.destroyControl({
      isEmitEvent: false
    })
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
      // 不保存历史时需清空之前记录，避免还原
      if (!isExistSubmitHistory) {
        this.draw.getHistoryManager().recovery()
      }
      this.draw.render({
        isSubmitHistory: isExistSubmitHistory,
        isSetCursor: false
      })
    }
  }

  public setExtensionListById(payload: ISetControlExtensionOption[]) {
    if (!payload.length) return
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
        if (!element.control) continue
        // 获取设置值优先id、conceptId、areaId
        const payloadItem = payload.find(
          p =>
            (p.id && element.controlId === p.id) ||
            (p.conceptId && element.control!.conceptId === p.conceptId) ||
            (p.areaId && element.areaId === p.areaId)
        )
        if (!payloadItem) continue
        const { extension } = payloadItem
        // 设置值
        this.setControlProperties(
          {
            extension
          },
          {
            elementList,
            range: { startIndex: i, endIndex: i }
          }
        )
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

  public setPropertiesListById(payload: ISetControlProperties[]) {
    if (!payload.length) return
    let isExistUpdate = false
    let isExistSubmitHistory = false
    const setProperties = (elementList: IElement[]) => {
      let i = 0
      while (i < elementList.length) {
        const element = elementList[i]
        i++
        if (element.type === ElementType.TABLE) {
          const trList = element.trList!
          for (let r = 0; r < trList.length; r++) {
            const tr = trList[r]
            for (let d = 0; d < tr.tdList.length; d++) {
              const td = tr.tdList[d]
              setProperties(td.value)
            }
          }
        }
        if (!element.control) continue
        // 获取设置值优先id、conceptId、areaId
        const payloadItem = payload.find(
          p =>
            (p.id && element.controlId === p.id) ||
            (p.conceptId && element.control!.conceptId === p.conceptId) ||
            (p.areaId && element.areaId === p.areaId)
        )
        if (!payloadItem) continue
        const { properties, isSubmitHistory = true } = payloadItem
        isExistUpdate = true
        if (isSubmitHistory) {
          isExistSubmitHistory = true
        }
        // 设置属性
        this.setControlProperties(
          {
            ...element.control,
            ...properties,
            value: element.control.value
          },
          {
            elementList,
            range: { startIndex: i, endIndex: i }
          }
        )
        // 控件默认样式
        CONTROL_STYLE_ATTR.forEach(key => {
          const controlStyleProperty = properties[key]
          if (controlStyleProperty) {
            Reflect.set(element, key, controlStyleProperty)
          }
        })
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
    // 页眉页脚正文启动搜索
    const pageComponentData: IEditorData = {
      header: this.draw.getHeaderElementList(),
      main: this.draw.getOriginalMainElementList(),
      footer: this.draw.getFooterElementList()
    }
    for (const key in pageComponentData) {
      const elementList = pageComponentData[<keyof IEditorData>key]!
      setProperties(elementList)
    }
    if (!isExistUpdate) return
    // 强制更新
    for (const key in pageComponentData) {
      const pageComponentKey = <keyof IEditorData>key
      const elementList = zipElementList(pageComponentData[pageComponentKey]!, {
        isClassifyArea: true,
        extraPickAttrs: ['id']
      })
      pageComponentData[pageComponentKey] = elementList
      formatElementList(elementList, {
        editorOptions: this.options,
        isForceCompensation: true
      })
    }
    this.draw.setEditorData(pageComponentData)
    // 不保存历史时需清空之前记录，避免还原
    if (!isExistSubmitHistory) {
      this.draw.getHistoryManager().recovery()
    }
    this.draw.render({
      isSubmitHistory: isExistSubmitHistory,
      isSetCursor: false
    })
  }

  public getList(): IElement[] {
    const controlElementList: IElement[] = []
    function getControlElementList(elementList: IElement[]) {
      for (let e = 0; e < elementList.length; e++) {
        const element = elementList[e]
        if (element.type === ElementType.TABLE) {
          const trList = element.trList!
          for (let r = 0; r < trList.length; r++) {
            const tr = trList[r]
            for (let d = 0; d < tr.tdList.length; d++) {
              const td = tr.tdList[d]
              const tdElement = td.value
              getControlElementList(tdElement)
            }
          }
        }
        if (element.controlId) {
          // 移除控件所在标题及列表上下文信息
          const controlElement = omitObject(element, [
            ...TITLE_CONTEXT_ATTR,
            ...LIST_CONTEXT_ATTR
          ])
          controlElementList.push(controlElement)
        }
      }
    }
    const data = [
      this.draw.getHeader().getElementList(),
      this.draw.getOriginalMainElementList(),
      this.draw.getFooter().getElementList()
    ]
    for (const elementList of data) {
      getControlElementList(elementList)
    }
    return zipElementList(controlElementList, {
      extraPickAttrs: ['controlId']
    })
  }

  public recordBorderInfo(x: number, y: number, width: number, height: number) {
    this.controlBorder.recordBorderInfo(x, y, width, height)
  }

  public drawBorder(ctx: CanvasRenderingContext2D) {
    this.controlBorder.render(ctx)
  }

  public getPreControlContext(): INextControlContext | null {
    if (!this.activeControl) return null
    const position = this.draw.getPosition()
    const positionContext = position.getPositionContext()
    if (!positionContext) return null
    const controlElement = this.activeControl.getElement()
    // 获取上一个控件上下文本信息
    function getPreContext(
      elementList: IElement[],
      start: number
    ): INextControlContext | null {
      for (let e = start; e > 0; e--) {
        const element = elementList[e]
        // 表格元素
        if (element.type === ElementType.TABLE) {
          const trList = element.trList || []
          for (let r = trList.length - 1; r >= 0; r--) {
            const tr = trList[r]
            const tdList = tr.tdList
            for (let d = tdList.length - 1; d >= 0; d--) {
              const td = tdList[d]
              const context = getPreContext(td.value, td.value.length - 1)
              if (context) {
                return {
                  positionContext: {
                    isTable: true,
                    index: e,
                    trIndex: r,
                    tdIndex: d,
                    tdId: td.id,
                    trId: tr.id,
                    tableId: element.id
                  },
                  nextIndex: context.nextIndex
                }
              }
            }
          }
        }
        if (
          !element.controlId ||
          element.controlId === controlElement.controlId
        ) {
          continue
        }
        // 找到尾部第一个非占位符元素
        let nextIndex = e
        while (nextIndex > 0) {
          const nextElement = elementList[nextIndex]
          if (
            nextElement.controlComponent === ControlComponent.VALUE ||
            nextElement.controlComponent === ControlComponent.PREFIX ||
            nextElement.controlComponent === ControlComponent.PRE_TEXT
          ) {
            break
          }
          nextIndex--
        }
        return {
          positionContext: {
            isTable: false
          },
          nextIndex
        }
      }
      return null
    }
    // 当前上下文控件信息
    const { startIndex } = this.range.getRange()
    const elementList = this.getElementList()
    const context = getPreContext(elementList, startIndex)
    if (context) {
      return {
        positionContext: positionContext.isTable
          ? positionContext
          : context.positionContext,
        nextIndex: context.nextIndex
      }
    }
    // 控件在单元内时继续循环
    if (controlElement.tableId) {
      const originalElementList = this.draw.getOriginalElementList()
      const { index, trIndex, tdIndex } = positionContext
      const trList = originalElementList[index!].trList!
      for (let r = trIndex!; r >= 0; r--) {
        const tr = trList[r]
        const tdList = tr.tdList
        for (let d = tdList.length - 1; d >= 0; d--) {
          if (trIndex === r && d >= tdIndex!) continue
          const td = tdList[d]
          const context = getPreContext(td.value, td.value.length - 1)
          if (context) {
            return {
              positionContext: {
                isTable: true,
                index: positionContext.index,
                trIndex: r,
                tdIndex: d,
                tdId: td.id,
                trId: tr.id,
                tableId: controlElement.tableId
              },
              nextIndex: context.nextIndex
            }
          }
        }
      }
      // 跳出表格继续循环
      const context = getPreContext(originalElementList, index! - 1)
      if (context) {
        return {
          positionContext: {
            isTable: false
          },
          nextIndex: context.nextIndex
        }
      }
    }
    return null
  }

  public getNextControlContext(): INextControlContext | null {
    if (!this.activeControl) return null
    const position = this.draw.getPosition()
    const positionContext = position.getPositionContext()
    if (!positionContext) return null
    const controlElement = this.activeControl.getElement()
    // 获取下一个控件上下文本信息
    function getNextContext(
      elementList: IElement[],
      start: number
    ): INextControlContext | null {
      for (let e = start; e < elementList.length; e++) {
        const element = elementList[e]
        // 表格元素
        if (element.type === ElementType.TABLE) {
          const trList = element.trList || []
          for (let r = 0; r < trList.length; r++) {
            const tr = trList[r]
            const tdList = tr.tdList
            for (let d = 0; d < tdList.length; d++) {
              const td = tdList[d]
              const context = getNextContext(td.value!, 0)
              if (context) {
                return {
                  positionContext: {
                    isTable: true,
                    index: e,
                    trIndex: r,
                    tdIndex: d,
                    tdId: td.id,
                    trId: tr.id,
                    tableId: element.id
                  },
                  nextIndex: context.nextIndex
                }
              }
            }
          }
        }
        if (
          !element.controlId ||
          element.controlId === controlElement.controlId ||
          elementList[e + 1]?.controlComponent === ControlComponent.PREFIX ||
          elementList[e + 1]?.controlComponent === ControlComponent.PRE_TEXT
        ) {
          continue
        }
        return {
          positionContext: {
            isTable: false
          },
          nextIndex: e
        }
      }
      return null
    }
    // 当前上下文控件信息
    const { endIndex } = this.range.getRange()
    const elementList = this.getElementList()
    const context = getNextContext(elementList, endIndex)
    if (context) {
      return {
        positionContext: positionContext.isTable
          ? positionContext
          : context.positionContext,
        nextIndex: context.nextIndex
      }
    }
    // 控件在单元内时继续循环
    if (controlElement.tableId) {
      const originalElementList = this.draw.getOriginalElementList()
      const { index, trIndex, tdIndex } = positionContext
      const trList = originalElementList[index!].trList!
      for (let r = trIndex!; r < trList.length; r++) {
        const tr = trList[r]
        const tdList = tr.tdList
        for (let d = 0; d < tdList.length; d++) {
          if (trIndex === r && d <= tdIndex!) continue
          const td = tdList[d]
          const context = getNextContext(td.value, 0)
          if (context) {
            return {
              positionContext: {
                isTable: true,
                index: positionContext.index,
                trIndex: r,
                tdIndex: d,
                tdId: td.id,
                trId: tr.id,
                tableId: controlElement.tableId
              },
              nextIndex: context.nextIndex
            }
          }
        }
      }
      // 跳出表格继续循环
      const context = getNextContext(originalElementList, index! + 1)
      if (context) {
        return {
          positionContext: {
            isTable: false
          },
          nextIndex: context.nextIndex
        }
      }
    }
    return null
  }

  public initNextControl(option: IInitNextControlOption = {}) {
    const { direction = MoveDirection.DOWN } = option
    let context: INextControlContext | null = null
    if (direction === MoveDirection.UP) {
      context = this.getPreControlContext()
    } else {
      context = this.getNextControlContext()
    }
    if (!context) return
    const { nextIndex, positionContext } = context
    const position = this.draw.getPosition()
    // 设置上下文
    position.setPositionContext(positionContext)
    this.draw.getRange().replaceRange({
      startIndex: nextIndex,
      endIndex: nextIndex
    })
    // 重新渲染并定位
    this.draw.render({
      curIndex: nextIndex,
      isCompute: false,
      isSetCursor: true,
      isSubmitHistory: false
    })
    const positionList = position.getPositionList()
    this.draw.getCursor().moveCursorToVisible({
      cursorPosition: positionList[nextIndex],
      direction
    })
  }

  public setMinWidthControlInfo(option: ISetControlRowFlexOption) {
    const { row, rowElement, controlRealWidth, availableWidth } = option
    if (!rowElement.control?.minWidth) return
    const { scale } = this.options
    const controlMinWidth = rowElement.control.minWidth * scale
    // 设置首字符偏移量：如果控件内设置对齐方式&&存在设置最小宽度
    let controlFirstElement: IRowElement | null = null
    if (
      rowElement.control?.minWidth &&
      (rowElement.control?.rowFlex === RowFlex.CENTER ||
        rowElement.control?.rowFlex === RowFlex.RIGHT)
    ) {
      // 计算当前控件内容宽度是否超出最小宽度设置
      let controlContentWidth = rowElement.metrics.width
      let controlElementIndex = row.elementList.length - 1
      while (controlElementIndex >= 0) {
        const controlRowElement = row.elementList[controlElementIndex]
        controlContentWidth += controlRowElement.metrics.width
        // 找到首字符结束循环
        if (
          row.elementList[controlElementIndex - 1]?.controlComponent ===
          ControlComponent.PREFIX
        ) {
          controlFirstElement = controlRowElement
          break
        }
        controlElementIndex--
      }
      // 计算首字符偏移量
      if (controlFirstElement) {
        if (controlContentWidth < controlMinWidth) {
          if (rowElement.control.rowFlex === RowFlex.CENTER) {
            controlFirstElement.left =
              (controlMinWidth - controlContentWidth) / 2
          } else if (rowElement.control.rowFlex === RowFlex.RIGHT) {
            // 最小宽度 - 实际宽度 - 后缀元素宽度
            controlFirstElement.left =
              controlMinWidth - controlContentWidth - rowElement.metrics.width
          }
        }
      }
    }
    // 设置后缀偏移量：消费小于实际最小宽度
    const extraWidth = controlMinWidth - controlRealWidth
    if (extraWidth > 0) {
      const controlFirstElementLeft = controlFirstElement?.left || 0
      // 超出行宽时截断
      const rowRemainingWidth =
        availableWidth - row.width - rowElement.metrics.width
      const left = Math.min(rowRemainingWidth, extraWidth)
      // 后缀偏移量需减去首字符的偏移量，避免重复偏移
      rowElement.left = left - controlFirstElementLeft
      row.width += left - controlFirstElementLeft
    }
  }
}
