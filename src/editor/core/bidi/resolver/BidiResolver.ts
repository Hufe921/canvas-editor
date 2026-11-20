import { TextDirection } from '../../../dataset/enum/TextDirection'
import { IBidiResult, IBidiTextItem, ResolvedTextDirection } from '../types'

type BidiClass =
  | 'L'
  | 'R'
  | 'AL'
  | 'EN'
  | 'AN'
  | 'ES'
  | 'ET'
  | 'CS'
  | 'NSM'
  | 'BN'
  | 'ON'
  | 'WS'
  | 'B'
  | 'S'
  | 'LRE'
  | 'RLE'
  | 'LRO'
  | 'RLO'
  | 'PDF'
  | 'LRI'
  | 'RLI'
  | 'FSI'
  | 'PDI'

type StrongDirection = 'L' | 'R'
type OverrideDirection = 'L' | 'R' | null

interface IExplicitState {
  level: number
  override: OverrideDirection
  isolate: boolean
}

interface ILevelRun {
  start: number
  end: number
  level: number
}

// Unicode 15.0 Bidi_Class=R / AL / ET。只编译范围，不依赖运行环境或三方包
const ARABIC_REG =
  /^[\u0608\u060B\u060D\u061B-\u064A\u066D-\u066F\u0671-\u06D5\u06E5-\u06E6\u06EE-\u06EF\u06FA-\u070D\u070F-\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u0860-\u086A\u0870-\u088E\u08A0-\u08C9\uFB50-\uFBC2\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFC\uFE70-\uFE74\uFE76-\uFEFC\u{10D00}-\u{10D23}\u{10F30}-\u{10F45}\u{10F51}-\u{10F59}\u{1EC71}-\u{1ECB4}\u{1ED01}-\u{1ED3D}\u{1EE00}-\u{1EE03}\u{1EE05}-\u{1EE1F}\u{1EE21}-\u{1EE22}\u{1EE24}\u{1EE27}\u{1EE29}-\u{1EE32}\u{1EE34}-\u{1EE37}\u{1EE39}\u{1EE3B}\u{1EE42}\u{1EE47}\u{1EE49}\u{1EE4B}\u{1EE4D}-\u{1EE4F}\u{1EE51}-\u{1EE52}\u{1EE54}\u{1EE57}\u{1EE59}\u{1EE5B}\u{1EE5D}\u{1EE5F}\u{1EE61}-\u{1EE62}\u{1EE64}\u{1EE67}-\u{1EE6A}\u{1EE6C}-\u{1EE72}\u{1EE74}-\u{1EE77}\u{1EE79}-\u{1EE7C}\u{1EE7E}\u{1EE80}-\u{1EE89}\u{1EE8B}-\u{1EE9B}\u{1EEA1}-\u{1EEA3}\u{1EEA5}-\u{1EEA9}\u{1EEAB}-\u{1EEBB}]/u
const RTL_REG =
  /^[\u05BE\u05C0\u05C3\u05C6\u05D0-\u05EA\u05EF-\u05F4\u07C0-\u07EA\u07F4-\u07F5\u07FA\u07FE-\u0815\u081A\u0824\u0828\u0830-\u083E\u0840-\u0858\u085E\u200F\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40-\uFB41\uFB43-\uFB44\uFB46-\uFB4F\u{10800}-\u{10805}\u{10808}\u{1080A}-\u{10835}\u{10837}-\u{10838}\u{1083C}\u{1083F}-\u{10855}\u{10857}-\u{1089E}\u{108A7}-\u{108AF}\u{108E0}-\u{108F2}\u{108F4}-\u{108F5}\u{108FB}-\u{1091B}\u{10920}-\u{10939}\u{1093F}\u{10980}-\u{109B7}\u{109BC}-\u{109CF}\u{109D2}-\u{10A00}\u{10A10}-\u{10A13}\u{10A15}-\u{10A17}\u{10A19}-\u{10A35}\u{10A40}-\u{10A48}\u{10A50}-\u{10A58}\u{10A60}-\u{10A9F}\u{10AC0}-\u{10AE4}\u{10AEB}-\u{10AF6}\u{10B00}-\u{10B35}\u{10B40}-\u{10B55}\u{10B58}-\u{10B72}\u{10B78}-\u{10B91}\u{10B99}-\u{10B9C}\u{10BA9}-\u{10BAF}\u{10C00}-\u{10C48}\u{10C80}-\u{10CB2}\u{10CC0}-\u{10CF2}\u{10CFA}-\u{10CFF}\u{10E80}-\u{10EA9}\u{10EAD}\u{10EB0}-\u{10EB1}\u{10F00}-\u{10F27}\u{10F70}-\u{10F81}\u{10F86}-\u{10F89}\u{10FB0}-\u{10FCB}\u{10FE0}-\u{10FF6}\u{1E800}-\u{1E8C4}\u{1E8C7}-\u{1E8CF}\u{1E900}-\u{1E943}\u{1E94B}\u{1E950}-\u{1E959}\u{1E95E}-\u{1E95F}]/u
const ARABIC_NUMBER_REG = /^[\u0660-\u0669\u06F0-\u06F9]/u
const EUROPEAN_NUMBER_REG = /^[0-9]/
const MARK_REG = /^\p{Mark}/u
const LETTER_REG = /^[\p{L}\p{Nl}]/u
const WHITE_SPACE_REG = /^\s/u
const ET_REG =
  /^[\u0023-\u0025\u00A2-\u00A5\u00B0-\u00B1\u058F\u0609-\u060A\u066A\u09F2-\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u2030-\u2034\u20A0-\u20C0\u212E\u2213\uA838-\uA839\uFE5F\uFE69-\uFE6A\uFF03-\uFF05\uFFE0-\uFFE1\uFFE5-\uFFE6\u{11FDD}-\u{11FE0}\u{1E2FF}]/u

const EXPLICIT_CLASS_MAP: Record<number, BidiClass> = {
  0x202a: 'LRE',
  0x202b: 'RLE',
  0x202c: 'PDF',
  0x202d: 'LRO',
  0x202e: 'RLO',
  0x2066: 'LRI',
  0x2067: 'RLI',
  0x2068: 'FSI',
  0x2069: 'PDI'
}

const BRACKET_PAIR_MAP = new Map<number, number>([
  [0x28, 0x29],
  [0x5b, 0x5d],
  [0x7b, 0x7d],
  [0xab, 0xbb],
  [0x2039, 0x203a],
  [0x2045, 0x2046],
  [0x207d, 0x207e],
  [0x208d, 0x208e],
  [0x2308, 0x2309],
  [0x230a, 0x230b],
  [0x2329, 0x232a],
  [0x2768, 0x2769],
  [0x276a, 0x276b],
  [0x276c, 0x276d],
  [0x276e, 0x276f],
  [0x2770, 0x2771],
  [0x2772, 0x2773],
  [0x2774, 0x2775],
  [0x27c5, 0x27c6],
  [0x27e6, 0x27e7],
  [0x27e8, 0x27e9],
  [0x27ea, 0x27eb],
  [0x27ec, 0x27ed],
  [0x27ee, 0x27ef],
  [0x2983, 0x2984],
  [0x2985, 0x2986],
  [0x2987, 0x2988],
  [0x2989, 0x298a],
  [0x298b, 0x298c],
  [0x298d, 0x298e],
  [0x298f, 0x2990],
  [0x2991, 0x2992],
  [0x2993, 0x2994],
  [0x2995, 0x2996],
  [0x2997, 0x2998],
  [0x29d8, 0x29d9],
  [0x29da, 0x29db],
  [0x29fc, 0x29fd],
  [0x2e02, 0x2e03],
  [0x2e04, 0x2e05],
  [0x2e09, 0x2e0a],
  [0x2e0c, 0x2e0d],
  [0x2e1c, 0x2e1d],
  [0x2e20, 0x2e21],
  [0x2e22, 0x2e23],
  [0x2e24, 0x2e25],
  [0x2e26, 0x2e27],
  [0x2e28, 0x2e29],
  [0x3008, 0x3009],
  [0x300a, 0x300b],
  [0x300c, 0x300d],
  [0x300e, 0x300f],
  [0x3010, 0x3011],
  [0x3014, 0x3015],
  [0x3016, 0x3017],
  [0x3018, 0x3019],
  [0x301a, 0x301b],
  [0x301d, 0x301e],
  [0xfe59, 0xfe5a],
  [0xfe5b, 0xfe5c],
  [0xfe5d, 0xfe5e],
  [0xff08, 0xff09],
  [0xff3b, 0xff3d],
  [0xff5b, 0xff5d],
  [0xff5f, 0xff60],
  [0xff62, 0xff63]
])
const CLOSING_BRACKET_SET = new Set(BRACKET_PAIR_MAP.values())

export class BidiResolver {
  public resolveDirection(
    text: string,
    direction: TextDirection
  ): ResolvedTextDirection {
    if (direction !== TextDirection.AUTO) return direction
    const strongDirection = this.getFirstStrongDirection(text)
    if (!strongDirection) return TextDirection.LTR
    return strongDirection === 'R' ? TextDirection.RTL : TextDirection.LTR
  }

  public resolve(
    items: IBidiTextItem[],
    direction: TextDirection,
    needVisualOrder = true
  ): IBidiResult {
    const text = items.map(item => item.value).join('')
    const resolvedDirection = this.resolveDirection(text, direction)
    const originalTypes = items.map(item => this.getBidiClass(item.value))
    const types = [...originalTypes]
    const levels = this.applyExplicitRules(types, text, resolvedDirection)
    const processingTypes = types.map(type => {
      if (this.isEmbeddingControl(type)) return 'BN'
      if (this.isIsolateControl(type)) return 'ON'
      return type
    })
    const runs = this.getLevelRuns(levels, originalTypes)
    const runSequences = this.getIsolatingRunSequences(types, runs)
    for (const sequence of runSequences) {
      const indexes = sequence
        .flatMap(run =>
          Array.from({ length: run.end - run.start }, (_, i) => run.start + i)
        )
        .filter(index => {
          const type = originalTypes[index]
          return type !== 'BN' && !this.isEmbeddingControl(type)
        })
      const firstRun = sequence[0]
      const lastRun = sequence[sequence.length - 1]
      const sos = this.getBoundaryDirection(
        firstRun.level,
        levels[firstRun.start - 1],
        resolvedDirection
      )
      const eos = this.getBoundaryDirection(
        lastRun.level,
        levels[lastRun.end],
        resolvedDirection
      )
      this.applyWeakRules(processingTypes, indexes, sos)
      this.applyBracketRules(items, processingTypes, indexes, firstRun.level)
      this.applyNeutralRules(processingTypes, indexes, firstRun.level, sos, eos)
    }
    this.applyImplicitRules(processingTypes, originalTypes, levels)
    this.applyLineResetRules(types, levels, resolvedDirection)
    return {
      direction: resolvedDirection,
      levels,
      // 文本测量只消费层级，跳过重排计算；布局和光标仍需要视觉顺序
      visualIndexes: needVisualOrder ? this.getVisualIndexes(levels) : []
    }
  }

  private getFirstStrongDirection(text: string): StrongDirection | null {
    let isolateDepth = 0
    for (const char of text) {
      const codePoint = char.codePointAt(0)!
      const type = EXPLICIT_CLASS_MAP[codePoint]
      if (type === 'LRI' || type === 'RLI' || type === 'FSI') {
        isolateDepth++
        continue
      }
      if (type === 'PDI') {
        if (isolateDepth) isolateDepth--
        continue
      }
      if (isolateDepth) continue
      const bidiClass = this.getBidiClass(char)
      if (bidiClass === 'L') return 'L'
      if (bidiClass === 'R' || bidiClass === 'AL') return 'R'
    }
    return null
  }

  private getIsolateText(text: string, start: number): string {
    let depth = 0
    let end = text.length
    for (let i = start; i < text.length; ) {
      const codePoint = text.codePointAt(i)!
      const type = EXPLICIT_CLASS_MAP[codePoint]
      if (this.isIsolateInitiator(type)) {
        depth++
      } else if (type === 'PDI') {
        if (depth) {
          depth--
        } else {
          end = i
          break
        }
      }
      i += codePoint > 0xffff ? 2 : 1
    }
    return text.slice(start, end)
  }

  private getBidiClass(value: string): BidiClass {
    const char = value.trimStart().charAt(0) || value.charAt(0)
    if (!char) return 'ON'
    const codePoint = char.codePointAt(0)!
    const explicitClass = EXPLICIT_CLASS_MAP[codePoint]
    if (explicitClass) return explicitClass
    if (char === '\n' || char === '\r') return 'B'
    if (char === '\t') return 'S'
    if (MARK_REG.test(char)) return 'NSM'
    if (ARABIC_NUMBER_REG.test(char)) return 'AN'
    if (EUROPEAN_NUMBER_REG.test(char)) return 'EN'
    if (ARABIC_REG.test(char)) return 'AL'
    if (RTL_REG.test(char)) return 'R'
    if (LETTER_REG.test(char)) return 'L'
    if (WHITE_SPACE_REG.test(char)) return 'WS'
    if (char === '+' || char === '-') return 'ES'
    if (char === ',' || char === '.' || char === '/' || char === ':') {
      return 'CS'
    }
    if (ET_REG.test(char)) return 'ET'
    if (/\p{Cc}/u.test(char)) return 'BN'
    return 'ON'
  }

  private applyExplicitRules(
    types: BidiClass[],
    text: string,
    direction: ResolvedTextDirection
  ): number[] {
    const baseLevel = direction === TextDirection.RTL ? 1 : 0
    const stack: IExplicitState[] = [
      { level: baseLevel, override: null, isolate: false }
    ]
    const levels = new Array<number>(types.length).fill(baseLevel)
    let overflowIsolateCount = 0
    let overflowEmbeddingCount = 0
    let validIsolateCount = 0
    for (let i = 0; i < types.length; i++) {
      const type = types[i]
      const state = stack[stack.length - 1]
      if (this.isIsolateInitiator(type)) {
        // 隔离控制符属于所在隔离区外层，忽略同层普通 embedding 状态
        const outerState = stack.findLast(item => item.isolate) || stack[0]
        levels[i] = outerState.level
        const isolateDirection =
          type === 'LRI'
            ? TextDirection.LTR
            : type === 'RLI'
              ? TextDirection.RTL
              : this.getFirstStrongDirection(
                    this.getIsolateText(text, i + 1)
                  ) === 'R'
                ? TextDirection.RTL
                : TextDirection.LTR
        const nextLevel = this.getNextIsolateLevel(
          outerState.level,
          isolateDirection
        )
        if (overflowIsolateCount || overflowEmbeddingCount || nextLevel > 125) {
          overflowIsolateCount++
        } else {
          validIsolateCount++
          overflowEmbeddingCount = 0
          stack.push({ level: nextLevel, override: null, isolate: true })
        }
        continue
      }
      if (type === 'PDI') {
        let isMatched = false
        if (overflowIsolateCount) {
          overflowIsolateCount--
        } else if (validIsolateCount) {
          overflowEmbeddingCount = 0
          while (!stack[stack.length - 1].isolate) stack.pop()
          stack.pop()
          validIsolateCount--
          isMatched = true
        }
        const outerState = stack.findLast(item => item.isolate) || stack[0]
        levels[i] = isMatched ? stack[stack.length - 1].level : outerState.level
        continue
      }
      if (type === 'PDF') {
        if (!overflowIsolateCount) {
          if (overflowEmbeddingCount) {
            overflowEmbeddingCount--
          } else if (stack.length > 1 && !state.isolate) {
            stack.pop()
          }
        }
        levels[i] = stack[stack.length - 1].level
        continue
      }
      if (this.isEmbeddingInitiator(type)) {
        levels[i] = state.level
        const isRtl = type === 'RLE' || type === 'RLO'
        const nextLevel = isRtl
          ? this.getLeastGreaterOdd(state.level)
          : this.getLeastGreaterEven(state.level)
        if (overflowIsolateCount || overflowEmbeddingCount || nextLevel > 125) {
          overflowEmbeddingCount++
        } else {
          stack.push({
            level: nextLevel,
            override: type === 'LRO' ? 'L' : type === 'RLO' ? 'R' : null,
            isolate: false
          })
        }
        continue
      }
      levels[i] = state.level
      if (
        !overflowIsolateCount &&
        !overflowEmbeddingCount &&
        state.override &&
        type !== 'B' &&
        type !== 'S' &&
        type !== 'WS'
      ) {
        types[i] = state.override
      }
    }
    return levels
  }

  private applyWeakRules(
    types: BidiClass[],
    indexes: number[],
    sos: StrongDirection
  ): void {
    // W4：非间距标记继承前一个字符类型，序列开头使用 sos
    for (let p = 0; p < indexes.length; p++) {
      const i = indexes[p]
      if (types[i] === 'NSM') {
        types[i] = p === 0 ? sos : types[indexes[p - 1]]
      }
    }
    let previousStrong: BidiClass = sos
    for (const i of indexes) {
      const type = types[i]
      if (type === 'EN' && previousStrong === 'AL') types[i] = 'AN'
      if (type === 'L' || type === 'R' || type === 'AL') previousStrong = type
    }
    for (let p = 0; p < indexes.length; p++) {
      const i = indexes[p]
      const previous = types[indexes[p - 1]]
      const next = types[indexes[p + 1]]
      if (types[i] === 'AL') types[i] = 'R'
      if (types[i] === 'ES' && previous === 'EN' && next === 'EN') {
        types[i] = 'EN'
      } else if (
        types[i] === 'CS' &&
        previous === next &&
        (previous === 'EN' || previous === 'AN')
      ) {
        types[i] = previous
      }
    }
    for (let p = 0; p < indexes.length; p++) {
      const i = indexes[p]
      if (types[i] !== 'ET') continue
      if (p > 0 && types[indexes[p - 1]] === 'EN') {
        types[i] = 'EN'
      } else {
        let end = p
        while (end < indexes.length && types[indexes[end]] === 'ET') end++
        if (end < indexes.length && types[indexes[end]] === 'EN') {
          for (let j = p; j < end; j++) types[indexes[j]] = 'EN'
        }
        p = end - 1
      }
    }
    for (const i of indexes) {
      if (types[i] === 'ES' || types[i] === 'CS') types[i] = 'ON'
    }
    previousStrong = sos
    for (const i of indexes) {
      const type = types[i]
      if (type === 'EN' && previousStrong === 'L') types[i] = 'L'
      if (type === 'L' || type === 'R') previousStrong = type
    }
  }

  private applyBracketRules(
    items: IBidiTextItem[],
    types: BidiClass[],
    indexes: number[],
    level: number
  ): void {
    const stack: number[] = []
    const pairs: Array<[number, number]> = []
    const positions = new Map<number, number>()
    indexes.forEach((index, position) => positions.set(index, position))
    for (const i of indexes) {
      if (types[i] !== 'ON') continue
      const char = items[i].value.charAt(0)
      const codePoint = char.codePointAt(0)!
      const closing = BRACKET_PAIR_MAP.get(codePoint)
      if (closing !== undefined) {
        // N0 算法最多跟踪 63 层嵌套，避免恶意深括号造成无界栈
        if (stack.length < 63) stack.push(i)
        continue
      }
      if (!CLOSING_BRACKET_SET.has(codePoint)) continue
      for (let s = stack.length - 1; s >= 0; s--) {
        const open = stack[s]
        const openCodePoint = items[open].value.charCodeAt(0)
        if (BRACKET_PAIR_MAP.get(openCodePoint) === codePoint) {
          pairs.push([open, i])
          stack.length = s
          break
        }
      }
    }
    const embeddingDirection: StrongDirection = level % 2 === 0 ? 'L' : 'R'
    const oppositeDirection: StrongDirection =
      embeddingDirection === 'L' ? 'R' : 'L'
    const getStrongDirection = (type: BidiClass): StrongDirection | null => {
      if (type === 'EN' || type === 'AN') return 'R'
      return type === 'L' || type === 'R' ? type : null
    }
    pairs.sort((a, b) => a[0] - b[0])
    for (const [open, close] of pairs.slice(0, 63)) {
      const openPosition = positions.get(open)!
      const closePosition = positions.get(close)!
      let direction: StrongDirection | null = null
      let hasOpposite = false
      for (let p = openPosition + 1; p < closePosition; p++) {
        const strongDirection = getStrongDirection(types[indexes[p]])
        if (strongDirection === embeddingDirection) {
          direction = embeddingDirection
          break
        }
        if (strongDirection === oppositeDirection) hasOpposite = true
      }
      // N0：反向内容还需满足括号前或后的最近非中性字符同为反向
      if (!direction && hasOpposite) {
        let before: StrongDirection | null = null
        for (let p = openPosition - 1; p >= 0; p--) {
          before = getStrongDirection(types[indexes[p]])
          if (before) break
        }
        let after: StrongDirection | null = null
        for (let p = closePosition + 1; p < indexes.length; p++) {
          after = getStrongDirection(types[indexes[p]])
          if (after) break
        }
        if (before === oppositeDirection || after === oppositeDirection) {
          direction = oppositeDirection
        }
      }
      if (!direction) continue
      types[open] = direction
      types[close] = direction
      // W4 已把 NSM 改成相邻类型，这里需依据原字符补回 N0 的传播规则
      for (let p = openPosition + 1; p < closePosition; p++) {
        const i = indexes[p]
        if (this.getBidiClass(items[i].value) !== 'NSM') break
        types[i] = direction
      }
      for (let p = closePosition + 1; p < indexes.length; p++) {
        const i = indexes[p]
        if (this.getBidiClass(items[i].value) !== 'NSM') break
        types[i] = direction
      }
    }
    for (let p = 0; p < indexes.length; p++) {
      const i = indexes[p]
      if (types[i] === 'NSM') {
        types[i] = p > 0 ? types[indexes[p - 1]] : embeddingDirection
      }
    }
  }

  private applyNeutralRules(
    types: BidiClass[],
    indexes: number[],
    level: number,
    sos: StrongDirection,
    eos: StrongDirection
  ): void {
    const paragraphType: StrongDirection = level % 2 === 0 ? 'L' : 'R'
    for (let p = 0; p < indexes.length; p++) {
      const i = indexes[p]
      if (!this.isNeutral(types[i])) continue
      let end = p
      while (end < indexes.length && this.isNeutral(types[indexes[end]])) end++
      let before = sos
      for (let j = p - 1; j >= 0; j--) {
        const type = types[indexes[j]]
        if (type === 'L' || type === 'R') {
          before = type
          break
        }
        if (type === 'EN' || type === 'AN') {
          before = 'R'
          break
        }
      }
      let after = eos
      for (let j = end; j < indexes.length; j++) {
        const type = types[indexes[j]]
        if (type === 'L' || type === 'R') {
          after = type
          break
        }
        if (type === 'EN' || type === 'AN') {
          after = 'R'
          break
        }
      }
      const direction = before === after ? before : paragraphType
      for (let j = p; j < end; j++) types[indexes[j]] = direction
      p = end - 1
    }
  }

  private applyImplicitRules(
    types: BidiClass[],
    originalTypes: BidiClass[],
    levels: number[]
  ): void {
    for (let i = 0; i < types.length; i++) {
      // 显式控制符的级别已由 X 规则确定，不能再参与隐式级别提升
      if (
        this.isEmbeddingControl(originalTypes[i]) ||
        this.isIsolateControl(originalTypes[i])
      ) {
        continue
      }
      const type = types[i]
      if (levels[i] % 2 === 0) {
        if (type === 'R') levels[i]++
        if (type === 'AN' || type === 'EN') levels[i] += 2
      } else if (type === 'L' || type === 'EN' || type === 'AN') {
        levels[i]++
      }
    }
  }

  private applyLineResetRules(
    types: BidiClass[],
    levels: number[],
    direction: ResolvedTextDirection
  ): void {
    const baseLevel = direction === TextDirection.RTL ? 1 : 0
    for (let i = 0; i < types.length; i++) {
      const type = types[i]
      if (type === 'B' || type === 'S') {
        levels[i] = baseLevel
        for (let j = i - 1; j >= 0 && types[j] === 'WS'; j--) {
          levels[j] = baseLevel
        }
      } else if (this.isIsolateControl(type)) {
        // L1 只重置隔离控制符相邻的空白，不修改控制符自身级别
        for (let j = i - 1; j >= 0 && types[j] === 'WS'; j--) {
          levels[j] = baseLevel
        }
        for (let j = i + 1; j < types.length && types[j] === 'WS'; j++) {
          levels[j] = baseLevel
        }
      }
    }
    for (let i = types.length - 1; i >= 0 && types[i] === 'WS'; i--) {
      levels[i] = baseLevel
    }
  }

  private getLevelRuns(
    levels: number[],
    originalTypes: BidiClass[]
  ): ILevelRun[] {
    const runs: ILevelRun[] = []
    const isRemoved = (index: number) => {
      const type = originalTypes[index]
      return type === 'BN' || this.isEmbeddingControl(type)
    }
    let start = 0
    while (start < levels.length) {
      while (start < levels.length && isRemoved(start)) start++
      if (start >= levels.length) break
      const level = levels[start]
      let end = start + 1
      // X9 字符不再参与后续规则，也不能把相邻的同级别 run 截断
      while (end < levels.length && (isRemoved(end) || levels[end] === level)) {
        end++
      }
      runs.push({ start, end, level })
      start = end
    }
    return runs
  }

  // BD13：隔离区前的 run 与匹配 PDI 后的 run 属于同一序列，弱类型和
  // 中性字符规则必须跨这两个非连续区间处理，不能在隔离控制符处截断
  private getIsolatingRunSequences(
    types: BidiClass[],
    runs: ILevelRun[]
  ): ILevelRun[][] {
    const links = new Map<number, number>()
    const linkedRuns = new Set<number>()
    for (let r = 0; r < runs.length; r++) {
      const run = runs[r]
      const isolateIndex = run.end - 1
      if (!this.isIsolateInitiator(types[isolateIndex])) continue
      let depth = 0
      for (let i = isolateIndex + 1; i < types.length; i++) {
        if (this.isIsolateInitiator(types[i])) {
          depth++
        } else if (types[i] === 'PDI') {
          if (depth) {
            depth--
            continue
          }
          const pdiRunIndex = runs.findIndex(
            candidate => candidate.start <= i && candidate.end > i
          )
          const nextRunIndex = pdiRunIndex + 1
          if (
            pdiRunIndex >= 0 &&
            nextRunIndex < runs.length &&
            runs[nextRunIndex].level === run.level
          ) {
            links.set(r, nextRunIndex)
            linkedRuns.add(nextRunIndex)
          }
          break
        }
      }
    }
    const sequences: ILevelRun[][] = []
    for (let r = 0; r < runs.length; r++) {
      if (linkedRuns.has(r)) continue
      const sequence = [runs[r]]
      let next = links.get(r)
      while (next !== undefined) {
        sequence.push(runs[next])
        next = links.get(next)
      }
      sequences.push(sequence)
    }
    return sequences
  }

  private getBoundaryDirection(
    level: number,
    adjacentLevel: number | undefined,
    direction: ResolvedTextDirection
  ): StrongDirection {
    const baseLevel = direction === TextDirection.RTL ? 1 : 0
    return Math.max(level, adjacentLevel ?? baseLevel) % 2 === 0 ? 'L' : 'R'
  }

  private getLeastGreaterOdd(level: number): number {
    return level % 2 === 0 ? level + 1 : level + 2
  }

  private getLeastGreaterEven(level: number): number {
    return level % 2 === 0 ? level + 2 : level + 1
  }

  private getNextIsolateLevel(
    level: number,
    direction: ResolvedTextDirection
  ): number {
    return direction === TextDirection.RTL
      ? this.getLeastGreaterOdd(level)
      : this.getLeastGreaterEven(level)
  }

  private isEmbeddingInitiator(type: BidiClass): boolean {
    return type === 'LRE' || type === 'RLE' || type === 'LRO' || type === 'RLO'
  }

  private isEmbeddingControl(type: BidiClass): boolean {
    return this.isEmbeddingInitiator(type) || type === 'PDF'
  }

  private isIsolateInitiator(type: BidiClass): boolean {
    return type === 'LRI' || type === 'RLI' || type === 'FSI'
  }

  private isIsolateControl(type: BidiClass): boolean {
    return this.isIsolateInitiator(type) || type === 'PDI'
  }

  private isNeutral(type: BidiClass): boolean {
    return (
      type === 'ON' ||
      type === 'WS' ||
      type === 'BN' ||
      type === 'B' ||
      type === 'S' ||
      type === 'ES' ||
      type === 'CS' ||
      type === 'ET' ||
      type === 'NSM'
    )
  }

  private getVisualIndexes(levels: number[]): number[] {
    const indexes = levels.map((_, index) => index)
    let maxLevel = 0
    let minOddLevel = Infinity
    for (const level of levels) {
      if (level > maxLevel) maxLevel = level
      if (level % 2 === 1 && level < minOddLevel) minOddLevel = level
    }
    if (!Number.isFinite(minOddLevel)) return indexes
    for (let level = maxLevel; level >= minOddLevel; level--) {
      let start = 0
      while (start < levels.length) {
        while (start < levels.length && levels[start] < level) start++
        if (start >= levels.length) break
        let end = start
        while (end < levels.length && levels[end] >= level) end++
        for (let left = start, right = end - 1; left < right; left++, right--) {
          ;[indexes[left], indexes[right]] = [indexes[right], indexes[left]]
        }
        start = end
      }
    }
    return indexes
  }
}
