import Editor, { EditorMode, ElementType } from '@/editor'
import { Draw } from '@/editor/core/draw/Draw'
import type { IElement } from '@/editor/interface/Element'
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'

const bytes = readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
const data = bytes.buffer.slice(
  bytes.byteOffset,
  bytes.byteOffset + bytes.length
)
const editors: Editor[] = []
async function create(main: IElement[] = [{ value: 'مرحبا' }]) {
  const container = document.createElement('div')
  document.body.append(container)
  const editor = await Editor.create(
    container,
    {
      main,
      header: [{ value: '𠀀' }],
      footer: [{ value: '汉' }]
    },
    {
      autoDownloadFonts: false,
      pageNumber: { disabled: true },
      defaultFont: 'Arabic',
      fonts: []
    }
  )
  editors.push(editor)
  return editor
}
afterEach(() => {
  editors.splice(0).forEach(editor => editor.destroy())
  document.body.replaceChildren()
  vi.restoreAllMocks()
})
describe('public coverage reporting and recovery', () => {
  it('provides a late-query snapshot for body, header, footer and nested cells', async () => {
    const editor = await create([
      {
        type: ElementType.TABLE,
        value: '',
        colgroup: [{ width: 200 }],
        trList: [
          {
            height: 30,
            tdList: [{ colspan: 1, rowspan: 1, value: [{ value: 'مرحبا' }] }]
          }
        ]
      }
    ])
    const report = editor.getFontCoverageReport()
    expect(report.issues).toHaveLength(2)
    const scopes = report.issues.flatMap(issue =>
      issue.locations.map(loc => loc.scope)
    )
    expect(scopes).toContain('header')
    expect(scopes).toContain('footer')
    expect(scopes.some(scope => scope.startsWith('td:'))).toBe(true)
    expect(
      report.issues.every(issue => issue.locations.every(loc => !!loc.nodeId))
    ).toBe(true)
  })

  it('clears only resolved issues, emits detached snapshots, and preserves content and selection', async () => {
    const editor = await create()
    editor.command.executeSetRange(0, 1)
    const before = editor.command.getValue().data
    const listener = vi.fn(report => {
      report.issues.length = 0
    })
    const changed = vi.fn()
    editor.listener.fontCoverageChange = listener
    editor.eventBus.on('fontCoverageChange', changed)
    await editor.register.fonts([{ family: 'Arabic', data }])
    expect(listener).toHaveBeenCalledTimes(1)
    expect(changed).toHaveBeenCalledTimes(1)
    const report = editor.getFontCoverageReport()
    expect(report.issues.some(issue => issue.script === 'arab')).toBe(false)
    expect(report.issues.some(issue => issue.script === 'hani')).toBe(true)
    expect(changed.mock.calls[0][0]).toEqual(report)
    expect(editor.command.getValue().data).toEqual(before)
    expect(editor.command.getRange()).toMatchObject({
      startIndex: 0,
      endIndex: 1
    })
    report.issues.length = 0
    expect(editor.getFontCoverageReport().issues.length).toBeGreaterThan(0)
  })

  it('does not emit on repeated renders or duplicate registration', async () => {
    const render = vi.spyOn(Draw.prototype, 'render')
    const editor = await create()
    const draw = render.mock.instances[0] as Draw
    const changed = vi.fn()
    editor.eventBus.on('fontCoverageChange', changed)
    draw.render({ isSubmitHistory: false, isSetCursor: false })
    draw.render({
      isCompute: false,
      isSubmitHistory: false,
      isSetCursor: false
    })
    expect(changed).not.toHaveBeenCalled()
    await editor.register.fonts([{ family: 'Arabic', data }])
    changed.mockClear()
    await editor.register.fonts([{ family: 'Arabic', data }])
    expect(changed).not.toHaveBeenCalled()
  })

  it('clears replaced/deleted content and reevaluates hidden text after mode changes', async () => {
    const editor = await create([{ value: 'مرحبا', hide: true }])
    editor.command.executeMode(EditorMode.EDIT)
    expect(
      editor
        .getFontCoverageReport()
        .issues.some(issue => issue.script === 'arab')
    ).toBe(false)
    editor.command.executeMode(EditorMode.DESIGN)
    expect(
      editor
        .getFontCoverageReport()
        .issues.some(issue => issue.script === 'arab')
    ).toBe(true)
    editor.command.executeSetValue({ main: [], header: [], footer: [] })
    expect(editor.getFontCoverageReport().issues).toEqual([])
  })

  it('reports failed manual registrations even when the font revision stays unchanged', async () => {
    const editor = await create()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await editor.register.fonts([
      { family: 'Broken', data: new ArrayBuffer(1) }
    ])
    expect(
      editor
        .getFontCoverageReport()
        .issues.some(issue => issue.reason === 'loadFailed')
    ).toBe(true)
    expect(editor.state).toBe('ready')
    editor.destroy()
    expect(() => editor.getFontCoverageReport()).toThrow('destroyed')
  })

  it('creates typed placeholders in host rows with original source indices', async () => {
    const render = vi.spyOn(Draw.prototype, 'render')
    await create([{ value: '𠀀' }])
    const draw = render.mock.instances[0] as Draw
    const rows = draw.getRowList()
    const boxes = rows.flatMap(row => row.missingGlyphs || [])
    expect(boxes).toHaveLength(1)
    expect(boxes[0]).toMatchObject({
      kind: 'missingGlyph',
      text: '𠀀',
      source: { scope: 'main', start: 1, end: 2 }
    })
    expect(boxes[0].advance).toBeGreaterThan(0)
    expect(boxes[0].carets.map(caret => caret.position.offset)).toEqual([0, 2])
    const report = draw.getFontCoverageReport()
    expect(boxes[0].revision).toEqual({
      documentRevision: report.documentRevision,
      fontRevision: report.fontRevision
    })
    expect(boxes[0].source.nodeId).toBe(
      report.issues
        .find(issue => issue.locations.some(loc => loc.scope === 'main'))
        ?.locations.find(loc => loc.scope === 'main')?.nodeId
    )
    expect(
      report.issues.some(issue => issue.id === boxes[0].diagnosticId)
    ).toBe(true)
  })
})
