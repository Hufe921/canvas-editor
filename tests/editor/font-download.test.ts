import Editor from '@/editor'
import { sharedFontResources } from '@/editor/core/text-engine/font/bunny/FontResourceStore'
import { parseBunnyFontCss } from '@/editor/core/text-engine/font/bunny/bunnyFontCss'
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const css = readFileSync('tests/fixtures/fonts/bunny-basic.css', 'utf8')
const bytes = readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
const editors: Editor[] = []
const cssUrl =
  'https://fonts.bunny.net/css?family=noto-naskh-arabic%3A400&display=swap'
let fetcher: ReturnType<typeof vi.fn<typeof fetch>>
function fontResponse() {
  return new Response(bytes, { headers: { 'content-type': 'font/ttf' } })
}
function cssResponse() {
  return new Response(css, { headers: { 'content-type': 'text/css' } })
}
async function create(enabled?: boolean, text = 'مرحبا') {
  const container = document.createElement('div')
  document.body.append(container)
  const editor = await Editor.create(container, [{ value: text }], {
    defaultFont: 'User Font',
    pageNumber: { disabled: true },
    fonts: [],
    ...(enabled === undefined ? {} : { autoDownloadFonts: enabled })
  })
  editors.push(editor)
  return editor
}
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  sharedFontResources.clearFailures()
  sharedFontResources.invalidate(cssUrl)
  for (const resource of parseBunnyFontCss(css, cssUrl, 'v'))
    sharedFontResources.invalidate(resource.url)
  fetcher = vi
    .fn<typeof fetch>()
    .mockImplementation(async url =>
      String(url).includes('/css?') ? cssResponse() : fontResponse()
    )
  vi.stubGlobal('fetch', fetcher)
})
afterEach(() => {
  editors.splice(0).forEach(editor => editor.destroy())
  document.body.replaceChildren()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('automatic basic font download lifecycle', () => {
  it('defaults to enabled, resolves real missing text and preserves content/selection', async () => {
    const editor = await create()
    const before = editor.command.getValue().data
    editor.command.executeSetRange(0, 1)
    const changes = vi.fn()
    editor.eventBus.on('fontCoverageChange', changes)
    expect(editor.getFontCoverageReport()).toMatchObject({
      autoDownloadFonts: true,
      issues: [expect.objectContaining({ downloadStatus: 'loading' })]
    })
    expect(fetcher).not.toHaveBeenCalled()
    expect(document.querySelector('[role=status]')?.textContent).toContain(
      '正在补充'
    )
    expect(console.warn).not.toHaveBeenCalled()
    await vi.waitFor(() =>
      expect(editor.getFontCoverageReport().issues).toEqual([])
    )
    expect(document.querySelector('[role=status]')?.textContent).toContain(
      '已补全'
    )
    expect(console.warn).not.toHaveBeenCalled()
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(editor.register.getFontRevision()).toBe(1)
    expect(editor.command.getValue().data).toEqual(before)
    expect(editor.command.getRange()).toMatchObject({
      startIndex: 0,
      endIndex: 1
    })
    expect(changes).toHaveBeenCalled()
  })

  for (const enabled of [false, true]) {
    it(`T16 applies the font download switch to configuration chrome: ${enabled}`, async () => {
      const container = document.createElement('div')
      document.body.append(container)
      const editor = await Editor.create(container, [], {
        autoDownloadFonts: enabled,
        fonts: [],
        pageNumber: { disabled: true },
        watermark: { data: 'مرحبا', font: 'User Font' }
      })
      editors.push(editor)
      const report = editor.getFontCoverageReport()
      expect(report.issues).toHaveLength(1)
      expect(report.issues[0].locations[0].scope).toBe('aux:watermark')
      if (!enabled) {
        expect(report.issues[0].downloadStatus).toBe('disabled')
        expect(fetcher).not.toHaveBeenCalled()
        await editor.register.fonts([
          { family: 'Manual', data: new Uint8Array(bytes).buffer }
        ])
      }
      await vi.waitFor(() =>
        expect(editor.getFontCoverageReport().issues).toEqual([])
      )
      expect(fetcher).toHaveBeenCalledTimes(enabled ? 2 : 0)
      expect(
        editor.command
          .getValue()
          .data.main.map(e => e.value)
          .join('')
      ).not.toContain('مرحبا')
    })
  }

  it('automatically adds a missing weight when the configured preferred family only has regular', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const editor = await Editor.create(
      container,
      [{ value: 'مرحبا', bold: true, font: 'Primary' }],
      {
        fonts: [{ family: 'Primary', data: new Uint8Array(bytes).buffer }]
      }
    )
    editors.push(editor)
    expect(editor.getFontCoverageReport().issues[0].reason).toBe('missingStyle')
    await vi.waitFor(() =>
      expect(editor.getFontCoverageReport().issues).toEqual([])
    )
    expect(editor.register.getFontFaces()).toContainEqual(
      expect.objectContaining({
        family: 'Noto Naskh Arabic',
        weight: 700
      })
    )
    expect(String(fetcher.mock.calls[0][0])).toContain('700')
  })

  it('does not request Bunny resources when disabled and still permits manual fonts', async () => {
    const editor = await create(false)
    await new Promise(resolve => setTimeout(resolve, 120))
    expect(fetcher).not.toHaveBeenCalled()
    expect(editor.getFontCoverageReport().issues[0].downloadStatus).toBe(
      'disabled'
    )
    await editor.register.fonts([
      { family: 'Manual', data: new Uint8Array(bytes).buffer }
    ])
    expect(editor.getFontCoverageReport().issues).toEqual([])
    expect(fetcher).not.toHaveBeenCalled()
    editor.command.executeUpdateOptions({
      defaultSize: 20,
      autoDownloadFonts: undefined
    })
    expect(editor.getFontCoverageReport().autoDownloadFonts).toBe(false)
  })

  it('allows explicit configured font URLs while automatic Bunny downloads are off', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const editor = await Editor.create(container, [{ value: 'مرحبا' }], {
      autoDownloadFonts: false,
      defaultFont: 'Explicit',
      fonts: [{ family: 'Explicit', url: '/local.ttf' }]
    })
    editors.push(editor)
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(fetcher.mock.calls[0][0]).toBe('/local.ttf')
    expect(editor.getFontCoverageReport().issues).toEqual([])
  })

  it('shares CSS/font HTTP across editors, cancels one subscriber and reuses cache on enabling', async () => {
    let finish!: (response: Response) => void
    fetcher.mockImplementation(async url =>
      String(url).includes('/css?')
        ? cssResponse()
        : new Promise(resolve => {
            finish = resolve
          })
    )
    const first = await create()
    const second = await create()
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
    // Wait until the second editor has subscribed, not just the first HTTP.
    await vi.waitFor(() =>
      expect(
        second.getFontCoverageReport().issues[0].attemptedDownloads
      ).toHaveLength(1)
    )
    first.command.executeUpdateOptions({ autoDownloadFonts: false })
    finish(fontResponse())
    await vi.waitFor(() =>
      expect(second.getFontCoverageReport().issues).toEqual([])
    )
    expect(first.register.getFontRevision()).toBe(0)
    first.command.executeUpdateOptions({ autoDownloadFonts: true })
    await vi.waitFor(() =>
      expect(first.getFontCoverageReport().issues).toEqual([])
    )
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('discards late results after content replacement and after destroy', async () => {
    let finish!: (response: Response) => void
    fetcher.mockImplementation(async url =>
      String(url).includes('/css?')
        ? cssResponse()
        : new Promise(resolve => {
            finish = resolve
          })
    )
    const editor = await create()
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
    editor.command.executeSetValue({ main: [] })
    finish(fontResponse())
    await new Promise(resolve => setTimeout(resolve, 80))
    expect(editor.register.getFontRevision()).toBe(0)
    expect(editor.getFontCoverageReport().issues).toEqual([])
    sharedFontResources.invalidate(cssUrl)
    const next = await create()
    await vi.waitFor(() =>
      expect(fetcher.mock.calls.length).toBeGreaterThanOrEqual(4)
    )
    const changed = vi.fn()
    next.eventBus.on('fontCoverageChange', changed)
    next.destroy()
    finish(fontResponse())
    await new Promise(resolve => setTimeout(resolve, 80))
    expect(changed).not.toHaveBeenCalled()
  })

  it('has finite failures, exposes stages and allows an explicit retry', async () => {
    fetcher.mockImplementation(async url =>
      String(url).includes('/css?')
        ? cssResponse()
        : new Response(null, { status: 404 })
    )
    const editor = await create()
    await vi.waitFor(() =>
      expect(editor.getFontCoverageReport().issues[0].downloadStatus).toBe(
        'failed'
      )
    )
    expect(editor.getFontCoverageReport().issues[0]).toMatchObject({
      downloadFailure: { stage: 'fetch' },
      attemptedDownloads: [
        expect.objectContaining({ status: 'failed', failureStage: 'fetch' })
      ]
    })
    expect(
      document.querySelector('.ce-font-diagnostics li')?.textContent
    ).toContain('下载失败')
    expect(console.warn).toHaveBeenCalledTimes(1)
    const count = fetcher.mock.calls.length
    await new Promise(resolve => setTimeout(resolve, 200))
    expect(fetcher).toHaveBeenCalledTimes(count)
    expect(console.warn).toHaveBeenCalledTimes(1)
    fetcher.mockImplementation(async url =>
      String(url).includes('/css?') ? cssResponse() : fontResponse()
    )
    editor.retryFontDownloads()
    await vi.waitFor(() =>
      expect(editor.getFontCoverageReport().issues).toEqual([])
    )
    expect(editor.state).toBe('ready')
  })

  it.each(['parse', 'decode'])(
    'recovers from cached %s failures on manual retry',
    async stage => {
      fetcher.mockImplementation(async url =>
        String(url).includes('/css?')
          ? stage === 'parse'
            ? new Response('invalid CSS', {
                headers: { 'content-type': 'text/css' }
              })
            : cssResponse()
          : new Response(new Uint8Array([1, 2]), {
              headers: { 'content-type': 'font/woff2' }
            })
      )
      const editor = await create()
      await vi.waitFor(() =>
        expect(editor.getFontCoverageReport().issues[0]).toMatchObject({
          downloadStatus: 'failed',
          downloadFailure: { stage }
        })
      )
      fetcher.mockImplementation(async url =>
        String(url).includes('/css?') ? cssResponse() : fontResponse()
      )
      editor.retryFontDownloads()
      await vi.waitFor(() =>
        expect(editor.getFontCoverageReport().issues).toEqual([])
      )
    }
  )

  it('does not loop when a downloaded valid face still lacks characters; unsupported scripts make no HTTP', async () => {
    const unrelated = readFileSync('public/fonts/NotoSansThai-Regular.ttf')
    fetcher.mockImplementation(async url =>
      String(url).includes('/css?')
        ? cssResponse()
        : new Response(unrelated, { headers: { 'content-type': 'font/ttf' } })
    )
    const editor = await create()
    await vi.waitFor(
      () =>
        expect(editor.getFontCoverageReport().issues[0].downloadStatus).toBe(
          'failed'
        ),
      { timeout: 2000 }
    )
    const count = fetcher.mock.calls.length
    await new Promise(resolve => setTimeout(resolve, 200))
    expect(fetcher).toHaveBeenCalledTimes(count)
    const unknown = await create(true, '😀')
    await vi.waitFor(() =>
      expect(unknown.getFontCoverageReport().issues[0].downloadStatus).toBe(
        'unsupported'
      )
    )
    expect(fetcher).toHaveBeenCalledTimes(count)
  })
})
