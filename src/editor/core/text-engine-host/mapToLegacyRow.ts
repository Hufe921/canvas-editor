import { ElementType } from '../../dataset/enum/Element'
import { RowFlex } from '../../dataset/enum/Row'
import { IElement } from '../../interface/Element'
import { IRow, IRowElement } from '../../interface/Row'
import {
  LayoutLine,
  LayoutResult,
  ResolvedDirection,
  TextStyleProps
} from '../text-engine/types'

function getFontStyle(el: IElement, defaultFont: string, defaultSize: number) {
  const size = el.actualSize || el.size || defaultSize
  return `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${
    size
  }px ${el.font || defaultFont}`
}

/** Match legacy computeRowList metrics for super/sub (half-height vertical pad). */
function metricsForGlyph(
  fontSize: number,
  scriptShift?: TextStyleProps['scriptShift']
) {
  let boundingBoxAscent = fontSize * 0.8
  let boundingBoxDescent = fontSize * 0.2
  if (scriptShift === 'super') {
    boundingBoxAscent += fontSize / 2
  } else if (scriptShift === 'sub') {
    boundingBoxDescent += fontSize / 2
  }
  return {
    height: fontSize,
    boundingBoxAscent,
    boundingBoxDescent
  }
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
  const paragraphText = layout.paragraphText || ''
  for (const g of line.glyphs) {
    // BiDi 隔离符（LRI/RLI/FSI/PDI）挂在 PREFIX/POSTFIX 逻辑下标上；
    // RTL 视觉重排常把 PDI 甩到隔离段首、LRI 甩到段尾。若参与字盒并集，
    // POSTFIX 会吞掉整个 `{value}` → 叠字命中/点不进控件。
    const glyphText = paragraphText.slice(g.charStart, g.charEnd)
    if (glyphText && /^[\u2066-\u2069]+$/u.test(glyphText)) {
      continue
    }
    const from = Math.min(g.logicalIndexStart, g.logicalIndexEnd)
    const to = Math.max(g.logicalIndexStart, g.logicalIndexEnd)
    // Prefer the visible cluster mapping. The old logical range includes
    // bidi isolates and can make a control prefix/postfix absorb its value.
    const logicalIndices = g.logicalIndices?.length
      ? [...new Set(g.logicalIndices)]
      : Array.from({ length: Math.max(1, to - from + 1) }, (_, i) => from + i)
    const count = Math.max(1, logicalIndices.length)
    // 组合符 advance 可为 0：仍占逻辑位，挂到 cluster 盒上
    const boxW = Math.max(g.right - g.left, 0)
    const eachWidth = boxW > 0.01 ? boxW / count : 0
    const odd = (g.bidiLevel & 1) === 1
    for (let mapped = 0; mapped < logicalIndices.length; mapped++) {
      const li = logicalIndices[mapped]
      const el = elementList[li]
      if (!el) continue
      const fontSize = g.style.fontSize || el.size || defaultSize
      if (
        el.type === ElementType.SUPERSCRIPT ||
        el.type === ElementType.SUBSCRIPT
      ) {
        el.actualSize = Math.ceil((el.size || defaultSize) * 0.6)
      }
      const isObject = g.style.objectWidth != null
      const objectHeight = g.style.objectHeight
      const box = isObject
        ? {
            height: objectHeight ?? fontSize,
            boundingBoxAscent: 0,
            boundingBoxDescent: objectHeight ?? fontSize
          }
        : metricsForGlyph(fontSize, g.style.scriptShift)
      let visualLeft = odd
        ? g.left + (count - mapped - 1) * eachWidth
        : g.left + mapped * eachWidth
      let width = isObject ? g.style.objectWidth! : eachWidth
      if (!isObject && width <= 0.01 && byLogical.has(li)) {
        const base = byLogical.get(li)!
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
          height: Math.max(prev.metrics?.height ?? 0, box.height),
          boundingBoxAscent: Math.max(
            prev.metrics?.boundingBoxAscent ?? 0,
            box.boundingBoxAscent
          ),
          boundingBoxDescent: Math.max(
            prev.metrics?.boundingBoxDescent ?? 0,
            box.boundingBoxDescent
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
            ...box
          },
          style: getFontStyle(el, defaultFont, defaultSize),
          visualLeft,
          // 清掉 legacy minWidth 残留，由引擎行后处理重新写入
          left: 0,
          bidiLevel: g.bidiLevel,
          visualIndex: visualOrder++,
          sourceIndex: li,
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
    // RTL 下行首空洞若回落 visualLeft=0 会在左侧留下「幽灵」占位，造成中线大空隙观感
    const fallbackLeft = (() => {
      const first = byLogical.get(Math.min(...mappedKeys))
      return first?.visualLeft ?? 0
    })()
    for (let li = rangeStart; li <= rangeEnd; li++) {
      const existing = byLogical.get(li)
      if (existing) {
        neighbor = existing
        continue
      }
      const el = elementList[li]
      if (!el || el.value === '\u200B') continue
      const fontSize = el.size || defaultSize
      const visualLeft = neighbor?.visualLeft ?? fallbackLeft
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
          left: 0,
          bidiLevel: neighbor?.bidiLevel ?? (direction === 'rtl' ? 1 : 0),
          visualIndex: visualOrder++,
          sourceIndex: li,
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
    // 浅拷贝 line/glyphs，避免行后处理（minWidth/label）写回 LayoutCache
    engineLine: {
      ...line,
      glyphs: line.glyphs.map(g => ({ ...g }))
    },
    engineParagraphText: layout.paragraphText
  }
}
