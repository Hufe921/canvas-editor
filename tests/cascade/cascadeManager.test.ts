import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor, TestEditorContext } from '../factories/editor'
import { buildData } from '../factories/cascade'

describe('CascadeManager', () => {
  let ctx: TestEditorContext
  afterEach(() => ctx?.destroy())

  it('初始化后表达式成立 → 目标显示且必填', () => {
    ctx = createTestEditor({
      data: { header: [], main: buildData(), footer: [] }
    })
    const list = ctx.editor.command.getControlList()
    const target = list.find(el => el.controlId === 'c2')
    expect(target?.control?.hide).toBe(false)
    expect(target?.control?.required).toBe(true)
  })

  it('conceptId 批量命中', () => {
    const data = buildData()
    // 复制一个 c3 同 conceptId 目标
    const clone = JSON.parse(JSON.stringify(data[1]))
    clone.controlId = 'c3'
    data.push(clone)
    ctx = createTestEditor({ data: { header: [], main: data, footer: [] } })
    const list = ctx.editor.command.getControlList()
    for (const id of ['c2', 'c3']) {
      const target = list.find(el => el.controlId === id)
      expect(target?.control?.hide).toBe(false)
    }
  })

  it('表达式不成立 → 保持基线（初始隐藏不变）', () => {
    ctx = createTestEditor({
      data: { header: [], main: buildData('0'), footer: [] }
    })
    const list = ctx.editor.command.getControlList()
    const target = list.find(el => el.controlId === 'c2')
    expect(target?.control?.hide).toBe(true)
    expect(target?.control?.required).toBeFalsy()
  })

  it('非法表达式不抛错且按 false 处理', () => {
    const data = buildData()
    data[0].control!.cascade![0].expression = "getValue(@self) === '1'"
    ctx = createTestEditor({ data: { header: [], main: data, footer: [] } })
    const list = ctx.editor.command.getControlList()
    expect(list.find(el => el.controlId === 'c2')?.control?.hide).toBe(true)
  })
})
