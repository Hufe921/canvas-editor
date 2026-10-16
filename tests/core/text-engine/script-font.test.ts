import { describe, expect, it } from 'vitest'
import { TextScript } from '../../../src/editor/dataset/enum/TextScript'
import {
  detectScript,
  needsOpenTypeShaping,
  resolveFontForScript
} from '../../../src/editor/core/text-engine/utils/scriptFont'

describe('scriptFont', () => {
  it('detects major scripts', () => {
    expect(detectScript('م')).toBe(TextScript.ARAB)
    expect(detectScript('न')).toBe(TextScript.DEVA)
    expect(detectScript('ก')).toBe(TextScript.THAI)
    expect(detectScript('A')).toBe(TextScript.LATN)
    expect(detectScript('中')).toBe(TextScript.HANS)
  })

  it('marks complex scripts as needing OT shaping', () => {
    expect(needsOpenTypeShaping(TextScript.ARAB)).toBe(true)
    expect(needsOpenTypeShaping(TextScript.DEVA)).toBe(true)
    expect(needsOpenTypeShaping(TextScript.THAI)).toBe(true)
    expect(needsOpenTypeShaping(TextScript.LATN)).toBe(false)
    expect(needsOpenTypeShaping(TextScript.HANS)).toBe(false)
  })

  it('resolves font by scripts tag', () => {
    const fonts = [
      {
        family: 'Noto Naskh Arabic',
        scripts: [TextScript.ARAB]
      },
      {
        family: 'Noto Sans Devanagari',
        scripts: [TextScript.DEVA]
      }
    ]
    expect(resolveFontForScript(TextScript.ARAB, fonts, 'sans-serif')).toBe(
      'Noto Naskh Arabic'
    )
    expect(resolveFontForScript(TextScript.DEVA, fonts, 'sans-serif')).toBe(
      'Noto Sans Devanagari'
    )
    expect(resolveFontForScript(TextScript.HANS, fonts, 'sans-serif')).toBe(
      'sans-serif'
    )
  })

  it('does not reuse Arabic face for other complex scripts', () => {
    const fonts = [
      {
        family: 'Noto Naskh Arabic',
        scripts: [TextScript.ARAB]
      }
    ]
    expect(resolveFontForScript(TextScript.DEVA, fonts, 'sans-serif')).toBe(
      'sans-serif'
    )
    expect(resolveFontForScript(TextScript.THAI, fonts, 'sans-serif')).toBe(
      'sans-serif'
    )
  })
})
