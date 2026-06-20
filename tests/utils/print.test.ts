import { describe, it, expect } from 'vitest'
import { print } from '@/editor/utils/print'

describe('print', () => {
  it('print 函数存在', () => {
    expect(typeof print).toBe('function')
  })
})
