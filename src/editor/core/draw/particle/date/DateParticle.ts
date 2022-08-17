import { ElementType } from '../../../../dataset/enum/Element'
import { IElement, IElementPosition } from '../../../../interface/Element'
import { IRowElement } from '../../../../interface/Row'
import { RangeManager } from '../../../range/RangeManager'
import { Draw } from '../../Draw'
import { DatePicker } from './DatePicker'

export class DateParticle {

  private draw: Draw
  private range: RangeManager
  private datePicker: DatePicker

  constructor(draw: Draw) {
    this.draw = draw
    this.range = draw.getRange()
    this.datePicker = new DatePicker({
      mountDom: draw.getContainer()
    })
  }

  public getDateElementList(): IElement[] {
    let leftIndex = -1
    let rightIndex = -1
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return []
    const elementList = this.draw.getElementList()
    const startElement = elementList[startIndex]
    if (startElement.type !== ElementType.DATE) return []
    // 向左查找
    let preIndex = startIndex
    while (preIndex > 0) {
      const preElement = elementList[preIndex]
      if (preElement.dateId !== startElement.dateId) {
        leftIndex = preIndex
        break
      }
      preIndex--
    }
    // 向右查找
    let nextIndex = startIndex + 1
    while (nextIndex < elementList.length) {
      const nextElement = elementList[nextIndex]
      if (nextElement.dateId !== startElement.dateId) {
        rightIndex = nextIndex - 1
        break
      }
      nextIndex++
    }
    // 控件在最后
    if (nextIndex === elementList.length) {
      rightIndex = nextIndex - 1
    }
    if (!~leftIndex || !~rightIndex) return []
    return elementList.slice(leftIndex + 1, rightIndex + 1)
  }

  public clearDatePicker() {
    this.datePicker.dispose()
  }

  public renderDatePicker(element: IElement, position: IElementPosition) {
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const startTop = this.draw.getPageNo() * (height + pageGap)
    const value = this.getDateElementList().map(el => el.value).join('')
    this.datePicker.render({
      value,
      element,
      position,
      startTop
    })
  }

  public render(ctx: CanvasRenderingContext2D, element: IRowElement, x: number, y: number) {
    ctx.save()
    ctx.font = element.style
    if (element.color) {
      ctx.fillStyle = element.color
    }
    ctx.fillText(element.value, x, y)
    ctx.restore()
  }

}