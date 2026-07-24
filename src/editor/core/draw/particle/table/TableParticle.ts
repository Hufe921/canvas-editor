import { ElementType, IElement, TableBorder } from '../../../..'
import { TdBorder, TdSlash } from '../../../../dataset/enum/table/Table'
import { DeepRequired } from '../../../../interface/Common'
import { IEditorOption } from '../../../../interface/Editor'
import { ITableRowFragment } from '../../../../interface/Element'
import { IRow } from '../../../../interface/Row'
import { ITd } from '../../../../interface/table/Td'
import { ITr } from '../../../../interface/table/Tr'
import { deepClone } from '../../../../utils'
import { RangeManager } from '../../../range/RangeManager'
import { Draw } from '../../Draw'

interface IDrawTableBorderOption {
  ctx: CanvasRenderingContext2D
  startX: number
  startY: number
  width: number
  height: number
  borderExternalWidth?: number
  isDrawFullBorder?: boolean
}

// 跨页片段内需绘制的单元格（含续页回显表头与进位合并单元格）
interface IFragmentDrawTd {
  td: ITd
  // 缩放后的纵坐标偏移（td.y 相对整表，片段内需平移）
  offsetY: number
  // 缩放后的可见高度（窗口裁剪）
  height: number
  isRepeat: boolean
  isCarried: boolean
}

export class TableParticle {
  private draw: Draw
  private range: RangeManager
  private options: DeepRequired<IEditorOption>
  // 片段内容高度缓存（片段对象随每次渲染重建，无过期风险）
  private fragmentContentHeightCache: WeakMap<object, number>
  // 单元格内容行高前缀和缓存（按 rowList 数组身份，每次渲染重建无过期风险）
  private tdLineHeightPrefixCache: WeakMap<IRow[], number[]>
  // 片段单元格枚举缓存（片段对象随每次渲染重建，命中/绘制高频复用）
  private fragmentTdListCache: WeakMap<ITableRowFragment, ITd[]>

  constructor(draw: Draw) {
    this.draw = draw
    this.range = draw.getRange()
    this.options = draw.getOptions()
    this.fragmentContentHeightCache = new WeakMap()
    this.tdLineHeightPrefixCache = new WeakMap()
    this.fragmentTdListCache = new WeakMap()
  }

  public getTrListGroupByCol(payload: ITr[]): ITr[] {
    const trList = deepClone(payload)
    for (let t = 0; t < payload.length; t++) {
      const tr = trList[t]
      for (let d = tr.tdList.length - 1; d >= 0; d--) {
        const td = tr.tdList[d]
        const { rowspan, rowIndex, colIndex } = td
        const curRowIndex = rowIndex! + rowspan - 1
        if (curRowIndex !== t) {
          const changeTd = tr.tdList.splice(d, 1)[0]
          trList[curRowIndex]?.tdList.splice(colIndex!, 0, changeTd)
        }
      }
    }
    return trList
  }

  public getRangeRowCol(): ITd[][] | null {
    const position = this.draw.getPosition()
    const positionContext = position.getPositionContext()
    const { isTable, trIndex, tdIndex } = positionContext
    if (!isTable) return null
    const {
      isCrossRowCol,
      startTdIndex,
      endTdIndex,
      startTrIndex,
      endTrIndex
    } = this.range.getRange()
    const originalElementList = this.draw.getOriginalElementList()
    const element = position.getTableElementByContext(
      originalElementList,
      positionContext
    )
    if (!element) return null
    const curTrList = element.trList!
    // 非跨列直接返回光标所在单元格
    if (!isCrossRowCol) {
      return [[curTrList[trIndex!].tdList[tdIndex!]]]
    }
    let startTd = curTrList[startTrIndex!].tdList[startTdIndex!]
    let endTd = curTrList[endTrIndex!].tdList[endTdIndex!]
    // 交换起始位置
    if (startTd.x! > endTd.x! || startTd.y! > endTd.y!) {
      ;[startTd, endTd] = [endTd, startTd]
    }
    const startColIndex = startTd.colIndex!
    const endColIndex = endTd.colIndex! + (endTd.colspan - 1)
    const startRowIndex = startTd.rowIndex!
    const endRowIndex = endTd.rowIndex! + (endTd.rowspan - 1)
    // 选区行列
    const rowCol: ITd[][] = []
    for (let t = 0; t < curTrList.length; t++) {
      const tr = curTrList[t]
      const tdList: ITd[] = []
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        const tdColIndex = td.colIndex!
        const tdRowIndex = td.rowIndex!
        if (
          tdColIndex >= startColIndex &&
          tdColIndex <= endColIndex &&
          tdRowIndex >= startRowIndex &&
          tdRowIndex <= endRowIndex
        ) {
          tdList.push(td)
        }
      }
      if (tdList.length) {
        rowCol.push(tdList)
      }
    }
    return rowCol.length ? rowCol : null
  }

  private _drawOuterBorder(payload: IDrawTableBorderOption) {
    const {
      ctx,
      startX,
      startY,
      width,
      height,
      isDrawFullBorder,
      borderExternalWidth
    } = payload
    const { scale } = this.options
    // 外部边框单独设置
    const lineWidth = ctx.lineWidth
    if (borderExternalWidth) {
      ctx.lineWidth = borderExternalWidth * scale
    }
    ctx.beginPath()
    const x = Math.round(startX)
    const y = Math.round(startY)
    ctx.translate(0.5, 0.5)
    if (isDrawFullBorder) {
      ctx.rect(x, y, width, height)
    } else {
      ctx.moveTo(x, y + height)
      ctx.lineTo(x, y)
      ctx.lineTo(x + width, y)
    }
    ctx.stroke()
    // 还原边框设置
    if (borderExternalWidth) {
      ctx.lineWidth = lineWidth
    }
    ctx.translate(-0.5, -0.5)
  }

  // 枚举片段涉及的单元格：进位合并单元格（覆盖片段起始行的跨行单元格）
  // + 片段范围行单元格。直接遍历行区间与缓存的进位单元格，避免全表扫描；
  // 结果按片段对象缓存（td 对象共享于 trList，枚举结果与传入 element 包装无关）
  public getFragmentTdList(
    element: IElement,
    fragment: ITableRowFragment
  ): ITd[] {
    const cached = this.fragmentTdListCache.get(fragment)
    if (cached) return cached
    const { startTrIndex, endTrIndex, carriedTds } = fragment
    const tdList: ITd[] = [...(carriedTds || [])]
    const trList = element.trList!
    for (let r = startTrIndex; r < endTrIndex; r++) {
      tdList.push(...trList[r].tdList)
    }
    this.fragmentTdListCache.set(fragment, tdList)
    return tdList
  }

  // 枚举跨页片段内需绘制的单元格：续页回显表头 + 片段范围行 + 进位合并单元格
  // 纵坐标与高度均按单元格窗口裁剪（合并/拆分/普通单元格统一处理）
  private _getDrawTdList(
    element: IElement,
    fragment?: ITableRowFragment
  ): IFragmentDrawTd[] {
    const { scale } = this.options
    const trList = element.trList!
    const drawTdList: IFragmentDrawTd[] = []
    if (!fragment) {
      for (const tr of trList) {
        for (const td of tr.tdList) {
          drawTdList.push({
            td,
            offsetY: 0,
            height: td.height! * scale,
            isRepeat: false,
            isCarried: false
          })
        }
      }
      return drawTdList
    }
    const { startTrIndex, repeatTrIndexes } = fragment
    // 续页回显表头（整行回显，不参与窗口裁剪）
    if (repeatTrIndexes?.length) {
      let accHeight = 0
      for (const trIndex of repeatTrIndexes) {
        const tr = trList[trIndex]
        for (const td of tr.tdList) {
          drawTdList.push({
            td,
            offsetY: (accHeight - td.y!) * scale,
            height: td.height! * scale,
            isRepeat: true,
            isCarried: false
          })
        }
        accHeight += tr.height!
      }
    }
    // 片段范围行与进位合并单元格（按窗口裁剪）
    for (const td of this.getFragmentTdList(element, fragment)) {
      const [windowStart, windowEnd] = this.getTdWindowInFragment(
        td,
        element,
        fragment
      )
      if (windowEnd <= windowStart) continue
      drawTdList.push({
        td,
        offsetY: this.getTdWindowOffsetY(windowStart, fragment),
        height: (windowEnd - windowStart) * scale,
        isRepeat: false,
        isCarried: td.rowIndex! < startTrIndex
      })
    }
    return drawTdList
  }

  private _drawSlash(
    ctx: CanvasRenderingContext2D,
    drawTd: IFragmentDrawTd,
    startX: number,
    startY: number
  ) {
    const { scale } = this.options
    const { td, offsetY, height } = drawTd
    ctx.save()
    const width = td.width! * scale
    const x = Math.round(td.x! * scale + startX)
    const y = Math.round(td.y! * scale + startY + offsetY)
    // 正斜线 /
    if (td.slashTypes?.includes(TdSlash.FORWARD)) {
      ctx.moveTo(x + width, y)
      ctx.lineTo(x, y + height)
    }
    // 反斜线 \
    if (td.slashTypes?.includes(TdSlash.BACK)) {
      ctx.moveTo(x, y)
      ctx.lineTo(x + width, y + height)
    }
    ctx.stroke()
    ctx.restore()
  }

  private _drawBorder(
    ctx: CanvasRenderingContext2D,
    element: IElement,
    startX: number,
    startY: number,
    drawTdList: IFragmentDrawTd[],
    fragment?: ITableRowFragment
  ) {
    const {
      colgroup,
      trList,
      borderType,
      borderColor,
      borderWidth = 1,
      borderExternalWidth
    } = element
    if (!colgroup || !trList) return
    const {
      scale,
      table: { defaultBorderColor }
    } = this.options
    const tableWidth = element.width! * scale
    // 外框高度：片段时为片段内行高和
    const tableHeight = fragment
      ? (fragment.repeatHeight +
          this.getFragmentContentHeight(element, fragment)) *
        scale
      : element.height! * scale
    // 无边框
    const isEmptyBorderType = borderType === TableBorder.EMPTY
    // 仅外边框
    const isExternalBorderType = borderType === TableBorder.EXTERNAL
    // 内边框
    const isInternalBorderType = borderType === TableBorder.INTERNAL
    ctx.save()
    // 虚线
    if (borderType === TableBorder.DASH) {
      ctx.setLineDash([3, 3])
    }
    ctx.lineWidth = borderWidth * scale
    ctx.strokeStyle = borderColor || defaultBorderColor
    // 渲染边框
    if (!isEmptyBorderType && !isInternalBorderType) {
      this._drawOuterBorder({
        ctx,
        startX,
        startY,
        width: tableWidth,
        height: tableHeight,
        borderExternalWidth,
        isDrawFullBorder: isExternalBorderType
      })
    }
    // 渲染单元格
    for (const drawTd of drawTdList) {
      const { td, offsetY, height } = drawTd
      // 单元格内斜线
      if (td.slashTypes?.length) {
        this._drawSlash(ctx, drawTd, startX, startY)
      }
      // 没有设置单元格边框 && 没有设置表格边框则忽略
      if (
        !td.borderTypes?.length &&
        (isEmptyBorderType || isExternalBorderType)
      ) {
        continue
      }
      const width = td.width! * scale
      const x = Math.round(td.x! * scale + startX + width)
      const y = Math.round(td.y! * scale + startY + offsetY)
      ctx.translate(0.5, 0.5)
      // 绘制线条
      ctx.beginPath()
      // 单元格边框
      if (td.borderTypes?.includes(TdBorder.TOP)) {
        ctx.moveTo(x - width, y)
        ctx.lineTo(x, y)
        ctx.stroke()
      }
      if (td.borderTypes?.includes(TdBorder.RIGHT)) {
        ctx.moveTo(x, y)
        ctx.lineTo(x, y + height)
        ctx.stroke()
      }
      if (td.borderTypes?.includes(TdBorder.BOTTOM)) {
        ctx.moveTo(x, y + height)
        ctx.lineTo(x - width, y + height)
        ctx.stroke()
      }
      if (td.borderTypes?.includes(TdBorder.LEFT)) {
        ctx.moveTo(x - width, y)
        ctx.lineTo(x - width, y + height)
        ctx.stroke()
      }
      // 表格线
      if (!isEmptyBorderType && !isExternalBorderType) {
        // 右边框
        if (
          !isInternalBorderType ||
          td.colIndex! + td.colspan < colgroup.length
        ) {
          ctx.moveTo(x, y)
          ctx.lineTo(x, y + height)
          // 外部边框宽度设置时 => 最右边框宽度单独设置
          if (
            borderExternalWidth &&
            borderExternalWidth !== borderWidth &&
            td.colIndex! + td.colspan === colgroup.length
          ) {
            const lineWidth = ctx.lineWidth
            ctx.lineWidth = borderExternalWidth * scale
            ctx.stroke()
            // 清空path
            ctx.beginPath()
            ctx.lineWidth = lineWidth
          }
        }
        // 下边框
        if (
          !isInternalBorderType ||
          td.rowIndex! + td.rowspan < trList.length
        ) {
          // 外部边框宽度设置时 => 立即绘制竖线
          // 跨页片段内到达片段末行的单元格视作最后一行（切口处外框封闭）
          const isLastDrawnTr =
            td.rowIndex! + td.rowspan ===
            (fragment?.endTrIndex ?? trList.length)
          const isSetExternalBottomBorder =
            borderExternalWidth &&
            borderExternalWidth !== borderWidth &&
            isLastDrawnTr
          if (isSetExternalBottomBorder) {
            ctx.stroke()
            // 清空path
            ctx.beginPath()
          }
          ctx.moveTo(x, y + height)
          ctx.lineTo(x - width, y + height)
          // 外部边框宽度设置时 => 最下边框宽度单独设置
          if (isSetExternalBottomBorder) {
            const lineWidth = ctx.lineWidth
            ctx.lineWidth = borderExternalWidth * scale
            ctx.stroke()
            // 清空path
            ctx.beginPath()
            ctx.lineWidth = lineWidth
          }
        }
        ctx.stroke()
      }
      ctx.translate(-0.5, -0.5)
    }
    ctx.restore()
  }

  private _drawBackgroundColor(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    drawTdList: IFragmentDrawTd[]
  ) {
    const { scale } = this.options
    for (const { td, offsetY, height } of drawTdList) {
      if (!td.backgroundColor) continue
      ctx.save()
      const width = td.width! * scale
      const x = Math.round(td.x! * scale + startX)
      const y = Math.round(td.y! * scale + startY + offsetY)
      ctx.fillStyle = td.backgroundColor
      ctx.fillRect(x, y, width, height)
      ctx.restore()
    }
  }

  public getTableWidth(element: IElement): number {
    return element.colgroup!.reduce((pre, cur) => pre + cur.width, 0)
  }

  // 行内拆分行在片段内的可见高度（未缩放；未拆分返回行原始高度）
  public getFragmentTrHeight(
    tr: ITr,
    trIndex: number,
    fragment?: ITableRowFragment
  ): number {
    if (!fragment) return tr.height!
    let height = tr.height!
    if (trIndex === fragment.startTrIndex && fragment.startSplitTrOffset) {
      height -= fragment.startSplitTrOffset
    }
    if (
      trIndex === fragment.endTrIndex - 1 &&
      fragment.endSplitTrHeight !== undefined
    ) {
      // 行高可能已被 maxPageNo 截断收缩：拆分高度超出行高时按整行计算
      height -= Math.max(0, tr.height! - fragment.endSplitTrHeight)
    }
    return height
  }

  // 片段内容高度（未缩放）：范围内行按可见高度求和（不含回显表头）
  public getFragmentContentHeight(
    element: IElement,
    fragment: Pick<
      ITableRowFragment,
      'startTrIndex' | 'endTrIndex' | 'startSplitTrOffset' | 'endSplitTrHeight'
    >
  ): number {
    // 片段对象随每次渲染重建，按对象缓存结果避免逐单元格重复求和
    const cached = this.fragmentContentHeightCache.get(fragment)
    if (cached !== undefined) return cached
    const { startTrIndex, endTrIndex, startSplitTrOffset, endSplitTrHeight } =
      fragment
    const trList = element.trList!
    let contentHeight = 0
    for (let r = startTrIndex; r < endTrIndex; r++) {
      let trHeight = trList[r].height!
      if (r === startTrIndex && startSplitTrOffset) {
        trHeight -= startSplitTrOffset
      }
      if (r === endTrIndex - 1 && endSplitTrHeight !== undefined) {
        // 行高可能已被 maxPageNo 截断收缩：拆分高度超出行高时按整行计算
        trHeight -= Math.max(0, trList[r].height! - endSplitTrHeight)
      }
      contentHeight += trHeight
    }
    this.fragmentContentHeightCache.set(fragment, contentHeight)
    return contentHeight
  }

  // 计算单元格在片段内的可见窗口（未缩放，相对单元格顶部）
  // 合并/拆分/普通单元格通用：窗口为片段可视区与单元格区域的交集
  public getTdWindowInFragment(
    td: ITd,
    element: IElement,
    fragment: ITableRowFragment
  ): [number, number] {
    const { skipHeight, startSplitTrOffset } = fragment
    // 片段可视区在整表坐标系中的范围
    const visibleTopFull = skipHeight + (startSplitTrOffset ?? 0)
    const visibleBottomFull =
      visibleTopFull + this.getFragmentContentHeight(element, fragment)
    const windowStart = Math.max(0, visibleTopFull - td.y!)
    const windowEnd = Math.min(td.height!, visibleBottomFull - td.y!)
    return [windowStart, windowEnd]
  }

  // 单元格窗口顶部在片段内的纵坐标偏移（缩放后像素；
  // td.y 相对整表，片段内需平移到窗口位置）
  public getTdWindowOffsetY(
    windowStart: number,
    fragment: ITableRowFragment
  ): number {
    const { scale } = this.options
    return (
      (windowStart -
        fragment.skipHeight -
        (fragment.startSplitTrOffset ?? 0) +
        fragment.repeatHeight) *
      scale
    )
  }

  // 窗口内可见内容行切片：返回行列表与首行在单元格内的起始行号/元素索引
  public getTdVisibleRowListByWindow(
    td: ITd,
    windowStart: number,
    windowEnd: number
  ): { rowList: IRow[]; startIndex: number; startRowIndex: number } {
    const rowList = td.rowList!
    const [startLine, endLine] = this.getTdLineRangeBySplitWindow(
      td,
      windowStart,
      windowEnd
    )
    return {
      rowList: rowList.slice(startLine, endLine),
      startIndex: rowList[startLine]?.startIndex ?? 0,
      startRowIndex: startLine
    }
  }

  // 计算单元格内容行在垂直窗口内的行范围（行内拆分使用）
  // windowStart/windowEnd 未缩放、相对行顶；返回 [起始行, 结束行)（按整行取舍不裁剪行）
  public getTdLineRangeBySplitWindow(
    td: ITd,
    windowStart: number,
    windowEnd: number
  ): [number, number] {
    const { scale } = this.options
    const rowList = td.rowList || []
    // 行高前缀和（含上内边距）：prefix[k] 为第 k 行底（缩放后）
    let prefix = this.tdLineHeightPrefixCache.get(rowList)
    if (!prefix) {
      const {
        table: { tdPadding }
      } = this.options
      prefix = [tdPadding[0] * scale]
      for (let i = 0; i < rowList.length; i++) {
        prefix.push(prefix[i] + rowList[i].height)
      }
      this.tdLineHeightPrefixCache.set(rowList, prefix)
    }
    const topLimit = windowStart * scale
    const limit = windowEnd * scale
    // 二分查找满足 行底(prefix[k]) <= 阈值 的最大行数（行高非负，前缀和单调）
    const upperBound = (threshold: number) => {
      let lo = 0
      let hi = rowList.length
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1
        if (prefix[mid] <= threshold) {
          lo = mid
        } else {
          hi = mid - 1
        }
      }
      return lo
    }
    return [upperBound(topLimit), upperBound(limit)]
  }

  public getTableHeight(element: IElement): number {
    const trList = element.trList
    if (!trList?.length) return 0
    return this.getTdListByColIndex(trList, 0).reduce(
      (pre, cur) => pre + cur.height!,
      0
    )
  }

  public getRowCountByColIndex(trList: ITr[], colIndex: number): number {
    return this.getTdListByColIndex(trList, colIndex).reduce(
      (pre, cur) => pre + cur.rowspan,
      0
    )
  }

  public getTdListByColIndex(trList: ITr[], colIndex: number): ITd[] {
    const data: ITd[] = []
    for (let r = 0; r < trList.length; r++) {
      const tdList = trList[r].tdList
      for (let d = 0; d < tdList.length; d++) {
        const td = tdList[d]
        const min = td.colIndex!
        const max = min + td.colspan - 1
        if (colIndex >= min && colIndex <= max) {
          data.push(td)
        }
      }
    }
    return data
  }

  public getTdListByRowIndex(trList: ITr[], rowIndex: number) {
    const data: ITd[] = []
    for (let r = 0; r < trList.length; r++) {
      const tdList = trList[r].tdList
      for (let d = 0; d < tdList.length; d++) {
        const td = tdList[d]
        const min = td.rowIndex!
        const max = min + td.rowspan - 1
        if (rowIndex >= min && rowIndex <= max) {
          data.push(td)
        }
      }
    }
    return data
  }

  public computeRowColInfo(element: IElement) {
    const { colgroup, trList } = element
    if (!colgroup || !trList) return
    let preX = 0
    for (let t = 0; t < trList.length; t++) {
      const tr = trList[t]
      // 表格最后一行
      const isLastTr = trList.length - 1 === t
      // 当前行最小高度
      let rowMinHeight = 0
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        // 计算当前td所属列索引
        let colIndex = 0
        // 第一行td位置为当前列索引+上一个单元格colspan，否则从第一行开始计算列偏移量
        if (trList.length > 1 && t !== 0) {
          // 当前列起始索引：以之前单元格为起始点
          const preTd = tr.tdList[d - 1]
          const start = preTd ? preTd.colIndex! + preTd.colspan : d
          for (let c = start; c < colgroup.length; c++) {
            // 查找相同索引列之前行数，相加判断是否位置被挤占
            const rowCount = this.getRowCountByColIndex(trList.slice(0, t), c)
            // 不存在挤占则默认当前单元格可以存在该位置
            if (rowCount === t) {
              colIndex = c
              // 重置单元格起始位置坐标
              let preColWidth = 0
              for (let preC = 0; preC < c; preC++) {
                preColWidth += colgroup[preC].width
              }
              preX = preColWidth
              break
            }
          }
        } else {
          const preTd = tr.tdList[d - 1]
          if (preTd) {
            colIndex = preTd.colIndex! + preTd.colspan
          }
        }
        // 计算格宽高
        let width = 0
        for (let col = 0; col < td.colspan; col++) {
          width += colgroup[col + colIndex].width
        }
        let height = 0
        for (let row = 0; row < td.rowspan; row++) {
          const curTr = trList[row + t] || trList[t]
          height += curTr.height
        }
        // y偏移量
        if (rowMinHeight === 0 || rowMinHeight > height) {
          rowMinHeight = height
        }
        // 当前行最后一个td
        const isLastRowTd = tr.tdList.length - 1 === d
        // 当前列最后一个td
        let isLastColTd = isLastTr
        if (!isLastColTd) {
          if (td.rowspan > 1) {
            const nextTrLength = trList.length - 1 - t
            isLastColTd = td.rowspan - 1 === nextTrLength
          }
        }
        // 当前表格最后一个td
        const isLastTd = isLastTr && isLastRowTd
        td.isLastRowTd = isLastRowTd
        td.isLastColTd = isLastColTd
        td.isLastTd = isLastTd
        // 修改当前格clientBox
        td.x = preX
        // 之前行相同列的高度
        let preY = 0
        for (let preR = 0; preR < t; preR++) {
          const preTdList = trList[preR].tdList
          for (let preD = 0; preD < preTdList.length; preD++) {
            const td = preTdList[preD]
            if (
              colIndex >= td.colIndex! &&
              colIndex < td.colIndex! + td.colspan
            ) {
              preY += td.height!
              break
            }
          }
        }
        td.y = preY
        td.width = width
        td.height = height
        td.rowIndex = t
        td.colIndex = colIndex
        td.trIndex = t
        td.tdIndex = d
        // 当前列x轴累加
        preX += width
        // 一行中的最后td
        if (isLastRowTd && !isLastTd) {
          preX = 0
        }
      }
    }
  }

  public drawRange(
    ctx: CanvasRenderingContext2D,
    element: IElement,
    startX: number,
    startY: number,
    fragment?: ITableRowFragment
  ) {
    const { scale, rangeAlpha, rangeColor } = this.options
    const { type, trList } = element
    if (!trList || type !== ElementType.TABLE) return
    const {
      isCrossRowCol,
      tableId,
      startTdIndex,
      endTdIndex,
      startTrIndex,
      endTrIndex
    } = this.range.getRange()
    // 存在跨行/列
    if (!isCrossRowCol || tableId !== element.id) return
    let startTd = trList[startTrIndex!].tdList[startTdIndex!]
    let endTd = trList[endTrIndex!].tdList[endTdIndex!]
    // 交换起始位置
    if (startTd.x! > endTd.x! || startTd.y! > endTd.y!) {
      ;[startTd, endTd] = [endTd, startTd]
    }
    const startColIndex = startTd.colIndex!
    const endColIndex = endTd.colIndex! + (endTd.colspan - 1)
    const startRowIndex = startTd.rowIndex!
    const endRowIndex = endTd.rowIndex! + (endTd.rowspan - 1)
    ctx.save()
    // 仅绘制片段范围内的单元格（回显表头不绘制选区）
    const drawTdList = this._getDrawTdList(element, fragment)
    for (const { td, offsetY, height, isRepeat } of drawTdList) {
      if (isRepeat) continue
      const tdColIndex = td.colIndex!
      const tdRowIndex = td.rowIndex!
      if (
        tdColIndex >= startColIndex &&
        tdColIndex <= endColIndex &&
        tdRowIndex >= startRowIndex &&
        tdRowIndex <= endRowIndex
      ) {
        const x = td.x! * scale
        const y = td.y! * scale + offsetY
        const width = td.width! * scale
        ctx.globalAlpha = rangeAlpha
        ctx.fillStyle = rangeColor
        ctx.fillRect(x + startX, y + startY, width, height)
      }
    }
    ctx.restore()
  }

  public render(
    ctx: CanvasRenderingContext2D,
    element: IElement,
    startX: number,
    startY: number,
    fragment?: ITableRowFragment
  ) {
    // 片段单元格枚举一次，供背景与边框复用
    const drawTdList = this._getDrawTdList(element, fragment)
    this._drawBackgroundColor(ctx, startX, startY, drawTdList)
    this._drawBorder(ctx, element, startX, startY, drawTdList, fragment)
  }
}
