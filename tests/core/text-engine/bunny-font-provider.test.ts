import { BunnyFontProvider } from '@/editor/core/text-engine/font/bunny/BunnyFontProvider'
import { bunnyFontCandidate } from '@/editor/core/text-engine/font/bunny/bunnyFontCatalog'
import {
  parseBunnyFontCss,
  parseUnicodeRanges
} from '@/editor/core/text-engine/font/bunny/bunnyFontCss'
import type { FontCoverageIssue } from '@/editor/interface/FontCoverage'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

const basic = readFileSync('tests/fixtures/fonts/bunny-basic.css', 'utf8')
const cjk = readFileSync('tests/fixtures/fonts/bunny-sc.css', 'utf8')
function issue(
  script: string,
  text: string
): Exclude<FontCoverageIssue, { reason: 'loadFailed' }> {
  return {
    id: 'test',
    reason: 'missingGlyph',
    script,
    categoryLabel: script,
    requestedFamily: 'User Font',
    attemptedFaces: [],
    missingCharacters: [...text],
    missingSequences: [],
    codePoints: [],
    samples: [text],
    uniqueCount: 1,
    occurrenceCount: 1,
    locations: [],
    downloadStatus: 'idle',
    attemptedDownloads: []
  }
}
function cssResponse(text: string) {
  return new Response(text, {
    headers: {
      'content-type': 'text/css',
      etag: '"version-1"',
      'cache-control': 'public, max-age=3600'
    }
  })
}

describe('Bunny font metadata and selection', () => {
  it('maps explicit document regions and rejects unknown/emoji/unsupported styles', () => {
    expect(bunnyFontCandidate('hani')?.slug).toBe('noto-sans-sc')
    expect(bunnyFontCandidate('hani', 'zh-Hant-HK')?.slug).toBe('noto-sans-tc')
    expect(bunnyFontCandidate('hani', 'ja-JP')?.slug).toBe('noto-sans-jp')
    expect(bunnyFontCandidate('hang')?.slug).toBe('noto-sans-kr')
    expect(bunnyFontCandidate('zsye')).toBeNull()
    expect(bunnyFontCandidate('zzzz')).toBeNull()
    expect(bunnyFontCandidate('arab', undefined, 400, 'italic')).toBeNull()
    expect(bunnyFontCandidate('latn', undefined, 700, 'italic')).toMatchObject({
      weight: 700,
      style: 'italic'
    })
    expect(bunnyFontCandidate('arab', undefined, 600)).toBeNull()
  })

  it('parses ranges including wildcards and supplementary scalars', () => {
    expect(parseUnicodeRanges('U+4E??, U+20000-2A6DF, U+41')).toEqual([
      [0x41, 0x41],
      [0x4e00, 0x4eff],
      [0x20000, 0x2a6df]
    ])
    for (const text of ['U+11FFFF', 'U+123-100', 'U+?0', 'U+1?-20', 'url(x)'])
      expect(() => parseUnicodeRanges(text)).toThrow()
  })

  it.each([
    ['latn', 'Hello', 'latin'],
    ['arab', 'مرحبا', 'arabic'],
    ['deva', 'नमस्ते', 'devanagari'],
    ['thai', 'สวัสดี', 'thai']
  ])(
    'selects official CSS metadata for %s without putting source text in URLs',
    async (script, text, subset) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(cssResponse(basic))
      const result = await new BunnyFontProvider(fetcher).plan(
        issue(script, text)
      )
      expect(result.status).toBe('ready')
      if (result.status !== 'ready') return
      expect(result.resources.some(face => face.subset === subset)).toBe(true)
      expect(result.resources.every(face => face.format === 'woff2')).toBe(true)
      expect(result.metadata).toMatchObject({
        etag: '"version-1"',
        cacheControl: 'public, max-age=3600'
      })
      const url = new URL(String(fetcher.mock.calls[0][0]))
      expect([...url.searchParams.keys()].sort()).toEqual(['display', 'family'])
      expect(decodeURIComponent(url.href)).not.toContain(text)
      expect(fetcher.mock.calls[0][1]).toMatchObject({
        credentials: 'omit',
        mode: 'cors',
        redirect: 'error'
      })
    }
  )

  it('selects Chinese basic and Latin faces without downloading all unindexed CJK shards', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(cssResponse(cjk))
    const result = await new BunnyFontProvider(fetcher).plan(
      issue('hani', '汉A')
    )
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return
    expect(result.resources.map(face => face.subset).sort()).toEqual([
      'chinese-simplified',
      'latin'
    ])
    expect(result.warnings).toContain('providerRangesIncomplete')
    expect(
      result.resources.find(face => face.subset === 'chinese-simplified')
        ?.unicodeRanges
    ).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('does not omit supplementary CJK shards when real range metadata is present', async () => {
    const css = `/* basic */ @font-face {font-family: 'Noto Sans SC';font-weight:400;src:url(/basic.woff2) format('woff2');unicode-range:U+4E00-9FFF}
      /* ext */ @font-face {font-family:'Noto Sans SC';font-weight:400;src:url(/ext.woff2) format('woff2');unicode-range:U+20000-2A6DF}`
    const result = await new BunnyFontProvider(
      vi.fn<typeof fetch>().mockResolvedValue(cssResponse(css))
    ).plan(issue('hani', '汉𠀀'))
    expect(result.status).toBe('ready')
    if (result.status === 'ready') expect(result.resources).toHaveLength(2)
  })

  it('prefers a face containing a whole combining context to a split pair', async () => {
    const css = [
      ['a', 'U+61'],
      ['mark', 'U+0301'],
      ['both', 'U+61,U+0301']
    ]
      .map(
        ([label, range]) =>
          `@font-face {font-family:'Noto Sans';src:url(/${label}.woff2) format('woff2');unicode-range:${range}}`
      )
      .join('\n')
    const gap = issue('latn', '')
    gap.missingSequences = ['á']
    const result = await new BunnyFontProvider(
      vi.fn<typeof fetch>().mockResolvedValue(cssResponse(css))
    ).plan(gap)
    expect(result.status).toBe('ready')
    if (result.status === 'ready')
      expect(result.resources.map(face => face.url)).toEqual([
        'https://fonts.bunny.net/both.woff2'
      ])
  })

  it('does not treat omitted ranges as universal or send unsupported diagnostics to the network', async () => {
    const fetcher = vi.fn<typeof fetch>()
    const provider = new BunnyFontProvider(fetcher)
    expect(await provider.plan(issue('zsye', '😀'))).toEqual({
      status: 'unsupported',
      reason: 'script'
    })
    expect(
      await provider.plan({
        ...issue('latn', 'A'),
        reason: 'unsupportedGlyphFormat'
      })
    ).toEqual({ status: 'unsupported', reason: 'diagnostic' })
    expect(fetcher).not.toHaveBeenCalled()
    fetcher.mockResolvedValue(
      cssResponse(
        "/* 17 */ @font-face {font-family:'Noto Sans SC';src:url(/17.woff2) format('woff2')}\n/* 18 */ @font-face {font-family:'Noto Sans SC';src:url(/18.woff2) format('woff2')}"
      )
    )
    expect(await provider.plan(issue('hani', '汉'))).toMatchObject({
      status: 'unsupported',
      reason: 'metadata'
    })
  })

  it('uses actual italic metadata for style gaps and keeps resource versions distinct', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => cssResponse(basic))
    const provider = new BunnyFontProvider(fetcher)
    const gap = {
      ...issue('latn', 'A'),
      reason: 'missingStyle' as const,
      requestedWeight: 700,
      requestedStyle: 'italic' as const
    }
    const plan = await provider.plan(gap)
    expect(plan.status).toBe('ready')
    if (plan.status !== 'ready') return
    expect(
      plan.resources.every(
        face => face.weight === 700 && face.style === 'italic'
      )
    ).toBe(true)
    const before = parseBunnyFontCss(basic, 'https://fonts.bunny.net/css', 'v1')
    const after = parseBunnyFontCss(basic, 'https://fonts.bunny.net/css', 'v2')
    expect(new Set(before.map(face => face.resourceId)).size).toBe(
      before.length
    )
    expect(before[0].resourceId).not.toBe(after[0].resourceId)
  })

  it('rejects foreign URLs, malformed ranges, variable faces and invalid MIME/HTTP responses', async () => {
    expect(() =>
      parseBunnyFontCss(
        "@font-face {font-family:x;src:url(https://evil.test/f.woff2) format('woff2')}",
        'https://fonts.bunny.net/css',
        'v'
      )
    ).toThrow('URL')
    expect(() =>
      parseBunnyFontCss(
        "@font-face {font-family:x;font-weight:100 900;src:url(/f.woff2) format('woff2')}",
        'https://fonts.bunny.net/css',
        'v'
      )
    ).toThrow('static')
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response('<html>error</html>', {
        headers: { 'content-type': 'text/html' }
      })
    )
    const provider = new BunnyFontProvider(fetcher)
    expect(await provider.plan(issue('latn', 'A'))).toMatchObject({
      status: 'failed',
      stage: 'fetch'
    })
    fetcher.mockResolvedValue(new Response(null, { status: 404 }))
    expect(await provider.plan(issue('latn', 'A'))).toMatchObject({
      status: 'failed',
      stage: 'fetch'
    })
    fetcher.mockResolvedValue(cssResponse('not font css'))
    expect(await provider.plan(issue('latn', 'A'))).toMatchObject({
      status: 'failed',
      stage: 'parse'
    })
  })

  it('normalizes downloaded binary and includes resource content identity', async () => {
    const bytes = readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
    const resource = parseBunnyFontCss(
      basic,
      'https://fonts.bunny.net/css',
      'css-v1'
    ).find(face => face.subset === 'arabic')!
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(
        async () =>
          new Response(bytes, { headers: { 'content-type': 'font/ttf' } })
      )
    const provider = new BunnyFontProvider(fetcher)
    const result = await provider.download(resource)
    expect(result).toMatchObject({
      status: 'loaded',
      sourceFormat: 'ttf',
      format: 'ttf',
      face: { family: resource.family, fallback: true }
    })
    if (result.status === 'loaded')
      expect(result.face.resourceId).toContain(resource.resourceId)
    const updated = readFileSync('public/fonts/NotoSansDevanagari-Regular.ttf')
    fetcher.mockImplementationOnce(
      async () =>
        new Response(updated, {
          headers: { 'content-type': 'font/ttf' }
        })
    )
    const changed = await provider.download(resource)
    if (result.status === 'loaded' && changed.status === 'loaded')
      expect(changed.face.resourceId).not.toBe(result.face.resourceId)
    fetcher.mockResolvedValue(
      new Response(new Uint8Array([1]), {
        headers: { 'content-type': 'font/woff2' }
      })
    )
    expect(await provider.download(resource)).toMatchObject({
      status: 'failed',
      stage: 'decode'
    })
  })

  it('limits resource size and ends a timed-out fetch without retry loops', async () => {
    const resource = parseBunnyFontCss(
      basic,
      'https://fonts.bunny.net/css',
      'v'
    )[0]
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(null, {
        headers: {
          'content-type': 'font/woff2',
          'content-length': String(40 * 1024 * 1024)
        }
      })
    )
    const provider = new BunnyFontProvider(fetcher)
    expect(await provider.download(resource)).toMatchObject({
      status: 'failed',
      stage: 'fetch'
    })
    vi.useFakeTimers()
    try {
      fetcher.mockImplementation(
        async (_url, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('timeout', 'AbortError'))
            )
          })
      )
      const pending = provider.plan(issue('latn', 'A'))
      await vi.advanceTimersByTimeAsync(15001)
      expect(await pending).toMatchObject({ status: 'failed', stage: 'fetch' })
      expect(fetcher).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('rejects aborted operations without swallowing cancellation', async () => {
    const controller = new AbortController()
    controller.abort()
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_url, init) => {
        if (init?.signal?.aborted)
          throw new DOMException('aborted', 'AbortError')
        return cssResponse(basic)
      })
    await expect(
      new BunnyFontProvider(fetcher).plan(issue('latn', 'A'), {
        signal: controller.signal
      })
    ).rejects.toMatchObject({ name: 'AbortError' })
  })
})
