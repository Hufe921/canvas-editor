import { TextScript } from '../../../dataset/enum/TextScript'
import { IEditorFontFace } from '../../../interface/TextEngine'

const ARABIC_RE = /\p{Script=Arabic}/u
const SCRIPT_PATTERNS: Array<[TextScript, RegExp]> = [
  [TextScript.ARAB, /\p{Script=Arabic}/u],
  [TextScript.HEBR, /\p{Script=Hebrew}/u],
  [TextScript.DEVA, /\p{Script=Devanagari}/u],
  [TextScript.BENG, /\p{Script=Bengali}/u],
  [TextScript.GURU, /\p{Script=Gurmukhi}/u],
  [TextScript.GUJR, /\p{Script=Gujarati}/u],
  [TextScript.ORYA, /\p{Script=Oriya}/u],
  [TextScript.TAML, /\p{Script=Tamil}/u],
  [TextScript.TELU, /\p{Script=Telugu}/u],
  [TextScript.KNDA, /\p{Script=Kannada}/u],
  [TextScript.MLYM, /\p{Script=Malayalam}/u],
  [TextScript.SINH, /\p{Script=Sinhala}/u],
  [TextScript.THAI, /\p{Script=Thai}/u],
  [TextScript.LAOO, /\p{Script=Lao}/u],
  [TextScript.MYMR, /\p{Script=Myanmar}/u],
  [TextScript.KHMR, /\p{Script=Khmer}/u],
  [TextScript.HANI, /\p{Script=Han}/u],
  [TextScript.HIRA, /\p{Script=Hiragana}/u],
  [TextScript.KANA, /\p{Script=Katakana}/u],
  [TextScript.HANG, /\p{Script=Hangul}/u],
  [TextScript.CYRL, /\p{Script=Cyrillic}/u],
  [TextScript.GREK, /\p{Script=Greek}/u],
  [TextScript.LATN, /\p{Script=Latin}/u]
]

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
  for (const scalar of ch) {
    for (const [script, pattern] of SCRIPT_PATTERNS) {
      if (pattern.test(scalar)) return script
    }
    if (/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(scalar)) {
      return TextScript.ZSYE
    }
    if (/[\p{Letter}\p{Mark}]/u.test(scalar)) return TextScript.ZZZZ
  }
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
 * Detect scripts requiring contextual OpenType shaping (Arabic, Indic, Thai).
 * All text now uses HarfBuzz; this utility only classifies scripts.
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
    f =>
      f.scripts?.length &&
      (f.scripts.includes(script) ||
        (script === TextScript.HANI && f.scripts.includes(TextScript.HANS)))
  )
  if (tagged) return tagged.family
  return defaultFont
}
