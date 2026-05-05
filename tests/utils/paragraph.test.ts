import { describe, it, expect } from 'vitest'
import { getParagraphNo } from '@/editor/utils/paragraph'

describe('getParagraphNo', () => {
  it('单行文本段落号为 0', () => {
    const list = [{ value: '\u200B' }, { value: 'hello' }, { value: '\n' }]
    expect(getParagraphNo(list as any, 1)).toBe(0)
  })

  it('换行后段落号递增', () => {
    const list = [
      { value: '\u200B' },
      { value: 'hello' },
      { value: '\u200B' },
      { value: 'world' }
    ]
    expect(getParagraphNo(list as any, 3)).toBe(1)
  })
})
