import { ZERO } from '../../../dataset/constant/Common'
import { NUMBER_LIKE_REG } from '../../../dataset/constant/Regular'
import { CanvasEvent } from '../CanvasEvent'

function dblclick(host: CanvasEvent, evt: MouseEvent) {
  const draw = host.getDraw()
  const LETTER_REG = draw.getLetterReg()
  const position = draw.getPosition()
  const positionContext = position.getPositionByXY({
    x: evt.offsetX,
    y: evt.offsetY
  })
  // 图片预览
  if (positionContext.isImage && positionContext.isDirectHit) {
    draw.getPreviewer().render()
    return
  }
  // 切换区域
  if (draw.getIsPagingMode()) {
    if (!~positionContext.index && positionContext.zone) {
      draw.getZone().setZone(positionContext.zone)
      draw.clearSideEffect()
      position.setPositionContext({
        isTable: false
      })
      return
    }
  }
  // 复选框双击时是切换选择状态，禁用扩选
  if (positionContext.isCheckbox && positionContext.isDirectHit) return
  // 自动扩选文字
  const cursorPosition = position.getCursorPosition()
  if (!cursorPosition) return
  const { value, index } = cursorPosition
  // 判断是否是数字或英文
  let upCount = 0
  let downCount = 0
  const isNumber = NUMBER_LIKE_REG.test(value)
  if (isNumber || LETTER_REG.test(value)) {
    const elementList = draw.getElementList()
    // 向上查询
    let upStartIndex = index - 1
    while (upStartIndex > 0) {
      const value = elementList[upStartIndex].value
      if (
        (isNumber && NUMBER_LIKE_REG.test(value)) ||
        (!isNumber && LETTER_REG.test(value))
      ) {
        upCount++
        upStartIndex--
      } else {
        break
      }
    }
    // 向下查询
    let downStartIndex = index + 1
    while (downStartIndex < elementList.length) {
      const value = elementList[downStartIndex].value
      if (
        (isNumber && NUMBER_LIKE_REG.test(value)) ||
        (!isNumber && LETTER_REG.test(value))
      ) {
        downCount++
        downStartIndex++
      } else {
        break
      }
    }
  }
  // 设置选中区域
  const startIndex = index - upCount - 1
  if (startIndex < 0) return
  const rangeManager = draw.getRange()
  rangeManager.setRange(startIndex, index + downCount)
  // 刷新文档
  draw.render({
    isSubmitHistory: false,
    isSetCursor: false,
    isCompute: false
  })
  // 更新选区
  rangeManager.setRangeStyle()
}

function threeClick(host: CanvasEvent) {
  const draw = host.getDraw()
  const position = draw.getPosition()
  const cursorPosition = position.getCursorPosition()
  if (!cursorPosition) return
  const { index } = cursorPosition
  const elementList = draw.getElementList()
  // 判断是否是零宽字符
  let upCount = 0
  let downCount = 0
  // 向上查询
  let upStartIndex = index - 1
  while (upStartIndex > 0) {
    const element = elementList[upStartIndex]
    const preElement = elementList[upStartIndex - 1]
    if (
      (element.value === ZERO && !element.listWrap) ||
      element.listId !== preElement?.listId ||
      element.titleId !== preElement?.titleId
    ) {
      break
    }
    upCount++
    upStartIndex--
  }
  // 向下查询
  let downStartIndex = index + 1
  while (downStartIndex < elementList.length) {
    const element = elementList[downStartIndex]
    const nextElement = elementList[downStartIndex + 1]
    if (
      (element.value === ZERO && !element.listWrap) ||
      element.listId !== nextElement?.listId ||
      element.titleId !== nextElement?.titleId
    ) {
      break
    }
    downCount++
    downStartIndex++
  }
  // 设置选中区域-不选择段落首尾换行符
  const rangeManager = draw.getRange()
  let newStartIndex = index - upCount - 1
  if (elementList[newStartIndex]?.value !== ZERO) {
    newStartIndex -= 1
  }
  if (newStartIndex < 0) return
  let newEndIndex = index + downCount + 1
  if (elementList[newEndIndex]?.value === ZERO) {
    newEndIndex -= 1
  }
  rangeManager.setRange(newStartIndex, newEndIndex)
  // 刷新文档
  draw.render({
    isSubmitHistory: false,
    isSetCursor: false,
    isCompute: false
  })
}

export default {
  dblclick,
  threeClick
}
