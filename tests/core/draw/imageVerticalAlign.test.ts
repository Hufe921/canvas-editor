import { describe, it, expect, afterEach } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import { IElement } from '@/editor/interface/Element'
import { ElementType } from '@/editor/dataset/enum/Element'
import { ControlType } from '@/editor/dataset/enum/Control'
import { VerticalAlign } from '@/editor/dataset/enum/VerticalAlign'
import { createTestEditor } from '../../factories/editor'

const IMAGE_HEIGHT = 50

function renderMain(main: IElement[]): Draw {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const options = mergeOption({
    width: 794,
    height: 1123,
    margins: [100, 120, 100, 120],
    header: { disabled: true },
    footer: { disabled: true }
  })
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

// 文字 + 图片 + 文字，返回图片与其后文字的位置及文字基准度量
function layoutImage(
  imgVerticalAlign?: VerticalAlign,
  type: ElementType.IMAGE | ElementType.LATEX = ElementType.IMAGE
) {
  const draw = renderMain([
    { value: '前' },
    {
      type,
      value: type === ElementType.LATEX ? 'a^2' : 'data:image/png;base64,test',
      width: 100,
      height: IMAGE_HEIGHT,
      imgVerticalAlign
    },
    { value: '后' }
  ])
  const positionList = draw.getPosition().getPositionList()
  const elementList = draw.getElementList()
  const imageIndex = elementList.findIndex(el => el.type === type)
  const imagePosition = positionList[imageIndex]
  const textPosition = positionList[imageIndex + 1]
  const ctx = document.createElement('canvas').getContext('2d')!
  const basisMetrics = draw
    .getTextParticle()
    .measureBasisWord(ctx, draw.getElementFont(elementList[imageIndex - 1]))
  return {
    row: draw.getRowList()[imagePosition.rowNo],
    // 图片顶部、文字基线（相对行顶）
    imageTop: imagePosition.ascent,
    baseline: textPosition.ascent,
    textAscent: basisMetrics.actualBoundingBoxAscent,
    textDescent: basisMetrics.actualBoundingBoxDescent
  }
}

describe('嵌入型图片、公式垂直对齐', () => {
  it('默认底端对齐：图片底边落在文字基线上', () => {
    const { imageTop, baseline } = layoutImage()
    expect(imageTop + IMAGE_HEIGHT).toBe(baseline)
  })

  it('顶端对齐：图片顶部与文字顶部对齐', () => {
    const { imageTop, baseline, textAscent } = layoutImage(VerticalAlign.TOP)
    expect(imageTop).toBeCloseTo(baseline - textAscent)
  })

  it('居中对齐：图片中线与文字中线对齐', () => {
    const { imageTop, baseline, textAscent, textDescent } = layoutImage(
      VerticalAlign.MIDDLE
    )
    const textMiddle = baseline - (textAscent - textDescent) / 2
    expect(imageTop + IMAGE_HEIGHT / 2).toBeCloseTo(textMiddle)
  })

  it('公式与图片一致：顶端、居中对齐', () => {
    const top = layoutImage(VerticalAlign.TOP, ElementType.LATEX)
    expect(top.imageTop).toBeCloseTo(top.baseline - top.textAscent)
    const middle = layoutImage(VerticalAlign.MIDDLE, ElementType.LATEX)
    expect(middle.imageTop + IMAGE_HEIGHT / 2).toBeCloseTo(
      middle.baseline - (middle.textAscent - middle.textDescent) / 2
    )
    const bottom = layoutImage(undefined, ElementType.LATEX)
    expect(bottom.imageTop + IMAGE_HEIGHT).toBe(bottom.baseline)
  })

  it('隐藏的图片不参与对齐计算，不影响行高', () => {
    const getRowHeight = (imgVerticalAlign?: VerticalAlign) =>
      renderMain([
        { value: '前' },
        {
          type: ElementType.IMAGE,
          value: 'data:image/png;base64,test',
          width: 100,
          height: IMAGE_HEIGHT,
          hide: true,
          imgVerticalAlign
        },
        { value: '后' }
      ]).getRowList()[0].height
    expect(getRowHeight(VerticalAlign.TOP)).toBe(getRowHeight())
    expect(getRowHeight(VerticalAlign.MIDDLE)).toBe(getRowHeight())
  })

  it('非底端对齐时行高仍能容纳整张图片', () => {
    for (const align of [VerticalAlign.TOP, VerticalAlign.MIDDLE]) {
      const { row, imageTop } = layoutImage(align)
      expect(imageTop).toBeGreaterThanOrEqual(0)
      expect(imageTop + IMAGE_HEIGHT).toBeLessThanOrEqual(row.height)
    }
  })
})

describe('imgVerticalAlign 数据保存', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('getValue 保留图片对齐方式', () => {
    ctx = createTestEditor({
      data: [
        { value: '前' },
        {
          type: ElementType.IMAGE,
          value: 'data:image/png;base64,test',
          width: 100,
          height: IMAGE_HEIGHT,
          imgVerticalAlign: VerticalAlign.MIDDLE
        }
      ]
    })
    const image = ctx.editor.command
      .getValue()
      .data.main.find(el => el.type === ElementType.IMAGE)!
    expect(image.imgVerticalAlign).toBe(VerticalAlign.MIDDLE)
  })

  it('executeSetControlValue 设置的控件值图片保留对齐方式', () => {
    ctx = createTestEditor({
      data: [
        {
          type: ElementType.CONTROL,
          value: '',
          control: {
            conceptId: 'image-align',
            type: ControlType.TEXT,
            value: null
          }
        }
      ]
    })
    ctx.editor.command.executeSetControlValue({
      conceptId: 'image-align',
      value: [
        { value: '签名' },
        {
          type: ElementType.IMAGE,
          value: 'data:image/png;base64,test',
          width: 100,
          height: IMAGE_HEIGHT,
          imgVerticalAlign: VerticalAlign.TOP
        }
      ]
    })
    const control = ctx.editor.command
      .getValue()
      .data.main.find(el => el.type === ElementType.CONTROL)!
    const image = control.control!.value!.find(
      el => el.type === ElementType.IMAGE
    )!
    expect(image.imgVerticalAlign).toBe(VerticalAlign.TOP)
  })
})
