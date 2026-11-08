import { ZERO } from '../../../dataset/constant/Common'
import { LocationPosition } from '../../../dataset/enum/Common'
import { EditorZone, PaperDirection } from '../../../dataset/enum/Editor'
import { ElementType } from '../../../dataset/enum/Element'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IElement, IElementPosition } from '../../../interface/Element'
import {
  IGetFootnoteValueOption,
  IGetFootnoteValueResult,
  IInsertFootnoteOption,
  ILocationFootnoteOption,
  ISetFootnoteValueOption
} from '../../../interface/Footnote'
import { IPositionContext } from '../../../interface/Position'
import { IRow } from '../../../interface/Row'
import { deepClone, getUUID } from '../../../utils'
import { formatElementList, zipElementList } from '../../../utils/element'
import type { IRenderContext } from '../../render/model/RenderContext'
import { Draw } from '../Draw'

export interface IFootnoteLayout {
  id: string
  referenceIndex: number
  number: number
  element: IElement
  rowList: IRow[]
  visibleRowList: IRow[]
  positionList: IElementPosition[]
  numberWidth: number
  height: number
  pageNo: number
}

interface IFootnoteReference {
  element: IElement
  index: number
  number: number
}

interface IFootnotePageLayout {
  layoutList: IFootnoteLayout[]
  separatorY: number
}

/** 管理正文脚注引用、页底布局及脚注编辑上下文 */
export class Footnote {
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private referenceMap: Map<string, IFootnoteReference>
  // 横竖版可用宽度不同，断行结果按纸张方向分别缓存
  private layoutMap: Map<string, Map<PaperDirection, IFootnoteLayout>>
  private pageLayoutMap: Map<number, IFootnotePageLayout>
  // 首次分页得到的页底占用，供高度回流时收窄正文区域
  private reservedHeightMap: Map<string, number>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.referenceMap = new Map()
    this.layoutMap = new Map()
    this.pageLayoutMap = new Map()
    this.reservedHeightMap = new Map()
  }

  public recovery() {
    this.referenceMap.clear()
    this.layoutMap.clear()
    this.pageLayoutMap.clear()
    this.reservedHeightMap.clear()
  }

  // 正文断行时逐个计算引用，高度回流遇到同一元素时不重复编号
  public computeReference(element: IElement, index: number) {
    if (this.draw.getTraceParticle().isTraceHidden(element)) return
    let id = element.footnoteId || getUUID()
    const reference = this.referenceMap.get(id)
    if (reference?.element === element) {
      reference.index = index
      return
    }
    // 复制粘贴可能带入重复 ID，后出现的引用视为新的脚注
    if (reference) {
      id = getUUID()
    }
    const number = this.referenceMap.size + 1
    element.footnoteId = id
    element.value = String(number)
    this.referenceMap.set(id, {
      element,
      index,
      number
    })
  }

  public isReferenceExist(): boolean {
    return this.referenceMap.size > 0
  }

  public getRowHeight(row: IRow, direction: PaperDirection): number {
    let height = 0
    const visited = new Set<string>()
    for (const element of row.elementList) {
      if (element.type !== ElementType.FOOTNOTE) continue
      const id = element.footnoteId
      if (!id || visited.has(id) || !this.referenceMap.has(id)) continue
      visited.add(id)
      height += this._getLayoutByDirection(id, direction).height
    }
    return height
  }

  public getSeparatorHeight(): number {
    const { lineWidth, gap } = this.options.footnote
    return (lineWidth + gap) * this.options.scale
  }

  public getMaxPageHeight(direction: PaperDirection): number {
    const availableHeight =
      this.draw.getHeight(direction) -
      this.draw.getMainOuterHeight(0, direction)
    return Math.max(availableHeight / 2, 0)
  }

  public getReservedHeight(pageNo: number, direction: PaperDirection): number {
    return this.reservedHeightMap.get(`${pageNo}:${direction}`) || 0
  }

  // 编号单独占位列，正文使用剩余宽度断行；
  // rowList 保留完整内容，visibleRowList 后续按页底空间裁剪
  private _getLayoutByDirection(
    id: string,
    direction: PaperDirection
  ): IFootnoteLayout {
    const directionLayoutMap = this.layoutMap.get(id) || new Map()
    this.layoutMap.set(id, directionLayoutMap)
    const cached = directionLayoutMap.get(direction)
    if (cached) return cached
    const reference = this.referenceMap.get(id)!
    const { scale, defaultFont, footnote } = this.options
    const numberElement: IElement = {
      value: `${reference.number}. `,
      font: defaultFont,
      size: footnote.size
    }
    const ctx = document
      .createElement('canvas')
      .getContext('2d') as CanvasRenderingContext2D
    ctx.font = this.draw.getElementFont(numberElement)
    const numberWidth =
      this.draw.getTextParticle().measureText(ctx, numberElement).width * scale
    const innerWidth = Math.max(
      this.draw.getInnerWidth(direction) - numberWidth,
      0
    )
    const rowList = this.draw.computeRowList({
      innerWidth,
      elementList: reference.element.valueList || [{ value: ZERO }]
    })
    const height = rowList.reduce(
      (total, row) => total + row.height + (row.offsetY || 0),
      0
    )
    const layout: IFootnoteLayout = {
      id,
      referenceIndex: reference.index,
      number: reference.number,
      element: reference.element,
      rowList,
      visibleRowList: rowList,
      positionList: [],
      numberWidth,
      height,
      pageNo: 0
    }
    directionLayoutMap.set(direction, layout)
    return layout
  }

  // 将脚注放到引用所在页，并记录页底占用供正文高度回流；
  // 回流后的再次计算会生成最终的可见行与位置信息
  public compute() {
    const pageRowList = this.draw.getPageRowList()
    const pageDirectionList = this.draw.getPageDirectionList()
    this.pageLayoutMap.clear()
    this.reservedHeightMap.clear()
    if (!this.isReferenceExist() || !this.draw.getIsPagingMode()) return
    for (let pageNo = 0; pageNo < pageRowList.length; pageNo++) {
      const direction = pageDirectionList[pageNo]
      const visited = new Set<string>()
      const layoutList: IFootnoteLayout[] = []
      for (const row of pageRowList[pageNo]) {
        for (const element of row.elementList) {
          const id = element.footnoteId
          if (
            element.type !== ElementType.FOOTNOTE ||
            !id ||
            visited.has(id) ||
            !this.referenceMap.has(id)
          ) {
            continue
          }
          visited.add(id)
          const layout = this._getLayoutByDirection(id, direction)
          layout.pageNo = pageNo
          layoutList.push(layout)
        }
      }
      if (!layoutList.length) continue
      const contentHeight = layoutList.reduce(
        (total, layout) => total + layout.height,
        0
      )
      const separatorHeight = this.getSeparatorHeight()
      const height = Math.min(
        contentHeight + separatorHeight,
        this.getMaxPageHeight(direction)
      )
      this.reservedHeightMap.set(`${pageNo}:${direction}`, height)
      const {
        margins,
        innerWidth,
        height: pageHeight
      } = this.draw.getPageSize(pageNo)
      const bottomY =
        pageHeight -
        margins[2] -
        this.draw.getFooter().getExtraHeight(pageNo, direction)
      const separatorY = bottomY - height
      let startY = separatorY + separatorHeight
      let remainingHeight = height - separatorHeight
      // 超出页底空间的内容整行隐藏，不跨页续排；
      // 仅为可见行计算位置，隐藏内容不参与命中与选区
      for (const layout of layoutList) {
        layout.positionList = []
        layout.visibleRowList = []
        let visibleHeight = 0
        for (const row of layout.rowList) {
          const rowHeight = row.height + (row.offsetY || 0)
          if (visibleHeight + rowHeight > remainingHeight) break
          layout.visibleRowList.push(row)
          visibleHeight += rowHeight
        }
        this.draw.getPosition().computePageRowPosition({
          positionList: layout.positionList,
          rowList: layout.visibleRowList,
          pageNo,
          startRowIndex: 0,
          startIndex: 0,
          startX: margins[3] + layout.numberWidth,
          startY,
          innerWidth: Math.max(innerWidth - layout.numberWidth, 0),
          zone: EditorZone.MAIN
        })
        startY += layout.height
        remainingHeight -= layout.height
      }
      this.pageLayoutMap.set(pageNo, {
        layoutList,
        separatorY
      })
    }
  }

  public getPageLayoutList(pageNo: number): IFootnoteLayout[] {
    return this.pageLayoutMap.get(pageNo)?.layoutList || []
  }

  public getPageLayoutById(id: string): IFootnoteLayout | null {
    for (const page of this.pageLayoutMap.values()) {
      const layout = page.layoutList.find(item => item.id === id)
      if (layout) return layout
    }
    return null
  }

  // 上下文 index 始终指向正文引用，实际编辑数据存放在引用的 valueList 中
  private _getReferenceByContext(
    elementList: IElement[],
    context: IPositionContext
  ): IElement | null {
    if (!context.isFootnote || context.index === undefined) return null
    const element = elementList[context.index]
    if (
      element?.type !== ElementType.FOOTNOTE ||
      element.footnoteId !== context.footnoteId
    ) {
      return null
    }
    return element
  }

  public getValueListByContext(
    elementList: IElement[],
    context: IPositionContext
  ): IElement[] {
    return this._getReferenceByContext(elementList, context)?.valueList || []
  }

  public getVisibleRowListByContext(context: IPositionContext): IRow[] {
    return context.footnoteId
      ? this.getPageLayoutById(context.footnoteId)?.visibleRowList || []
      : []
  }

  public getPositionListByContext(
    context: IPositionContext
  ): IElementPosition[] {
    return context.footnoteId
      ? this.getPageLayoutById(context.footnoteId)?.positionList || []
      : []
  }

  public insertFootnote(payload: IInsertFootnoteOption): string | null {
    if (
      this.draw.isReadonly() ||
      this.draw.isDisabled() ||
      !this.draw.getZone().isMainActive() ||
      this.draw.getControl().getIsRangeWithinControl() ||
      this.draw.getPosition().getPositionContext().isTable ||
      this.draw.getPosition().getPositionContext().isFootnote
    ) {
      return null
    }
    const id = payload.id || getUUID()
    // 引用元素插入时会统一格式化正文，避免重复补偿零宽字符
    const value = deepClone(payload.value)
    const { startIndex } = this.draw.getRange().getRange()
    const elementList = this.draw.getOriginalMainElementList()
    const anchor = elementList[startIndex]
    this.draw.insertElementList([
      {
        type: ElementType.FOOTNOTE,
        value: '',
        footnoteId: id,
        valueList: value,
        size: anchor?.size,
        font: anchor?.font,
        color: anchor?.color,
        bold: anchor?.bold,
        italic: anchor?.italic
      }
    ])
    return id
  }

  public setFootnoteValue(payload: ISetFootnoteValueOption) {
    if (this.draw.isReadonly() || this.draw.isDisabled()) return
    const reference = this.referenceMap.get(payload.id)
    if (!reference) return
    const value = deepClone(payload.value)
    formatElementList(value, {
      editorOptions: this.options,
      isForceCompensation: true
    })
    reference.element.valueList = value
    this.draw.render({
      curIndex: this.draw.getRange().getRange().startIndex,
      isSetCursor: true
    })
  }

  public getFootnoteValue(
    payload: IGetFootnoteValueOption
  ): IGetFootnoteValueResult | null {
    const reference = this.referenceMap.get(payload.id)
    if (!reference) return null
    return {
      id: payload.id,
      value: zipElementList(reference.element.valueList || [])
    }
  }

  public locationFootnote(id: string, options: ILocationFootnoteOption = {}) {
    const reference = this.referenceMap.get(id)
    if (!reference) return
    this.draw.getZone().setZone(EditorZone.MAIN)
    let isReference =
      options.position === LocationPosition.BEFORE ||
      !this.draw.getIsPagingMode()
    const layout = this.getPageLayoutById(id)
    const lastVisibleRow = layout?.visibleRowList.at(-1)
    if (!lastVisibleRow) {
      isReference = true
    }
    // 引用使用正文下标，脚注正文使用 valueList 下标
    const index = isReference
      ? reference.index
      : lastVisibleRow!.startIndex + lastVisibleRow!.elementList.length - 1
    this.draw.getPosition().setPositionContext({
      isTable: false,
      isFootnote: !isReference,
      index: reference.index,
      footnoteId: id
    })
    this.draw.getRange().setRange(index, index)
    this.draw.render({
      curIndex: index,
      isCompute: false,
      isSubmitHistory: false
    })
  }

  public render(ctx: IRenderContext, pageNo: number) {
    const page = this.pageLayoutMap.get(pageNo)
    if (!page) return
    const { margins, innerWidth } = this.draw.getPageSize(pageNo)
    const { color, lineColor, lineWidth, size } = this.options.footnote
    ctx.save()
    ctx.strokeStyle = lineColor
    ctx.lineWidth = lineWidth * this.options.scale
    ctx.beginPath()
    ctx.moveTo(margins[3], page.separatorY)
    ctx.lineTo(margins[3] + innerWidth / 3, page.separatorY)
    ctx.stroke()
    for (const layout of page.layoutList) {
      const firstPosition = layout.positionList[0]
      if (firstPosition && layout.visibleRowList.length) {
        ctx.save()
        ctx.fillStyle = color
        ctx.font = this.draw.getElementFont({
          value: '',
          size,
          font: this.options.defaultFont
        })
        ctx.fillText(
          `${layout.number}.`,
          margins[3],
          firstPosition.coordinate.leftTop[1] + firstPosition.ascent
        )
        ctx.restore()
      }
      this.draw.drawRow(ctx, {
        elementList: layout.element.valueList || [],
        positionList: layout.positionList,
        rowList: layout.visibleRowList,
        pageNo,
        startIndex: 0,
        innerWidth: Math.max(innerWidth - layout.numberWidth, 0),
        zone: EditorZone.MAIN,
        // 独立行标识避免与正文及其他脚注的绘制节点冲突
        keyContext: {
          containerKey: `footnote:${layout.id}`
        },
        isDrawRange:
          this.draw.getPosition().getPositionContext().footnoteId === layout.id
      })
    }
    ctx.restore()
  }
}
