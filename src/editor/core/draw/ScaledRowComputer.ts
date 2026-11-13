import { ElementType } from '../../dataset/enum/Element'
import type { IComputeRowListPayload } from '../../interface/Draw'
import type { IRow, IRowElement } from '../../interface/Row'
import type { Draw } from './Draw'

/**
 * 缩放复用断行结果。
 *
 * 文本始终在原始字号下测量，布局度量再乘 scale，因此缩放不会改变行内
 * 相对宽度。保留行与行内元素对象，仅缩放度量并重新分页，避免整篇文字测量。
 * 依赖页面位置或局部补高的布局仍回退完整计算。
 */
export class ScaledRowComputer {
  private draw: Draw

  constructor(draw: Draw) {
    this.draw = draw
  }

  public tryScale(
    scaleFrom: number,
    payload: IComputeRowListPayload
  ): IRow[] | null {
    const rowList = this.draw.getRawRowList()
    const scaleTo = this.draw.getOptions().scale
    if (
      !this.draw.getOptions().incrementalCompute ||
      scaleFrom <= 0 ||
      scaleTo <= 0 ||
      scaleFrom === scaleTo ||
      !rowList.length ||
      this.draw.getPosition().getPositionContext()?.isTable ||
      this.draw.getFootnote().isReferenceExist() ||
      this.draw.getIsControlMinWidthPlaceholder() ||
      this.draw.getIsElementListTruncated() ||
      (this.draw.getColumnLayout()?.count || 1) > 1 ||
      (payload.surroundElementList?.length || 0) > 0
    ) {
      return null
    }
    for (const row of rowList) {
      if (!this._canScaleRow(row)) return null
    }
    const ratio = scaleTo / scaleFrom
    this._scaleRowList(rowList, ratio, scaleFrom, scaleTo, payload.elementList)
    for (const row of rowList) {
      this.draw.getIncrementalRowComputer().scaleSnapshot(row, ratio)
    }
    return rowList
  }

  private _canScaleRow(row: IRow): boolean {
    if (
      row.areaPadding ||
      row.areaPaddingCarry ||
      row.isSurround ||
      row.columnIndex !== undefined
    ) {
      return false
    }
    for (const element of row.elementList) {
      if (
        element.type === ElementType.FOOTNOTE ||
        element.areaId ||
        element.isControlMinWidthPlaceholder
      ) {
        return false
      }
      if (element.type === ElementType.TABLE) {
        for (const tr of element.trList || []) {
          for (const td of tr.tdList) {
            for (const tdRow of td.rowList || []) {
              if (!this._canScaleRow(tdRow)) return false
            }
          }
        }
      }
    }
    return true
  }

  private _scaleRowList(
    rowList: IRow[],
    ratio: number,
    scaleFrom: number,
    scaleTo: number,
    elementList: IComputeRowListPayload['elementList']
  ) {
    let fromListStyleMap = new Map<string, number>()
    let toListStyleMap = new Map<string, number>()
    if (rowList.some(row => row.elementList[0]?.listId)) {
      // 有序列表标记宽度带 Math.ceil，不能直接累乘，否则会产生亚像素漂移
      const ctx = document.createElement('canvas').getContext('2d')!
      const listParticle = this.draw.getListParticle()
      fromListStyleMap = listParticle.computeListStyle(
        ctx,
        elementList,
        scaleFrom
      )
      toListStyleMap = listParticle.computeListStyle(ctx, elementList, scaleTo)
    }
    for (const row of rowList) {
      row.width *= ratio
      row.height *= ratio
      row.ascent *= ratio
      if (row.offsetX) row.offsetX *= ratio
      if (row.offsetY) row.offsetY *= ratio
      if (row.spacingAfter) row.spacingAfter *= ratio
      const listId = row.elementList[0]?.listId
      if (listId) {
        const fromWidth = fromListStyleMap.get(listId) || 0
        const toWidth = toListStyleMap.get(listId) || 0
        row.offsetX = (row.offsetX || 0) + toWidth - fromWidth * ratio
      }
      for (const element of row.elementList) {
        this._scaleElement(element, ratio)
        if (element.type === ElementType.TABLE) {
          for (const tr of element.trList || []) {
            for (const td of tr.tdList) {
              // tr/td/colgroup 使用未缩放单位，行结构不变时无需重算。
              // 跨页片段尺寸由 TablePaging 按新 scale 重新生成。
              this._scaleRowList(
                td.rowList || [],
                ratio,
                scaleFrom,
                scaleTo,
                td.value
              )
            }
          }
        }
      }
    }
  }

  private _scaleElement(element: IRowElement, ratio: number) {
    element.metrics.width *= ratio
    // 分页符高度在完整排版中固定使用未缩放的默认字号
    if (element.type !== ElementType.PAGE_BREAK) {
      element.metrics.height *= ratio
    }
    element.metrics.boundingBoxAscent *= ratio
    element.metrics.boundingBoxDescent *= ratio
    if (element.left) element.left *= ratio
    element.style = this.draw.getElementFont(
      element,
      this.draw.getOptions().scale
    )
  }
}
