import { describe, expect, it } from 'vitest'
import { TextParticle } from '@/editor/core/draw/particle/TextParticle'
import { DisplayList } from '@/editor/core/render/model/DisplayList'
import {
  ControlComponent,
  ControlType
} from '@/editor/dataset/enum/Control'
import { RenderMode } from '@/editor/dataset/enum/Editor'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'
import type { Draw } from '@/editor/core/draw/Draw'
import type { IElement } from '@/editor/interface/Element'
import type { IRowElement } from '@/editor/interface/Row'

function createParticle(direction: TextDirection) {
  const draw = {
    getOptions: () => ({
      defaultColor: '#000',
      defaultDirection: TextDirection.LTR,
      renderMode: RenderMode.SPEED,
      scale: 1,
      underlineColor: '#000'
    }),
    getTextMeasurer: () => ({})
  } as unknown as Draw
  const particle = new TextParticle(draw)
  const element = {
    value: '',
    direction,
    style: '16px sans-serif',
    metrics: {
      width: 10,
      height: 16,
      boundingBoxAscent: 12,
      boundingBoxDescent: 4
    }
  } as IRowElement
  return { particle, element }
}

describe('TextParticle direction', () => {
  it('LTR 保留原绘制路径且不写入 direction 状态', () => {
    const { particle, element } = createParticle(TextDirection.LTR)
    const displayList = new DisplayList()

    particle.record(displayList, { ...element, value: 'a' }, 10, 20)
    particle.record(displayList, { ...element, value: 'b' }, 20, 20)
    particle.complete()

    const operations = displayList.getOperations()
    const fillText = operations.find(operation => operation.type === 'fillText')
    expect(
      fillText && 'args' in fillText ? fillText.args.slice(0, 3) : []
    ).toEqual(['ab', 10, 20])
    expect(
      operations.some(
        operation =>
          operation.type === 'set' && operation.property === 'direction'
      )
    ).toBe(false)
  })

  it('RTL 合并完整文本 run 并使用视觉包围盒左缘', () => {
    const { particle, element } = createParticle(TextDirection.RTL)
    const displayList = new DisplayList()

    particle.record(displayList, { ...element, value: 'ا' }, 100, 20)
    particle.record(displayList, { ...element, value: 'ب' }, 90, 20)
    particle.complete()

    const operations = displayList.getOperations()
    const fillText = operations.find(operation => operation.type === 'fillText')
    expect(
      fillText && 'args' in fillText ? fillText.args.slice(0, 3) : []
    ).toEqual(['اب', 90, 20])
    expect(
      operations.some(
        operation =>
          operation.type === 'set' &&
          operation.property === 'direction' &&
          operation.value === 'rtl'
      )
    ).toBe(true)
  })

  it('不同颜色共享完整 shaping run 并按视觉区域裁剪', () => {
    const { particle, element } = createParticle(TextDirection.RTL)
    const displayList = new DisplayList()

    particle.record(
      displayList,
      { ...element, value: 'ا', color: '#000' },
      100,
      20
    )
    particle.record(
      displayList,
      { ...element, value: 'ب', color: '#f00' },
      90,
      20
    )
    particle.complete()

    const operations = displayList.getOperations()
    const fillTextList = operations.filter(
      operation => operation.type === 'fillText'
    )
    expect(fillTextList).toHaveLength(2)
    expect(
      fillTextList.map(operation =>
        'args' in operation ? operation.args[0] : ''
      )
    ).toEqual(['اب', 'اب'])
    expect(
      operations.filter(operation => operation.type === 'clip')
    ).toHaveLength(2)
  })
})

describe('directional font runs', () => {
  it('跨字体按独立 run 绘制并使用各自视觉起点', () => {
    const { particle, element } = createParticle(TextDirection.RTL)
    const displayList = new DisplayList()

    particle.record(displayList, { ...element, value: 'ا' }, 100, 20)
    particle.record(
      displayList,
      { ...element, value: 'ب', style: '18px serif' },
      90,
      20
    )
    particle.complete()

    const fillTextList = displayList
      .getOperations()
      .filter(operation => operation.type === 'fillText')
    expect(
      fillTextList.map(operation =>
        'args' in operation ? operation.args.slice(0, 3) : []
      )
    ).toEqual([
      ['ا', 100, 20],
      ['ب', 90, 20]
    ])
  })

  it('按视觉连续性与 BiDi 层级拆分混排绘制 run', () => {
    const { particle, element } = createParticle(TextDirection.RTL)
    const displayList = new DisplayList()

    particle.record(
      displayList,
      { ...element, value: ' ', bidiLevel: 1 },
      150,
      20
    )
    particle.record(
      displayList,
      { ...element, value: '1', bidiLevel: 2 },
      160,
      20
    )
    particle.record(
      displayList,
      { ...element, value: '2', bidiLevel: 2 },
      170,
      20
    )
    particle.record(
      displayList,
      { ...element, value: 'ا', bidiLevel: 1 },
      50,
      20
    )
    particle.record(
      displayList,
      { ...element, value: 'ب', bidiLevel: 1 },
      40,
      20
    )
    particle.complete()

    const fillTextList = displayList
      .getOperations()
      .filter(operation => operation.type === 'fillText')
    expect(
      fillTextList.map(operation =>
        'args' in operation ? operation.args.slice(0, 3) : []
      )
    ).toEqual([
      [' ', 150, 20],
      ['12', 160, 20],
      ['اب', 40, 20]
    ])
    const directionList = displayList
      .getOperations()
      .filter(
        operation =>
          operation.type === 'set' && operation.property === 'direction'
      )
    expect(
      directionList.map(operation =>
        operation.type === 'set' ? operation.value : ''
      )
    ).toEqual(['rtl', 'ltr', 'rtl'])
  })

  it('同一 BiDi 层级的连写文本不因坐标误差误拆', () => {
    const { particle, element } = createParticle(TextDirection.RTL)
    const displayList = new DisplayList()

    particle.record(
      displayList,
      { ...element, value: 'أ', bidiLevel: 1 },
      110,
      20
    )
    particle.record(
      displayList,
      { ...element, value: 'و', bidiLevel: 1 },
      100,
      20
    )
    particle.record(
      displayList,
      { ...element, value: 'ا', bidiLevel: 1 },
      90,
      20
    )
    particle.record(
      displayList,
      { ...element, value: 'ف', bidiLevel: 1 },
      80,
      20
    )
    particle.record(
      displayList,
      { ...element, value: 'ق', bidiLevel: 1 },
      72,
      20
    )
    particle.complete()

    const fillText = displayList
      .getOperations()
      .find(operation => operation.type === 'fillText')
    expect(
      fillText && 'args' in fillText ? fillText.args.slice(0, 3) : []
    ).toEqual(['أوافق', 72, 20])
  })

  it('复选框选项尾部间距不拆分 RTL 连写文本', () => {
    const { particle, element } = createParticle(TextDirection.RTL)
    const displayList = new DisplayList()
    const optionControl = {
      type: ControlType.CHECKBOX
    } as IElement['control']
    const values = Array.from('أوافق')

    values.forEach((value, index) => {
      const isLast = index === values.length - 1
      particle.record(
        displayList,
        {
          ...element,
          value,
          bidiLevel: 1,
          letterSpacing: isLast ? 5 : 0,
          controlComponent: ControlComponent.VALUE,
          control: optionControl
        },
        110 - index * 10,
        20
      )
    })
    particle.complete()

    const fillText = displayList
      .getOperations()
      .find(operation => operation.type === 'fillText')
    expect(
      fillText && 'args' in fillText ? fillText.args.slice(0, 3) : []
    ).toEqual(['أوافق', 75, 20])
  })

  it('Kashida 两端对齐仍按完整连写 run 绘制', () => {
    const { particle, element } = createParticle(TextDirection.RTL)
    const displayList = new DisplayList()
    const values = ['مـ', 'ر', 'حـ', 'بـ', 'ا']

    values.forEach((value, index) => {
      particle.record(
        displayList,
        {
          ...element,
          value: Array.from('مرحبا')[index],
          justifyValue: value.includes('ـ') ? value : undefined,
          bidiLevel: 1
        },
        100 - index * 20,
        20
      )
    })
    particle.complete()

    const fillText = displayList
      .getOperations()
      .find(operation => operation.type === 'fillText')
    expect(
      fillText && 'args' in fillText ? fillText.args.slice(0, 3) : []
    ).toEqual(['مـرحـبـا', 20, 20])
  })
})
