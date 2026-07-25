import { ControlType } from '@/editor/dataset/enum/Control'
import { ElementType } from '@/editor/dataset/enum/Element'
import type { IElement } from '@/editor/interface/Element'

// 构造级联测试数据：控件1（select 有无高血压 conceptId=hypertension）
// + 控件2（select 分级 conceptId=hypertensionLevel，初始隐藏）
// code 为控件1的初始选中值：'1' 有 / '0' 无
export function buildData(code: '0' | '1' = '1'): IElement[] {
  const selected =
    code === '1' ? { value: '有', code: '1' } : { value: '无', code: '0' }
  return [
    {
      type: ElementType.CONTROL,
      value: '',
      controlId: 'c1',
      control: {
        conceptId: 'hypertension',
        type: ControlType.SELECT,
        value: [selected as any],
        code,
        valueSets: [
          { value: '有', code: '1' },
          { value: '无', code: '0' }
        ],
        cascade: [
          {
            expression: "getValue(@self) == '1'",
            actions: [
              {
                conceptId: 'hypertensionLevel',
                effects: { hide: false, required: true }
              }
            ]
          }
        ]
      } as any
    },
    {
      type: ElementType.CONTROL,
      value: '',
      controlId: 'c2',
      control: {
        conceptId: 'hypertensionLevel',
        type: ControlType.SELECT,
        value: null,
        hide: true,
        valueSets: [
          { value: 'Ⅰ级', code: '1' },
          { value: 'Ⅱ级', code: '2' }
        ]
      } as any
    }
  ]
}
