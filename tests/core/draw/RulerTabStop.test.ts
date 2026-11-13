import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestEditor, TestEditorContext } from '../../factories/editor'
import { Draw } from '@/editor/core/draw/Draw'
import { TabStopType } from '@/editor/dataset/enum/TabStop'
import type { IElement } from '@/editor/interface/Element'

/**
 * 标尺制表位标记：点击刻度带空白添加、拖动改位、拖出删除
 */

const LOREM =
  '床前明月光疑是地上霜举头望明月低头思故乡abcdefghijklmnopqrstuvwxyz0123456789'

function makeDoc(): IElement[] {
  return [{ value: `${LOREM}\n` }, { value: LOREM }]
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

// 版心左缘 120（margins[3]），scale=1：位点 position = 标尺x - 120
async function placeCaret(ctx: TestEditorContext) {
  ctx.editor.command.executeSetRange(5, 5)
  // 标尺渲染在 nextTick 中执行
  await new Promise(resolve => setTimeout(resolve))
  // jsdom 无布局：stub 标尺矩形供拖出删除判定（标尺高 26）
  const rulerDom = document.querySelector('.ce-ruler') as HTMLDivElement
  vi.spyOn(rulerDom, 'getBoundingClientRect').mockReturnValue({
    top: 0,
    left: 0,
    bottom: 26,
    right: 794,
    width: 794,
    height: 26
  } as DOMRect)
}

function dispatchRuler(
  type: string,
  clientX: number,
  clientY: number,
  target = '.ce-ruler'
) {
  ;(
    document.querySelector(target) as HTMLDivElement
  ).dispatchEvent(
    new MouseEvent(type, { bubbles: true, clientX, clientY, cancelable: true })
  )
}

async function addTabStop(clientX: number) {
  dispatchRuler('mousedown', clientX, 20)
  await new Promise(resolve => setTimeout(resolve))
}

describe('标尺制表位标记', () => {
  it('点击刻度带空白添加制表位', async () => {
    const { ctx } = setupRulerEditor(makeDoc())
    await placeCaret(ctx)
    // 版心内空白处按下：320-120=200
    await addTabStop(320)
    const main = ctx.editor.command.getValue().data.main
    expect(main[0].tabStops).toEqual([
      { position: 200, type: TabStopType.LEFT }
    ])
  })

  it('拖动制表位标记修改位置，一步撤销恢复', async () => {
    const { ctx } = setupRulerEditor(makeDoc())
    await placeCaret(ctx)
    await addTabStop(320)
    // 标记位于 320 处，向右拖 64px
    dispatchRuler('mousedown', 320, 20)
    document.dispatchEvent(
      new MouseEvent('mousemove', { clientX: 384, clientY: 20 })
    )
    document.dispatchEvent(new MouseEvent('mouseup'))
    const main = ctx.editor.command.getValue().data.main
    expect(main[0].tabStops).toEqual([
      { position: 264, type: TabStopType.LEFT }
    ])
    ctx.editor.command.executeUndo()
    const undone = ctx.editor.command.getValue().data.main
    expect(undone[0].tabStops).toEqual([
      { position: 200, type: TabStopType.LEFT }
    ])
  })

  it('拖出标尺删除位点', async () => {
    const { ctx } = setupRulerEditor(makeDoc())
    await placeCaret(ctx)
    await addTabStop(320)
    dispatchRuler('mousedown', 320, 20)
    // 拖出标尺底部（标尺高 26）
    document.dispatchEvent(
      new MouseEvent('mousemove', { clientX: 320, clientY: 400 })
    )
    document.dispatchEvent(new MouseEvent('mouseup'))
    const main = ctx.editor.command.getValue().data.main
    expect(main[0].tabStops).toBeUndefined()
  })

  it('悬浮制表位标记为pointer，移开恢复默认', async () => {
    const { ctx } = setupRulerEditor(makeDoc())
    await placeCaret(ctx)
    await addTabStop(320)
    const rulerX = document.querySelector('.ce-ruler-x') as HTMLCanvasElement
    dispatchRuler('mousemove', 320, 20)
    expect(rulerX.style.cursor).toBe('pointer')
    dispatchRuler('mousemove', 500, 20)
    expect(rulerX.style.cursor).toBe('default')
  })

  it('版心外与重复位点不添加', async () => {
    const { ctx } = setupRulerEditor(makeDoc())
    await placeCaret(ctx)
    // 版心左侧阴影区
    await addTabStop(100)
    // 右边距之外
    await addTabStop(700)
    let main = ctx.editor.command.getValue().data.main
    expect(main[0].tabStops).toBeUndefined()
    // 同位置重复添加忽略
    await addTabStop(320)
    await addTabStop(321)
    main = ctx.editor.command.getValue().data.main
    expect(main[0].tabStops?.length).toBe(1)
  })
})
