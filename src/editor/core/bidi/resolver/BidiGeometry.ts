import {
  IElementFillRect,
  IElementPosition
} from '../../../interface/Element'
import { TextDirection } from '../../../dataset/enum/TextDirection'
import { ResolvedTextDirection } from '../types'

export interface IVisualRangeRect extends IElementFillRect {
  pageNo: number
  rowNo: number
  rowIndex: number
}

// 同一 level 的测量与绘制方向保持一致，避免浏览器重排 run 边缘标点
export function getBidiRunDirection(
  level: number | undefined,
  direction: ResolvedTextDirection
): ResolvedTextDirection {
  if (level === undefined) return direction
  return level % 2 === 1 ? TextDirection.RTL : TextDirection.LTR
}

// 默认 LTR 单次遍历完成连续选区合并；遇方向层级或行内间隙再回退视觉算法
function getSequentialRangeRects(
  positionList: IElementPosition[],
  height?: number
): IVisualRangeRect[] | null {
  const rects: IVisualRangeRect[] = []
  let current: IVisualRangeRect | null = null
  for (let i = 0; i < positionList.length; i++) {
    const position = positionList[i]
    if (position.bidiLevel !== undefined) return null
    const { pageNo, rowNo, rowIndex, coordinate, lineHeight } = position
    const { leftTop, rightTop, leftBottom } = coordinate
    const positionHeight = height ?? lineHeight
    const isSameRow =
      current !== null &&
      current.pageNo === pageNo &&
      current.rowNo === rowNo &&
      current.rowIndex === rowIndex &&
      Math.abs(current.y - leftTop[1]) < 1
    if (current && isSameRow) {
      const previous = positionList[i - 1]
      if (
        Math.abs(
          previous.coordinate.rightTop[0] - leftTop[0]
        ) > 0.5
      ) {
        return null
      }
      current.width = rightTop[0] - current.x
      current.height = Math.max(
        current.height,
        leftBottom[1] - leftTop[1],
        positionHeight
      )
    } else {
      current = {
        x: leftTop[0],
        y: leftTop[1],
        width: rightTop[0] - leftTop[0],
        height: positionHeight,
        pageNo,
        rowNo,
        rowIndex
      }
      rects.push(current)
    }
  }
  return rects
}

// 将逻辑选区转换为每行一个或多个视觉连续矩形，保持行遍历顺序
export function getVisualRangeRects(
  positionList: IElementPosition[],
  height?: number
): IVisualRangeRect[] {
  const sequentialRects = getSequentialRangeRects(positionList, height)
  if (sequentialRects) return sequentialRects
  const rowMap = new Map<string, IElementPosition[]>()
  for (const position of positionList) {
    const key = `${position.pageNo}:${position.rowNo}:${position.rowIndex}:${position.coordinate.leftTop[1]}`
    const rowPositions = rowMap.get(key) || []
    rowPositions.push(position)
    rowMap.set(key, rowPositions)
  }
  const rects: IVisualRangeRect[] = []
  for (const rowPositions of rowMap.values()) {
    rowPositions.sort(
      (a, b) => a.coordinate.leftTop[0] - b.coordinate.leftTop[0]
    )
    const { pageNo, rowNo, rowIndex } = rowPositions[0]
    let current: IVisualRangeRect | null = null
    for (const position of rowPositions) {
      const { leftTop, rightTop, leftBottom } = position.coordinate
      const width = rightTop[0] - leftTop[0]
      const positionHeight = height ?? position.lineHeight
      if (
        current &&
        Math.abs(current.y - leftTop[1]) < 1 &&
        leftTop[0] <= current.x + current.width + 0.5
      ) {
        const right = Math.max(current.x + current.width, rightTop[0])
        current.width = right - current.x
        current.height = Math.max(
          current.height,
          leftBottom[1] - leftTop[1],
          positionHeight
        )
      } else {
        current = {
          x: leftTop[0],
          y: leftTop[1],
          width,
          height: positionHeight,
          pageNo,
          rowNo,
          rowIndex
        }
        rects.push(current)
      }
    }
  }
  return rects
}
