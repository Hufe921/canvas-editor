import { describe, it, expect } from 'vitest'

describe('vitest 基础设施冒烟', () => {
  it('canvas getContext 可被 mock', () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    expect(ctx).toBeTruthy()
    expect(typeof ctx.fillText).toBe('function')
  })

  it('Worker 替身存在', () => {
    expect(typeof (globalThis as any).Worker).toBe('function')
  })

  it('ResizeObserver 替身存在', () => {
    expect(typeof (globalThis as any).ResizeObserver).toBe('function')
  })
})
