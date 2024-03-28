import { ZERO } from '../../../dataset/constant/Common'
import { EDITOR_ELEMENT_COPY_ATTR } from '../../../dataset/constant/Element'
import { ElementType } from '../../../dataset/enum/Element'
import { IElement } from '../../../interface/Element'
import { splitText } from '../../../utils'
import { formatElementContext, getAnchorElement } from '../../../utils/element'
import { CanvasEvent } from '../CanvasEvent'

export function input(data: string, host: CanvasEvent) {
  const draw = host.getDraw()
  if (draw.isReadonly()) return
  const position = draw.getPosition()
  const cursorPosition = position.getCursorPosition()
  if (!data || !cursorPosition) return
  const isComposing = host.isComposing
  // 正在合成文本进行非输入操作
  if (isComposing && host.compositionInfo?.value === data) return
  const rangeManager = draw.getRange()
  if (!rangeManager.getIsCanInput()) return
  // 移除合成输入
  removeComposingInput(host)
  if (!isComposing) {
    const cursor = draw.getCursor()
    cursor.clearAgentDomValue()
  }
  const { TEXT, HYPERLINK, SUBSCRIPT, SUPERSCRIPT, DATE } = ElementType
  const text = data.replaceAll(`\n`, ZERO)
  const { startIndex, endIndex } = rangeManager.getRange()
  // 格式化元素
  const elementList = draw.getElementList()
  const copyElement = getAnchorElement(elementList, endIndex)
  if (!copyElement) return
  const inputData: IElement[] = splitText(text).map(value => {
    const newElement: IElement = {
      value
    }
    const nextElement = elementList[endIndex + 1]
    if (
      !copyElement.type ||
      copyElement.type === TEXT ||
      (copyElement.type === HYPERLINK && nextElement?.type === HYPERLINK) ||
      (copyElement.type === DATE && nextElement?.type === DATE) ||
      (copyElement.type === SUBSCRIPT && nextElement?.type === SUBSCRIPT) ||
      (copyElement.type === SUPERSCRIPT && nextElement?.type === SUPERSCRIPT)
    ) {
      EDITOR_ELEMENT_COPY_ATTR.forEach(attr => {
        // 在分组外无需复制分组信息
        if (attr === 'groupIds' && !nextElement?.groupIds) return
        const value = copyElement[attr] as never
        if (value !== undefined) {
          newElement[attr] = value
        }
      })
    }
    if (isComposing) {
      newElement.underline = true
    }
    return newElement
  })
  // 控件-移除placeholder
  const control = draw.getControl()
  let curIndex: number
  if (control.getActiveControl() && control.getIsRangeWithinControl()) {
    curIndex = control.setValue(inputData)
  } else {
    const start = startIndex + 1
    if (startIndex !== endIndex) {
      draw.spliceElementList(elementList, start, endIndex - startIndex)
    }
    formatElementContext(elementList, inputData, startIndex)
    draw.spliceElementList(elementList, start, 0, ...inputData)
    curIndex = startIndex + inputData.length
  }
  if (~curIndex) {
    rangeManager.setRange(curIndex, curIndex)
    draw.render({
      curIndex,
      isSubmitHistory: !isComposing
    })
  }
  if (isComposing) {
    host.compositionInfo = {
      elementList,
      value: text,
      startIndex: curIndex - inputData.length,
      endIndex: curIndex
    }
  }
}

export function removeComposingInput(host: CanvasEvent) {
  if (!host.compositionInfo) return
  const { elementList, startIndex, endIndex } = host.compositionInfo
  elementList.splice(startIndex + 1, endIndex - startIndex)
  const rangeManager = host.getDraw().getRange()
  rangeManager.setRange(startIndex, startIndex)
  host.compositionInfo = null
}
