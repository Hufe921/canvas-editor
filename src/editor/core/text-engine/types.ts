export type ResolvedDirection = 'ltr' | 'rtl'

export interface TextStyleProps {
  fontFamily: string
  fontSize: number
  bold?: boolean
  italic?: boolean
  color?: string
  letterSpacing?: number
  /**
   * Superscript / subscript. Vertical shift is independent of LTR/RTL;
   * horizontal placement still follows bidi / visualLeft.
   */
  scriptShift?: 'super' | 'sub'
  /**
   * Inline object slot (checkbox/radio/image/latex). When set, shaper emits a
   * fixed-advance glyph and GlyphRenderer skips painting the replacement char.
   */
  objectWidth?: number
  /** Inline object height (image/latex); raises line box when taller than text */
  objectHeight?: number
}

export interface TextSpan {
  /** Logical index into host element list (start of this span) */
  logicalIndex: number
  /**
   * Per UTF-16 unit → host element index. Required when a single IElement
   * holds a multi-code-unit grapheme (Intl.Segmenter) or spans were merged.
   * Length must equal text.length when present.
   */
  logicalIndices?: number[]
  text: string
  style: TextStyleProps
}

export interface BidiRun {
  start: number
  end: number
  level: number
  direction: ResolvedDirection
}

export interface StyleRun {
  text: string
  direction: ResolvedDirection
  script?: string
  language?: string
  style: TextStyleProps
  /** Absolute logical char offset in paragraph string */
  textStart: number
  textEnd: number
  /** Map paragraph-relative offset → host logicalIndex */
  logicalIndexAt: (paraOffset: number) => number
}

export interface ShapedGlyph {
  glyphId: number
  cluster: number
  ax: number
  dx: number
  dy: number
  /**
   * Canvas Y delta from line baseline for super/sub (positive = down).
   * Independent of paragraph direction; set from style.scriptShift.
   */
  baselineShift?: number
  charStart: number
  charEnd: number
  logicalIndexStart: number
  logicalIndexEnd: number
  /** Host element indices covered by visible characters in this glyph cluster. */
  logicalIndices?: number[]
  left: number
  right: number
  style: TextStyleProps
  bidiLevel: number
  pathData?: string
}

export interface LayoutLine {
  glyphs: ShapedGlyph[]
  width: number
  height: number
  ascent: number
  descent: number
  textStart: number
  textEnd: number
  logicalStart: number
  logicalEnd: number
  direction: ResolvedDirection
  shiftX: number
}

export interface LayoutResult {
  lines: LayoutLine[]
  direction: ResolvedDirection
  paragraphText: string
}

export interface LayoutParagraphInput {
  spans: TextSpan[]
  availableWidth: number
  direction: ResolvedDirection
  /** Alignment after resolve: left | right | center | justify | alignment */
  align: 'left' | 'right' | 'center' | 'justify' | 'alignment'
  /**
   * 空行/无字形时的绝对行高回退值。
   * 有字形时优先：maxFontSizeOnLine * lineHeightFactor。
   */
  lineHeight: number
  /**
   * 行高系数（默认 1.5）。混排不同字号时按行内最大字号 * 该系数计算行盒，
   * 避免放大局部文字后行高不变导致重叠。
   */
  lineHeightFactor?: number
  scale?: number
  /**
   * break-word：按词/空格换行（默认）；break-all：任意字素硬切
   */
  wordBreak?: 'break-word' | 'break-all'
}

export interface CaretMetrics {
  x: number
  y: number
  height: number
  affinity: 'before' | 'after'
}

export interface VisualRect {
  left: number
  right: number
  y: number
  height: number
}
