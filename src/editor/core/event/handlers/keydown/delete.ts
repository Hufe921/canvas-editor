import { CanvasEvent } from '../../CanvasEvent'
import {EditorMode} from '../../../../dataset/enum/Editor'
import {TrackType} from '../../../../dataset/enum/Track'

export function del(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  if (draw.isReadonly()) return
  // 审阅模式
  const isReviewMode = draw.getMode() === EditorMode.REVIEW
  // 可输入性验证
  const rangeManager = draw.getRange()
  if (!rangeManager.getIsCanInput()) return
  const { startIndex, endIndex, isCrossRowCol } = rangeManager.getRange()
  const elementList = draw.getElementList()
  const control = draw.getControl()
  let curIndex: number | null
  if (isCrossRowCol) {
    // 表格跨行列选中时清空单元格内容
    const rowCol = draw.getTableParticle().getRangeRowCol()
    if (!rowCol) return
    let isDeleted = false
    for (let r = 0; r < rowCol.length; r++) {
      const row = rowCol[r]
      for (let c = 0; c < row.length; c++) {
        const col = row[c]
        if (col.value.length > 1 && !isReviewMode) {
          draw.spliceElementList(col.value, 1, col.value.length - 1)
          isDeleted = true
        } else if(col.value.length > 1 && isReviewMode){
          // 审阅模式删除表格跨行列内容
          // const deleteArray = col.value.slice(1, col.value.length)
          // draw.addReviewInformation(deleteArray, TrackType.DELETE)

          for(let i = 1; i < col.value.length; i++) {
            const element = col.value[i]
            if(element.trackType === TrackType.INSERT && element.track?.author === 'john'){
              draw.spliceElementList(col.value, i, 1)
              i--
            } else  {
              draw.addReviewInformation([element], TrackType.DELETE)
            }
          }
        }
      }
    }
    // 删除成功后定位
    curIndex = isDeleted ? 0 : null
  } else if (control.getActiveControl() && control.getIsRangeWithinControl()) {
    // 光标在控件内
    curIndex = control.keydown(evt)
  } else if (elementList[endIndex + 1]?.controlId) {
    // 光标在控件前
    curIndex = control.removeControl(endIndex + 1)
  } else {
    // 普通元素
    const position = draw.getPosition()
    const cursorPosition = position.getCursorPosition()
    if (!cursorPosition) return
    const { index } = cursorPosition
    // 命中图片直接删除
    const positionContext = position.getPositionContext()
    if (positionContext.isDirectHit && positionContext.isImage) {
      if(!isReviewMode) {
        draw.spliceElementList(elementList, index, 1)
      } else {
        const element = elementList[index]
        if(element.trackType === TrackType.INSERT && element.track?.author === 'john'){
          draw.spliceElementList(elementList, index, 1)
        } else  {
          draw.addReviewInformation([element], TrackType.DELETE)
        }
      }
      curIndex = index - 1
    } else {
      const isCollapsed = rangeManager.getIsCollapsed()
      let reviewCounter = 0
      // 审阅模式删除！
      if(isReviewMode && !isCollapsed) {
        const deleteArray = elementList.slice(startIndex+1, endIndex+1)
        const len = deleteArray.length
        for(let i = 0; i < len; i++){
          const element = deleteArray[i]
          if(element.trackType === TrackType.INSERT && element.track?.author === 'john'){
            draw.spliceElementList(elementList, startIndex+1, 1)
            reviewCounter++
          } else  {
            draw.addReviewInformation([element], TrackType.DELETE)
          }
        }
      } else if(isReviewMode && isCollapsed){
        if (!elementList[index + 1]) return
        const element = elementList[index+1]
        if(element.trackType === TrackType.INSERT && element.track?.author === 'john'){
          draw.spliceElementList(elementList, index+1, 1)
          reviewCounter++
        } else  {
          draw.addReviewInformation([element], TrackType.DELETE)
        }
      }
      else if (!isCollapsed) {
        draw.spliceElementList(
          elementList,
          startIndex + 1,
          endIndex - startIndex
        )
      } else {
        if (!elementList[index + 1]) return
        draw.spliceElementList(elementList, index + 1, 1)
      }
      if(!isReviewMode) {
        curIndex = isCollapsed ? index : startIndex
      } else if(isCollapsed && reviewCounter){
        curIndex = index
      } else {
        curIndex = isCollapsed ? index + 1 : endIndex - reviewCounter
      }
    }
  }
  draw.getGlobalEvent().setCanvasEventAbility()
  if (curIndex === null) {
    rangeManager.setRange(startIndex, startIndex)
    draw.render({
      curIndex: startIndex,
      isSubmitHistory: false
    })
  } else {
    rangeManager.setRange(curIndex, curIndex)
    draw.render({
      curIndex
    })
  }
}
