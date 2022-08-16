import { IElement, IElementPosition } from '../../../../interface/Element'
import { IRowElement } from '../../../../interface/Row'
import { Draw } from '../../Draw'
import { DatePicker } from './DatePicker'

export class DateParticle {

  private datePicker: DatePicker

  constructor(draw: Draw) {
    this.datePicker = new DatePicker({
      mountDom: draw.getContainer()
    })
  }

  public clearDatePicker() {
    this.datePicker.dispose()
  }

  public renderDatePicker(element: IElement, position: IElementPosition) {
    console.log('element: ', element)
    console.log('position: ', position)
    this.datePicker.render()
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