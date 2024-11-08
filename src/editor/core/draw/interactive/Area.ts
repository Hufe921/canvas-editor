import { Draw } from '../Draw'
import { IEditorData, IEditorOption, IEditorResult } from '../../../interface/Editor'
import { IElement } from '../../../interface/Element'
import { deepClone, getUUID } from '../../../utils'
import { formatElementContext, needFillZeroElement } from '../../../utils/element'
import { AreaLocationPosition } from '../../../dataset/enum/Common'
import { DeepRequired } from '../../../interface/Common'
import { ElementType } from '../../../dataset/enum/Element'
import { IAreaStyle, IInsertAreaOption } from '../../../interface/Area'
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
  private options: DeepRequired<IEditorOption>
  private areaStyle = new Map<string, IAreaStyle>()
  private areaPosition = new Map<string, IAreaPositionInfo[]>()

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
  }

  public insertArea(payload: InsertAreaData, options: IInsertAreaOption): void {
    let mainElements
    if (Array.isArray(payload)) {
      mainElements = payload
    } else if ((payload as IEditorData).main) {
      mainElements = (payload as IEditorData).main
    } else {
      mainElements = (payload as IEditorResult).data?.main
    }
    if (!mainElements.length) return
    if (this.draw.isDisabled()) return
    const cloneElementList = deepClone(mainElements)
    const { position = AreaLocationPosition.END } = options
    const elementList = this.draw.getElementList()
    const startIndex = position === AreaLocationPosition.START ? 0 : this.draw.getOriginalMainElementList().length


    const area: IElement[] = [{
      type: ElementType.AREA, value: '', valueList: cloneElementList
    }]
    if (position == AreaLocationPosition.START && needFillZeroElement(cloneElementList[cloneElementList.length - 1])) {
      area.push({
        value: ZERO
      })
    }
    formatElementContext(elementList, area, startIndex, {
      editorOptions: this.options
    })
    const id = getUUID()
    if (options.style) {
      this.areaStyle.set(id, options.style)
    }
    area[0].areaId = id
    this.draw.insertElementList(area)
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
}