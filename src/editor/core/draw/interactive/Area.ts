import { Draw } from '../Draw'
import { IEditorData, IEditorResult } from '../../../interface/Editor'
import { IElement } from '../../../interface/Element'
import { deepClone, getUUID } from '../../../utils'
import { needFillZeroElement } from '../../../utils/element'
import { AreaLocationPosition } from '../../../dataset/enum/Common'
import { ElementType } from '../../../dataset/enum/Element'
import { IAreaData, IAreaStyle, IInsertAreaOption } from '../../../interface/Area'
import { ZERO } from '../../../dataset/constant/Common'
import { EditorMode } from '../../../dataset/enum/Editor'

type InsertAreaData = IEditorData | IEditorResult | IElement[]

interface IAreaPosition {
  start: number
  end: number
}

interface IAreaPositionInfo {
  position: IAreaPosition
  pageIndex: number
}

export class Area {
  private draw: Draw
  private areaStyle = new Map<string, IAreaStyle>()
  private areaPosition = new Map<string, IAreaPositionInfo[]>()
  private editingArea = new Set<string>()
  private formArea = new Set<string>()
  private areaOptionMap = new Map<string, IEditorResult>()

  constructor(draw: Draw) {
    this.draw = draw
  }

  public insertArea(payload: InsertAreaData, options: IInsertAreaOption): string | undefined {
    let mainElements
    let paramIsResult = false
    if (Array.isArray(payload)) {
      mainElements = payload
    } else if ((payload as IEditorData).main) {
      mainElements = (payload as IEditorData).main
    } else {
      mainElements = (payload as IEditorResult).data?.main
      paramIsResult = true
    }
    if (!mainElements.length) return
    if (this.draw.isDisabled()) return
    const cloneElementList = deepClone(mainElements)
    const { position = AreaLocationPosition.END } = options

    const area: IElement[] = [{
      type: ElementType.AREA, value: '', valueList: cloneElementList
    }]
    if (position == AreaLocationPosition.START && needFillZeroElement(cloneElementList[cloneElementList.length - 1])) {
      area.push({
        value: ZERO
      })
    }

    const id = options.id ?? getUUID()
    if (options.style) {
      this.areaStyle.set(id, options.style)
    }
    area[0].areaId = id
    if (paramIsResult){
      this.areaOptionMap.set(id, payload as IEditorResult)
    }
    this.draw.insertElementList(area, false)
    return id
  }

  public getAreaOption(id: string): IEditorResult | undefined {
    return this.areaOptionMap.get(id)
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    const mode = this.draw.getMode()
    if (mode == EditorMode.CLEAN || mode === EditorMode.PRINT) return
    const positionMap = new Map<string, IAreaPositionInfo>()
    for (const [areaId, positionListElement] of this.areaPosition) {
      for (let i = 0; i < positionListElement.length; i++) {
        if (pageNo !== positionListElement[i].pageIndex) {
          continue
        }
        positionMap.set(areaId, positionListElement[i])
      }
    }

    if (positionMap.size === 0) return
    ctx.save()
    // 画背景
    const width = this.draw.getOptions().width
    for (const [areaId, position] of positionMap) {
      const style = this.areaStyle.get(areaId)
      if (position.position.start >= position.position.end) continue
      if (!style || (!style.backgroundColor && !style.borderColor)) continue
      ctx.globalAlpha = style.alpha ?? 0.1
      if (style.backgroundColor) {
        ctx.fillStyle = style.backgroundColor
        ctx.fillRect(0, position.position.start, width, position.position.end - position.position.start)
      }
      if (style.borderColor) {
        ctx.globalAlpha = 0.5
        ctx.strokeStyle = style.borderColor
        ctx.beginPath()
        ctx.roundRect(0, position.position.start, width, position.position.end - position.position.start, [5])
        ctx.stroke()
      }
    }
    ctx.restore()
  }

  /**
   * 计算每个 area 的位置，这个方法依赖 {@link Position#computePositionList()} 的计算
   * 结果
   */
  public computeAreaPosition() {
    const positionList = this.draw.getPosition().getOriginalMainPositionList()
    const elementList = this.draw.getOriginalMainElementList()
    this.areaPosition.clear()
    if (elementList.length === 0 || positionList.length === 0) return
    for (let i = 0; i < elementList.length; i++) {
      const element = elementList[i]
      const position = positionList[i]
      if (!position || !element.areaId) continue
      let areaPositionList = this.areaPosition.get(element.areaId)
      if (!areaPositionList) {
        areaPositionList = []
        this.areaPosition.set(element.areaId, areaPositionList)
      }
      let target = areaPositionList.find(value => value.pageIndex === position.pageNo)
      if (!target) {
        target = {
          pageIndex: position.pageNo,
          position: { start: position.coordinate.leftTop[1], end: position.coordinate.leftTop[1] }
        }
        areaPositionList.push(target)
      }
      if (target.position.start < position.coordinate.leftTop[1] &&
        position.coordinate.leftTop[1] < target.position.end) {
        continue
      }
      if (target.position.start >= position.coordinate.leftBottom[1]) {
        target.position.start = position.coordinate.leftBottom[1]
      }
      if (target.position.end <= position.coordinate.leftBottom[1]) {
        target.position.end = position.coordinate.leftBottom[1]
      }
    }
    // 清理 style
    const newStyleMap = new Map<string, IAreaStyle>()
    for (const [areaId] of this.areaPosition) {
      const style = this.areaStyle.get(areaId)
      if (style) {
        newStyleMap.set(areaId, style)
      }
    }
  }

  public setAreaEditable(areaId: string, editable = true): void {
    if (editable) {
      this.editingArea.add(areaId)
    } else {
      this.editingArea.delete(areaId)
    }
    this.draw.render({
      isSetCursor: false
    })
  }

  public setAreaFormMode(areaId: string, isForm = true): void {
    if (isForm) {
      this.formArea.add(areaId)
    } else {
      this.formArea.delete(areaId)
    }
    this.draw.render({
      isSetCursor: false
    })
  }

  public setAreaStyle(areaId: string, style: IAreaStyle) {
    if (!style) {
      this.areaStyle.delete(areaId)
    }
    this.areaStyle.set(areaId, {
      alpha: style.alpha, backgroundColor: style.backgroundColor, borderColor: style.borderColor
    })
    this.draw.render({
      isSetCursor: false
    })
  }

  public getData(): IAreaData {
    const style = new Map<string, IAreaStyle>()
    const editingArea = new Set<string>()
    const formArea = new Set<string>()
    const result = {
      style, editingArea, formArea
    }

    if (this.areaStyle.size) {
      this.areaStyle.forEach((value, key) => {
        style.set(key, deepClone(value))
      })
    }
    if (this.editingArea.size) {
      this.editingArea.forEach(v => editingArea.add(v))
    }
    if (this.formArea.size) {
      this.formArea.forEach(v => formArea.add(v))
    }

    return result
  }

  public setData(data: IAreaData) {
    console.log(data)
    this.editingArea = new Set<string>()
    this.areaStyle = new Map<string, IAreaStyle>()
    this.formArea = new Set<string>()
    if (!data) {
      return
    }
    if (data.style && data.style.size) {
      data.style.forEach((value, key) => {
        this.areaStyle.set(key, deepClone(value))
      })
    }

    if (data.editingArea && data.editingArea.size) {
      data.editingArea.forEach(v => this.editingArea.add(v))
    }

    if (data.formArea && data.formArea.size) {
      data.formArea.forEach(v => this.formArea.add(v))
    }
  }

  public isEditing(): boolean {
    const { startIndex, endIndex } = this.draw.getRange().getRange()
    if (!~startIndex && !~endIndex) return false
    const elementList = this.draw.getOriginalMainElementList()
    for (let i = startIndex; i <= endIndex; i++) {
      const element = elementList[i]
      if (!element.areaId) {
        return false
      }
      if (!this.editingArea.has(element.areaId)) {
        return false
      }
    }
    return true
  }
  public isFormMode(): boolean {
    const { startIndex, endIndex } = this.draw.getRange().getRange()
    if (!~startIndex && !~endIndex) return false
    const elementList = this.draw.getOriginalMainElementList()
    for (let i = startIndex; i <= endIndex; i++) {
      const element = elementList[i]
      if (!element.areaId) {
        return false
      }
      if (!this.formArea.has(element.areaId)) {
        return false
      }
    }
    return true
  }
}