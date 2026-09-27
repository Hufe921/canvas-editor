import { maxHeightRadioMapping } from '../../../dataset/constant/Common'
import { EditorZone, PaperDirection } from '../../../dataset/enum/Editor'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IElement, IElementPosition } from '../../../interface/Element'
import { IRow } from '../../../interface/Row'
import { pickSurroundElementList } from '../../../utils/element'
import { Position } from '../../position/Position'
import { Zone } from '../../zone/Zone'
import { Draw } from '../Draw'

export class Header {
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
    const margins = this.draw.getMargins(direction)
    const innerWidth = this.draw.getInnerWidth(direction)
    const surroundElementList = pickSurroundElementList(this.elementList)
    return this.draw.computeRowList({
      startX: margins[3],
      startY: this.getHeaderTop(),
      innerWidth,
      elementList: this.elementList,
      surroundElementList
    })
  }

  private _computePositionList(
    direction: PaperDirection,
    rowList: IRow[]
  ): IElementPosition[] {
    const margins = this.draw.getMargins(direction)
    const positionList: IElementPosition[] = []
    this.position.computePageRowPosition({
      positionList,
      rowList,
      pageNo: 0,
      startRowIndex: 0,
      startIndex: 0,
      startX: margins[3],
      startY: this.getHeaderTop(),
      innerWidth: this.draw.getInnerWidth(direction),
      zone: EditorZone.HEADER
    })
    return positionList
  }

  public getHeaderTop(pageNo?: number): number {
    if (this.isDisabled(pageNo)) return 0
    const {
      header: { top },
      scale
    } = this.options
    return Math.floor(top * scale)
  }

  public getMaxHeight(direction?: PaperDirection): number {
    const {
      header: { maxHeightRadio }
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
    // 页眉上边距 + 实际高 - 页面上边距
    const margins = this.draw.getMargins(curDirection)
    const headerHeight = this.getHeight(pageNo, curDirection)
    const headerTop = this.getHeaderTop(pageNo)
    const extraHeight = headerTop + headerHeight - margins[0]
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
    if (this.options.header.disabled) return true
    if (
      pageNo !== undefined &&
      this.options.header.disabledPages.includes(pageNo)
    ) {
      return true
    }
    return false
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    if (this.options.header.disabledPages.includes(pageNo)) return
    ctx.save()
    ctx.globalAlpha = this.zone.isHeaderActive()
      ? 1
      : this.options.header.inactiveAlpha
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
      zone: EditorZone.HEADER
    })
    ctx.restore()
  }
}
