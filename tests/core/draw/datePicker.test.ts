import { describe, it, expect } from 'vitest'
import { DatePicker } from '@/editor/core/draw/particle/date/DatePicker'
import { Draw } from '@/editor/core/draw/Draw'

function createDatePicker() {
  const draw = <Draw>(<unknown>{
    getContainer: () => document.createElement('div'),
    getI18n: () => ({ t: (key: string) => key })
  })
  return new DatePicker(draw)
}

describe('DatePicker formatDate', () => {
  const datePicker = createDatePicker()
  const date = new Date(2026, 9, 19, 15, 3, 8)

  it('HH 为 24 小时制', () => {
    expect(datePicker.formatDate(date, 'yyyy-MM-dd HH:mm:ss')).toBe(
      '2026-10-19 15:03:08'
    )
  })

  it('hh 为 12 小时制', () => {
    expect(datePicker.formatDate(date, 'yyyy-MM-dd hh:mm:ss')).toBe(
      '2026-10-19 03:03:08'
    )
  })

  it('年月日时分秒格式', () => {
    expect(datePicker.formatDate(date, 'yyyy年MM月dd日 HH时mm分ss秒')).toBe(
      '2026年10月19日 15时03分08秒'
    )
  })
})

describe('DatePicker parseDate', () => {
  const datePicker = createDatePicker()

  it('按年月日时分秒格式解析', () => {
    const date = datePicker.parseDate(
      '2026年10月19日 15时03分08秒',
      'yyyy年MM月dd日 HH时mm分ss秒'
    )
    expect(date).toEqual(new Date(2026, 9, 19, 15, 3, 8))
  })

  it('与 formatDate 互逆', () => {
    const date = new Date(2026, 0, 5, 9, 7, 6)
    const format = 'dd/MM/yyyy HH:mm:ss'
    const value = datePicker.formatDate(date, format)
    expect(datePicker.parseDate(value, format)).toEqual(date)
  })

  it('仅日期格式时间为 0 点', () => {
    expect(datePicker.parseDate('2026-10-19', 'yyyy-MM-dd')).toEqual(
      new Date(2026, 9, 19)
    )
  })

  it('格式不匹配返回 null', () => {
    expect(datePicker.parseDate('2026-10-19', 'yyyy年MM月dd日')).toBeNull()
  })

  it('溢出日期返回 null', () => {
    expect(datePicker.parseDate('2026-02-30', 'yyyy-MM-dd')).toBeNull()
    expect(datePicker.parseDate('2026-13-01', 'yyyy-MM-dd')).toBeNull()
  })
})
