import { maxHeightRadioMapping } from '../../../dataset/constant/Common'
import { EditorZone, PaperDirection } from '../../../dataset/enum/Editor'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IElement, IElementPosition } from '../../../interface/Element'
import { IRow } from '../../../interface/Row'
import { Position } from '../../position/Position'
import { Zone } from '../../zone/Zone'
import { Draw } from '../Draw'

export class Footer {
  private draw: Draw
  private position: Position
  private zone: Zone
  private options: DeepRequired<IEditorOption>

  private elementList: IElement[]
  private layoutMap: Map<PaperDirection, [IRow[], IElementPosition[]]>

  constructor(draw: Draw, data?: IElement[]) {
    this.draw = draw
    this.position = draw.getPosition()
    this.zone = draw.getZone()
    this.options = draw.getOptions()

    this.elementList = data || []
    this.layoutMap = new Map()
  }

  public getRowList(): IRow[] {
    return this._getLayoutByDirection(this.options.paperDirection)[0]
  }

  public setElementList(elementList: IElement[]) {
    this.elementList = elementList
  }

  public getElementList(): IElement[] {
    return this.elementList
  }

  public getPositionList(
    direction = this.options.paperDirection
  ): IElementPosition[] {
    return this._getLayoutByDirection(direction)[1]
  }

  public compute() {
    this.recovery()
    // 主方向立即计算，其余方向按需懒计算
    this._getLayoutByDirection(this.options.paperDirection)
  }

  public recovery() {
    this.layoutMap.clear()
  }

  private _getLayoutByDirection(
    direction: PaperDirection
  ): [IRow[], IElementPosition[]] {
    let layout = this.layoutMap.get(direction)
    if (!layout) {
      const rowList = this._computeRowList(direction)
      // 先登记 rowList，避免位置计算中的高度查询递归触发重复布局
      layout = [rowList, []]
      this.layoutMap.set(direction, layout)
      layout[1] = this._computePositionList(direction, rowList)
    }
    return layout
  }

  private _computeRowList(direction: PaperDirection): IRow[] {
    const innerWidth = this.draw.getInnerWidth(direction)
    return this.draw.computeRowList({
      innerWidth,
      elementList: this.elementList
    })
  }

  private _computePositionList(
    direction: PaperDirection,
    rowList: IRow[]
  ): IElementPosition[] {
    const footerBottom = this.getFooterBottom()
    const innerWidth = this.draw.getInnerWidth(direction)
    const margins = this.draw.getMargins(direction)
    const startX = margins[3]
    // 页面高度 - 页脚顶部距离页面底部高度
    const pageHeight = this.draw.getHeight(direction)
    const footerHeight = this.getHeight(undefined, direction)
    const startY = pageHeight - footerBottom - footerHeight
    const positionList: IElementPosition[] = []
    this.position.computePageRowPosition({
      positionList,
      rowList,
      pageNo: 0,
      startRowIndex: 0,
      startIndex: 0,
      startX,
      startY,
      innerWidth,
      zone: EditorZone.FOOTER
    })
    return positionList
  }

  public getFooterBottom(pageNo?: number): number {
    if (this.isDisabled(pageNo)) return 0
    const {
      footer: { bottom },
      scale
    } = this.options
    return Math.floor(bottom * scale)
  }

  public getMaxHeight(direction?: PaperDirection): number {
    const {
      footer: { maxHeightRadio }
    } = this.options
    const height = this.draw.getHeight(direction)
    return Math.floor(height * maxHeightRadioMapping[maxHeightRadio])
  }

  public getHeight(pageNo?: number, direction?: PaperDirection): number {
    if (this.isDisabled(pageNo)) return 0
    const curDirection = this._resolveDirection(pageNo, direction)
    const maxHeight = this.getMaxHeight(curDirection)
    const rowHeight = this.getRowHeight(curDirection)
    return rowHeight > maxHeight ? maxHeight : rowHeight
  }

  public getRowHeight(direction = this.options.paperDirection): number {
    return this._getLayoutByDirection(direction)[0].reduce(
      (pre, cur) => pre + cur.height,
      0
    )
  }

  public getExtraHeight(pageNo?: number, direction?: PaperDirection): number {
    const curDirection = this._resolveDirection(pageNo, direction)
    // 页脚下边距 + 实际高 - 页面下边距
    const margins = this.draw.getMargins(curDirection)
    const footerHeight = this.getHeight(pageNo, curDirection)
    const footerBottom = this.getFooterBottom(pageNo)
    const extraHeight = footerBottom + footerHeight - margins[2]
    return extraHeight <= 0 ? 0 : extraHeight
  }

  private _resolveDirection(
    pageNo?: number,
    direction?: PaperDirection
  ): PaperDirection {
    return (
      direction ??
      (pageNo !== undefined
        ? this.draw.getPageDirection(pageNo)
        : this.options.paperDirection)
    )
  }

  public isDisabled(pageNo?: number): boolean {
    if (this.options.footer.disabled) return true
    if (
      pageNo !== undefined &&
      this.options.footer.disabledPages.includes(pageNo)
    ) {
      return true
    }
    return false
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    if (this.options.footer.disabledPages.includes(pageNo)) return
    ctx.save()
    ctx.globalAlpha = this.zone.isFooterActive()
      ? 1
      : this.options.footer.inactiveAlpha
    const direction = this.draw.getPageDirection(pageNo)
    const innerWidth = this.draw.getInnerWidth(direction)
    const maxHeight = this.getMaxHeight(direction)
    // 超出最大高度不渲染
    const [allRowList, positionList] = this._getLayoutByDirection(direction)
    const rowList: IRow[] = []
    let curRowHeight = 0
    for (let r = 0; r < allRowList.length; r++) {
      const row = allRowList[r]
      if (curRowHeight + row.height > maxHeight) {
        break
      }
      rowList.push(row)
      curRowHeight += row.height
    }
    this.draw.drawRow(ctx, {
      elementList: this.elementList,
      positionList,
      rowList,
      pageNo,
      startIndex: 0,
      innerWidth,
      zone: EditorZone.FOOTER
    })
    ctx.restore()
  }
}
