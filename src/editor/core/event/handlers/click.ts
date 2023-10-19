import { ZERO } from '../../../dataset/constant/Common'
import { NUMBER_LIKE_REG } from '../../../dataset/constant/Regular'
import { CanvasEvent } from '../CanvasEvent'

function dblclick(host: CanvasEvent, evt: MouseEvent) {
  const draw = host.getDraw()
  const LETTER_REG = draw.getLetterReg()
  const position = draw.getPosition()
  // 切换区域
  if (draw.getIsPagingMode()) {
    const positionContext = position.getPositionByXY({
      x: evt.offsetX,
      y: evt.offsetY
    })
    if (!~positionContext.index && positionContext.zone) {
      draw.getZone().setZone(positionContext.zone)
      return
    }
  }
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
  const rangeManager = draw.getRange()
  rangeManager.setRange(index - upCount - 1, index + downCount)
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
    const value = elementList[upStartIndex].value
    if (value !== ZERO) {
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
    if (value !== ZERO) {
      downCount++
      downStartIndex++
    } else {
      break
    }
  }
  // 设置选中区域
  const rangeManager = draw.getRange()
  rangeManager.setRange(index - upCount - 1, index + downCount)
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
