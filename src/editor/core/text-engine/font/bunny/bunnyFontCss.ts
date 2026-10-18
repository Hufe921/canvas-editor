export type UnicodeRange = readonly [number, number]
export type BunnyFontFormat = 'woff2' | 'woff' | 'truetype' | 'opentype'

export interface BunnyFontResource {
  family: string
  weight: number
  style: 'normal' | 'italic'
  subset: string
  url: string
  format: BunnyFontFormat
  sources: { url: string; format: BunnyFontFormat }[]
  /** null means the provider omitted range metadata, never universal coverage. */
  unicodeRanges: UnicodeRange[] | null
  resourceId: string
  metadataVersion: string
}

export function bunnyResourceUrl(
  value: string,
  base = 'https://fonts.bunny.net/css'
) {
  const url = new URL(value, base)
  if (
    url.origin !== 'https://fonts.bunny.net' ||
    url.username ||
    url.password ||
    url.hash
  )
    throw new Error('Font URL must belong to https://fonts.bunny.net')
  return url.href
}

export function parseUnicodeRanges(value: string): UnicodeRange[] {
  const ranges = value.split(',').map(part => {
    const match = /^U\+([0-9a-f?]{1,6})(?:-([0-9a-f]{1,6}))?$/i.exec(
      part.trim()
    )
    if (!match || (match[2] && match[1].includes('?')))
      throw new Error('Invalid unicode-range')
    if (match[1].includes('?') && !/^[0-9a-f]*\?+$/i.test(match[1]))
      throw new Error('Invalid unicode-range wildcard')
    const start = parseInt(match[1].replace(/\?/g, '0'), 16)
    const end = parseInt(match[2] || match[1].replace(/\?/g, 'F'), 16)
    if (start > end || end > 0x10ffff)
      throw new Error('Invalid Unicode scalar range')
    return [start, end] as const
  })
  return ranges.sort((a, b) => a[0] - b[0])
}

function unquote(value: string) {
  return value.trim().replace(/^(['"])(.*)\1$/, '$2')
}

/** Parses the flat, static @font-face declarations returned by Bunny's CSS API. */
export function parseBunnyFontCss(
  css: string,
  cssUrl: string,
  metadataVersion: string
) {
  const resources: BunnyFontResource[] = []
  const blocks = /(?:\/\*\s*([^*]*?)\s*\*\/\s*)?@font-face\s*\{([^{}]*)\}/gi
  for (const block of css.matchAll(blocks)) {
    const fields = new Map<string, string>()
    for (const declaration of block[2].split(';')) {
      const colon = declaration.indexOf(':')
      if (colon > 0)
        fields.set(
          declaration.slice(0, colon).trim().toLowerCase(),
          declaration.slice(colon + 1).trim()
        )
    }
    const family = unquote(fields.get('font-family') || '')
    const style = fields.get('font-style') || 'normal'
    const weight = Number(fields.get('font-weight') || '400')
    if (
      !family ||
      !['normal', 'italic'].includes(style) ||
      !Number.isInteger(weight) ||
      weight < 1 ||
      weight > 1000
    )
      continue
    // Variable weight ranges are not static instances; do not mislabel the default axis as bold.
    const source = fields.get('src') || ''
    const sources = [
      ...source.matchAll(
        /url\(\s*(?:'([^']+)'|"([^"]+)"|([^\s)]+))\s*\)\s*format\(\s*['"]([^'"]+)['"]\s*\)/gi
      )
    ]
    const supported = sources.filter(item =>
      ['woff2', 'woff', 'truetype', 'opentype'].includes(item[4].toLowerCase())
    )
    const selected =
      supported.find(item => item[4].toLowerCase() === 'woff2') || supported[0]
    if (!selected) continue
    const url = bunnyResourceUrl(
      selected[1] || selected[2] || selected[3],
      cssUrl
    )
    const ranges = fields.get('unicode-range')
    resources.push({
      family,
      weight,
      style: style as 'normal' | 'italic',
      subset: (block[1] || '').trim().toLowerCase(),
      url,
      format: selected[4].toLowerCase() as BunnyFontFormat,
      sources: supported.map(source => ({
        url: bunnyResourceUrl(source[1] || source[2] || source[3], cssUrl),
        format: source[4].toLowerCase() as BunnyFontFormat
      })),
      unicodeRanges: ranges ? parseUnicodeRanges(ranges) : null,
      metadataVersion,
      resourceId: `bunny:${JSON.stringify([family, weight, style, url, metadataVersion])}`
    })
  }
  if (!resources.length)
    throw new Error('No supported static font faces in Bunny CSS')
  return resources
}
