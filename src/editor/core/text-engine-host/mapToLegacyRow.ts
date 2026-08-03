import { RowFlex } from '../../dataset/enum/Row'
import { IElement } from '../../interface/Element'
import { IRow, IRowElement } from '../../interface/Row'
import {
  LayoutLine,
  LayoutResult,
  ResolvedDirection
} from '../text-engine/types'

function getFontStyle(el: IElement, defaultFont: string, defaultSize: number) {
  return `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${
    el.size || defaultSize
  }px ${el.font || defaultFont}`
}

/**
 * Project engine layout lines onto legacy IRow[].
 * Elements stay in logical index order so PositionList stays aligned with elementList;
 * visualLeft carries visual x within the row.
 */
export function mapLayoutToRows(payload: {
  layout: LayoutResult
  elementList: IElement[]
  startRowIndex: number
  rowFlex?: RowFlex
  defaultFont: string
  defaultSize: number
}): IRow[] {
  const {
    layout,
    elementList,
    startRowIndex,
    rowFlex,
    defaultFont,
    defaultSize
  } = payload
  return layout.lines.map((line, i) =>
    mapLineToRow({
      line,
      direction: layout.direction,
      elementList,
      rowIndex: startRowIndex + i,
      rowFlex,
      defaultFont,
      defaultSize,
      layout
    })
  )
}

function mapLineToRow(payload: {
  line: LayoutLine
  direction: ResolvedDirection
  elementList: IElement[]
  rowIndex: number
  rowFlex?: RowFlex
  defaultFont: string
  defaultSize: number
  layout: LayoutResult
}): IRow {
  const {
    line,
    direction,
    elementList,
    rowIndex,
    rowFlex,
    defaultFont,
    defaultSize,
    layout
  } = payload
  const byLogical = new Map<number, IRowElement>()
  let visualOrder = 0
  for (const g of line.glyphs) {
    const from = Math.min(g.logicalIndexStart, g.logicalIndexEnd)
    const to = Math.max(g.logicalIndexStart, g.logicalIndexEnd)
    const count = Math.max(1, to - from + 1)
    // 组合符 advance 可为 0：仍占逻辑位，挂到 cluster 盒上
    const boxW = Math.max(g.right - g.left, 0)
    const eachWidth = boxW > 0.01 ? boxW / count : 0
    const odd = (g.bidiLevel & 1) === 1
    for (let li = from; li <= to; li++) {
      const el = elementList[li]
      if (!el) continue
      const fontSize = g.style.fontSize || el.size || defaultSize
      let visualLeft = odd
        ? g.left + (to - li) * eachWidth
        : g.left + (li - from) * eachWidth
      let width = eachWidth
      if (width <= 0.01 && byLogical.has(from)) {
        const base = byLogical.get(from)!
        visualLeft = base.visualLeft ?? g.left
        width = base.metrics?.width ?? 0
      }
      const prev = byLogical.get(li)
      // 多码元 grapheme / 多字形落同一逻辑元素：字盒取并集，勿覆盖丢宽
      if (prev) {
        const prevLeft = prev.visualLeft ?? visualLeft
        const prevRight = prevLeft + (prev.metrics?.width ?? 0)
        const nextRight = visualLeft + width
        const unionLeft = Math.min(prevLeft, visualLeft)
        const unionWidth = Math.max(prevRight, nextRight) - unionLeft
        prev.metrics = {
          width: Math.max(unionWidth, 0),
          height: Math.max(prev.metrics?.height ?? 0, fontSize),
          boundingBoxAscent: Math.max(
            prev.metrics?.boundingBoxAscent ?? 0,
            fontSize * 0.8
          ),
          boundingBoxDescent: Math.max(
            prev.metrics?.boundingBoxDescent ?? 0,
            fontSize * 0.2
          )
        }
        prev.visualLeft = unionLeft
        prev.clusterStart = Math.min(prev.clusterStart ?? from, from)
        prev.clusterEnd = Math.max(prev.clusterEnd ?? to, to)
        continue
      }
      byLogical.set(
        li,
        Object.assign(el, {
          metrics: {
            width,
            height: fontSize,
            boundingBoxAscent: fontSize * 0.8,
            boundingBoxDescent: fontSize * 0.2
          },
          style: getFontStyle(el, defaultFont, defaultSize),
          visualLeft,
          bidiLevel: g.bidiLevel,
          visualIndex: visualOrder++,
          clusterStart: from,
          clusterEnd: to
        }) as IRowElement
      )
    }
  }
  // 仅补齐本行已映射逻辑范围内的空洞，勿按错误 logicalEnd 吞掉下一段
  const mappedKeys = [...byLogical.keys()]
  if (mappedKeys.length) {
    const rangeStart = Math.min(...mappedKeys)
    const rangeEnd = Math.max(...mappedKeys)
    let neighbor: IRowElement | undefined
    for (let li = rangeStart; li <= rangeEnd; li++) {
      const existing = byLogical.get(li)
      if (existing) {
        neighbor = existing
        continue
      }
      const el = elementList[li]
      if (!el || el.value === '\u200B') continue
      const fontSize = el.size || defaultSize
      const visualLeft = neighbor?.visualLeft ?? 0
      const width = neighbor?.metrics?.width ?? 0
      byLogical.set(
        li,
        Object.assign(el, {
          metrics: {
            width,
            height: fontSize,
            boundingBoxAscent: fontSize * 0.8,
            boundingBoxDescent: fontSize * 0.2
          },
          style: getFontStyle(el, defaultFont, defaultSize),
          visualLeft,
          bidiLevel: neighbor?.bidiLevel ?? (direction === 'rtl' ? 1 : 0),
          visualIndex: visualOrder++,
          clusterStart: li,
          clusterEnd: li
        }) as IRowElement
      )
    }
  }
  const logicalKeys = [...byLogical.keys()].sort((a, b) => a - b)
  const rowElements = logicalKeys.map(k => byLogical.get(k)!)
  return {
    width: line.width,
    height: line.height,
    ascent: line.ascent,
    rowFlex,
    direction,
    startIndex: logicalKeys[0] ?? line.logicalStart,
    elementList: rowElements,
    rowIndex,
    isWidthNotEnough: false,
    engineLine: line,
    engineParagraphText: layout.paragraphText
  }
}
