import type { LayoutRow } from '../../../interface/LayoutRow'
import { rowElementMetrics } from '../../layout/rowGeometry'
import {
  collectListMarkers,
  listMarkerText
} from '../../text-engine-host/ListMarker'
import { scaleShapedLine } from '../../text-engine-host/scaleShapedLine'
import type { LayoutLine } from '../../text-engine/types'
import { ZERO } from '../../../dataset/constant/Common'
import { ulStyleMapping } from '../../../dataset/constant/List'
import { ElementType } from '../../../dataset/enum/Element'
import { KeyMap } from '../../../dataset/enum/KeyMap'
import { ListStyle, ListType, UlStyle } from '../../../dataset/enum/List'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IElement, IElementPosition } from '../../../interface/Element'
import { getUUID } from '../../../utils'
import { RangeManager } from '../../range/RangeManager'
import { Draw } from '../Draw'

export class ListParticle {
  private draw: Draw
  private range: RangeManager
  private options: DeepRequired<IEditorOption>

  // 非递增样式直接返回默认值
  private readonly LIST_GAP = 10
  public readonly LIST_INDENT_WIDTH = 30
  private readonly MAX_LEVEL = 8
  private nativeWidths = new WeakMap<IElement, number>()
  private nativeMarkers = new WeakMap<
    IElement,
    { ltr: LayoutLine; rtl: LayoutLine }
  >()

  constructor(draw: Draw) {
    this.draw = draw
    this.range = draw.getRange()
    this.options = draw.getOptions()
  }

  public setList(listType: ListType | null, listStyle?: ListStyle) {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    // 需要改变的元素列表
    const changeElementList = this.range.getRangeParagraphElementList()
    if (!changeElementList || !changeElementList.length) return
    // 如果包含列表则设置为取消列表
    const isUnsetList = changeElementList.find(
      el => el.listType === listType && el.listStyle === listStyle
    )
    if (isUnsetList || !listType) {
      this.unsetList()
      return
    }
    // 设置值
    const listId = getUUID()
    this.draw.setElementProperty(changeElementList, {
      listId,
      listType,
      listStyle,
      listLevel: 0
    })
    // 光标定位
    const isSetCursor = startIndex === endIndex
    const curIndex = isSetCursor ? endIndex : startIndex
    this.draw.render({ curIndex, isSetCursor })
  }

  public unsetList() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    // 需要改变的元素列表
    const changeElementList = this.range
      .getRangeParagraphElementList()
      ?.filter(el => el.listId)
    if (!changeElementList || !changeElementList.length) return
    // 如果列表最后字符不是换行符则需插入换行符
    const elementList = this.draw.getElementList()
    const endElement = elementList[endIndex]
    if (endElement.listId) {
      let start = endIndex + 1
      while (start < elementList.length) {
        const element = elementList[start]
        if (element.value === ZERO && !element.listWrap) break
        if (element.listId !== endElement.listId) {
          this.draw.spliceElementList(elementList, start, 0, [
            {
              value: ZERO
            }
          ])
          break
        }
        start++
      }
    }
    // 取消设置
    this.draw.deleteElementProperty(changeElementList, [
      'listId',
      'listType',
      'listStyle',
      'listWrap',
      'listLevel'
    ])
    // 光标定位
    const isSetCursor = startIndex === endIndex
    const curIndex = isSetCursor ? endIndex : startIndex
    this.draw.render({ curIndex, isSetCursor })
  }

  // 提升当前选区列表层级，用于列表项行首 Tab 缩进
  public increaseListLevel() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    const segments = this.extractListSegments()
    if (!segments.length) return
    const elementList = this.draw.getElementList()
    let changed = false
    for (const segment of segments) {
      const curLevel = segment[0]?.listLevel ?? 0
      if (curLevel >= this.MAX_LEVEL) continue
      const targetLevel = curLevel + 1
      this.applySegmentLevel(segment, targetLevel, elementList)
      changed = true
    }
    if (!changed) return
    const isSetCursor = startIndex === endIndex
    const curIndex = isSetCursor ? endIndex : startIndex
    this.draw.render({ curIndex, isSetCursor })
  }

  // 降低当前选区列表层级，顶级列表继续降级时退出列表
  public decreaseListLevel() {
    const isReadonly = this.draw.isReadonly()
    if (isReadonly) return
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return
    const segments = this.extractListSegments()
    if (!segments.length) return
    const hasTopLevelInSelection = segments.some(
      seg => seg[0]?.listId && (seg[0].listLevel ?? 0) === 0
    )
    if (hasTopLevelInSelection) {
      const elementList = this.draw.getElementList()
      for (const segment of segments) {
        const segListId = segment[0]?.listId
        for (const el of segment) {
          this.clearListInfo(el)
        }
        if (segListId) {
          this.clearPreviousEmptyListItems(elementList, segment[0], segListId)
        }
      }
      const isSetCursor = startIndex === endIndex
      const curIndex = isSetCursor ? endIndex : startIndex
      this.draw.render({ curIndex, isSetCursor })
      return
    }
    const elementList = this.draw.getElementList()
    let changed = false
    for (const segment of segments) {
      const curLevel = segment[0]?.listLevel ?? 0
      if (curLevel <= 0) continue
      const targetLevel = curLevel - 1
      this.applySegmentLevel(segment, targetLevel, elementList)
      changed = true
    }
    if (!changed) return
    const isSetCursor = startIndex === endIndex
    const curIndex = isSetCursor ? endIndex : startIndex
    this.draw.render({ curIndex, isSetCursor })
  }

  // 将一个或多个完整列表项切换到目标层级，并同步列表标识
  private applySegmentLevel(
    segment: IElement[],
    targetLevel: number,
    elementList: IElement[]
  ) {
    const firstEl = segment[0]
    // 同级列表复用前一个 listId，跨父项的子列表重新生成 listId
    const listId =
      this.findPreviousListId(firstEl, targetLevel, elementList) || getUUID()
    this.draw.setElementProperty(segment, { listId, listLevel: targetLevel })
    if (firstEl.listType) {
      this.draw.setElementProperty(segment, { listType: firstEl.listType })
    }
    if (firstEl.listStyle) {
      this.draw.setElementProperty(segment, { listStyle: firstEl.listStyle })
    }
  }

  // 查找同一父项内最近的同级 listId，用于保持同一子列表连续编号
  private findPreviousListId(
    element: IElement,
    level: number,
    elementList: IElement[]
  ): string | undefined {
    const start = elementList.indexOf(element)
    if (!~start) return
    for (let i = start - 1; i >= 0; i--) {
      const pre = elementList[i]
      if (!pre?.listId) continue
      if (pre.value !== ZERO || pre.listWrap) continue
      // 遇到更浅层级说明已跨出当前父项，子列表编号需要重新开始
      if ((pre.listLevel ?? 0) < level) break
      if (pre.listType !== element.listType) continue
      if ((pre.listLevel ?? 0) !== level) continue
      if (this.isParagraphStart(elementList, i)) {
        return pre.listId
      }
    }
    return
  }

  // 判断元素是否位于列表项段首，只有段首的 listId 才能作为编号锚点
  private isParagraphStart(elementList: IElement[], index: number): boolean {
    const element = elementList[index]
    const pre = elementList[index - 1]
    return (
      !pre ||
      pre.value === ZERO ||
      pre.listId !== element.listId ||
      (element.value === ZERO && !element.listWrap)
    )
  }

  // 清理元素上的列表属性，保留其它文本样式
  private clearListInfo(element: IElement) {
    if (!element.listId) return
    this.draw.deleteElementProperty(element, [
      'listId',
      'listType',
      'listStyle',
      'listWrap',
      'listLevel'
    ])
  }

  // 退出列表时清理同 listId 下连续的前置空列表项
  private clearPreviousEmptyListItems(
    elementList: IElement[],
    segmentStart: IElement,
    listId: string
  ) {
    const start = elementList.indexOf(segmentStart)
    for (let i = start - 1; i >= 0; i--) {
      const pre = elementList[i]
      if (pre.listId !== listId) break
      if (pre.value !== ZERO || pre.listWrap) break
      // 顶级空列表项退出列表时，清理前面连续的空列表项
      this.clearListInfo(pre)
    }
  }

  // 将选区按列表项拆成段，确保缩进操作作用于完整列表项
  private extractListSegments(): IElement[][] {
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return []
    const elementList = this.draw.getElementList()
    if (!elementList.length) return []
    let pStart = Math.min(startIndex, endIndex)
    let pEnd = Math.max(startIndex, endIndex)
    // 光标在列表项起始 ZERO 上时，当前元素已经是段首
    const startElAtZero =
      elementList[pStart]?.value === ZERO &&
      !elementList[pStart]?.listWrap &&
      !!elementList[pStart]?.listId
    if (!startElAtZero) {
      while (pStart > 0) {
        const prev = elementList[pStart - 1]
        if (!prev) break
        if (prev.value === ZERO && !prev.listWrap) {
          if (prev.listId) {
            pStart--
          }
          break
        }
        pStart--
      }
    }
    while (pEnd < elementList.length - 1) {
      const next = elementList[pEnd + 1]
      if (!next) break
      if (next.value === ZERO && !next.listWrap) break
      pEnd++
    }
    const segments: IElement[][] = []
    let current: IElement[] = []
    for (let i = pStart; i <= pEnd; i++) {
      const el = elementList[i]
      const isParagraphStart =
        el.value === ZERO && !el.listWrap && current.length > 0
      if (isParagraphStart) {
        if (current.length) segments.push(current)
        current = []
      }
      current.push(el)
    }
    if (current.length) segments.push(current)
    return segments.filter(seg => seg.some(el => el.listId))
  }

  public computeNativeListStyle(elements: IElement[]): Map<string, number> {
    const widths = new Map<string, number>()
    const { scale, checkbox } = this.options
    const adapter = this.draw.getLayoutHostAdapter()
    const markers = collectListMarkers(elements)
    for (const { anchor, text } of markers) {
      const native = text
        ? adapter.layoutListMarker(elements, anchor, text, 'ltr')
        : undefined
      if (native)
        this.nativeMarkers.set(anchor, {
          ltr: native.shaped.lines[0],
          rtl: adapter.layoutListMarker(elements, anchor, text, 'rtl').shaped
            .lines[0]
        })
      const width =
        anchor.listStyle === ListStyle.CHECKBOX
          ? checkbox.width + this.LIST_GAP
          : (native?.lines[0].rect.width || 0) + this.LIST_GAP
      widths.set(
        anchor.listId!,
        Math.max(widths.get(anchor.listId!) || 0, width * scale)
      )
    }
    for (const { anchor } of markers)
      this.nativeWidths.set(anchor, widths.get(anchor.listId!) || 0)
    return widths
  }

  public drawListStyle(
    ctx: CanvasRenderingContext2D,
    row: LayoutRow,
    position: IElementPosition
  ) {
    const { elementList, offsetX, listIndex, ascent } = row
    const startElement = elementList[0]
    if (
      startElement.value !== ZERO ||
      startElement.listWrap ||
      (row.nativeLine && row.height <= 0)
    )
      return
    // tab width
    let tabWidth = 0
    const { defaultTabWidth, scale } = this.options
    for (let i = 1; i < elementList.length; i++) {
      const element = elementList[i]
      if (element?.type !== ElementType.TAB) break
      tabWidth += defaultTabWidth * scale
    }
    // 列表样式渲染
    const {
      coordinate: {
        leftTop: [startX, startY]
      }
    } = position
    let indentWidth = startElement.listLevel
      ? this.LIST_INDENT_WIDTH * startElement.listLevel * scale
      : 0
    // RTL：ZERO 已在内容右缘，标记画在其右侧 gutter（宽=listStyleWidth），
    // 右对齐使间距落在标记左侧（标记与内容之间）；LTR 标记在左 gutter 左对齐
    const isRtl = row.direction === 'rtl'
    const listStyleWidth = this.nativeWidths.get(startElement) || 0
    if (row.flow?.indent != null)
      indentWidth = Math.max(0, row.flow.indent * scale - listStyleWidth)
    const x = isRtl
      ? startX + listStyleWidth - tabWidth
      : startX - offsetX! + indentWidth + tabWidth
    const y = startY + ascent
    // 复选框样式特殊处理
    if (startElement.listStyle === ListStyle.CHECKBOX) {
      const { width, height, gap } = this.options.checkbox
      this.draw.getCheckboxParticle().render({
        ctx,
        x: x - gap * scale,
        y,
        index: 0,
        row,
        metrics: {
          ...rowElementMetrics(row, 0, scale, this.options.defaultSize),
          width: (width + gap * 2) * scale,
          height: height * scale
        }
      })
    } else {
      let text = ''
      if (startElement.listType === ListType.UL) {
        const level = startElement.listLevel ?? 0
        const rotation = [UlStyle.DISC, UlStyle.CIRCLE, UlStyle.SQUARE]
        const rotated = rotation[level % rotation.length]
        const fallbackStyle =
          level === 0
            ? <UlStyle>(<unknown>startElement.listStyle) || UlStyle.DISC
            : rotated
        text = ulStyleMapping[fallbackStyle] || ulStyleMapping[UlStyle.DISC]
      } else {
        text = `${listIndex! + 1}${KeyMap.PERIOD}`
      }
      if (!text) return
      const adapter = this.draw.getLayoutHostAdapter()
      const cached = this.nativeMarkers.get(startElement)
      const direction = isRtl ? 'rtl' : 'ltr'
      const shaped =
        cached?.[direction] ||
        adapter.layoutListMarker(
          elementList,
          startElement,
          listMarkerText(startElement, listIndex || 0),
          direction
        ).shaped.lines[0]
      const line = scaleShapedLine(shaped, scale)
      adapter
        .getGlyphRenderer()
        .drawLine(ctx, line, isRtl ? x - line.width : x, y)
      return
    }
  }
}
