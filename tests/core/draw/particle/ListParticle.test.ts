import { afterEach, describe, expect, it, vi } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { ListParticle } from '@/editor/core/draw/particle/ListParticle'
import {
  listStyleCSSMapping,
  ulStyleMapping
} from '@/editor/dataset/constant/List'
import { ZERO } from '@/editor/dataset/constant/Common'
import { ListStyle, ListType, UlStyle } from '@/editor/dataset/enum/List'
import { IElement } from '@/editor/interface/Element'
import { IRow } from '@/editor/interface/Row'

function createDraw(overrides: Record<string, unknown> = {}) {
  const checkboxRender = vi.fn()
  const options = {
    scale: 1,
    defaultFont: 'Microsoft YaHei',
    defaultSize: 16,
    defaultTabWidth: 32,
    list: { inheritStyle: false },
    checkbox: { width: 14, height: 14, gap: 2 },
    ...overrides
  }
  const draw = {
    getOptions: () => options,
    getRange: () => ({ getRange: () => ({ startIndex: -1, endIndex: -1 }) }),
    getElementFont: (el: IElement) =>
      `${el.size ?? options.defaultSize}px ${el.font ?? options.defaultFont}`,
    getCheckboxParticle: () => ({ render: checkboxRender })
  } as unknown as Draw
  return { particle: new ListParticle(draw), checkboxRender, options }
}

function createMeasureCtx(width = 30) {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    font: '',
    measureText: vi.fn(() => ({ width }))
  } as unknown as CanvasRenderingContext2D
}

function createRowElement(
  listId: string,
  value: string,
  extra: Partial<IElement> = {}
): IElement {
  return {
    value,
    listId,
    listType: ListType.UL,
    listStyle: ListStyle.DIAMOND,
    ...extra
  } as IElement
}

function createRow(elementList: IElement[], listIndex = 0): IRow {
  return {
    elementList,
    offsetX: 0,
    listIndex,
    ascent: 10
  } as unknown as IRow
}

describe('列表样式常量映射', () => {
  it('ulStyleMapping 覆盖全部 UlStyle 且新增样式符号正确', () => {
    expect(Object.keys(ulStyleMapping)).toHaveLength(
      Object.values(UlStyle).length
    )
    expect(ulStyleMapping[UlStyle.DIAMOND]).toBe('◆')
    expect(ulStyleMapping[UlStyle.ARROW]).toBe('➤')
    expect(ulStyleMapping[UlStyle.DIAMOND_FLORAL]).toBe('❖')
    expect(ulStyleMapping[UlStyle.HALF_ARROW]).toBe('➢')
    expect(ulStyleMapping[UlStyle.CHECKMARK]).toBe('✓')
    expect(ulStyleMapping[UlStyle.DIAMOND_HOLLOW]).toBe('✧')
    expect(ulStyleMapping[UlStyle.DISC]).toBe('•')
    expect(ulStyleMapping[UlStyle.CIRCLE]).toBe('◦')
    expect(ulStyleMapping[UlStyle.SQUARE]).toBe('▫︎')
    expect(ulStyleMapping[UlStyle.CHECKBOX]).toBe('☑️')
  })

  it('listStyleCSSMapping 覆盖全部 ListStyle 且新增样式 key 正确', () => {
    expect(Object.keys(listStyleCSSMapping)).toHaveLength(
      Object.values(ListStyle).length
    )
    expect(listStyleCSSMapping[ListStyle.DIAMOND]).toBe('diamond')
    expect(listStyleCSSMapping[ListStyle.DIAMOND_FLORAL]).toBe(
      'diamond-floral'
    )
    expect(listStyleCSSMapping[ListStyle.HALF_ARROW]).toBe('half-arrow')
    expect(listStyleCSSMapping[ListStyle.CHECKMARK]).toBe('checkmark')
    expect(listStyleCSSMapping[ListStyle.DIAMOND_HOLLOW]).toBe(
      'diamond-hollow'
    )
    expect(listStyleCSSMapping[ListStyle.ARROW]).toBe('arrow')
  })
})

describe('ListParticle 序号转换', () => {
  const particle = createDraw().particle

  it('numberToChinese 转换中文数字', () => {
    expect(particle.numberToChinese(0)).toBe('零')
    expect(particle.numberToChinese(9)).toBe('九')
    expect(particle.numberToChinese(10)).toBe('十')
    expect(particle.numberToChinese(11)).toBe('十一')
    expect(particle.numberToChinese(25)).toBe('二十五')
    expect(particle.numberToChinese(30)).toBe('三十')
    expect(particle.numberToChinese(99)).toBe('九十九')
    expect(particle.numberToChinese(100)).toBe('100')
  })

  it('numberToUpperAlpha 转换大写字母，超出范围回退数字', () => {
    expect(particle.numberToUpperAlpha(1)).toBe('A')
    expect(particle.numberToUpperAlpha(26)).toBe('Z')
    expect(particle.numberToUpperAlpha(27)).toBe('27')
  })

  it('numberToLowerAlpha 转换小写字母，超出范围回退数字', () => {
    expect(particle.numberToLowerAlpha(1)).toBe('a')
    expect(particle.numberToLowerAlpha(26)).toBe('z')
    expect(particle.numberToLowerAlpha(27)).toBe('27')
  })

  it('numberToCircled 转换带圈数字，超出范围回退数字', () => {
    expect(particle.numberToCircled(1)).toBe('①')
    expect(particle.numberToCircled(20)).toBe('⑳')
    expect(particle.numberToCircled(21)).toBe('21')
  })
})

describe('ListParticle getListStyleWidth', () => {
  it('新增无序样式按非递增样式返回固定宽度', () => {
    const { particle } = createDraw()
    const ctx = createMeasureCtx()
    const newStyles = [
      ListStyle.DIAMOND,
      ListStyle.DIAMOND_FLORAL,
      ListStyle.HALF_ARROW,
      ListStyle.CHECKMARK,
      ListStyle.DIAMOND_HOLLOW,
      ListStyle.ARROW
    ]
    for (const style of newStyles) {
      const list = [
        createRowElement('l1', ZERO, { listStyle: style })
      ]
      expect(particle.getListStyleWidth(ctx, list)).toBe(20)
    }
    expect(ctx.measureText).not.toHaveBeenCalled()
  })

  it('固定宽度按 scale 缩放', () => {
    const { particle } = createDraw({ scale: 2 })
    const ctx = createMeasureCtx()
    const list = [createRowElement('l1', ZERO)]
    expect(particle.getListStyleWidth(ctx, list)).toBe(40)
  })

  it('复选框样式返回复选框宽度加间距', () => {
    const { particle } = createDraw()
    const ctx = createMeasureCtx()
    const list = [
      createRowElement('l1', ZERO, { listStyle: ListStyle.CHECKBOX })
    ]
    // (width 14 + LIST_GAP 10) * scale 1
    expect(particle.getListStyleWidth(ctx, list)).toBe(24)
  })

  it('无显式样式的有序列表按 decimal 递增样式测量宽度', () => {
    const { particle } = createDraw()
    const ctx = createMeasureCtx(30)
    const list = [
      createRowElement('l1', ZERO, {
        listType: ListType.OL,
        listStyle: undefined
      }),
      createRowElement('l1', 'a', {
        listType: ListType.OL,
        listStyle: undefined
      }),
      createRowElement('l1', ZERO, {
        listType: ListType.OL,
        listStyle: undefined
      }),
      createRowElement('l1', 'b', {
        listType: ListType.OL,
        listStyle: undefined
      }),
      createRowElement('l1', ZERO, {
        listType: ListType.OL,
        listStyle: undefined
      }),
      createRowElement('l1', 'c', {
        listType: ListType.OL,
        listStyle: undefined
      })
    ]
    expect(particle.getListStyleWidth(ctx, list)).toBe(40)
    expect(ctx.measureText).toHaveBeenCalledWith('3.')
    expect(ctx.font).toBe('16px Microsoft YaHei')
  })

  it.each([
    [ListStyle.DECIMAL, '3.'],
    [ListStyle.DECIMAL_PARENTHESES, '(3)'],
    [ListStyle.DECIMAL_RIGHT_PAREN, '3)'],
    [ListStyle.UPPER_ALPHA, 'C.'],
    [ListStyle.LOWER_ALPHA, 'c.'],
    [ListStyle.CIRCLED_DECIMAL, '③'],
    [ListStyle.CHINESE, '三、'],
    [ListStyle.CHINESE_PARENTHESES, '（三）']
  ])('递增样式 %s 以最大序号格式化并测量宽度', (style, label) => {
    const { particle } = createDraw()
    const ctx = createMeasureCtx(30)
    const list = [
      createRowElement('l1', ZERO, { listType: ListType.OL, listStyle: style }),
      createRowElement('l1', 'a', { listType: ListType.OL, listStyle: style }),
      createRowElement('l1', ZERO, { listType: ListType.OL, listStyle: style }),
      createRowElement('l1', 'b', { listType: ListType.OL, listStyle: style }),
      createRowElement('l1', ZERO, { listType: ListType.OL, listStyle: style }),
      createRowElement('l1', 'c', { listType: ListType.OL, listStyle: style })
    ]
    expect(particle.getListStyleWidth(ctx, list)).toBe(40)
    expect(ctx.measureText).toHaveBeenCalledWith(label)
  })

  it('递增样式宽度向上取整并按 scale 缩放', () => {
    const { particle } = createDraw({ scale: 2 })
    const ctx = createMeasureCtx(30.4)
    const list = [
      createRowElement('l1', ZERO, {
        listType: ListType.OL,
        listStyle: ListStyle.DECIMAL
      })
    ]
    expect(particle.getListStyleWidth(ctx, list)).toBe(81)
  })

  it('无列表项时不测量宽度返回 0', () => {
    const { particle } = createDraw()
    const ctx = createMeasureCtx()
    const list = [
      createRowElement('l1', 'a', {
        listType: ListType.OL,
        listStyle: ListStyle.DECIMAL
      })
    ]
    expect(particle.getListStyleWidth(ctx, list)).toBe(0)
    expect(ctx.measureText).not.toHaveBeenCalled()
  })

  it('inheritStyle 时使用带样式元素字体测量', () => {
    const { particle } = createDraw({ list: { inheritStyle: true } })
    const ctx = createMeasureCtx(30)
    const list = [
      createRowElement('l1', ZERO, {
        listType: ListType.OL,
        listStyle: ListStyle.DECIMAL
      }),
      createRowElement('l1', 'a', {
        listType: ListType.OL,
        listStyle: ListStyle.DECIMAL,
        bold: true
      })
    ]
    expect(particle.getListStyleWidth(ctx, list)).toBe(40)
    expect(ctx.font).toBe('16px Microsoft YaHei')
  })
})

describe('ListParticle computeListStyle', () => {
  it('按 listId 分组计算每个列表样式宽度', () => {
    const { particle } = createDraw()
    const ctx = createMeasureCtx(30)
    const elementList = [
      createRowElement('l1', ZERO, {
        listType: ListType.OL,
        listStyle: ListStyle.DECIMAL
      }),
      createRowElement('l1', 'a', {
        listType: ListType.OL,
        listStyle: ListStyle.DECIMAL
      }),
      createRowElement('l2', ZERO, {
        listType: ListType.OL,
        listStyle: ListStyle.DECIMAL
      }),
      createRowElement('l2', 'b', {
        listType: ListType.OL,
        listStyle: ListStyle.DECIMAL
      })
    ]
    const result = particle.computeListStyle(ctx, elementList)
    expect([...result.keys()]).toEqual(['l1', 'l2'])
    expect(result.get('l1')).toBe(40)
    expect(result.get('l2')).toBe(40)
  })
})

describe('ListParticle drawListStyle', () => {
  function createContext() {
    return {
      font: '',
      save: vi.fn(),
      restore: vi.fn(),
      fillText: vi.fn()
    }
  }

  function draw(
    particle: ListParticle,
    ctx: ReturnType<typeof createContext>,
    row: IRow
  ) {
    particle.drawListStyle(
      ctx as unknown as Parameters<ListParticle['drawListStyle']>[0],
      row,
      {
        coordinate: { leftTop: [0, 0] }
      } as unknown as Parameters<ListParticle['drawListStyle']>[2]
    )
  }

  it('新增无序样式在段首渲染对应符号', () => {
    const { particle } = createDraw()
    const ctx = createContext()
    const row = createRow([
      createRowElement('l1', ZERO),
      createRowElement('l1', 'text')
    ])
    draw(particle, ctx, row)
    expect(ctx.fillText).toHaveBeenCalledWith('◆', 0, 10)
    expect(ctx.font).toBe('16px Microsoft YaHei')
    expect(ctx.save).toHaveBeenCalled()
    expect(ctx.restore).toHaveBeenCalled()
  })

  it.each([
    [0, '◆', 0],
    [1, '◦', 30],
    [2, '▫︎', 60],
    [3, '•', 90]
  ])(
    '嵌套无序列表按层级轮换符号（level %i 渲染 %s）',
    (level, expected, x) => {
      const { particle } = createDraw()
      const ctx = createContext()
      const row = createRow([
        createRowElement('l1', ZERO, { listLevel: level })
      ])
      draw(particle, ctx, row)
      expect(ctx.fillText).toHaveBeenCalledWith(expected, x, 10)
    }
  )

  it('带缩进层级的列表符号按层级偏移', () => {
    const { particle } = createDraw()
    const ctx = createContext()
    const row = createRow([
      createRowElement('l1', ZERO, { listLevel: 2 })
    ])
    draw(particle, ctx, row)
    // LIST_INDENT_WIDTH 30 * level 2 * scale 1
    expect(ctx.fillText).toHaveBeenCalledWith('▫︎', 60, 10)
  })

  it('符号位置计入 offsetX 与行 Tab 宽度', () => {
    const { particle } = createDraw()
    const ctx = createContext()
    const row = createRow([
      createRowElement('l1', ZERO),
      { value: '', type: 'tab' } as unknown as IElement,
      { value: '', type: 'tab' } as unknown as IElement
    ])
    ;(row as any).offsetX = 5
    draw(particle, ctx, row)
    // defaultTabWidth 32 * 2 - offsetX 5
    expect(ctx.fillText).toHaveBeenCalledWith('◆', 59, 10)
  })

  it.each([
    [ListStyle.DECIMAL_RIGHT_PAREN, 4, '5)'],
    [ListStyle.CIRCLED_DECIMAL, 0, '①'],
    [ListStyle.CHINESE_PARENTHESES, 9, '（十）'],
    [ListStyle.UPPER_ALPHA, 25, 'Z.'],
    [ListStyle.DECIMAL_PARENTHESES, 2, '(3)']
  ])('有序列表新样式 %s 按序号渲染标签', (style, listIndex, label) => {
    const { particle } = createDraw()
    const ctx = createContext()
    const row = createRow(
      [
        createRowElement('l1', ZERO, {
          listType: ListType.OL,
          listStyle: style
        }),
        createRowElement('l1', 'text', {
          listType: ListType.OL,
          listStyle: style
        })
      ],
      listIndex
    )
    draw(particle, ctx, row)
    expect(ctx.fillText).toHaveBeenCalledWith(label, 0, 10)
  })

  it('复选框样式走 CheckboxParticle 渲染', () => {
    const { particle, checkboxRender } = createDraw()
    const ctx = createContext()
    const row = createRow([
      createRowElement('l1', ZERO, { listStyle: ListStyle.CHECKBOX }),
      createRowElement('l1', 'text', { listStyle: ListStyle.CHECKBOX })
    ])
    draw(particle, ctx, row)
    expect(ctx.fillText).not.toHaveBeenCalled()
    expect(checkboxRender).toHaveBeenCalledOnce()
    const renderArgs = checkboxRender.mock.calls[0][0]
    expect(renderArgs.x).toBe(-2)
    // 复选框元素插入到行元素列表最前面
    expect(renderArgs.row.elementList).toHaveLength(3)
  })

  it('非段首元素不渲染列表符号', () => {
    const { particle } = createDraw()
    const ctx = createContext()
    const row = createRow([createRowElement('l1', 'text')])
    draw(particle, ctx, row)
    expect(ctx.fillText).not.toHaveBeenCalled()
  })
})

describe('ListParticle 清理与层级', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('clearListInfo 仅在有 listId 时委托删除列表属性', () => {
    const deleteElementProperty = vi.fn()
    const draw = {
      getOptions: () => ({ scale: 1 }),
      getRange: () => ({ getRange: () => ({ startIndex: -1, endIndex: -1 }) }),
      deleteElementProperty
    } as unknown as Draw
    const particle = new ListParticle(draw)
    const withList = createRowElement('l1', 'a')
    const withoutList = { value: 'b' } as IElement
    particle['clearListInfo'](withList)
    particle['clearListInfo'](withoutList)
    expect(deleteElementProperty).toHaveBeenCalledOnce()
    expect(deleteElementProperty).toHaveBeenCalledWith(withList, [
      'listId',
      'listType',
      'listStyle',
      'listWrap',
      'listLevel'
    ])
  })
})
