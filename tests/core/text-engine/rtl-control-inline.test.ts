import { describe, expect, it } from 'vitest'
import { ControlComponent } from '../../../src/editor/dataset/enum/Control'
import { TextDirection } from '../../../src/editor/dataset/enum/TextDirection'
import { buildArabicEmrElementList } from '../../../src/mock-ar-emr'
import { ElementBridge } from '../../../src/editor/core/text-engine-host/ElementBridge'
import { BidiResolver } from '../../../src/editor/core/text-engine/bidi/BidiResolver'
import { mergeOption } from '../../../src/editor/utils/option'
import { formatElementList } from '../../../src/editor/utils/element'

describe('rtl controls', () => {
  it('keeps an Arabic control in the paragraph that surrounds it', () => {
    const elementList = buildArabicEmrElementList('')
    formatElementList(elementList, {
      editorOptions: mergeOption({}),
      isForceCompensation: true
    })

    const controlIndex = elementList.findIndex(
      element =>
        element.control?.conceptId === '1' &&
        element.controlComponent === ControlComponent.PREFIX
    )
    expect(controlIndex).toBeGreaterThan(-1)

    const paragraphs = new ElementBridge().scanParagraphs(elementList, {
      defaultDirection: TextDirection.AUTO,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000'
    })
    const paragraph = paragraphs.find(
      candidate =>
        candidate.startIndex <= controlIndex &&
        candidate.endIndex >= controlIndex
    )

    expect(paragraph?.direction).toBe('rtl')
    expect(paragraph?.text).toContain('حمى لمدة ثلاثة أيام')
    expect(paragraph?.text).toContain('ملاحظات إضافية')
    // 阿拉伯内容控件在 RTL 段不包 LRI/PDI：
    // 隔离会把控件按 LTR 排，空值光标落在左侧；RTL 应右对齐
    expect(paragraph?.text).toContain('{ملاحظات إضافية}')
    expect(paragraph?.text).not.toContain('\u2066')
    expect(paragraph?.text).not.toContain('\u2069')
  })

  it('keeps title and body in separate paragraphs', () => {
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

    const titlePara = paragraphs.find(p =>
      p.text.includes('الشكوى الرئيسية')
    )
    const bodyPara = paragraphs.find(p => p.text.includes('حمى لمدة ثلاثة أيام'))
    const examTitle = paragraphs.find(p => p.text.includes('الفحص السريري'))
    const vitals = paragraphs.find(p => p.text.includes('درجة الحرارة:'))

    expect(titlePara).toBeTruthy()
    expect(bodyPara).toBeTruthy()
    expect(titlePara).not.toBe(bodyPara)
    expect(titlePara!.text).not.toContain('حمى')
    expect(bodyPara!.text).not.toContain('الشكوى الرئيسية')

    expect(examTitle).toBeTruthy()
    expect(vitals).toBeTruthy()
    expect(examTitle).not.toBe(vitals)
    expect(vitals!.direction).toBe('rtl')
  })

  it('keeps {placeholder} brace order for Arabic SELECT control', () => {
    const elementList = buildArabicEmrElementList('')
    formatElementList(elementList, {
      editorOptions: mergeOption({}),
      isForceCompensation: true
    })

    const controlIndex = elementList.findIndex(
      element =>
        element.control?.conceptId === '2' &&
        element.controlComponent === ControlComponent.PREFIX
    )
    const paragraphs = new ElementBridge().scanParagraphs(elementList, {
      defaultDirection: TextDirection.AUTO,
      defaultFont: 'sans-serif',
      defaultSize: 16,
      defaultColor: '#000'
    })
    const paragraph = paragraphs.find(
      candidate =>
        candidate.startIndex <= controlIndex &&
        candidate.endIndex >= controlIndex
    )
    expect(paragraph).toBeTruthy()

    // 阿拉伯占位符控件在 RTL 段不包 LRI/PDI（与文本控件一致，光标右对齐）
    expect(paragraph!.text).toContain('{نعم/لا}')
    expect(paragraph!.text).not.toContain('\u2066')
    expect(paragraph!.text).not.toContain('\u2069')
    const bidi = new BidiResolver()
    const visualIndices = bidi.getVisualIndices(
      paragraph!.text,
      paragraph!.direction
    )
    const visual = visualIndices.map(i => paragraph!.text[i]).join('')
    // RTL 自然布局：右读为 {نعم/لا}（逻辑串本身保持 {…}）
    expect(visual).not.toContain('}لا/نعم{')
  })
})
