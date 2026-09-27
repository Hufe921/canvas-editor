import { describe, it, expect, afterEach } from 'vitest'
import { ElementType } from '../../../src/editor/dataset/enum/Element'
import { PaperDirection } from '../../../src/editor/dataset/enum/Editor'
import { createTestEditor } from '../../factories/editor'
import { setRange } from '../../helpers/range'

function getPageCanvasList(container: HTMLElement): HTMLCanvasElement[] {
  return Array.from(container.querySelectorAll('canvas[data-index]'))
}

function createPageBreakEditor(paperDirection?: PaperDirection) {
  return createTestEditor({
    data: {
      header: [],
      main: [
        { value: '一' },
        { value: '\n' },
        {
          type: ElementType.PAGE_BREAK,
          value: '\n',
          ...(paperDirection ? { paperDirection } : {})
        },
        { value: '二' },
        { value: '\n' }
      ],
      footer: []
    }
  })
}

describe('指定页面横向（混排横竖版）', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('无方向标记时所有页尺寸一致（向后兼容）', () => {
    ctx = createPageBreakEditor()
    const pageList = getPageCanvasList(ctx.container)
    expect(pageList.length).toBe(2)
    expect(pageList[0].style.width).toBe('794px')
    expect(pageList[0].style.height).toBe('1123px')
    expect(pageList[1].style.width).toBe('794px')
    expect(pageList[1].style.height).toBe('1123px')
  })

  it('分页符携带 paperDirection 时后续页宽高互换', () => {
    ctx = createPageBreakEditor(PaperDirection.HORIZONTAL)
    const pageList = getPageCanvasList(ctx.container)
    expect(pageList.length).toBe(2)
    // 首页保持纵向
    expect(pageList[0].style.width).toBe('794px')
    expect(pageList[0].style.height).toBe('1123px')
    // 分页符之后为横向（宽高互换）
    expect(pageList[1].style.width).toBe('1123px')
    expect(pageList[1].style.height).toBe('794px')
  })

  it('executePageDirection 设置并恢复当前节方向', () => {
    ctx = createPageBreakEditor()
    // 光标移动到分页符之后（第二页），分页符前有一个起始占位符
    setRange(ctx.editor, 3, 3)
    ctx.editor.command.executePageDirection(PaperDirection.HORIZONTAL)
    let pageList = getPageCanvasList(ctx.container)
    expect(pageList[1].style.width).toBe('1123px')
    expect(pageList[1].style.height).toBe('794px')
    // 方向标记写入数据层分页符（随 getValue 序列化）
    const main = ctx.editor.command.getValue().data.main
    const pageBreak = main.find(el => el.type === ElementType.PAGE_BREAK)
    expect(pageBreak?.paperDirection).toBe(PaperDirection.HORIZONTAL)
    // 传 null 恢复全局纵向
    ctx.editor.command.executePageDirection(null)
    pageList = getPageCanvasList(ctx.container)
    expect(pageList[1].style.width).toBe('794px')
    expect(pageList[1].style.height).toBe('1123px')
  })

  it('executePageDirection 可撤销', () => {
    ctx = createPageBreakEditor()
    setRange(ctx.editor, 3, 3)
    ctx.editor.command.executePageDirection(PaperDirection.HORIZONTAL)
    let pageList = getPageCanvasList(ctx.container)
    expect(pageList[1].style.width).toBe('1123px')
    ctx.editor.command.executeUndo()
    pageList = getPageCanvasList(ctx.container)
    expect(pageList[1].style.width).toBe('794px')
  })

  it('executePageDirection 只影响当前节', () => {
    ctx = createTestEditor({
      data: {
        header: [],
        main: [
          { value: '一' },
          { value: '\n' },
          { type: ElementType.PAGE_BREAK, value: '\n' },
          { value: '二' },
          { value: '\n' },
          { type: ElementType.PAGE_BREAK, value: '\n' },
          { value: '三' },
          { value: '\n' }
        ],
        footer: []
      }
    })
    setRange(ctx.editor, 3, 3)
    ctx.editor.command.executePageDirection(PaperDirection.HORIZONTAL)
    const pageList = getPageCanvasList(ctx.container)
    expect(pageList).toHaveLength(3)
    expect(pageList[0].style.width).toBe('794px')
    expect(pageList[1].style.width).toBe('1123px')
    expect(pageList[2].style.width).toBe('794px')
  })

  it('executePageDirection 在首节修改全局方向', () => {
    ctx = createTestEditor()
    setRange(ctx.editor, 0, 0)
    ctx.editor.command.executePageDirection(PaperDirection.HORIZONTAL)
    expect(ctx.editor.command.getOptions().paperDirection).toBe(
      PaperDirection.HORIZONTAL
    )
    const pageList = getPageCanvasList(ctx.container)
    expect(pageList[0].style.width).toBe('1123px')
    expect(pageList[0].style.height).toBe('794px')
  })

  it('分页符不在行首且携带方向时后续内容仍分到新页', () => {
    // 分页符紧跟文本（中间无换行），后续内容无尾随换行
    ctx = createTestEditor({
      data: {
        header: [],
        main: [
          { value: '第一页' },
          {
            type: ElementType.PAGE_BREAK,
            value: '\n',
            paperDirection: PaperDirection.HORIZONTAL
          },
          { value: '横向页' }
        ],
        footer: []
      }
    })
    const pageList = getPageCanvasList(ctx.container)
    expect(pageList.length).toBe(2)
    expect(pageList[0].style.width).toBe('794px')
    expect(pageList[1].style.width).toBe('1123px')
    expect(pageList[1].style.height).toBe('794px')
  })

  it('内容增删导致页数变化后方向仍跟随分页符所在节', () => {
    // 构造第一节内容溢出为两页：横向页应顺延为第三页
    const firstSection = Array.from({ length: 120 }, () => [
      { value: '字' },
      { value: '\n' }
    ]).flat()
    ctx = createTestEditor({
      data: {
        header: [],
        main: [
          ...firstSection,
          {
            type: ElementType.PAGE_BREAK,
            value: '\n',
            paperDirection: PaperDirection.HORIZONTAL
          },
          { value: '二' },
          { value: '\n' }
        ],
        footer: []
      }
    })
    const pageList = getPageCanvasList(ctx.container)
    expect(pageList.length).toBeGreaterThan(2)
    // 最后一页（分页符之后的节）为横向，其余页纵向
    const lastPage = pageList[pageList.length - 1]
    expect(lastPage.style.width).toBe('1123px')
    expect(lastPage.style.height).toBe('794px')
    for (let i = 0; i < pageList.length - 1; i++) {
      expect(pageList[i].style.width).toBe('794px')
    }
  })

  it('中间横向节溢出时复用页面同步调整尺寸', () => {
    ctx = createTestEditor({
      data: {
        header: [],
        main: [
          { value: '一' },
          { value: '\n' },
          {
            type: ElementType.PAGE_BREAK,
            value: '\n',
            paperDirection: PaperDirection.HORIZONTAL
          },
          { value: '二' },
          { value: '\n' },
          { type: ElementType.PAGE_BREAK, value: '\n' },
          { value: '三' },
          { value: '\n' }
        ],
        footer: []
      }
    })
    const initialPageList = getPageCanvasList(ctx.container)
    expect(initialPageList[0].parentElement?.parentElement?.style.width).toBe(
      '1123px'
    )
    setRange(ctx.editor, 4, 4)
    const content = Array.from({ length: 80 }, () => [
      { value: '字' },
      { value: '\n' }
    ]).flat()
    ctx.editor.command.executeInsertElementList(content)
    const pageList = getPageCanvasList(ctx.container)
    expect(pageList.length).toBeGreaterThan(3)
    expect(pageList[0].style.width).toBe('794px')
    for (let i = 1; i < pageList.length - 1; i++) {
      expect(pageList[i].style.width).toBe('1123px')
      expect(pageList[i].style.height).toBe('794px')
    }
    expect(pageList[pageList.length - 1].style.width).toBe('794px')
  })
})
