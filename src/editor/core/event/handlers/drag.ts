import { ImageDisplay } from '../../../dataset/enum/Common'
import { ElementType } from '../../../dataset/enum/Element'
import { findParent } from '../../../utils'
import { CanvasEvent } from '../CanvasEvent'

function dragover(evt: DragEvent | MouseEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  evt.preventDefault()
  // 非编辑器区禁止拖放
  const pageContainer = draw.getPageContainer()
  const editorRegion = findParent(
    evt.target as Element,
    (node: Element) => node === pageContainer,
    true
  )
  if (!editorRegion) return
  const target = evt.target as HTMLDivElement
  const pageIndex = target.dataset.index
  // 设置pageNo
  if (pageIndex) {
    draw.setPageNo(Number(pageIndex))
  }
  const position = draw.getPosition()
  const positionContext = position.adjustPositionContext({
    x: evt.offsetX,
    y: evt.offsetY
  })
  if (!positionContext) return
  const { isTable, tdValueIndex, index } = positionContext
  // 设置选区及光标位置
  const positionList = position.getPositionList()
  const curIndex = isTable ? tdValueIndex! : index
  if (~index) {
    const rangeManager = draw.getRange()
    rangeManager.setRange(curIndex, curIndex)
    position.setCursorPosition(positionList[curIndex])
  }
  const cursor = draw.getCursor()
  const {
    cursor: { dragColor, dragWidth, dragFloatImageDisabled }
  } = draw.getOptions()
  // 拖拽图片是否定位光标
  if (dragFloatImageDisabled) {
    const dragElement = host.cacheElementList?.[host.cacheRange!.startIndex]
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
