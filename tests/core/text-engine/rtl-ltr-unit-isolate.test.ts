import { describe, expect, it } from 'vitest'
import { TextDirection } from '../../../src/editor/dataset/enum/TextDirection'
import { buildArabicEmrElementList } from '../../../src/mock-ar-emr'
import { ElementBridge } from '../../../src/editor/core/text-engine-host/ElementBridge'
import { BidiResolver } from '../../../src/editor/core/text-engine/bidi/BidiResolver'
import { mergeOption } from '../../../src/editor/utils/option'
import { formatElementList } from '../../../src/editor/utils/element'

describe('RTL LTR-unit isolate (BMI line)', () => {
  it('keeps cm/kg/BMI as separate LRI islands so RTL reading order is correct', () => {
    const elementList = buildArabicEmrElementList('')
    formatElementList(elementList, {
      editorOptions: mergeOption({}),
      isForceCompensation: true
    })

    const paragraphs = new ElementBridge().scanParagraphs(elementList, {
      defaultDirection: TextDirection.AUTO,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000'
    })
    const para = paragraphs.find(p => p.text.includes('الطول:'))
    expect(para).toBeTruthy()
    expect(para!.direction).toBe('rtl')

    // cm / kg / BMI: 各自独立成 LRI…PDI 岛，且 `،` 留在岛外
    expect(para!.text).toContain('\u2066cm\u2069')
    expect(para!.text).toContain('\u2066kg\u2069')
    expect(para!.text).toContain('\u2066BMI: \u2069')
    expect(para!.text).toContain('\u2066cm\u2069\u060c')
    expect(para!.text).toContain('\u2066kg\u2069\u060c')

    const bidi = new BidiResolver()
    const visual = bidi
      .getVisualIndices(para!.text, para!.direction)
      .map(i => para!.text[i])
      .join('')
    // 右读顺序：… {الوزن} kg، BMI: {تلقائي} …
    // 屏幕从左到右：BMI 岛应位于 kg 岛左侧；若被合并成 kg، BMI 则顺序相反
    expect(visual.indexOf('BMI')).toBeGreaterThan(-1)
    expect(visual.indexOf('kg')).toBeGreaterThan(-1)
    expect(visual.indexOf('BMI')).toBeLessThan(visual.indexOf('kg'))
  })
})
