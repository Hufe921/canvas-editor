import { describe, expect, it } from 'vitest'
import { TextEngineMode } from '../../../src/editor/dataset/enum/TextDirection'
import { TextScript } from '../../../src/editor/dataset/enum/TextScript'
import { WordBreak } from '../../../src/editor/dataset/enum/Editor'
import { LayoutHostAdapter } from '../../../src/editor/core/text-engine-host/LayoutHostAdapter'
import type { IEditorOption } from '../../../src/editor/interface/Editor'
import type { DeepRequired } from '../../../src/editor/interface/Common'

function mockOptions(
  overrides: Partial<DeepRequired<IEditorOption>> = {}
): DeepRequired<IEditorOption> {
  return {
    textEngine: TextEngineMode.HARFBUZZ,
    defaultFont: 'sans-serif',
    defaultSize: 16,
    defaultColor: '#000',
    defaultRowMargin: 1,
    defaultDirection: 'auto',
    scale: 1,
    wordBreak: WordBreak.BREAK_WORD,
    fonts: [
      {
        family: 'Noto Naskh Arabic',
        scripts: [TextScript.ARAB]
      }
    ],
    ...overrides
  } as unknown as DeepRequired<IEditorOption>
}

describe('watermark plain-text layout', () => {
  it('returns null when engine is not ready', () => {
    const adapter = new LayoutHostAdapter(() => mockOptions())
    expect(
      adapter.layoutPlainText({
        text: 'مرحبا',
        fontFamily: 'Microsoft YaHei',
        fontSize: 48,
        color: '#AEB5C0'
      })
    ).toBeNull()
  })

  it('layouts Arabic watermark as rtl with script font', async () => {
    const adapter = new LayoutHostAdapter(() => mockOptions())
    await adapter.ensureReady()
    const layout = adapter.layoutPlainText({
      text: 'مرحبا',
      fontFamily: 'Microsoft YaHei',
      fontSize: 48,
      color: '#AEB5C0'
    })
    expect(layout).not.toBeNull()
    expect(layout!.direction).toBe('rtl')
    expect(layout!.lines[0].glyphs.length).toBeGreaterThan(0)
    expect(
      layout!.lines[0].glyphs.every(
        g => g.style.fontFamily === 'Noto Naskh Arabic'
      )
    ).toBe(true)
  })

  it('splits mixed LTR/RTL watermark into script fonts and bidi runs', async () => {
    const adapter = new LayoutHostAdapter(() => mockOptions())
    await adapter.ensureReady()
    const text = 'Hello مرحبا World'
    const layout = adapter.layoutPlainText({
      text,
      fontFamily: 'Microsoft YaHei',
      fontSize: 36,
      color: '#888'
    })
    expect(layout).not.toBeNull()
    expect(layout!.paragraphText).toBe(text)
    const families = new Set(
      layout!.lines[0].glyphs.map(g => g.style.fontFamily)
    )
    expect(families.has('Noto Naskh Arabic')).toBe(true)
    expect(families.has('Microsoft YaHei')).toBe(true)
    // Visual order: English and Arabic runs both present with positive advances
    const width = layout!.lines[0].width
    expect(width).toBeGreaterThan(0)
    const levels = new Set(layout!.lines[0].glyphs.map(g => g.bidiLevel % 2))
    expect(levels.size).toBeGreaterThan(1)
  })
})
