import { isDeepStrictEqual } from 'node:util'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestEditor, TestEditorContext } from '../../factories/editor'
import { Draw } from '@/editor/core/draw/Draw'
import { IncrementalRowComputer } from '@/editor/core/draw/IncrementalRowComputer'
import { ZERO } from '@/editor/dataset/constant/Common'
import { ElementType } from '@/editor/dataset/enum/Element'
import { ListType } from '@/editor/dataset/enum/List'
import type { IElement } from '@/editor/interface/Element'
import type { IRow } from '@/editor/interface/Row'
import { data as mockData } from '../../../src/mock'

/**
 * 段落级增量行计算：差分测试。
 * 两个编辑器（开/关 incrementalCompute）执行完全相同的随机编辑序列，
 * 每一步断言 rawRowList / rowList / pageRowList / positionList 四层计算结果完全一致。
 * 这是增量路径正确性的核心护栏：任何与全量路径的偏差都会在此暴露。
 */

// ---------- 测试数据 ----------

const LOREM =
  '床前明月光疑是地上霜举头望明月低头思故乡abcdefghijklmnopqrstuvwxyz0123456789'

function makeParagraphs(paragraphCount: number, charsPerParagraph: number) {
  const main: IElement[] = []
  for (let p = 0; p < paragraphCount; p++) {
    let value = ''
    for (let c = 0; c < charsPerParagraph; c++) {
      value += LOREM[(p * 31 + c * 7) % LOREM.length]
    }
    main.push({ value: p === paragraphCount - 1 ? value : `${value}\n` })
  }
  return main
}

// 单个巨型段落（不分段）：模拟病历类长段落场景
function makeGiantParagraph(charCount: number) {
  let value = ''
  for (let c = 0; c < charCount; c++) {
    value += LOREM[(c * 13 + 5) % LOREM.length]
  }
  return [{ value: '\n' }, { value }]
}

function makeListDoc() {
  const main: IElement[] = []
  for (let p = 0; p < 8; p++) {
    const count = 3 + (p % 3)
    for (let i = 0; i < count; i++) {
      main.push({
        value: `列表项${p}-${i}内容文本若干\n`,
        listId: `list-${p}`,
        listType: ListType.OL
      })
    }
  }
  return main
}

function makeTableDoc() {
  const tableElement: IElement = {
    type: ElementType.TABLE,
    value: '',
    colgroup: [{ width: 200 }, { width: 200 }],
    trList: [
      {
        minHeight: 30,
        tdList: [
          { colspan: 1, rowspan: 1, value: [{ value: '单元格A1' }] },
          { colspan: 1, rowspan: 1, value: [{ value: '单元格B1' }] }
        ]
      },
      {
        minHeight: 30,
        tdList: [
          { colspan: 1, rowspan: 1, value: [{ value: '单元格A2' }] },
          { colspan: 1, rowspan: 1, value: [{ value: '单元格B2' }] }
        ]
      }
    ]
  } as unknown as IElement
  return [...makeParagraphs(3, 30), tableElement, ...makeParagraphs(3, 30)]
}

function makeControlDoc() {
  const control: IElement = {
    type: ElementType.CONTROL,
    value: '',
    controlId: 'c1',
    conceptId: 'name',
    control: {
      value: null,
      controlId: 'c1',
      type: 1,
      preText: '姓名',
      postText: ''
    }
  } as unknown as IElement
  return [...makeParagraphs(3, 20), control, ...makeParagraphs(3, 20)]
}

function makeMockDoc() {
  const main: IElement[] = []
  for (let i = 0; i < 3; i++) {
    if (i) main.push({ type: ElementType.PAGE_BREAK, value: '' })
    main.push(...(JSON.parse(JSON.stringify(mockData)) as IElement[]))
  }
  return main
}

// ---------- 随机编辑序列（固定种子，两个编辑器执行完全一致） ----------

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type EditOp =
  | { kind: 'insert'; index: number; text: string }
  | { kind: 'replace'; start: number; end: number; text: string }
  | { kind: 'backspace'; index: number }
  | { kind: 'backspaceRange'; start: number; end: number }
  | { kind: 'paragraph'; index: number }
  | { kind: 'type'; index: number; text: string }

function buildOps(seed: number, elementCount: number, count: number): EditOp[] {
  const rand = mulberry32(seed)
  const ops: EditOp[] = []
  for (let i = 0; i < count; i++) {
    const dice = rand()
    const index = 2 + Math.floor(rand() * Math.max(elementCount - 4, 1))
    if (dice < 0.35) {
      const len = 1 + Math.floor(rand() * 12)
      let text = ''
      for (let c = 0; c < len; c++) {
        text += LOREM[Math.floor(rand() * LOREM.length)]
      }
      ops.push({ kind: 'insert', index, text })
    } else if (dice < 0.5) {
      const len = 1 + Math.floor(rand() * 4)
      let text = ''
      for (let c = 0; c < len; c++) {
        text += LOREM[Math.floor(rand() * LOREM.length)]
      }
      ops.push({ kind: 'type', index, text })
    } else if (dice < 0.62) {
      const end = Math.min(index + 1 + Math.floor(rand() * 8), elementCount - 1)
      ops.push({ kind: 'replace', start: index, end, text: '替换文本' })
    } else if (dice < 0.82) {
      ops.push({ kind: 'backspace', index })
    } else if (dice < 0.93) {
      const end = Math.min(index + 1 + Math.floor(rand() * 6), elementCount - 1)
      ops.push({ kind: 'backspaceRange', start: index, end })
    } else {
      ops.push({ kind: 'paragraph', index })
    }
  }
  return ops
}

function applyOp(ctx: TestEditorContext, op: EditOp, draw: Draw) {
  const command = ctx.editor.command
  switch (op.kind) {
    case 'insert':
      command.executeSetRange(op.index, op.index)
      command.executeInsertElementList([{ value: op.text }])
      break
    case 'type': {
      // 真实输入路径（input.ts）：段落末尾打字时 computeRange 起点落在
      // 下一行行首，是增量续算恢复点正确性的关键场景
      draw.getRange().setRange(op.index, op.index)
      draw
        .getPosition()
        .setCursorPosition(draw.getPosition().getPositionList()[op.index])
      const textarea = ctx.container.querySelector('textarea')!
      textarea.dispatchEvent(new InputEvent('input', { data: op.text }))
      break
    }
    case 'replace':
      command.executeSetRange(op.start, op.end)
      command.executeInsertElementList([{ value: op.text }])
      break
    case 'backspace':
      command.executeSetRange(op.index, op.index)
      command.executeBackspace()
      break
    case 'backspaceRange':
      command.executeSetRange(op.start, op.end)
      command.executeBackspace()
      break
    case 'paragraph':
      command.executeSetRange(op.index, op.index)
      command.executeInsertElementList([{ value: ZERO }])
      break
  }
}

// ---------- 计算结果快照 ----------

interface ComputeSnapshot {
  rawRowList: string
  rowList: string
  pageRowList: string
  positionList: string
  elementValue: string
}

// 表格/标题结构 id 及元素 id 在两个编辑器实例中各自随机生成，
// 与布局无关，比对前归一化
const TABLE_ID_KEY_REG = /^(tdId|trId|tableId|titleId)$/
const UUID_REG =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
function normalizeStringify(value: unknown): string {
  return JSON.stringify(value, (key, val) =>
    TABLE_ID_KEY_REG.test(key) ||
    (typeof val === 'string' && UUID_REG.test(val))
      ? 'ID'
      : val
  )
}

function snapshotCompute(draw: Draw): ComputeSnapshot {
  const anyDraw = draw as unknown as {
    rawRowList: IRow[]
    pageRowList: IRow[][]
  }
  return {
    rawRowList: normalizeStringify(anyDraw.rawRowList),
    rowList: normalizeStringify(draw.getRowList()),
    pageRowList: normalizeStringify(anyDraw.pageRowList),
    positionList: normalizeStringify(draw.getPosition().getPositionList()),
    elementValue: JSON.stringify(
      draw.getElementList().map(element => element.value)
    )
  }
}

function firstDiffKey(
  a: ComputeSnapshot,
  b: ComputeSnapshot
): keyof ComputeSnapshot | '' {
  const keys = Object.keys(a) as Array<keyof ComputeSnapshot>
  for (const key of keys) {
    if (a[key] === b[key]) continue
    // 历史复用与全量重算可能以不同顺序写入对象属性；仅在字符串不同
    // 时进行语义深比较，避免为每次差分都复制整篇文档对象
    if (!isDeepStrictEqual(JSON.parse(a[key]), JSON.parse(b[key]))) {
      return key
    }
  }
  return ''
}

// ---------- 差分驱动 ----------

// 从 computeRowList 调用上下文中提取两个编辑器各自的 Draw。
// 注意：mock.contexts 按调用次数记录 this，同一编辑器的 Draw 会连续出现多次，
// 必须去重后按创建顺序取值——直接取 contexts[0]/contexts[1] 会拿到同一个
// Draw，导致差分比对退化为自身与自身比较而永远通过
function getTwoDraws(computeSpy: ReturnType<typeof vi.spyOn>): [Draw, Draw] {
  const unique = [...new Set(computeSpy.mock.contexts)] as Draw[]
  expect(unique.length).toBeGreaterThanOrEqual(2)
  computeSpy.mockRestore()
  return [unique[0], unique[1]]
}

function runDifferential(
  data: IElement[],
  seed: number,
  opCount: number,
  options: { expectIncrementalUsed?: boolean } = {}
) {
  vi.restoreAllMocks()
  const computeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
  const tryComputeSpy = vi.spyOn(IncrementalRowComputer.prototype, 'tryCompute')
  let fullCtx: TestEditorContext | undefined
  let incrementalCtx: TestEditorContext | undefined
  try {
    fullCtx = createTestEditor({
      data,
      options: { incrementalCompute: false, historyMaxRecordCount: 2 }
    })
    incrementalCtx = createTestEditor({
      data,
      options: { incrementalCompute: true, historyMaxRecordCount: 2 }
    })
    const [fullDraw, incrementalDraw] = getTwoDraws(computeSpy)
    let successCount = 0
    expect(fullDraw).toBeTruthy()
    expect(incrementalDraw).toBeTruthy()
    // 初始状态一致
    expect(snapshotCompute(incrementalDraw!)).toEqual(
      snapshotCompute(fullDraw!)
    )
    const ops = buildOps(seed, data.length, opCount)
    ops.forEach((op, step) => {
      applyOp(fullCtx!, op, fullDraw!)
      applyOp(incrementalCtx!, op, incrementalDraw!)
      const fullSnapshot = snapshotCompute(fullDraw!)
      const incrementalSnapshot = snapshotCompute(incrementalDraw!)
      const diffKey = firstDiffKey(fullSnapshot, incrementalSnapshot)
      if (diffKey) {
        const fullValue = fullSnapshot[diffKey]
        const incrementalValue = incrementalSnapshot[diffKey]
        let diffOffset = 0
        while (
          diffOffset < fullValue.length &&
          fullValue[diffOffset] === incrementalValue[diffOffset]
        ) {
          diffOffset++
        }
        const start = Math.max(diffOffset - 200, 0)
        throw new Error(
          `第 ${step} 步操作 ${JSON.stringify(op)} 后 ${diffKey} 不一致，偏移 ${diffOffset}：\n` +
            `全量: ${fullValue.slice(start, start + 800)}\n` +
            `增量: ${incrementalValue.slice(start, start + 800)}`
        )
      }
      successCount += tryComputeSpy.mock.results.filter(
        result => result.type === 'return' && result.value !== null
      ).length
      tryComputeSpy.mockClear()
    })
    if (options.expectIncrementalUsed) {
      expect(successCount).toBeGreaterThan(0)
    }
  } finally {
    fullCtx?.destroy()
    incrementalCtx?.destroy()
    vi.restoreAllMocks()
  }
}

// ---------- 用例 ----------

describe('IncrementalRowComputer 行级增量行计算', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('纯文本文档：随机编辑序列下与全量计算完全一致', () => {
    runDifferential(makeParagraphs(12, 40), 20260924, 80, {
      expectIncrementalUsed: true
    })
  }, 30000)

  it('巨型单段落文档：段内编辑经行级收敛与全量一致', () => {
    // 6000 字符的单段落：行级增量下段内编辑只重算少数行
    runDifferential(makeGiantParagraph(6000), 20260930, 40, {
      expectIncrementalUsed: true
    })
  }, 30000)

  it('多页文档：跨页编辑位置缓存复用与全量一致', () => {
    // 负载控制在 CI 机器（约比本地慢 4~5 倍）可稳定跑进的预算内
    runDifferential(makeParagraphs(80, 60), 20261001, 25, {
      expectIncrementalUsed: true
    })
  }, 30000)

  it('后续未变化页面复用位置对象并正确平移元素索引', () => {
    vi.restoreAllMocks()
    const computeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
    const tryComputeSpy = vi.spyOn(
      IncrementalRowComputer.prototype,
      'tryCompute'
    )
    let ctx: TestEditorContext | undefined
    try {
      ctx = createTestEditor({
        data: makeParagraphs(80, 60),
        options: { incrementalCompute: true }
      })
      const draw = computeSpy.mock.contexts[0] as Draw
      const positionList = draw.getPosition().getPositionList()
      const oldElementCount = draw.getElementList().length
      const target = positionList[Math.floor(positionList.length * 0.8)]
      const oldTargetIndex = target.index
      expect(target.pageNo).toBeGreaterThan(0)

      ctx.editor.command.executeSetRange(20, 20)
      ctx.editor.command.executeInsertElementList([{ value: '测试' }])

      const insertedCount = draw.getElementList().length - oldElementCount
      expect(insertedCount).toBeGreaterThan(0)
      expect(draw.getPosition().getPositionList()[target.index]).toBe(target)
      expect(target.index).toBe(oldTargetIndex + insertedCount)
      const lastResult = tryComputeSpy.mock.results.at(-1)
      expect(lastResult?.type).toBe('return')
      expect(lastResult?.type === 'return' ? lastResult.value : null).not.toBe(
        null
      )
    } finally {
      ctx?.destroy()
      vi.restoreAllMocks()
    }
  })

  it('巨型单段落：行级续算的恢复点在编辑所在行（不回退到段首）', () => {
    vi.restoreAllMocks()
    const computeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
    let ctx: TestEditorContext | undefined
    try {
      ctx = createTestEditor({
        data: makeGiantParagraph(6000),
        options: { incrementalCompute: true }
      })
      computeSpy.mockClear()
      const elementCount = ctx.editor.command.getValue().data.main.length
      const editIndex = Math.floor(elementCount * 0.8)
      ctx.editor.command.executeSetRange(editIndex, editIndex)
      ctx.editor.command.executeInsertElementList([{ value: '测试' }])
      const resumePayload = computeSpy.mock.calls
        .map(call => call[0])
        .find(payload => payload?.resume)
      expect(resumePayload?.resume).toBeTruthy()
      // 恢复点在编辑位置附近（行级），而非段落起点（索引 0 附近）
      expect(resumePayload!.resume!.startIndex).toBeGreaterThan(editIndex - 200)
    } finally {
      ctx?.destroy()
      vi.restoreAllMocks()
    }
  })

  it('跨列表边界删除触发列表信息清理：区间外 listId 改写与全量一致', () => {
    vi.restoreAllMocks()
    const computeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
    let fullCtx: TestEditorContext | undefined
    let incrementalCtx: TestEditorContext | undefined
    try {
      // 两个相邻不同列表 + 列表B首项跨多行：跨边界单字符删除会触发
      // spliceElementList 原地清除列表B首项剩余元素的 listId（远超删除区间），
      // 若收敛锚点落在被清理的行上，将复用到丢失列表缩进的陈旧行
      const makeDoc = (): IElement[] => [
        { value: '列表A第一项\n', listId: 'list-a', listType: ListType.OL },
        {
          value:
            '列表B首项内容很长很长，需要占据多行才能排下，用来触发清理范围跨行的场景。\n',
          listId: 'list-b',
          listType: ListType.OL
        },
        { value: '列表B第二项\n', listId: 'list-b', listType: ListType.OL },
        { value: '末尾段落' }
      ]
      fullCtx = createTestEditor({
        data: makeDoc(),
        options: { incrementalCompute: false }
      })
      incrementalCtx = createTestEditor({
        data: makeDoc(),
        options: { incrementalCompute: true }
      })
      const [fullDraw, incrementalDraw] = getTwoDraws(computeSpy)
      // 光标置于列表B首项第一个字符前，退格删除前一个字符（跨列表接缝）
      const bStart = fullDraw
        .getElementList()
        .findIndex((element, index) => index > 0 && element.listId === 'list-b')
      expect(bStart).toBeGreaterThan(0)
      for (const ctx of [fullCtx, incrementalCtx]) {
        ctx.editor.command.executeSetRange(bStart - 1, bStart - 1)
        ctx.editor.command.executeBackspace()
      }
      const diffKey = firstDiffKey(
        snapshotCompute(incrementalDraw),
        snapshotCompute(fullDraw)
      )
      expect(diffKey).toBe('')
    } finally {
      fullCtx?.destroy()
      incrementalCtx?.destroy()
      vi.restoreAllMocks()
    }
  })

  it('段落末尾打字：新字符并入段落末行而非独立成行', () => {
    vi.restoreAllMocks()
    const computeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
    let fullCtx: TestEditorContext | undefined
    let incrementalCtx: TestEditorContext | undefined
    try {
      const data = makeParagraphs(8, 40)
      fullCtx = createTestEditor({
        data,
        options: { incrementalCompute: false }
      })
      incrementalCtx = createTestEditor({
        data,
        options: { incrementalCompute: true }
      })
      const [fullDraw, incrementalDraw] = getTwoDraws(computeSpy)
      // 第一段末尾换行符的元素索引（跳过文档起始换行符；光标置于换行符前 = 段落末尾）
      const newlineIndex = fullDraw
        .getElementList()
        .findIndex((element, index) => index > 0 && element.value === ZERO)
      expect(newlineIndex).toBeGreaterThan(1)
      const pairs: Array<[TestEditorContext, Draw]> = [
        [fullCtx, fullDraw],
        [incrementalCtx, incrementalDraw]
      ]
      for (const [ctx, draw] of pairs) {
        draw.getRange().setRange(newlineIndex - 1, newlineIndex - 1)
        draw
          .getPosition()
          .setCursorPosition(
            draw.getPosition().getPositionList()[newlineIndex - 1]
          )
        ctx.container
          .querySelector('textarea')!
          .dispatchEvent(new InputEvent('input', { data: '尾' }))
      }
      const diffKey = firstDiffKey(
        snapshotCompute(incrementalDraw),
        snapshotCompute(fullDraw)
      )
      expect(diffKey).toBe('')
      // 确认走的是增量路径而非退化全量
      const rawRowList = (incrementalDraw as unknown as { rawRowList: IRow[] })
        .rawRowList
      const typedRow = rawRowList.find(row =>
        row.elementList.some(element => element.value === '尾')
      )
      expect(typedRow).toBeTruthy()
    } finally {
      fullCtx?.destroy()
      incrementalCtx?.destroy()
      vi.restoreAllMocks()
    }
  })

  it('长文本插入导致换行级联：与全量计算完全一致', () => {
    runDifferential(makeParagraphs(10, 60), 9527, 60, {
      expectIncrementalUsed: true
    })
  }, 30000)

  it('列表文档：序号级联场景与全量计算完全一致', () => {
    runDifferential(makeListDoc(), 314159, 60, {
      expectIncrementalUsed: true
    })
  }, 30000)

  it('表格文档：表格邻近编辑与全量计算完全一致', () => {
    runDifferential(makeTableDoc(), 271828, 60, {
      expectIncrementalUsed: true
    })
  }, 30000)

  it('控件文档：控件前后续算与全量计算完全一致', () => {
    runDifferential(makeControlDoc(), 161803, 60, {
      expectIncrementalUsed: true
    })
  }, 30000)

  it('段内编辑必须跨过控件时仍使用增量且与全量一致', () => {
    vi.restoreAllMocks()
    const computeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
    const tryComputeSpy = vi.spyOn(
      IncrementalRowComputer.prototype,
      'tryCompute'
    )
    const control = makeControlDoc().find(element => element.control)!
    const data = [
      { value: '前'.repeat(200) },
      control,
      { value: '后'.repeat(200) }
    ]
    let fullCtx: TestEditorContext | undefined
    let incrementalCtx: TestEditorContext | undefined
    try {
      fullCtx = createTestEditor({
        data,
        options: { incrementalCompute: false }
      })
      incrementalCtx = createTestEditor({
        data,
        options: { incrementalCompute: true }
      })
      const [fullDraw, incrementalDraw] = getTwoDraws(computeSpy)
      for (const ctx of [fullCtx, incrementalCtx]) {
        ctx.editor.command.executeSetRange(20, 20)
        ctx.editor.command.executeInsertElementList([{ value: '测试' }])
      }
      expect(snapshotCompute(incrementalDraw)).toEqual(
        snapshotCompute(fullDraw)
      )
      const lastResult = tryComputeSpy.mock.results.at(-1)
      expect(lastResult?.type).toBe('return')
      expect(lastResult?.type === 'return' ? lastResult.value : null).not.toBe(
        null
      )
    } finally {
      fullCtx?.destroy()
      incrementalCtx?.destroy()
      vi.restoreAllMocks()
    }
  })

  it('真实 mock 复杂文档：随机编辑序列下与全量计算完全一致', () => {
    runDifferential(makeMockDoc(), 20261108, 40, {
      expectIncrementalUsed: true
    })
  }, 30000)

  it('默认开启行级增量计算', () => {
    vi.restoreAllMocks()
    const tryComputeSpy = vi.spyOn(
      IncrementalRowComputer.prototype,
      'tryCompute'
    )
    let ctx: TestEditorContext | undefined
    try {
      ctx = createTestEditor({ data: makeParagraphs(6, 30) })
      ctx.editor.command.executeSetRange(10, 10)
      ctx.editor.command.executeInsertElementList([{ value: '测试' }])
      const success = tryComputeSpy.mock.results.some(
        result => result.type === 'return' && result.value !== null
      )
      expect(success).toBe(true)
    } finally {
      ctx?.destroy()
      vi.restoreAllMocks()
    }
  })

  it('旧 lab.incrementalCompute: false 不再关闭增量计算', () => {
    vi.restoreAllMocks()
    const tryComputeSpy = vi.spyOn(
      IncrementalRowComputer.prototype,
      'tryCompute'
    )
    let ctx: TestEditorContext | undefined
    try {
      ctx = createTestEditor({
        data: makeParagraphs(6, 30),
        options: { lab: { incrementalCompute: false } }
      })
      ctx.editor.command.executeSetRange(10, 10)
      ctx.editor.command.executeInsertElementList([{ value: '测试' }])
      const success = tryComputeSpy.mock.results.some(
        result => result.type === 'return' && result.value !== null
      )
      expect(success).toBe(true)
    } finally {
      ctx?.destroy()
      vi.restoreAllMocks()
    }
  })

  it('顶层 incrementalCompute: false 优先于旧 lab 配置并关闭增量计算', () => {
    vi.restoreAllMocks()
    const tryComputeSpy = vi.spyOn(
      IncrementalRowComputer.prototype,
      'tryCompute'
    )
    let ctx: TestEditorContext | undefined
    try {
      ctx = createTestEditor({
        data: makeParagraphs(6, 30),
        options: {
          incrementalCompute: false,
          lab: { incrementalCompute: true }
        }
      })
      ctx.editor.command.executeSetRange(10, 10)
      ctx.editor.command.executeInsertElementList([{ value: '测试' }])
      const success = tryComputeSpy.mock.results.some(
        result => result.type === 'return' && result.value !== null
      )
      expect(success).toBe(false)
    } finally {
      ctx?.destroy()
      vi.restoreAllMocks()
    }
  })

  it('真实键盘路径（Enter/Backspace/文本输入）下与全量路径一致', () => {
    vi.restoreAllMocks()
    const computeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
    let fullCtx: TestEditorContext | undefined
    let incrementalCtx: TestEditorContext | undefined
    try {
      const data = makeParagraphs(8, 40)
      fullCtx = createTestEditor({
        data,
        options: { incrementalCompute: false }
      })
      incrementalCtx = createTestEditor({
        data,
        options: { incrementalCompute: true }
      })
      const [fullDraw, incrementalDraw] = getTwoDraws(computeSpy)
      const fullTextarea = fullCtx.container.querySelector('textarea')!
      const incrementalTextarea =
        incrementalCtx.container.querySelector('textarea')!
      expect(fullTextarea).toBeTruthy()
      expect(incrementalTextarea).toBeTruthy()
      const focusIndex = (index: number) => {
        for (const draw of [fullDraw!, incrementalDraw!]) {
          draw.getRange().setRange(index, index)
          draw
            .getPosition()
            .setCursorPosition(draw.getPosition().getPositionList()[index])
        }
      }
      const step = (name: string) => {
        const diffKey = firstDiffKey(
          snapshotCompute(incrementalDraw!),
          snapshotCompute(fullDraw!)
        )
        if (diffKey) throw new Error(`键盘路径 ${name} 后 ${diffKey} 不一致`)
      }
      // 回车拆段
      focusIndex(20)
      fullTextarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      incrementalTextarea.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter' })
      )
      step('Enter')
      // Backspace 合段
      focusIndex(22)
      fullTextarea.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Backspace' })
      )
      incrementalTextarea.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Backspace' })
      )
      step('Backspace')
      // 合成输入
      focusIndex(30)
      for (const text of ['增', '量', '输', '入test']) {
        fullTextarea.dispatchEvent(new InputEvent('input', { data: text }))
        incrementalTextarea.dispatchEvent(
          new InputEvent('input', { data: text })
        )
      }
      step('Input')
      // Delete 前向删除
      focusIndex(32)
      fullTextarea.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Delete' })
      )
      incrementalTextarea.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Delete' })
      )
      step('Delete')
    } finally {
      fullCtx?.destroy()
      incrementalCtx?.destroy()
      vi.restoreAllMocks()
    }
  })

  it('undo/redo 后与全量路径一致', () => {
    vi.restoreAllMocks()
    const computeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
    let fullCtx: TestEditorContext | undefined
    let incrementalCtx: TestEditorContext | undefined
    try {
      const data = makeParagraphs(8, 40)
      fullCtx = createTestEditor({
        data,
        options: { incrementalCompute: false }
      })
      incrementalCtx = createTestEditor({
        data,
        options: { incrementalCompute: true }
      })
      const [fullDraw, incrementalDraw] = getTwoDraws(computeSpy)
      const command = incrementalCtx.editor.command
      // 增量输入 → 撤销 → 重做 → 再增量
      command.executeSetRange(15, 15)
      command.executeInsertElementList([{ value: '插入内容' }])
      command.executeUndo()
      command.executeRedo()
      command.executeSetRange(30, 30)
      command.executeInsertElementList([{ value: '尾部' }])
      fullCtx.editor.command.executeSetRange(15, 15)
      fullCtx.editor.command.executeInsertElementList([{ value: '插入内容' }])
      fullCtx.editor.command.executeUndo()
      fullCtx.editor.command.executeRedo()
      fullCtx.editor.command.executeSetRange(30, 30)
      fullCtx.editor.command.executeInsertElementList([{ value: '尾部' }])
      const diffKey = firstDiffKey(
        snapshotCompute(incrementalDraw!),
        snapshotCompute(fullDraw!)
      )
      expect(diffKey).toBe('')
    } finally {
      fullCtx?.destroy()
      incrementalCtx?.destroy()
      vi.restoreAllMocks()
    }
  })

  it('随机交错撤销、重做和分支编辑与全量路径一致', () => {
    vi.restoreAllMocks()
    const computeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
    const tryComputeSpy = vi.spyOn(
      IncrementalRowComputer.prototype,
      'tryCompute'
    )
    let fullCtx: TestEditorContext | undefined
    let incrementalCtx: TestEditorContext | undefined
    try {
      const data = makeParagraphs(20, 60)
      fullCtx = createTestEditor({
        data,
        options: { incrementalCompute: false }
      })
      incrementalCtx = createTestEditor({
        data,
        options: { incrementalCompute: true }
      })
      const [fullDraw, incrementalDraw] = getTwoDraws(computeSpy)
      const rand = mulberry32(20261109)
      let successCount = 0
      for (let step = 0; step < 60; step++) {
        const dice = rand()
        const index = Math.floor(rand() * fullDraw.getElementList().length)
        const commands = [fullCtx.editor.command, incrementalCtx.editor.command]
        if (dice < 0.35) {
          for (const command of commands) {
            command.executeSetRange(index, index)
            command.executeInsertElementList([{ value: `插入${step}` }])
          }
        } else if (dice < 0.5) {
          for (const command of commands) {
            command.executeSetRange(index, index)
            command.executeBackspace()
          }
        } else if (dice < 0.75) {
          for (const command of commands) command.executeUndo()
        } else {
          for (const command of commands) command.executeRedo()
        }
        const diffKey = firstDiffKey(
          snapshotCompute(incrementalDraw),
          snapshotCompute(fullDraw)
        )
        if (diffKey) {
          throw new Error(`随机历史第 ${step} 步后 ${diffKey} 不一致`)
        }
        successCount += tryComputeSpy.mock.results.filter(
          result => result.type === 'return' && result.value !== null
        ).length
        tryComputeSpy.mockClear()
      }
      expect(successCount).toBeGreaterThan(20)
    } finally {
      fullCtx?.destroy()
      incrementalCtx?.destroy()
      vi.restoreAllMocks()
    }
  }, 30000)
})
