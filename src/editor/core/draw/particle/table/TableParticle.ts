import { ElementType, IElement } from '../../../..'
import { IEditorOption } from '../../../../interface/Editor'
import { RangeManager } from '../../../range/RangeManager'
import { Draw } from '../../Draw'

export class TableParticle {

  private range: RangeManager
  private options: Required<IEditorOption>

  constructor(draw: Draw) {
    this.range = draw.getRange()
    this.options = draw.getOptions()
  }

  private _drawBorder(ctx: CanvasRenderingContext2D, startX: number, startY: number, width: number, height: number) {
    ctx.beginPath()
    const x = Math.round(startX)
    const y = Math.round(startY)
    ctx.translate(0.5, 0.5)
    ctx.moveTo(x, y + height)
    ctx.lineTo(x, y)
    ctx.lineTo(x + width, y)
    ctx.stroke()
    ctx.translate(-0.5, -0.5)
  }

  public computeRowColInfo(element: IElement) {
    const { colgroup, trList } = element
    if (!colgroup || !trList) return
    let x = 0
    let y = 0
    for (let t = 0; t < trList.length; t++) {
      const tr = trList[t]
      // 表格最后一行
      const isLastTr = trList.length - 1 === t
      // 当前行最小高度
      let rowMinHeight = 0
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        // 计算之前行x轴偏移量
        let offsetXIndex = 0
        if (trList.length > 1 && t !== 0) {
          for (let pT = 0; pT < t; pT++) {
            const pTr = trList[pT]
            // 相同x轴是否存在跨行
            for (let pD = 0; pD < pTr.tdList.length; pD++) {
              const pTd = pTr.tdList[pD]
              const pTdX = pTd.x!
              const pTdY = pTd.y!
              const pTdWidth = pTd.width!
              const pTdHeight = pTd.height!
              // 小于
              if (pTdX < x) continue
              if (pTdX > x) break
              if (pTd.x === x && pTdY + pTdHeight > y) {
                x += pTdWidth
                offsetXIndex += pTd.colspan
              }
            }
          }
        }
        // 计算格列数
        let colIndex = 0
        const preTd = tr.tdList[d - 1]
        if (preTd) {
          colIndex = preTd.colIndex! + offsetXIndex + 1
          if (preTd.colspan > 1) {
            colIndex += preTd.colspan - 1
          }
        } else {
          colIndex += offsetXIndex
        }
        // 计算格宽高
        let width = 0
        for (let col = 0; col < td.colspan; col++) {
          width += colgroup[col + colIndex].width
        }
        let height = 0
        for (let row = 0; row < td.rowspan; row++) {
          height += trList[row + t].height
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
        td.x = x
        td.y = y
        td.width = width
        td.height = height
        td.rowIndex = t
        td.colIndex = colIndex
        // 当前列x轴累加
        x += width
        // 一行中的最后td
        if (isLastRowTd && !isLastTd) {
          x = 0
          y += rowMinHeight
        }
      }
    }
  }

  public drawRange(ctx: CanvasRenderingContext2D, element: IElement, startX: number, startY: number) {
    const { scale, rangeAlpha, rangeColor } = this.options
    const { type, trList } = element
    if (!trList || type !== ElementType.TABLE) return
    const { isCrossRowCol, startTdIndex, endTdIndex, startTrIndex, endTrIndex } = this.range.getRange()
    // 存在跨行/列
    if (!isCrossRowCol) return
    let startTd = trList[startTrIndex!].tdList[startTdIndex!]
    let endTd = trList[endTrIndex!].tdList[endTdIndex!]
    // 交换起始位置
    if (startTd.x! > endTd.x! || startTd.y! > endTd.y!) {
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
          tdColIndex >= startColIndex && tdColIndex <= endColIndex
          && tdRowIndex >= startRowIndex && tdRowIndex <= endRowIndex
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

  public render(ctx: CanvasRenderingContext2D, element: IElement, startX: number, startY: number) {
    const { colgroup, trList } = element
    if (!colgroup || !trList) return
    const { scale } = this.options
    const tableWidth = element.width! * scale
    const tableHeight = element.height! * scale
    ctx.save()
    // 渲染边框
    this._drawBorder(ctx, startX, startY, tableWidth, tableHeight)
    // 渲染表格
    for (let t = 0; t < trList.length; t++) {
      const tr = trList[t]
      for (let d = 0; d < tr.tdList.length; d++) {
        const td = tr.tdList[d]
        const width = td.width! * scale
        const height = td.height! * scale
        const x = Math.round(td.x! * scale + startX + width)
        const y = Math.round(td.y! * scale + startY)
        ctx.translate(0.5, 0.5)
        // 绘制线条
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x, y + height)
        ctx.lineTo(x - width, y + height)
        ctx.stroke()
        ctx.translate(-0.5, -0.5)
      }
    }
    ctx.restore()
  }

}