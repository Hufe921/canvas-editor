import { describe, it, expect, afterEach } from 'vitest'
import {
  createTestEditor,
  TestEditorContext,
  waitMacroTask
} from '../factories/editor'
import { buildData } from '../factories/cascade'

describe('级联事件触发', () => {
  let ctx: TestEditorContext
  afterEach(() => ctx?.destroy())

  it('控件值变化后级联重算（选"有"→ 显示；改"无"→ 还原隐藏）', async () => {
    // 初始选"无"：目标隐藏
    ctx = createTestEditor({
      data: { header: [], main: buildData('0'), footer: [] }
    })
    let target = ctx.editor.command
      .getControlList()
      .find(el => el.controlId === 'c2')
    expect(target?.control?.hide).toBe(true)
    // 改为"有"：显示且必填
    ctx.editor.command.executeSetControlValue({ id: 'c1', value: '1' })
    await waitMacroTask()
    target = ctx.editor.command
      .getControlList()
      .find(el => el.controlId === 'c2')
    expect(target?.control?.hide).toBe(false)
    expect(target?.control?.required).toBe(true)
    // 改回"无"：还原基线
    ctx.editor.command.executeSetControlValue({ id: 'c1', value: '0' })
    await waitMacroTask()
    target = ctx.editor.command
      .getControlList()
      .find(el => el.controlId === 'c2')
    expect(target?.control?.hide).toBe(true)
    expect(target?.control?.required).toBeFalsy()
  })
})
