import { getBidiApi } from '../bidi/bidiApi'
import { ResolvedDirection } from '../types'

/**
 * UAX#9 paragraph direction auto-detect: first strong character.
 */
export function detectParagraphDirection(text: string): ResolvedDirection {
  const { getBidiCharTypeName } = getBidiApi()
  for (let i = 0; i < text.length; ) {
    const cp = text.codePointAt(i)!
    const ch = String.fromCodePoint(cp)
    const name = getBidiCharTypeName(ch)
    if (name === 'R' || name === 'AL') return 'rtl'
    if (name === 'L') return 'ltr'
    i += cp > 0xffff ? 2 : 1
  }
  return 'ltr'
}

export function resolveDirection(
  declared: 'ltr' | 'rtl' | 'auto' | undefined,
  text: string,
  fallback: ResolvedDirection = 'ltr'
): ResolvedDirection {
  if (declared === 'ltr' || declared === 'rtl') return declared
  if (declared === 'auto') return detectParagraphDirection(text)
  return fallback
}
