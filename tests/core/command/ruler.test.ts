import { describe, it, expect, afterEach } from 'vitest'
import { PageMode } from '../../../src/editor/dataset/enum/Editor'
import { createTestEditor, waitMacroTask } from '../../factories/editor'

describe('标尺命令', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('默认不开启标尺', async () => {
    ctx = createTestEditor()
    await waitMacroTask()
    expect(ctx.editor.command.getOptions().ruler.disabled).toBe(true)
    expect(ctx.container.querySelector('.ce-ruler')).toBeNull()
  })

  it('executeToggleRuler 开启标尺', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeToggleRuler()
    expect(ctx.editor.command.getOptions().ruler.disabled).toBe(false)
    expect(ctx.container.querySelector('.ce-ruler')).not.toBeNull()
    expect(ctx.container.querySelector('.ce-ruler-y')).not.toBeNull()
  })

  it('executeToggleRuler(false) 关闭并隐藏标尺', async () => {
    ctx = createTestEditor({ options: { ruler: { disabled: false } } })
    await waitMacroTask()
    expect(ctx.container.querySelector('.ce-ruler')).not.toBeNull()
    ctx.editor.command.executeToggleRuler(false)
    expect(ctx.editor.command.getOptions().ruler.disabled).toBe(true)
    const rulerDom = ctx.container.querySelector<HTMLDivElement>('.ce-ruler')!
    expect(rulerDom.style.display).toBe('none')
  })

  it('连页模式下隐藏标尺，恢复分页后显示', async () => {
    ctx = createTestEditor({ options: { ruler: { disabled: false } } })
    await waitMacroTask()
    const rulerDom = ctx.container.querySelector<HTMLDivElement>('.ce-ruler')!
    expect(rulerDom.style.display).toBe('block')
    expect(ctx.container.querySelector('.ce-ruler-y')).not.toBeNull()
    ctx.editor.command.executePageMode(PageMode.CONTINUITY)
    await waitMacroTask()
    expect(rulerDom.style.display).toBe('none')
    ctx.editor.command.executePageMode(PageMode.PAGING)
    await waitMacroTask()
    expect(rulerDom.style.display).toBe('block')
  })

  it('拖动左边距手柄修改页边距', async () => {
    ctx = createTestEditor({ options: { ruler: { disabled: false } } })
    await waitMacroTask()
    const rulerDom = ctx.container.querySelector<HTMLDivElement>('.ce-ruler')!
    // 默认左边距 120，命中手柄后开始拖动
    const down = new MouseEvent('mousedown', { bubbles: true, clientX: 120 })
    rulerDom.dispatchEvent(down)
    // 在标尺上移动（事件需能冒泡至document的拖动监听）
    rulerDom.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 200 })
    )
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    expect(ctx.editor.command.getOptions().margins[3]).toBe(200)
  })

  it('拖动边距受正文最小宽度约束', async () => {
    ctx = createTestEditor({ options: { ruler: { disabled: false } } })
    await waitMacroTask()
    const rulerDom = ctx.container.querySelector<HTMLDivElement>('.ce-ruler')!
    const down = new MouseEvent('mousedown', { bubbles: true, clientX: 120 })
    rulerDom.dispatchEvent(down)
    rulerDom.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 99999 })
    )
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    // 页面宽 794，右边距 120，正文最小宽度 100
    expect(ctx.editor.command.getOptions().margins[3]).toBe(794 - 120 - 100)
  })

  it('偏心按下手柄按位移增量计算边距（不发生跳变）', async () => {
    ctx = createTestEditor({ options: { ruler: { disabled: false } } })
    await waitMacroTask()
    const rulerDom = ctx.container.querySelector<HTMLDivElement>('.ce-ruler')!
    // 在手柄中心右侧 3px 处按下（命中容差内）
    const down = new MouseEvent('mousedown', { bubbles: true, clientX: 123 })
    rulerDom.dispatchEvent(down)
    rulerDom.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX: 203 })
    )
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    // 边距 = 120 + (203 - 123)，而非跳变为 203
    expect(ctx.editor.command.getOptions().margins[3]).toBe(200)
  })

  it('拖动垂直标尺手柄修改顶边距', async () => {
    ctx = createTestEditor({ options: { ruler: { disabled: false } } })
    await waitMacroTask()
    const rulerYDom =
      ctx.container.querySelector<HTMLCanvasElement>('.ce-ruler-y')!
    // 默认顶边距 100，命中手柄后向下拖动 80px
    const down = new MouseEvent('mousedown', { bubbles: true, clientY: 100 })
    rulerYDom.dispatchEvent(down)
    rulerYDom.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientY: 180 })
    )
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    expect(ctx.editor.command.getOptions().margins[0]).toBe(180)
  })

  it('拖动垂直标尺底边距受正文最小尺寸约束', async () => {
    ctx = createTestEditor({ options: { ruler: { disabled: false } } })
    await waitMacroTask()
    const rulerYDom =
      ctx.container.querySelector<HTMLCanvasElement>('.ce-ruler-y')!
    // 底边距手柄位于页高 1123 - 100 = 1023 处，向上拖动
    const down = new MouseEvent('mousedown', { bubbles: true, clientY: 1023 })
    rulerYDom.dispatchEvent(down)
    rulerYDom.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientY: -99999 })
    )
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
    // 页高 1123，顶边距 100，正文最小尺寸 100
    expect(ctx.editor.command.getOptions().margins[2]).toBe(1123 - 100 - 100)
  })
})
