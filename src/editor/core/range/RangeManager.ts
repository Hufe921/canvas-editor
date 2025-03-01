import { ElementType } from '../..'
import { ZERO } from '../../dataset/constant/Common'
import { TEXTLIKE_ELEMENT_TYPE } from '../../dataset/constant/Element'
import { ControlComponent } from '../../dataset/enum/Control'
import { EditorContext } from '../../dataset/enum/Editor'
import { IControlContext } from '../../interface/Control'
import { IEditorOption } from '../../interface/Editor'
import { IElement } from '../../interface/Element'
import { EventBusMap } from '../../interface/EventBus'
import { IRangeStyle } from '../../interface/Listener'
import {
  IRange,
  IRangeElementStyle,
  IRangeParagraphInfo,
  RangeRowArray,
  RangeRowMap
} from '../../interface/Range'
import { getAnchorElement } from '../../utils/element'
import { Draw } from '../draw/Draw'
import { EventBus } from '../event/eventbus/EventBus'
import { HistoryManager } from '../history/HistoryManager'
import { Listener } from '../listener/Listener'
import { Position } from '../position/Position'

export class RangeManager {
  private draw: Draw
  private options: Required<IEditorOption>
  private range: IRange
  private listener: Listener
  private eventBus: EventBus<EventBusMap>
  private position: Position
  private historyManager: HistoryManager
  private defaultStyle: IRangeElementStyle | null

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.listener = draw.getListener()
    this.eventBus = draw.getEventBus()
    this.position = draw.getPosition()
    this.historyManager = draw.getHistoryManager()
    this.range = {
      startIndex: -1,
      endIndex: -1
    }
    this.defaultStyle = null
  }

  public getRange(): IRange {
    return this.range
  }

  public clearRange() {
    this.setRange(-1, -1)
  }

  public setDefaultStyle(style: IRangeElementStyle | null) {
    if (!style) {
      this.defaultStyle = null
    } else {
      this.defaultStyle = {
        ...this.defaultStyle,
        ...style
      }
    }
  }

  public getDefaultStyle(): IRangeElementStyle | null {
    return this.defaultStyle
  }

  public getRangeAnchorStyle(
    elementList: IElement[],
    anchorIndex: number
  ): IElement | null {
    const anchorElement = getAnchorElement(elementList, anchorIndex)
    if (!anchorElement) return null
    return {
      ...anchorElement,
      ...this.defaultStyle
    }
  }

  public getIsRangeChange(
    startIndex: number,
    endIndex: number,
    tableId?: string,
    startTdIndex?: number,
    endTdIndex?: number,
    startTrIndex?: number,
    endTrIndex?: number
  ): boolean {
    return (
      this.range.startIndex !== startIndex ||
      this.range.endIndex !== endIndex ||
      this.range.tableId !== tableId ||
      this.range.startTdIndex !== startTdIndex ||
      this.range.endTdIndex !== endTdIndex ||
      this.range.startTrIndex !== startTrIndex ||
      this.range.endTrIndex !== endTrIndex
    )
  }

  public getIsCollapsed(): boolean {
    const { startIndex, endIndex } = this.range
    return startIndex === endIndex
  }

  public getIsSelection(): boolean {
    const { startIndex, endIndex } = this.range
    if (!~startIndex && !~endIndex) return false
    return startIndex !== endIndex
  }

  public getSelection(): IElement[] | null {
    const { startIndex, endIndex } = this.range
    if (startIndex === endIndex) return null
    const elementList = this.draw.getElementList()
    return elementList.slice(startIndex + 1, endIndex + 1)
  }

  public getSelectionElementList(): IElement[] | null {
    if (this.range.isCrossRowCol) {
      const rowCol = this.draw.getTableParticle().getRangeRowCol()
      if (!rowCol) return null
      const elementList: IElement[] = []
      for (let r = 0; r < rowCol.length; r++) {
        const row = rowCol[r]
        for (let c = 0; c < row.length; c++) {
          const col = row[c]
          elementList.push(...col.value)
        }
      }
      return elementList
    }
    return this.getSelection()
  }

  public getTextLikeSelection(): IElement[] | null {
    const selection = this.getSelection()
    if (!selection) return null
    return selection.filter(
      s => !s.type || TEXTLIKE_ELEMENT_TYPE.includes(s.type)
    )
  }

  public getTextLikeSelectionElementList(): IElement[] | null {
    const selection = this.getSelectionElementList()
    if (!selection) return null
    return selection.filter(
      s => !s.type || TEXTLIKE_ELEMENT_TYPE.includes(s.type)
    )
  }

  // 获取光标所选位置行信息
  public getRangeRow(): RangeRowMap | null {
    const { startIndex, endIndex } = this.range
    if (!~startIndex && !~endIndex) return null
    const positionList = this.position.getPositionList()
    const rangeRow: RangeRowMap = new Map()
    for (let p = startIndex; p < endIndex + 1; p++) {
      const { pageNo, rowNo } = positionList[p]
      const rowSet = rangeRow.get(pageNo)
      if (!rowSet) {
        rangeRow.set(pageNo, new Set([rowNo]))
      } else {
        if (!rowSet.has(rowNo)) {
          rowSet.add(rowNo)
        }
      }
    }
    return rangeRow
  }

  // 获取光标所选位置元素列表
  public getRangeRowElementList(): IElement[] | null {
    const { startIndex, endIndex, isCrossRowCol } = this.range
    if (!~startIndex && !~endIndex) return null
    if (isCrossRowCol) {
      return this.getSelectionElementList()
    }
    // 选区行信息
    const rangeRow = this.getRangeRow()
    if (!rangeRow) return null
    const positionList = this.position.getPositionList()
    const elementList = this.draw.getElementList()
    // 当前选区所在行
    const rowElementList: IElement[] = []
    for (let p = 0; p < positionList.length; p++) {
      const position = positionList[p]
      const rowSet = rangeRow.get(position.pageNo)
      if (!rowSet) continue
      if (rowSet.has(position.rowNo)) {
        rowElementList.push(elementList[p])
      }
    }
    return rowElementList
  }

  // 获取选取段落信息
  public getRangeParagraph(): RangeRowArray | null {
    const { startIndex, endIndex } = this.range
    if (!~startIndex && !~endIndex) return null
    const positionList = this.position.getPositionList()
    const elementList = this.draw.getElementList()
    const rangeRow: RangeRowArray = new Map()
    // 向上查找
    let start = startIndex
    while (start >= 0) {
      const { pageNo, rowNo } = positionList[start]
      let rowArray = rangeRow.get(pageNo)
      if (!rowArray) {
        rowArray = []
        rangeRow.set(pageNo, rowArray)
      }
      if (!rowArray.includes(rowNo)) {
        rowArray.unshift(rowNo)
      }
      const element = elementList[start]
      const preElement = elementList[start - 1]
      if (
        (element.value === ZERO && !element.listWrap) ||
        element.listId !== preElement?.listId ||
        element.titleId !== preElement?.titleId
      ) {
        break
      }
      start--
    }
    const isCollapsed = startIndex === endIndex
    // 中间选择
    if (!isCollapsed) {
      let middle = startIndex + 1
      while (middle < endIndex) {
        const { pageNo, rowNo } = positionList[middle]
        let rowArray = rangeRow.get(pageNo)
        if (!rowArray) {
          rowArray = []
          rangeRow.set(pageNo, rowArray)
        }
        if (!rowArray.includes(rowNo)) {
          rowArray.push(rowNo)
        }
        middle++
      }
    }
    // 向下查找
    let end = endIndex
    // 闭合选区&&首字符为换行符时继续向下查找
    if (isCollapsed && elementList[startIndex].value === ZERO) {
      end += 1
    }
    while (end < positionList.length) {
      const element = elementList[end]
      const nextElement = elementList[end + 1]
      if (
        (element.value === ZERO && !element.listWrap) ||
        element.listId !== nextElement?.listId ||
        element.titleId !== nextElement?.titleId
      ) {
        break
      }
      const { pageNo, rowNo } = positionList[end]
      let rowArray = rangeRow.get(pageNo)
      if (!rowArray) {
        rowArray = []
        rangeRow.set(pageNo, rowArray)
      }
      if (!rowArray.includes(rowNo)) {
        rowArray.push(rowNo)
      }
      end++
    }
    return rangeRow
  }

  // 获取选区段落信息
  public getRangeParagraphInfo(): IRangeParagraphInfo | null {
    const { startIndex, endIndex } = this.range
    if (!~startIndex && !~endIndex) return null
    /// 起始元素位置
    let startPositionIndex = -1
    // 需要改变的元素列表
    const rangeElementList: IElement[] = []
    // 选区行信息
    const rangeRow = this.getRangeParagraph()
    if (!rangeRow) return null
    const elementList = this.draw.getElementList()
    const positionList = this.position.getPositionList()
    for (let p = 0; p < positionList.length; p++) {
      const position = positionList[p]
      const rowArray = rangeRow.get(position.pageNo)
      if (!rowArray) continue
      if (rowArray.includes(position.rowNo)) {
        if (!~startPositionIndex) {
          startPositionIndex = position.index
        }
        rangeElementList.push(elementList[p])
      }
    }
    if (!rangeElementList.length) return null
    return {
      elementList: rangeElementList,
      startIndex: startPositionIndex
    }
  }

  // 获取选区段落元素列表
  public getRangeParagraphElementList(): IElement[] | null {
    return this.getRangeParagraphInfo()?.elementList || null
  }

  // 获取选区表格
  public getRangeTableElement(): IElement | null {
    const positionContext = this.position.getPositionContext()
    if (!positionContext.isTable) return null
    const originalElementList = this.draw.getOriginalElementList()
    return originalElementList[positionContext.index!]
  }

  public getIsSelectAll() {
    const elementList = this.draw.getElementList()
    const { startIndex, endIndex } = this.range
    return (
      startIndex === 0 &&
      elementList.length - 1 === endIndex &&
      !this.position.getPositionContext().isTable
    )
  }

  public getIsPointInRange(x: number, y: number): boolean {
    const { startIndex, endIndex } = this.range
    const positionList = this.position.getPositionList()
    for (let p = startIndex + 1; p <= endIndex; p++) {
      const position = positionList[p]
      if (!position) break
      const {
        coordinate: { leftTop, rightBottom }
      } = positionList[p]
      if (
        x >= leftTop[0] &&
        x <= rightBottom[0] &&
        y >= leftTop[1] &&
        y <= rightBottom[1]
      ) {
        return true
      }
    }
    return false
  }

  public getKeywordRangeList(payload: string): IRange[] {
    const searchMatchList = this.draw
      .getSearch()
      .getMatchList(payload, this.draw.getOriginalElementList())
    const searchRangeMap: Map<string, IRange> = new Map()
    for (const searchMatch of searchMatchList) {
      const searchRange = searchRangeMap.get(searchMatch.groupId)
      if (searchRange) {
        searchRange.endIndex += 1
      } else {
        const { type, groupId, tableId, index, tdIndex, trIndex } = searchMatch
        const range: IRange = {
          startIndex: index,
          endIndex: index
        }
        if (type === EditorContext.TABLE) {
          range.tableId = tableId
          range.startTdIndex = tdIndex
          range.endTdIndex = tdIndex
          range.startTrIndex = trIndex
          range.endTrIndex = trIndex
        }
        searchRangeMap.set(groupId, range)
      }
    }
    const rangeList: IRange[] = []
    searchRangeMap.forEach(searchRange => {
      rangeList.push(searchRange)
    })
    return rangeList
  }

  public getIsCanInput(): boolean {
    const { startIndex, endIndex } = this.getRange()
    if (!~startIndex && !~endIndex) return false
    const elementList = this.draw.getElementList()
    const startElement = elementList[startIndex]
    if (startIndex === endIndex) {
      return (
        (startElement.controlComponent !== ControlComponent.PRE_TEXT ||
          elementList[startIndex + 1]?.controlComponent !==
            ControlComponent.PRE_TEXT) &&
        startElement.controlComponent !== ControlComponent.POST_TEXT
      )
    }
    const endElement = elementList[endIndex]
    // 选区前后不是控件 || 选区前不是控件或是后缀&&选区后不是控件或是后缀 || 选区在控件内
    return (
      (!startElement.controlId && !endElement.controlId) ||
      ((!startElement.controlId ||
        startElement.controlComponent === ControlComponent.POSTFIX) &&
        (!endElement.controlId ||
          endElement.controlComponent === ControlComponent.POSTFIX)) ||
      (!!startElement.controlId &&
        endElement.controlId === startElement.controlId &&
        endElement.controlComponent !== ControlComponent.PRE_TEXT &&
        endElement.controlComponent !== ControlComponent.POST_TEXT &&
        endElement.controlComponent !== ControlComponent.POSTFIX)
    )
  }

  public setRange(
    startIndex: number,
    endIndex: number,
    tableId?: string,
    startTdIndex?: number,
    endTdIndex?: number,
    startTrIndex?: number,
    endTrIndex?: number
  ) {
    // 判断光标是否改变
    const isChange = this.getIsRangeChange(
      startIndex,
      endIndex,
      tableId,
      startTdIndex,
      endTdIndex,
      startTrIndex,
      endTrIndex
    )
    if (isChange) {
      this.range.startIndex = startIndex
      this.range.endIndex = endIndex
      this.range.tableId = tableId
      this.range.startTdIndex = startTdIndex
      this.range.endTdIndex = endTdIndex
      this.range.startTrIndex = startTrIndex
      this.range.endTrIndex = endTrIndex
      this.range.isCrossRowCol = !!(
        startTdIndex ||
        endTdIndex ||
        startTrIndex ||
        endTrIndex
      )
      this.setDefaultStyle(null)
    }
    this.range.zone = this.draw.getZone().getZone()
    // 激活控件
    const control = this.draw.getControl()
    if (~startIndex && ~endIndex) {
      const elementList = this.draw.getElementList()
      const element = elementList[startIndex]
      if (element?.controlId) {
        control.initControl()
        return
      }
    }
    control.destroyControl()
  }

  public replaceRange(range: IRange) {
    this.setRange(
      range.startIndex,
      range.endIndex,
      range.tableId,
      range.startTdIndex,
      range.endTdIndex,
      range.startTrIndex,
      range.endTrIndex
    )
  }

  public shrinkRange() {
    const { startIndex, endIndex } = this.range
    if (startIndex === endIndex || (!~startIndex && !~endIndex)) return
    this.replaceRange({
      ...this.range,
      startIndex: endIndex
    })
  }

  public setRangeStyle() {
    const rangeStyleChangeListener = this.listener.rangeStyleChange
    const isSubscribeRangeStyleChange =
      this.eventBus.isSubscribe('rangeStyleChange')
    if (!rangeStyleChangeListener && !isSubscribeRangeStyleChange) return
    // 结束光标位置
    const { startIndex, endIndex, isCrossRowCol } = this.range
    if (!~startIndex && !~endIndex) return
    let curElement: IElement | null
    if (isCrossRowCol) {
      // 单元格选择以当前表格定位
      const originalElementList = this.draw.getOriginalElementList()
      const positionContext = this.position.getPositionContext()
      curElement = originalElementList[positionContext.index!]
    } else {
      const index = ~endIndex ? endIndex : 0
      // 行首以第一个非换行符元素定位
      const elementList = this.draw.getElementList()
      curElement = this.getRangeAnchorStyle(elementList, index)
    }
    if (!curElement) return
    // 选取元素列表
    const curElementList = this.getSelection() || [curElement]
    // 类型
    const type = curElement.type || ElementType.TEXT
    // 富文本
    const font = curElement.font || this.options.defaultFont
    const size = curElement.size || this.options.defaultSize
    const bold = !~curElementList.findIndex(el => !el.bold)
    const italic = !~curElementList.findIndex(el => !el.italic)
    const underline = !~curElementList.findIndex(
      el => !el.underline && !el.control?.underline
    )
    const strikeout = !~curElementList.findIndex(el => !el.strikeout)
    const color = curElement.color || null
    const highlight = curElement.highlight || null
    const rowFlex = curElement.rowFlex || null
    const rowMargin = curElement.rowMargin ?? this.options.defaultRowMargin
    const dashArray = curElement.dashArray || []
    const level = curElement.level || null
    const listType = curElement.listType || null
    const listStyle = curElement.listStyle || null
    const textDecoration = underline ? curElement.textDecoration || null : null
    // 菜单
    const painter = !!this.draw.getPainterStyle()
    const undo = this.historyManager.isCanUndo()
    const redo = this.historyManager.isCanRedo()
    // 组信息
    const groupIds = curElement.groupIds || null
    // 扩展字段
    const extension = curElement.extension ?? null
    const rangeStyle: IRangeStyle = {
      type,
      undo,
      redo,
      painter,
      font,
      size,
      bold,
      italic,
      underline,
      strikeout,
      color,
      highlight,
      rowFlex,
      rowMargin,
      dashArray,
      level,
      listType,
      listStyle,
      groupIds,
      textDecoration,
      extension
    }
    if (rangeStyleChangeListener) {
      rangeStyleChangeListener(rangeStyle)
    }
    if (isSubscribeRangeStyleChange) {
      this.eventBus.emit('rangeStyleChange', rangeStyle)
    }
  }

  public recoveryRangeStyle() {
    const rangeStyleChangeListener = this.listener.rangeStyleChange
    const isSubscribeRangeStyleChange =
      this.eventBus.isSubscribe('rangeStyleChange')
    if (!rangeStyleChangeListener && !isSubscribeRangeStyleChange) return
    const font = this.options.defaultFont
    const size = this.options.defaultSize
    const rowMargin = this.options.defaultRowMargin
    const painter = !!this.draw.getPainterStyle()
    const undo = this.historyManager.isCanUndo()
    const redo = this.historyManager.isCanRedo()
    const rangeStyle: IRangeStyle = {
      type: null,
      undo,
      redo,
      painter,
      font,
      size,
      bold: false,
      italic: false,
      underline: false,
      strikeout: false,
      color: null,
      highlight: null,
      rowFlex: null,
      rowMargin,
      dashArray: [],
      level: null,
      listType: null,
      listStyle: null,
      groupIds: null,
      textDecoration: null,
      extension: null
    }
    if (rangeStyleChangeListener) {
      rangeStyleChangeListener(rangeStyle)
    }
    if (isSubscribeRangeStyleChange) {
      this.eventBus.emit('rangeStyleChange', rangeStyle)
    }
  }

  public shrinkBoundary(context: IControlContext = {}) {
    const elementList = context.elementList || this.draw.getElementList()
    const range = context.range || this.getRange()
    const { startIndex, endIndex } = range
    if (!~startIndex && !~endIndex) return
    const startElement = elementList[startIndex]
    const endElement = elementList[endIndex]
    if (startIndex === endIndex) {
      if (startElement.controlComponent === ControlComponent.PLACEHOLDER) {
        // 找到第一个placeholder字符
        let index = startIndex - 1
        while (index > 0) {
          const preElement = elementList[index]
          if (
            preElement.controlId !== startElement.controlId ||
            preElement.controlComponent === ControlComponent.PREFIX ||
            preElement.controlComponent === ControlComponent.PRE_TEXT
          ) {
            range.startIndex = index
            range.endIndex = index
            break
          }
          index--
        }
      }
    } else {
      // 首、尾为占位符时，收缩到最后一个前缀字符后
      if (
        startElement.controlComponent === ControlComponent.PLACEHOLDER ||
        endElement.controlComponent === ControlComponent.PLACEHOLDER
      ) {
        let index = endIndex - 1
        while (index > 0) {
          const preElement = elementList[index]
          if (
            preElement.controlId !== endElement.controlId ||
            preElement.controlComponent === ControlComponent.PREFIX ||
            preElement.controlComponent === ControlComponent.PRE_TEXT
          ) {
            range.startIndex = index
            range.endIndex = index
            return
          }
          index--
        }
      }
      // 向右查找到第一个Value
      if (startElement.controlComponent === ControlComponent.PREFIX) {
        let index = startIndex + 1
        while (index < elementList.length) {
          const nextElement = elementList[index]
          if (
            nextElement.controlId !== startElement.controlId ||
            nextElement.controlComponent === ControlComponent.VALUE
          ) {
            range.startIndex = index - 1
            break
          } else if (
            nextElement.controlComponent === ControlComponent.PLACEHOLDER
          ) {
            range.startIndex = index - 1
            range.endIndex = index - 1
            return
          }
          index++
        }
      }
      // 向左查找到第一个Value
      if (endElement.controlComponent !== ControlComponent.VALUE) {
        let index = startIndex - 1
        while (index > 0) {
          const preElement = elementList[index]
          if (
            preElement.controlId !== startElement.controlId ||
            preElement.controlComponent === ControlComponent.VALUE
          ) {
            range.startIndex = index
            break
          } else if (
            preElement.controlComponent === ControlComponent.PLACEHOLDER
          ) {
            range.startIndex = index
            range.endIndex = index
            return
          }
          index--
        }
      }
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    ctx.save()
    ctx.globalAlpha = this.options.rangeAlpha
    ctx.fillStyle = this.options.rangeColor
    ctx.fillRect(x, y, width, height)
    ctx.restore()
  }

  public toString(): string {
    const selection = this.getTextLikeSelection()
    if (!selection) return ''
    return selection
      .map(s => s.value)
      .join('')
      .replace(new RegExp(ZERO, 'g'), '')
  }
}
