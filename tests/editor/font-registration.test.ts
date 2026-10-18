import Editor, { TextScript } from '@/editor'
import { Draw } from '@/editor/core/draw/Draw'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'

const bytes = readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
const data = bytes.buffer.slice(
  bytes.byteOffset,
  bytes.byteOffset + bytes.length
)
const editors: Editor[] = []

async function create() {
  const container = document.createElement('div')
  document.body.append(container)
  const editor = await Editor.create(container, [{ value: 'مرحبا' }], {
    autoDownloadFonts: false,
    defaultFont: 'Arabic',
    fonts: []
  })
  editors.push(editor)
  return editor
}

afterEach(() => {
  editors.forEach(editor => editor.destroy())
  editors.length = 0
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('public font registration', () => {
  it('registers real data, invalidates layout, and keeps the original document', async () => {
    const editor = await create()
    const before = editor.command.getValue().data
    const render = vi.spyOn(Draw.prototype, 'render')
    const results = await editor.register.fonts([
      {
        family: 'Arabic',
        data,
        scripts: [TextScript.ARAB],
        resourceId: 'self-hosted'
      }
    ])
    expect(results[0].status).toBe('registered')
    expect(editor.register.getFontRevision()).toBe(1)
    expect(editor.register.getFontFaces()[0].scripts).toEqual([TextScript.ARAB])
    expect(editor.command.getValue().data).toEqual(before)
    expect(render).toHaveBeenCalled()
    render.mockClear()
    expect(
      (
        await editor.register.fonts([
          {
            family: 'Arabic',
            data,
            scripts: [TextScript.ARAB],
            resourceId: 'self-hosted'
          }
        ])
      )[0].status
    ).toBe('duplicate')
    expect(editor.register.getFontRevision()).toBe(1)
    expect(render).not.toHaveBeenCalled()
  })

  it('coalesces concurrent identical registrations into one layout refresh', async () => {
    const editor = await create()
    const render = vi.spyOn(Draw.prototype, 'render')
    const results = await Promise.all([
      editor.register.fonts([{ family: 'Arabic', data }]),
      editor.register.fonts([{ family: 'Arabic', data: data.slice(0) }])
    ])
    expect(results.map(batch => batch[0].status)).toEqual([
      'registered',
      'duplicate'
    ])
    expect(editor.register.getFontRevision()).toBe(1)
    expect(render).toHaveBeenCalledTimes(1)
  })

  it('keeps font failures recoverable and does not increment the version', async () => {
    const editor = await create()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await editor.register.fonts([
      {
        family: 'Invalid',
        data: new ArrayBuffer(1)
      }
    ])
    expect(result[0]).toMatchObject({
      status: 'failed',
      failure: { stage: 'parse' }
    })
    expect(editor.state).toBe('ready')
    expect(editor.register.getFontRevision()).toBe(0)
  })

  it('rejects registration after destroy', async () => {
    const editor = await create()
    editor.destroy()
    await expect(
      editor.register.fonts([{ family: 'Arabic', data }])
    ).rejects.toMatchObject({ code: 'EDITOR_DESTROYED' })
  })
})
