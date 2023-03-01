import { CanvasEvent } from '../CanvasEvent'

export function mousemove(evt: MouseEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  // 是否是拖拽文字
  if (host.isAllowDrag) {
    // 是否允许拖拽到选区
    const x = evt.offsetX
    const y = evt.offsetY
    const { startIndex, endIndex } = host.cacheRange!
    const positionList = host.cachePositionList!
    for (let p = startIndex + 1; p <= endIndex; p++) {
      const { coordinate: { leftTop, rightBottom } } = positionList[p]
      if (x >= leftTop[0] && x <= rightBottom[0] && y >= leftTop[1] && y <= rightBottom[1]) {
        return
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
  const {
    index,
    isTable,
    tdValueIndex,
    tdIndex,
    trIndex,
    tableId
  } = positionResult
  const {
    index: startIndex,
    isTable: startIsTable,
    tdIndex: startTdIndex,
    trIndex: startTrIndex
  } = host.mouseDownStartPosition
  const endIndex = isTable ? tdValueIndex! : index
  // 判断是否是表格跨行/列
  const rangeManager = draw.getRange()
  if (isTable && startIsTable && (tdIndex !== startTdIndex || trIndex !== startTrIndex)) {
    rangeManager.setRange(
      endIndex,
      endIndex,
      tableId,
      startTdIndex,
      tdIndex,
      startTrIndex,
      trIndex
    )
  } else {
    let end = ~endIndex ? endIndex : 0
    // 开始位置
    let start = startIndex
    if (start > end) {
      [start, end] = [end, start]
    }
    if (start === end) return
    rangeManager.setRange(start, end)
  }
  // 绘制
  draw.render({
    isSubmitHistory: false,
    isSetCursor: false,
    isCompute: false
  })
}