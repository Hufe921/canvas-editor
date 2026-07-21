import { Draw } from '../Draw'
import { deepClone, getUUID, isNonValue } from '../../../utils'
import { ElementType } from '../../../dataset/enum/Element'
import {
  IArea,
  IAreaInfo,
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
import { formatElementList, zipElementList } from '../../../utils/element'
import { AreaMode } from '../../../dataset/enum/Area'
import { IRange } from '../../../interface/Range'
import { IElement, IElementPosition } from '../../../interface/Element'
import { Placeholder } from '../frame/Placeholder'
import { defaultPlaceholderOption } from '../../../dataset/constant/Placeholder'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'

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
    // 获取当前位置上下文
    const positionContext = this.position.getPositionContext()
    // 跳出区域中包含表格跳出表格 到最后去
    const isRangeTable = value && value.some(v => v.type === ElementType.TABLE)
    let isJumpToLast = false
    if (isRangeTable && positionContext.isTable) {
      // 跳出表格
      this.draw.getPosition().setPositionContext({
        isTable: false
      })
      // 跳转到最后位置
      const elementList = this.draw.getElementList()
      const lastIndex = elementList.length - 1
      const insertIndex = Math.max(0, lastIndex)
      this.range.setRange(insertIndex, insertIndex)
      isJumpToLast = true
    }
    // 通过光标插入area && 不能在area内再次插入area
    if (!isJumpToLast && range && !this.getActiveAreaId()) {
      const { startIndex, endIndex } = range
      // 校验位置合法性
      const elementList = this.draw.getElementList()
      if (!elementList[startIndex] || !elementList[endIndex]) {
        return null
      }
      this.range.setRange(range.startIndex, range.endIndex)
    } else if (!isJumpToLast) {
      // 设置插入位置
      if (position === LocationPosition.BEFORE) {
        this.range.setRange(0, 0)
      } else {
        const elementList = this.draw.getElementList()
        const lastIndex = elementList.length - 1
        this.range.setRange(lastIndex, lastIndex)
      }
    }
    const areaId = id || getUUID()
    // 创建area元素
    const areaElement: IElement = {
      type: ElementType.AREA,
      value: '',
      areaId,
      valueList: value,
      area: deepClone(area)
    }
    // 如果在表格中，添加表格相关属性
    if (positionContext.isTable) {
      const originalElementList = this.draw.getOriginalElementList()
      const tableElement = originalElementList[positionContext.index!]
      areaElement.tableId = tableElement.id
      areaElement.trId = positionContext.trId
      areaElement.tdId = positionContext.tdId
    }
    this.draw.insertElementList([areaElement])
    return areaId
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    if (!this.areaInfoMap.size) return
    ctx.save()
    const margins = this.draw.getMargins()

    for (const areaInfoItem of this.areaInfoMap) {
      const { area, positionList, elementList } = areaInfoItem[1]
      if (
        area?.hide ||
        (!area?.backgroundColor && !area?.borderColor && !area?.placeholder)
      ) {
        continue
      }
      const pagePositionList = positionList.filter(p => p.pageNo === pageNo)
      if (!pagePositionList.length) continue
      ctx.translate(0.5, 0.5)
      const firstPosition = pagePositionList[0]
      const lastPosition = pagePositionList[pagePositionList.length - 1]

      // 计算起始位置和宽度
      let x, width
      // 检查是否为表格内的 area（通过元素是否包含 tableId 属性判断）
      const isTableArea = areaInfoItem[1].elementList.some(el => el.tableId)

      // 是否存在表格
      const isRangeTable = elementList.some(el => el.type === ElementType.TABLE)
      if (isTableArea && !isRangeTable) {
        // 表格内的 area，使用元素的实际坐标和宽度
        x = firstPosition.coordinate.leftTop[0]
        // 尝试从表格单元格获取宽度信息
        const tableElement = areaInfoItem[1].elementList.find(el => el.tableId)
        if (tableElement) {
          // 查找对应的表格和单元格
          const originalElementList = this.draw.getOriginalElementList()
          const table = originalElementList.find(
            el => el.id === tableElement.tableId
          )
          if (table && table.trList) {
            for (const tr of table.trList) {
              if (tr.id === tableElement.trId) {
                for (const td of tr.tdList) {
                  if (td.id === tableElement.tdId) {
                    // 使用单元格宽度作为 area 宽度
                    const { scale } = this.options
                    width = (td.width || 100) * scale - 10
                    break
                  }
                }
              }
            }
          }
        }
        // 如果没有获取到单元格宽度，使用默认计算方式
        if (!width) {
          width = lastPosition.coordinate.rightTop[0] - x
          if (width <= 0) {
            width = firstPosition.metrics.width || 100
          }
        }
      } else {
        // 表格外的 area，使用页面宽度
        x = margins[3]
        width = this.draw.getInnerWidth()
      }

      const y = Math.ceil(firstPosition.coordinate.leftTop[1])
      // 计算高度时，确保包含所有元素的位置信息
      let maxY = lastPosition.coordinate.rightBottom[1]
      // 遍历所有位置，找到最大的底部坐标
      for (const pos of pagePositionList) {
        if (pos.coordinate.rightBottom[1] > maxY) {
          maxY = pos.coordinate.rightBottom[1]
        }
      }
      const height = Math.ceil(maxY - y)

      // 背景色
      if (area.backgroundColor) {
        ctx.fillStyle = area.backgroundColor
        ctx.fillRect(x, y, width, height)
      }

      // 边框
      if (area.borderColor || area.borderWidth) {
        ctx.strokeStyle = area.borderColor || 'black'
        ctx.lineWidth = area.borderWidth || 2
        ctx.setLineDash([3, 2])
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
          startY: y
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

    // 处理主文档元素
    for (let e = 0; e < elementList.length; e++) {
      const element = elementList[e]
      const areaId = element.areaId
      // 仅收集由 AREA 展开出的元素（areaIndex 由 formatElementList 在 AREA 展开时打标）
      // 避免普通元素意外携带 areaId/area 时被错误渲染为 area
      if (areaId && element.areaIndex !== undefined) {
        const areaInfo = this.areaInfoMap.get(areaId)
        if (!areaInfo) {
          this.areaInfoMap.set(areaId, {
            id: areaId,
            area: element.area || {},
            elementList: [element],
            positionList: [positionList[e]]
          })
        } else {
          areaInfo.elementList.push(element)
          areaInfo.positionList.push(positionList[e])
        }

        // 处理 area 中包含的表格元素
        if (element.valueList) {
          for (let v = 0; v < element.valueList.length; v++) {
            const valueElement = element.valueList[v]
            if (
              valueElement.type === ElementType.TABLE &&
              valueElement.trList &&
              areaInfo
            ) {
              for (let t = 0; t < valueElement.trList.length; t++) {
                const tr = valueElement.trList[t]
                for (let d = 0; d < tr.tdList.length; d++) {
                  const td = tr.tdList[d]
                  if (td.positionList) {
                    for (let p = 0; p < td.positionList.length; p++) {
                      const position = td.positionList[p]
                      if (position) {
                        areaInfo.positionList.push(position)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      // 处理表格内元素
      if (element.type === ElementType.TABLE && element.trList) {
        for (let t = 0; t < element.trList.length; t++) {
          const tr = element.trList[t]
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            if (td.value) {
              for (let v = 0; v < td.value.length; v++) {
                const tdElement = td.value[v]
                const tdAreaId = tdElement.areaId
                if (tdAreaId && tdElement.areaIndex !== undefined) {
                  // 为表格内 area 元素添加表格相关属性
                  tdElement.tableId = element.id
                  tdElement.trId = tr.id
                  tdElement.tdId = td.id

                  const areaInfo = this.areaInfoMap.get(tdAreaId)
                  // 确保 positionList 存在且有足够的元素
                  const position =
                    td.positionList && td.positionList[v]
                      ? td.positionList[v]
                      : null
                  if (!areaInfo) {
                    if (position) {
                      this.areaInfoMap.set(tdAreaId, {
                        id: tdAreaId,
                        area: tdElement.area!,
                        elementList: [tdElement],
                        positionList: [position]
                      })
                    }
                  } else {
                    areaInfo.elementList.push(tdElement)
                    if (position) {
                      areaInfo.positionList.push(position)
                    }
                  }
                }
              }
            }
          }
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
    const computeProps: Array<keyof IArea> = ['top', 'hide']
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
    const elementList = this.draw.getOriginalMainElementList()
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
    this.draw.spliceElementList(
      elementList,
      positionList[0].index,
      positionList.length,
      valueList,
      {
        isIgnoreDeletedRule: true
      }
    )
    this.draw.render({
      isSetCursor: false
    })
  }
}
