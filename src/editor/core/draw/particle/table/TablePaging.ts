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
    const height = this.draw.getHeight()
    // 分栏布局：行落位以（页码, 栏索引）槽位推进，与 _computePageList 规则一致
    const columnLayout = this.draw.getColumnLayout()
    const columnCount = columnLayout?.count || 1
    const isColumnEnabled = columnCount > 1
    let pageNo = 0
    let currentColumn = 0
    // 与 _computePageList 保持一致的页面填充累计语义
    let pageHeight = this.draw.getMainOuterHeight(0)
    const newRowList: IRow[] = []
    // 是否已发生表格拆分（之后行的栏索引需按实际填充重新推导）
    let hasSplitTable = false
    for (let i = 0; i < rowList.length; i++) {
      const row = rowList[i]
      const element = row.elementList[0]
      const trList = element?.trList
      // 上一行是分页符则当前行另起新页
      const isPrePageBreak = !!rowList[i - 1]?.isPageBreak
      // 推进到下一个槽位：分栏时优先换栏，否则换页
      const advanceSlot = () => {
        if (isColumnEnabled && currentColumn < columnCount - 1) {
          currentColumn++
        } else {
          pageNo++
          currentColumn = 0
        }
        pageHeight = this.draw.getMainOuterHeight(pageNo)
      }
      // 非表格行透传（与 _computePageList 一致：显式换栏重置页高，溢出换槽）
      const passThrough = () => {
        if (
          isColumnEnabled &&
          row.columnIndex !== undefined &&
          row.columnIndex > currentColumn &&
          !hasSplitTable
        ) {
          currentColumn = row.columnIndex
          pageHeight = this.draw.getMainOuterHeight(pageNo)
        }
        if (
          row.height + (row.offsetY || 0) + pageHeight > height ||
          isPrePageBreak
        ) {
          advanceSlot()
        }
        // 拆分后行的栏索引按实际填充重新推导
        if (isColumnEnabled) row.columnIndex = currentColumn
        pageHeight += row.height + (row.offsetY || 0)
        newRowList.push(row)
      }
      const isHiddenTable =
        element?.type === ElementType.TABLE &&
        (element.hide ||
          element.control?.hide ||
          (element.area?.hide && !this.draw.isAreaHideDisabled()) ||
          this.draw.getTraceParticle().isTraceHidden(element)) &&
        !this.draw.isDesignMode()
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
      // 行内拆分条件：行内各单元格均有内容
      // （跨行合并单元格按窗口裁剪续排，不再限制切分位置）
      const canSplitMidRow = (trIndex: number) =>
        trList![trIndex].tdList.every(td => !!td.rowList?.length)
      // 拆分相关单元格：本行单元格 + 覆盖本行的跨行合并单元格
      const getSplitRelevantTdList = (trIndex: number) => {
        const tdList = [...trList![trIndex].tdList]
        for (const tr of trList!) {
          for (const td of tr.tdList) {
            if (td.rowIndex! < trIndex && td.rowIndex! + td.rowspan > trIndex) {
              tdList.push(td)
            }
          }
        }
        return tdList
      }
      // 拆分适应度：窗口内可容纳内容行数、续页是否有剩余内容、内容实际消耗高度
      // 注意：窗口、行高、返回值均为未缩放单位（与 td.y/tr.height 一致）
      const getSplitFitInfo = (
        trIndex: number,
        windowHeight: number,
        visibleTopFull: number
      ) => {
        const trY = trHeightPrefix[trIndex]
        const {
          table: { tdPadding }
        } = this.options
        let fit = 0
        let hasRemaining = false
        let consumedHeight = 0
        for (const td of getSplitRelevantTdList(trIndex)) {
          // 单元格在整表坐标系中的窗口（可视区与本单元格区域的交集）
          const tdWindowEnd = Math.min(td.height!, trY + windowHeight - td.y!)
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
          const fitHeight = td
            .rowList!.slice(startLine, endLine)
            .reduce((pre, cur) => pre + cur.height, 0)
          const preHeight = td
            .rowList!.slice(0, startLine)
            .reduce((pre, cur) => pre + cur.height, 0)
          const contentBottom =
            td.y! +
            tdPadding[0] +
            tdPadding[2] +
            (preHeight + fitHeight) / scale -
            trY
          consumedHeight = Math.max(consumedHeight, contentBottom)
        }
        return { fit, hasRemaining, consumedHeight }
      }
      // 续留行盒最小高度（未缩放，避免产生空盒碎页）
      const {
        table: { tdPadding },
        defaultSize
      } = this.options
      const minContinuationHeight = tdPadding[0] + tdPadding[2] + defaultSize
      // 表格起始槽位：分页符或当前页容不下第一行时移至下一槽位（可行内拆分则留在当前页）
      let fragPageNo = pageNo
      let fragColumn = currentColumn
      let fragPageHeight = pageHeight
      // 表格显式换栏（栏索引大于当前栏）：从下一栏顶部开始
      if (
        isColumnEnabled &&
        row.columnIndex !== undefined &&
        row.columnIndex > currentColumn
      ) {
        fragColumn = row.columnIndex
        fragPageHeight = this.draw.getMainOuterHeight(fragPageNo)
      }
      // 片段槽位推进：分栏时优先换栏，否则换页
      const advanceFragSlot = () => {
        if (isColumnEnabled && fragColumn < columnCount - 1) {
          fragColumn++
        } else {
          fragPageNo++
          fragColumn = 0
        }
        fragPageHeight = this.draw.getMainOuterHeight(fragPageNo)
      }
      if (isPrePageBreak) {
        advanceFragSlot()
      } else if (
        fragPageHeight + trList![0].height! * scale + rowMarginHeight >
        height
      ) {
        const firstTrAvailable = height - fragPageHeight - rowMarginHeight
        const { fit, hasRemaining, consumedHeight } = canSplitMidRow(0)
          ? getSplitFitInfo(0, firstTrAvailable / scale, 0)
          : { fit: 0, hasRemaining: false, consumedHeight: 0 }
        // 第一行可行内拆分时留在当前页（规则同拆分循环）
        let endSplitHeight = -1
        if (fit >= 1) {
          if (hasRemaining) {
            endSplitHeight = Math.min(consumedHeight, firstTrAvailable / scale)
            if (trList![0].height! - endSplitHeight < minContinuationHeight) {
              endSplitHeight = trList![0].height! - minContinuationHeight
            }
          } else if (
            trList![0].height! - firstTrAvailable / scale >=
            minContinuationHeight
          ) {
            endSplitHeight = firstTrAvailable / scale
          }
        }
        if (endSplitHeight <= 0) {
          advanceFragSlot()
        }
      }
      // 整表未超出当前页时不拆分
      const tableHeight = element.height! * scale
      if (fragPageHeight + rowMarginHeight + tableHeight <= height) {
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
        const isFirstFragment = fragments.length === 0
        if (!isFirstFragment) {
          // 推进到下一个槽位并取其页高
          if (isColumnEnabled && slotColumn < columnCount - 1) {
            slotColumn++
          } else {
            slotPageNo++
            slotColumn = 0
          }
          cutPageHeight = this.draw.getMainOuterHeight(slotPageNo)
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
              height - cutPageHeight - rowMarginHeight - repeatHeight * scale <
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
        const availableTotal = height - cutPageHeight - reserved
        // 可用高度不足一行内容（极端页高/页边距）：
        // 放弃拆分，整表按原行透出，避免续排行拆分循环无法推进
        if (availableTotal < minContinuationHeight * scale) {
          isSplitAborted = true
          break
        }
        // 当前片段可视区顶部（整表坐标）
        const visibleTopFull = trHeightPrefix[start] + pendingOffset
        // 续排行仍然超页：按内容行继续行内拆分
        if (pendingOffset > 0) {
          const remainScaled = (trList![start].height! - pendingOffset) * scale
          if (remainScaled > availableTotal) {
            const windowHeight = pendingOffset + availableTotal / scale
            const { fit, hasRemaining, consumedHeight } = getSplitFitInfo(
              start,
              windowHeight,
              visibleTopFull
            )
            let endOffset = windowHeight
            if (fit >= 1 && hasRemaining) {
              endOffset = Math.min(consumedHeight, windowHeight)
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
              endOffset = pendingOffset + 1
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
        let accHeight =
          pendingOffset > 0
            ? (trList![start].height! - pendingOffset) * scale
            : 0
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
          if (accHeight + trHeight <= availableTotal) {
            accHeight += trHeight
            end++
            continue
          }
          // 当前行放不下：优先尝试行内拆分（超高单元格内容行续排）
          const available = availableTotal - accHeight
          if (canSplitMidRow(end)) {
            const { fit, hasRemaining, consumedHeight } = getSplitFitInfo(
              end,
              available / scale,
              visibleTopFull
            )
            let candidate = -1
            if (fit >= 1) {
              if (hasRemaining) {
                // 续页还有内容：拆分点取实际消耗高度，并给续留行盒留足最小高度
                candidate = Math.min(consumedHeight, available / scale)
                if (trList![end].height! - candidate < minContinuationHeight) {
                  candidate = trList![end].height! - minContinuationHeight
                }
              } else if (
                trList![end].height! - available / scale >=
                minContinuationHeight
              ) {
                // 内容全部放下且续留行盒非碎页：按可用高度拆分填满页面
                candidate = available / scale
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
      // 跨行合并单元格索引（rowspan > 1）：整表一次性收集，避免逐片段全表扫描
      const rowspanTdList: ITd[] = []
      for (const tr of trList!) {
        for (const td of tr.tdList) {
          if (td.rowspan > 1) {
            rowspanTdList.push(td)
          }
        }
      }
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
        const contentHeight = this.tableParticle.getFragmentContentHeight(
          element,
          fragment
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
          tableFragment: {
            startTrIndex: fragment.startTrIndex,
            endTrIndex: fragment.endTrIndex,
            skipHeight,
            repeatHeight: fragRepeatHeight,
            repeatTrIndexes: fragRepeatTrIndexes,
            startSplitTrOffset: fragment.startSplitTrOffset,
            endSplitTrHeight: fragment.endSplitTrHeight,
            // 带入片段的跨行合并单元格（覆盖片段起始行）
            carriedTds: rowspanTdList.length
              ? rowspanTdList.filter(
                  td =>
                    td.rowIndex! < fragment.startTrIndex &&
                    td.rowIndex! + td.rowspan > fragment.startTrIndex
                )
              : undefined
          }
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
        this.draw.getMainOuterHeight(pageNo) +
        lastFragRow.height +
        (lastFragRow.offsetY || 0)
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
    // 跨越裁剪点的跨行合并单元格：收缩跨度；
    // 行高可能已被裁剪缩短（含恰好结束于拆分行的合并单元格），统一按跨度重算高度
    for (let r = 0; r < keepTrCount; r++) {
      for (const td of trList[r].tdList) {
        if (td.rowIndex! + td.rowspan > keepTrCount) {
          td.rowspan = keepTrCount - td.rowIndex!
        }
        td.height = trList
          .slice(td.rowIndex!, td.rowIndex! + td.rowspan)
          .reduce((pre, cur) => pre + cur.height!, 0)
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
    const {
      scale,
      table: { tdPadding }
    } = this.options
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
      const nextHeight = accHeight + rowList[i].height / scale
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
