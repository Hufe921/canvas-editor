import { describe, expect, it } from 'vitest'
import { TextEngineMode } from '../../../src/editor/dataset/enum/TextDirection'
import { TextScript } from '../../../src/editor/dataset/enum/TextScript'
import { WordBreak } from '../../../src/editor/dataset/enum/Editor'
import { LayoutHostAdapter } from '../../../src/editor/core/text-engine-host/LayoutHostAdapter'
import {
  drawPlainText,
  measurePlainText,
  truncatePlainText
} from '../../../src/editor/core/text-engine-host/drawPlainText'
import type { IEditorOption } from '../../../src/editor/interface/Editor'
import type { DeepRequired } from '../../../src/editor/interface/Common'

function mockOptions(): DeepRequired<IEditorOption> {
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
    ]
  } as unknown as DeepRequired<IEditorOption>
}

describe('drawPlainText helpers', () => {
  it('measurePlainText returns null before engine ready', () => {
    const adapter = new LayoutHostAdapter(() => mockOptions())
    expect(
      measurePlainText(adapter, {
        text: 'مرحبا',
        fontFamily: 'sans-serif',
        fontSize: 16,
        color: '#000'
      })
    ).toBeNull()
  })

  it('measurePlainText layouts mixed caption-like text', async () => {
    const adapter = new LayoutHostAdapter(() => mockOptions())
    await adapter.ensureReady()
    const metrics = measurePlainText(adapter, {
      text: 'Fig 1 مرحبا',
      fontFamily: 'Microsoft YaHei',
      fontSize: 14,
      color: '#333'
    })
    expect(metrics).not.toBeNull()
    expect(metrics!.width).toBeGreaterThan(0)
    expect(metrics!.ascent).toBeGreaterThan(0)
  })

  it('truncatePlainText shortens when over maxWidth', async () => {
    const adapter = new LayoutHostAdapter(() => mockOptions())
    await adapter.ensureReady()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const style = {
      text: 'Hello مرحبا World Caption Long',
      fontFamily: 'Microsoft YaHei',
      fontSize: 18,
      color: '#000'
    }
    const full = measurePlainText(adapter, style)!
    const truncated = truncatePlainText(
      adapter,
      ctx,
      style,
      Math.max(20, full.width / 3)
    )
    expect(truncated.endsWith('...')).toBe(true)
    expect(truncated.length).toBeLessThan(style.text.length + 3)
  })

  it('drawPlainText paints when ready', async () => {
    const adapter = new LayoutHostAdapter(() => mockOptions())
    await adapter.ensureReady()
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 50
    const ctx = canvas.getContext('2d')!
    const metrics = drawPlainText(
      adapter,
      ctx,
      {
        text: '第1页',
        fontFamily: 'sans-serif',
        fontSize: 12,
        color: '#000'
      },
      10,
      20
    )
    expect(metrics).not.toBeNull()
    expect(metrics!.width).toBeGreaterThan(0)
  })
})
