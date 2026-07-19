import { describe, it, expect, afterEach } from 'vitest'
import { ListType } from '../../../src/editor/dataset/enum/List'
import { createTestEditor } from '../../factories/editor'

function getAgentInputarea() {
  return document.querySelector('.ce-inputarea') as HTMLTextAreaElement
}

function dispatchEnter() {
  dispatchKey('Enter')
}

function dispatchTab() {
  dispatchKey('Tab')
}

function dispatchKey(key: string) {
  const agentDom = getAgentInputarea()
  if (agentDom) {
    const evt = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true
    })
    agentDom.dispatchEvent(evt)
  }
}

function insertNestedListFixture(ctx: ReturnType<typeof createTestEditor>) {
  ctx.editor.command.executeFocus()
  ctx.editor.command.executeInsertElementList([
    { value: '高血压' },
    { value: '\n' },
    { value: '糖尿病' },
    { value: '\n' },
    { value: '哈哈哈' },
    { value: '\n' },
    { value: '病毒性感冒' },
    { value: '\n' },
    { value: '过敏性鼻炎' },
    { value: '\n' },
    { value: '过敏性鼻息肉' }
  ])
  ctx.editor.command.executeSelectAll()
  ctx.editor.command.executeList(ListType.OL)
  ctx.editor.command.executeSetRange(5, 5)
  dispatchTab()
  ctx.editor.command.executeSetRange(9, 9)
  dispatchTab()
}

describe('Nested sublist Enter reproduction', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  function getListValueList(data: any[] = []) {
    const list = data.find((e: any) => e.type === 'list')
    return list?.valueList || []
  }

  it('inserts a new empty item at the same sublist level after Enter', () => {
    ctx = createTestEditor()
    insertNestedListFixture(ctx)

    ctx.editor.command.executeSetRange(12, 12)
    dispatchEnter()

    const data = ctx.editor.command.getValue().data.main
    const valueList = getListValueList(data)
    const subItem = valueList.find((e: any) => e.value?.includes?.('哈哈哈'))
    expect(subItem?.listLevel).toBe(1)
    expect(subItem?.value).toMatch(/\n$/)
  })

  it('keeps inserted empty sublist row visually indented', () => {
    ctx = createTestEditor()
    insertNestedListFixture(ctx)

    ctx.editor.command.executeSetRange(12, 12)
    dispatchEnter()

    ctx.editor.command.executeSetRange(13, 13)
    const insertedSubItemContext = ctx.editor.command.getRangeContext()
    ctx.editor.command.executeSetRange(14, 14)
    const nextParentItemContext = ctx.editor.command.getRangeContext()

    if (!insertedSubItemContext || !nextParentItemContext) {
      throw new Error('Expected range context for list rows')
    }
    expect(insertedSubItemContext.rangeRects[0].x).toBeGreaterThan(
      nextParentItemContext.rangeRects[0].x
    )
  })

  it('promotes an empty sublist item to a parent item after Enter', () => {
    ctx = createTestEditor()
    insertNestedListFixture(ctx)

    ctx.editor.command.executeSetRange(12, 12)
    dispatchEnter()
    dispatchEnter()

    const data = ctx.editor.command.getValue({
      extraPickAttrs: ['listId']
    }).data.main
    const valueList = getListValueList(data)
    const parentItems = valueList.filter((e: any) => e.listLevel === 0)
    const nextParentText = parentItems[1]?.value || ''
    expect(nextParentText).toMatch(/^\n\n病毒性感冒/)
    expect(parentItems[1]?.listId).toBe(parentItems[0]?.listId)
    ctx.editor.command.executeSetRange(13, 13)
    const parentItemContext = ctx.editor.command.getRangeContext()
    ctx.editor.command.executeSetRange(14, 14)
    const nextParentContext = ctx.editor.command.getRangeContext()
    if (!parentItemContext || !nextParentContext) {
      throw new Error('Expected range context for parent list rows')
    }
    expect(parentItemContext.rangeRects[0].x).toBe(
      nextParentContext.rangeRects[0].x
    )
  })

  it('starts each child list under a different parent from one', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([
      { value: '父1' },
      { value: '\n' },
      { value: '子1' },
      { value: '\n' },
      { value: '父2' },
      { value: '\n' },
      { value: '子2' }
    ])
    ctx.editor.command.executeSelectAll()
    ctx.editor.command.executeList(ListType.OL)

    ctx.editor.command.executeSetRange(5, 5)
    dispatchTab()
    ctx.editor.command.executeSetRange(11, 11)
    dispatchTab()

    const data = ctx.editor.command.getValue({
      extraPickAttrs: ['listId']
    }).data.main
    const valueList = getListValueList(data)
    const childItems = valueList.filter((e: any) => e.listLevel === 1)
    expect(childItems.length).toBe(2)
    expect(childItems[0]?.listId).not.toBe(childItems[1]?.listId)
    childItems.forEach((item: any) => {
      expect(item.value).toMatch(/^\n子/)
    })
  })

  it('promotes the empty item after the last child list back to parent list', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([
      { value: '高血压' },
      { value: '\n' },
      { value: '糖尿病' },
      { value: '\n' },
      { value: '病毒性感冒' },
      { value: '\n' },
      { value: '过敏性鼻炎' },
      { value: '\n' },
      { value: '过敏性鼻息肉' },
      { value: '\n' },
      { value: '6788' },
      { value: '\n' },
      { value: '77' }
    ])
    ctx.editor.command.executeSelectAll()
    ctx.editor.command.executeList(ListType.OL)

    ctx.editor.command.executeSetRange(28, 28)
    dispatchTab()
    ctx.editor.command.executeSetRange(33, 33)
    dispatchTab()
    ctx.editor.command.executeSetRange(35, 35)
    dispatchEnter()
    dispatchEnter()

    const data = ctx.editor.command.getValue({
      extraPickAttrs: ['listId']
    }).data.main
    const valueList = getListValueList(data)
    const parentItems = valueList.filter((e: any) => e.listLevel === 0)
    const childItems = valueList.filter((e: any) => e.listLevel === 1)

    expect(parentItems.length).toBe(2)
    expect(childItems.length).toBe(1)
    expect(parentItems[1]?.listId).toBe(parentItems[0]?.listId)
    expect(parentItems[1]?.listId).not.toBe(childItems[0]?.listId)
  })

  it('exports a nested list as one list element', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([
      { value: '高血压' },
      { value: '\n' },
      { value: '糖尿病' },
      { value: '\n' },
      { value: '33' },
      { value: '\n' },
      { value: '病毒性感冒' },
      { value: '\n' },
      { value: '过敏性鼻炎' },
      { value: '\n' },
      { value: '过敏性鼻息肉' }
    ])
    ctx.editor.command.executeSelectAll()
    ctx.editor.command.executeList(ListType.OL)
    ctx.editor.command.executeSetRange(5, 5)
    dispatchTab()
    ctx.editor.command.executeSetRange(9, 9)
    dispatchTab()

    const data = ctx.editor.command.getValue().data.main || []
    const listData = data.filter((e: any) => e.type === 'list')

    expect(listData.length).toBe(1)
    expect(listData[0]?.valueList?.some((e: any) => e.listLevel === 1)).toBe(
      true
    )
    expect(
      listData[0]?.valueList?.some((e: any) => e.value.includes('33'))
    ).toBe(true)
  })

  it('restores a nested list value with independent child numbering', () => {
    ctx = createTestEditor({
      data: {
        header: [],
        main: [
          {
            value: '',
            type: 'list' as any,
            valueList: [
              { value: '\n高血压' },
              { value: '\n糖尿病\n234', listLevel: 1 },
              { value: '\n病毒性感冒\n过敏性鼻炎\n过敏性鼻息肉' }
            ],
            listType: ListType.OL
          }
        ],
        footer: []
      }
    })

    const data = ctx.editor.command.getValue({
      extraPickAttrs: ['listId']
    }).data.main
    const valueList = getListValueList(data)
    const parentItems = valueList.filter((e: any) => e.listLevel === 0)
    const childItems = valueList.filter((e: any) => e.listLevel === 1)

    expect(parentItems.length).toBe(2)
    expect(childItems.length).toBe(1)
    expect(parentItems[0]?.listId).toBe(parentItems[1]?.listId)
    expect(childItems[0]?.listId).not.toBe(parentItems[0]?.listId)
  })
})
