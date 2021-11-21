import { ElementType } from "../.."
import { ZERO } from "../../dataset/constant/Common"
import { IElement, IElementPosition } from "../../interface/Element"
import { ICurrentPosition } from "../../interface/Position"
import { Draw } from "../draw/Draw"

export class Position {

  private cursorPosition: IElementPosition | null
  private positionList: IElementPosition[]
  private elementList: IElement[]

  private draw: Draw

  constructor(draw: Draw) {
    this.positionList = []
    this.elementList = []
    this.cursorPosition = null

    this.draw = draw
  }

  public getPositionList(): IElementPosition[] {
    return this.positionList
  }

  public setPositionList(payload: IElementPosition[]) {
    this.positionList = payload
  }

  public setCursorPosition(position: IElementPosition) {
    this.cursorPosition = position
  }

  public getCursorPosition(): IElementPosition | null {
    return this.cursorPosition
  }

  public getPositionByXY(x: number, y: number): ICurrentPosition {
    this.elementList = this.draw.getElementList()
    for (let j = 0; j < this.positionList.length; j++) {
      const { index, coordinate: { leftTop, rightTop, leftBottom } } = this.positionList[j];
      // 命中元素
      if (leftTop[0] <= x && rightTop[0] >= x && leftTop[1] <= y && leftBottom[1] >= y) {
        let curPostionIndex = j
        const element = this.elementList[j]
        // 图片区域均为命中
        if (element.type === ElementType.IMAGE) {
          return { index: curPostionIndex, isDirectHit: true, isImage: true }
        }
        // 判断是否在文字中间前后
        if (this.elementList[index].value !== ZERO) {
          const valueWidth = rightTop[0] - leftTop[0]
          if (x < leftTop[0] + valueWidth / 2) {
            curPostionIndex = j - 1
          }
        }
        return { index: curPostionIndex }
      }
    }
    // 非命中区域
    let isLastArea = false
    let curPostionIndex = -1
    // 判断所属行是否存在元素
    const firstLetterList = this.positionList.filter(p => p.isLastLetter)
    for (let j = 0; j < firstLetterList.length; j++) {
      const { index, coordinate: { leftTop, leftBottom } } = firstLetterList[j]
      if (y > leftTop[1] && y <= leftBottom[1]) {
        curPostionIndex = index
        isLastArea = true
        break
      }
    }
    if (!isLastArea) {
      return { index: this.positionList.length - 1 }
    }
    return { index: curPostionIndex }
  }

}