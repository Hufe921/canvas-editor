import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestEditor, TestEditorContext } from '../../factories/editor'
import { Draw } from '@/editor/core/draw/Draw'
import { Ruler } from '@/editor/core/draw/ruler/Ruler'
import type { IElement } from '@/editor/interface/Element'

/**
 * 标尺缩进标记：拖动作用于光标/选区所在段落，一次拖动一步撤销
 */

const LOREM =
  '床前明月光疑是地上霜举头望明月低头思故乡abcdefghijklmnopqrstuvwxyz0123456789'

function makeDoc(): IElement[] {
  return [
    { value: `${LOREM.slice(0, 60)}\n` },
    { value: `${LOREM.slice(10, 40)}\n` },
    { value: LOREM.slice(0, 30) }
  ]
}

let activeCtx: TestEditorContext | null = null

function setupRulerEditor(data: IElement[]): {
  ctx: TestEditorContext
  draw: Draw
} {
  vi.restoreAllMocks()
  const spy = vi.spyOn(Draw.prototype, 'computeRowList')
  const ctx = createTestEditor({
    data,
    options: { ruler: { disabled: false } }
  })
  activeCtx = ctx
  const draw = spy.mock.contexts[0] as Draw
  return { ctx, draw }
}

afterEach(() => {
  activeCtx?.destroy()
  activeCtx = null
})

function dragRulerMarker(
  fromX: number,
  toX: number,
  y: number
) {
  const rulerX = document.querySelector('.ce-ruler-x') as HTMLCanvasElement
  expect(rulerX).toBeTruthy()
  rulerX.dispatchEvent(
    new MouseEvent('mousedown', {
      clientX: fromX,
      clientY: y,
      bubbles: true,
      cancelable: true
    })
  )
  document.dispatchEvent(
    new MouseEvent('mousemove', { clientX: toX, clientY: y })
  )
  document.dispatchEvent(new MouseEvent('mouseup'))
}

describe('标尺缩进标记', () => {
  it('拖动左缩进标记设置整段左缩进，一步撤销恢复', async () => {
    const { ctx } = setupRulerEditor(makeDoc())
    ctx.editor.command.executeSetRange(5, 5)
    // 标尺渲染在 nextTick 中执行
    await new Promise(resolve => setTimeout(resolve))
    // 左缩进标记位于左边距处（margins[3]=100），底层 y=22
    dragRulerMarker(120, 152, 22)
    const main = ctx.editor.command.getValue().data.main
    expect(main[0].indentLeft).toBe(32)
    // 一步撤销恢复原状
    ctx.editor.command.executeUndo()
    const undone = ctx.editor.command.getValue().data.main
    expect(undone[0].indentLeft ?? 0).toBe(0)
  })

  it('拖动首行缩进标记仅改首行缩进', async () => {
    const { ctx } = setupRulerEditor(makeDoc())
    ctx.editor.command.executeSetRange(5, 5)
    await new Promise(resolve => setTimeout(resolve))
    // 首行缩进盾形标记位于左边距处标尺上部，y=6
    dragRulerMarker(120, 184, 6)
    const main = ctx.editor.command.getValue().data.main
    expect(main[0].indentFirstLine).toBe(64)
    expect(main[0].indentLeft ?? 0).toBe(0)
  })

  it('拖动右缩进标记设置右缩进', async () => {
    const { ctx } = setupRulerEditor(makeDoc())
    ctx.editor.command.executeSetRange(5, 5)
    await new Promise(resolve => setTimeout(resolve))
    // 右缩进标记位于右边距处（794-120=674），底层 y=22
    dragRulerMarker(674, 610, 22)
    const main = ctx.editor.command.getValue().data.main
    expect(main[0].indentRight).toBe(64)
  })

  it('选区跨段时拖动同时作用于多个段落', async () => {
    const { ctx } = setupRulerEditor(makeDoc())
    ctx.editor.command.executeSetRange(5, 80)
    await new Promise(resolve => setTimeout(resolve))
    dragRulerMarker(120, 152, 22)
    const main = ctx.editor.command.getValue().data.main
    // 压缩输出会合并相邻同值run，按带缩进run的字符总量断言两段均生效
    const indentCharCount = main
      .filter(el => el.indentLeft === 32)
      .reduce((count, el) => count + (el.value || '').length, 0)
    expect(indentCharCount).toBeGreaterThanOrEqual(80)
    // 未选中的第三段不受影响
    expect(main[main.length - 1].indentLeft ?? 0).toBe(0)
  })

  it('无重排的渲染也触发标尺重绘（标记跟随点击段落）', async () => {
    const { draw } = setupRulerEditor(makeDoc())
    const rulerRenderSpy = vi.spyOn(Ruler.prototype, 'render')
    // 点击落光标的渲染不带 isCompute
    draw.render({
      isCompute: false,
      isSubmitHistory: false,
      isSetCursor: false
    })
    await new Promise(resolve => setTimeout(resolve))
    expect(rulerRenderSpy).toHaveBeenCalled()
    rulerRenderSpy.mockRestore()
  })
})
