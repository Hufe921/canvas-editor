import { ImageDisplay } from '../../../dataset/enum/Common'
import { ElementType } from '../../../dataset/enum/Element'
import { CanvasEvent } from '../CanvasEvent'
import { getPagePointer } from '../pagePointer'

function dragover(evt: DragEvent | MouseEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  evt.preventDefault()
  // 非编辑器区禁止拖放
  const pointer = getPagePointer(evt, draw.getPageContainer())
  if (!pointer) return
  draw.setPageNo(pointer.pageNo)
  const position = draw.getPosition()
  const positionList = position.getPositionList()
  const rangeManager = draw.getRange()
  if (host.paragraphDrag) {
    const dropIndex = draw
      .getParagraphDragParticle()
      .getDropIndex(pointer.y, pointer.pageNo)
    if (dropIndex === null) return
    const curIndex = Math.min(dropIndex, positionList.length - 1)
    position.setPositionContext({
      isTable: false,
      index: curIndex
    })
    rangeManager.setRange(curIndex, curIndex)
    position.setCursorPosition(positionList[curIndex])
  } else {
    const positionContext = position.adjustPositionContext({
      x: pointer.x,
      y: pointer.y
    })
    if (!positionContext) return
    const cacheContext = host.cachePositionContext
    if (
      !!cacheContext?.isFootnote !== !!positionContext.isFootnote ||
      (positionContext.isFootnote &&
        cacheContext?.footnoteId !== positionContext.footnoteId)
    ) {
      return
    }
    const { isTable, isFootnote, footnoteValueIndex, tdValueIndex, index } =
      positionContext
    const curIndex = isFootnote
      ? footnoteValueIndex!
      : isTable
        ? tdValueIndex!
        : index
    if (~index) {
      const currentPositionList = position.getPositionList()
      rangeManager.setRange(curIndex, curIndex)
      position.setCursorPosition(currentPositionList[curIndex])
    }
  }
  const cursor = draw.getCursor()
  const {
    cursor: { dragColor, dragWidth, dragFloatImageDisabled }
  } = draw.getOptions()
  // 拖拽图片是否定位光标
  if (dragFloatImageDisabled) {
    const dragElement =
      host.cacheRange && host.cacheElementList?.[host.cacheRange.startIndex]
    if (
      dragElement?.type === ElementType.IMAGE &&
      (dragElement.imgDisplay === ImageDisplay.FLOAT_TOP ||
        dragElement.imgDisplay === ImageDisplay.FLOAT_BOTTOM ||
        dragElement.imgDisplay === ImageDisplay.SURROUND)
    ) {
      return
    }
  }
  cursor.drawCursor({
    width: dragWidth,
    color: dragColor,
    isBlink: false,
    isFocus: false
  })
}

export default {
  dragover
}
