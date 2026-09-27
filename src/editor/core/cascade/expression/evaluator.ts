import { IAstNode } from './parser'

// 级联表达式求值器：AST + 控件值上下文 → 布尔（cascade 条件）或原始值（compute）
// 与编辑器解耦：控件值通过 IEvalContext 回调注入，纯函数可独立测试

// 控件值归一化结构（屏蔽各控件类型的取值差异）：
// select/radio → code；checkbox → codes 数组；text/number/date → text（isDate 标记日期语义）
export interface IResolvedValue {
  code?: string | null
  codes?: string[]
  text?: string | null
  isDate?: boolean
}

// 按 id（controlId 优先、conceptId 次之）解析控件值
export type ResolveIdentifier = (name: string) => IResolvedValue | undefined

export interface IEvalContext {
  resolve: ResolveIdentifier
  // getValue(@self)：规则/计算所在控件自身的值
  resolveSelf?: () => IResolvedValue | undefined
}

// 求值中间值：resolved 保留归一化结构（供 empty/contains 等函数区分类型），
// plain 是已求出的字面量/运算结果
type IEvalValue =
  | { kind: 'resolved'; value: IResolvedValue }
  | { kind: 'plain'; value: unknown }

const DATE_REG = /^\d{4}-\d{2}-\d{2}/

// 空值判定：checkbox 看数组长度；select/radio 看 code；文本看 trim 后是否为空
function isEmptyResolved(v: IResolvedValue): boolean {
  if (v.codes) return v.codes.length === 0
  if (v.code !== undefined) return !v.code
  return !v.text || !v.text.trim()
}

function toBoolean(v: IEvalValue): boolean {
  if (v.kind === 'resolved') return !isEmptyResolved(v.value)
  return Boolean(v.value)
}

// 提取可比较/可运算的原始值：resolved → string | number | null
// codes 数组退化为逗号拼接字符串（membership 判断请用 contains/in，不走这里）
function toPrimitive(v: IEvalValue): string | number | null {
  if (v.kind === 'plain') {
    const value = v.value
    if (value === null || value === undefined) return null
    if (typeof value === 'number' || typeof value === 'string') return value
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    return String(value)
  }
  const r = v.value
  if (r.codes) return r.codes.join(',')
  if (r.code !== undefined) return r.code
  return r.text ?? null
}

function toDateTimestamp(value: string | number | null): number | null {
  if (value === null) return null
  if (value === 'today') {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  }
  if (typeof value === 'string' && DATE_REG.test(value)) {
    const time = new Date(value).getTime()
    return Number.isNaN(time) ? null : time
  }
  return null
}

// 比较运算的类型推导（按优先级）：
// 1. in：右值必须是数组，左值 codes 任一命中或原始值命中
// 2. 日期：任一侧为日期语义（isDate / 'today' / 'YYYY-MM-DD'）→ 时间戳比较
// 3. 数值：两侧均可解析为有限数值 → 数值比较；仅一侧可解析 → false
// 4. 其余按字符串字典序比较
function compare(op: string, left: IEvalValue, right: IEvalValue): boolean {
  // in：右值为数组
  if (op === 'in') {
    const rightValue = right.kind === 'plain' ? right.value : null
    if (!Array.isArray(rightValue)) return false
    if (left.kind === 'resolved' && left.value.codes) {
      return left.value.codes.some(code =>
        rightValue.some(item => String(item) === code)
      )
    }
    const leftPrimitive = toPrimitive(left)
    return rightValue.some(item => String(item) === String(leftPrimitive))
  }
  const a = toPrimitive(left)
  const b = toPrimitive(right)
  if (op === '==') return String(a) === String(b)
  if (op === '!=') return String(a) !== String(b)
  if (a === null || b === null) return false
  // 日期比较：任一侧为日期语义
  const leftIsDate =
    (left.kind === 'resolved' && left.value.isDate) ||
    b === 'today' ||
    (typeof b === 'string' && DATE_REG.test(b))
  if (leftIsDate) {
    const timeA = toDateTimestamp(a)
    const timeB =
      typeof b === 'number' && Number.isFinite(b) ? b : toDateTimestamp(b)
    if (timeA === null || timeB === null) return false
    return compareNumber(op, timeA, timeB)
  }
  // 数值比较：两侧均可解析为有限数值
  const numA = Number(a)
  const numB = Number(b)
  const aNumeric = String(a).trim() !== '' && Number.isFinite(numA)
  const bNumeric = String(b).trim() !== '' && Number.isFinite(numB)
  if (aNumeric && bNumeric) {
    return compareNumber(op, numA, numB)
  }
  // 仅一侧为数值语义（如 'abc' > 60）：无法比较，按 false 处理
  if (aNumeric || bNumeric) return false
  // 字符串比较
  const strA = String(a)
  const strB = String(b)
  switch (op) {
    case '>':
      return strA > strB
    case '>=':
      return strA >= strB
    case '<':
      return strA < strB
    case '<=':
      return strA <= strB
    default:
      return false
  }
}

function compareNumber(op: string, a: number, b: number): boolean {
  switch (op) {
    case '>':
      return a > b
    case '>=':
      return a >= b
    case '<':
      return a < b
    case '<=':
      return a <= b
    default:
      return false
  }
}

// 算术运算：null 操作数、除零、非数值（非 +）均得 null；
// + 两侧均为数值语义时相加，否则按字符串拼接（如 '175' + 'cm'）
function arithmetic(
  op: string,
  a: string | number | null,
  b: string | number | null
): number | string | null {
  if (a === null || b === null) return null
  if (op === '+') {
    const strA = String(a)
    const strB = String(b)
    const numA = Number(a)
    const numB = Number(b)
    const bothNumeric =
      strA.trim() !== '' &&
      strB.trim() !== '' &&
      Number.isFinite(numA) &&
      Number.isFinite(numB)
    return bothNumeric ? numA + numB : strA + strB
  }
  const numA = Number(a)
  const numB = Number(b)
  if (!Number.isFinite(numA) || !Number.isFinite(numB)) return null
  switch (op) {
    case '-':
      return numA - numB
    case '*':
      return numA * numB
    case '/':
      return numB === 0 ? null : numA / numB
    case '%':
      return numB === 0 ? null : numA % numB
    default:
      return null
  }
}

function evalCall(name: string, args: IEvalValue[]): IEvalValue {
  const resolved = (index: number): IResolvedValue => {
    const arg = args[index]
    if (arg?.kind === 'resolved') return arg.value
    const primitive = arg ? toPrimitive(arg) : null
    return { text: primitive === null ? null : String(primitive) }
  }
  switch (name) {
    case 'empty':
      return { kind: 'plain', value: isEmptyResolved(resolved(0)) }
    case 'notEmpty':
      return { kind: 'plain', value: !isEmptyResolved(resolved(0)) }
    case 'len': {
      const r = resolved(0)
      return { kind: 'plain', value: (r.text ?? '').length }
    }
    case 'count': {
      const r = resolved(0)
      return { kind: 'plain', value: r.codes?.length ?? 0 }
    }
    case 'contains': {
      const r = resolved(0)
      const target = toPrimitive(args[1])
      if (target === null) return { kind: 'plain', value: false }
      if (r.codes) {
        return { kind: 'plain', value: r.codes.includes(String(target)) }
      }
      return {
        kind: 'plain',
        value: (r.text ?? '').includes(String(target))
      }
    }
    case 'round': {
      const primitive = toPrimitive(args[0])
      if (primitive === null) return { kind: 'plain', value: null }
      const num = Number(primitive)
      if (!Number.isFinite(num)) return { kind: 'plain', value: null }
      const digits = args[1] ? Number(toPrimitive(args[1])) : 0
      const factor = 10 ** (Number.isFinite(digits) ? digits : 0)
      return { kind: 'plain', value: Math.round(num * factor) / factor }
    }
    case 'floor':
    case 'ceil':
    case 'abs': {
      const primitive = toPrimitive(args[0])
      if (primitive === null) return { kind: 'plain', value: null }
      const num = Number(primitive)
      if (!Number.isFinite(num)) return { kind: 'plain', value: null }
      return {
        kind: 'plain',
        value:
          name === 'floor'
            ? Math.floor(num)
            : name === 'ceil'
              ? Math.ceil(num)
              : Math.abs(num)
      }
    }
    case 'min':
    case 'max': {
      const nums = args
        .map(a => Number(toPrimitive(a)))
        .filter(n => Number.isFinite(n))
      if (!nums.length) return { kind: 'plain', value: null }
      return {
        kind: 'plain',
        value: name === 'min' ? Math.min(...nums) : Math.max(...nums)
      }
    }
    case 'power': {
      const basePrimitive = toPrimitive(args[0])
      const expPrimitive = args[1] ? toPrimitive(args[1]) : null
      if (basePrimitive === null || expPrimitive === null) {
        return { kind: 'plain', value: null }
      }
      const base = Number(basePrimitive)
      const exp = Number(expPrimitive)
      if (!Number.isFinite(base) || !Number.isFinite(exp)) {
        return { kind: 'plain', value: null }
      }
      return { kind: 'plain', value: Math.pow(base, exp) }
    }
    case 'sqrt': {
      const primitive = toPrimitive(args[0])
      if (primitive === null) return { kind: 'plain', value: null }
      const num = Number(primitive)
      if (!Number.isFinite(num) || num < 0)
        return { kind: 'plain', value: null }
      return { kind: 'plain', value: Math.sqrt(num) }
    }
    case 'now': {
      return { kind: 'plain', value: Date.now() }
    }
    case 'datediff': {
      // datediff(end, start [, unit])，unit: d(默认)/h/m/s，任一日期非法返回 null
      const end = toDateTimestamp(toPrimitive(args[0]))
      const start = toDateTimestamp(toPrimitive(args[1]))
      if (end === null || start === null) {
        return { kind: 'plain', value: null }
      }
      const unit = args[2] ? String(toPrimitive(args[2])) : 'd'
      const divisor =
        unit === 'h'
          ? 3600 * 1000
          : unit === 'm'
            ? 60 * 1000
            : unit === 's'
              ? 1000
              : 24 * 3600 * 1000
      return { kind: 'plain', value: (end - start) / divisor }
    }
    default:
      throw new Error(`未知函数: ${name}`)
  }
}

function evalNode(node: IAstNode, context: IEvalContext): IEvalValue {
  switch (node.type) {
    case 'literal': {
      if (Array.isArray(node.value)) {
        // 数组成员为 AST 节点（见 parser）
        const list = (node.value as IAstNode[]).map(item =>
          toPrimitive(evalNode(item, context))
        )
        return { kind: 'plain', value: list }
      }
      return { kind: 'plain', value: node.value }
    }
    case 'getValue': {
      const value =
        node.target.kind === 'self'
          ? context.resolveSelf?.()
          : context.resolve(node.target.value)
      return { kind: 'resolved', value: value ?? { text: null } }
    }
    case 'logical': {
      if (node.op === '&&') {
        return {
          kind: 'plain',
          value:
            toBoolean(evalNode(node.left, context)) &&
            toBoolean(evalNode(node.right, context))
        }
      }
      return {
        kind: 'plain',
        value:
          toBoolean(evalNode(node.left, context)) ||
          toBoolean(evalNode(node.right, context))
      }
    }
    case 'not':
      return {
        kind: 'plain',
        value: !toBoolean(evalNode(node.argument, context))
      }
    case 'compare':
      return {
        kind: 'plain',
        value: compare(
          node.op,
          evalNode(node.left, context),
          evalNode(node.right, context)
        )
      }
    case 'arithmetic':
      return {
        kind: 'plain',
        value: arithmetic(
          node.op,
          toPrimitive(evalNode(node.left, context)),
          toPrimitive(evalNode(node.right, context))
        )
      }
    case 'call':
      // if(cond, a, b) 短路求值：只算命中分支，避免副作用与无效运算
      if (node.name === 'if') {
        const cond = node.args[0]
        const result = cond ? toBoolean(evalNode(cond, context)) : false
        const branch = node.args[result ? 1 : 2]
        return branch
          ? evalNode(branch, context)
          : { kind: 'plain', value: null }
      }
      return evalCall(
        node.name,
        node.args.map(arg => evalNode(arg, context))
      )
  }
}

export function evaluate(node: IAstNode, context: IEvalContext): boolean {
  return toBoolean(evalNode(node, context))
}

// 计算表达式（compute）求值：返回原始计算结果（数值/文本/null）
export function evaluateValue(
  node: IAstNode,
  context: IEvalContext
): string | number | null {
  return toPrimitive(evalNode(node, context))
}
