import {
  EDITOR_COMPONENT,
  EDITOR_PREFIX
} from '../../../../dataset/constant/Editor'
import type { Draw } from '../../Draw'
import { type IDatePickerOption, type IRenderOption } from './DatePicker'
import { EditorComponent } from '../../../../dataset/enum/Editor'
import { YearPicker } from './YearPicker'

export interface IMonthPickerLang {
  year: string
  months: {
    jan: string
    feb: string
    mar: string
    apr: string
    may: string
    jun: string
    jul: string
    aug: string
    sep: string
    oct: string
    nov: string
    dec: string
  }
}

export interface IMonthPickerDom {
  container: HTMLDivElement
  monthWrap: HTMLDivElement
  months: HTMLDivElement
  title: {
    preYear: HTMLSpanElement
    now: {
      nowYear: HTMLSpanElement
    }
    nextYear: HTMLSpanElement
  }
}

export interface IMonthRenderOption extends IRenderOption {
  isVisible?: boolean
}
export class MonthPicker {
  private draw: Draw
  private options: IDatePickerOption
  private now: Date
  private dom: IMonthPickerDom
  private renderOptions: IMonthRenderOption | null
  private pickDate: Date | null
  private lang: IMonthPickerLang
  private yearPicker: YearPicker
  constructor(draw: Draw, options: IDatePickerOption = {}) {
    this.draw = draw
    this.options = options
    this.lang = this._getLang()
    this.now = new Date()
    this.dom = this._createDom()
    this.yearPicker = new YearPicker(this.draw,{
      onSubmit: (date: string)=>{
        const setDate = new Date(date)
        const year = setDate.getFullYear()
        this._setYearPick(year)
        this.toggleVisible(true)
      }
    })
    this.renderOptions = null
    this.pickDate = null
    this._bindEvent()
  }

  private _createDom(): IMonthPickerDom {
    const monthPickerContainer = document.createElement('div')
    monthPickerContainer.classList.add(`${EDITOR_PREFIX}-month-container`)
    monthPickerContainer.setAttribute(EDITOR_COMPONENT, EditorComponent.POPUP)
    // 标题
    const monthWrap = document.createElement('div')
    monthWrap.classList.add(`${EDITOR_PREFIX}-month-wrap`)
    const monthPickerTitle = document.createElement('div')
    monthPickerTitle.classList.add(`${EDITOR_PREFIX}-date-title`)
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
    monthPickerTitle.append(preYearTitle)
    monthPickerTitle.append(nowTitle)
    monthPickerTitle.append(nextYearTitle)
    const months = document.createElement('div')
    months.classList.add(`${EDITOR_PREFIX}-date-month`)
    // 月份内容构建
    monthWrap.append(monthPickerTitle)
    monthWrap.append(months)

    monthPickerContainer.append(monthWrap)
    this.draw.getContainer().append(monthPickerContainer)
    return {
      container: monthPickerContainer,
      monthWrap,
      months,
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
    this.dom.title.now.nowYear.onclick = () => {
      this.toggleVisible(false)
      this.yearPicker.toggleVisible(true)
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

  private _getLang() {
    const i18n = this.draw.getI18n()
    const t = i18n.t.bind(i18n)
    return {
      year: t('datePicker.year'),
      months: {
        jan: t('datePicker.months.jan'),
        feb: t('datePicker.months.feb'),
        mar: t('datePicker.months.mar'),
        apr: t('datePicker.months.apr'),
        may: t('datePicker.months.may'),
        jun: t('datePicker.months.jun'),
        jul: t('datePicker.months.jul'),
        aug: t('datePicker.months.aug'),
        sep: t('datePicker.months.sep'),
        oct: t('datePicker.months.oct'),
        nov: t('datePicker.months.nov'),
        dec: t('datePicker.months.dec')
      }
    }
  }

  private _update() {
    // 本地年月
    const localDate = new Date()
    const localYear = localDate.getFullYear()
    const localMonth = localDate.getMonth() + 1
    // 选择年月
    let pickYear: number | null = null
    let pickMonth: number | null = null
    if (this.pickDate) {
      pickYear = this.pickDate.getFullYear()
      pickMonth = this.pickDate.getMonth() + 1
    }
    this.dom.months!.innerHTML = ''
    // 当前年月
    const year = this.now.getFullYear()
    this.dom.title.now.nowYear.innerText = `${year}${this.lang.year}`
    const { months } = this.lang
    const monthList = Object.values(months)
    // 渲染当年月
    for (let month = 1; month <= monthList.length; month++) {
      const monthDom = document.createElement('div')
      const innerMonthDom = document.createElement('div')
      if (localYear === year && localMonth === month) {
        innerMonthDom.classList.add('active')
      }
      if (this.pickDate && pickYear === year && pickMonth === month) {
        innerMonthDom.classList.add('select')
      }
      innerMonthDom.innerText = `${monthList[month - 1]}`
      monthDom.appendChild(innerMonthDom)
      const nowDate = new Date(year, month - 1)
      monthDom.onclick = evt => {
        this.now = nowDate
        this._setMonthPick(year, month - 1)
        this._submit()
        evt.stopPropagation()
      }
      this.dom.months?.append(monthDom)
    }
  }

  private _setYearPick(year: number) {
    this.now?.setFullYear(year)
    this.pickDate?.setFullYear(year)
    this._update()
  }

  private _setMonthPick(year: number, month: number) {
    this.now = new Date(year, month)
    this.pickDate?.setFullYear(year)
    this.pickDate?.setMonth(month)
    this._update()
  }

  private _preYear() {
    this.now.setFullYear(this.now.getFullYear() - 1)
    this._update()
  }

  private _nextYear() {
    this.now.setFullYear(this.now.getFullYear() + 1)
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
      const month = this.pickDate.getMonth() + 1
      this.options.onSubmit(`${year}-${String(month).padStart(2, '0')}`)
    }
    this.dispose()
  }

  public render(option: IMonthRenderOption) {
    this.renderOptions = option
    this.lang = this._getLang()
    this.yearPicker.render({
      ...option,
      isVisible: false
    })
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
    this.yearPicker.destroy()
  }
}
