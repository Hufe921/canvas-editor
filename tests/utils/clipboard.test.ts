import { describe, it, expect } from 'vitest'
import {
  setClipboardData,
  getClipboardData,
  removeClipboardData
} from '@/editor/utils/clipboard'

describe('clipboard', () => {
  it('setClipboardData 和 getClipboardData', () => {
    removeClipboardData()
    const data = { text: 'hello', elementList: [{ value: 'hello' }] }
    setClipboardData(data as any)
    const result = getClipboardData()
    expect(result?.text).toBe('hello')
    expect(result?.elementList).toEqual([{ value: 'hello' }])
  })

  it('removeClipboardData 清空数据', () => {
    setClipboardData({ text: 'test', elementList: [] })
    removeClipboardData()
    expect(getClipboardData()).toBeNull()
  })
})
