import { isDeepStrictEqual } from 'node:util'
import { describe, expect, it, vi } from 'vitest'
import { createTestEditor, TestEditorContext } from '../../factories/editor'
import { Draw } from '@/editor/core/draw/Draw'
import { IncrementalRowComputer } from '@/editor/core/draw/IncrementalRowComputer'
import { ElementType } from '@/editor/dataset/enum/Element'
import type { IElement } from '@/editor/interface/Element'
import type { IRow } from '@/editor/interface/Row'
import { data as mockData } from '../../../src/mock'

interface ComputeSnapshot {
  rawRowList: string
  rowList: string
  pageRowList: string
  positionList: string
  elementValue: string
}

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
    if (!isDeepStrictEqual(JSON.parse(a[key]), JSON.parse(b[key]))) {
      return key
    }
  }
  return ''
}

function getTwoDraws(computeSpy: ReturnType<typeof vi.spyOn>): [Draw, Draw] {
  const unique = [...new Set(computeSpy.mock.contexts)] as Draw[]
  expect(unique.length).toBeGreaterThanOrEqual(2)
  computeSpy.mockRestore()
  return [unique[0], unique[1]]
}

function makeMockDoc() {
  const main: IElement[] = []
  for (let i = 0; i < 3; i++) {
    if (i) main.push({ type: ElementType.PAGE_BREAK, value: '' })
    main.push(...(JSON.parse(JSON.stringify(mockData)) as IElement[]))
  }
  return main
}

describe('历史记录增量计算', () => {
  it('复杂文档 IME 合成输入及撤销重做与全量路径一致', () => {
    vi.restoreAllMocks()
    const computeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
    const tryComputeSpy = vi.spyOn(
      IncrementalRowComputer.prototype,
      'tryCompute'
    )
    let fullCtx: TestEditorContext | undefined
    let incrementalCtx: TestEditorContext | undefined
    try {
      const data = makeMockDoc()
      fullCtx = createTestEditor({
        data,
        options: { incrementalCompute: false }
      })
      incrementalCtx = createTestEditor({
        data,
        options: { incrementalCompute: true }
      })
      const [fullDraw, incrementalDraw] = getTwoDraws(computeSpy)
      let success = false
      const pairs: Array<[TestEditorContext, Draw]> = [
        [fullCtx, fullDraw],
        [incrementalCtx, incrementalDraw]
      ]
      for (const [ctx, draw] of pairs) {
        ctx.editor.command.executeSetRange(100, 100)
        draw
          .getPosition()
          .setCursorPosition(draw.getPosition().getPositionList()[100])
      }
      const initialSnapshot = snapshotCompute(fullDraw)
      const assertEqual = (step: string) => {
        const incrementalSnapshot = snapshotCompute(incrementalDraw!)
        const fullSnapshot = snapshotCompute(fullDraw!)
        const diffKey = firstDiffKey(incrementalSnapshot, fullSnapshot)
        if (diffKey) {
          const incrementalValue = incrementalSnapshot[diffKey]
          const fullValue = fullSnapshot[diffKey]
          let offset = 0
          while (
            offset < fullValue.length &&
            incrementalValue[offset] === fullValue[offset]
          ) {
            offset++
          }
          throw new Error(
            `${step} 后 ${diffKey} 不一致，偏移 ${offset}\n` +
              `全量: ${fullValue.slice(offset, offset + 600)}\n` +
              `增量: ${incrementalValue.slice(offset, offset + 600)}`
          )
        }
      }
      for (let i = 0; i < 5; i++) {
        for (const [ctx] of pairs) {
          const textarea = ctx.container.querySelector('textarea')!
          textarea.dispatchEvent(new CompositionEvent('compositionstart'))
          for (const value of ['n', 'ni', '你']) {
            textarea.dispatchEvent(new InputEvent('input', { data: value }))
          }
          textarea.dispatchEvent(
            new CompositionEvent('compositionend', { data: '你' })
          )
        }
        assertEqual(`第 ${i} 次 IME 输入`)
        success =
          tryComputeSpy.mock.results.some(
            result => result.type === 'return' && result.value !== null
          ) || success
        tryComputeSpy.mockClear()
      }
      let historySuccessCount = 0
      const recordHistoryResult = () => {
        historySuccessCount += tryComputeSpy.mock.results.filter(
          result => result.type === 'return' && result.value !== null
        ).length
        tryComputeSpy.mockClear()
      }
      for (let i = 0; i < 5; i++) {
        fullCtx.editor.command.executeUndo()
        incrementalCtx.editor.command.executeUndo()
        assertEqual(`第 ${i} 次撤销 IME 输入`)
        recordHistoryResult()
      }
      expect(snapshotCompute(fullDraw).elementValue).toEqual(
        initialSnapshot.elementValue
      )
      for (let i = 0; i < 5; i++) {
        fullCtx.editor.command.executeRedo()
        incrementalCtx.editor.command.executeRedo()
        assertEqual(`第 ${i} 次重做 IME 输入`)
        recordHistoryResult()
      }
      expect(success).toBe(true)
      expect(historySuccessCount).toBe(10)
    } finally {
      fullCtx?.destroy()
      incrementalCtx?.destroy()
      vi.restoreAllMocks()
    }
  }, 30000)

  it('撤销后分支编辑不会复用已废弃分支的历史内容', () => {
    const ctx = createTestEditor({ data: [{ value: 'abcdefg\n' }] })
    try {
      const command = ctx.editor.command
      const value = () =>
        command
          .getValue()
          .data.main.map(element => element.value)
          .join('')
      command.executeSetRange(1, 1)
      command.executeInsertElementList([{ value: 'X' }])
      command.executeSetRange(5, 5)
      command.executeInsertElementList([{ value: 'Y' }])
      command.executeUndo()
      expect(value()).toBe('aXbcdefg\n')

      command.executeSetRange(2, 2)
      command.executeInsertElementList([{ value: 'Z' }])
      command.executeUndo()
      expect(value()).toBe('aXbcdefg\n')
      command.executeRedo()
      expect(value()).toBe('aXZbcdefg\n')
    } finally {
      ctx.destroy()
    }
  })

  it('非历史回写后创建历史快照不会恢复过期内容', () => {
    const ctx = createTestEditor({ data: [{ value: 'abcdefg\n' }] })
    try {
      const command = ctx.editor.command
      const computeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
      command.executeForceUpdate()
      const draw = computeSpy.mock.contexts.at(-1) as Draw
      computeSpy.mockRestore()
      const value = () =>
        command
          .getValue()
          .data.main.map(element => element.value)
          .join('')
      command.executeSetRange(1, 1)
      command.executeInsertElementList([{ value: 'X' }])
      draw.getElementList()[0].value = 'Q'
      draw.render({ isSubmitHistory: false })
      expect(value()).toBe('QaXbcdefg\n')

      command.executeSetRange(2, 2)
      command.executeInsertElementList([{ value: 'Z' }])
      command.executeUndo()
      expect(value()).toBe('QaXbcdefg\n')
      command.executeRedo()
      expect(value()).toBe('QaXZbcdefg\n')
    } finally {
      ctx.destroy()
      vi.restoreAllMocks()
    }
  })
})
