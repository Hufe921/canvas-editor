import { Draw } from '../Draw'
import { deepClone, getUUID, isNonValue } from '../../../utils'
import { ElementType } from '../../../dataset/enum/Element'
import {
  IArea,
  IAreaInfo,
  IDeleteAreaOption,
  IGetAreaValueOption,
  IGetAreaValueResult,
  IInsertAreaOption,
  ILocationAreaOption,
  ISetAreaPropertiesOption,
  ISetAreaValueOption
} from '../../../interface/Area'
import { EditorZone } from '../../../dataset/enum/Editor'
import { LocationPosition } from '../../../dataset/enum/Common'
import { RangeManager } from '../../range/RangeManager'
import { Zone } from '../../zone/Zone'
import { Position } from '../../position/Position'
import {
  formatElementList,
  getNonDeletedElementList,
  zipElementList
} from '../../../utils/element'
import { AreaMode } from '../../../dataset/enum/Area'
import { IRange } from '../../../interface/Range'
import { IRow } from '../../../interface/Row'
import { IElement, IElementPosition } from '../../../interface/Element'
import { Placeholder } from '../frame/Placeholder'
import { defaultPlaceholderOption } from '../../../dataset/constant/Placeholder'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { ITd } from '../../../interface/table/Td'

export class Area {
  private draw: Draw
  private zone: Zone
  private range: RangeManager
  private position: Position
  private options: DeepRequired<IEditorOption>
  private areaInfoMap = new Map<string, IAreaInfo>()

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.zone = draw.getZone()
    this.range = draw.getRange()
    this.position = draw.getPosition()
  }

  public getAreaInfo(): Map<string, IAreaInfo> {
    return this.areaInfoMap
  }

  public getActiveAreaId(): string | null {
    if (!this.areaInfoMap.size) return null
    const { startIndex } = this.range.getRange()
    const elementList = this.draw.getElementList()
    const element = elementList[startIndex]
    return element?.areaId || null
  }

  public getActiveAreaInfo(): IAreaInfo | null {
    const activeAreaId = this.getActiveAreaId()
    if (!activeAreaId) return null
    return this.areaInfoMap.get(activeAreaId) || null
  }

  public isReadonly() {
    const activeAreaInfo = this.getActiveAreaInfo()
    if (!activeAreaInfo?.area) return false
    switch (activeAreaInfo.area.mode) {
      case AreaMode.EDIT:
        return false
      case AreaMode.READONLY:
        return true
      case AreaMode.FORM:
        return !this.draw.getControl().getIsRangeWithinControl()
      default:
        return false
    }
  }

  public insertArea(payload: IInsertAreaOption): string | null {
    const { id, value, area, position, range } = payload
    // 切换至正文
    if (this.zone.getZone() !== EditorZone.MAIN) {
      this.zone.setZone(EditorZone.MAIN)
    }
    // 通过光标插入area && 不能在area内再次插入area
    if (range && !this.getActiveAreaId()) {
      const { startIndex, endIndex } = range
      // 校验位置合法性
      const elementList = this.draw.getMainElementList()
      if (!elementList[startIndex] || !elementList[endIndex]) {
        return null
      }
      this.range.setRange(range.startIndex, range.endIndex)
    } else {
      // 设置插入位置
      if (position === LocationPosition.BEFORE) {
        this.range.setRange(0, 0)
      } else {
        const elementList = this.draw.getMainElementList()
        const lastIndex = elementList.length - 1
        this.range.setRange(lastIndex, lastIndex)
      }
    }
    const areaId = id || getUUID()
    this.draw.insertElementList([
      {
        type: ElementType.AREA,
        value: '',
        areaId,
        valueList: value,
        area: deepClone(area)
      }
    ])
    return areaId
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    if (!this.areaInfoMap.size) return
    ctx.save()
    const margins = this.draw.getMargins()
    const width = this.draw.getInnerWidth()
    for (const areaInfoItem of this.areaInfoMap) {
      const { area, positionList, tableCell, paddingSegmentList } =
        areaInfoItem[1]
      if (
        (area?.hide && !this.draw.isAreaHideDisabled()) ||
        (!area?.backgroundColor && !area?.borderColor && !area?.placeholder)
      ) {
        continue
      }
      const pagePositionList = positionList.filter(p => p.pageNo === pageNo)
      // 补高跨页结转产生的延续段（无元素位置，需延续绘制区域框）
      const pageSegmentList =
        paddingSegmentList?.filter(segment => segment.pageNo === pageNo) || []
      if (!pagePositionList.length && !pageSegmentList.length) continue
      ctx.translate(0.5, 0.5)
      const isTableArea = !!tableCell
      const tdPadding = this.draw.getTdPadding()
      // 起始位置
      const x = isTableArea
        ? tableCell.tablePosition.coordinate.leftTop[0] +
          tableCell.td.x! * this.options.scale +
          tdPadding[3]
        : margins[3]
      const areaWidth = isTableArea
        ? tableCell.td.width! * this.options.scale - tdPadding[1] - tdPadding[3]
        : width
      if (pagePositionList.length) {
        const firstPosition = pagePositionList[0]
        const lastPosition = pagePositionList[pagePositionList.length - 1]
        const y = Math.ceil(firstPosition.coordinate.leftTop[1])
        const height = Math.ceil(lastPosition.coordinate.rightBottom[1] - y)
        // 背景色
        if (area.backgroundColor) {
          ctx.fillStyle = area.backgroundColor
          ctx.fillRect(x, y, areaWidth, height)
        }
        // 边框
        if (area.borderColor) {
          ctx.strokeStyle = area.borderColor
          ctx.strokeRect(x, y, areaWidth, height)
        }
        // 提示词
        if (area.placeholder && positionList.length <= 1) {
          const placeholder = new Placeholder(this.draw)
          placeholder.render(ctx, {
            placeholder: {
              ...defaultPlaceholderOption,
              ...area.placeholder
            },
            startY: firstPosition.coordinate.leftTop[1]
          })
        }
      }
      // 延续段：结转空间归属区域，区域框延续覆盖
      for (const segment of pageSegmentList) {
        if (area.backgroundColor) {
          ctx.fillStyle = area.backgroundColor
          ctx.fillRect(x, segment.y, areaWidth, segment.height)
        }
        if (area.borderColor) {
          ctx.strokeStyle = area.borderColor
          ctx.strokeRect(x, segment.y, areaWidth, segment.height)
        }
      }
      ctx.translate(-0.5, -0.5)
    }
    ctx.restore()
  }

  public compute() {
    this.areaInfoMap.clear()
    const elementList = this.draw.getOriginalMainElementList()
    const positionList = this.position.getOriginalMainPositionList()
    this.computeAreaInfo(elementList, positionList, elementList)
    this.computePaddingSegmentList(positionList)
  }

  /**
   * 收集区域补高的跨页延续段：
   * 结转标记在区域后续行时，起点 = 结转行内容顶部 - 本行全部偏移（即页内容区顶部）；
   * 结转标记在区域末行自身时（区域位于文档末尾），延续段位于下一空白页顶部
   */
  private computePaddingSegmentList(positionList: IElementPosition[]) {
    if (!this.areaInfoMap.size) return
    for (const row of this.draw.getMainRowList()) {
      const carry = row.areaPaddingCarry
      if (!carry) continue
      const areaInfo = this.areaInfoMap.get(carry.areaId)
      const firstPosition = positionList[row.startIndex]
      if (!areaInfo || !firstPosition) continue
      const isSelfCarry = row.elementList.some(el => el.areaId === carry.areaId)
      if (!areaInfo.paddingSegmentList) {
        areaInfo.paddingSegmentList = []
      }
      const segmentList = areaInfo.paddingSegmentList
      if (isSelfCarry) {
        const segmentPageNo = firstPosition.pageNo + 1
        const { margins } = this.draw.getPageSize(segmentPageNo)
        const direction = this.draw.getPageDirectionList()[segmentPageNo]
        segmentList.push({
          pageNo: segmentPageNo,
          y:
            margins[0] +
            this.draw.getHeader().getExtraHeight(segmentPageNo, direction),
          height: carry.height
        })
      } else {
        segmentList.push({
          pageNo: firstPosition.pageNo,
          y: firstPosition.coordinate.leftTop[1] - (row.offsetY || 0),
          height: carry.height
        })
      }
    }
  }

  private computeAreaInfo(
    elementList: IElement[],
    positionList: IElementPosition[] = [],
    sourceElementList: IElement[],
    inheritedAreaId?: string,
    tableCell?: IAreaInfo['tableCell']
  ) {
    for (let e = 0; e < elementList.length; e++) {
      const element = elementList[e]
      const areaId = element.areaId
      const position = positionList[e]
      if (areaId && areaId !== inheritedAreaId) {
        const areaInfo = this.areaInfoMap.get(areaId)
        if (!areaInfo) {
          this.areaInfoMap.set(areaId, {
            id: areaId,
            area: element.area!,
            elementList: [element],
            positionList: position ? [position] : [],
            sourceElementList,
            tableCell
          })
        } else {
          areaInfo.elementList.push(element)
          if (position) {
            areaInfo.positionList.push(position)
          }
        }
      }
      if (element.type === ElementType.TABLE && element.trList) {
        this.computeTableAreaInfo(element, position, areaId)
      }
    }
  }

  private computeTableAreaInfo(
    tableElement: IElement,
    tablePosition?: IElementPosition,
    inheritedAreaId?: string
  ) {
    const trList = tableElement.trList!
    for (let r = 0; r < trList.length; r++) {
      const tr = trList[r]
      for (let d = 0; d < tr.tdList.length; d++) {
        const td: ITd = tr.tdList[d]
        this.computeAreaInfo(
          td.value,
          td.positionList,
          td.value,
          inheritedAreaId,
          tablePosition
            ? {
                td,
                tablePosition
              }
            : undefined
        )
      }
    }
  }

  /**
   * 应用区域最小高度：按区域分组连续行累计内容高度，
   * 不足 minHeight 时将差值补充到区域末行行高（区域顶部间距不计入内容高度）
   */
  public applyMinHeight(rowList: IRow[]) {
    const { scale } = this.options
    // 归一化：剔除上一轮补高及分页结转对行高/行偏移的突变，
    // 保证从内容原始高度重新计算（增量行计算会复用上一轮的行对象）
    for (const row of rowList) {
      if (row.areaPadding) {
        row.height -= row.areaPadding.height
        row.areaPadding = undefined
      }
      if (row.areaPaddingCarry) {
        // 结转标记位于区域末行自身（文档末尾空白页延续）时未改动行偏移
        const isSelfCarry = row.elementList.some(
          el => el.areaId === row.areaPaddingCarry!.areaId
        )
        if (!isSelfCarry) {
          row.offsetY = (row.offsetY || 0) - row.areaPaddingCarry.height
        }
        row.areaPaddingCarry = undefined
      }
    }
    let i = 0
    while (i < rowList.length) {
      const areaElement = rowList[i].elementList.find(el => el.areaId)
      const areaId = areaElement?.areaId
      if (!areaId) {
        i++
        continue
      }
      // 连续属于同一区域的行
      let j = i
      while (
        j + 1 < rowList.length &&
        rowList[j + 1].elementList.some(el => el.areaId === areaId)
      ) {
        j++
      }
      const area = areaElement.area
      const minHeight = area?.minHeight
      if (minHeight && !(area?.hide && !this.draw.isAreaHideDisabled())) {
        // 首行 offsetY 为区域顶部间距（位于区域框上方），不计入内容高度
        let contentHeight = -(rowList[i].offsetY || 0)
        for (let k = i; k <= j; k++) {
          contentHeight += rowList[k].height + (rowList[k].offsetY || 0)
        }
        const minHeightPx = minHeight * scale
        if (contentHeight < minHeightPx) {
          const paddingHeight = minHeightPx - contentHeight
          rowList[j].height += paddingHeight
          rowList[j].areaPadding = {
            areaId,
            height: paddingHeight
          }
        }
      }
      i = j + 1
    }
  }

  public getAreaValue(
    options: IGetAreaValueOption = {}
  ): IGetAreaValueResult | null {
    const areaId = options.id || this.getActiveAreaId()
    if (!areaId) return null
    const areaInfo = this.areaInfoMap.get(areaId)
    if (!areaInfo) return null
    return {
      area: areaInfo.area,
      id: areaInfo.id,
      startPageNo: areaInfo.positionList[0].pageNo,
      endPageNo: areaInfo.positionList[areaInfo.positionList.length - 1].pageNo,
      value: zipElementList(getNonDeletedElementList(areaInfo.elementList), {
        isClone: false
      })
    }
  }

  public getContextByAreaId(
    areaId: string,
    options?: ILocationAreaOption
  ): { range: IRange; elementPosition: IElementPosition } | null {
    const elementList = this.draw.getOriginalMainElementList()
    for (let e = 0; e < elementList.length; e++) {
      const element = elementList[e]
      if (options?.position === LocationPosition.OUTER_BEFORE) {
        // 区域外面最前
        if (elementList[e + 1]?.areaId !== areaId) continue
      } else if (options?.position === LocationPosition.AFTER) {
        // 区域内部最后
        if (
          !(element.areaId === areaId && elementList[e + 1]?.areaId !== areaId)
        ) {
          continue
        }
      } else if (options?.position === LocationPosition.OUTER_AFTER) {
        // 区域外部最后
        if (
          !(element.areaId !== areaId && elementList[e - 1]?.areaId === areaId)
        ) {
          continue
        }
      } else {
        // 区域内部最前
        if (element.areaId !== areaId) continue
      }
      const positionList = this.position.getOriginalMainPositionList()
      return {
        range: {
          startIndex: e,
          endIndex: e
        },
        elementPosition: positionList[e]
      }
    }
    return null
  }

  public setAreaProperties(payload: ISetAreaPropertiesOption) {
    const areaId = payload.id || this.getActiveAreaId()
    if (!areaId) return
    const areaInfo = this.areaInfoMap.get(areaId)
    if (!areaInfo) return
    if (!areaInfo.area) {
      areaInfo.area = {}
    }
    // 需要计算的属性
    let isCompute = false
    const computeProps: Array<keyof IArea> = ['top', 'hide', 'minHeight']
    // 循环设置
    Object.entries(payload.properties).forEach(([key, value]) => {
      if (isNonValue(value)) return
      const propKey = key as keyof IArea
      areaInfo.area[propKey] = value
      if (computeProps.includes(propKey)) {
        isCompute = true
      }
    })
    this.draw.render({
      isCompute,
      isSetCursor: false
    })
  }

  public setAreaValue(payload: ISetAreaValueOption) {
    const areaId = payload.id || this.getActiveAreaId()
    if (!areaId) return
    const areaInfo = this.areaInfoMap.get(areaId)
    if (!areaInfo) return
    // 删除旧数据并替换新的格式化数据
    const { positionList } = areaInfo
    const elementList = areaInfo.sourceElementList
    const valueList = payload.value
    formatElementList(
      [
        {
          type: ElementType.AREA,
          value: '',
          valueList,
          areaId: areaInfo.id,
          area: areaInfo.area
        }
      ],
      {
        editorOptions: this.options
      }
    )
    const startIndex = positionList[0].index
    this.draw.deleteElementList(elementList, startIndex, positionList.length, {
      isIgnoreDeletedRule: true
    })
    this.draw.getTraceParticle().markElementListInserted(valueList)
    this.draw.spliceElementList(elementList, startIndex, 0, valueList)
    this.draw.render({
      isSetCursor: false
    })
  }

  public deleteArea(options: IDeleteAreaOption = {}) {
    const areaId = options.id || this.getActiveAreaId()
    if (!areaId) return
    const areaInfo = this.areaInfoMap.get(areaId)
    if (!areaInfo) return
    // 删除区域内的所有元素
    const { positionList } = areaInfo
    const elementList = areaInfo.sourceElementList
    this.draw.deleteElementList(
      elementList,
      positionList[0].index,
      positionList.length,
      {
        isIgnoreDeletedRule: true
      }
    )
    this.draw.render({
      isSetCursor: false
    })
  }
}
