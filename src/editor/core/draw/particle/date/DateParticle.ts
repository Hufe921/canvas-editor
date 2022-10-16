import { ElementType } from '../../../../dataset/enum/Element'
import { IEditorOption } from '../../../../interface/Editor'
import { IElement, IElementPosition } from '../../../../interface/Element'
import { IRowElement } from '../../../../interface/Row'
import { createSVGElement } from '../../../../utils/svg'
import { RangeManager } from '../../../range/RangeManager'
import { Draw } from '../../Draw'
import { DatePicker } from './DatePicker'

export class DateParticle {

  private draw: Draw
  private options: Required<IEditorOption>
  private range: RangeManager
  private datePicker: DatePicker

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.range = draw.getRange()
    this.datePicker = new DatePicker({
      mountDom: draw.getContainer(),
      onSubmit: this._setValue.bind(this)
    })
  }

  private _setValue(date: string) {
    if (!date) return
    const range = this.getDateElementRange()
    if (!range) return
    const [leftIndex, rightIndex] = range
    const elementList = this.draw.getElementList()
    const startElement = elementList[leftIndex + 1]
    // 删除旧时间
    elementList.splice(leftIndex + 1, rightIndex - leftIndex)
    this.range.setRange(leftIndex, leftIndex)
    // 插入新时间
    this.draw.insertElementList([{
      type: ElementType.DATE,
      value: '',
      dateFormat: startElement.dateFormat,
      valueList: [{
        value: date
      }]
    }])
  }

  public getDateElementRange(): [number, number] | null {
    let leftIndex = -1
    let rightIndex = -1
    const { startIndex, endIndex } = this.range.getRange()
    if (!~startIndex && !~endIndex) return null
    const elementList = this.draw.getElementList()
    const startElement = elementList[startIndex]
    if (startElement.type !== ElementType.DATE) return null
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
    if (!~leftIndex || !~rightIndex) return null
    return [leftIndex, rightIndex]
  }

  public clearDatePicker() {
    this.datePicker.dispose()
  }

  public renderDatePicker(element: IElement, position: IElementPosition) {
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const startTop = this.draw.getPageNo() * (height + pageGap)
    const elementList = this.draw.getElementList()
    const range = this.getDateElementRange()
    const value = range
      ? elementList.slice(range[0] + 1, range[1] + 1).map(el => el.value).join('')
      : ''
    this.datePicker.render({
      value,
      element,
      position,
      startTop
    })
  }

  public render(ctx: SVGElement, element: IRowElement, x: number, y: number) {
    const text = createSVGElement('text')
    const { scale } = this.options
    const { italic, bold, size, color, value } = element
    if (italic) {
      text.style.fontStyle = 'italic'
    }
    if (bold) {
      text.style.fontWeight = 'bold'
    }
    if (size) {
      text.style.fontSize = `${size * scale}px`
    }
    if (color) {
      text.style.fill = color
    }
    if (element.color) {
      ctx.style.fill = element.color
    }
    text.setAttribute('x', `${x}`)
    text.setAttribute('y', `${y}`)
    text.append(document.createTextNode(value))
    ctx.append(text)
  }

}