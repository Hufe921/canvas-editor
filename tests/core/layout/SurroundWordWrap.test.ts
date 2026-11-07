import { afterEach, describe, expect, it, vi } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { ImageDisplay } from '@/editor/dataset/enum/Common'
import { ElementType } from '@/editor/dataset/enum/Element'
import type { IElement } from '@/editor/interface/Element'
import {
  createTestEditor,
  TestEditorContext
} from '../../factories/editor'

const WORD = 'Multiplanar'

function createSurroundEditor(innerWidth: number, imageX: number) {
  const data: IElement[] = [
    { value: `before ${WORD} after` },
    {
      type: ElementType.IMAGE,
      value: 'data:image/png;base64,test',
      width: 20,
      height: 5,
      imgDisplay: ImageDisplay.SURROUND,
      imgFloatPosition: { x: imageX, y: 0, pageNo: 0 }
    }
  ]
  const computeSpy = vi.spyOn(Draw.prototype, 'computeRowList')
  const ctx = createTestEditor({
    data,
    options: {
      width: innerWidth,
      height: 200,
      margins: [0, 0, 0, 0],
      header: { disabled: true },
      footer: { disabled: true },
      incrementalCompute: false
    } as any
  })
  const draw = computeSpy.mock.contexts[0] as Draw
  return { ctx, draw }
}

describe('四周环绕图片的整词排版', () => {
  let ctx: TestEditorContext | undefined

  afterEach(() => {
    ctx?.destroy()
    ctx = undefined
    vi.restoreAllMocks()
  })

  it('图片后空间足够时，相交单词整体移动到图片右侧', () => {
    const result = createSurroundEditor(100, 10)
    ctx = result.ctx
    const positionList = result.draw.getPosition().getPositionList()
    const wordStart = positionList.findIndex(position => position.value === 'M')
    const wordPositions = positionList.slice(wordStart, wordStart + WORD.length)

    expect(wordPositions.map(position => position.value).join('')).toBe(WORD)
    expect(new Set(wordPositions.map(position => position.rowIndex)).size).toBe(1)
    expect(
      wordPositions.every(
        position => position.coordinate.leftTop[0] >= 30
      )
    ).toBe(true)
  })

  it('图片后空间不足时，相交单词整体换行而不拆分', () => {
    const result = createSurroundEditor(36, 10)
    ctx = result.ctx
    const rows = (result.draw as unknown as { rawRowList: any[] }).rawRowList
    const textRows = rows.map(row =>
      row.elementList
        .filter(
          (element: IElement) =>
            !element.type || element.type === ElementType.TEXT
        )
        .map((element: IElement) => element.value)
        .join('')
    )

    expect(textRows.some((text: string) => text.includes(WORD))).toBe(true)
    expect(textRows[0]).not.toContain('M')
  })

  it('单词在图片前已有足够空间时保持原位置', () => {
    const result = createSurroundEditor(100, 30)
    ctx = result.ctx
    const positionList = result.draw.getPosition().getPositionList()
    const wordStart = positionList.findIndex(position => position.value === 'M')
    const wordPositions = positionList.slice(wordStart, wordStart + WORD.length)

    expect(wordPositions[0].coordinate.leftTop[0]).toBe(8)
    expect(
      wordPositions.every(position => position.coordinate.rightTop[0] <= 30)
    ).toBe(true)
  })
})
