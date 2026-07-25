import { describe, it, expect } from 'vitest'
import { tokenize, TokenType } from '@/editor/core/cascade/expression/tokenizer'

describe('表达式 tokenizer', () => {
  it('比较与逻辑运算', () => {
    const tokens = tokenize("sex == '1' && age > 60")
    expect(tokens.map(t => t.type)).toEqual([
      TokenType.IDENT,
      TokenType.OP,
      TokenType.STRING,
      TokenType.OP,
      TokenType.IDENT,
      TokenType.OP,
      TokenType.NUMBER
    ])
    expect(tokens[6].value).toBe('60')
  })

  it('布尔与 null 字面量', () => {
    const tokens = tokenize('a == true && b != null')
    expect(tokens[2].type).toBe(TokenType.BOOLEAN)
    expect(tokens[6].type).toBe(TokenType.NULL)
  })

  it('数组与函数调用', () => {
    const tokens = tokenize("contains(tags, '1') && x in ['a','b']")
    expect(tokens.map(t => t.value)).toEqual([
      'contains',
      '(',
      'tags',
      ',',
      '1',
      ')',
      '&&',
      'x',
      'in',
      '[',
      'a',
      ',',
      'b',
      ']'
    ])
  })

  it('中文标识符', () => {
    const tokens = tokenize("高血压 == '1'")
    expect(tokens[0]).toEqual({ type: TokenType.IDENT, value: '高血压' })
  })

  it('双引号字符串与转义', () => {
    expect(tokenize('"a\\"b"')[0].value).toBe('a"b')
  })

  it('负数字面量', () => {
    const tokens = tokenize('age < -5')
    expect(tokens[2]).toEqual({ type: TokenType.NUMBER, value: '-5' })
  })

  it('未闭合字符串抛错', () => {
    expect(() => tokenize("a == 'x")).toThrow()
  })

  it('单个 = 抛错', () => {
    expect(() => tokenize('a = 1')).toThrow()
  })

  it('算术运算符', () => {
    const tokens = tokenize('weight / (height * height)')
    expect(tokens.map(t => t.value)).toEqual([
      'weight',
      '/',
      '(',
      'height',
      '*',
      'height',
      ')'
    ])
    // 值token之后的 - 是二元减号而非负号
    const sub = tokenize('a - 5')
    expect(sub[1]).toEqual({ type: TokenType.OP, value: '-' })
    expect(sub[2]).toEqual({ type: TokenType.NUMBER, value: '5' })
    // 运算符之后的 - 仍是负号
    const neg = tokenize('a + -5')
    expect(neg[2]).toEqual({ type: TokenType.NUMBER, value: '-5' })
  })

  it('@self 保留字', () => {
    const tokens = tokenize("@self == '1'")
    expect(tokens[0]).toEqual({ type: TokenType.SELF, value: 'self' })
    expect(tokens[1]).toEqual({ type: TokenType.OP, value: '==' })
  })

  it('未知 @ 保留字抛错', () => {
    expect(() => tokenize('@foo == 1')).toThrow()
  })
})
