import { ElementType } from '../../../../dataset/enum/Element'
import { KeyMap } from '../../../../dataset/enum/KeyMap'
import { MoveDirection } from '../../../../dataset/enum/Observer'
import { IElementPosition } from '../../../../interface/Element'
import { CanvasEvent } from '../../CanvasEvent'

interface IGetNextPositionIndexPayload {
  positionList: IElementPosition[]
  index: number
  rowNo: number
  isUp: boolean
  cursorX: number
}
// 根据当前位置索引查找上下行最接近的索引位置
function getNextPositionIndex(payload: IGetNextPositionIndexPayload) {
  const { positionList, index, isUp, rowNo, cursorX } = payload
  let nextIndex = 0
  // 查找下一行位置列表
  const probablePosition: IElementPosition[] = []
  if (isUp) {
    let p = index - 1
    while (p > 0) {
      const position = positionList[p]
      p--
      if (position.rowNo === rowNo) continue
      if (probablePosition[0] && probablePosition[0].rowNo !== position.rowNo) {
        break
      }
      probablePosition.unshift(position)
    }
  } else {
    let p = index + 1
    while (p < positionList.length) {
      const position = positionList[p]
      p++
      if (position.rowNo === rowNo) continue
      if (probablePosition[0] && probablePosition[0].rowNo !== position.rowNo) {
        break
      }
      probablePosition.push(position)
    }
  }
  // 查找下一行位置：第一个存在交叉宽度的元素位置
  for (let p = 0; p < probablePosition.length; p++) {
    const nextPosition = probablePosition[p]
    const {
      coordinate: {
        leftTop: [nextLeftX],
        rightTop: [nextRightX]
      }
    } = nextPosition
    if (p === probablePosition.length - 1) {
      nextIndex = nextPosition.index
    }
    if (cursorX < nextLeftX || cursorX > nextRightX) continue
    nextIndex = nextPosition.index
    break
  }
  return nextIndex
}

export function updown(evt: KeyboardEvent, host: CanvasEvent) {
  const draw = host.getDraw()
  const isReadonly = draw.isReadonly()
  if (isReadonly) return
  const position = draw.getPosition()
  const cursorPosition = position.getCursorPosition()
  if (!cursorPosition) return
  const rangeManager = draw.getRange()
  const { startIndex, endIndex } = rangeManager.getRange()
  let positionList = position.getPositionList()
  const isUp = evt.key === KeyMap.Up
  // 新的光标开始结束位置
  let anchorStartIndex = -1
  let anchorEndIndex = -1
  // 单元格之间跳转及跳出表格逻辑
  const positionContext = position.getPositionContext()
  if (
    !evt.shiftKey &&
    positionContext.isTable &&
    ((isUp && cursorPosition.rowIndex === 0) ||
      (!isUp && cursorPosition.rowIndex === draw.getRowCount() - 1))
  ) {
    const { index, trIndex, tdIndex, tableId } = positionContext
    if (isUp) {
      // 向上移动-第一行则移出到表格外，否则上一行相同列位置
      if (trIndex === 0) {
        position.setPositionContext({
          isTable: false
        })
        anchorStartIndex = index! - 1
        anchorEndIndex = anchorStartIndex
        draw.getTableTool().dispose()
      } else {
        // 查找上一行相同列索引位置信息
        let preTrIndex = -1
        let preTdIndex = -1
        const originalElementList = draw.getOriginalElementList()
        const trList = originalElementList[index!].trList!
        // 当前单元格所在列实际索引
        const curTdColIndex = trList[trIndex!].tdList[tdIndex!].colIndex!
        outer: for (let r = trIndex! - 1; r >= 0; r--) {
          const tr = trList[r]
          const tdList = tr.tdList!
          for (let d = 0; d < tdList.length; d++) {
            const td = tdList[d]
            if (
              td.colIndex === curTdColIndex ||
              (td.colIndex! + td.colspan - 1 >= curTdColIndex &&
                td.colIndex! <= curTdColIndex)
            ) {
              preTrIndex = r
              preTdIndex = d
              break outer
            }
          }
        }
        if (!~preTrIndex || !~preTdIndex) return
        const preTr = trList[preTrIndex]
        const preTd = preTr.tdList[preTdIndex]
        position.setPositionContext({
          isTable: true,
          index,
          trIndex: preTrIndex,
          tdIndex: preTdIndex,
          tdId: preTr.id,
          trId: preTd.id,
          tableId
        })
        anchorStartIndex = preTd.value.length - 1
        anchorEndIndex = anchorStartIndex
        draw.getTableTool().render()
      }
    } else {
      // 向下移动-最后一行则移出表格外，否则下一行相同列位置
      const originalElementList = draw.getOriginalElementList()
      const trList = originalElementList[index!].trList!
      if (trIndex === trList.length - 1) {
        position.setPositionContext({
          isTable: false
        })
        anchorStartIndex = index!
        anchorEndIndex = anchorStartIndex
        draw.getTableTool().dispose()
      } else {
        // 查找下一行相同列索引位置信息
        let nexTrIndex = -1
        let nextTdIndex = -1
        // 当前单元格所在列实际索引
        const curTdColIndex = trList[trIndex!].tdList[tdIndex!].colIndex!
        outer: for (let r = trIndex! + 1; r < trList.length; r++) {
          const tr = trList[r]
          const tdList = tr.tdList!
          for (let d = 0; d < tdList.length; d++) {
            const td = tdList[d]
            if (
              td.colIndex === curTdColIndex ||
              (td.colIndex! + td.colspan - 1 >= curTdColIndex &&
                td.colIndex! <= curTdColIndex)
            ) {
              nexTrIndex = r
              nextTdIndex = d
              break outer
            }
          }
        }
        if (!~nexTrIndex || !~nextTdIndex) return
        const nextTr = trList[nexTrIndex]
        const nextTd = nextTr.tdList[nextTdIndex]
        position.setPositionContext({
          isTable: true,
          index,
          trIndex: nexTrIndex,
          tdIndex: nextTdIndex,
          tdId: nextTr.id,
          trId: nextTd.id,
          tableId
        })
        anchorStartIndex = nextTd.value.length - 1
        anchorEndIndex = anchorStartIndex
        draw.getTableTool().render()
      }
    }
  } else {
    // 普通元素及跳进表格逻辑
    let anchorPosition: IElementPosition = cursorPosition
    // 扩大选区时，判断移动光标点
    if (evt.shiftKey) {
      if (startIndex === cursorPosition.index) {
        anchorPosition = positionList[endIndex]
      } else {
        anchorPosition = positionList[startIndex]
      }
    }
    const {
      index,
      rowNo,
      rowIndex,
      coordinate: {
        rightTop: [curRightX]
      }
    } = anchorPosition
    // 向上时在首行、向下时在尾行则忽略
    if (
      (isUp && rowIndex === 0) ||
      (!isUp && rowIndex === draw.getRowCount() - 1)
    ) {
      return
    }
    // 查找下一行位置列表
    const nextIndex = getNextPositionIndex({
      positionList,
      index,
      rowNo,
      isUp,
      cursorX: curRightX
    })
    if (!nextIndex) return
    // shift则缩放选区
    anchorStartIndex = nextIndex
    anchorEndIndex = nextIndex
    if (evt.shiftKey) {
      if (startIndex !== endIndex) {
        if (startIndex === cursorPosition.index) {
          anchorStartIndex = startIndex
        } else {
          anchorEndIndex = endIndex
        }
      } else {
        if (isUp) {
          anchorEndIndex = endIndex
        } else {
          anchorStartIndex = startIndex
        }
      }
    }
    // 如果下一行是表格则进入单元格内
    const elementList = draw.getElementList()
    const nextElement = elementList[nextIndex]
    if (nextElement.type === ElementType.TABLE) {
      const { scale } = draw.getOptions()
      const margins = draw.getMargins()
      const trList = nextElement.trList!
      // 查找进入的单元格及元素位置
      let trIndex = -1
      let tdIndex = -1
      let tdPositionIndex = -1
      if (isUp) {
        outer: for (let r = trList.length - 1; r >= 0; r--) {
          const tr = trList[r]
          const tdList = tr.tdList!
          for (let d = 0; d < tdList.length; d++) {
            const td = tdList[d]
            const tdX = td.x! * scale + margins[3]
            const tdWidth = td.width! * scale
            if (curRightX >= tdX && curRightX <= tdX + tdWidth) {
              const tdPositionList = td.positionList!
              const lastPosition = tdPositionList[tdPositionList.length - 1]
              const nextPositionIndex =
                getNextPositionIndex({
                  positionList: tdPositionList,
                  index: lastPosition.index + 1, // 虚拟起始位置+1（从左往右找）
                  rowNo: lastPosition.rowNo - 1, // 虚拟起始行号-1（从下往上找）
                  isUp,
                  cursorX: curRightX
                }) || lastPosition.index
              trIndex = r
              tdIndex = d
              tdPositionIndex = nextPositionIndex
              break outer
            }
          }
        }
      } else {
        outer: for (let r = 0; r < trList.length; r++) {
          const tr = trList[r]
          const tdList = tr.tdList!
          for (let d = 0; d < tdList.length; d++) {
            const td = tdList[d]
            const tdX = td.x! * scale + margins[3]
            const tdWidth = td.width! * scale
            if (curRightX >= tdX && curRightX <= tdX + tdWidth) {
              const tdPositionList = td.positionList!
              const nextPositionIndex =
                getNextPositionIndex({
                  positionList: tdPositionList,
                  index: -1, // 虚拟起始位置-1（从右往左找）
                  rowNo: -1, // 虚拟起始行号-1（从上往下找）
                  isUp,
                  cursorX: curRightX
                }) || 0
              trIndex = r
              tdIndex = d
              tdPositionIndex = nextPositionIndex
              break outer
            }
          }
        }
      }
      // 设置上下文
      if (~trIndex && ~tdIndex && ~tdPositionIndex) {
        const nextTr = trList[trIndex]
        const nextTd = nextTr.tdList[tdIndex]
        position.setPositionContext({
          isTable: true,
          index: nextIndex,
          trIndex: trIndex,
          tdIndex: tdIndex,
          tdId: nextTd.id,
          trId: nextTr.id,
          tableId: nextElement.id
        })
        anchorStartIndex = tdPositionIndex
        anchorEndIndex = anchorStartIndex
        positionList = position.getPositionList()
        draw.getTableTool().render()
      }
    }
  }
  // 执行跳转
  if (!~anchorStartIndex || !~anchorEndIndex) return
  if (anchorStartIndex > anchorEndIndex) {
    // prettier-ignore
    [anchorStartIndex, anchorEndIndex] = [anchorEndIndex, anchorStartIndex]
  }
  rangeManager.setRange(anchorStartIndex, anchorEndIndex)
  const isCollapsed = anchorStartIndex === anchorEndIndex
  draw.render({
    curIndex: isCollapsed ? anchorStartIndex : undefined,
    isSetCursor: isCollapsed,
    isSubmitHistory: false,
    isCompute: false
  })
  // 将光标移动到可视范围内
  draw.getCursor().moveCursorToVisible({
    cursorPosition: positionList[isUp ? anchorStartIndex : anchorEndIndex],
    direction: isUp ? MoveDirection.UP : MoveDirection.DOWN
  })
}
