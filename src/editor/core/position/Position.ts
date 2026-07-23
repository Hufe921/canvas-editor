import { ElementType, ListStyle, RowFlex, VerticalAlign } from '../..'
import { ZERO } from '../../dataset/constant/Common'
import { ControlComponent } from '../../dataset/enum/Control'
import {
  IComputePageRowPositionPayload,
  IComputePageRowPositionResult,
  IComputeRowPositionPayload,
  IFloatPosition,
  IGetFloatPositionByXYPayload,
  ISetSurroundPositionPayload
} from '../../interface/Position'
import { IEditorOption } from '../../interface/Editor'
import { IElement, IElementPosition } from '../../interface/Element'
import { ITd } from '../../interface/table/Td'
import {
  ICurrentPosition,
  IGetPositionByXYPayload,
  IPositionContext,
  ITablePositionContext
} from '../../interface/Position'
import { Draw } from '../draw/Draw'
import { EditorMode, EditorZone } from '../../dataset/enum/Editor'
import { deepClone, isRectIntersect } from '../../utils'
import { ImageDisplay } from '../../dataset/enum/Common'
import { DeepRequired } from '../../interface/Common'
import { EventBus } from '../event/eventbus/EventBus'
import { EventBusMap } from '../../interface/EventBus'
import { getIsBlockElement } from '../../utils/element'

export class Position {
  private cursorPosition: IElementPosition | null
  private positionContext: IPositionContext
  private positionList: IElementPosition[]
  // 表格跨页片段位置列表（含全部片段；主列表仅保留首片段以维持下标对齐）
  private tablePagingPositionList: IElementPosition[]
  private floatPositionList: IFloatPosition[]

  private draw: Draw
  private eventBus: EventBus<EventBusMap>
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.positionList = []
    this.tablePagingPositionList = []
    this.floatPositionList = []
    this.cursorPosition = null
    this.positionContext = {
      isTable: false,
      isControl: false
    }

    this.draw = draw
    this.eventBus = draw.getEventBus()
    this.options = draw.getOptions()
  }

  public getFloatPositionList(): IFloatPosition[] {
    return this.floatPositionList
  }

  public getTablePagingPositionList(): IElementPosition[] {
    return this.tablePagingPositionList
  }

  // 按元素索引与页码查找表格跨页片段位置；
  // 同页存在多个片段（分栏）时按锚点坐标所属片段进一步区分
  public getTableFragmentPosition(
    index: number,
    pageNo: number,
    anchorPosition?: IElementPosition | null
  ): IElementPosition | null {
    const fragmentPositionList = this.tablePagingPositionList.filter(
      position => position.index === index && position.pageNo === pageNo
    )
    if (fragmentPositionList.length <= 1) {
      return fragmentPositionList[0] || null
    }
    if (anchorPosition) {
      const {
        coordinate: { leftTop, rightBottom }
      } = anchorPosition
      const matched = fragmentPositionList.find(position => {
        const {
          leftTop: fragLeftTop,
          rightTop: fragRightTop,
          leftBottom: fragLeftBottom
        } = position.coordinate
        return (
          leftTop[0] >= fragLeftTop[0] &&
          rightBottom[0] <= fragRightTop[0] &&
          leftTop[1] >= fragLeftTop[1] &&
          rightBottom[1] <= fragLeftBottom[1]
        )
      })
      if (matched) return matched
    }
    return fragmentPositionList[0]
  }

  public getTablePositionList(
    sourceElementList: IElement[]
  ): IElementPosition[] {
    return (
      this.getTableTdByContext(sourceElementList, this.positionContext)
        ?.positionList || []
    )
  }

  public getTableTdByContext(
    sourceElementList: IElement[],
    context: IPositionContext
  ) {
    const tablePath = context.tablePath?.length
      ? context.tablePath
      : this._getTablePathByContext(context)
    let elementList = sourceElementList
    let td = null
    for (let p = 0; p < tablePath.length; p++) {
      const { index, trIndex, tdIndex } = tablePath[p]
      td = elementList[index]?.trList?.[trIndex]?.tdList[tdIndex] || null
      if (!td) return null
      elementList = td.value
    }
    return td
  }

  public buildTablePositionContext(
    context: IPositionContext,
    element: IElement,
    trIndex: number,
    tdIndex: number
  ): IPositionContext {
    const tr = element.trList![trIndex]
    const td = tr.tdList[tdIndex]
    const tablePath = context.tablePath?.length
      ? context.tablePath.map((item, itemIndex, tablePath) =>
          itemIndex === tablePath.length - 1
            ? {
                ...item,
                trIndex,
                tdIndex,
                tdId: td.id,
                trId: tr.id,
                tableId: element.id
              }
            : item
        )
      : undefined
    return {
      ...context,
      isTable: true,
      trIndex,
      tdIndex,
      tdId: td.id,
      trId: tr.id,
      tableId: element.id,
      tablePath
    }
  }

  public getTableElementByContext(
    sourceElementList: IElement[],
    context: IPositionContext
  ) {
    const tablePath = context.tablePath?.length
      ? context.tablePath
      : this._getTablePathByContext(context)
    let elementList = sourceElementList
    let tableElement = null
    for (let p = 0; p < tablePath.length; p++) {
      const { index, trIndex, tdIndex } = tablePath[p]
      tableElement = elementList[index] || null
      if (!tableElement) return null
      if (p === tablePath.length - 1) break
      const td = tableElement.trList?.[trIndex]?.tdList[tdIndex]
      if (!td) return null
      elementList = td.value
    }
    return tableElement
  }

  public getTableElementPositionByContext(
    sourceElementList: IElement[],
    sourcePositionList: IElementPosition[],
    context: IPositionContext
  ) {
    const tablePath = context.tablePath?.length
      ? context.tablePath
      : this._getTablePathByContext(context)
    let elementList = sourceElementList
    let positionList = sourcePositionList
    let tablePosition = null
    for (let p = 0; p < tablePath.length; p++) {
      const { index, trIndex, tdIndex } = tablePath[p]
      tablePosition = positionList[index] || null
      const tableElement = elementList[index]
      if (!tablePosition || !tableElement) return null
      if (p === tablePath.length - 1) break
      const td = tableElement.trList?.[trIndex]?.tdList[tdIndex]
      if (!td) return null
      elementList = td.value
      positionList = td.positionList || []
    }
    // 表格跨页拆分渲染时定位到光标所在片段
    if (tablePosition?.tableFragment) {
      const td = this.getTableTdByContext(sourceElementList, context)
      // 单元格可能跨页，优先取光标实际所在位置页码
      const cursorPosition = this.getCursorPosition()
      const isCursorInTd =
        !!td && !!cursorPosition && !!td.positionList?.includes(cursorPosition)
      const tdPageNo = isCursorInTd
        ? cursorPosition!.pageNo
        : td?.positionList?.[0]?.pageNo
      if (tdPageNo !== undefined) {
        const fragmentPosition = this.getTableFragmentPosition(
          tablePosition.index,
          tdPageNo,
          // 同页多栏片段按光标（或单元格首个位置）坐标区分所属片段
          isCursorInTd ? cursorPosition : td?.positionList?.[0]
        )
        if (fragmentPosition) return fragmentPosition
      }
    }
    return tablePosition
  }

  private _getTablePathByContext(
    context: IPositionContext
  ): ITablePositionContext[] {
    const { isTable, index, trIndex, tdIndex, tdId, trId, tableId } = context
    if (
      !isTable ||
      index === undefined ||
      trIndex === undefined ||
      tdIndex === undefined
    ) {
      return []
    }
    return [
      {
        index,
        trIndex,
        tdIndex,
        tdId,
        trId,
        tableId
      }
    ]
  }

  public getPositionList(): IElementPosition[] {
    return this.positionContext.isTable
      ? this.getTablePositionList(this.draw.getOriginalElementList())
      : this.getOriginalPositionList()
  }

  public getMainPositionList(): IElementPosition[] {
    return this.positionContext.isTable
      ? this.getTablePositionList(this.draw.getOriginalMainElementList())
      : this.positionList
  }

  public getOriginalPositionList(): IElementPosition[] {
    const zoneManager = this.draw.getZone()
    if (zoneManager.isHeaderActive()) {
      const header = this.draw.getHeader()
      return header.getPositionList()
    }
    if (zoneManager.isFooterActive()) {
      const footer = this.draw.getFooter()
      return footer.getPositionList()
    }
    return this.positionList
  }

  public getOriginalMainPositionList(): IElementPosition[] {
    return this.positionList
  }

  public getSelectionPositionList(): IElementPosition[] | null {
    const { startIndex, endIndex } = this.draw.getRange().getRange()
    if (startIndex === endIndex) return null
    const positionList = this.getPositionList()
    return positionList.slice(startIndex + 1, endIndex + 1)
  }

  public setPositionList(payload: IElementPosition[]) {
    this.positionList = payload
  }

  public setFloatPositionList(payload: IFloatPosition[]) {
    this.floatPositionList = payload
  }

  public getFloatPositionByElement(element: IElement): IFloatPosition | null {
    return (
      this.floatPositionList.find(
        floatPosition => floatPosition.element === element
      ) || null
    )
  }

  public getFloatPositionCoordinate(floatPosition: IFloatPosition): {
    x: number
    y: number
  } {
    const { scale } = this.options
    const imgFloatPosition = floatPosition.element.imgFloatPosition!
    let x = imgFloatPosition.x * scale
    let y = imgFloatPosition.y * scale
    const { index, isTable, zone } = floatPosition
    if (isTable && index !== undefined) {
      let positionList: IElementPosition[]
      if (zone === EditorZone.HEADER) {
        positionList = this.draw.getHeader().getPositionList()
      } else if (zone === EditorZone.FOOTER) {
        positionList = this.draw.getFooter().getPositionList()
      } else {
        positionList = this.positionList
      }
      let tablePosition = positionList[index]
      // 表格跨页时按浮动元素所在页定位片段（同页多栏按所在位置坐标区分）
      if (tablePosition?.tableFragment) {
        tablePosition =
          this.getTableFragmentPosition(
            index,
            floatPosition.pageNo,
            floatPosition.position
          ) || tablePosition
      }
      if (tablePosition) {
        const {
          coordinate: {
            leftTop: [tableX, tableY]
          }
        } = tablePosition
        x += tableX
        y += tableY
      }
    }
    return { x, y }
  }

  public computePageRowPosition(
    payload: IComputePageRowPositionPayload
  ): IComputePageRowPositionResult {
    const {
      positionList,
      rowList,
      pageNo,
      startX,
      startY,
      startRowIndex,
      startIndex,
      innerWidth,
      zone,
      tablePosition
    } = payload
    const {
      scale,
      table: { tdPadding }
    } = this.options
    let x = startX
    let y = startY
    let index = startIndex
    const traceParticle = this.draw.getTraceParticle()
    const columnLayout = this.draw.getColumnLayout()
    let prevColumnIndex: number | undefined = undefined
    for (let i = 0; i < rowList.length; i++) {
      const curRow = rowList[i]
      // 分栏内栏切换：y 重置到栏顶
      if (
        prevColumnIndex !== undefined &&
        curRow.columnIndex !== undefined &&
        curRow.columnIndex > 0 &&
        curRow.columnIndex !== prevColumnIndex
      ) {
        y = startY
      }
      prevColumnIndex = curRow.columnIndex
      // 分栏偏移与有效宽度
      const inColumn =
        columnLayout &&
        curRow.columnIndex !== undefined &&
        curRow.columnIndex >= 0
      const columnOffset =
        inColumn && columnLayout
          ? columnLayout.offsets[curRow.columnIndex!] || 0
          : 0
      const effectiveInnerWidth =
        inColumn && columnLayout ? columnLayout.width : innerWidth
      x += columnOffset
      // 行存在环绕的可能性均不设置行布局
      if (!curRow.isSurround) {
        // 计算行偏移量（行居中、居右）
        const curRowWidth = curRow.width + (curRow.offsetX || 0)
        if (curRow.rowFlex === RowFlex.CENTER) {
          x += (effectiveInnerWidth - curRowWidth) / 2
        } else if (curRow.rowFlex === RowFlex.RIGHT) {
          x += effectiveInnerWidth - curRowWidth
        }
      }
      // 当前行X/Y轴偏移量
      x += curRow.offsetX || 0
      y += curRow.offsetY || 0
      // 当前td所在位置
      const tablePreX = x
      const tablePreY = y
      for (let j = 0; j < curRow.elementList.length; j++) {
        const element = curRow.elementList[j]
        // 表格跨页片段行：同一数据元素对应多个视觉片段（跨页/跨栏），
        // 索引以行起始数据索引为基准，避免同页多片段时后续元素索引整体错位
        if (curRow.tableFragment) {
          index = curRow.startIndex + j
        }
        const metrics = element.metrics
        const offsetY =
          !element.hide &&
          !traceParticle.isTraceHidden(element) &&
          ((element.imgDisplay !== ImageDisplay.INLINE &&
            element.type === ElementType.IMAGE) ||
            element.type === ElementType.LATEX)
            ? curRow.ascent - metrics.height
            : curRow.ascent
        // 偏移量（内部计算使用）
        if (element.left) {
          x += element.left
        }
        // 偏移量（外部传入）
        if (element.translateX) {
          x += element.translateX * scale
        }
        const positionItem: IElementPosition = {
          pageNo,
          index,
          value: element.value,
          rowIndex: startRowIndex + i,
          // 表格单元格内行号为绝对序号（拆分窗口的续排位置与原窗口位置不冲突）；
          // 正文保持页内行号（页首行查找依赖 rowNo === 0）
          rowNo: payload.isTable ? startRowIndex + i : i,
          metrics,
          left: element.left || 0,
          ascent: offsetY,
          lineHeight: curRow.height,
          isFirstLetter: j === 0,
          isLastLetter: j === curRow.elementList.length - 1,
          columnIndex: curRow.columnIndex,
          coordinate: {
            leftTop: [x, y],
            leftBottom: [x, y + curRow.height],
            rightTop: [x + metrics.width, y],
            rightBottom: [x + metrics.width, y + curRow.height]
          }
        }
        // 缓存浮动元素信息
        if (
          element.imgDisplay === ImageDisplay.SURROUND ||
          element.imgDisplay === ImageDisplay.FLOAT_TOP ||
          element.imgDisplay === ImageDisplay.FLOAT_BOTTOM
        ) {
          // 浮动元素使用上一位置信息
          const prePosition = positionList[positionList.length - 1]
          if (prePosition) {
            positionItem.metrics = prePosition.metrics
            positionItem.coordinate = prePosition.coordinate
          }
          // 兼容浮动元素初始坐标为空的情况-默认使用左上坐标
          if (!element.imgFloatPosition) {
            const tableLeftTop = tablePosition?.coordinate.leftTop
            element.imgFloatPosition = {
              x: tableLeftTop ? x - tableLeftTop[0] : x,
              y: tableLeftTop ? y - tableLeftTop[1] : y,
              pageNo
            }
          }
          this.floatPositionList.push({
            pageNo,
            element,
            position: positionItem,
            isTable: payload.isTable,
            index: payload.index,
            tdIndex: payload.tdIndex,
            trIndex: payload.trIndex,
            tdValueIndex: index,
            zone
          })
        }
        // 表格跨页片段：首个非续排片段位置入主列表（保持与元素列表一一对应），
        // 所有片段入侧边列表；元素索引始终递增
        const tableFragment = curRow.tableFragment
        if (tableFragment) {
          positionItem.tableFragment = tableFragment
          curRow.fragmentPosition = positionItem
          this.tablePagingPositionList.push(positionItem)
          if (
            tableFragment.startTrIndex === 0 &&
            !tableFragment.startSplitTrOffset
          ) {
            positionList.push(positionItem)
          }
        } else {
          positionList.push(positionItem)
        }
        index++
        x += metrics.width
        // 计算表格内元素位置
        if (
          element.type === ElementType.TABLE &&
          !element.hide &&
          !traceParticle.isTraceHidden(element)
        ) {
          const tdPaddingWidth = tdPadding[1] + tdPadding[3]
          // 遍历片段范围行与进位合并单元格，按窗口计算位置（跨页按页累积）
          const fragmentTdList = tableFragment
            ? this.draw
                .getTableParticle()
                .getFragmentTdList(element, tableFragment)
            : element.trList!.flatMap(tr => tr.tdList)
          for (const td of fragmentTdList) {
            let isSplitWindow = false
            let isContinuation = false
            let windowStart = 0
            let windowEnd = td.height!
            if (tableFragment) {
              ;[windowStart, windowEnd] = this.draw
                .getTableParticle()
                .getTdWindowInFragment(td, element, tableFragment)
              if (windowEnd <= windowStart) continue
              isSplitWindow = windowStart > 0 || windowEnd < td.height!
              isContinuation = windowStart > 0
            }
            // 拆分窗口：本片段仅计算窗口内的内容行位置
            let rowList = td.rowList!
            let startIndex = 0
            let startRowIndex = 0
            if (isSplitWindow) {
              const visible = this.draw
                .getTableParticle()
                .getTdVisibleRowListByWindow(td, windowStart, windowEnd)
              rowList = visible.rowList
              startIndex = visible.startIndex
              startRowIndex = visible.startRowIndex
            }
            // 续排片段追加位置而非清空（同一单元格跨页累积）
            if (!isContinuation) {
              td.positionList = []
            }
            const tdPositionList = td.positionList!
            // 片段内单元格内容纵坐标偏移（窗口顶部在片段内的位置）
            const drawnOffsetY = tableFragment
              ? this.draw
                  .getTableParticle()
                  .getTdWindowOffsetY(windowStart, tableFragment)
              : 0
            const drawRowResult = this.computePageRowPosition({
              positionList: tdPositionList,
              rowList,
              pageNo,
              startRowIndex,
              startIndex,
              startX:
                (td.x! + tdPadding[3]) * scale +
                tablePreX +
                (element.translateX || 0) * scale,
              startY: (td.y! + tdPadding[0]) * scale + tablePreY + drawnOffsetY,
              innerWidth: (td.width! - tdPaddingWidth) * scale,
              isTable: true,
              index: index - 1,
              tdIndex: td.tdIndex!,
              trIndex: td.rowIndex!,
              zone,
              tablePosition: positionItem
            })
            // 垂直对齐方式（拆分窗口单元格按顶端对齐）
            if (!isSplitWindow) {
              this._offsetTdPositionByVerticalAlign(td, tdPositionList)
            }
            x = drawRowResult.x
            y = drawRowResult.y
          }
          // 续页回显表头：仅用于绘制的一次性位置，不参与命中
          if (tableFragment?.repeatTrIndexes?.length) {
            curRow.repeatTdPositionList = []
            let repeatAccHeight = 0
            for (const trIndex of tableFragment.repeatTrIndexes) {
              const tr = element.trList![trIndex]
              for (let d = 0; d < tr.tdList.length; d++) {
                const td = tr.tdList[d]
                const positionList: IElementPosition[] = []
                this.computePageRowPosition({
                  positionList,
                  rowList: td.rowList!,
                  pageNo,
                  startRowIndex: 0,
                  startIndex: 0,
                  startX:
                    (td.x! + tdPadding[3]) * scale +
                    tablePreX +
                    (element.translateX || 0) * scale,
                  startY: (repeatAccHeight + tdPadding[0]) * scale + tablePreY,
                  innerWidth: (td.width! - tdPaddingWidth) * scale,
                  isTable: true,
                  index: index - 1,
                  tdIndex: d,
                  trIndex,
                  zone,
                  tablePosition: positionItem
                })
                this._offsetTdPositionByVerticalAlign(td, positionList)
                curRow.repeatTdPositionList.push({ td, positionList })
              }
              repeatAccHeight += tr.height!
            }
          }
          // 恢复初始x、y
          x = tablePreX
          y = tablePreY
        }
      }
      x = startX
      y += curRow.height
    }
    return { x, y, index }
  }

  // 单元格内容按垂直对齐方式偏移位置
  private _offsetTdPositionByVerticalAlign(
    td: ITd,
    positionList: IElementPosition[]
  ) {
    if (
      td.verticalAlign !== VerticalAlign.MIDDLE &&
      td.verticalAlign !== VerticalAlign.BOTTOM
    ) {
      return
    }
    const {
      scale,
      table: { tdPadding }
    } = this.options
    const tdPaddingHeight = tdPadding[0] + tdPadding[2]
    const rowsHeight = td.rowList!.reduce((pre, cur) => pre + cur.height, 0)
    const blankHeight = (td.height! - tdPaddingHeight) * scale - rowsHeight
    const offsetHeight =
      td.verticalAlign === VerticalAlign.MIDDLE ? blankHeight / 2 : blankHeight
    if (Math.floor(offsetHeight) > 0) {
      positionList.forEach(tdPosition => {
        const {
          coordinate: { leftTop, leftBottom, rightBottom, rightTop }
        } = tdPosition
        leftTop[1] += offsetHeight
        leftBottom[1] += offsetHeight
        rightBottom[1] += offsetHeight
        rightTop[1] += offsetHeight
      })
    }
  }

  public computePositionList() {
    // 置空原位置信息
    this.positionList = []
    this.tablePagingPositionList = []
    // 按每页行计算
    const innerWidth = this.draw.getInnerWidth()
    const pageRowList = this.draw.getPageRowList()
    const margins = this.draw.getMargins()
    const startX = margins[3]
    // 起始位置受页眉影响
    const header = this.draw.getHeader()
    let startRowIndex = 0
    for (let i = 0; i < pageRowList.length; i++) {
      const rowList = pageRowList[i]
      if (!rowList?.length) continue
      const startIndex = rowList[0].startIndex
      // 每页页眉禁用状态不同，startY 需按页计算
      const startY = margins[0] + header.getExtraHeight(i)
      this.computePageRowPosition({
        positionList: this.positionList,
        rowList,
        pageNo: i,
        startRowIndex,
        startIndex,
        startX,
        startY,
        innerWidth
      })
      startRowIndex += rowList.length
    }
  }

  public computeRowPosition(
    payload: IComputeRowPositionPayload
  ): IElementPosition[] {
    const { row, innerWidth } = payload
    const positionList: IElementPosition[] = []
    this.computePageRowPosition({
      positionList,
      innerWidth,
      rowList: [deepClone(row)],
      pageNo: 0,
      startX: 0,
      startY: 0,
      startIndex: 0,
      startRowIndex: 0
    })
    return positionList
  }

  public setCursorPosition(position: IElementPosition | null) {
    this.cursorPosition = position
  }

  public getCursorPosition(): IElementPosition | null {
    return this.cursorPosition
  }

  public getPositionContext(): IPositionContext {
    return this.positionContext
  }

  public setPositionContext(payload: IPositionContext) {
    this.eventBus.emit('positionContextChange', {
      value: payload,
      oldValue: this.positionContext
    })
    this.positionContext = payload
  }

  // 根据 x 坐标推断点击位置所属的分栏索引；无分栏布局时返回 undefined
  private _getColumnIndexByX(x: number): number | undefined {
    const layout = this.draw.getColumnLayout()
    if (!layout) return
    const startX = this.draw.getMargins()[3]
    const xRel = x - startX
    // 栏范围 [colStart, nextColStart)，gap 算入左侧栏，避免点击栏间空白时误判
    for (let i = 0; i < layout.count; i++) {
      const colStart = layout.offsets[i]
      const colEnd =
        i < layout.count - 1 ? layout.offsets[i + 1] : colStart + layout.width
      if (xRel >= colStart && xRel < colEnd) {
        return i
      }
    }
    // 超出最后一栏右边界时按最后一栏处理
    return layout.count - 1
  }

  // 表格被命中时下钻查找单元格内位置（未命中单元格返回 null）
  private _getTableChildPositionByXY(payload: {
    x: number
    y: number
    pageNo: number
    element: IElement
    index: number
    tablePosition: IElementPosition
  }): ICurrentPosition | null {
    const { x, y, pageNo, element, index, tablePosition } = payload
    const { scale } = this.options
    const fragment = tablePosition.tableFragment
    // 片段内仅枚举范围行与进位合并单元格，避免全表扫描
    const tdList = fragment
      ? this.draw.getTableParticle().getFragmentTdList(element, fragment)
      : element.trList!.flatMap(tr => tr.tdList)
    for (const td of tdList) {
      const t = td.rowIndex!
      const d = td.tdIndex!
      const tr = element.trList![t]
      // 片段内按可见窗口过滤：拆分/进位窗口外的区域不参与命中
      if (fragment) {
        const [windowStart, windowEnd] = this.draw
          .getTableParticle()
          .getTdWindowInFragment(td, element, fragment)
        if (windowEnd <= windowStart) continue
        const tdTop =
          tablePosition.coordinate.leftTop[1] +
          td.y! * scale +
          this.draw.getTableParticle().getTdWindowOffsetY(windowStart, fragment)
        const tdBottom = tdTop + (windowEnd - windowStart) * scale
        if (y < tdTop || y > tdBottom) continue
      }
      const childPosition = this.getPositionByXY({
        x,
        y,
        td,
        pageNo,
        tablePosition,
        isTable: true,
        elementList: td.value,
        positionList: td.positionList
      })
      if (~childPosition.index) {
        const {
          index: childPositionIndex,
          isTable: isNestedTable,
          hitLineStartIndex,
          tablePath = []
        } = childPosition
        const tablePathItem = {
          index,
          trIndex: t,
          tdIndex: d,
          tdId: td.id,
          trId: tr.id,
          tableId: element.id
        }
        if (isNestedTable) {
          return {
            ...childPosition,
            index,
            tablePath: [tablePathItem, ...tablePath],
            hitLineStartIndex
          }
        }
        const tdValueElement = td.value[childPositionIndex]
        return {
          index,
          isCheckbox:
            childPosition.isCheckbox ||
            tdValueElement.type === ElementType.CHECKBOX ||
            tdValueElement.controlComponent === ControlComponent.CHECKBOX,
          isRadio:
            tdValueElement.type === ElementType.RADIO ||
            tdValueElement.controlComponent === ControlComponent.RADIO,
          isControl: !!tdValueElement.controlId,
          isImage: childPosition.isImage,
          isDirectHit: childPosition.isDirectHit,
          isTable: true,
          tdIndex: d,
          trIndex: t,
          tdValueIndex: childPositionIndex,
          tdId: td.id,
          trId: tr.id,
          tableId: element.id,
          tablePath: [tablePathItem],
          hitLineStartIndex
        }
      }
    }
    return null
  }

  public getPositionByXY(payload: IGetPositionByXYPayload): ICurrentPosition {
    const { x, y, isTable } = payload
    let { elementList, positionList } = payload
    if (!elementList) {
      elementList = this.draw.getOriginalElementList()
    }
    if (!positionList) {
      positionList = this.getOriginalPositionList()
    }
    const zoneManager = this.draw.getZone()
    const curPageNo = payload.pageNo ?? this.draw.getPageNo()
    const isMainActive = zoneManager.isMainActive()
    const positionNo = curPageNo
    // 验证浮于文字上方元素
    if (!isTable) {
      const floatTopPosition = this.getFloatPositionByXY({
        ...payload,
        imgDisplays: [ImageDisplay.FLOAT_TOP, ImageDisplay.SURROUND]
      })
      if (floatTopPosition) return floatTopPosition
    }
    // 普通元素
    for (let j = 0; j < positionList.length; j++) {
      const {
        index,
        pageNo,
        left,
        isFirstLetter,
        coordinate: { leftTop, rightTop, leftBottom }
      } = positionList[j]
      // 页眉/页脚的 positionList 跨页共享，坐标是页内的，按坐标命中即可
      if (isMainActive) {
        if (positionNo !== pageNo) continue
        if (pageNo > positionNo) break
      }
      // 命中元素
      if (
        leftTop[0] - left <= x &&
        rightTop[0] >= x &&
        leftTop[1] <= y &&
        leftBottom[1] >= y
      ) {
        let curPositionIndex = j
        const element = elementList[j]
        // 表格被命中
        if (element.type === ElementType.TABLE) {
          const tableChildPosition = this._getTableChildPositionByXY({
            x,
            y,
            pageNo: curPageNo,
            element,
            index,
            tablePosition: positionList[j]
          })
          if (tableChildPosition) return tableChildPosition
        }
        // 图片区域均为命中
        if (
          element.type === ElementType.IMAGE ||
          element.type === ElementType.LATEX
        ) {
          return {
            index: curPositionIndex,
            isDirectHit: true,
            isImage: true
          }
        }
        if (
          element.type === ElementType.CHECKBOX ||
          element.controlComponent === ControlComponent.CHECKBOX
        ) {
          return {
            index: curPositionIndex,
            isDirectHit: true,
            isCheckbox: true
          }
        }
        // 标签元素检测
        if (element.type === ElementType.LABEL) {
          return {
            index: curPositionIndex,
            isDirectHit: true,
            isLabel: true
          }
        }
        if (
          element.type === ElementType.TAB &&
          element.listStyle === ListStyle.CHECKBOX
        ) {
          // 向前找checkbox元素
          let index = curPositionIndex - 1
          while (index > 0) {
            const element = elementList[index]
            if (
              element.value === ZERO &&
              element.listStyle === ListStyle.CHECKBOX
            ) {
              break
            }
            index--
          }
          return {
            index,
            isDirectHit: true,
            isCheckbox: true
          }
        }
        if (
          element.type === ElementType.RADIO ||
          element.controlComponent === ControlComponent.RADIO
        ) {
          return {
            index: curPositionIndex,
            isDirectHit: true,
            isRadio: true
          }
        }
        let hitLineStartIndex: number | undefined
        // 判断是否在文字中间前后
        if (elementList[index].value !== ZERO) {
          const valueWidth = rightTop[0] - leftTop[0]
          if (x < leftTop[0] + valueWidth / 2) {
            curPositionIndex = j - 1
            if (isFirstLetter) {
              hitLineStartIndex = j
            }
          }
        }
        return {
          isDirectHit: true,
          hitLineStartIndex,
          index: curPositionIndex,
          isControl: !!element.controlId
        }
      }
    }
    // 表格跨页片段命中（非首片段的位置记录不在主列表中）
    if (!isTable && isMainActive) {
      for (const fragmentPosition of this.tablePagingPositionList) {
        if (fragmentPosition.pageNo !== curPageNo) continue
        const {
          index,
          coordinate: { leftTop, rightTop, leftBottom }
        } = fragmentPosition
        if (
          leftTop[0] <= x &&
          rightTop[0] >= x &&
          leftTop[1] <= y &&
          leftBottom[1] >= y
        ) {
          const element = elementList[index]
          if (element?.type === ElementType.TABLE) {
            const tableChildPosition = this._getTableChildPositionByXY({
              x,
              y,
              pageNo: curPageNo,
              element,
              index,
              tablePosition: fragmentPosition
            })
            if (tableChildPosition) return tableChildPosition
          }
        }
      }
    }
    // 验证衬于文字下方元素
    if (!isTable) {
      const floatBottomPosition = this.getFloatPositionByXY({
        ...payload,
        imgDisplays: [ImageDisplay.FLOAT_BOTTOM]
      })
      if (floatBottomPosition) return floatBottomPosition
    }
    // 非命中区域
    let isLastArea = false
    let curPositionIndex = -1
    let hitLineStartIndex: number | undefined
    // 判断是否在表格内
    if (isTable) {
      const { scale } = this.options
      const { td, tablePosition } = payload
      if (td && tablePosition) {
        const { leftTop } = tablePosition.coordinate
        // 跨页片段内 td.y 相对整表，需按片段偏移；
        // 行内拆分续排行之后的行需额外减去续排行已消耗的高度
        const fragment = tablePosition.tableFragment
        let fragmentOffsetY = 0
        if (fragment) {
          const splitExtra =
            fragment.startSplitTrOffset && td.trIndex! > fragment.startTrIndex
              ? fragment.startSplitTrOffset
              : 0
          fragmentOffsetY =
            (fragment.repeatHeight - fragment.skipHeight - splitExtra) * scale
        }
        const tdX = td.x! * scale + leftTop[0]
        const tdY = td.y! * scale + leftTop[1] + fragmentOffsetY
        const tdWidth = td.width! * scale
        const tdHeight = td.height! * scale
        if (!(tdX < x && x < tdX + tdWidth && tdY < y && y < tdY + tdHeight)) {
          return {
            index: curPositionIndex
          }
        }
      }
    }
    // 判断所属行是否存在元素
    const matchedLastLetterList = isMainActive
      ? positionList.filter(p => p.isLastLetter && p.pageNo === positionNo)
      : positionList.filter(p => p.isLastLetter)
    // 分栏场景下，只保留与点击栏一致的行，避免误命中同 y 的其他栏
    const clickColumnIndex = this._getColumnIndexByX(x)
    const lastLetterList =
      clickColumnIndex === undefined
        ? matchedLastLetterList
        : matchedLastLetterList.filter(
            p =>
              p.columnIndex === undefined || clickColumnIndex === p.columnIndex
          )
    for (let j = 0; j < lastLetterList.length; j++) {
      const {
        index,
        rowNo,
        coordinate: { leftTop, leftBottom }
      } = lastLetterList[j]
      if (y > leftTop[1] && y <= leftBottom[1]) {
        const headIndex = isMainActive
          ? positionList.findIndex(
              p => p.pageNo === positionNo && p.rowNo === rowNo
            )
          : positionList.findIndex(p => p.rowNo === rowNo)
        const headElement = elementList[headIndex]
        const headPosition = positionList[headIndex]
        // 是否在头部
        const headStartX =
          headElement.listStyle === ListStyle.CHECKBOX
            ? this.draw.getMargins()[3]
            : headPosition.coordinate.leftTop[0]
        if (x < headStartX) {
          // 头部元素为空元素时无需选中
          if (~headIndex) {
            if (headPosition.value === ZERO) {
              curPositionIndex = headIndex
            } else {
              curPositionIndex = headIndex - 1
              hitLineStartIndex = headIndex
            }
          } else {
            curPositionIndex = index
          }
        } else {
          // 是否是复选框列表
          if (headElement.listStyle === ListStyle.CHECKBOX && x < leftTop[0]) {
            return {
              index: headIndex,
              isDirectHit: true,
              isCheckbox: true
            }
          }
          curPositionIndex = index
        }
        isLastArea = true
        break
      }
    }
    if (!isLastArea) {
      // 页眉页脚正文切换
      if (this.draw.getIsPagingMode()) {
        // 页眉底部距离页面顶部距离
        const header = this.draw.getHeader()
        const headerDisabled = header.isDisabled(curPageNo)
        const headerBottomY = headerDisabled
          ? 0
          : header.getHeaderTop(curPageNo) + header.getHeight(curPageNo)
        // 页脚上部距离页面顶部距离
        const footer = this.draw.getFooter()
        const footerDisabled = footer.isDisabled(curPageNo)
        const pageHeight = this.draw.getHeight()
        const footerTopY = footerDisabled
          ? pageHeight
          : pageHeight -
            (footer.getFooterBottom(curPageNo) + footer.getHeight(curPageNo))
        // 判断所属位置是否属于页眉页脚区域
        if (isMainActive) {
          // 页眉：当前位置小于页眉底部位置
          if (!headerDisabled && y < headerBottomY) {
            return {
              index: -1,
              zone: EditorZone.HEADER
            }
          }
          // 页脚：当前位置大于页脚顶部位置
          if (!footerDisabled && y > footerTopY) {
            return {
              index: -1,
              zone: EditorZone.FOOTER
            }
          }
        } else {
          // main区域：当前位置小于页眉底部位置 && 大于页脚顶部位置
          if (y <= footerTopY && y >= headerBottomY) {
            return {
              index: -1,
              zone: EditorZone.MAIN
            }
          }
        }
      }
      // 正文上-循环首行
      const margins = this.draw.getMargins()
      if (y <= margins[0]) {
        for (let p = 0; p < positionList.length; p++) {
          const position = positionList[p]
          if (position.pageNo !== positionNo || position.rowNo !== 0) continue
          const { leftTop, rightTop } = position.coordinate
          // 小于左页边距 || 命中文字 || 首行最后元素
          if (
            x <= margins[3] ||
            (x >= leftTop[0] && x <= rightTop[0]) ||
            positionList[p + 1]?.rowNo !== 0
          ) {
            return {
              index: position.index
            }
          }
        }
      } else {
        // 正文下-循环尾行
        const lastLetter = lastLetterList[lastLetterList.length - 1]
        if (lastLetter) {
          const lastRowNo = lastLetter.rowNo
          for (let p = 0; p < positionList.length; p++) {
            const position = positionList[p]
            if (
              position.pageNo !== positionNo ||
              position.rowNo !== lastRowNo
            ) {
              continue
            }
            const { leftTop, rightTop } = position.coordinate
            // 小于左页边距 || 命中文字 || 尾行最后元素
            if (
              x <= margins[3] ||
              (x >= leftTop[0] && x <= rightTop[0]) ||
              positionList[p + 1]?.rowNo !== lastRowNo
            ) {
              return {
                index: position.index
              }
            }
          }
        }
      }
      // 当前页最后一行
      return {
        index:
          lastLetterList[lastLetterList.length - 1]?.index ||
          positionList.length - 1
      }
    }
    return {
      hitLineStartIndex,
      index: curPositionIndex,
      isControl: !!elementList[curPositionIndex]?.controlId
    }
  }

  public getFloatPositionByXY(
    payload: IGetFloatPositionByXYPayload
  ): ICurrentPosition | void {
    const { x, y } = payload
    const currentPageNo = payload.pageNo ?? this.draw.getPageNo()
    const currentZone = this.draw.getZone().getZone()
    const { scale } = this.options
    for (let f = 0; f < this.floatPositionList.length; f++) {
      const {
        position,
        element,
        isTable,
        index,
        trIndex,
        tdIndex,
        tdValueIndex,
        zone: floatElementZone,
        pageNo
      } = this.floatPositionList[f]
      if (
        currentPageNo === pageNo &&
        element.type === ElementType.IMAGE &&
        element.imgDisplay &&
        payload.imgDisplays.includes(element.imgDisplay) &&
        (!floatElementZone || floatElementZone === currentZone)
      ) {
        const { x: imgFloatPositionX, y: imgFloatPositionY } =
          this.getFloatPositionCoordinate(this.floatPositionList[f])
        const elementWidth = element.width! * scale
        const elementHeight = element.height! * scale
        if (
          x >= imgFloatPositionX &&
          x <= imgFloatPositionX + elementWidth &&
          y >= imgFloatPositionY &&
          y <= imgFloatPositionY + elementHeight
        ) {
          if (isTable) {
            return {
              index: index!,
              isDirectHit: true,
              isImage: true,
              isTable,
              trIndex,
              tdIndex,
              tdValueIndex,
              tdId: element.tdId,
              trId: element.trId,
              tableId: element.tableId
            }
          }
          return {
            index: position.index,
            isDirectHit: true,
            isImage: true
          }
        }
      }
    }
  }

  public adjustPositionContext(
    payload: IGetPositionByXYPayload
  ): ICurrentPosition | null {
    const positionResult = this.getPositionByXY(payload)
    if (!~positionResult.index) return null
    // 移动控件内光标
    if (
      positionResult.isControl &&
      this.draw.getMode() !== EditorMode.READONLY
    ) {
      const { index, isTable, trIndex, tdIndex, tdValueIndex } = positionResult
      const control = this.draw.getControl()
      const { newIndex } = control.moveCursor({
        index,
        isTable,
        trIndex,
        tdIndex,
        tdValueIndex
      })
      if (isTable) {
        positionResult.tdValueIndex = newIndex
      } else {
        positionResult.index = newIndex
      }
    }
    const {
      index,
      isCheckbox,
      isRadio,
      isControl,
      isImage,
      isLabel,
      isDirectHit,
      isTable,
      trIndex,
      tdIndex,
      tdId,
      trId,
      tableId,
      tablePath
    } = positionResult
    // 设置位置上下文
    this.setPositionContext({
      isTable: isTable || false,
      isCheckbox: isCheckbox || false,
      isRadio: isRadio || false,
      isControl: isControl || false,
      isImage: isImage || false,
      isLabel: isLabel || false,
      isDirectHit: isDirectHit || false,
      index,
      trIndex,
      tdIndex,
      tdId,
      trId,
      tableId,
      tablePath
    })
    return positionResult
  }

  public setSurroundPosition(payload: ISetSurroundPositionPayload) {
    const { scale } = this.options
    const {
      pageNo,
      row,
      rowElement,
      rowElementRect,
      surroundElementList,
      availableWidth
    } = payload
    let x = rowElementRect.x
    let rowIncreaseWidth = 0
    if (
      surroundElementList.length &&
      !getIsBlockElement(rowElement) &&
      !rowElement.control?.minWidth
    ) {
      for (let s = 0; s < surroundElementList.length; s++) {
        const surroundElement = surroundElementList[s]
        const floatPosition = surroundElement.imgFloatPosition!
        if (floatPosition.pageNo !== pageNo) continue
        const surroundRect = {
          ...floatPosition,
          x: floatPosition.x * scale,
          y: floatPosition.y * scale,
          width: surroundElement.width! * scale,
          height: surroundElement.height! * scale
        }
        if (isRectIntersect(rowElementRect, surroundRect)) {
          row.isSurround = true
          // 需向左移动距离：浮动元素宽度 + 浮动元素左上坐标 - 元素左上坐标
          const translateX =
            surroundRect.width + surroundRect.x - rowElementRect.x
          rowElement.left = translateX
          // 增加行宽
          row.width += translateX
          rowIncreaseWidth += translateX
          // 下个元素起始位置：浮动元素右坐标 - 元素宽度
          x = surroundRect.x + surroundRect.width
          // 检测宽度是否足够，不够则移动到下一行，并还原状态
          if (row.width + rowElement.metrics.width > availableWidth) {
            rowElement.left = 0
            row.width -= rowIncreaseWidth
            break
          }
        }
      }
    }
    return { x, rowIncreaseWidth }
  }
}
