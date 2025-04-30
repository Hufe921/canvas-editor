import { Draw } from '../Draw'
import { deepClone, getUUID, isNonValue } from '../../../utils'
import { ElementType } from '../../../dataset/enum/Element'
import {
  IAreaInfo,
  IGetAreaValueOption,
  IGetAreaValueResult,
  IInsertAreaOption,
  ISetAreaPropertiesOption
} from '../../../interface/Area'
import { EditorZone } from '../../../dataset/enum/Editor'
import { LocationPosition } from '../../../dataset/enum/Common'
import { RangeManager } from '../../range/RangeManager'
import { Zone } from '../../zone/Zone'
import { Position } from '../../position/Position'
import { zipElementList } from '../../../utils/element'
import { AreaMode } from '../../../dataset/enum/Area'
import { IRange } from '../../../interface/Range'
import { IElementPosition } from '../../../interface/Element'
import { Placeholder } from '../frame/Placeholder'
import { defaultPlaceholderOption } from '../../../dataset/constant/Placeholder'

export class Area {
  private draw: Draw
  private zone: Zone
  private range: RangeManager
  private position: Position
  private areaInfoMap = new Map<string, IAreaInfo>()

  constructor(draw: Draw) {
    this.draw = draw
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
    // 切换至正文
    if (this.zone.getZone() !== EditorZone.MAIN) {
      this.zone.setZone(EditorZone.MAIN)
    }
    // 跳出表格
    this.draw.getPosition().setPositionContext({
      isTable: false
    })
    // 设置插入位置
    const { id, value, area, position } = payload
    if (position === LocationPosition.BEFORE) {
      this.range.setRange(0, 0)
    } else {
      const elementList = this.draw.getOriginalMainElementList()
      const lastIndex = elementList.length - 1
      this.range.setRange(lastIndex, lastIndex)
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
      const { area, positionList } = areaInfoItem[1]
      if (!area?.backgroundColor && !area?.borderColor && !area?.placeholder) {
        continue
      }
      const pagePositionList = positionList.filter(p => p.pageNo === pageNo)
      if (!pagePositionList.length) continue
      ctx.translate(0.5, 0.5)
      const firstPosition = pagePositionList[0]
      const lastPosition = pagePositionList[pagePositionList.length - 1]
      // 起始位置
      const x = margins[3]
      const y = Math.ceil(firstPosition.coordinate.leftTop[1])
      const height = Math.ceil(lastPosition.coordinate.rightBottom[1] - y)
      // 背景色
      if (area.backgroundColor) {
        ctx.fillStyle = area.backgroundColor
        ctx.fillRect(x, y, width, height)
      }
      // 边框
      if (area.borderColor) {
        ctx.strokeStyle = area.borderColor
        ctx.strokeRect(x, y, width, height)
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
      ctx.translate(-0.5, -0.5)
    }
    ctx.restore()
  }

  public compute() {
    this.areaInfoMap.clear()
    const elementList = this.draw.getOriginalMainElementList()
    const positionList = this.position.getOriginalMainPositionList()
    for (let e = 0; e < elementList.length; e++) {
      const element = elementList[e]
      const areaId = element.areaId
      if (areaId) {
        const areaInfo = this.areaInfoMap.get(areaId)
        if (!areaInfo) {
          this.areaInfoMap.set(areaId, {
            id: areaId,
            area: element.area!,
            elementList: [element],
            positionList: [positionList[e]]
          })
        } else {
          areaInfo.elementList.push(element)
          areaInfo.positionList.push(positionList[e])
        }
      }
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
      value: zipElementList(areaInfo.elementList)
    }
  }

  public getContextByAreaId(
    areaId: string
  ): { range: IRange; elementPosition: IElementPosition } | null {
    const elementList = this.draw.getOriginalMainElementList()
    for (let e = 0; e < elementList.length; e++) {
      const element = elementList[e]
      if (element.areaId === areaId) {
        const positionList = this.position.getOriginalMainPositionList()
        return {
          range: {
            startIndex: e,
            endIndex: e
          },
          elementPosition: positionList[e]
        }
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
    // 是否计算
    let isCompute = false
    // 修改属性
    if (payload.properties.mode) {
      areaInfo.area.mode = payload.properties.mode
    }
    if (payload.properties.borderColor) {
      areaInfo.area.borderColor = payload.properties.borderColor
    }
    if (payload.properties.backgroundColor) {
      areaInfo.area.backgroundColor = payload.properties.backgroundColor
    }
    if (!isNonValue(payload.properties.top)) {
      isCompute = true
      areaInfo.area.top = payload.properties.top
    }
    this.draw.render({
      isCompute,
      isSetCursor: false
    })
  }
}
