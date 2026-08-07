import { ImageDisplay } from '../../../dataset/enum/Common'
import { ControlComponent, ControlType } from '../../../dataset/enum/Control'
import { ElementType } from '../../../dataset/enum/Element'
import { IElement } from '../../../interface/Element'
import type { ICurrentPosition } from '../../../interface/Position'
import { Draw } from '../../draw/Draw'
import { CanvasEvent } from '../CanvasEvent'

function hitElement(
  draw: Draw,
  r: ICurrentPosition
): IElement | undefined {
  if (r.isTable) {
    return draw
      .getOriginalElementList()[r.index]?.trList?.[r.trIndex!]?.tdList?.[
      r.tdIndex!
    ]?.value?.[r.tdValueIndex!]
  }
  return draw.getOriginalElementList()[r.index]
}

function updateHoverCursor(evt: MouseEvent, draw: Draw) {
  const target = evt.target as HTMLDivElement
  const pageIndex = target?.dataset?.index
  const pageNo = pageIndex !== undefined ? Number(pageIndex) : draw.getPageNo()
  const positionResult = draw.getPosition().getPositionByXY({
    x: evt.offsetX,
    y: evt.offsetY,
    pageNo
  })
  // checkbox/radio 控件内任意元素（盒或 label 文本）都显示 pointer
  const el = positionResult ? hitElement(draw, positionResult) : undefined
  const isWidgetHit =
    !!positionResult &&
    !!positionResult.isDirectHit &&
    (!!positionResult.isCheckbox ||
      !!positionResult.isRadio ||
      el?.control?.type === ControlType.CHECKBOX ||
      el?.control?.type === ControlType.RADIO)
  const page = draw.getPage(pageNo)
  if (page) {
    page.style.cursor = isWidgetHit ? 'pointer' : 'text'
  }
}

export function mousemove(evt: MouseEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  // 留痕模式：hover 到带 trace 标记的元素时显示作者/时间浮窗
  draw.getTraceParticle().handleMouseMove(evt)
  // hover 到复选框/单选框时显示 pointer（拖拽时保持默认光标）
  if (!host.isAllowDrag) {
    updateHoverCursor(evt, draw)
  }
  // 是否是拖拽文字
  if (host.isAllowDrag) {
    // 是否允许拖拽到选区
    const x = evt.offsetX
    const y = evt.offsetY
    const { startIndex, endIndex } = host.cacheRange!
    const positionList = host.cachePositionList!
    for (let p = startIndex + 1; p <= endIndex; p++) {
      const {
        coordinate: { leftTop, rightBottom }
      } = positionList[p]
      if (
        x >= leftTop[0] &&
        x <= rightBottom[0] &&
        y >= leftTop[1] &&
        y <= rightBottom[1]
      ) {
        return
      }
    }
    const cacheStartIndex = host.cacheRange?.startIndex
    if (cacheStartIndex) {
      // 浮动元素拖拽调整位置
      const dragElement = host.cacheElementList![cacheStartIndex]
      if (
        dragElement?.type === ElementType.IMAGE &&
        (dragElement.imgDisplay === ImageDisplay.SURROUND ||
          dragElement.imgDisplay === ImageDisplay.FLOAT_TOP ||
          dragElement.imgDisplay === ImageDisplay.FLOAT_BOTTOM)
      ) {
        draw.getPreviewer().clearResizer()
        draw.getImageParticle().dragFloatImage(evt.movementX, evt.movementY)
      }
    }
    host.dragover(evt)
    host.isAllowDrop = true
    return
  }
  if (!host.isAllowSelection || !host.mouseDownStartPosition) return
  const target = evt.target as HTMLDivElement
  const pageIndex = target.dataset.index
  // 设置pageNo
  if (pageIndex) {
    draw.setPageNo(Number(pageIndex))
  }
  // 结束位置
  const position = draw.getPosition()
  const positionResult = position.getPositionByXY({
    x: evt.offsetX,
    y: evt.offsetY
  })
  if (!~positionResult.index) return
  const {
    index,
    isTable,
    tdValueIndex,
    tdIndex,
    trIndex,
    tableId,
    trId,
    tdId,
    tablePath
  } = positionResult
  const {
    index: startIndex,
    isTable: startIsTable,
    tdIndex: startTdIndex,
    trIndex: startTrIndex,
    tableId: startTableId
  } = host.mouseDownStartPosition
  const endIndex = isTable ? tdValueIndex! : index
  // 判断是否是表格跨行/列
  const rangeManager = draw.getRange()
  if (
    isTable &&
    startIsTable &&
    startTableId === tableId &&
    (tdIndex !== startTdIndex || trIndex !== startTrIndex)
  ) {
    rangeManager.setRange(
      endIndex,
      endIndex,
      tableId,
      startTdIndex,
      tdIndex,
      startTrIndex,
      trIndex
    )
    position.setPositionContext({
      isTable,
      index,
      trIndex,
      tdIndex,
      tdId,
      trId,
      tableId,
      tablePath
    })
  } else {
    let end = ~endIndex ? endIndex : 0
    // 开始或结束位置存在表格，但是非相同表格则忽略选区设置
    if ((startIsTable || isTable) && startTableId !== tableId) return
    // 开始位置
    let start = startIndex
    if (start > end) {
      ;[start, end] = [end, start]
    }
    if (start === end) return
    // 背景文本禁止选区
    const elementList = draw.getElementList()
    const startElement = elementList[start + 1]
    const endElement = elementList[end]
    if (
      startElement?.controlComponent === ControlComponent.PLACEHOLDER &&
      endElement?.controlComponent === ControlComponent.PLACEHOLDER &&
      startElement.controlId === endElement.controlId
    ) {
      return
    }
    rangeManager.setRange(start, end)
  }
  // 绘制
  draw.render({
    isSubmitHistory: false,
    isSetCursor: false,
    isCompute: false
  })
}
