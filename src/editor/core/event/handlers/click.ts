import { ZERO } from '../../../dataset/constant/Common'
import { TEXTLIKE_ELEMENT_TYPE } from '../../../dataset/constant/Element'
import { NUMBER_LIKE_REG } from '../../../dataset/constant/Regular'
import { ElementType } from '../../../dataset/enum/Element'
import { IRange } from '../../../interface/Range'
import { CanvasEvent } from '../CanvasEvent'

// 通过分词器获取单词所在选区
function getWordRangeBySegmenter(host: CanvasEvent): IRange | null {
  if (!Intl.Segmenter) return null
  const draw = host.getDraw()
  const cursorPosition = draw.getPosition().getCursorPosition()
  if (!cursorPosition) return null
  const rangeManager = draw.getRange()
  const paragraphInfo = rangeManager.getRangeParagraphInfo()
  if (!paragraphInfo) return null
  // 组装段落文本
  const paragraphText =
    paragraphInfo?.elementList
      ?.map(e =>
        !e.type ||
        (e.type !== ElementType.CONTROL &&
          TEXTLIKE_ELEMENT_TYPE.includes(e.type))
          ? e.value
          : ZERO
      )
      .join('') || ''
  if (!paragraphText) return null
  // 光标所在位置
  const cursorStartIndex = cursorPosition.index
  // 段落首字符相对文档起始位置
  const offset = paragraphInfo.startIndex
  const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' })
  const segments = segmenter.segment(paragraphText)
  // 新的光标位置
  let startIndex = -1
  let endIndex = -1
  for (const { segment, index, isWordLike } of segments) {
    const realSegmentStartIndex = index + offset
    if (
      isWordLike &&
      cursorStartIndex >= realSegmentStartIndex &&
      cursorStartIndex < realSegmentStartIndex + segment.length
    ) {
      startIndex = realSegmentStartIndex - 1
      endIndex = startIndex + segment.length
      break
    }
  }
  return ~startIndex && ~endIndex ? { startIndex, endIndex } : null
}

// 通过光标位置获取单词所在选区
function getWordRangeByCursor(host: CanvasEvent): IRange | null {
  const draw = host.getDraw()
  const cursorPosition = draw.getPosition().getCursorPosition()
  if (!cursorPosition) return null
  const { value, index } = cursorPosition
  // 判断是否是数字或英文
  const LETTER_REG = draw.getLetterReg()
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
  // 新的光标位置
  const startIndex = index - upCount - 1
  if (startIndex < 0) return null
  return {
    startIndex,
    endIndex: index + downCount
  }
}

function dblclick(host: CanvasEvent, evt: MouseEvent) {
  const draw = host.getDraw()
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
  // 复选/单选框双击时是切换选择状态，禁用扩选
  if (
    (positionContext.isCheckbox || positionContext.isRadio) &&
    positionContext.isDirectHit
  ) {
    return
  }
  // 自动扩选文字-分词处理，优先使用分词器否则降级使用光标所在位置
  const rangeManager = draw.getRange()
  const segmenterRange =
    getWordRangeBySegmenter(host) || getWordRangeByCursor(host)
  if (!segmenterRange) return
  rangeManager.setRange(segmenterRange.startIndex, segmenterRange.endIndex)
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
