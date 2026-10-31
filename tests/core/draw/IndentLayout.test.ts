import { describe, expect, it, vi } from 'vitest'
import { createTestEditor, TestEditorContext } from '../../factories/editor'
import { Draw } from '@/editor/core/draw/Draw'
import { ZERO } from '@/editor/dataset/constant/Common'
import { RowFlex } from '@/editor/dataset/enum/Row'
import { ElementType } from '@/editor/dataset/enum/Element'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import type { IElement } from '@/editor/interface/Element'
import type { IRow } from '@/editor/interface/Row'

/**
 * 段落缩进排版：全量与增量路径差分 + 缩进语义断言
 */

const LOREM =
  '床前明月光疑是地上霜举头望明月低头思故乡abcdefghijklmnopqrstuvwxyz0123456789'

function makeIndentDoc(): IElement[] {
  const main: IElement[] = []
  for (let p = 0; p < 3; p++) {
    let value = ''
    for (let c = 0; c < 1500; c++) {
      value += LOREM[(p * 31 + c * 7) % LOREM.length]
    }
    // 前两段带缩进：首行缩进 32 + 左缩进 32；第三段无缩进做对照组
    const attrs =
      p < 2 ? { indentLeft: 32, indentFirstLine: 32 } : { indentRight: 24 }
    main.push({ value: p === 2 ? value : `${value}\n`, ...attrs })
  }
  return main
}

function snapshotRowList(draw: Draw): string {
  const anyDraw = draw as unknown as { rawRowList: IRow[] }
  return JSON.stringify(
    anyDraw.rawRowList.map(row => ({
      startIndex: row.startIndex,
      offsetX: row.offsetX ?? 0,
      width: Math.round(row.width)
    }))
  )
}

function getTwoDraws(computeSpy: ReturnType<typeof vi.spyOn>): [Draw, Draw] {
  const unique = [...new Set(computeSpy.mock.contexts)] as Draw[]
  expect(unique.length).toBeGreaterThanOrEqual(2)
  return [unique[0], unique[1]]
}

function createEditors(data: IElement[]): {
  full: TestEditorContext
  incremental: TestEditorContext
  fullDraw: Draw
  incrementalDraw: Draw
  computeSpy: ReturnType<typeof vi.spyOn>
} {
  vi.restoreAllMocks()
  const computeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
  const full = createTestEditor({ data })
  const incremental = createTestEditor({
    data,
    options: { lab: { incrementalCompute: true } }
  })
  const [fullDraw, incrementalDraw] = getTwoDraws(computeSpy)
  return { full, incremental, fullDraw, incrementalDraw, computeSpy }
}

describe('段落缩进排版', () => {
  it('全量计算：首行与续行偏移正确', () => {
    const { fullDraw } = createEditors(makeIndentDoc())
    const rows = (fullDraw as unknown as { rawRowList: IRow[] }).rawRowList
    // 按段落分组断言：段首行（行首元素为换行符或首行）偏移=左+首行，
    // 段内续行=左缩进；第三段（indentRight only）无行偏移
    let paraIndex = 0
    for (const row of rows) {
      const first = row.elementList[0]
      const isParagraphFirst =
        row.rowIndex === 0 ||
        first?.value === ZERO ||
        first?.type === ElementType.TAB
      if (isParagraphFirst) paraIndex++
      const expected = paraIndex <= 2 ? (isParagraphFirst ? 64 : 32) : undefined
      expect({ row: row.rowIndex, ox: row.offsetX ?? null }).toEqual({
        row: row.rowIndex,
        ox: expected ?? null
      })
    }
    expect(rows.length).toBeGreaterThan(4)
  })

  it('增量路径与全量路径在编辑后保持一致', () => {
    const { full, incremental, fullDraw, incrementalDraw } =
      createEditors(makeIndentDoc())
    // 初始一致
    expect(snapshotRowList(incrementalDraw)).toEqual(snapshotRowList(fullDraw))
    const edits: Array<(ctx: TestEditorContext) => void> = [
      ctx => {
        ctx.editor.command.executeSetRange(30, 30)
        ctx.editor.command.executeInsertElementList([{ value: '插入新文字' }])
      },
      ctx => {
        ctx.editor.command.executeSetRange(500, 500)
        ctx.editor.command.executeInsertElementList([{ value: '再插入一些字' }])
      },
      ctx => {
        ctx.editor.command.executeSetRange(1100, 1100)
        ctx.editor.command.executeInsertElementList([{ value: '第三处插入' }])
      },
      ctx => {
        ctx.editor.command.executeSetRange(20, 20)
        ctx.editor.command.executeBackspace()
      }
    ]
    edits.forEach((edit, step) => {
      edit(full)
      edit(incremental)
      const a = snapshotRowList(fullDraw)
      const b = snapshotRowList(incrementalDraw)
      if (a !== b) {
        throw new Error(
          `第 ${step} 步编辑后行偏移不一致\n全量: ${a.slice(0, 500)}\n增量: ${b.slice(0, 500)}`
        )
      }
    })
  })

  it('运行时开启增量（updateOptions）后编辑仍与全量一致', () => {
    // 复现浏览器操作序列：先建编辑器，再 executeUpdateOptions 开增量
    vi.restoreAllMocks()
    const computeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
    const data = makeIndentDoc()
    const full = createTestEditor({ data })
    const incremental = createTestEditor({ data })
    const [fullDraw, incrementalDraw] = getTwoDraws(computeSpy)
    expect(snapshotRowList(incrementalDraw)).toEqual(snapshotRowList(fullDraw))
    incremental.editor.command.executeUpdateOptions({
      lab: { incrementalCompute: true }
    })
    const edits: Array<(ctx: TestEditorContext) => void> = [
      ctx => {
        ctx.editor.command.executeSetRange(30, 30)
        ctx.editor.command.executeInsertElementList([
          { value: '运行时开启后的插入' }
        ])
      },
      ctx => {
        ctx.editor.command.executeSetRange(500, 500)
        ctx.editor.command.executeInsertElementList([{ value: '第二处编辑' }])
      }
    ]
    edits.forEach((edit, step) => {
      edit(full)
      edit(incremental)
      const a = snapshotRowList(fullDraw)
      const b = snapshotRowList(incrementalDraw)
      if (a !== b) {
        throw new Error(
          `第 ${step} 步编辑后行偏移不一致\n全量: ${a.slice(0, 500)}\n增量: ${b.slice(0, 500)}`
        )
      }
    })
  })

  it('段首tab悬挂：续行对齐tab列', () => {
    const { full, fullDraw } = createEditors([{ value: LOREM.repeat(40) }])
    // tab 走真实插入路径（初始数据的空值元素会被 unzip 丢弃）
    full.editor.command.executeSetRange(0, 0)
    full.editor.command.executeInsertElementList([
      { type: ElementType.TAB, value: '' }
    ])
    const rows = (fullDraw as unknown as { rawRowList: IRow[] }).rawRowList
    // 行0含段首tab（无偏移）；续行悬挂到tab列宽（defaultTabWidth 32）
    expect(rows[0].offsetX).toBeUndefined()
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].offsetX).toBe(32)
    }
    expect(rows.length).toBeGreaterThan(2)
  })

  it('段首Tab键先首行缩进、再次整段缩进，Shift+Tab逐级回退', () => {
    const data: IElement[] = [
      { value: `${LOREM.slice(0, 40)}\n` },
      { value: LOREM.slice(0, 20) }
    ]
    const { full } = createEditors(data)
    const textarea = full.container.querySelector('textarea')!
    expect(textarea).toBeTruthy()
    const pressTab = (shiftKey = false) =>
      textarea.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey,
          bubbles: true,
          cancelable: true
        })
      )
    const getValue = () => full.editor.command.getValue().data.main
    // 第一次 Tab：仅首行缩进 32
    full.editor.command.executeSetRange(0, 0)
    pressTab()
    expect(getValue()[0].indentFirstLine).toBe(32)
    expect(getValue()[0].indentLeft ?? 0).toBe(0)
    // 第二次 Tab：整段左缩进 32（首行缩进保持）
    pressTab()
    expect(getValue()[0].indentLeft).toBe(32)
    expect(getValue()[0].indentFirstLine).toBe(32)
    // 第三次 Tab：整段左缩进 64
    pressTab()
    expect(getValue()[0].indentLeft).toBe(64)
    // Shift+Tab 逐级回退：64→32→0，之后回退首行缩进
    pressTab(true)
    expect(getValue()[0].indentLeft).toBe(32)
    pressTab(true)
    expect(getValue()[0].indentLeft ?? 0).toBe(0)
    expect(getValue()[0].indentFirstLine).toBe(32)
    pressTab(true)
    expect(getValue()[0].indentFirstLine ?? 0).toBe(0)
    // 第二段不受影响
    expect(getValue()[1].indentLeft ?? 0).toBe(0)
    expect(getValue()[1].indentFirstLine ?? 0).toBe(0)
    // 段中 Tab：仍插入制表符元素
    const before = getValue().length
    full.editor.command.executeSetRange(10, 10)
    pressTab()
    const main = getValue()
    expect(main.some(el => el.type === 'tab')).toBe(true)
    expect(main.length).toBeGreaterThanOrEqual(before)
  })
})

/**
 * 右缩进 × 对齐：右缩进计入居中/右对齐的行占位宽度，
 * 右缘停在右边距-右缩进处（与 Word 一致）
 */
describe('右缩进对齐', () => {
  const PAGE_OPTION = {
    width: 794,
    height: 1123,
    margins: [100, 120, 100, 120] as [number, number, number, number],
    header: { disabled: true },
    footer: { disabled: true }
  }

  function renderMain(main: IElement[]): Draw {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const options = mergeOption({ ...PAGE_OPTION })
    formatElementList(main, {
      editorOptions: options,
      isForceCompensation: true
    })
    const draw = new Draw(
      container,
      options,
      { header: [{ value: '\n' }], main, footer: [{ value: '\n' }] },
      new Listener(),
      new EventBus(),
      new Override()
    )
    draw.render()
    return draw
  }

  function getContentEdges(draw: Draw) {
    const positionList = draw.getPosition().getPositionList()
    const contents = positionList.filter(p => p.value && p.value !== ZERO)
    return {
      left: contents[0].coordinate.leftTop[0],
      right: contents[contents.length - 1].coordinate.rightTop[0]
    }
  }

  it('右对齐 + 右缩进：文字右缘停在右边距缩进位置', () => {
    const draw = renderMain([
      { value: 'aaa', rowFlex: RowFlex.RIGHT, indentRight: 64 }
    ])
    const { right } = getContentEdges(draw)
    // 右边距 794-120=674，右缩进 64 → 右缘 610
    expect(right).toBeCloseTo(610)
  })

  it('居中 + 右缩进：在左边距与右缩进之间的盒子内居中', () => {
    const draw = renderMain([
      { value: 'aaa', rowFlex: RowFlex.CENTER, indentRight: 64 }
    ])
    const { left, right } = getContentEdges(draw)
    // 盒子 [120, 610]，内容中线 365（字符度量存在亚像素取整，容差1px）
    expect(Math.abs((left + right) / 2 - 365)).toBeLessThan(1)
  })

  it('左对齐 + 右缩进：不影响左缘，仅收窄换行宽度', () => {
    const base = renderMain([{ value: 'aaa' }])
    const indented = renderMain([{ value: 'aaa', indentRight: 64 }])
    expect(getContentEdges(indented).left).toBeCloseTo(
      getContentEdges(base).left,
      0
    )
  })
})
