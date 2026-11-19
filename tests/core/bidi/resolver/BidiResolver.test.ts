import { describe, expect, it } from 'vitest'
import { BidiResolver } from '@/editor/core/bidi/resolver/BidiResolver'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'

describe('BidiResolver', () => {
  const resolver = new BidiResolver()

  it('仅在 auto 模式下扫描首个强方向字符', () => {
    expect(
      resolver.resolveDirection('hello سلام', TextDirection.AUTO)
    ).toBe(TextDirection.LTR)
    expect(
      resolver.resolveDirection('123 سلام hello', TextDirection.AUTO)
    ).toBe(TextDirection.RTL)
    expect(resolver.resolveDirection('سلام', TextDirection.LTR)).toBe(
      TextDirection.LTR
    )
  })

  it('普通 LTR 文本保持原顺序和零方向级别', () => {
    const result = resolver.resolve(
      [{ value: 'a' }, { value: 'b' }, { value: 'c' }],
      TextDirection.LTR
    )

    expect(result.levels).toEqual([0, 0, 0])
    expect(result.visualIndexes).toEqual([0, 1, 2])
  })

  it('RTL 段落保留 LTR 单词内部顺序并重排视觉 run', () => {
    const result = resolver.resolve(
      [{ value: 'ا' }, { value: 'ب' }, { value: 'a' }, { value: 'b' }],
      TextDirection.RTL
    )

    expect(result.visualIndexes).toEqual([2, 3, 1, 0])
    expect(result.levels).toEqual([1, 1, 2, 2])
  })

  it('RTL 段落中的阿拉伯数字保持内部书写顺序', () => {
    const result = resolver.resolve(
      [{ value: 'ا' }, { value: '1' }, { value: '2' }],
      TextDirection.RTL
    )

    expect(result.visualIndexes).toEqual([1, 2, 0])
  })

  it('支持显式方向覆盖和 PDF 恢复', () => {
    const result = resolver.resolve(
      ['a', '\u202e', 'a', 'b', '\u202c', 'c'].map(value => ({ value })),
      TextDirection.LTR
    )

    expect(result.levels).toEqual([0, 0, 1, 1, 0, 0])
    expect(result.visualIndexes).toEqual([0, 1, 3, 2, 4, 5])
  })

  it('isolate 内部顺序独立且不参与 auto 基准方向', () => {
    const text = '\u2067a\u2069ب'
    expect(resolver.resolveDirection(text, TextDirection.AUTO)).toBe(
      TextDirection.RTL
    )
    const values = ['ا', '\u2067', 'a', 'b', '\u2069', 'ب']
    const result = resolver.resolve(
      values.map(value => ({ value })),
      TextDirection.RTL
    )
    const visibleIndexes = result.visualIndexes.filter(
      index => index !== 1 && index !== 4
    )

    expect(visibleIndexes).toEqual([5, 2, 3, 0])
  })

  it('根据括号内部强方向计算配对括号层级', () => {
    const result = resolver.resolve(
      ['ا', '(', 'a', ')'].map(value => ({ value })),
      TextDirection.RTL
    )

    expect(result.levels).toEqual([1, 2, 2, 2])
  })

  it('FSI 不读取匹配 PDI 之后的强方向字符', () => {
    const result = resolver.resolve(
      ['\u2068', 'ا', '\u2069', 'a'].map(value => ({ value })),
      TextDirection.LTR
    )

    expect(result.levels).toEqual([0, 1, 0, 0])
  })

  it('组合标记继承前一个字符的方向级别', () => {
    const result = resolver.resolve(
      ['a', '\u0301', 'ב'].map(value => ({ value })),
      TextDirection.LTR
    )

    expect(result.levels).toEqual([0, 0, 1])
  })

  it('段落分隔符和行尾空白重置为段落方向', () => {
    const result = resolver.resolve(
      ['א', 'a', ' ', '\n'].map(value => ({ value })),
      TextDirection.RTL
    )

    expect(result.levels).toEqual([1, 2, 1, 1])
  })
})

describe('BidiResolver Unicode 分类', () => {
  const resolver = new BidiResolver()

  it('箭头不再被当作欧洲数字终结符', () => {
    const result = resolver.resolve(
      ['1', '→', '2'].map(value => ({ value })),
      TextDirection.RTL
    )

    expect(result.levels).toEqual([2, 1, 2])
  })

  it('阿拉伯逗号不参与首个强方向判断', () => {
    expect(resolver.resolveDirection('،a', TextDirection.AUTO)).toBe(
      TextDirection.LTR
    )
  })
})
