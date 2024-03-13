import { ElementType } from '../../../../dataset/enum/Element'
import { IElement, IElementPosition } from '../../../../interface/Element'
import { formatElementContext } from '../../../../utils/element'
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
    const i18n = draw.getI18n()
    const t = i18n.t.bind(i18n)
    this.datePicker = new DatePicker({
      mountDom: draw.getContainer(),
      onSubmit: this._setValue.bind(this),
      getLang: () => ({
        now: t('datePicker.now'),
        confirm: t('datePicker.confirm'),
        return: t('datePicker.return'),
        timeSelect: t('datePicker.timeSelect'),
        weeks: {
          sun: t('datePicker.weeks.sun'),
          mon: t('datePicker.weeks.mon'),
          tue: t('datePicker.weeks.tue'),
          wed: t('datePicker.weeks.wed'),
          thu: t('datePicker.weeks.thu'),
          fri: t('datePicker.weeks.fri'),
          sat: t('datePicker.weeks.sat')
        },
        year: t('datePicker.year'),
        month: t('datePicker.month'),
        hour: t('datePicker.hour'),
        minute: t('datePicker.minute'),
        second: t('datePicker.second')
      })
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
    this.draw.spliceElementList(
      elementList,
      leftIndex + 1,
      rightIndex - leftIndex
    )
    this.range.setRange(leftIndex, leftIndex)
    // 插入新时间
    const dateElement: IElement = {
      type: ElementType.DATE,
      value: '',
      dateFormat: startElement.dateFormat,
      valueList: [
        {
          value: date
        }
      ]
    }
    formatElementContext(elementList, [dateElement], leftIndex)
    this.draw.insertElementList([dateElement])
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
      ? elementList
          .slice(range[0] + 1, range[1] + 1)
          .map(el => el.value)
          .join('')
      : ''
    this.datePicker.render({
      value,
      element,
      position,
      startTop
    })
  }
}
