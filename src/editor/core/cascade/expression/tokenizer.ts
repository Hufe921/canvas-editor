// 级联表达式（DSL）词法分析：把表达式字符串切分成 token 序列
// 语法示例：getValue('age') >= 60 && contains(getValue(@self), '1')
export enum TokenType {
  // 标识符：函数名（getValue/contains/...）与关键字 in
  // 注意：控件 id 不是标识符，取值一律走 getValue('id') 的字符串参数
  IDENT = 'IDENT',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',
  SELF = 'SELF',
  OP = 'OP',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',
  COMMA = 'COMMA'
}

export interface IToken {
  type: TokenType
  value: string
}

const TWO_CHAR_OPS = ['==', '!=', '>=', '<=', '&&', '||']
const ONE_CHAR_OPS = ['>', '<', '!', '+', '*', '/', '%']

const SIMPLE_TOKENS: Record<string, TokenType> = {
  '(': TokenType.LPAREN,
  ')': TokenType.RPAREN,
  '[': TokenType.LBRACKET,
  ']': TokenType.RBRACKET,
  ',': TokenType.COMMA
}

// 标识符允许中文（如函数名未来扩展、getValue 参数之外的场景）
const IDENT_START = /[A-Za-z_$\u4e00-\u9fa5]/
const IDENT_CHAR = /[A-Za-z0-9_$\u4e00-\u9fa5]/

export function tokenize(source: string): IToken[] {
  const tokens: IToken[] = []
  let i = 0
  // 负号与二元减号消歧：前一个 token 为运算符/左括号/逗号/起始时，
  // "-" 是负数符号（并入数字），否则是二元减号
  const lastAllowsNegative = () => {
    const last = tokens[tokens.length - 1]
    return (
      !last ||
      last.type === TokenType.OP ||
      last.type === TokenType.LPAREN ||
      last.type === TokenType.LBRACKET ||
      last.type === TokenType.COMMA
    )
  }
  while (i < source.length) {
    const c = source[i]
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++
      continue
    }
    const simpleType = SIMPLE_TOKENS[c]
    if (simpleType) {
      tokens.push({ type: simpleType, value: c })
      i++
      continue
    }
    // 字符串
    if (c === "'" || c === '"') {
      let j = i + 1
      let str = ''
      while (j < source.length && source[j] !== c) {
        if (source[j] === '\\' && j + 1 < source.length) {
          str += source[j + 1]
          j += 2
          continue
        }
        str += source[j]
        j++
      }
      if (j >= source.length) {
        throw new Error(`表达式字符串未闭合: ${source}`)
      }
      tokens.push({ type: TokenType.STRING, value: str })
      i = j + 1
      continue
    }
    // 数字（含负号：前一 token 为运算符/括号/逗号/起始时）
    const isNegativeSign =
      c === '-' && /\d/.test(source[i + 1] || '') && lastAllowsNegative()
    if (/\d/.test(c) || isNegativeSign) {
      let j = isNegativeSign ? i + 1 : i
      while (j < source.length && /[\d.]/.test(source[j])) j++
      tokens.push({ type: TokenType.NUMBER, value: source.slice(i, j) })
      i = j
      continue
    }
    // 值 token 之后的 "-" 是二元减号
    if (c === '-') {
      tokens.push({ type: TokenType.OP, value: c })
      i++
      continue
    }
    // @ 保留字（当前仅 @self）
    if (c === '@') {
      let j = i + 1
      while (j < source.length && IDENT_CHAR.test(source[j])) j++
      const word = source.slice(i + 1, j)
      if (word !== 'self') {
        throw new Error(`表达式未知保留字 "@${word}"，当前仅支持 @self`)
      }
      tokens.push({ type: TokenType.SELF, value: word })
      i = j
      continue
    }
    // 双字符运算符
    const two = source.slice(i, i + 2)
    if (TWO_CHAR_OPS.includes(two)) {
      tokens.push({ type: TokenType.OP, value: two })
      i += 2
      continue
    }
    // 单字符运算符
    if (ONE_CHAR_OPS.includes(c)) {
      tokens.push({ type: TokenType.OP, value: c })
      i++
      continue
    }
    if (c === '=' || c === '&' || c === '|') {
      throw new Error(`表达式非法运算符 "${c}"，请使用 == / && / ||`)
    }
    // 标识符 / 关键字
    if (IDENT_START.test(c)) {
      let j = i
      while (j < source.length && IDENT_CHAR.test(source[j])) j++
      const word = source.slice(i, j)
      if (word === 'true' || word === 'false') {
        tokens.push({ type: TokenType.BOOLEAN, value: word })
      } else if (word === 'null') {
        tokens.push({ type: TokenType.NULL, value: word })
      } else {
        tokens.push({ type: TokenType.IDENT, value: word })
      }
      i = j
      continue
    }
    throw new Error(`表达式无法识别的字符 "${c}"`)
  }
  return tokens
}
