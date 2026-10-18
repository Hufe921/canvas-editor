import Editor, { type IEditorOption } from '@/editor'
import { mergeOption } from '@/editor/utils/option'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'

let editor: Editor | undefined
afterEach(() => {
  editor?.destroy()
  editor = undefined
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

describe('T20 native-only engine', () => {
  it.each(['textEngine', 'renderMode'])(
    'rejects the removed %s configuration with a migration message',
    name => {
      for (const value of ['legacy', 'harfbuzz', 'canvas', undefined]) {
        expect(() => mergeOption({ [name]: value } as IEditorOption)).toThrow(
          `${name} has been removed`
        )
      }
    }
  )

  it('initializes, paints and edits using default engine selection without Canvas text APIs', async () => {
    for (const method of ['measureText', 'fillText', 'strokeText'] as const)
      vi.spyOn(CanvasRenderingContext2D.prototype, method).mockImplementation(
        () => {
          throw new Error(`Browser text API reached: ${method}`)
        }
      )
    const container = document.createElement('div')
    document.body.append(container)
    editor = await Editor.create(container, [{ value: 'Hello مرحبا' }], {
      autoDownloadFonts: false,
      defaultFont: 'Native',
      fonts: [
        {
          family: 'Native',
          data: new Uint8Array(
            readFileSync('public/fonts/NotoNaskhArabic-Regular.ttf')
          ).buffer
        }
      ]
    })
    expect(editor.state).toBe('ready')
    editor.command.executeSetRange(0, 1)
    editor.command.executeBold()
    expect(editor.command.getValue().data.main.length).toBeGreaterThan(0)
    for (const method of ['measureText', 'fillText', 'strokeText'] as const)
      expect(CanvasRenderingContext2D.prototype[method]).not.toHaveBeenCalled()
  })

  it('preserves frozen historical migration fixtures', () => {
    const artifacts = {
      'tests/core/migration/__snapshots__/baseline.test.ts.snap':
        '148fcc33802b3574b5c624a34d5656cbf0d22876c9b3aff656a864e3876e6157',
      'tests/fixtures/migration/t10-geometry.json':
        '52e9c24736033682b4cc28479f0d746c9f53a774413cf32ed270589c74f1c415'
    }
    for (const [file, hash] of Object.entries(artifacts))
      expect(
        createHash('sha256').update(readFileSync(file)).digest('hex')
      ).toBe(hash)
  })

  it('ships no deleted engine implementation, selectors or Canvas text calls', () => {
    for (const file of [
      'core/draw/IncrementalRowComputer.ts',
      'core/draw/particle/TextParticle.ts',
      'core/text-engine/shape/BrowserTextShaper.ts',
      'core/layout/FlowConstraints.ts',
      'core/layout/BlockMeasure.ts'
    ])
      expect(existsSync(join('src/editor', file))).toBe(false)
    const visit = (directory: string) => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name)
        if (entry.isDirectory()) visit(path)
        else if (path.endsWith('.ts')) {
          const source = readFileSync(path, 'utf8')
          expect(source, path).not.toMatch(
            /\b(?:BrowserTextShaper|IncrementalRowComputer|TextEngineMode|RenderMode|forceLegacy|IRowComputeState|IComputeRowListResume)\b/
          )
          expect(source, path).not.toMatch(/\.\s*(?:fillText|strokeText)\s*\(/)
        }
      }
    }
    visit('src/editor')
  })
})
