import { IElement, IElementPosition } from '../../../../interface/Element'

export interface IDatePickerOption {
  mountDom?: HTMLElement
}

interface IDatePickerDom {
  container: HTMLDivElement;
  dateWrap: HTMLDivElement;
  timeWrap: HTMLUListElement;
  title: {
    preYear: HTMLSpanElement;
    preMonth: HTMLSpanElement;
    now: HTMLSpanElement;
    nextMonth: HTMLSpanElement;
    nextYear: HTMLSpanElement;
  };
  day: HTMLDivElement;
  time: {
    hour: HTMLOListElement;
    minute: HTMLOListElement;
    second: HTMLOListElement;
  };
  menu: {
    time: HTMLButtonElement;
    now: HTMLButtonElement;
    submit: HTMLButtonElement;
  };
}

interface IRenderOption {
  value: string;
  element: IElement;
  position: IElementPosition;
  startTop: number;
}

export class DatePicker {

  private options: IDatePickerOption
  private now: Date
  private dom: IDatePickerDom
  private renderOptions: IRenderOption | null
  private isDatePicker: boolean

  constructor(options: IDatePickerOption = {}) {
    this.options = {
      mountDom: document.body,
      ...options
    }
    this.now = new Date()
    this.dom = this._createDom()
    this.renderOptions = null
    this.isDatePicker = true
    this._bindEvent()
  }

  private _createDom(): IDatePickerDom {
    const datePickerContainer = document.createElement('div')
    datePickerContainer.classList.add('date-container')
    // title-切换年月、年月显示
    const dateWrap = document.createElement('div')
    dateWrap.classList.add('date-wrap')
    const datePickerTitle = document.createElement('div')
    datePickerTitle.classList.add('date-title')
    const preYearTitle = document.createElement('span')
    preYearTitle.classList.add('date-title__pre-year')
    preYearTitle.innerText = `<<`
    const preMonthTitle = document.createElement('span')
    preMonthTitle.classList.add('date-title__pre-month')
    preMonthTitle.innerText = `<`
    const nowTitle = document.createElement('span')
    nowTitle.classList.add('date-title__now')
    const nextMonthTitle = document.createElement('span')
    nextMonthTitle.classList.add('date-title__next-month')
    nextMonthTitle.innerText = `>`
    const nextYearTitle = document.createElement('span')
    nextYearTitle.classList.add('date-title__next-year')
    nextYearTitle.innerText = `>>`
    datePickerTitle.append(preYearTitle)
    datePickerTitle.append(preMonthTitle)
    datePickerTitle.append(nowTitle)
    datePickerTitle.append(nextMonthTitle)
    datePickerTitle.append(nextYearTitle)
    // week-星期显示
    const datePickerWeek = document.createElement('div')
    datePickerWeek.classList.add('date-week')
    const weekList = ['日', '一', '二', '三', '四', '五', '六']
    weekList.forEach(week => {
      const weekDom = document.createElement('span')
      weekDom.innerText = `${week}`
      datePickerWeek.append(weekDom)
    })
    // day-天数显示
    const datePickerDay = document.createElement('div')
    datePickerDay.classList.add('date-day')
    // 日期内容构建
    dateWrap.append(datePickerTitle)
    dateWrap.append(datePickerWeek)
    dateWrap.append(datePickerDay)
    // time-时间选择
    const timeWrap = document.createElement('ul')
    timeWrap.classList.add('time-wrap')
    let hourTime: HTMLOListElement
    let minuteTime: HTMLOListElement
    let secondTime: HTMLOListElement
    const timeList = ['时', '分', '秒']
    timeList.forEach((t, i) => {
      const li = document.createElement('li')
      const timeText = document.createElement('span')
      timeText.innerText = t
      li.append(timeText)
      const ol = document.createElement('ol')
      const isHour = i === 0
      const isMinute = i === 1
      const endIndex = isHour ? 24 : 60
      for (let i = 0; i < endIndex; i++) {
        const time = document.createElement('li')
        time.innerText = `${String(i).padStart(2, '0')}`
        ol.append(time)
      }
      if (isHour) {
        hourTime = ol
      } else if (isMinute) {
        minuteTime = ol
      } else {
        secondTime = ol
      }
      li.append(ol)
      timeWrap.append(li)
    })
    // menu-选择时间、现在、确定
    const datePickerMenu = document.createElement('div')
    datePickerMenu.classList.add('date-menu')
    const timeMenu = document.createElement('button')
    timeMenu.classList.add('date-menu__time')
    timeMenu.innerText = '时间选择'
    const nowMenu = document.createElement('button')
    nowMenu.classList.add('date-menu__now')
    nowMenu.innerText = '此刻'
    const submitMenu = document.createElement('button')
    submitMenu.classList.add('date-menu__submit')
    submitMenu.innerText = '确定'
    datePickerMenu.append(timeMenu)
    datePickerMenu.append(nowMenu)
    datePickerMenu.append(submitMenu)
    // 构建
    datePickerContainer.append(dateWrap)
    datePickerContainer.append(timeWrap)
    datePickerContainer.append(datePickerMenu)
    this.options.mountDom!.append(datePickerContainer)
    return {
      container: datePickerContainer,
      dateWrap,
      timeWrap,
      title: {
        preYear: preYearTitle,
        preMonth: preMonthTitle,
        now: nowTitle,
        nextMonth: nextMonthTitle,
        nextYear: nextYearTitle
      },
      day: datePickerDay,
      time: {
        hour: hourTime!,
        minute: minuteTime!,
        second: secondTime!
      },
      menu: {
        time: timeMenu,
        now: nowMenu,
        submit: submitMenu
      }
    }
  }

  private _bindEvent() {
    this.dom.title.preYear.onclick = () => {
      this._preYear()
    }
    this.dom.title.preMonth.onclick = () => {
      this._preMonth()
    }
    this.dom.title.nextMonth.onclick = () => {
      this._nextMonth()
    }
    this.dom.title.nextYear.onclick = () => {
      this._nextYear()
    }
    this.dom.menu.time.onclick = () => {
      this.isDatePicker = !this.isDatePicker
      this._toggleDateTimePicker()
    }
    this.dom.menu.now.onclick = () => {
      this._now()
    }
    this.dom.menu.submit.onclick = () => {
      this.dispose()
    }
  }

  private _setPosition() {
    if (!this.renderOptions) return
    const {
      position: {
        coordinate: {
          leftTop: [left, top]
        },
        lineHeight
      },
      startTop
    } = this.renderOptions
    // 位置
    this.dom.container.style.left = `${left}px`
    this.dom.container.style.top = `${top + startTop + lineHeight}px`
  }

  private _setNow() {
    this.now = new Date()
  }

  private _update() {
    // 本地年月日
    const localDate = new Date()
    const localYear = localDate.getFullYear()
    const localMonth = localDate.getMonth() + 1
    const localDay = localDate.getDate()
    // 当前年月日
    const year = this.now.getFullYear()
    const month = this.now.getMonth() + 1
    const day = this.now.getDate()
    this.dom.title.now.innerText = `${year}年 ${String(month).padStart(2, '0')}月`
    // 日期补差
    const curDate = new Date(year, month, 0) // 当月日期
    const curDay = curDate.getDate() // 当月总天数
    let curWeek = new Date(year, month - 1, 1).getDay() // 当月第一天星期几
    if (curWeek === 0) {
      curWeek = 7
    }
    const preDay = new Date(year, month - 1, 0).getDate() // 上个月天数
    this.dom.day.innerHTML = ''
    // 渲染上个月日期
    const preStartDay = preDay - curWeek + 1
    for (let i = preStartDay; i <= preDay; i++) {
      const dayDom = document.createElement('div')
      dayDom.classList.add('disable')
      dayDom.innerText = `${i}`
      dayDom.onclick = () => {
        this.now = new Date(year, month - 2, i)
        this._update()
      }
      this.dom.day.append(dayDom)
    }
    // 渲染当月日期
    for (let i = 1; i <= curDay; i++) {
      const dayDom = document.createElement('div')
      if (localYear === year && localMonth === month && localDay === i) {
        dayDom.classList.add('active')
      }
      if (i === day) {
        dayDom.classList.add('select')
      }
      dayDom.innerText = `${i}`
      dayDom.onclick = () => {
        this.now = new Date(year, month - 1, i)
        this._update()
      }
      this.dom.day.append(dayDom)
    }
    // 渲染下月日期
    const nextEndDay = 6 * 7 - curWeek - curDay
    for (let i = 1; i <= nextEndDay; i++) {
      const dayDom = document.createElement('div')
      dayDom.classList.add('disable')
      dayDom.innerText = `${i}`
      dayDom.onclick = () => {
        this.now = new Date(year, month, i)
        this._update()
      }
      this.dom.day.append(dayDom)
    }
  }

  private _toggleDateTimePicker() {
    if (this.isDatePicker) {
      this.dom.dateWrap.classList.add('active')
      this.dom.timeWrap.classList.remove('active')
      this.dom.menu.time.innerText = `时间选择`
    } else {
      this.dom.dateWrap.classList.remove('active')
      this.dom.timeWrap.classList.add('active')
      this.dom.menu.time.innerText = `返回日期`
    }
  }

  private _preMonth() {
    this.now.setMonth(this.now.getMonth() - 1)
    this._update()
  }

  private _nextMonth() {
    this.now.setMonth(this.now.getMonth() + 1)
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

  private _now() {
    this.now = new Date()
    this._update()
  }

  private _toggleVisible(isVisible: boolean) {
    if (isVisible) {
      this.dom.container.classList.add('active')
    } else {
      this.dom.container.classList.remove('active')
    }
  }

  public render(option: IRenderOption) {
    this.renderOptions = option
    this._setNow()
    this._update()
    this._setPosition()
    this.isDatePicker = true
    this._toggleDateTimePicker()
    this._toggleVisible(true)
  }

  public dispose() {
    this._toggleVisible(false)
    return this.now
  }

}