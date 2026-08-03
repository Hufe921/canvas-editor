import { TextScript } from '../../../dataset/enum/TextScript'
import { IEditorFontFace } from '../../../interface/TextEngine'

const ARABIC_RE =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
const HEBREW_RE = /[\u0590-\u05FF\uFB1D-\uFB4F]/
const DEVANAGARI_RE = /[\u0900-\u097F]/
const BENGALI_RE = /[\u0980-\u09FF]/
const GURMUKHI_RE = /[\u0A00-\u0A7F]/
const GUJARATI_RE = /[\u0A80-\u0AFF]/
const ORIYA_RE = /[\u0B00-\u0B7F]/
const TAMIL_RE = /[\u0B80-\u0BFF]/
const TELUGU_RE = /[\u0C00-\u0C7F]/
const KANNADA_RE = /[\u0C80-\u0CFF]/
const MALAYALAM_RE = /[\u0D00-\u0D7F]/
const SINHALA_RE = /[\u0D80-\u0DFF]/
const THAI_RE = /[\u0E00-\u0E7F]/
const LAO_RE = /[\u0E80-\u0EFF]/
const MYANMAR_RE = /[\u1000-\u109F\uAA60-\uAA7F]/
const KHMER_RE = /[\u1780-\u17FF\u19E0-\u19FF]/
const CJK_RE =
  /[\u3000-\u303F\u3040-\u30FF\u31F0-\u31FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/
const CYRILLIC_RE = /[\u0400-\u04FF\u0500-\u052F]/
const GREEK_RE = /[\u0370-\u03FF\u1F00-\u1FFF]/
const LATIN_RE = /[A-Za-z\u00C0-\u024F\u1E00-\u1EFF]/

/** Scripts that require OpenType shaping (joining / reordering / marks). */
const SHAPING_SCRIPTS = new Set<TextScript>([
  TextScript.ARAB,
  TextScript.DEVA,
  TextScript.BENG,
  TextScript.GURU,
  TextScript.GUJR,
  TextScript.ORYA,
  TextScript.TAML,
  TextScript.TELU,
  TextScript.KNDA,
  TextScript.MLYM,
  TextScript.SINH,
  TextScript.THAI,
  TextScript.LAOO,
  TextScript.MYMR,
  TextScript.KHMR
])

export function detectScript(ch: string): TextScript {
  if (!ch) return TextScript.ZYYY
  if (ARABIC_RE.test(ch)) return TextScript.ARAB
  if (HEBREW_RE.test(ch)) return TextScript.HEBR
  if (DEVANAGARI_RE.test(ch)) return TextScript.DEVA
  if (BENGALI_RE.test(ch)) return TextScript.BENG
  if (GURMUKHI_RE.test(ch)) return TextScript.GURU
  if (GUJARATI_RE.test(ch)) return TextScript.GUJR
  if (ORIYA_RE.test(ch)) return TextScript.ORYA
  if (TAMIL_RE.test(ch)) return TextScript.TAML
  if (TELUGU_RE.test(ch)) return TextScript.TELU
  if (KANNADA_RE.test(ch)) return TextScript.KNDA
  if (MALAYALAM_RE.test(ch)) return TextScript.MLYM
  if (SINHALA_RE.test(ch)) return TextScript.SINH
  if (THAI_RE.test(ch)) return TextScript.THAI
  if (LAO_RE.test(ch)) return TextScript.LAOO
  if (MYANMAR_RE.test(ch)) return TextScript.MYMR
  if (KHMER_RE.test(ch)) return TextScript.KHMR
  if (CJK_RE.test(ch)) return TextScript.HANS
  if (CYRILLIC_RE.test(ch)) return TextScript.CYRL
  if (GREEK_RE.test(ch)) return TextScript.GREK
  if (LATIN_RE.test(ch)) return TextScript.LATN
  return TextScript.ZYYY
}

export function needsOpenTypeShaping(script: TextScript): boolean {
  return SHAPING_SCRIPTS.has(script)
}

export function isArabicChar(ch: string): boolean {
  return detectScript(ch) === TextScript.ARAB
}

export function containsArabic(text: string): boolean {
  return ARABIC_RE.test(text)
}

/**
 * 阿语连写判定的推广：凡需 OT 整形的文种（阿/印地/泰等）
 * 都走「整段度量 + 整段 fillText，颜色不拆 run」同一套逻辑。
 */
export function containsShapingScript(text: string): boolean {
  for (let i = 0; i < text.length; ) {
    const cp = text.codePointAt(i)!
    const ch = String.fromCodePoint(cp)
    if (needsOpenTypeShaping(detectScript(ch))) return true
    i += cp > 0xffff ? 2 : 1
  }
  return false
}

/**
 * Pick a registered face for the script. Explicit element.font wins upstream.
 * 仅匹配 scripts 标签；勿把阿语字体套到其它复杂文种。
 */
export function resolveFontForScript(
  script: TextScript,
  fonts: IEditorFontFace[] | undefined,
  defaultFont: string
): string {
  if (!fonts?.length) return defaultFont
  const tagged = fonts.find(
    f => f.scripts?.length && f.scripts.includes(script)
  )
  if (tagged) return tagged.family
  return defaultFont
}
