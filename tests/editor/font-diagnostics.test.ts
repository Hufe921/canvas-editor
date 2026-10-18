import Editor, { EditorMode, TextDirection } from '@/editor'
import { Draw } from '@/editor/core/draw/Draw'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'

const editors: Editor[] = []
async function create(text = 'مرحبا') {
  const container = document.createElement('div')
  document.body.append(container)
  const editor = await Editor.create(container, [{ value: text }], {
    autoDownloadFonts: false,
    pageNumber: { disabled: true },
    fonts: []
  })
  editors.push(editor)
  return {
    editor,
    ui: container.querySelector<HTMLElement>('.ce-font-diagnostics')!
  }
}
afterEach(() => {
  editors.splice(0).forEach(editor => editor.destroy())
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('built-in font diagnostics lifecycle', () => {
  it('shows accessible localized details, refreshes locale/direction and excludes print', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { editor, ui } = await create()
    expect(ui.hidden).toBe(false)
    expect(ui.querySelector('[role=status]')?.textContent).toContain('字体包')
    expect(ui.textContent).toContain('阿拉伯文字')
    expect(ui.textContent).toContain('U+')
    const source = editor.command.getValue().data
    editor.command.executeSetLocale('en')
    expect(ui.textContent).toContain('Arabic')
    editor.command.executeUpdateOptions({ direction: TextDirection.RTL })
    expect(ui.dir).toBe('rtl')
    expect(ui.parentElement?.getAttribute('dir')).toBeNull()
    editor.command.executeMode(EditorMode.PRINT)
    expect(ui.hidden).toBe(true)
    editor.command.executeMode(EditorMode.EDIT)
    expect(ui.hidden).toBe(false)
    expect(editor.command.getValue().data).toEqual(source)
    expect(ui.closest('.ce-page-container')).toBeNull()
  })

  it('deduplicates redraws/repeated characters, isolates instances and clears after deletion', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const render = vi.spyOn(Draw.prototype, 'render')
    const { editor, ui } = await create('𠀀')
    expect(warn).toHaveBeenCalledTimes(1)
    const draw = render.mock.instances[0] as Draw
    draw.render({ isSubmitHistory: false })
    editor.command.executeSetValue({ main: [{ value: '𠀀𠀀' }] })
    expect(warn).toHaveBeenCalledTimes(1)
    const second = await create('𠀀')
    expect(warn).toHaveBeenCalledTimes(2)
    editor.command.executeSetValue({ main: [] })
    expect(ui.querySelector('details')?.hidden).toBe(true)
    expect(ui.textContent).toContain('已补全')
    expect(second.ui.querySelector('details')?.hidden).toBe(false)
    editor.destroy()
    expect(ui.isConnected).toBe(false)
    expect(second.ui.isConnected).toBe(true)
  })

  it('updates after manual fonts without user subscriptions or content changes', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { editor, ui } = await create()
    const source = editor.command.getValue().data
    const bytes = readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
    await editor.register.fonts([
      { family: 'Manual', data: new Uint8Array(bytes).buffer }
    ])
    expect(ui.querySelector('details')?.hidden).toBe(true)
    expect(ui.querySelector('[role=status]')?.textContent).toContain('已补全')
    expect(editor.command.getValue().data).toEqual(source)
  })
  it('bounds warning samples and code points and omits source text/locations', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const text = Array.from({ length: 48 }, (_, i) =>
      String.fromCodePoint(0x20000 + i)
    ).join('')
    await create(text)
    expect(warn).toHaveBeenCalledTimes(1)
    const payload = warn.mock.calls[0][1]
    expect(payload.samples.length).toBeLessThanOrEqual(16)
    expect(payload.codePoints.length).toBeLessThanOrEqual(32)
    expect(payload).not.toHaveProperty('locations')
    expect(JSON.stringify(warn.mock.calls)).not.toContain(text)
  })
})
