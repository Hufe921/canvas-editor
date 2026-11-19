import { describe, expect, it } from 'vitest'
import { LabelParticle } from '@/editor/core/draw/particle/LabelParticle'
import { DisplayList } from '@/editor/core/render/model/DisplayList'
import { TextDirection } from '@/editor/dataset/enum/TextDirection'
import type { Draw } from '@/editor/core/draw/Draw'
import type { IRowElement } from '@/editor/interface/Row'

describe('LabelParticle direction', () => {
  it('RTL 文本从标签背景的物理左缘开始绘制', () => {
    const draw = {
      getOptions: () => ({
        scale: 1,
        label: {
          defaultBackgroundColor: '#eef',
          defaultColor: '#00f',
          defaultBorderRadius: 2,
          defaultPadding: [2, 4, 2, 4]
        }
      })
    } as unknown as Draw
    const element = {
      value: 'التهاب تنفسي حاد',
      style: '14px sans-serif',
      metrics: {
        width: 100,
        height: 20,
        boundingBoxAscent: 16,
        boundingBoxDescent: 4
      }
    } as IRowElement
    const displayList = new DisplayList()

    new LabelParticle(draw).render(
      displayList,
      element,
      10,
      20,
      TextDirection.RTL
    )

    const operations = displayList.getOperations()
    const fillText = operations.find(operation => operation.type === 'fillText')
    expect(
      fillText && 'args' in fillText ? fillText.args.slice(0, 3) : []
    ).toEqual(['التهاب تنفسي حاد', 14, 20])
    expect(
      operations.some(
        operation =>
          operation.type === 'set' &&
          operation.property === 'direction' &&
          operation.value === 'rtl'
      )
    ).toBe(true)
    expect(
      operations.some(
        operation =>
          operation.type === 'set' &&
          operation.property === 'textAlign' &&
          operation.value === 'left'
      )
    ).toBe(true)
  })
})
