import { TextScript } from '../../../dataset/enum/TextScript'
import { detectScript, needsOpenTypeShaping } from '../utils/scriptFont'

const segmenter = new Intl.Segmenter('und', { granularity: 'grapheme' })

export function isCoverageIgnorable(text: string): boolean {
  return /^[\p{White_Space}\p{Default_Ignorable_Code_Point}]*$/u.test(text)
}

export function textScript(text: string): TextScript {
  for (const scalar of text) {
    const script = detectScript(scalar)
    if (script !== TextScript.ZYYY) return script
  }
  return TextScript.ZYYY
}

/** Joining words/Indic context must not switch fonts midway through a word. */
export function fontContextUnits(text: string): Array<{
  text: string
  start: number
  end: number
}> {
  const units: Array<{ text: string; start: number; end: number }> = []
  for (const { segment, index } of segmenter.segment(text)) {
    const script = textScript(segment)
    const previous = units.at(-1)
    if (
      previous &&
      needsOpenTypeShaping(script) &&
      textScript(previous.text) === script &&
      /[\p{Letter}\p{Mark}]/u.test(segment) &&
      /[\p{Letter}\p{Mark}]\p{Default_Ignorable_Code_Point}*$/u.test(
        previous.text
      )
    ) {
      previous.text += segment
      previous.end = index + segment.length
    } else {
      units.push({ text: segment, start: index, end: index + segment.length })
    }
  }
  return units
}

export function isVariationSelector(cp: number): boolean {
  return (cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0xe0100 && cp <= 0xe01ef)
}

/** Non-cryptographic identity; registration also verifies byte equality. */
export function fontContentKey(bytes: Uint8Array): string {
  let hash = 0xcbf29ce484222325n
  for (const byte of bytes) {
    hash ^= BigInt(byte)
    hash = BigInt.asUintN(64, hash * 0x100000001b3n)
  }
  return `${bytes.length}-${hash.toString(16)}`
}

export function equalFontData(
  first: ArrayBuffer,
  second: ArrayBuffer
): boolean {
  if (first.byteLength !== second.byteLength) return false
  const a = new Uint8Array(first)
  const b = new Uint8Array(second)
  return a.every((byte, index) => byte === b[index])
}
