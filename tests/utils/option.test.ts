import { describe, it, expect } from 'vitest'
import { mergeOption } from '@/editor/utils/option'

describe('mergeOption', () => {
  it('空参数返回完整默认配置', () => {
    const options = mergeOption()
    expect(options.width).toBe(794)
    expect(options.height).toBe(1123)
    expect(options.defaultSize).toBe(16)
    expect(options.defaultFont).toBe('Microsoft YaHei')
  })

  it('自定义 width 覆盖默认值', () => {
    const options = mergeOption({ width: 500 })
    expect(options.width).toBe(500)
    expect(options.height).toBe(1123)
  })

  it('嵌套 table 默认值合并', () => {
    const options = mergeOption({ table: { tdPadding: [0, 10, 10, 10] as any } })
    expect(options.table.tdPadding).toEqual([0, 10, 10, 10])
    expect(options.table.defaultBorderColor).toBeDefined()
  })

  it('#1405 回归:恶意原型键不污染', () => {
    const malicious = JSON.parse('{"__proto__":{"polluted":true}}')
    mergeOption(malicious)
    expect(({} as any).polluted).toBeUndefined()
  })
})
