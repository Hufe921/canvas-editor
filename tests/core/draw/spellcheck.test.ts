import { describe, expect, it, vi } from 'vitest'
import { ZERO } from '@/editor/dataset/constant/Common'
import { ControlType } from '@/editor/dataset/enum/Control'
import { ElementType } from '@/editor/dataset/enum/Element'
import { TraceType } from '@/editor/dataset/enum/Trace'
import type { IElement, IElementPosition } from '@/editor/interface/Element'
import type { Position } from '@/editor/core/position/Position'
import { Draw } from '@/editor/core/draw/Draw'
import { Spellcheck } from '@/editor/core/draw/interactive/Spellcheck'
import { mergeOption } from '@/editor/utils/option'

describe('Spellcheck', () => {
  function createSpellcheck(
    elementList: IElement[],
    position = {} as Position
  ) {
    const options = mergeOption({
      spellcheck: { disabled: false }
    })
    const draw = {
      getOptions: () => options,
      getPosition: () => position,
      getOriginalMainElementList: () => elementList,
      getTraceParticle: () => ({
        isTraceHidden: (element: IElement) =>
          element.trace?.at(-1)?.type === TraceType.DELETED
      })
    } as unknown as Draw
    return new Spellcheck(draw)
  }

  function createTable(id: string, value: IElement[]): IElement {
    return {
      id,
      type: ElementType.TABLE,
      value: ZERO,
      trList: [
        {
          id: `${id}-tr`,
          height: 40,
          tdList: [
            {
              id: `${id}-td`,
              colspan: 1,
              rowspan: 1,
              value
            }
          ]
        }
      ],
      colgroup: [{ width: 100 }]
    }
  }

  it('忽略隐藏内容和隐藏留痕', () => {
    const spellcheck = createSpellcheck([
      { value: 'visible' },
      { value: ' ' },
      { value: 'element', hide: true },
      { value: ' ' },
      {
        value: 'control',
        control: {
          type: ControlType.TEXT,
          value: null,
          hide: true
        }
      },
      { value: ' ' },
      { value: 'area', area: { hide: true } },
      { value: ' ' },
      {
        value: 'trace',
        trace: [{ type: TraceType.DELETED }]
      }
    ])

    expect(spellcheck.getSpellcheckWordList()).toEqual([
      {
        word: 'visible',
        startIndex: 0,
        endIndex: 0
      }
    ])
  })

  it('获取嵌套表格单元格中的单词和表格路径', () => {
    const innerTable = createTable('inner-table', [
      { value: ZERO },
      { value: 'Helo' }
    ])
    const outerTable = createTable('outer-table', [
      { value: ZERO },
      innerTable
    ])
    const elementList = [{ value: ZERO }, outerTable]
    const wordPosition = {
      pageNo: 0,
      ascent: 10,
      metrics: { boundingBoxDescent: 2 },
      coordinate: {
        leftTop: [0, 0],
        rightTop: [10, 0]
      }
    } as IElementPosition
    const getTableTdByContext = vi.fn(() => ({
      positionList: [wordPosition, wordPosition]
    }))
    const position = {
      getOriginalMainPositionList: () => [],
      getTableTdByContext
    } as unknown as Position
    const spellcheck = createSpellcheck(elementList, position)

    const wordList = spellcheck.getSpellcheckWordList()
    expect(wordList).toHaveLength(1)
    expect(wordList[0]).toMatchObject({
      word: 'Helo',
      startIndex: 1,
      endIndex: 1,
      tableId: 'inner-table',
      tableIndex: 1,
      trIndex: 0,
      tdIndex: 0
    })
    expect(
      wordList[0].tablePath?.map(({ index, tableId }) => ({ index, tableId }))
    ).toEqual([
      { index: 1, tableId: 'outer-table' },
      { index: 1, tableId: 'inner-table' }
    ])
    spellcheck.setSpellcheckRangeList(wordList)
    expect(
      spellcheck.getRangeByIndex(1, {
        tableId: 'inner-table',
        tableIndex: 1,
        trIndex: 0,
        tdIndex: 0,
        tablePath: [{ index: 0, trIndex: 0, tdIndex: 0 }]
      })
    ).toBeNull()
    expect(spellcheck.getRangeByIndex(1, wordList[0])).toBe(wordList[0])
    const ctx = document.createElement('canvas').getContext('2d')!
    const drawWave = vi.spyOn(ctx, 'quadraticCurveTo')

    spellcheck.render(ctx, 0)

    expect(getTableTdByContext).toHaveBeenCalledWith(
      elementList,
      expect.objectContaining({ tablePath: wordList[0].tablePath })
    )
    expect(drawWave).toHaveBeenCalled()
  })

  it('多码元字符不会导致单词索引偏移', () => {
    const elementList: IElement[] = [
      { value: ZERO },
      { value: '😀' },
      { value: ' ' },
      ...[...'Helo'].map(value => ({ value }))
    ]
    const spellcheck = createSpellcheck(elementList)

    expect(spellcheck.getSpellcheckWordList()).toEqual([
      { word: 'Helo', startIndex: 3, endIndex: 6 }
    ])
  })

  it('合并大文档分词结果时不会展开为函数参数', () => {
    const text = new Array(500_000).fill('word').join(' ')
    const spellcheck = createSpellcheck([{ value: text }])

    expect(() => spellcheck.getSpellcheckWordList()).not.toThrow()
  })
})
