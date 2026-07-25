import { IToken, TokenType } from './tokenizer'

// 级联表达式语法分析：token 序列 → AST（递归下降）
// 文法（优先级从低到高）：
//   expression     := or
//   or             := and ( '||' and )*
//   and            := not ( '&&' not )*
//   not            := '!' not | compare
//   compare        := additive ( ('=='|'!='|'>'|'>='|'<'|'<='|'in') additive )?
//   additive       := multiplicative ( ('+'|'-') multiplicative )*
//   multiplicative := primary ( ('*'|'/'|'%') primary )*
//   primary        := 字面量 | 数组 | '(' expression ')' | getValue调用 | 函数调用
//   getValue调用   := 'getValue' '(' 字符串id | @self ')'  ← 取控件值的唯一入口

export type IAstNode =
  | { type: 'logical'; op: '&&' | '||'; left: IAstNode; right: IAstNode }
  | { type: 'not'; argument: IAstNode }
  | { type: 'compare'; op: string; left: IAstNode; right: IAstNode }
  | { type: 'arithmetic'; op: string; left: IAstNode; right: IAstNode }
  | { type: 'literal'; value: unknown }
  | {
      type: 'getValue'
      target: { kind: 'id'; value: string } | { kind: 'self' }
    }
  | { type: 'call'; name: string; args: IAstNode[] }

const COMPARE_OPS = ['==', '!=', '>', '>=', '<', '<=']
const ADDITIVE_OPS = ['+', '-']
const MULTIPLICATIVE_OPS = ['*', '/', '%']

export function parse(tokens: IToken[]): IAstNode {
  let pos = 0
  const peek = () => tokens[pos]
  const consume = () => tokens[pos++]
  const expect = (type: TokenType, value?: string) => {
    const token = consume()
    if (!token || token.type !== type || (value && token.value !== value)) {
      throw new Error(`表达式语法错误：期望 ${value || type}`)
    }
    return token
  }

  const parseExpression = (): IAstNode => parseOr()

  const parseOr = (): IAstNode => {
    let left = parseAnd()
    while (peek()?.type === TokenType.OP && peek().value === '||') {
      consume()
      left = { type: 'logical', op: '||', left, right: parseAnd() }
    }
    return left
  }

  const parseAnd = (): IAstNode => {
    let left = parseNot()
    while (peek()?.type === TokenType.OP && peek().value === '&&') {
      consume()
      left = { type: 'logical', op: '&&', left, right: parseNot() }
    }
    return left
  }

  const parseNot = (): IAstNode => {
    if (peek()?.type === TokenType.OP && peek().value === '!') {
      consume()
      return { type: 'not', argument: parseNot() }
    }
    return parseCompare()
  }

  const parseCompare = (): IAstNode => {
    const left = parseAdditive()
    const token = peek()
    if (
      (token?.type === TokenType.OP && COMPARE_OPS.includes(token.value)) ||
      (token?.type === TokenType.IDENT && token.value === 'in')
    ) {
      consume()
      return { type: 'compare', op: token.value, left, right: parseAdditive() }
    }
    return left
  }

  const parseAdditive = (): IAstNode => {
    let left = parseMultiplicative()
    while (
      peek()?.type === TokenType.OP &&
      ADDITIVE_OPS.includes(peek().value)
    ) {
      const op = consume().value
      left = { type: 'arithmetic', op, left, right: parseMultiplicative() }
    }
    return left
  }

  const parseMultiplicative = (): IAstNode => {
    let left = parsePrimary()
    while (
      peek()?.type === TokenType.OP &&
      MULTIPLICATIVE_OPS.includes(peek().value)
    ) {
      const op = consume().value
      left = { type: 'arithmetic', op, left, right: parsePrimary() }
    }
    return left
  }

  const parsePrimary = (): IAstNode => {
    const token = peek()
    if (!token) throw new Error('表达式意外结束')
    if (token.type === TokenType.SELF) {
      throw new Error('@self 仅可作为 getValue(@self) 的参数使用')
    }
    if (token.type === TokenType.STRING) {
      consume()
      return { type: 'literal', value: token.value }
    }
    if (token.type === TokenType.NUMBER) {
      consume()
      return { type: 'literal', value: Number(token.value) }
    }
    if (token.type === TokenType.BOOLEAN) {
      consume()
      return { type: 'literal', value: token.value === 'true' }
    }
    if (token.type === TokenType.NULL) {
      consume()
      return { type: 'literal', value: null }
    }
    if (token.type === TokenType.LBRACKET) {
      consume()
      const list: unknown[] = []
      if (peek()?.type !== TokenType.RBRACKET) {
        do {
          list.push(parsePrimary())
        } while (peek()?.type === TokenType.COMMA && (consume(), true))
      }
      expect(TokenType.RBRACKET)
      // 数组成员为 literal 节点数组，在 evaluate 时求值
      return { type: 'literal', value: list }
    }
    if (token.type === TokenType.LPAREN) {
      consume()
      const node = parseExpression()
      expect(TokenType.RPAREN)
      return node
    }
    if (token.type === TokenType.IDENT) {
      consume()
      if (peek()?.type === TokenType.LPAREN) {
        consume()
        // getValue 特殊形式：参数为控件 id 字符串或 @self
        if (token.value === 'getValue') {
          const arg = consume()
          if (!arg) throw new Error('getValue 缺少参数')
          let target
          if (arg.type === TokenType.STRING) {
            target = { kind: 'id', value: arg.value } as const
          } else if (arg.type === TokenType.SELF) {
            target = { kind: 'self' } as const
          } else {
            throw new Error('getValue 参数必须是控件 id 字符串或 @self')
          }
          expect(TokenType.RPAREN)
          return { type: 'getValue', target }
        }
        const args: IAstNode[] = []
        if (peek()?.type !== TokenType.RPAREN) {
          do {
            args.push(parseExpression())
          } while (peek()?.type === TokenType.COMMA && (consume(), true))
        }
        expect(TokenType.RPAREN)
        return { type: 'call', name: token.value, args }
      }
      throw new Error(
        `标识符 "${token.value}" 不能直接引用，` +
          `请使用 getValue('${token.value}') 获取控件值`
      )
    }
    throw new Error(`表达式语法错误：意外的 "${token.value}"`)
  }

  const node = parseExpression()
  if (pos < tokens.length) {
    throw new Error(`表达式存在多余内容: "${tokens[pos].value}"`)
  }
  return node
}
