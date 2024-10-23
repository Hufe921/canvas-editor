import { ElementType, IElement, TableBorder } from '../../../..'
import { TdBorder, TdSlash } from '../../../../dataset/enum/table/Table'
import { DeepRequired } from '../../../../interface/Common'
import { IEditorOption } from '../../../../interface/Editor'
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
  isDrawFullBorder?: boolean
}

interface IMergeSplittedTablePayload {
  elementList: IElement[]
  element: IElement
  index: number
  curIndex?: number
  mergeForward?: boolean
}

export class TableParticle {
  private draw: Draw
  private range: RangeManager
  private options: DeepRequired<IEditorOption>

  constructor(draw: Draw) {
    this.draw = draw
    this.range = draw.getRange()
    this.options = draw.getOptions()
  }

  public getTrListGroupByCol(payload: ITr[]): ITr[] {
    const trList = deepClone(payload)
    for (let t = 0; t < payload.length; t++) {
      const tr = trList[t]
      for (let d = tr.tdList.length - 1; d >= 0; d--) {
        const td = tr.tdList[d]
        const { rowspan, rowIndex, colIndex } = td
        const curRowIndex = rowIndex! + rowspan - 1
        if (curRowIndex !== d) {
          const changeTd = tr.tdList.splice(d, 1)[0]
          trList[curRowIndex]?.tdList.splice(colIndex!, 0, changeTd)
        }
      }
    }
    return trList
  }

  public getRangeRowCol(): ITd[][] | null {
    const { isTable, index, trIndex, tdIndex } = this.draw
      .getPosition()
      .getPositionContext()
    if (!isTable) return null
    const {
      isCrossRowCol,
      startTdIndex,
      endTdIndex,
      startTrIndex,
      endTrIndex
    } = this.range.getRange()
    const originalElementList = this.draw.getOriginalElementList()
    const element = originalElementList[index!]
    const curTrList = element.trList!
    // 非跨列直接返回光标所在单元格
    if (!isCrossRowCol) {
      return [[curTrList[trIndex!].tdList[tdIndex!]]]
    }
    let startTd = curTrList[startTrIndex!].tdList[startTdIndex!]
    let endTd = curTrList[endTrIndex!].tdList[endTdIndex!]
    // 交换起始位置
    if (startTd.x! > endTd.x! || startTd.y! > endTd.y!) {
      // prettier-ignore
      [startTd, endTd] = [endTd, startTd]
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
    const { ctx, startX, startY, width, height, isDrawFullBorder } = payload
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
    ctx.translate(-0.5, -0.5)
  }

  private _drawSlash(
    ctx: CanvasRenderingContext2D,
    td: ITd,
    startX: number,
    startY: number
  ) {
    const { scale } = this.options
    ctx.save()
    const width = td.width! * scale
    const height = td.height! * scale
    const x = Math.round(td.x! * scale + startX)
    const y = Math.round(td.y! * scale + startY)
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
    startY: number
  ) {
    const { colgroup, trList, borderType } = element
    if (!colgroup || !trList) return
    const { scale } = this.options
    const tableWidth = element.width! * scale
    const tableHeight = element.height! * scale
    // 无边框
    const isEmptyBorderType = borderType === TableBorder.EMPTY
    // 仅外边框
    const isExternalBorderType = borderType === TableBorder.EXTERNAL
    ctx.save()
    ctx.lineWidth = scale
    // 渲染边框
    if (!isEmptyBorderType) {
      this._drawOuterBorder({
        ctx,
        startX,
        startY,
        width: tableWidth,
        height: tableHeight,
        isDrawFullBorder: isExternalBorderType
      })
    }
    // 渲染单元格
    for (let t = 0; t < trList.length; t++) {
      const tr = trList[t]
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        // 单元格内斜线
        if (td.slashTypes?.length) {
          this._drawSlash(ctx, td, startX, startY)
        }
        // 没有设置单元格边框 && 没有设置表格边框则忽略
        if (
          !td.borderTypes?.length &&
          (isEmptyBorderType || isExternalBorderType)
        ) {
          continue
        }
        const width = td.width! * scale
        const height = td.height! * scale
        const x = Math.round(td.x! * scale + startX + width)
        const y = Math.round(td.y! * scale + startY)
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
          ctx.moveTo(x, y)
          ctx.lineTo(x, y + height)
          ctx.lineTo(x - width, y + height)
          ctx.stroke()
        }
        ctx.translate(-0.5, -0.5)
      }
    }
    ctx.restore()
  }

  private _drawBackgroundColor(
    ctx: CanvasRenderingContext2D,
    element: IElement,
    startX: number,
    startY: number
  ) {
    const { trList } = element
    if (!trList) return
    const { scale } = this.options
    for (let t = 0; t < trList.length; t++) {
      const tr = trList[t]
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        if (!td.backgroundColor) continue
        ctx.save()
        const width = td.width! * scale
        const height = td.height! * scale
        const x = Math.round(td.x! * scale + startX)
        const y = Math.round(td.y! * scale + startY)
        ctx.fillStyle = td.backgroundColor
        ctx.fillRect(x, y, width, height)
        ctx.restore()
      }
    }
  }

  public getTableWidth(element: IElement): number {
    return element.colgroup!.reduce((pre, cur) => pre + cur.width, 0)
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
    startY: number
  ) {
    const { scale, rangeAlpha, rangeColor } = this.options
    const { type, trList } = element
    if (!trList || type !== ElementType.TABLE) return
    const {
      isCrossRowCol,
      startTdIndex,
      endTdIndex,
      startTrIndex,
      endTrIndex
    } = this.range.getRange()
    // 存在跨行/列
    if (!isCrossRowCol) return
    let startTd = trList[startTrIndex!].tdList[startTdIndex!]
    let endTd = trList[endTrIndex!].tdList[endTdIndex!]
    // 交换起始位置
    if (startTd.x! > endTd.x! || startTd.y! > endTd.y!) {
      // prettier-ignore
      [startTd, endTd] = [endTd, startTd]
    }
    const startColIndex = startTd.colIndex!
    const endColIndex = endTd.colIndex! + (endTd.colspan - 1)
    const startRowIndex = startTd.rowIndex!
    const endRowIndex = endTd.rowIndex! + (endTd.rowspan - 1)
    ctx.save()
    for (let t = 0; t < trList.length; t++) {
      const tr = trList[t]
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
          const x = td.x! * scale
          const y = td.y! * scale
          const width = td.width! * scale
          const height = td.height! * scale
          ctx.globalAlpha = rangeAlpha
          ctx.fillStyle = rangeColor
          ctx.fillRect(x + startX, y + startY, width, height)
        }
      }
    }
    ctx.restore()
  }

  public render(
    ctx: CanvasRenderingContext2D,
    element: IElement,
    startX: number,
    startY: number
  ) {
    this._drawBackgroundColor(ctx, element, startX, startY)
    this._drawBorder(ctx, element, startX, startY)
  }

  public mergeSplittedTable(payload: IMergeSplittedTablePayload) {
    let { element, index: i, curIndex } = payload
    const { elementList, mergeForward = false } = payload
    const position = this.draw.getPosition()
    const positionContext = position.getPositionContext()
    if (element.pagingId) {
      // 如果当前表格是拆分出来的，找到起始表格
      if (!mergeForward && element.pagingIndex! > 0) {
        i = i - element.pagingIndex!
        element = elementList[i]
      }
      let positionContextChanged = false
      // 位置上下文中的信息是表格拆分后记录的，这里需要将其先修正为表格合并后的上下文。渲染前排版拆分表格时将基于此再次修正位置上下文。
      if (positionContext.isTable) {
        // 如果位置上下文在当前表格或其拆分出的子表格中，则修正位置上下文（这里未调用setPositionContext是为了避免触发位置上下文改变的事件）
        const preTables: IElement[] = []
        outer: for (let index = i; index < elementList.length; index++) {
          const table = elementList[index]
          if (table.pagingId !== element.pagingId) {
            break
          } else if (positionContext.tableId === table.id) {
            for (let r = 0; r < table.trList!.length; r++) {
              for (let d = 0; d < table.trList![r].tdList.length; d++) {
                const td = table.trList![r].tdList[d]
                // 此时位置上下文中的tdId是拆分后的tdId，将其修正为原始td的id
                // 由于后续合并表格可能导致单元格索引、行索引等变化，因此这里只修正了部分位置上下文
                if (td.id === positionContext.tdId) {
                  positionContext.tdId = td.pagingOriginId || td.id
                  positionContext.tableId = element.id
                  positionContext.index = i
                  positionContextChanged = true
                  if (
                    td.pagingOriginId && // 位置上下文指向的td是跨页拆分出来的时才需要修正curIndex
                    curIndex !== undefined &&
                    curIndex > -1
                  ) {
                    // 找到同源表格中与位置上下文td同源的单元格，根据其内容长度修正curIndex
                    while (preTables.length > 0) {
                      const preTable = preTables.pop()
                      preTable!.trList!.forEach(preTr => {
                        for (
                          let preTdIndex = 0;
                          preTdIndex < preTr.tdList.length;
                          preTdIndex++
                        ) {
                          const preTd = preTr.tdList[preTdIndex]
                          if (
                            preTd.pagingOriginId === td.pagingOriginId ||
                            preTd.id === td.pagingOriginId
                          ) {
                            curIndex! += preTd.value.length
                            break
                          }
                        }
                      })
                    }
                  }
                  break outer
                }
              }
            }
          } else {
            preTables.push(table)
          }
        }
      }
      // 为当前表格构建一个虚拟表格
      const virtualTable = Array.from(
        { length: element.trList!.length },
        () => new Array(element.colgroup!.length)
      ) as Array<Array<ITd | undefined | null>>
      element.trList!.forEach((tr, trIndex) => {
        let tdIndex = 0
        tr.tdList.forEach(td => {
          while (virtualTable[trIndex][tdIndex] === null) {
            tdIndex++
          }
          virtualTable[trIndex][tdIndex] = td
          for (let i = 1; i < td.rowspan; i++) {
            virtualTable[trIndex + i][tdIndex] = null
          }
          tdIndex += td.colspan
        })
      })
      // 处理后续表格的合并
      let tableIndex = i + 1
      let combineCount = 0
      while (tableIndex < elementList.length) {
        const nextElement = elementList[tableIndex]
        if (nextElement.pagingId === element.pagingId) {
          const nexTrList = nextElement.trList!.filter(tr => !tr.pagingRepeat)
          // 判断后续表格第一行是拆分出来的还是从原表格挪到下一页的
          const isNextTrSplit =
            element.trList![element.trList!.length - 1].id ===
            nexTrList[0].pagingOriginId
          // 遍历后续表格首行中的单元格，在虚拟表格中找到其对应单元格
          let tdIndex = 0
          const mergedTds: ITd[] = []
          nexTrList[0].tdList.forEach(td => {
            let targetTd
            // 如果虚拟表格最后一行对应位置有单元格，则其就为目标单元格，否则向上查找
            if (virtualTable[virtualTable.length - 1][tdIndex]) {
              targetTd = virtualTable[virtualTable.length - 1][tdIndex]
            } else {
              for (let i = virtualTable.length - 2; i >= 0; i--) {
                if (virtualTable[i][tdIndex]) {
                  targetTd = virtualTable[i][tdIndex]
                  break
                }
              }
            }
            if (targetTd) {
              if (targetTd.id === td.pagingOriginId) {
                targetTd.value.push(...td.value)
                if (isNextTrSplit) {
                  targetTd.rowspan = targetTd.rowspan + td.rowspan - 1
                } else {
                  targetTd.rowspan = targetTd.rowspan + td.rowspan
                  mergedTds.push(td)
                }
              }
              tdIndex += targetTd.colspan
            }
          })
          nexTrList[0].tdList = nexTrList[0].tdList.filter(td => {
            const isNotMerged = mergedTds.every(
              mergedTd => mergedTd.id !== td.id
            )
            delete td.pagingOriginId
            return isNotMerged
          })
          // 更新行高，逐行合并
          while (nexTrList.length > 0) {
            const lastTr = element.trList![element.trList!.length - 1]
            const nextTr = nexTrList.shift()!
            if (lastTr.id === nextTr.pagingOriginId) {
              lastTr.height += nextTr.pagingOriginHeight || 0
              // 更新合并内容的id关联关系
              lastTr.tdList.forEach(td => {
                td.value.forEach(v => {
                  v.tdId = td.id
                  v.trId = lastTr.id
                  v.tableId = element.id
                })
              })
            } else {
              nextTr.height = nextTr.pagingOriginHeight || nextTr.height
              element.trList!.push(nextTr)
            }
            delete nextTr.pagingOriginHeight
            delete nextTr.pagingOriginId
          }
          tableIndex++
          combineCount++
        } else {
          break
        }
      }
      if (combineCount) {
        elementList.splice(i + 1, combineCount)
      }
      // 合并表格后继续修正位置上下文
      if (positionContextChanged) {
        outer: for (let r = 0; r < element.trList!.length; r++) {
          const tr = element.trList![r]
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            if (td.id === positionContext.tdId) {
              positionContext.tdIndex = d
              positionContext.trIndex = r
              positionContext.trId = tr.id
              break outer
            }
          }
        }
      }
      element.pagingIndex = element.pagingIndex ?? 0
      // 计算表格行列（单元格行列索引、高宽、单元格相对于表格的坐标等信息）
      this.computeRowColInfo(element)
    }
    return { curIndex, element, index: i, positionContext }
  }
}
