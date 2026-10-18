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
    expect(detectScript('中')).toBe(TextScript.HANI)
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

  it('recognizes supplementary scripts and distinguishes unknown from common', () => {
    expect(detectScript('𠀀')).toBe(TextScript.HANI)
    expect(detectScript('𞸀')).toBe(TextScript.ARAB)
    expect(detectScript('あ')).toBe(TextScript.HIRA)
    expect(detectScript('カ')).toBe(TextScript.KANA)
    expect(detectScript('한')).toBe(TextScript.HANG)
    expect(detectScript('😀')).toBe(TextScript.ZSYE)
    expect(detectScript('Ա')).toBe(TextScript.ZZZZ)
    expect(detectScript('123 !')).toBe(TextScript.ZYYY)
  })

  it('keeps the legacy hans font tag usable for language-neutral Han', () => {
    expect(
      resolveFontForScript(
        TextScript.HANI,
        [{ family: 'Han face', scripts: [TextScript.HANS] }],
        'default'
      )
    ).toBe('Han face')
  })
})
