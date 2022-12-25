import { EDITOR_ELEMENT_STYLE_ATTR } from '../../../dataset/constant/Element'
import { IElement } from '../../../interface/Element'
import { CanvasEvent } from '../CanvasEvent'

export function mouseup(evt: MouseEvent, host: CanvasEvent) {
  // 判断是否允许拖放
  if (host.isAllowDrop) {
    const draw = host.getDraw()
    const position = draw.getPosition()
    const rangeManager = draw.getRange()
    const cacheRange = host.cacheRange!
    const cacheElementList = host.cacheElementList!
    const cachePositionList = host.cachePositionList!
    // 如果同一上下文拖拽位置向后移动，则重置光标位置
    const range = rangeManager.getRange()
    const elementList = draw.getElementList()
    const positionList = position.getPositionList()
    const startPosition = positionList[range.startIndex]
    const cacheStartElement = cacheElementList[cacheRange.startIndex]
    const startElement = elementList[range.startIndex]
    let curIndex = range.startIndex
    if (cacheStartElement.tdId === startElement.tdId && range.startIndex > cacheRange.endIndex) {
      curIndex -= (cacheRange.endIndex - cacheRange.startIndex)
    }
    // 删除原有拖拽元素
    const deleteElementList = cacheElementList.splice(cacheRange.startIndex + 1, cacheRange.endIndex - cacheRange.startIndex)
    // 格式化元素
    let restArg = {}
    if (startElement.tableId) {
      const { tdId, trId, tableId } = startElement
      restArg = { tdId, trId, tableId }
    }
    const replaceElementList = deleteElementList.map(el => {
      const newElement: IElement = {
        value: el.value,
        ...restArg
      }
      EDITOR_ELEMENT_STYLE_ATTR.forEach(attr => {
        const value = el[attr] as never
        if (value !== undefined) {
          newElement[attr] = value
        }
      })
      return newElement
    })
    elementList.splice(curIndex + 1, 0, ...replaceElementList)
    // 重设上下文
    const cacheStartPosition = cachePositionList[cacheRange.startIndex]
    const positionContext = position.getPositionContext()
    let positionContextIndex = positionContext.index
    if (positionContextIndex) {
      if (startElement.tableId && !cacheStartElement.tableId) {
        // 表格外移动到表格内&&表格之前
        if (cacheStartPosition.index < positionContextIndex) {
          positionContextIndex -= deleteElementList.length
        }
      } else if (!startElement.tableId && cacheStartElement.tableId) {
        // 表格内移到表格外&&表格之前
        if (startPosition.index < positionContextIndex) {
          positionContextIndex += deleteElementList.length
        }
      }
      position.setPositionContext({
        ...positionContext,
        index: positionContextIndex
      })
    }
    // 设置选区
    rangeManager.setRange(
      curIndex,
      curIndex + deleteElementList.length,
      range.tableId,
      range.startTdIndex,
      range.endTdIndex,
      range.startTrIndex,
      range.endTrIndex
    )
    // 重新渲染&重设状态
    draw.render({
      isSetCursor: false
    })
    host.isAllowDrag = false
    host.isAllowDrop = false
  } else if (host.isAllowDrag) {
    // 如果是允许拖拽不允许拖放则光标重置
    host.mousedown(evt)
    host.isAllowDrag = false
  }
}