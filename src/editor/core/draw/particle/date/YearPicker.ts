import {
  EDITOR_COMPONENT,
  EDITOR_PREFIX
} from '../../../../dataset/constant/Editor'
import type { Draw } from '../../Draw'
import { type IDatePickerOption } from './DatePicker'
import { EditorComponent } from '../../../../dataset/enum/Editor'
import type { IMonthRenderOption } from './MonthPicker'

export interface IYearPickerDom {
  container: HTMLDivElement
  yearWrap: HTMLDivElement
  years: HTMLDivElement
  title: {
    preYear: HTMLSpanElement
    now: {
      nowYear: HTMLSpanElement
    }
    nextYear: HTMLSpanElement
  }
}
export interface IYearRenderOption extends IMonthRenderOption {}
export class YearPicker {
  private draw: Draw
  private options: IDatePickerOption
  private now: Date
  private dom: IYearPickerDom
  private renderOptions: IYearRenderOption | null
  private pickDate: Date | null
  constructor(draw: Draw, options: IDatePickerOption = {}) {
    this.draw = draw
    this.options = options
    this.now = new Date()
    this.dom = this._createDom()
    this.renderOptions = null
    this.pickDate = null
    this._bindEvent()
  }

  private _createDom(): IYearPickerDom {
    const yearPickerContainer = document.createElement('div')
    yearPickerContainer.classList.add(`${EDITOR_PREFIX}-year-container`)
    yearPickerContainer.setAttribute(EDITOR_COMPONENT, EditorComponent.POPUP)
    // 标题
    const yearWrap = document.createElement('div')
    yearWrap.classList.add(`${EDITOR_PREFIX}-yaer-wrap`)
    const yearPickerTitle = document.createElement('div')
    yearPickerTitle.classList.add(`${EDITOR_PREFIX}-date-title`)
    const nowTitle = document.createElement('span')
    nowTitle.classList.add(`${EDITOR_PREFIX}-date-title__now`)
    const nowYear = document.createElement('span')
    nowYear.classList.add(`${EDITOR_PREFIX}-date-title__now-year`)
    nowTitle.appendChild(nowYear)
    // 年切换
    const preYearTitle = document.createElement('span')
    preYearTitle.classList.add(`${EDITOR_PREFIX}-date-title__pre-year`)
    preYearTitle.innerText = `<<`
    const nextYearTitle = document.createElement('span')
    nextYearTitle.classList.add(`${EDITOR_PREFIX}-date-title__next-year`)
    nextYearTitle.innerText = `>>`
    yearPickerTitle.append(preYearTitle)
    yearPickerTitle.append(nowTitle)
    yearPickerTitle.append(nextYearTitle)
    const years = document.createElement('div')
    years.classList.add(`${EDITOR_PREFIX}-date-year`)
    yearWrap.append(yearPickerTitle)
    yearWrap.append(years)

    yearPickerContainer.append(yearWrap)
    this.draw.getContainer().append(yearPickerContainer)
    return {
      container: yearPickerContainer,
      yearWrap,
      years,
      title: {
        preYear: preYearTitle,
        now: {
          nowYear
        },
        nextYear: nextYearTitle
      }
    }
  }

  private _bindEvent() {
    this.dom.title.preYear.onclick = () => {
      this._preYear()
    }
    this.dom.title.nextYear.onclick = () => {
      this._nextYear()
    }
  }

  private _setPosition() {
    if (!this.renderOptions) return
    const {
      position: {
        coordinate: {
          leftTop: [left, top]
        },
        lineHeight,
        pageNo
      }
    } = this.renderOptions
    const height = this.draw.getHeight()
    const pageGap = this.draw.getPageGap()
    const currentPageNo = pageNo ?? this.draw.getPageNo()
    const preY = currentPageNo * (height + pageGap)
    // 位置
    this.dom.container.style.left = `${left}px`
    this.dom.container.style.top = `${top + preY + lineHeight}px`
  }

  public isInvalidDate(value: Date): boolean {
    return value.toDateString() === 'Invalid Date'
  }

  private _setValue() {
    const value = this.renderOptions?.value
    if (value) {
      const setDate = new Date(value)
      this.now = this.isInvalidDate(setDate) ? new Date() : setDate
    } else {
      this.now = new Date()
    }
    this.pickDate = new Date(this.now)
  }

  private _update() {
    // 本地年
    const localDate = new Date()
    const localYear = localDate.getFullYear()
    // 选择年
    let pickYear: number | null = null
    if (this.pickDate) {
      pickYear = this.pickDate.getFullYear()
    }
    // 当前年月日
    const year = this.now.getFullYear()
    const startYear = Math.floor(year / 10) * 10
    const endYear = startYear + 9 // 结束年份为开始年份加9
    this.dom.title.now.nowYear.innerHTML = `${startYear} - ${endYear}`
    this.dom.years.innerHTML = ''
    for (let i = startYear; i <= endYear; i++) {
      const yearDom = document.createElement('div')
      const innerYearDom = document.createElement('div')
      if (i === localYear) {
        innerYearDom.classList.add('active')
      }
      if (this.pickDate && pickYear === i) {
        innerYearDom.classList.add('select')
      }
      innerYearDom.innerText = `${i}`
      yearDom.appendChild(innerYearDom)
      yearDom.onclick = evt => {
        this._setYearPick(i)
        this._submit()
        evt.stopPropagation()
      }
      this.dom.years.append(yearDom)
    }
  }

  private _setYearPick(year: number) {
    this.now.setFullYear(year)
    this.pickDate?.setFullYear(year)
    this._update()
  }

  private _preYear() {
    this.now.setFullYear(this.now.getFullYear() - 10)
    this._update()
  }

  private _nextYear() {
    this.now.setFullYear(this.now.getFullYear() + 10)
    this._update()
  }

  public toggleVisible(isVisible: boolean) {
    if (isVisible) {
      this.dom.container.classList.add('active')
    } else {
      this.dom.container.classList.remove('active')
    }
  }

  private _submit() {
    if (this.options.onSubmit && this.pickDate) {
      const year = this.pickDate.getFullYear()
      this.options.onSubmit(`${year}`)
    }
    this.dispose()
  }

  public render(option: IYearRenderOption) {
    this.renderOptions = option
    this._setValue()
    this._update()
    this._setPosition()
    this.toggleVisible(option.isVisible || false)
  }

  public dispose() {
    this.toggleVisible(false)
  }

  public destroy() {
    this.dom.container.remove()
  }
}
