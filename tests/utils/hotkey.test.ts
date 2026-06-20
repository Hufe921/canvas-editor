import { describe, it, expect } from 'vitest'
import { isMod } from '@/editor/utils/hotkey'
import { isApple } from '@/editor/utils/ua'

describe('isMod', () => {
  it('当前平台修饰键返回 true', () => {
    const evt = isApple
      ? new KeyboardEvent('keydown', { metaKey: true })
      : new KeyboardEvent('keydown', { ctrlKey: true })
    expect(isMod(evt)).toBe(true)
  })

  it('非当前平台修饰键返回 false', () => {
    const evt = isApple
      ? new KeyboardEvent('keydown', { ctrlKey: true })
      : new KeyboardEvent('keydown', { metaKey: true })
    expect(isMod(evt)).toBe(false)
  })

  it('无修饰键返回 false', () => {
    const evt = new KeyboardEvent('keydown')
    expect(isMod(evt)).toBe(false)
  })
})
