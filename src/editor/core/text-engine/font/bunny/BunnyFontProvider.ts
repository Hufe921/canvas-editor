import opentype from 'opentype.js'
import type { FontCoverageIssue } from '../../../../interface/FontCoverage'
import type { IEditorFontFace } from '../../../../interface/TextEngine'
import { MAX_FONT_BYTES, normalizeFontBinary } from '../fontBinary'
import {
  fontContentKey,
  fontContextUnits,
  isCoverageIgnorable
} from '../fontCoverage'
import { bunnyFontCandidate, type BunnyFontCandidate } from './bunnyFontCatalog'
import {
  bunnyResourceUrl,
  parseBunnyFontCss,
  type BunnyFontResource
} from './bunnyFontCss'
import { sharedFontResources } from './FontResourceStore'

export interface BunnyRequestOptions {
  signal?: AbortSignal
  /** Explicit document/element language, never inferred from the editor UI. */
  language?: string
  /** Optional complete local shaping contexts, especially for style-only gaps. */
  contexts?: string[]
}

export interface BunnyResponseMetadata {
  url: string
  contentType: string
  etag: string | null
  lastModified: string | null
  cacheControl: string | null
  /** Content-derived version also works when CORS hides ETag/Last-Modified. */
  version: string
}

export type BunnyFontPlan =
  | {
      status: 'ready'
      candidate: BunnyFontCandidate
      resources: BunnyFontResource[]
      metadata: BunnyResponseMetadata
      warnings: string[]
      unplannedCodePoints: number[]
    }
  | {
      status: 'unsupported'
      reason: 'script' | 'style' | 'diagnostic' | 'metadata'
      url?: string
    }
  | {
      status: 'failed'
      stage: 'fetch' | 'parse'
      message: string
      url?: string
    }

export type BunnyFontDownload =
  | {
      status: 'loaded'
      face: IEditorFontFace
      metadata: BunnyResponseMetadata
      sourceFormat: string
      format: 'ttf' | 'otf'
    }
  | { status: 'failed'; stage: 'fetch' | 'decode' | 'parse'; message: string }

const MAX_CSS_BYTES = 1024 * 1024

/** Provider transport only. No automatic requests, scheduling, or editor mutation. */
export class BunnyFontProvider {
  constructor(private fetcher?: typeof fetch) {}

  private async read(
    url: string,
    kind: 'css' | 'font',
    signal?: AbortSignal,
    version = ''
  ) {
    const controller = new AbortController()
    const abort = () => controller.abort()
    if (signal?.aborted) abort()
    else signal?.addEventListener('abort', abort, { once: true })
    const timeout = setTimeout(abort, 15000)
    try {
      const init: RequestInit = {
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        redirect: 'error'
      }
      const response = this.fetcher
        ? await this.fetcher(bunnyResourceUrl(url), init)
        : await sharedFontResources.fetch(url, init, version)
      if (controller.signal.aborted)
        throw new DOMException('Request aborted', 'AbortError')
      if (!response.ok) throw new Error(`Bunny HTTP ${response.status}`)
      if (response.url) bunnyResourceUrl(response.url)
      const contentType = (response.headers.get('content-type') || '')
        .split(';')[0]
        .trim()
        .toLowerCase()
      const allowed =
        kind === 'css'
          ? contentType === 'text/css'
          : /^(?:font\/(?:woff2?|ttf|otf|sfnt)|application\/(?:octet-stream|font-woff2?|x-font-(?:ttf|opentype)))$/.test(
              contentType
            )
      if (!allowed)
        throw new Error(`Unexpected Bunny ${kind} Content-Type: ${contentType}`)
      const limit = kind === 'css' ? MAX_CSS_BYTES : MAX_FONT_BYTES
      if (Number(response.headers.get('content-length')) > limit)
        throw new Error('Bunny resource exceeds size limit')
      if (!response.body) throw new Error('Empty Bunny response')
      const reader = response.body.getReader()
      const chunks: Uint8Array[] = []
      let length = 0
      try {
        while (true) {
          const result = await reader.read()
          if (result.done) break
          if (controller.signal.aborted)
            throw new DOMException('Request aborted', 'AbortError')
          length += result.value.length
          if (length > limit)
            throw new Error('Bunny resource exceeds size limit')
          chunks.push(result.value)
        }
      } finally {
        await reader.cancel().catch(() => {})
      }
      if (controller.signal.aborted)
        throw new DOMException('Request aborted', 'AbortError')
      const bytes = new Uint8Array(length)
      let offset = 0
      for (const chunk of chunks) {
        bytes.set(chunk, offset)
        offset += chunk.length
      }
      return {
        bytes,
        metadata: {
          url: response.url || url,
          contentType,
          etag: response.headers.get('etag'),
          lastModified: response.headers.get('last-modified'),
          cacheControl: response.headers.get('cache-control'),
          version: fontContentKey(bytes)
        } satisfies BunnyResponseMetadata
      }
    } finally {
      clearTimeout(timeout)
      signal?.removeEventListener('abort', abort)
    }
  }

  async plan(
    issue: FontCoverageIssue,
    options: BunnyRequestOptions = {}
  ): Promise<BunnyFontPlan> {
    if (
      issue.reason === 'loadFailed' ||
      issue.reason === 'unsupportedGlyphFormat'
    )
      return { status: 'unsupported', reason: 'diagnostic' }
    const weight =
      issue.reason === 'missingStyle' ? issue.requestedWeight || 400 : 400
    const style =
      issue.reason === 'missingStyle'
        ? issue.requestedStyle || 'normal'
        : 'normal'
    const candidate = bunnyFontCandidate(
      issue.script,
      options.language,
      weight,
      style
    )
    if (!candidate)
      return {
        status: 'unsupported',
        reason: issue.reason === 'missingStyle' ? 'style' : 'script'
      }
    const contexts = options.contexts || [
      ...issue.missingCharacters,
      ...issue.missingSequences,
      ...(issue.reason === 'missingStyle' ? issue.samples : [])
    ]
    const units = contexts
      .flatMap(text => fontContextUnits(text))
      .map(unit =>
        [...unit.text]
          .filter(text => !isCoverageIgnorable(text))
          .map(text => text.codePointAt(0)!)
      )
      .filter(points => points.length)
    if (!units.length) return { status: 'unsupported', reason: 'metadata' }
    const cssUrl = new URL('https://fonts.bunny.net/css')
    cssUrl.searchParams.set(
      'family',
      `${candidate.slug}:${weight}${style === 'italic' ? 'i' : ''}`
    )
    cssUrl.searchParams.set('display', 'swap')
    let response: Awaited<ReturnType<BunnyFontProvider['read']>>
    try {
      response = await this.read(cssUrl.href, 'css', options.signal)
    } catch (error) {
      if (options.signal?.aborted) throw error
      return {
        status: 'failed',
        stage: 'fetch',
        message: String(error),
        url: cssUrl.href
      }
    }
    try {
      const faces = parseBunnyFontCss(
        new TextDecoder().decode(response.bytes),
        response.metadata.url,
        response.metadata.version
      ).filter(
        face =>
          face.family === candidate.family &&
          face.weight === weight &&
          face.style === style
      )
      const selected = new Map<string, BunnyFontResource>()
      const unplanned = new Set<number>()
      const covers = (face: BunnyFontResource, cp: number) =>
        face.unicodeRanges?.some(([a, b]) => cp >= a && cp <= b) || false
      // Bunny currently omits unicode-range on numbered CJK shards. Use only
      // the explicitly named basic subset; never fetch all unindexed shards.
      const basic = faces.find(
        face => !face.unicodeRanges && face.subset === candidate.basicSubset
      )
      const unambiguous =
        faces.length === 1 && !faces[0].unicodeRanges ? faces[0] : undefined
      for (const points of units) {
        const complete = faces.find(face =>
          points.every(cp => covers(face, cp))
        )
        if (complete) {
          selected.set(complete.resourceId, complete)
          continue
        }
        for (const cp of points) {
          const face =
            faces.find(face => covers(face, cp)) || basic || unambiguous
          if (face) selected.set(face.resourceId, face)
          else unplanned.add(cp)
        }
      }
      if (!selected.size)
        return { status: 'unsupported', reason: 'metadata', url: cssUrl.href }
      return {
        status: 'ready',
        candidate,
        resources: [...selected.values()],
        metadata: response.metadata,
        warnings: faces.some(face => !face.unicodeRanges)
          ? ['providerRangesIncomplete']
          : [],
        unplannedCodePoints: [...unplanned]
      }
    } catch (error) {
      if (!this.fetcher) sharedFontResources.invalidate(cssUrl.href)
      return {
        status: 'failed',
        stage: 'parse',
        message: String(error),
        url: cssUrl.href
      }
    }
  }

  async download(
    resource: BunnyFontResource,
    signal?: AbortSignal
  ): Promise<BunnyFontDownload> {
    let response: Awaited<ReturnType<BunnyFontProvider['read']>>
    try {
      response = await this.read(
        resource.url,
        'font',
        signal,
        resource.metadataVersion
      )
    } catch (error) {
      if (signal?.aborted) throw error
      return { status: 'failed', stage: 'fetch', message: String(error) }
    }
    let normalized: Awaited<ReturnType<typeof normalizeFontBinary>>
    try {
      normalized = await normalizeFontBinary(response.bytes.buffer, signal)
    } catch (error) {
      if (signal?.aborted) throw error
      if (!this.fetcher) sharedFontResources.invalidate(resource.url)
      return { status: 'failed', stage: 'decode', message: String(error) }
    }
    try {
      const font = opentype.parse(normalized.data)
      if (!font.unitsPerEm || !font.tables.cmap)
        throw new Error('Font has no usable metrics or cmap')
    } catch (error) {
      if (!this.fetcher) sharedFontResources.invalidate(resource.url)
      return { status: 'failed', stage: 'parse', message: String(error) }
    }
    return {
      status: 'loaded',
      sourceFormat: normalized.sourceFormat,
      format: normalized.format,
      metadata: response.metadata,
      face: {
        family: resource.family,
        weight: resource.weight,
        style: resource.style,
        fallback: true,
        data: normalized.data,
        resourceId: `${resource.resourceId}:${response.metadata.version}`
      }
    }
  }
}
