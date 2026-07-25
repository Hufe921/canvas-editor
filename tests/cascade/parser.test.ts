import { describe, it, expect } from 'vitest'
import { tokenize } from '@/editor/core/cascade/expression/tokenizer'
import { parse } from '@/editor/core/cascade/expression/parser'

const ast = (src: string) => parse(tokenize(src))

describe('表达式 parser', () => {
  it('getValue 比较表达式', () => {
    expect(ast("getValue('sex') == '1'")).toEqual({
      type: 'compare',
      op: '==',
      left: { type: 'getValue', target: { kind: 'id', value: 'sex' } },
      right: { type: 'literal', value: '1' }
    })
  })

  it('getValue(@self)', () => {
    expect(ast("getValue(@self) == '1'")).toEqual({
      type: 'compare',
      op: '==',
      left: { type: 'getValue', target: { kind: 'self' } },
      right: { type: 'literal', value: '1' }
    })
  })

  it('裸标识符抛错并引导 getValue', () => {
    expect(() => ast("sex == '1'")).toThrow(/getValue/)
  })

  it('@self 单独使用抛错', () => {
    expect(() => ast("@self == '1'")).toThrow(/getValue/)
  })

  it('getValue 参数校验', () => {
    expect(() => ast('getValue()')).toThrow()
    expect(() => ast('getValue(123)')).toThrow()
  })

  it('逻辑优先级：&& 高于 ||', () => {
    const node = ast(
      "getValue('a') == '1' || getValue('b') == '2' && getValue('c') == '3'"
    )
    expect(node.type).toBe('logical')
    expect(node).toMatchObject({
      op: '||',
      right: { type: 'logical', op: '&&' }
    })
  })

  it('括号改变优先级', () => {
    const node = ast(
      "(getValue('a') == '1' || getValue('b') == '2') && getValue('c') == '3'"
    )
    expect(node).toMatchObject({
      type: 'logical',
      op: '&&',
      left: { type: 'logical', op: '||' }
    })
  })

  it('not 运算', () => {
    expect(ast("!empty(getValue('x'))")).toMatchObject({
      type: 'not',
      argument: { type: 'call', name: 'empty' }
    })
  })

  it('in 与数组', () => {
    expect(ast("getValue('x') in ['a','b']")).toEqual({
      type: 'compare',
      op: 'in',
      left: { type: 'getValue', target: { kind: 'id', value: 'x' } },
      right: {
        type: 'literal',
        value: [
          { type: 'literal', value: 'a' },
          { type: 'literal', value: 'b' }
        ]
      }
    })
  })

  it('getValue 之间比较', () => {
    expect(ast("getValue('a') < getValue('b')")).toMatchObject({
      type: 'compare',
      left: { type: 'getValue', target: { kind: 'id', value: 'a' } },
      right: { type: 'getValue', target: { kind: 'id', value: 'b' } }
    })
  })

  it('算术优先级：乘除高于加减', () => {
    expect(ast("getValue('a') + getValue('b') * getValue('c')")).toEqual({
      type: 'arithmetic',
      op: '+',
      left: { type: 'getValue', target: { kind: 'id', value: 'a' } },
      right: {
        type: 'arithmetic',
        op: '*',
        left: { type: 'getValue', target: { kind: 'id', value: 'b' } },
        right: { type: 'getValue', target: { kind: 'id', value: 'c' } }
      }
    })
  })

  it('算术左结合与括号', () => {
    expect(ast("getValue('a') - getValue('b') - getValue('c')")).toMatchObject({
      type: 'arithmetic',
      op: '-',
      left: { type: 'arithmetic', op: '-' }
    })
    expect(
      ast("getValue('weight') / (getValue('height') * getValue('height'))")
    ).toMatchObject({
      type: 'arithmetic',
      op: '/',
      right: { type: 'arithmetic', op: '*' }
    })
  })

  it('算术结果参与比较', () => {
    expect(ast("getValue('a') + getValue('b') > 28")).toMatchObject({
      type: 'compare',
      op: '>',
      left: { type: 'arithmetic', op: '+' },
      right: { type: 'literal', value: 28 }
    })
  })

  it('语法错误抛错', () => {
    expect(() => ast("getValue('a') ==")).toThrow()
    expect(() => ast("(getValue('a') == '1'")).toThrow()
  })
})
