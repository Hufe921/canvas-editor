import { ZERO } from '../../../dataset/constant/Common'
import { EDITOR_ELEMENT_COPY_ATTR } from '../../../dataset/constant/Element'
import { ElementType } from '../../../dataset/enum/Element'
import { IElement } from '../../../interface/Element'
import { splitText } from '../../../utils'
import { CanvasEvent } from '../CanvasEvent'

export function input(data: string, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  const position = draw.getPosition()
  const cursorPosition = position.getCursorPosition()
  if (!data || !cursorPosition || host.isCompositing) return
  const control = draw.getControl()
  if (control.isPartRangeInControlOutside()) {
    // 忽略选区部分在控件的输入
    return
  }
  const activeControl = control.getActiveControl()
  const { TEXT, HYPERLINK, SUBSCRIPT, SUPERSCRIPT, DATE } = ElementType
  const text = data.replaceAll(`\n`, ZERO)
  const cursor = draw.getCursor()
  const agentDom = cursor.getAgentDom()
  agentDom.value = ''
  const { index } = cursorPosition
  const rangeManager = draw.getRange()
  const { startIndex, endIndex } = rangeManager.getRange()
  const isCollapsed = startIndex === endIndex
  // 表格需要上下文信息
  const positionContext = position.getPositionContext()
  let restArg = {}
  if (positionContext.isTable) {
    const { tdId, trId, tableId } = positionContext
    restArg = { tdId, trId, tableId }
  }
  const elementList = draw.getElementList()
  const element = elementList[endIndex]
  const inputData: IElement[] = splitText(text).map(value => {
    const newElement: IElement = {
      value,
      ...restArg
    }
    const nextElement = elementList[endIndex + 1]
    if (
      element.type === TEXT
      || (!element.type && element.value !== ZERO)
      || (element.type === HYPERLINK && nextElement?.type === HYPERLINK)
      || (element.type === DATE && nextElement?.type === DATE)
      || (element.type === SUBSCRIPT && nextElement?.type === SUBSCRIPT)
      || (element.type === SUPERSCRIPT && nextElement?.type === SUPERSCRIPT)
    ) {
      EDITOR_ELEMENT_COPY_ATTR.forEach(attr => {
        const value = element[attr] as never
        if (value !== undefined) {
          newElement[attr] = value
        }
      })
    }
    return newElement
  })
  // 控件-移除placeholder
  let curIndex: number
  if (activeControl && elementList[endIndex + 1]?.controlId === element.controlId) {
    curIndex = control.setValue(inputData)
  } else {
    let start = 0
    if (isCollapsed) {
      start = index + 1
    } else {
      start = startIndex + 1
      elementList.splice(startIndex + 1, endIndex - startIndex)
    }
    // 禁止直接使用解构存在性能问题
    for (let i = 0; i < inputData.length; i++) {
      elementList.splice(start + i, 0, inputData[i])
    }
    curIndex = (isCollapsed ? index : startIndex) + inputData.length
  }
  rangeManager.setRange(curIndex, curIndex)
  draw.render({ curIndex })
}