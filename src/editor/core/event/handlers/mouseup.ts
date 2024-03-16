import {
  CONTROL_CONTEXT_ATTR,
  EDITOR_ELEMENT_STYLE_ATTR
} from '../../../dataset/constant/Element'
import { ImageDisplay } from '../../../dataset/enum/Common'
import { ControlComponent, ControlType } from '../../../dataset/enum/Control'
import { ElementType } from '../../../dataset/enum/Element'
import { IElement } from '../../../interface/Element'
import { deepClone, getUUID, omitObject } from '../../../utils'
import { formatElementContext, formatElementList } from '../../../utils/element'
import { CanvasEvent } from '../CanvasEvent'

type IDragElement = IElement & { dragId: string }

function createDragId(element: IElement): string {
  const dragId = getUUID()
  Reflect.set(element, 'dragId', dragId)
  return dragId
}

function getElementIndexByDragId(dragId: string, elementList: IElement[]) {
  return (<IDragElement[]>elementList).findIndex(el => el.dragId === dragId)
}

// 移动悬浮图片位置
function moveImgPosition(
  element: IElement,
  evt: MouseEvent,
  host: CanvasEvent
) {
  const draw = host.getDraw()
  if (
    element.imgDisplay === ImageDisplay.FLOAT_TOP ||
    element.imgDisplay === ImageDisplay.FLOAT_BOTTOM
  ) {
    const moveX = evt.offsetX - host.mouseDownStartPosition!.x!
    const moveY = evt.offsetY - host.mouseDownStartPosition!.y!
    const imgFloatPosition = element.imgFloatPosition!
    element.imgFloatPosition = {
      x: imgFloatPosition.x + moveX,
      y: imgFloatPosition.y + moveY
    }
  }
  draw.getImageParticle().destroyFloatImage()
}

export function mouseup(evt: MouseEvent, host: CanvasEvent) {
  // 判断是否允许拖放
  if (host.isAllowDrop) {
    const draw = host.getDraw()
    if (draw.isReadonly()) return
    const position = draw.getPosition()
    const positionList = position.getPositionList()
    const positionContext = position.getPositionContext()
    const rangeManager = draw.getRange()
    const cacheRange = host.cacheRange!
    const cacheElementList = host.cacheElementList!
    const cachePositionList = host.cachePositionList!
    const range = rangeManager.getRange()
    // 缓存选区的信息
    const isCacheRangeCollapsed = cacheRange.startIndex === cacheRange.endIndex
    // 选区闭合时，起始位置向前移动一位进行扩选
    const cacheStartIndex = isCacheRangeCollapsed
      ? cacheRange.startIndex - 1
      : cacheRange.startIndex
    const cacheEndIndex = cacheRange.endIndex
    // 是否需要拖拽-位置发生改变
    if (
      range.startIndex >= cacheStartIndex &&
      range.endIndex <= cacheEndIndex &&
      host.cachePositionContext?.tdId === positionContext.tdId
    ) {
      // 清除渲染副作用
      draw.clearSideEffect()
      // 浮动元素拖拽需要提交历史
      let isSubmitHistory = false
      if (isCacheRangeCollapsed) {
        // 图片移动
        const dragElement = cacheElementList[cacheEndIndex]
        if (
          dragElement.type === ElementType.IMAGE ||
          dragElement.type === ElementType.LATEX
        ) {
          moveImgPosition(dragElement, evt, host)
          if (
            dragElement.imgDisplay === ImageDisplay.FLOAT_TOP ||
            dragElement.imgDisplay === ImageDisplay.FLOAT_BOTTOM
          ) {
            draw.getPreviewer().drawResizer(dragElement)
            isSubmitHistory = true
          } else {
            const cachePosition = cachePositionList[cacheEndIndex]
            draw.getPreviewer().drawResizer(dragElement, cachePosition)
          }
        }
      }
      rangeManager.replaceRange({
        ...cacheRange
      })
      draw.render({
        isSetCursor: false,
        isCompute: false,
        isSubmitHistory
      })
      return
    }
    // 是否是不可拖拽的控件结构元素
    const dragElementList = cacheElementList.slice(
      cacheStartIndex + 1,
      cacheEndIndex + 1
    )
    const isContainControl = dragElementList.find(element => element.controlId)
    if (isContainControl) {
      // 仅允许 (最前/后元素不是控件 || 在控件前后 || 文本控件且是值) 拖拽
      const cacheStartElement = cacheElementList[cacheStartIndex + 1]
      const cacheEndElement = cacheElementList[cacheEndIndex]
      const isAllowDragControl =
        ((!cacheStartElement.controlId ||
          cacheStartElement.controlComponent === ControlComponent.PREFIX) &&
          (!cacheEndElement.controlId ||
            cacheEndElement.controlComponent === ControlComponent.POSTFIX)) ||
        (cacheStartElement.controlId === cacheEndElement.controlId &&
          cacheStartElement.controlComponent === ControlComponent.PREFIX &&
          cacheEndElement.controlComponent === ControlComponent.POSTFIX) ||
        (cacheStartElement.control?.type === ControlType.TEXT &&
          cacheStartElement.controlComponent === ControlComponent.VALUE &&
          cacheEndElement.control?.type === ControlType.TEXT &&
          cacheEndElement.controlComponent === ControlComponent.VALUE)
      if (!isAllowDragControl) {
        draw.render({
          curIndex: range.startIndex,
          isCompute: false,
          isSubmitHistory: false
        })
        return
      }
    }
    // 格式化元素
    const editorOptions = draw.getOptions()
    const elementList = draw.getElementList()
    const replaceElementList = dragElementList.map(el => {
      if (!el.type || el.type === ElementType.TEXT) {
        const newElement: IElement = {
          value: el.value
        }
        EDITOR_ELEMENT_STYLE_ATTR.forEach(attr => {
          const value = el[attr] as never
          if (value !== undefined) {
            newElement[attr] = value
          }
        })
        return newElement
      } else {
        // 移除控件上下文属性
        const newElement = omitObject(deepClone(el), CONTROL_CONTEXT_ATTR)
        formatElementList([newElement], {
          isHandleFirstElement: false,
          editorOptions
        })
        return newElement
      }
    })
    formatElementContext(elementList, replaceElementList, range.startIndex)
    // 缓存拖拽选区开始元素、位置、开始结束id
    const cacheStartElement = cacheElementList[cacheStartIndex]
    const cacheStartPosition = cachePositionList[cacheStartIndex]
    const cacheRangeStartId = createDragId(cacheElementList[cacheStartIndex])
    const cacheRangeEndId = createDragId(cacheElementList[cacheEndIndex])
    // 设置拖拽值
    const replaceLength = replaceElementList.length
    let rangeStart = range.startIndex
    let rangeEnd = rangeStart + replaceLength
    const control = draw.getControl()
    const activeControl = control.getActiveControl()
    if (
      activeControl &&
      cacheElementList[rangeStart].controlComponent !== ControlComponent.POSTFIX
    ) {
      rangeEnd = activeControl.setValue(replaceElementList)
      rangeStart = rangeEnd - replaceLength
    } else {
      draw.spliceElementList(
        elementList,
        rangeStart + 1,
        0,
        ...replaceElementList
      )
    }
    if (!~rangeEnd) {
      draw.render({
        isSetCursor: false
      })
      return
    }
    // 缓存当前开始结束id
    const rangeStartId = createDragId(elementList[rangeStart])
    const rangeEndId = createDragId(elementList[rangeEnd])
    // 删除原有拖拽元素
    const cacheRangeStartIndex = getElementIndexByDragId(
      cacheRangeStartId,
      cacheElementList
    )
    const cacheRangeEndIndex = getElementIndexByDragId(
      cacheRangeEndId,
      cacheElementList
    )
    const cacheEndElement = cacheElementList[cacheRangeEndIndex]
    if (
      cacheEndElement.controlId &&
      cacheEndElement.controlComponent !== ControlComponent.POSTFIX
    ) {
      rangeManager.replaceRange({
        ...cacheRange,
        startIndex: cacheRangeStartIndex,
        endIndex: cacheRangeEndIndex
      })
      control.getActiveControl()?.cut()
    } else {
      draw.spliceElementList(
        cacheElementList,
        cacheRangeStartIndex + 1,
        cacheRangeEndIndex - cacheRangeStartIndex
      )
    }
    // 重设上下文
    const startElement = elementList[range.startIndex]
    const startPosition = positionList[range.startIndex]
    let positionContextIndex = positionContext.index
    if (positionContextIndex) {
      if (startElement.tableId && !cacheStartElement.tableId) {
        // 表格外移动到表格内&&表格之前
        if (cacheStartPosition.index < positionContextIndex) {
          positionContextIndex -= replaceLength
        }
      } else if (!startElement.tableId && cacheStartElement.tableId) {
        // 表格内移到表格外&&表格之前
        if (startPosition.index < positionContextIndex) {
          positionContextIndex += replaceLength
        }
      }
      position.setPositionContext({
        ...positionContext,
        index: positionContextIndex
      })
    }
    // 重设选区
    const rangeStartIndex = getElementIndexByDragId(rangeStartId, elementList)
    const rangeEndIndex = getElementIndexByDragId(rangeEndId, elementList)
    rangeManager.setRange(
      isCacheRangeCollapsed ? rangeEndIndex : rangeStartIndex,
      rangeEndIndex,
      range.tableId,
      range.startTdIndex,
      range.endTdIndex,
      range.startTrIndex,
      range.endTrIndex
    )
    // 清除渲染副作用
    draw.clearSideEffect()
    // 移动图片
    let imgElement: IElement | null = null
    if (isCacheRangeCollapsed) {
      const elementList = draw.getElementList()
      const dragElement = elementList[rangeEndIndex]
      if (
        dragElement.type === ElementType.IMAGE ||
        dragElement.type === ElementType.LATEX
      ) {
        moveImgPosition(dragElement, evt, host)
        imgElement = dragElement
      }
    }
    // 重新渲染
    draw.render({
      isSetCursor: false
    })
    // 拖拽后渲染图片工具
    if (imgElement) {
      if (
        imgElement.imgDisplay === ImageDisplay.FLOAT_TOP ||
        imgElement.imgDisplay === ImageDisplay.FLOAT_BOTTOM
      ) {
        draw.getPreviewer().drawResizer(imgElement)
      } else {
        const dragPositionList = position.getPositionList()
        const dragPosition = dragPositionList[rangeEndIndex]
        draw.getPreviewer().drawResizer(imgElement, dragPosition)
      }
    }
  } else if (host.isAllowDrag) {
    // 如果是允许拖拽不允许拖放则光标重置
    host.mousedown(evt)
  }
}
