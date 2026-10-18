export interface BunnyFontCandidate {
  family: string
  slug: string
  script: string
  basicSubset: string
  weight: number
  style: 'normal' | 'italic'
}

const CATALOG: Record<string, [string, string, string]> = {
  latn: ['Noto Sans', 'noto-sans', 'latin'],
  zyyy: ['Noto Sans', 'noto-sans', 'latin'],
  grek: ['Noto Sans', 'noto-sans', 'greek'],
  cyrl: ['Noto Sans', 'noto-sans', 'cyrillic'],
  hani: ['Noto Sans SC', 'noto-sans-sc', 'chinese-simplified'],
  hira: ['Noto Sans JP', 'noto-sans-jp', 'japanese'],
  kana: ['Noto Sans JP', 'noto-sans-jp', 'japanese'],
  hang: ['Noto Sans KR', 'noto-sans-kr', 'korean'],
  arab: ['Noto Naskh Arabic', 'noto-naskh-arabic', 'arabic'],
  deva: ['Noto Sans Devanagari', 'noto-sans-devanagari', 'devanagari'],
  thai: ['Noto Sans Thai', 'noto-sans-thai', 'thai']
}

/** Explicit document language hint only; Han never implies the UI language. */
export function bunnyFontCandidate(
  script: string,
  language?: string,
  weight = 400,
  style: 'normal' | 'italic' = 'normal'
): BunnyFontCandidate | null {
  if (script === 'hans') script = 'hani'
  let entry = CATALOG[script]
  if (!entry || ![400, 700].includes(weight)) return null
  if (script === 'hani' && language) {
    const lang = language.toLowerCase()
    if (/^zh-(?:hant|tw|hk|mo)(?:-|$)/.test(lang))
      entry = ['Noto Sans TC', 'noto-sans-tc', 'chinese-traditional']
    else if (/^ja(?:-|$)/.test(lang)) entry = CATALOG.hira
    else if (/^ko(?:-|$)/.test(lang)) entry = CATALOG.hang
  }
  // These families expose true italic resources only for Noto Sans.
  if (style === 'italic' && entry[1] !== 'noto-sans') return null
  return {
    family: entry[0],
    slug: entry[1],
    basicSubset: entry[2],
    script,
    weight,
    style
  }
}
