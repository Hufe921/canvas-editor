import { describe, it, expect, afterEach } from 'vitest'
import {
  createTestEditor,
  TestEditorContext,
  waitMacroTask
} from '../factories/editor'
import { ControlType } from '@/editor/dataset/enum/Control'
import { ElementType } from '@/editor/dataset/enum/Element'
import { TitleLevel } from '@/editor/dataset/enum/Title'
import type { IElement } from '@/editor/interface/Element'

// 标题区间隐藏：多字符标题 + 标题下内容，初始全部隐藏
function buildTitleData(operationCode: string | null): IElement[] {
  return [
    {
      type: ElementType.CONTROL,
      value: '',
      controlId: 'c1',
      control: {
        conceptId: 'operation',
        type: ControlType.SELECT,
        value: operationCode
          ? [{ value: '有', code: operationCode } as IElement]
          : null,
        code: operationCode,
        valueSets: [
          { value: '有', code: '1' },
          { value: '无', code: '0' }
        ],
        cascade: [
          {
            expression: "getValue(@self) == '1'",
            actions: [
              {
                conceptId: 'operationTitle',
                targetType: 'title',
                effects: { hide: false }
              }
            ]
          }
        ]
      } as IElement['control']
    },
    { value: '\n' },
    {
      type: ElementType.TITLE,
      value: '',
      level: TitleLevel.SECOND,
      title: { conceptId: 'operationTitle' },
      valueList: [
        { value: '手', hide: true },
        { value: '术', hide: true },
        { value: '情', hide: true },
        { value: '况', hide: true }
      ]
    },
    { value: '手术经过。', hide: true },
    { value: '\n' }
  ]
}

function getTitleChars(ctx: TestEditorContext): IElement[] {
  const main = ctx.editor.command.getValue().data.main
  const titleElement = main.find(el => el.title?.conceptId === 'operationTitle')
  return titleElement?.valueList || []
}

function getContentElement(ctx: TestEditorContext): IElement | undefined {
  const main = ctx.editor.command.getValue().data.main
  return main.find(el => el.value?.includes('手术经过'))
}

describe('级联控制标题显隐', () => {
  let ctx: TestEditorContext
  afterEach(() => ctx?.destroy())

  it('初始隐藏：多字符标题的全部字符元素均保持隐藏', async () => {
    ctx = createTestEditor({
      data: { header: [], main: buildTitleData(null), footer: [] }
    })
    const titleChars = getTitleChars(ctx)
    // zip 后同样式字符可能合并为一个元素，断言合并后的文本与隐藏状态
    expect(titleChars.map(el => el.value).join('')).toBe('手术情况')
    expect(titleChars.every(el => el.hide)).toBe(true)
    expect(getContentElement(ctx)?.hide).toBe(true)
  })

  it('表达式成立：标题整行及内容全部显示；还原后重新隐藏', async () => {
    ctx = createTestEditor({
      data: { header: [], main: buildTitleData('1'), footer: [] }
    })
    // 修复前：仅首字符被显示，其余字符被跳过
    expect(getTitleChars(ctx).every(el => !el.hide)).toBe(true)
    expect(getContentElement(ctx)?.hide).toBeFalsy()
    // 改选"无"：还原基线，全部重新隐藏
    ctx.editor.command.executeSetControlValue({ id: 'c1', value: '0' })
    await waitMacroTask()
    expect(getTitleChars(ctx).every(el => el.hide)).toBe(true)
    expect(getContentElement(ctx)?.hide).toBe(true)
  })
})
