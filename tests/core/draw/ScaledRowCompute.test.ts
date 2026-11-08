import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestEditor, TestEditorContext } from '../../factories/editor'
import { Draw } from '@/editor/core/draw/Draw'
import { IncrementalRowComputer } from '@/editor/core/draw/IncrementalRowComputer'
import { ScaledRowComputer } from '@/editor/core/draw/ScaledRowComputer'
import { ElementType } from '@/editor/dataset/enum/Element'
import { PaperDirection } from '@/editor/dataset/enum/Editor'
import type { IElement } from '@/editor/interface/Element'
import { data as mockData } from '../../../src/mock'

const UUID_REG =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const ID_KEY_REG = /^(id|tdId|trId|tableId|titleId|controlId)$/

function normalize(value: unknown): unknown {
  if (typeof value === 'number') {
    return Math.abs(value) < 1e-10 ? 0 : Number(value.toFixed(8))
  }
  if (typeof value === 'string' && UUID_REG.test(value)) return 'ID'
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !ID_KEY_REG.test(key))
        .map(([key, item]) => [key, normalize(item)])
    )
  }
  return value
}

function snapshot(draw: Draw) {
  return normalize({
    rawRowList: draw.getRawRowList(),
    rowList: draw.getRowList(),
    pageRowList: draw.getPageRowList(),
    positionList: draw.getPosition().getPositionList()
  })
}

function getDraws(ctxA: TestEditorContext, ctxB: TestEditorContext): Draw[] {
  const computeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
  ctxA.editor.command.executeForceUpdate()
  ctxB.editor.command.executeForceUpdate()
  const draws = [...new Set(computeSpy.mock.contexts)] as Draw[]
  computeSpy.mockRestore()
  expect(draws).toHaveLength(2)
  return draws
}

function makeLongDocument() {
  const main: IElement[] = [{ value: '\n' }]
  for (let p = 0; p < 15; p++) {
    main.push({
      value: `${'长段落缩放断行复用abcXYZ0123456789'.repeat(12)}\n`,
      size: p % 3 === 0 ? 18 : 16
    })
  }
  return main
}

function makeMockDocument() {
  return JSON.parse(JSON.stringify(mockData)) as IElement[]
}

describe('ScaledRowComputer 缩放断行复用', () => {
  let contexts: TestEditorContext[] = []

  afterEach(() => {
    contexts.forEach(ctx => ctx.destroy())
    contexts = []
    vi.restoreAllMocks()
  })

  function createPair(data: IElement[]) {
    const scaledCtx = createTestEditor({ data })
    const fullCtx = createTestEditor({ data })
    contexts.push(scaledCtx, fullCtx)
    const [scaledDraw, fullDraw] = getDraws(scaledCtx, fullCtx)
    return { scaledCtx, fullCtx, scaledDraw, fullDraw }
  }

  it.each([0.5, 0.8, 1.1, 1.25, 1.75, 1])(
    '复杂文档缩放至 %s 时与完整重排一致',
    scale => {
      const { scaledCtx, fullCtx, scaledDraw, fullDraw } =
        createPair(makeMockDocument())
      scaledCtx.editor.command.executePageScale(scale)
      fullDraw.getOptions().scale = scale
      fullCtx.editor.command.executeForceUpdate()
      expect(snapshot(scaledDraw)).toEqual(snapshot(fullDraw))
    }
  )

  it('文本恰好贴齐版心时，缩放复用与完整重排断行一致', () => {
    const probe = createTestEditor()
    const probeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
    probe.editor.command.executeForceUpdate()
    const probeDraw = probeSpy.mock.contexts.at(-1) as Draw
    const innerWidth = Math.floor(probeDraw.getInnerWidth())
    probe.destroy()
    probeSpy.mockRestore()
    const data = [{ value: '\n' }, { value: '测'.repeat(innerWidth) }]
    const { scaledCtx, fullCtx, scaledDraw, fullDraw } = createPair(data)
    const scaleSpy = vi.spyOn(ScaledRowComputer.prototype, 'tryScale')

    scaledCtx.editor.command.executePageScale(1.1)
    fullDraw.getOptions().scale = 1.1
    fullCtx.editor.command.executeForceUpdate()

    expect(scaleSpy.mock.results.at(-1)?.value).not.toBeNull()
    expect(snapshot(scaledDraw)).toEqual(snapshot(fullDraw))
  })

  it('混合横竖页的贴齐文本缩放后保持断行和分页方向', () => {
    const probe = createTestEditor()
    const probeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
    probe.editor.command.executeForceUpdate()
    const probeDraw = probeSpy.mock.contexts[0] as Draw
    const verticalWidth = Math.floor(probeDraw.getInnerWidth())
    const horizontalWidth = Math.floor(
      probeDraw.getInnerWidth(PaperDirection.HORIZONTAL)
    )
    probe.destroy()
    probeSpy.mockRestore()
    const data: IElement[] = [
      { value: '\n' },
      { value: '测'.repeat(verticalWidth) },
      {
        type: ElementType.PAGE_BREAK,
        value: '\n',
        paperDirection: PaperDirection.HORIZONTAL
      },
      { value: '测'.repeat(horizontalWidth) }
    ]
    const { scaledCtx, fullCtx, scaledDraw, fullDraw } = createPair(data)
    const scaleSpy = vi.spyOn(ScaledRowComputer.prototype, 'tryScale')

    scaledCtx.editor.command.executePageScale(1.1)
    fullDraw.getOptions().scale = 1.1
    fullCtx.editor.command.executeForceUpdate()

    expect(scaleSpy.mock.results.at(-1)?.value).not.toBeNull()
    expect(scaledDraw.getPageRowList()).toHaveLength(2)
    expect(scaledDraw.getPageDirection(1)).toBe(PaperDirection.HORIZONTAL)
    expect(snapshot(scaledDraw)).toEqual(snapshot(fullDraw))
  })

  it('离屏页缩放后先延迟位图重建，导出时补齐全部页面', async () => {
    const computeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
    const ctx = createTestEditor({
      data: [
        { value: '第一页\n' },
        { type: ElementType.PAGE_BREAK, value: '\n' },
        { value: '第二页\n' },
        { type: ElementType.PAGE_BREAK, value: '\n' },
        { value: '第三页\n' }
      ]
    })
    contexts.push(ctx)
    const draw = computeSpy.mock.contexts[0] as Draw
    computeSpy.mockRestore()
    const exportedWidthList: number[] = []
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(
      function (this: HTMLCanvasElement) {
        exportedWidthList.push(this.width)
        return 'data:image/png;base64,'
      }
    )

    ctx.editor.command.executePageScale(1.1)
    const pages = Array.from(
      ctx.container.querySelectorAll<HTMLCanvasElement>('canvas[data-index]')
    )
    expect(pages).toHaveLength(3)
    expect(pages[2].width).not.toBe(draw.getCanvasWidth(2))

    const result = await ctx.editor.command.getImage()

    expect(result).toHaveLength(3)
    expect(exportedWidthList).toHaveLength(3)
    expect(pages[2].width).toBe(draw.getCanvasWidth(2))
    expect(exportedWidthList[2]).toBe(draw.getCanvasWidth(2))
  })

  it('连续缩放长文档保留行对象，并支持跨页表格重分页', () => {
    const table: IElement = {
      type: ElementType.TABLE,
      value: '',
      colgroup: [{ width: 250 }, { width: 250 }],
      trList: Array.from({ length: 20 }, (_, row) => ({
        height: 30,
        tdList: [0, 1].map(col => ({
          colspan: 1,
          rowspan: 1,
          value: [{ value: `第${row}行${col}列${'表格内容'.repeat(8)}` }]
        }))
      }))
    } as IElement
    const data = [...makeLongDocument(), table, ...makeLongDocument()]
    const { scaledCtx, fullCtx, scaledDraw, fullDraw } = createPair(data)
    const originalRows = scaledDraw.getRawRowList()
    const scaleSpy = vi.spyOn(ScaledRowComputer.prototype, 'tryScale')
    for (const scale of [1.1, 0.8, 1.75, 1]) {
      scaledCtx.editor.command.executePageScale(scale)
      fullDraw.getOptions().scale = scale
      fullCtx.editor.command.executeForceUpdate()
      expect(scaleSpy.mock.results.at(-1)?.value).not.toBeNull()
      expect(scaledDraw.getRawRowList()[0]).toBe(originalRows[0])
      expect(snapshot(scaledDraw)).toEqual(snapshot(fullDraw))
    }
  }, 30000)

  it('缩放后立即输入仍命中增量计算且与全量一致', () => {
    const { scaledCtx, fullCtx, scaledDraw, fullDraw } =
      createPair(makeLongDocument())
    scaledCtx.editor.command.executePageScale(1.25)
    fullDraw.getOptions().scale = 1.25
    fullCtx.editor.command.executeForceUpdate()
    fullDraw.getOptions().incrementalCompute = false
    const incrementalSpy = vi.spyOn(
      IncrementalRowComputer.prototype,
      'tryCompute'
    )
    const insert = (ctx: TestEditorContext) => {
      ctx.editor.command.executeSetRange(5, 5)
      ctx.editor.command.executeInsertElementList([{ value: '缩放后输入' }])
    }
    insert(scaledCtx)
    insert(fullCtx)
    expect(incrementalSpy.mock.results[0]?.value).not.toBeNull()
    expect(snapshot(scaledDraw)).toEqual(snapshot(fullDraw))
  })
})
