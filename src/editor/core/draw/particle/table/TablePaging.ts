import { ElementType } from '../../../../dataset/enum/Element'
import { ZERO } from '../../../../dataset/constant/Common'
import { DeepRequired } from '../../../../interface/Common'
import { IEditorOption } from '../../../../interface/Editor'
import { IElement, ITableRowFragment } from '../../../../interface/Element'
import { IPositionContext } from '../../../../interface/Position'
import { IRow } from '../../../../interface/Row'
import { ITd } from '../../../../interface/table/Td'
import { Draw } from '../../Draw'
import { TableParticle } from './TableParticle'
import { ParagraphPaging } from '../../ParagraphPaging'

// 表格分页：跨页表格在渲染层的行拆分（分页/分栏片段计算）
// 与 maxPageNo 截断裁剪。数据层始终保持单一表格
export class TablePaging {
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private tableParticle: TableParticle

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.tableParticle = draw.getTableParticle()
  }

  // 表格跨页时在渲染层拆分行：数据层始终保持单一表格，
  // 仅将跨页表格的行记录拆分为按页片段（超高单元格按内容行行内拆分）
  public splitTableRowAcrossPages(rowList: IRow[]): IRow[] {
    const { scale } = this.options
    const isHidden = (element: IElement) =>
      !this.draw.isDesignMode() &&
      Boolean(
        element.hide ||
        element.control?.hide ||
        (element.area?.hide && !this.draw.isAreaHideDisabled()) ||
        this.draw.getTraceParticle().isTraceHidden(element)
      )
    const paragraphs = new ParagraphPaging(rowList, isHidden)
    // 分栏布局：行落位以（页码, 栏索引）槽位推进，与 _computePageList 规则一致
    const columnLayout = this.draw.getColumnLayout(this.options.paperDirection)
    const columnCount = columnLayout?.count || 1
    const isColumnEnabled = columnCount > 1
    // 分页结果尚未生成，按分页符跟踪方向
    let curDirection = this.options.paperDirection
    let curPageLimit = this.draw.getHeight(curDirection)
    let pageNo = 0
    let currentColumn = 0
    // 与 _computePageList 保持一致的页面填充累计语义
    let pageHeight = this.draw.getMainOuterHeight(0, curDirection)
    const newRowList: IRow[] = []
    // 是否已发生表格拆分（之后行的栏索引需按实际填充重新推导）
    let hasSplitTable = false
    let hasFlowRepacked = false
    // Mirror area padding that the final page pass will carry, without
    // mutating raw rows (that pass installs the actual offset exactly once).
    let pendingAreaCarry = 0
    for (let i = 0; i < rowList.length; i++) {
      const row = rowList[i]
      const carriedOffsetY = pendingAreaCarry
      pendingAreaCarry = 0
      const rowOffsetY = (row.offsetY || 0) + carriedOffsetY
      const element = row.elementList[0]
      const trList = element?.trList
      // 上一行是分页符则当前行另起新页
      const isPrePageBreak = !!rowList[i - 1]?.isPageBreak
      // 上一行为分页符时进入下一节
      const preBreakDirection = isPrePageBreak
        ? rowList[i - 1].paperDirection || this.options.paperDirection
        : null
      // 推进到下一个槽位：分栏时优先换栏，否则换页
      const advanceSlot = (forcePageBreak = false) => {
        if (
          !forcePageBreak &&
          isColumnEnabled &&
          currentColumn < columnCount - 1
        ) {
          currentColumn++
        } else {
          pageNo++
          currentColumn = 0
        }
        pageHeight = this.draw.getMainOuterHeight(pageNo, curDirection)
      }
      // 非表格行透传（与 _computePageList 一致：显式换栏重置页高，溢出换槽）
      const passThrough = () => {
        if (
          isColumnEnabled &&
          !isPrePageBreak &&
          row.columnIndex !== undefined &&
          row.columnIndex > currentColumn &&
          !hasSplitTable &&
          !hasFlowRepacked
        ) {
          currentColumn = row.columnIndex
          pageHeight = this.draw.getMainOuterHeight(pageNo, curDirection)
        }
        const slotTop = this.draw.getMainOuterHeight(pageNo, curDirection)
        const occupied = pageHeight > slotTop + 1e-8
        const nextPage =
          isColumnEnabled && currentColumn < columnCount - 1
            ? pageNo
            : pageNo + 1
        const nextEmpty =
          curPageLimit - this.draw.getMainOuterHeight(nextPage, curDirection)
        const emptyHeight = Math.max(curPageLimit - slotTop, nextEmpty)
        const reservation = paragraphs.required(i, emptyHeight)
        reservation.height += carriedOffsetY
        const grouped =
          reservation.fresh ||
          reservation.height > row.height + rowOffsetY + 1e-8
        if (
          carriedOffsetY > 0 &&
          grouped &&
          reservation.height > emptyHeight + 1e-8
        ) {
          throw new Error(
            'Paragraph flow cannot fit alongside carried area padding.'
          )
        }
        const explicit = paragraphs.before(i) && (occupied || currentColumn > 0)
        const keep =
          occupied &&
          (reservation.fresh ||
            (grouped && pageHeight + reservation.height > curPageLimit + 1e-8))
        const overflow = row.height + rowOffsetY + pageHeight > curPageLimit
        if (
          hasFlowRepacked &&
          overflow &&
          row.areaPadding &&
          !isPrePageBreak &&
          !explicit &&
          !keep &&
          row.height - row.areaPadding.height + rowOffsetY + pageHeight <=
            curPageLimit
        ) {
          pendingAreaCarry = row.height + rowOffsetY + pageHeight - curPageLimit
          if (isColumnEnabled) row.columnIndex = currentColumn
          pageHeight = curPageLimit
          newRowList.push(row)
          return
        }
        if (
          (overflow && (!paragraphs.active || occupied)) ||
          isPrePageBreak ||
          explicit ||
          keep
        ) {
          if (preBreakDirection) {
            curDirection = preBreakDirection
            curPageLimit = this.draw.getHeight(curDirection)
          }
          const oldPage = pageNo
          if (keep || explicit) hasFlowRepacked = true
          advanceSlot(isPrePageBreak || explicit)
          if (paragraphs.active && pageNo !== oldPage && (keep || explicit))
            row.paginationBreakBefore = true
        }
        // 拆分后行的栏索引按实际填充重新推导
        if (isColumnEnabled) row.columnIndex = currentColumn
        pageHeight += row.height + rowOffsetY
        newRowList.push(row)
      }
      const isHiddenTable =
        element?.type === ElementType.TABLE && isHidden(element)
      const isTableRow =
        row.elementList.length === 1 &&
        element?.type === ElementType.TABLE &&
        !!trList?.length &&
        !isHiddenTable
      if (!isTableRow) {
        passThrough()
        continue
      }
      const rowMargin = this.draw.getElementRowMargin(element)
      const rowMarginHeight = rowMargin * 2
      // 行高前缀和（未缩放）：拆分循环内直接取行起点，避免重复累计
      const trHeightPrefix: number[] = [0]
      for (let r = 0; r < trList!.length; r++) {
        trHeightPrefix.push(trHeightPrefix[r] + trList![r].height!)
      }
      // 跨行合并单元格索引（rowspan > 1）：整表一次性收集，
      // 拆分适应度计算与片段进位枚举复用，避免逐次全表扫描
      const rowspanTdList: ITd[] = []
      for (const tr of trList!) {
        for (const td of tr.tdList) {
          if (td.rowspan > 1) {
            rowspanTdList.push(td)
          }
        }
      }
      // 行内拆分条件：行内各单元格均有内容
      // （跨行合并单元格按窗口裁剪续排，不再限制切分位置）
      const canSplitMidRow = (
        trIndex: number,
        targetPage: number,
        repeatHeight = 0
      ) => {
        const tr = trList?.[trIndex]
        if (!tr) return false
        const emptyHeight =
          (curPageLimit -
            this.draw.getMainOuterHeight(targetPage, curDirection) -
            rowMarginHeight) /
            scale -
          repeatHeight
        // Oversized rows must still progress, as in Word's cantSplit behavior.
        return (
          (!tr.keepTogether || tr.height > emptyHeight + 1e-8) &&
          tr.tdList.every(td => !!td.rowList?.length)
        )
      }
      // 拆分相关单元格：本行单元格 + 覆盖本行的跨行合并单元格
      const getSplitRelevantTdList = (trIndex: number) => {
        const tdList = [...trList![trIndex].tdList]
        for (const td of rowspanTdList) {
          if (td.rowIndex! < trIndex && td.rowIndex! + td.rowspan > trIndex) {
            tdList.push(td)
          }
        }
        return tdList
      }
      // 续留行盒最小高度（未缩放，避免产生空盒碎页）
      const minimumContinuation = (trIndex: number) =>
        Math.max(
          this.options.defaultSize,
          ...(trList?.[trIndex]?.tdList ?? []).map(td => {
            const padding = this.draw.getOriginalTdPadding(td)
            return padding[0] + padding[2] + this.options.defaultSize
          })
        )
      const minContinuationHeight = minimumContinuation(0)
      let fragmentStartTrIndex = 0
      let leadingExtra = 0
      const getWindowLayoutHeight = (
        trIndex: number,
        end: number,
        top: number
      ) => {
        const bottom = trHeightPrefix[trIndex] + end
        let height = bottom - top
        for (const td of getSplitRelevantTdList(trIndex)) {
          const start = Math.max(0, top - (td.y || 0))
          const finish = Math.min(td.height || 0, bottom - (td.y || 0))
          if (finish <= start) continue
          const offset =
            Math.max(0, (td.y || 0) - top) +
            ((td.rowIndex ?? 0) > fragmentStartTrIndex ? leadingExtra : 0)
          height = Math.max(
            height,
            offset +
              this.tableParticle.getTdWindowLayoutHeight(td, start, finish)
          )
        }
        return height
      }
      // 拆分适应度：窗口内可容纳内容行数、续页是否有剩余内容、内容实际消耗高度
      // 注意：窗口、行高、返回值均为未缩放单位（与 td.y/tr.height 一致）
      const getSplitFitInfo = (
        trIndex: number,
        windowHeight: number,
        visibleTopFull: number,
        availableHeight: number
      ) => {
        const trY = trHeightPrefix[trIndex]
        // A source cut may lie inside another cell's line. Bound the complete
        // rows at their rebased padded origin, preserving contiguous ownership.
        let fittedHeight = windowHeight
        while (true) {
          let next = fittedHeight
          for (const td of getSplitRelevantTdList(trIndex)) {
            const start = Math.max(0, visibleTopFull - (td.y || 0))
            const end = Math.min(
              td.height || 0,
              trY + fittedHeight - (td.y || 0)
            )
            if (end <= start) continue
            const offset =
              Math.max(0, (td.y || 0) - visibleTopFull) +
              ((td.rowIndex ?? 0) > fragmentStartTrIndex ? leadingExtra : 0)
            const safeEnd = this.tableParticle.fitTdWindowEnd(
              td,
              start,
              end,
              availableHeight - offset
            )
            if (safeEnd < end)
              next = Math.min(next, (td.y || 0) + safeEnd - trY)
          }
          if (next >= fittedHeight) break
          fittedHeight = Math.max(0, next)
        }
        let fit = 0
        let hasRemaining = false
        let consumedHeight = 0
        for (const td of getSplitRelevantTdList(trIndex)) {
          const tdPadding = this.draw.getOriginalTdPadding(td)
          // 单元格在整表坐标系中的窗口（可视区与本单元格区域的交集）
          const tdWindowEnd = Math.min(td.height!, trY + fittedHeight - td.y!)
          const tdWindowStart = Math.max(0, visibleTopFull - td.y!)
          if (tdWindowEnd <= tdWindowStart) continue
          const [startLine, endLine] =
            this.tableParticle.getTdLineRangeBySplitWindow(
              td,
              tdWindowStart,
              tdWindowEnd
            )
          fit = Math.max(fit, endLine - startLine)
          if (endLine < td.rowList!.length) hasRemaining = true
          // 内容底部（相对行顶）：决定拆分点所需的最小行高
          // 内容行高为缩放单位，需还原为未缩放后再与行坐标运算；
          // 续排窗口需计入窗口之前已消耗的内容行高，否则续页消耗高度被低估
          const contentHeight = td
            .rowList!.slice(0, endLine)
            .reduce((pre, cur) => pre + cur.height + (cur.offsetY || 0), 0)
          const contentBottom =
            td.y! + tdPadding[0] + tdPadding[2] + contentHeight / scale - trY
          consumedHeight = Math.max(consumedHeight, contentBottom)
        }
        return { fit, hasRemaining, consumedHeight, fittedHeight }
      }
      // 表格起始槽位：分页符或当前页容不下第一行时移至下一槽位（可行内拆分则留在当前页）
      let fragPageNo = pageNo
      let fragColumn = currentColumn
      let fragPageHeight = pageHeight + carriedOffsetY
      // Row computation sees the whole table height and can predict an early
      // column advance. Place table fragments using actual occupied space,
      // so a fitting first row is not stranded out of the previous column.
      // 片段槽位推进：分栏时优先换栏，否则换页
      const advanceFragSlot = (forcePageBreak = false) => {
        if (
          !forcePageBreak &&
          isColumnEnabled &&
          fragColumn < columnCount - 1
        ) {
          fragColumn++
        } else {
          fragPageNo++
          fragColumn = 0
        }
        fragPageHeight =
          this.draw.getMainOuterHeight(fragPageNo, curDirection) +
          carriedOffsetY
      }
      if (isPrePageBreak) {
        if (preBreakDirection) {
          curDirection = preBreakDirection
          curPageLimit = this.draw.getHeight(curDirection)
        }
        advanceFragSlot(true)
      } else if (
        fragPageHeight + trList![0].height! * scale + rowMarginHeight >
        curPageLimit
      ) {
        const firstTrAvailable = curPageLimit - fragPageHeight - rowMarginHeight
        const { fit, hasRemaining, consumedHeight, fittedHeight } =
          canSplitMidRow(0, fragPageNo)
            ? getSplitFitInfo(
                0,
                firstTrAvailable / scale,
                0,
                firstTrAvailable / scale
              )
            : {
                fit: 0,
                hasRemaining: false,
                consumedHeight: 0,
                fittedHeight: 0
              }
        // 第一行可行内拆分时留在当前页（规则同拆分循环）
        let endSplitHeight = -1
        if (fit >= 1) {
          if (hasRemaining) {
            endSplitHeight = Math.min(consumedHeight, fittedHeight)
            if (trList![0].height! - endSplitHeight < minContinuationHeight) {
              endSplitHeight = trList![0].height! - minContinuationHeight
            }
          } else if (
            trList![0].height! - firstTrAvailable / scale >=
            minContinuationHeight
          ) {
            endSplitHeight = fittedHeight
          }
        }
        if (endSplitHeight <= 0) {
          advanceFragSlot()
        }
      }
      // 整表未超出当前页时不拆分
      const tableHeight = element.height! * scale
      if (fragPageHeight + rowMarginHeight + tableHeight <= curPageLimit) {
        passThrough()
        continue
      }
      // 计算片段（每槽尽量铺满；超高单元格按内容行行内拆分）
      const fragments: {
        startTrIndex: number
        endTrIndex: number
        startSplitTrOffset?: number
        endSplitTrHeight?: number
        columnIndex?: number
      }[] = []
      let start = 0
      // 当前起始行在之前页已消耗的高度（未缩放）
      let pendingOffset = 0
      // 片段落位槽位
      let slotPageNo = fragPageNo
      let slotColumn = fragColumn
      let cutPageHeight = fragPageHeight
      const repeatTrIndexes: number[] = []
      let repeatHeight = 0
      let isSplitAborted = false
      while (start < trList!.length) {
        const minContinuationHeight = minimumContinuation(start)
        const isFirstFragment = fragments.length === 0
        if (!isFirstFragment) {
          // 推进到下一个槽位并取其页高
          if (isColumnEnabled && slotColumn < columnCount - 1) {
            slotColumn++
          } else {
            slotPageNo++
            slotColumn = 0
          }
          cutPageHeight = this.draw.getMainOuterHeight(slotPageNo, curDirection)
          if (fragments.length === 1) {
            // 续页回显表头：首页片段范围内的分页重复行
            for (let r = 0; r < fragments[0].endTrIndex; r++) {
              const tr = trList![r]
              if (tr.pagingRepeat) {
                repeatTrIndexes.push(r)
                repeatHeight += tr.height!
              }
            }
            // 回显表头占满续页可用高度时禁用回显：
            // 保证每页至少容纳一行内容，避免续排行拆分无法推进
            if (
              repeatTrIndexes.length &&
              curPageLimit -
                cutPageHeight -
                rowMarginHeight -
                repeatHeight * scale <
                minContinuationHeight * scale
            ) {
              repeatTrIndexes.length = 0
              repeatHeight = 0
            }
          }
        }
        const reserved =
          rowMarginHeight + (isFirstFragment ? 0 : repeatHeight * scale)
        // 本页可用于表格内容的高度
        const availableTotal = curPageLimit - cutPageHeight - reserved
        // 可用高度不足一行内容（极端页高/页边距）：
        // 放弃拆分，整表按原行透出，避免续排行拆分循环无法推进
        if (availableTotal < minContinuationHeight * scale) {
          if (carriedOffsetY > 0 && isFirstFragment) {
            throw new Error(
              'Table flow cannot fit alongside carried area padding.'
            )
          }
          isSplitAborted = true
          break
        }
        // 当前片段可视区顶部（整表坐标）
        const visibleTopFull = trHeightPrefix[start] + pendingOffset
        fragmentStartTrIndex = start
        leadingExtra = 0
        const remainingHeight = getWindowLayoutHeight(
          start,
          trList![start].height,
          visibleTopFull
        )
        leadingExtra = Math.max(
          0,
          remainingHeight - (trList![start].height - pendingOffset)
        )
        // 续排行仍然超页：按内容行继续行内拆分
        if (pendingOffset > 0) {
          if (remainingHeight < minContinuationHeight) {
            isSplitAborted = true
            break
          }
          const remainScaled = remainingHeight * scale
          if (remainScaled > availableTotal) {
            const windowHeight = Math.min(
              trList![start].height,
              pendingOffset + availableTotal / scale
            )
            const { fit, hasRemaining, consumedHeight, fittedHeight } =
              getSplitFitInfo(
                start,
                windowHeight,
                visibleTopFull,
                availableTotal / scale
              )
            let endOffset = fittedHeight
            if (fit >= 1 && hasRemaining) {
              endOffset = Math.min(consumedHeight, fittedHeight)
              // 给续留行盒留足最小高度（保底不少于已消耗高度，防止无法推进）
              if (trList![start].height! - endOffset < minContinuationHeight) {
                endOffset = Math.max(
                  pendingOffset + 1,
                  trList![start].height! - minContinuationHeight
                )
              }
            }
            // 推进保障：每轮拆分必须消耗新的高度，不允许原地踏步
            if (endOffset <= pendingOffset) {
              // An indivisible object taller than an empty slot cannot be
              // split. Retain the existing overflow fallback, never resize it
              // or discard already prepared fragments (including maxPageNo).
              fragments.push({
                startTrIndex: start,
                endTrIndex: trList!.length,
                startSplitTrOffset: pendingOffset,
                columnIndex: slotColumn
              })
              break
            }
            fragments.push({
              startTrIndex: start,
              endTrIndex: start + 1,
              startSplitTrOffset: pendingOffset,
              endSplitTrHeight: endOffset,
              columnIndex: slotColumn
            })
            pendingOffset = endOffset
            continue
          }
        }
        // 起始行（可能为续排行）之后的行逐行填充
        let accHeight = pendingOffset > 0 ? remainingHeight * scale : 0
        let end = pendingOffset > 0 ? start + 1 : start
        let endSplitTrHeight: number | undefined
        let isAbort = false
        let isFinished = false
        while (true) {
          if (end >= trList!.length) {
            isFinished = true
            break
          }
          const trHeight = trList![end].height! * scale
          const layoutHeight = Math.max(
            accHeight + trHeight,
            getWindowLayoutHeight(end, trList![end].height, visibleTopFull) *
              scale
          )
          if (layoutHeight <= availableTotal + 1e-8) {
            accHeight = layoutHeight
            end++
            continue
          }
          // 当前行放不下：优先尝试行内拆分（超高单元格内容行续排）
          const available = availableTotal - accHeight
          if (
            canSplitMidRow(end, slotPageNo, isFirstFragment ? 0 : repeatHeight)
          ) {
            const { fit, hasRemaining, consumedHeight, fittedHeight } =
              getSplitFitInfo(
                end,
                available / scale,
                visibleTopFull,
                availableTotal / scale
              )
            let candidate = -1
            if (fit >= 1) {
              if (hasRemaining) {
                // 续页还有内容：拆分点取实际消耗高度，并给续留行盒留足最小高度
                candidate = Math.min(consumedHeight, fittedHeight)
                if (trList![end].height! - candidate < minContinuationHeight) {
                  candidate = trList![end].height! - minContinuationHeight
                }
              } else if (
                trList![end].height! - available / scale >=
                minContinuationHeight
              ) {
                // 内容全部放下且续留行盒非碎页：按可用高度拆分填满页面
                candidate = fittedHeight
              }
            }
            if (candidate > 0) {
              endSplitTrHeight = candidate
              break
            }
          }
          // 行边界切分（跨行合并单元格按窗口裁剪续排）
          if (end <= start) {
            // 首行即无法切分：首个片段即失败则整表放弃拆分，否则剩余行作为末片段
            if (!fragments.length) {
              isAbort = true
            } else {
              end = trList!.length
              isFinished = true
            }
          }
          break
        }
        if (isAbort) {
          isSplitAborted = true
          break
        }
        fragments.push({
          startTrIndex: start,
          endTrIndex: endSplitTrHeight !== undefined ? end + 1 : end,
          startSplitTrOffset: pendingOffset || undefined,
          endSplitTrHeight,
          columnIndex: slotColumn
        })
        start = end
        pendingOffset = endSplitTrHeight ?? 0
        if (isFinished) break
      }
      if (isSplitAborted) {
        passThrough()
        continue
      }
      hasSplitTable = true
      // 发射片段行（首片段外的每个片段各占一个槽位）
      const rowElement = row.elementList[0]
      let skipHeight = 0
      let skipIndex = 0
      for (let f = 0; f < fragments.length; f++) {
        const fragment = fragments[f]
        const isFirstFragment = f === 0
        const fragRepeatTrIndexes =
          !isFirstFragment && repeatTrIndexes.length
            ? repeatTrIndexes
            : undefined
        const fragRepeatHeight = fragRepeatTrIndexes ? repeatHeight : 0
        // 片段内容高度：行内拆分行按可见高度计算（与绘制/位置层同一口径）
        const tableFragment: ITableRowFragment = {
          startTrIndex: fragment.startTrIndex,
          endTrIndex: fragment.endTrIndex,
          skipHeight,
          repeatHeight: fragRepeatHeight,
          repeatTrIndexes: fragRepeatTrIndexes,
          startSplitTrOffset: fragment.startSplitTrOffset,
          endSplitTrHeight: fragment.endSplitTrHeight,
          carriedTds: rowspanTdList.filter(
            td =>
              (td.rowIndex ?? 0) < fragment.startTrIndex &&
              (td.rowIndex ?? 0) + td.rowspan > fragment.startTrIndex
          )
        }
        const contentHeight = this.tableParticle.computeFragmentLayoutHeight(
          element,
          tableFragment
        )
        const fragHeight = (contentHeight + fragRepeatHeight) * scale
        newRowList.push({
          ...row,
          height: fragHeight + rowMargin,
          offsetY: isFirstFragment ? row.offsetY : 0,
          // 列表标记仅在首片段绘制
          isList: isFirstFragment ? row.isList : false,
          // 分栏布局下片段落位到对应栏
          ...(isColumnEnabled ? { columnIndex: fragment.columnIndex } : {}),
          elementList: [
            {
              ...rowElement,
              metrics: {
                width: rowElement.metrics.width,
                height: fragHeight,
                boundingBoxAscent: rowElement.metrics.boundingBoxAscent,
                boundingBoxDescent: fragHeight
              }
            }
          ],
          tableFragment
        })
        // skipHeight 累计下一片段起始行之前的完整行高
        const nextStart = fragments[f + 1]?.startTrIndex ?? 0
        while (skipIndex < nextStart) {
          skipHeight += trList![skipIndex].height!
          skipIndex++
        }
      }
      // 后续行的槽位累计
      pageNo = slotPageNo
      currentColumn = slotColumn
      const lastFragRow = newRowList[newRowList.length - 1]
      pageHeight =
        this.draw.getMainOuterHeight(pageNo, curDirection) +
        lastFragRow.height +
        (lastFragRow.offsetY || 0) +
        (fragments.length === 1 ? carriedOffsetY : 0)
    }
    // 重排行号
    for (let r = 0; r < newRowList.length; r++) {
      newRowList[r].rowIndex = r
    }
    return newRowList
  }

  // maxPageNo 截断：按片段边界裁剪表格，保留已展示片段内容。
  // 处理拆分行部分内容、跨越裁剪点的 rowspan 收缩及光标上下文迁移；
  // 返回是否有内容被保留（首个片段即超限时返回 false，应整体删除）
  public truncateTableByFragment(
    element: IElement,
    fragment: ITableRowFragment,
    elementList: IElement[]
  ): boolean {
    const { startTrIndex, startSplitTrOffset, skipHeight } = fragment
    const trList = element.trList!
    const trimmedTdSet = new Set<ITd>()
    let keepTrCount = startTrIndex
    // 裁剪点位于拆分行中间：保留该行已展示的内容行与高度
    if (startSplitTrOffset) {
      const splitTr = trList[startTrIndex]
      for (const td of splitTr.tdList) {
        if (this._trimTdContentToWindow(td, startSplitTrOffset)) {
          trimmedTdSet.add(td)
        }
        td.height = startSplitTrOffset
      }
      splitTr.height = startSplitTrOffset
      splitTr.minHeight = Math.min(
        splitTr.minHeight ?? startSplitTrOffset,
        startSplitTrOffset
      )
      // 跨入拆分行的合并单元格：按同一可见窗口裁剪内容
      const visibleBottom = skipHeight + startSplitTrOffset
      for (let r = 0; r < startTrIndex; r++) {
        for (const td of trList[r].tdList) {
          if (td.rowIndex! + td.rowspan <= startTrIndex) continue
          const windowEnd = visibleBottom - td.y!
          if (windowEnd >= td.height!) continue
          if (this._trimTdContentToWindow(td, windowEnd)) {
            trimmedTdSet.add(td)
          }
        }
      }
      keepTrCount = startTrIndex + 1
    }
    // 首个片段即超限（表格内容未展示）：整体删除
    if (!keepTrCount) return false
    // 行高前缀和：单元格高度按跨度差值计算，避免逐单元格重复求和
    const trHeightPrefix: number[] = [0]
    for (let r = 0; r < keepTrCount; r++) {
      trHeightPrefix.push(trHeightPrefix[r] + trList[r].height!)
    }
    // 跨越裁剪点的跨行合并单元格：收缩跨度；
    // 行高可能已被裁剪缩短（含恰好结束于拆分行的合并单元格），统一按跨度重算高度
    for (let r = 0; r < keepTrCount; r++) {
      for (const td of trList[r].tdList) {
        if (td.rowIndex! + td.rowspan > keepTrCount) {
          td.rowspan = keepTrCount - td.rowIndex!
        }
        td.height =
          trHeightPrefix[td.rowIndex! + td.rowspan] -
          trHeightPrefix[td.rowIndex!]
      }
    }
    element.trList = trList.slice(0, keepTrCount)
    // 同步表格高度（行数已截断，避免导出数据行高不一致）
    element.height = this.tableParticle.getTableHeight(element)
    // 修复截断后的光标上下文与选区索引
    this._repairTableContextAfterTruncate(
      element,
      keepTrCount,
      trimmedTdSet,
      elementList
    )
    return true
  }
  // 按可见窗口裁剪单元格内容与内容行（至少保留一个补偿节点，维持单元格非空约定）
  private _trimTdContentToWindow(td: ITd, windowEnd: number): boolean {
    const originalValueLength = td.value.length
    const { scale } = this.options
    const tdPadding = this.draw.getOriginalTdPadding(td)
    let [, endLine] = this.tableParticle.getTdLineRangeBySplitWindow(
      td,
      0,
      Math.max(0, windowEnd)
    )
    // 裁剪后内容自然高度（内边距 + 内容行）不得超出行盒，
    // 防止下次渲染按内容重新长高导致保留行再次被截断（截断震荡）
    const rowList = td.rowList!
    const tdPaddingHeight = tdPadding[0] + tdPadding[2]
    let accHeight = 0
    let fitLine = 0
    for (let i = 0; i < endLine; i++) {
      const nextHeight =
        accHeight + (rowList[i].height + (rowList[i].offsetY || 0)) / scale
      if (tdPaddingHeight + nextHeight > windowEnd) break
      accHeight = nextHeight
      fitLine = i + 1
    }
    endLine = fitLine
    const endElementIndex =
      endLine < rowList.length ? rowList[endLine].startIndex : td.value.length
    if (!endElementIndex) {
      const { trId, tableId } = td.value[0] || {}
      td.value = [{ value: ZERO, tdId: td.id, trId, tableId }]
      // 同步重建内容行，避免位置/绘制使用过期行信息
      td.rowList = this.draw.computeRowList({
        innerWidth: (td.width! - (tdPadding[1] + tdPadding[3])) * scale,
        elementList: td.value,
        isFromTable: true,
        isPagingMode: this.draw.getIsPagingMode()
      })
      return true
    }
    // 内容与内容行同步裁剪，避免位置/绘制使用过期行信息
    td.value = td.value.slice(0, endElementIndex)
    td.rowList = rowList.slice(0, endLine)
    return endElementIndex < originalValueLength
  }
  // maxPageNo 截断后修复表格光标上下文与选区：
  // 被裁剪行的光标迁移到末尾可见单元格并重建干净上下文；
  // 嵌套表格路径失效时折叠到外层单元格；选区索引收缩到保留范围内
  private _repairTableContextAfterTruncate(
    element: IElement,
    keepTrCount: number,
    trimmedTdSet: Set<ITd>,
    elementList: IElement[]
  ) {
    // 跨行列选区存在被删除端点时直接折叠，避免合并单元格下将 tdIndex
    // 误当作物理列号映射到错误单元格（与光标上下文无关，需独立修复）
    const range = this.draw.getRange().getRange()
    if (
      range.isCrossRowCol &&
      range.tableId === element.id &&
      ((range.startTrIndex ?? 0) >= keepTrCount ||
        (range.endTrIndex ?? 0) >= keepTrCount)
    ) {
      const cursorTd = this.draw
        .getPosition()
        .getTableTdByContext(
          elementList,
          this.draw.getPosition().getPositionContext()
        )
      const collapseIndex = Math.max(0, (cursorTd?.value.length ?? 1) - 1)
      this.draw.getRange().setRange(collapseIndex, collapseIndex)
    }
    const positionContext = this.draw.getPosition().getPositionContext()
    if (!positionContext.isTable) return
    // 嵌套表格时以路径根节点（外层表格）判断所在行是否被裁剪
    const pathRoot = positionContext.tablePath?.[0]
    const contextTableIndex = pathRoot ? pathRoot.index : positionContext.index
    const contextTrIndex = pathRoot ? pathRoot.trIndex : positionContext.trIndex
    if (
      contextTableIndex === undefined ||
      elementList[contextTableIndex] !== element
    ) {
      return
    }
    const rootTrIndex = pathRoot?.trIndex ?? positionContext.trIndex
    const rootTdIndex = pathRoot?.tdIndex ?? positionContext.tdIndex
    const rootTd =
      rootTrIndex !== undefined && rootTdIndex !== undefined
        ? element.trList?.[rootTrIndex]?.tdList[rootTdIndex]
        : undefined
    if (rootTd && trimmedTdSet.has(rootTd)) {
      // 当前单元格内容被裁剪后，元素命中状态可能指向已删除内容。
      // 仅保留表格结构定位，避免后续删除/方向键误走图片或控件分支。
      this.draw.getPosition().setPositionContext({
        isTable: true,
        index: positionContext.index,
        trIndex: positionContext.trIndex,
        tdIndex: positionContext.tdIndex,
        tdId: positionContext.tdId,
        trId: positionContext.trId,
        tableId: positionContext.tableId,
        tablePath: positionContext.tablePath
      })
    }
    if (contextTrIndex !== undefined && contextTrIndex >= keepTrCount) {
      // 光标所在行被裁剪：迁移到末尾实际可见单元格（含跨行覆盖该行的单元格）
      const visibleTdList = this.tableParticle.getTdListByRowIndex(
        element.trList!,
        keepTrCount - 1
      )
      const lastTd = visibleTdList[visibleTdList.length - 1]
      if (lastTd) {
        // 构造干净上下文（丢弃旧单元格的元素命中状态），嵌套折叠到外层单元格
        const cleanContext: IPositionContext = {
          isTable: true,
          index: contextTableIndex,
          tablePath: pathRoot ? [pathRoot] : undefined
        }
        this.draw
          .getPosition()
          .setPositionContext(
            this.draw
              .getPosition()
              .buildTablePositionContext(
                cleanContext,
                element,
                lastTd.rowIndex!,
                lastTd.tdIndex!
              )
          )
        // 跨单元格迁移后原选区失效：折叠为末尾内容处的光标
        this.draw
          .getRange()
          .setRange(
            Math.max(0, lastTd.value.length - 1),
            Math.max(0, lastTd.value.length - 1)
          )
      } else {
        this.draw.getPosition().setPositionContext({ isTable: false })
      }
    } else if (pathRoot) {
      // 根行保留但嵌套表格可能已被内容裁剪：校验完整路径，失效则折叠到外层单元格
      const cursorTd = this.draw
        .getPosition()
        .getTableTdByContext(elementList, positionContext)
      if (!cursorTd) {
        const cleanContext: IPositionContext = {
          isTable: true,
          index: contextTableIndex,
          tablePath: [pathRoot]
        }
        this.draw
          .getPosition()
          .setPositionContext(
            this.draw
              .getPosition()
              .buildTablePositionContext(
                cleanContext,
                element,
                pathRoot.trIndex,
                pathRoot.tdIndex
              )
          )
      }
    }
    // 光标所在单元格内容被裁短时，选区索引收缩到保留范围内
    const cursorTd = this.draw
      .getPosition()
      .getTableTdByContext(
        elementList,
        this.draw.getPosition().getPositionContext()
      )
    if (cursorTd) {
      const maxIndex = cursorTd.value.length - 1
      const { startIndex, endIndex, isCrossRowCol } = this.draw
        .getRange()
        .getRange()
      if (
        !isCrossRowCol &&
        maxIndex >= 0 &&
        (startIndex > maxIndex || endIndex > maxIndex)
      ) {
        this.draw
          .getRange()
          .setRange(
            Math.min(startIndex, maxIndex),
            Math.min(endIndex, maxIndex)
          )
      }
    }
  }
}
