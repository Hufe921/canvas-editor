import { ZERO } from '../../../dataset/constant/Common'
import { ulStyleMapping } from '../../../dataset/constant/List'
import { ElementType } from '../../../dataset/enum/Element'
import { KeyMap } from '../../../dataset/enum/KeyMap'
import { ListStyle, ListType, UlStyle } from '../../../dataset/enum/List'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IElement, IElementPosition } from '../../../interface/Element'
import { IRow, IRowElement } from '../../../interface/Row'
import { getUUID } from '../../../utils'
import { RangeManager } from '../../range/RangeManager'
import { Draw } from '../Draw'

export class ListParticle {
  private draw: Draw
  private range: RangeManager
  private options: DeepRequired<IEditorOption>

  // 非递增样式直接返回默认值
  private readonly UN_COUNT_STYLE_WIDTH = 20
  private readonly MEASURE_BASE_TEXT = '0'
  private readonly LIST_GAP = 10
  public readonly LIST_INDENT_WIDTH = 30
  private readonly MAX_LEVEL = 8

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
    changeElementList.forEach(el => {
      el.listId = listId
      el.listType = listType
      el.listStyle = listStyle
      el.listLevel = 0
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
    changeElementList.forEach(el => {
      delete el.listId
      delete el.listType
      delete el.listStyle
      delete el.listWrap
      delete el.listLevel
    })
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
    segment.forEach(el => {
      el.listId = listId
      el.listLevel = targetLevel
      if (firstEl.listType) {
        el.listType = firstEl.listType
      }
      if (firstEl.listStyle) {
        el.listStyle = firstEl.listStyle
      }
    })
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
    delete element.listId
    delete element.listType
    delete element.listStyle
    delete element.listWrap
    delete element.listLevel
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

  public computeListStyle(
    ctx: CanvasRenderingContext2D,
    elementList: IElement[]
  ): Map<string, number> {
    const listStyleMap = new Map<string, number>()
    let start = 0
    let curListId = elementList[start].listId
    let curElementList: IElement[] = []
    const elementLength = elementList.length
    while (start < elementLength) {
      const curElement = elementList[start]
      if (curListId && curListId === curElement.listId) {
        curElementList.push(curElement)
      } else {
        if (curElement.listId && curElement.listId !== curListId) {
          // 列表结束
          if (curElementList.length) {
            const width = this.getListStyleWidth(ctx, curElementList)
            listStyleMap.set(curListId!, width)
          }
          curListId = curElement.listId
          curElementList = curListId ? [curElement] : []
        }
      }
      start++
    }
    if (curElementList.length) {
      const width = this.getListStyleWidth(ctx, curElementList)
      listStyleMap.set(curListId!, width)
    }
    return listStyleMap
  }

  private findStyledElement(elementList: IElement[]): IElement {
    let styleElement = elementList[0]
    for (let i = 1; i < elementList.length; i++) {
      const element = elementList[i]
      if (element.font || element.size || element.bold || element.italic) {
        styleElement = element
        break
      }
    }
    return styleElement
  }

  private getListFontStyle(elementList: IElement[], scale: number): string {
    if (this.options.list.inheritStyle) {
      const styleElement = this.findStyledElement(elementList)
      return this.draw.getElementFont(styleElement, scale)
    } else {
      const { defaultFont, defaultSize } = this.options
      return `${defaultSize * scale}px ${defaultFont}`
    }
  }

  public getListStyleWidth(
    ctx: CanvasRenderingContext2D,
    listElementList: IElement[]
  ): number {
    const { scale, checkbox } = this.options
    const startElement = listElementList[0]
    // 非递增样式返回固定值
    if (
      startElement.listStyle &&
      startElement.listStyle !== ListStyle.DECIMAL
    ) {
      if (startElement.listStyle === ListStyle.CHECKBOX) {
        return (checkbox.width + this.LIST_GAP) * scale
      }
      return this.UN_COUNT_STYLE_WIDTH * scale
    }
    // 计算列表数量
    const count = listElementList.reduce((pre, cur) => {
      if (cur.value === ZERO) {
        pre += 1
      }
      return pre
    }, 0)
    if (!count) return 0
    ctx.save()
    ctx.font = this.getListFontStyle(listElementList, scale)
    // 以递增样式最大宽度为准
    const text = `${this.MEASURE_BASE_TEXT.repeat(String(count).length - 1 || 1)}${
      KeyMap.PERIOD
    }`
    const textMetrics = ctx.measureText(text)
    ctx.restore()
    return Math.ceil((textMetrics.width + this.LIST_GAP) * scale)
  }

  public drawListStyle(
    ctx: CanvasRenderingContext2D,
    row: IRow,
    position: IElementPosition
  ) {
    const { elementList, offsetX, listIndex, ascent } = row
    const startElement = elementList[0]
    if (startElement.value !== ZERO || startElement.listWrap) return
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
    const indentWidth = startElement.listLevel
      ? this.LIST_INDENT_WIDTH * startElement.listLevel * scale
      : 0
    const x = startX - offsetX! + indentWidth + tabWidth
    const y = startY + ascent
    // 复选框样式特殊处理
    if (startElement.listStyle === ListStyle.CHECKBOX) {
      const { width, height, gap } = this.options.checkbox
      const checkboxRowElement: IRowElement = {
        ...startElement,
        checkbox: {
          value: !!startElement.checkbox?.value
        },
        metrics: {
          ...startElement.metrics,
          width: (width + gap * 2) * scale,
          height: height * scale
        }
      }
      this.draw.getCheckboxParticle().render({
        ctx,
        x: x - gap * scale,
        y,
        index: 0,
        row: {
          ...row,
          elementList: [checkboxRowElement, ...row.elementList]
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
      ctx.save()
      ctx.font = this.getListFontStyle(elementList, scale)
      ctx.fillText(text, x, y)
      ctx.restore()
    }
  }
}
