import { describe, it, expect } from 'vitest'
import { formatElementList, zipElementList } from '@/editor/utils/element'
import { ElementType } from '@/editor/dataset/enum/Element'
import { ControlType } from '@/editor/dataset/enum/Control'
import type { IElement } from '@/editor/interface/Element'

const editorOptions: any = {
  defaultRange: { startIndex: 0, endIndex: 0 },
  width: 800,
  height: 1000,
  margins: [80, 100, 80, 100],
  control: {
    prefix: '【',
    postfix: '】',
    bracketColor: '#000000',
    placeholderColor: '#999'
  },
  checkbox: { gap: 5 },
  radio: { gap: 5 },
  table: { defaultTrMinHeight: 30, defaultColMinWidth: 40 },
  title: {
    1: { size: 26 },
    2: { size: 24 },
    3: { size: 22 },
    4: { size: 20 },
    5: { size: 18 },
    6: { size: 16 }
  }
}

describe('嵌套控件 format + zip 往返', () => {
  it('内层 value=null 应保留嵌套结构', () => {
    const input: IElement[] = [
      {
        type: ElementType.CONTROL,
        value: '',
        control: {
          type: ControlType.TEXT,
          value: [
            { value: 'A' },
            {
              type: ElementType.CONTROL,
              value: '',
              control: {
                type: ControlType.TEXT,
                value: null,
                placeholder: '内层'
              }
            },
            { value: 'C' }
          ],
          placeholder: '外层'
        }
      }
    ]
    const formatted = [...input] as IElement[]
    formatElementList(formatted, { editorOptions })
    const zipped = zipElementList(formatted)
    expect(zipped.length).toBe(1)
    expect(zipped[0].type).toBe(ElementType.CONTROL)
    const outerValue = zipped[0].control!.value!
    const hasInner = outerValue.some(el => el.type === ElementType.CONTROL)
    expect(hasInner).toBe(true)
  })

  it('内层 value=[B] 应保留嵌套结构', () => {
    const input: IElement[] = [
      {
        type: ElementType.CONTROL,
        value: '',
        control: {
          type: ControlType.TEXT,
          value: [
            { value: 'A' },
            {
              type: ElementType.CONTROL,
              value: '',
              control: {
                type: ControlType.TEXT,
                value: [{ value: 'B' }],
                placeholder: '内层'
              }
            },
            { value: 'C' }
          ],
          placeholder: '外层'
        }
      }
    ]
    const formatted = [...input] as IElement[]
    formatElementList(formatted, { editorOptions })
    console.log('AFTER FORMAT:', JSON.stringify(formatted, null, 2))
    const zipped = zipElementList(formatted)
    console.log('AFTER ZIP:', JSON.stringify(zipped, null, 2))
    expect(zipped.length).toBe(1)
    expect(zipped[0].type).toBe(ElementType.CONTROL)
    const outerValue = zipped[0].control!.value!
    const hasInner = outerValue.some(el => el.type === ElementType.CONTROL)
    expect(hasInner).toBe(true)
  })
})
