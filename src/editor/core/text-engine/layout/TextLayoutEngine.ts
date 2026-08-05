import { BidiResolver } from '../bidi/BidiResolver'
import { ITextShaper } from '../shape/ITextShaper'
import { TextScript } from '../../../dataset/enum/TextScript'
import {
  containsShapingScript,
  detectScript
} from '../utils/scriptFont'
import {
  LayoutLine,
  LayoutParagraphInput,
  LayoutResult,
  ResolvedDirection,
  ShapedGlyph,
  StyleRun,
  TextSpan,
  TextStyleProps
} from '../types'

const TATWEEL = '\u0640'

export class TextLayoutEngine {
  constructor(
    private bidi: BidiResolver,
    private shaper: ITextShaper
  ) {}

  /**
   * Layout a paragraph. For justified Arabic lines with leftover space, insert
   * kashida (TATWEEL) and re-layout once so the strokes are part of the text.
   */
  layoutParagraph(input: LayoutParagraphInput): LayoutResult {
    const natural = this.layoutPass(input)
    const kashidaInput = this.buildKashidaInput(input, natural)
    const result = kashidaInput ? this.layoutPass(kashidaInput) : natural
    this.applyAlignment(
      result.lines,
      input.align,
      input.availableWidth,
      result.paragraphText
    )
    return result
  }

  private layoutPass(input: LayoutParagraphInput): LayoutResult {
    const {
      spans,
      availableWidth,
      direction,
      lineHeight,
      wordBreak = 'break-word'
    } = input
    const paragraphText = spans.map(s => s.text).join('')
    const offsetToLogical = this.buildOffsetMap(spans)
    // 兼容旧调用：只传 lineHeight 时用首 span 字号反推系数
    const refFontSize = spans[0]?.style.fontSize || 0
    const lineHeightFactor =
      input.lineHeightFactor ??
      (refFontSize > 0 ? lineHeight / refFontSize : 1.5)

    const levelRuns = this.bidi.getLevelRuns(paragraphText, direction)
    const styleRuns = this.splitStyleRuns(
      paragraphText,
      levelRuns,
      spans,
      offsetToLogical
    )
    // 颜色不参与整形边界：阿语等连写脚本跨颜色仍整段 HB，避免连字被拆断
    const shapeRuns = this.mergeRunsForShaping(styleRuns)

    // Shape by (level × shape-style) so HB gets correct run direction; keep logical order
    const logicalGlyphs = shapeRuns
      .flatMap(run => this.shaper.shape(run))
      .sort(
        (a, b) =>
          a.charStart - b.charStart || a.logicalIndexStart - b.logicalIndexStart
      )
    this.applySpanPaintStyles(logicalGlyphs, spans)
    this.applyScriptShifts(logicalGlyphs)

    // 逻辑序断行（词优先）；视觉重排仅作用于行内
    const lines = this.breakLines(
      logicalGlyphs,
      availableWidth,
      direction,
      lineHeight,
      lineHeightFactor,
      offsetToLogical,
      paragraphText,
      wordBreak
    )
    for (const line of lines) {
      line.glyphs = this.reorderLineVisual(
        line.glyphs,
        paragraphText,
        direction
      )
      this.assignGlyphX(line.glyphs)
      line.width = line.glyphs.length
        ? line.glyphs[line.glyphs.length - 1].right
        : 0
      if (line.glyphs.length) {
        line.textStart = Math.min(...line.glyphs.map(g => g.charStart))
        line.textEnd = Math.max(...line.glyphs.map(g => g.charEnd))
        line.logicalStart = offsetToLogical(line.textStart)
        line.logicalEnd = offsetToLogical(
          Math.max(line.textStart, line.textEnd - 1)
        )
      }
    }
    return { lines, direction, paragraphText }
  }

  /** 阿拉伯字母（不含 TATWEEL、变音符号、数字、标点） */
  private isArabicLetter(ch: string): boolean {
    return /^[\u0621-\u063A\u0641-\u064A\u0671-\u06D3\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]$/u.test(
      ch
    )
  }

  /** 行内可插入 kashida 的逻辑偏移：位于两个相邻阿语字母之间 */
  private kashidaPoints(
    text: string,
    start: number,
    end: number
  ): number[] {
    const points: number[] = []
    for (let o = start; o < end - 1; o++) {
      if (this.isArabicLetter(text[o]) && this.isArabicLetter(text[o + 1])) {
        points.push(o + 1)
      }
    }
    return points
  }

  private measureTatweel(
    style: TextStyleProps,
    direction: ResolvedDirection
  ): number {
    const run: StyleRun = {
      text: TATWEEL,
      direction,
      style,
      textStart: 0,
      textEnd: 1,
      logicalIndexAt: () => 0
    }
    return this.shaper
      .shape(run)
      .reduce((m, g) => m + Math.max(g.ax, 0), 0)
  }

  /**
   * Build a re-layout input with kashida (TATWEEL) inserted into justified
   * Arabic lines that have leftover space. Returns null when no kashida is
   * needed, leaving justify to the space-stretch path.
   */
  private buildKashidaInput(
    input: LayoutParagraphInput,
    result: LayoutResult
  ): LayoutParagraphInput | null {
    const { spans, availableWidth, align } = input
    const paragraphText = result.paragraphText
    const insertions = new Map<number, number>()
    let changed = false
    for (let i = 0; i < result.lines.length; i++) {
      const line = result.lines[i]
      // 段末行不参与 kashida 拉伸（与两端对齐惯例一致，单行段也不拉）
      const isLast = i === result.lines.length - 1
      const shouldJustify =
        !isLast &&
        (align === 'justify' || (align === 'alignment'))
      if (!shouldJustify) continue
      const extra = availableWidth - line.width
      if (extra <= 0.5) continue
      const arabicGlyph = line.glyphs.find(g =>
        containsShapingScript(paragraphText.slice(g.charStart, g.charEnd))
      )
      if (!arabicGlyph) continue
      const points = this.kashidaPoints(
        paragraphText,
        line.textStart,
        line.textEnd
      )
      if (!points.length) continue
      const advance = this.measureTatweel(
        arabicGlyph.style,
        line.direction
      )
      if (advance <= 0) continue
      const count = Math.min(
        points.length,
        Math.max(1, Math.round(extra / advance))
      )
      for (let k = 0; k < count; k++) {
        const off = points[k]
        insertions.set(off, (insertions.get(off) || 0) + 1)
      }
      changed = true
    }
    if (!changed) return null
    return {
      ...input,
      spans: this.insertTatweel(spans, insertions)
    }
  }

  /** Splice TATWEEL into spans; kashida chars inherit the preceding letter. */
  private insertTatweel(
    spans: TextSpan[],
    insertions: Map<number, number>
  ): TextSpan[] {
    const result: TextSpan[] = []
    let offset = 0
    for (const span of spans) {
      const spanStart = offset
      const spanEnd = offset + span.text.length
      offset = spanEnd
      const local: Array<{ at: number; count: number }> = []
      for (const [charOffset, count] of insertions) {
        if (charOffset >= spanStart && charOffset <= spanEnd) {
          local.push({ at: charOffset - spanStart, count })
        }
      }
      if (!local.length) {
        result.push(span)
        continue
      }
      local.sort((a, b) => a.at - b.at)
      let text = span.text
      const indices = span.logicalIndices
        ? [...span.logicalIndices]
        : text.split('').map(() => span.logicalIndex)
      for (const { at, count } of local) {
        const logicalBefore =
          at > 0 ? indices[at - 1] : indices.length ? indices[0] : span.logicalIndex
        text =
          text.slice(0, at) +
          TATWEEL.repeat(count) +
          text.slice(at)
        indices.splice(at, 0, ...new Array<number>(count).fill(logicalBefore))
      }
      result.push({ ...span, text, logicalIndices: indices })
    }
    return result
  }

  private buildOffsetMap(spans: TextSpan[]): (offset: number) => number {
    const table: number[] = []
    for (const span of spans) {
      const indices = span.logicalIndices
      if (indices && indices.length === span.text.length) {
        for (let i = 0; i < span.text.length; i++) {
          table.push(indices[i])
        }
      } else {
        // 同一 IElement 可含多码元（如 Segmenter 得到的 नमस्ते）：
        // 绝不能 logicalIndex+i，否则会占掉后续元素导致行重叠
        for (let i = 0; i < span.text.length; i++) {
          table.push(span.logicalIndex)
        }
      }
    }
    return (offset: number) =>
      table[Math.min(Math.max(offset, 0), table.length - 1)] ?? 0
  }

  private splitStyleRuns(
    paragraphText: string,
    levelRuns: ReturnType<BidiResolver['getLevelRuns']>,
    spans: TextSpan[],
    offsetToLogical: (o: number) => number
  ): StyleRun[] {
    const styleRuns: StyleRun[] = []
    // Build style boundaries from spans
    let offset = 0
    const spanRanges = spans.map(span => {
      const start = offset
      offset += span.text.length
      return { start, end: offset, span }
    })

    for (const lr of levelRuns) {
      for (const sr of spanRanges) {
        const start = Math.max(lr.start, sr.start)
        const end = Math.min(lr.end, sr.end)
        if (start >= end) continue
        const text = paragraphText.slice(start, end)
        styleRuns.push({
          text,
          direction: lr.direction,
          style: sr.span.style,
          textStart: start,
          textEnd: end,
          logicalIndexAt: (paraOffset: number) => offsetToLogical(paraOffset)
        })
      }
    }
    return styleRuns
  }

  /** 影响字形度量的样式；color 等仅绘制属性可跨 run 合并 */
  private sameShapeStyle(a: StyleRun, b: StyleRun): boolean {
    if (a.direction !== b.direction) return false
    if (a.textEnd !== b.textStart) return false
    // 拉丁等与阿/印地/泰不可合并，否则前缀宽与分段 fillText 不一致，选区偏短
    if (containsShapingScript(a.text) !== containsShapingScript(b.text)) {
      return false
    }
    const sa = a.style
    const sb = b.style
    // Object slots never merge with text or other objects
    if (sa.objectWidth != null || sb.objectWidth != null) return false
    return (
      sa.fontFamily === sb.fontFamily &&
      sa.fontSize === sb.fontSize &&
      !!sa.bold === !!sb.bold &&
      !!sa.italic === !!sb.italic &&
      (sa.letterSpacing || 0) === (sb.letterSpacing || 0) &&
      (sa.scriptShift || '') === (sb.scriptShift || '')
    )
  }

  private mergeRunsForShaping(runs: StyleRun[]): StyleRun[] {
    if (runs.length <= 1) return runs
    const merged: StyleRun[] = []
    for (const run of runs) {
      const last = merged[merged.length - 1]
      if (last && this.sameShapeStyle(last, run)) {
        last.text += run.text
        last.textEnd = run.textEnd
      } else {
        merged.push({
          ...run,
          style: { ...run.style }
        })
      }
    }
    return merged
  }

  /** 整形后按原 span 回写颜色等绘制样式 */
  private applySpanPaintStyles(glyphs: ShapedGlyph[], spans: TextSpan[]) {
    if (!glyphs.length || !spans.length) return
    const colorAt: Array<string | undefined> = []
    const shiftAt: Array<TextStyleProps['scriptShift']> = []
    for (const span of spans) {
      for (let i = 0; i < span.text.length; i++) {
        colorAt.push(span.style.color)
        shiftAt.push(span.style.scriptShift)
      }
    }
    for (const g of glyphs) {
      const color = colorAt[g.charStart]
      const scriptShift = shiftAt[g.charStart]
      const nextColor =
        color !== undefined && color !== g.style.color ? color : g.style.color
      const nextShift =
        scriptShift !== g.style.scriptShift ? scriptShift : g.style.scriptShift
      if (nextColor !== g.style.color || nextShift !== g.style.scriptShift) {
        g.style = {
          ...g.style,
          color: nextColor,
          scriptShift: nextShift
        }
      }
    }
  }

  /**
   * 上下标垂直偏移：相对行基线上下各半个绘制字号，与段落 LTR/RTL 无关。
   * 水平位置仍由 bidi / visualLeft 决定。
   */
  private applyScriptShifts(glyphs: ShapedGlyph[]) {
    for (const g of glyphs) {
      const fs = g.style.fontSize || 0
      if (g.style.scriptShift === 'super') {
        g.baselineShift = -fs / 2
      } else if (g.style.scriptShift === 'sub') {
        g.baselineShift = fs / 2
      } else {
        g.baselineShift = 0
      }
    }
  }

  /**
   * Reorder a line's glyphs into visual order for the line substring.
   * Line breaking must stay logical; only placement uses visual order.
   */
  private reorderLineVisual(
    glyphs: ShapedGlyph[],
    paragraphText: string,
    direction: ResolvedDirection
  ): ShapedGlyph[] {
    if (glyphs.length <= 1) return glyphs
    const lineStart = Math.min(...glyphs.map(g => g.charStart))
    const lineEnd = Math.max(...glyphs.map(g => g.charEnd))
    const lineText = paragraphText.slice(lineStart, lineEnd)
    if (!lineText.length) return glyphs
    const visualIndices = this.bidi.getVisualIndices(lineText, direction)
    const rank = new Map<number, number>()
    for (let v = 0; v < visualIndices.length; v++) {
      const logicalOffset = lineStart + visualIndices[v]
      if (!rank.has(logicalOffset)) rank.set(logicalOffset, v)
    }
    return [...glyphs].sort((a, b) => {
      const ra = rank.get(a.charStart) ?? a.charStart
      const rb = rank.get(b.charStart) ?? b.charStart
      return ra - rb
    })
  }

  /** 按行内最大字号计算行盒，避免局部放大后行高不变重叠 */
  private measureLineBox(
    glyphs: ShapedGlyph[],
    lineHeight: number,
    lineHeightFactor: number
  ): { height: number; ascent: number; descent: number } {
    // 上下标 fontSize 已是 0.6*原字号，行盒按名义字号估，避免整行被压矮
    const maxFontSize = glyphs.reduce((m, g) => {
      const fs = g.style.fontSize || 0
      const nominal = g.style.scriptShift ? fs / 0.6 : fs
      return Math.max(m, nominal)
    }, 0)
    const baseHeight =
      maxFontSize > 0 ? maxFontSize * lineHeightFactor : lineHeight
    let ascent = baseHeight * 0.8
    let descent = baseHeight * 0.2
    for (const g of glyphs) {
      const fs = g.style.fontSize || 0
      const shift = Math.abs(g.baselineShift ?? 0) || fs / 2
      if (g.style.scriptShift === 'super') {
        ascent = Math.max(ascent, baseHeight * 0.8 + shift)
      } else if (g.style.scriptShift === 'sub') {
        descent = Math.max(descent, baseHeight * 0.2 + shift)
      }
      // 行内图/公式：抬高 ascent，与 legacy「底对齐基线」一致
      const objectHeight = g.style.objectHeight
      if (objectHeight != null && objectHeight > 0) {
        ascent = Math.max(ascent, objectHeight)
      }
    }
    return {
      height: Math.max(baseHeight, ascent + descent),
      ascent,
      descent
    }
  }

  private breakLines(
    glyphs: ShapedGlyph[],
    availableWidth: number,
    direction: ResolvedDirection,
    lineHeight: number,
    lineHeightFactor: number,
    offsetToLogical: (o: number) => number,
    paragraphText: string,
    wordBreak: 'break-word' | 'break-all'
  ): LayoutLine[] {
    const lines: LayoutLine[] = []
    if (!glyphs.length) {
      return [
        {
          glyphs: [],
          width: 0,
          height: lineHeight,
          ascent: lineHeight * 0.8,
          descent: lineHeight * 0.2,
          textStart: 0,
          textEnd: 0,
          logicalStart: 0,
          logicalEnd: 0,
          direction,
          shiftX: 0
        }
      ]
    }

    let lineGlyphs: ShapedGlyph[] = []
    let lineWidth = 0
    const flush = () => {
      if (!lineGlyphs.length) return
      // 行尾空白可留在行末；行首空白在新行丢弃由调用方处理
      const textStart = lineGlyphs[0].charStart
      const textEnd = lineGlyphs[lineGlyphs.length - 1].charEnd
      const box = this.measureLineBox(
        lineGlyphs,
        lineHeight,
        lineHeightFactor
      )
      lines.push({
        glyphs: lineGlyphs,
        width: lineWidth,
        height: box.height,
        ascent: box.ascent,
        descent: box.descent,
        textStart,
        textEnd,
        logicalStart: offsetToLogical(textStart),
        logicalEnd: offsetToLogical(Math.max(textStart, textEnd - 1)),
        direction,
        shiftX: 0
      })
      lineGlyphs = []
      lineWidth = 0
    }

    const appendGlyph = (g: ShapedGlyph) => {
      const adv = Math.max(g.ax, 0)
      if (lineWidth + adv > availableWidth && lineGlyphs.length) {
        flush()
      }
      lineGlyphs.push({ ...g })
      lineWidth += adv
    }

    if (wordBreak === 'break-all') {
      for (const g of glyphs) appendGlyph(g)
      flush()
      return lines
    }

    // break-word：按空格/词/CJK 单元装箱，避免 Hello、مرحبا 被从中间切断
    const units = this.buildWrapUnits(glyphs, paragraphText)
    for (const unit of units) {
      if (lineWidth + unit.width > availableWidth && lineGlyphs.length) {
        flush()
        // 新行丢弃前导空白
        if (unit.isSpaceOnly) continue
      }
      if (unit.width > availableWidth && !lineGlyphs.length) {
        // 单词本身宽于行宽：回退为硬切
        for (const g of unit.glyphs) appendGlyph(g)
        continue
      }
      for (const g of unit.glyphs) {
        lineGlyphs.push({ ...g })
      }
      lineWidth += unit.width
    }
    flush()
    return lines
  }

  /**
   * 换行单元：空格串 | 西文/阿语词(+尾标点) | 单字 CJK(+尾标点) | 其它单字素
   */
  private buildWrapUnits(
    glyphs: ShapedGlyph[],
    text: string
  ): Array<{ glyphs: ShapedGlyph[]; width: number; isSpaceOnly: boolean }> {
    type Unit = { glyphs: ShapedGlyph[]; width: number; isSpaceOnly: boolean }
    const units: Unit[] = []
    let i = 0
    const glyphChar = (g: ShapedGlyph) => text.slice(g.charStart, g.charEnd)

    while (i < glyphs.length) {
      const ch = glyphChar(glyphs[i])
      // 空白
      if (this.isSpaceChar(ch)) {
        const gs: ShapedGlyph[] = []
        let width = 0
        while (i < glyphs.length && this.isSpaceChar(glyphChar(glyphs[i]))) {
          const g = glyphs[i]
          gs.push({ ...g })
          width += Math.max(g.ax, 0)
          i++
        }
        units.push({ glyphs: gs, width, isSpaceOnly: true })
        continue
      }
      // CJK：可在字间断，尾随标点粘在字后
      if (this.isCjkChar(ch)) {
        const gs: ShapedGlyph[] = [{ ...glyphs[i] }]
        let width = Math.max(glyphs[i].ax, 0)
        i++
        while (i < glyphs.length && this.isGluePunct(glyphChar(glyphs[i]))) {
          const g = glyphs[i]
          gs.push({ ...g })
          width += Math.max(g.ax, 0)
          i++
        }
        units.push({ glyphs: gs, width, isSpaceOnly: false })
        continue
      }
      // 词：拉丁/阿语/希伯来/数字等，尾随标点粘连
      if (this.isWordChar(ch)) {
        const gs: ShapedGlyph[] = []
        let width = 0
        while (i < glyphs.length && this.isWordChar(glyphChar(glyphs[i]))) {
          const g = glyphs[i]
          gs.push({ ...g })
          width += Math.max(g.ax, 0)
          i++
        }
        while (i < glyphs.length && this.isGluePunct(glyphChar(glyphs[i]))) {
          const g = glyphs[i]
          gs.push({ ...g })
          width += Math.max(g.ax, 0)
          i++
        }
        units.push({ glyphs: gs, width, isSpaceOnly: false })
        continue
      }
      // 其它
      units.push({
        glyphs: [{ ...glyphs[i] }],
        width: Math.max(glyphs[i].ax, 0),
        isSpaceOnly: false
      })
      i++
    }
    return units
  }

  private isSpaceChar(ch: string): boolean {
    return !!ch && /^\s+$/u.test(ch)
  }

  /** 拉丁/西里尔/希腊/阿语/希伯来/Indic/泰/数字等应整词不断开 */
  private isWordChar(ch: string): boolean {
    if (!ch || this.isSpaceChar(ch) || this.isCjkChar(ch)) return false
    if (/^[0-9_]$/.test(ch)) return true
    const script = detectScript(ch)
    return (
      script === TextScript.LATN ||
      script === TextScript.CYRL ||
      script === TextScript.GREK ||
      script === TextScript.ARAB ||
      script === TextScript.HEBR ||
      containsShapingScript(ch)
    )
  }

  private isCjkChar(ch: string): boolean {
    if (!ch) return false
    return /[\u3000-\u303F\u3040-\u30FF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/u.test(
      ch
    )
  }

  /** 粘在词/字后的收尾标点（与 legacy measurePunctuation 意图一致） */
  private isGluePunct(ch: string): boolean {
    if (!ch || this.isSpaceChar(ch)) return false
    // 含阿语标点 ، ؛ ؟ 避免与词拆成独立单元后换行观感异常
    return /^[,.;:!?…，。、；：？！）】》」』%\u00b0'"”’)،؛؟]$/.test(ch)
  }

  private assignGlyphX(glyphs: ShapedGlyph[]) {
    // left/right = pen box（单调递增）；dx 仅绘制时叠加，避免阿语 mark 负 dx 叠成「折叠」
    let x = 0
    for (const g of glyphs) {
      const adv = Math.max(g.ax, 0)
      g.left = x
      g.right = x + adv
      x += adv
    }
  }

  private applyAlignment(
    lines: LayoutLine[],
    align: LayoutParagraphInput['align'],
    availableWidth: number,
    paragraphText: string
  ) {
    const isLast = (i: number) => i === lines.length - 1
    // 分散对齐：所有行拉伸；两端对齐：仅非末行（与 legacy Draw 一致）
    const shouldJustify = (i: number) =>
      align === 'justify' || (align === 'alignment' && !isLast(i))

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (shouldJustify(i) && line.glyphs.length > 1) {
        const extra = availableWidth - line.width
        if (extra > 0.5) {
          // 优先拉伸词间空格，避免在连写阿语/拉丁词内部拉出断口
          const spaceSet = new Set<number>()
          line.glyphs.forEach((g, idx) => {
            if (this.isSpaceChar(paragraphText.slice(g.charStart, g.charEnd))) {
              spaceSet.add(idx)
            }
          })
          if (spaceSet.size) {
            const per = extra / spaceSet.size
            let x = 0
            for (let g = 0; g < line.glyphs.length; g++) {
              const glyph = line.glyphs[g]
              const adv = Math.max(glyph.ax, 0)
              glyph.left = x
              glyph.right = x + adv
              x += adv + (spaceSet.has(g) ? per : 0)
            }
            line.width = availableWidth
            line.shiftX = 0
            continue
          }
          const gaps = line.glyphs.length - 1
          const each = extra / gaps
          let x = 0
          for (let g = 0; g < line.glyphs.length; g++) {
            const glyph = line.glyphs[g]
            const adv = Math.max(glyph.ax, 0)
            glyph.left = x
            glyph.right = x + adv
            x += adv + (g < gaps ? each : 0)
          }
          line.width = availableWidth
          line.shiftX = 0
          continue
        }
      }

      // 未拉伸时：两端/分散的末行（及单行）按段方向靠齐，RTL 不能落成物理左
      let shift = 0
      if (align === 'right') {
        shift = availableWidth - line.width
      } else if (align === 'center') {
        shift = (availableWidth - line.width) / 2
      } else if (
        (align === 'alignment' || align === 'justify') &&
        line.direction === 'rtl'
      ) {
        shift = availableWidth - line.width
      } else if (
        align === 'left' ||
        align === 'alignment' ||
        align === 'justify'
      ) {
        shift = 0
      } else if (line.direction === 'rtl') {
        // start 已在 resolveAlign 映射为 left/right；兜底按方向
        shift = availableWidth - line.width
      }

      if (shift) {
        line.shiftX = shift
        for (const g of line.glyphs) {
          g.left += shift
          g.right += shift
        }
      }
    }
  }
}
