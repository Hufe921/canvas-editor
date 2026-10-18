import Editor, { EditorRuntimeError, type IEditorOption } from '@/editor'
import { Draw } from '@/editor/core/draw/Draw'
import { Ruler } from '@/editor/core/draw/ruler/Ruler'
import { FontManager } from '@/editor/core/text-engine/font/FontManager'
import { harfBuzzRuntime } from '@/editor/core/text-engine/HarfBuzzRuntime'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'

const bytes = readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
const data = bytes.buffer.slice(
  bytes.byteOffset,
  bytes.byteOffset + bytes.length
)
const editors: Editor[] = []
const gates: Array<() => void> = []
const options: IEditorOption = {
  autoDownloadFonts: false,
  defaultFont: 'Noto Naskh Arabic',
  fonts: [{ family: 'Noto Naskh Arabic', data }],
  header: { disabled: true },
  footer: { disabled: true }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

function create(extra: IEditorOption = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const editor = new Editor(
    container,
    { main: [{ value: 'مرحبا بالعالم' }] },
    {
      ...options,
      ...extra
    }
  )
  editors.push(editor)
  return { editor, container }
}

function slowFonts() {
  const gate = deferred<void>()
  gates.push(() => gate.resolve())
  const init = FontManager.prototype.init
  vi.spyOn(FontManager.prototype, 'init').mockImplementation(async function (
    this: FontManager,
    ...args
  ) {
    await gate.promise
    await init.apply(this, args)
  })
  return gate
}

afterEach(async () => {
  vi.useRealTimers()
  editors.forEach(editor => editor.destroy())
  gates.forEach(resolve => resolve())
  await Promise.allSettled(editors.map(editor => editor.ready))
  // Flush late font/initialization callbacks before restoring spies.
  await new Promise(resolve => setTimeout(resolve, 0))
  editors.length = 0
  gates.length = 0
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe('Editor ready lifecycle', () => {
  it('does no row layout before fonts/WASM and completes ready after first layout', async () => {
    const gate = slowFonts()
    const layout = vi.spyOn(Draw.prototype, 'computeRowList')
    const fill = vi.spyOn(CanvasRenderingContext2D.prototype, 'fillText')
    const { editor, container } = create()
    expect(editor.state).toBe('initializing')
    expect(layout).not.toHaveBeenCalled()
    expect(fill).not.toHaveBeenCalled()
    expect(container.querySelector('textarea')!.readOnly).toBe(true)
    gate.resolve()
    await editor.ready
    expect(editor.state).toBe('ready')
    expect(editor.initializationError).toBeNull()
    expect(layout).toHaveBeenCalled()
    expect(
      container.querySelectorAll('.ce-page-container canvas').length
    ).toBeGreaterThan(0)
    expect(container.querySelector('textarea')!.readOnly).toBe(false)
  })

  it('blocks mutation/geometry commands, preserves the model and supports async measurement', async () => {
    const gate = slowFonts()
    const { editor } = create()
    const original = editor.command.getValue().data
    expect(() =>
      editor.command.executeSetValue({ main: [{ value: 'lost' }] })
    ).toThrowError(EditorRuntimeError)
    expect(() =>
      editor.command.executeComputeElementListHeight([{ value: 'نص' }])
    ).toThrow('await editor.ready')
    await expect(editor.command.getImage()).rejects.toMatchObject({
      code: 'EDITOR_NOT_READY'
    })
    // Replacing the macro interceptor cannot remove the readiness guard.
    editor.command.setInterceptor(() => {})
    expect(() => editor.command.executeSetRange(0, 1)).toThrow(
      'await editor.ready'
    )
    const measurement = editor.command.executeComputeElementListHeightAsync([
      { value: 'نص' }
    ])
    gate.resolve()
    await editor.ready
    expect(editor.command.getValue().data).toEqual(original)
    const height = editor.command.executeComputeElementListHeight([
      { value: 'نص' }
    ])
    expect(typeof height).toBe('number')
    expect(height).toBeGreaterThan(0)
    await expect(measurement).resolves.toBe(height)
  })

  it('prevents DOM editing and pointer input while initializing', async () => {
    const gate = slowFonts()
    const { editor, container } = create()
    const textarea = container.querySelector('textarea')!
    const original = editor.command.getValue().data
    for (const type of [
      'keydown',
      'beforeinput',
      'input',
      'paste',
      'mousedown'
    ]) {
      const event = new Event(type, { bubbles: true, cancelable: true })
      expect(textarea.dispatchEvent(event)).toBe(false)
      expect(event.defaultPrevented).toBe(true)
    }
    expect(editor.command.getValue().data).toEqual(original)
    gate.resolve()
    await editor.ready
  })

  it('reports WASM failure through ready/state/cause without first painting', async () => {
    const failure = new Error('WASM load failed')
    vi.spyOn(harfBuzzRuntime, 'initialize').mockRejectedValue(failure)
    const layout = vi.spyOn(Draw.prototype, 'computeRowList')
    const { editor } = create()
    await expect(editor.ready).rejects.toMatchObject({
      code: 'EDITOR_INITIALIZATION_FAILED',
      cause: failure
    })
    expect(editor.state).toBe('failed')
    expect(editor.initializationError?.cause).toBe(failure)
    expect(layout).not.toHaveBeenCalled()
    expect(() => editor.command.getValue()).toThrow(editor.initializationError!)
  })

  it('reports first-layout failures as initialization failures', async () => {
    const failure = new Error('Layout failed')
    vi.spyOn(Draw.prototype, 'computeRowList').mockImplementation(() => {
      throw failure
    })
    const { editor } = create()
    await expect(editor.ready).rejects.toMatchObject({ cause: failure })
    expect(editor.state).toBe('failed')
  })

  it.each([{ fonts: [] }, { fonts: [{ family: 'Uncovered' }] }])(
    'allows missing fonts without failing ready: %j',
    async ({ fonts }) => {
      const { editor } = create({ fonts })
      await expect(editor.ready).resolves.toBeUndefined()
      expect(editor.state).toBe('ready')
    }
  )

  it('treats a font fetch failure as recoverable, separately from WASM failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('font offline')))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { editor } = create({
      fonts: [{ family: 'Offline', url: '/offline.ttf' }]
    })
    await expect(editor.ready).resolves.toBeUndefined()
    expect(editor.state).toBe('ready')
    expect(console.warn).toHaveBeenCalled()
  })

  it('rejects pending ready promptly on destroy and ignores late initialization', async () => {
    const gate = slowFonts()
    const layout = vi.spyOn(Draw.prototype, 'computeRowList')
    const { editor, container } = create()
    editor.destroy()
    expect(editor.state).toBe('destroyed')
    await expect(editor.ready).rejects.toMatchObject({
      code: 'EDITOR_DESTROYED'
    })
    gate.resolve()
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(container.childElementCount).toBe(0)
    expect(layout).not.toHaveBeenCalled()
    expect(() => editor.command.getValue()).toThrow('destroyed')
    await expect(
      editor.command.executeComputeElementListHeightAsync([])
    ).rejects.toMatchObject({ code: 'EDITOR_DESTROYED' })
    expect(() => editor.destroy()).not.toThrow()
  })

  it('initializes concurrent editors independently with the shared WASM runtime', async () => {
    const gate = slowFonts()
    const first = create().editor
    const second = create().editor
    expect(first.state).toBe('initializing')
    expect(second.state).toBe('initializing')
    gate.resolve()
    await Promise.all([first.ready, second.ready])
    expect(first.state).toBe('ready')
    expect(second.state).toBe('ready')
    first.destroy()
    expect(
      second.command.executeComputeElementListHeight([{ value: 'نص' }])
    ).toBeGreaterThan(0)
  })

  it('keeps a ready instance usable when another initializing instance is destroyed', async () => {
    const first = create().editor
    await first.ready
    const gate = slowFonts()
    const second = create().editor
    second.destroy()
    await expect(second.ready).rejects.toMatchObject({
      code: 'EDITOR_DESTROYED'
    })
    gate.resolve()
    expect(first.state).toBe('ready')
    expect(
      first.command.executeComputeElementListHeight([{ value: 'نص' }])
    ).toBeGreaterThan(0)
    first.destroy()
    await expect(first.ready).resolves.toBeUndefined()
    expect(() => first.command.getRange()).toThrow('destroyed')
  })

  it('supports Editor.create and cleans up failed asynchronous creation', async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const editor = await Editor.create(container, [{ value: 'مرحبا' }], options)
    editors.push(editor)
    expect(editor.state).toBe('ready')
    editor.command.executeSetRange(0, 1)
    editor.destroy()
    vi.spyOn(harfBuzzRuntime, 'initialize').mockRejectedValue(
      new Error('broken')
    )
    await expect(
      Editor.create(container, [{ value: 'مرحبا' }], options)
    ).rejects.toMatchObject({ code: 'EDITOR_INITIALIZATION_FAILED' })
    expect(container.childElementCount).toBe(0)
  })

  it('delivers first render notifications only when geometry commands are usable', async () => {
    vi.useFakeTimers()
    const { editor } = create()
    const states: string[] = []
    editor.eventBus.on('renderChange', () => {
      states.push(editor.state)
      expect(
        editor.command.executeComputeElementListHeight([{ value: 'نص' }])
      ).toBeGreaterThan(0)
    })
    await editor.ready
    expect(states).toEqual([])
    await vi.runOnlyPendingTimersAsync()
    expect(states).toEqual(['ready'])
  })

  it('does not rebuild ruler/UI from scheduled first-render callbacks after destroy', async () => {
    vi.useFakeTimers()
    const ruler = vi.spyOn(Ruler.prototype, 'render')
    const { editor, container } = create({ ruler: { disabled: false } })
    const notify = vi.fn()
    editor.listener.pageSizeChange = notify
    await editor.ready
    editor.destroy()
    ruler.mockClear()
    await vi.runOnlyPendingTimersAsync()
    expect(ruler).not.toHaveBeenCalled()
    expect(notify).not.toHaveBeenCalled()
    expect(container.childElementCount).toBe(0)
  })

  it('always initializes the native engine before accepting edits', async () => {
    const { editor } = create()
    expect(editor.state).toBe('initializing')
    await editor.ready
    expect(editor.state).toBe('ready')
    expect(() => editor.command.executeSetRange(0, 1)).not.toThrow()
  })
})
