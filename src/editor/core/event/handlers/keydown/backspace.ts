import { ZERO } from '../../../../dataset/constant/Common'
import { CanvasEvent } from '../../CanvasEvent'
import {EditorMode} from '../../../../dataset/enum/Editor'
import {TrackType} from '../../../../dataset/enum/Track'

export function backspace(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  if (draw.isReadonly()) return
  // 审阅模式
  const isReviewMode = draw.getMode() === EditorMode.REVIEW
  const currentUser = draw.getOptions().user.name
  // 可输入性验证
  const rangeManager = draw.getRange()
  if (!rangeManager.getIsCanInput()) return
  const { startIndex, endIndex, isCrossRowCol } = rangeManager.getRange()
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
        } else if(col.value.length > 1 && isReviewMode) {
          // 审阅模式删除表格跨行列内容
          for(let i = 1; i < col.value.length; i++) {
            const element = col.value[i]
            if(element.trackType === TrackType.INSERT && element.track?.author === currentUser){
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
  } else if (
    control.getActiveControl() &&
    control.getIsRangeCanCaptureEvent()
  ) {
    // 光标在控件内
    curIndex = control.keydown(evt)
  } else {
    // 普通元素删除
    const position = draw.getPosition()
    const cursorPosition = position.getCursorPosition()
    if (!cursorPosition) return
    const { index } = cursorPosition
    const isCollapsed = rangeManager.getIsCollapsed()
    const elementList = draw.getElementList()
    // 判断是否允许删除
    if (isCollapsed && index === 0) {
      const firstElement = elementList[index]
      if (firstElement.value === ZERO) {
        // 取消首字符列表设置
        if (firstElement.listId) {
          draw.getListParticle().unsetList()
        }
        evt.preventDefault()
        return
      }
    }
    //  替换当前行对齐方式
    const startElement = elementList[startIndex]
    if (isCollapsed && startElement.rowFlex && startElement.value === ZERO) {
      const rowFlexElementList = rangeManager.getRangeRowElementList()
      if (rowFlexElementList) {
        const preElement = elementList[startIndex - 1]
        rowFlexElementList.forEach(element => {
          element.rowFlex = preElement?.rowFlex
        })
      }
    }
    // 审阅模式删除！
    if(isReviewMode && !isCollapsed) {
      const deleteArray = elementList.slice(startIndex+1, endIndex+1)
      const len = deleteArray.length
      for(let i = 0; i < len; i++){
        const element = deleteArray[i]
        if(element.trackType === TrackType.INSERT && element.track?.author === currentUser){
          draw.spliceElementList(elementList, startIndex+1, 1)
        } else  {
          draw.addReviewInformation([element], TrackType.DELETE)
        }
      }
    } else if(isReviewMode && isCollapsed){
      const element = elementList[index]
      if(element.trackType === TrackType.INSERT && element.track?.author === currentUser){
        draw.spliceElementList(elementList, index, 1)
      } else  {
        draw.addReviewInformation([element], TrackType.DELETE)
      }
    }
    else if (!isCollapsed) {
      draw.spliceElementList(elementList, startIndex + 1, endIndex - startIndex)
    } else {
      draw.spliceElementList(elementList, index, 1)
    }
    curIndex = isCollapsed ? index - 1 : startIndex
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
