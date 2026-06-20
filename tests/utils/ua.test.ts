import { describe, it, expect } from 'vitest'
import { isApple, isIOS, isMobile, isFirefox } from '@/editor/utils/ua'

describe('ua', () => {
  it('isApple 基于 navigator.userAgent 判断', () => {
    expect(typeof isApple).toBe('boolean')
  })

  it('isIOS 基于 navigator.userAgent 判断', () => {
    expect(typeof isIOS).toBe('boolean')
  })

  it('isMobile 基于 navigator.userAgent 判断', () => {
    expect(typeof isMobile).toBe('boolean')
  })

  it('isFirefox 基于 navigator.userAgent 判断', () => {
    expect(typeof isFirefox).toBe('boolean')
  })
})
