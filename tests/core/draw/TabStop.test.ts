import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestEditor, TestEditorContext } from '../../factories/editor'
import { Draw } from '@/editor/core/draw/Draw'
import { ZERO } from '@/editor/dataset/constant/Common'
import { ElementType } from '@/editor/dataset/enum/Element'
import { TabStopLeader, TabStopType } from '@/editor/dataset/enum/TabStop'
import type { IElement } from '@/editor/interface/Element'
import type { IRow } from '@/editor/interface/Row'

/**
 * 制表位排版：TAB 元素跳至段落位点，无位点回退默认网格
 */

const LOREM =
  '床前明月光疑是地上霜举头望明月低头思故乡abcdefghijklmnopqrstuvwxyz0123456789'

function makeDoc(tabStops?: IElement['tabStops']): IElement[] {
  return [
    { value: '你好\n', ...(tabStops ? { tabStops } : {}) },
    { value: LOREM, ...(tabStops ? { tabStops } : {}) }
  ]
}

let activeCtx: TestEditorContext | null = null

function setupEditor(data: IElement[]): {
  ctx: TestEditorContext
  draw: Draw
} {
  vi.restoreAllMocks()
  const spy = vi.spyOn(Draw.prototype, 'computeRowList')
  const ctx = createTestEditor({ data })
  activeCtx = ctx
  const draw = spy.mock.contexts[0] as Draw
  return { ctx, draw }
}

afterEach(() => {
  activeCtx?.destroy()
  activeCtx = null
})

function getRows(draw: Draw): IRow[] {
  return (draw as unknown as { rawRowList: IRow[] }).rawRowList
}

// 内部列表行首存在 ZERO 占位元素，TAB 按类型过滤
function findTabElements(row: IRow) {
  return row.elementList.filter(el => el.type === ElementType.TAB)
}

describe('制表位排版', () => {
  it('TAB 跳至位点：推进宽度 = 位点 - 当前行内x', () => {
    const { ctx, draw } = setupEditor(
      makeDoc([{ position: 100, type: TabStopType.LEFT }])
    )
    ctx.editor.command.executeSetRange(0, 0)
    ctx.editor.command.executeInsertElementList([
      { type: ElementType.TAB, value: '' }
    ])
    const [tabElement] = findTabElements(getRows(draw)[0])
    expect(tabElement).toBeTruthy()
    // scale=1，行首 ZERO 占位 1px，自 x=1 推进至位点 100
    expect(tabElement.metrics.width).toBe(99)
  })

  it('位点在当前x左侧被跳过，无后续位点回退默认网格', () => {
    const { ctx, draw } = setupEditor(
      makeDoc([{ position: 100, type: TabStopType.LEFT }])
    )
    ctx.editor.command.executeSetRange(0, 0)
    ctx.editor.command.executeInsertElementList([
      { type: ElementType.TAB, value: '' },
      { type: ElementType.TAB, value: '' }
    ])
    const tabs = findTabElements(getRows(draw)[0])
    // 第一个 TAB 自 x=1 推进至位点 100；第二个 TAB 位点已被越过，网格步进 32-(100%32)=28
    expect(tabs[0].metrics.width).toBe(99)
    expect(tabs[1].metrics.width).toBe(28)
  })

  it('无位点按默认网格步进', () => {
    const { ctx, draw } = setupEditor(makeDoc())
    ctx.editor.command.executeSetRange(0, 0)
    ctx.editor.command.executeInsertElementList([
      { type: ElementType.TAB, value: '' }
    ])
    const [tabElement] = findTabElements(getRows(draw)[0])
    // 行首 ZERO 占位 1px，网格步进 32-1=31
    expect(tabElement.metrics.width).toBe(31)
    expect(tabElement.tabLeader).toBeUndefined()
  })

  it('命中位点时写入前导符供渲染消费', () => {
    const { ctx, draw } = setupEditor(
      makeDoc([
        { position: 100, type: TabStopType.LEFT, leader: TabStopLeader.DOT }
      ])
    )
    ctx.editor.command.executeSetRange(0, 0)
    ctx.editor.command.executeInsertElementList([
      { type: ElementType.TAB, value: '' }
    ])
    const [tabElement] = findTabElements(getRows(draw)[0])
    expect(tabElement.tabLeader).toBe(TabStopLeader.DOT)
  })

  it('居右位点：TAB推进 + 后续run宽度 = 位点x（右缘压位点）', () => {
    const { ctx, draw } = setupEditor(
      makeDoc([{ position: 200, type: TabStopType.RIGHT }])
    )
    ctx.editor.command.executeSetRange(0, 0)
    ctx.editor.command.executeInsertElementList([
      { type: ElementType.TAB, value: '' }
    ])
    const rowElements = getRows(draw)[0].elementList
    const tab = rowElements.find(el => el.type === ElementType.TAB)!
    // run = TAB 之后的连续文本（你/好），行内x自 ZERO 占位 1 起
    const runWidth = rowElements
      .filter(el => el.value !== ZERO && el.type !== ElementType.TAB)
      .slice(0, 2)
      .reduce((width, el) => width + el.metrics.width, 0)
    expect(tab.metrics.width + runWidth).toBeCloseTo(199, 5)
  })

  it('居中位点：TAB推进 + 后续run宽度/2 = 位点x（中心压位点）', () => {
    const { ctx, draw } = setupEditor(
      makeDoc([{ position: 200, type: TabStopType.CENTER }])
    )
    ctx.editor.command.executeSetRange(0, 0)
    ctx.editor.command.executeInsertElementList([
      { type: ElementType.TAB, value: '' }
    ])
    const rowElements = getRows(draw)[0].elementList
    const tab = rowElements.find(el => el.type === ElementType.TAB)!
    const runWidth = rowElements
      .filter(el => el.value !== ZERO && el.type !== ElementType.TAB)
      .slice(0, 2)
      .reduce((width, el) => width + el.metrics.width, 0)
    expect(tab.metrics.width + runWidth / 2).toBeCloseTo(199, 5)
  })

  it('run 宽度超过到位点距离时推进钳为0', () => {
    const { ctx, draw } = setupEditor(
      makeDoc([{ position: 2, type: TabStopType.RIGHT }])
    )
    ctx.editor.command.executeSetRange(0, 0)
    ctx.editor.command.executeInsertElementList([
      { type: ElementType.TAB, value: '' }
    ])
    const [tab] = findTabElements(getRows(draw)[0])
    expect(tab.metrics.width).toBe(0)
  })

  it('executeSetTabStops 作用于整段，空数组清除属性', () => {
    const { ctx } = setupEditor(makeDoc())
    ctx.editor.command.executeSetRange(0, 1)
    ctx.editor.command.executeSetTabStops([
      { position: 64, type: TabStopType.LEFT }
    ])
    const main = ctx.editor.command.getValue().data.main
    expect(main[0].tabStops).toEqual([{ position: 64, type: TabStopType.LEFT }])
    ctx.editor.command.executeSetTabStops([])
    const cleared = ctx.editor.command.getValue().data.main
    expect(cleared[0].tabStops).toBeUndefined()
  })

  it('增量与全量路径在编辑后保持一致', () => {
    vi.restoreAllMocks()
    const computeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
    const tabStops = [
      { position: 100, type: TabStopType.LEFT, leader: TabStopLeader.DOT },
      { position: 200, type: TabStopType.CENTER },
      { position: 300, type: TabStopType.RIGHT }
    ]
    const data: IElement[] = [
      { value: `${LOREM.repeat(10)}\n`, tabStops },
      { value: LOREM.repeat(20), tabStops }
    ]
    const full = createTestEditor({ data })
    const incremental = createTestEditor({
      data,
      options: { lab: { incrementalCompute: true } }
    })
    activeCtx = incremental
    const [fullDraw, incrementalDraw] = [
      computeSpy.mock.contexts[0] as Draw,
      computeSpy.mock.contexts[1] as Draw
    ]
    const snapshot = (draw: Draw) =>
      JSON.stringify(
        getRows(draw).map(row => ({
          startIndex: row.startIndex,
          offsetX: row.offsetX ?? 0,
          width: Math.round(row.width)
        }))
      )
    expect(snapshot(incrementalDraw)).toBe(snapshot(fullDraw))
    const edits: Array<(ctx: TestEditorContext) => void> = [
      ctx => {
        ctx.editor.command.executeSetRange(30, 30)
        ctx.editor.command.executeInsertElementList([{ value: '插入新文字' }])
      },
      ctx => {
        ctx.editor.command.executeSetRange(500, 500)
        ctx.editor.command.executeInsertElementList([{ value: '再插入一些字' }])
      }
    ]
    edits.forEach((edit, step) => {
      edit(full)
      edit(incremental)
      if (snapshot(fullDraw) !== snapshot(incrementalDraw)) {
        throw new Error(`第 ${step} 步编辑后行不一致`)
      }
    })
  })
})
