import { afterEach, describe, expect, it } from 'vitest'
import { Command } from '@/editor/core/command/Command'
import { CommandAdapt } from '@/editor/core/command/CommandAdapt'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { ZERO } from '@/editor/dataset/constant/Common'
import { LocationPosition } from '@/editor/dataset/enum/Common'
import { ElementType } from '@/editor/dataset/enum/Element'
import { IEditorOption } from '@/editor/interface/Editor'
import { IElement } from '@/editor/interface/Element'
import { formatElementList, zipElementList } from '@/editor/utils/element'
import { mergeOption } from '@/editor/utils/option'

function createDraw(data: IElement[], options: IEditorOption = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const editorOptions = mergeOption({
    width: 794,
    height: 1123,
    margins: [100, 120, 100, 120],
    ...options
  })
  formatElementList(data, {
    editorOptions,
    isForceCompensation: true
  })
  const draw = new Draw(
    container,
    editorOptions,
    {
      header: [{ value: '\n' }],
      main: data,
      footer: [{ value: '\n' }]
    },
    new Listener(),
    new EventBus(),
    new Override()
  )
  draw.render({ isLazy: false, isSubmitHistory: false })
  const command = new Command(new CommandAdapt(draw))
  return { draw, command }
}

function getFootnoteText(element: IElement): string {
  return (element.valueList || [])
    .filter(item => item.value !== ZERO)
    .map(item => item.value)
    .join('')
}

describe('脚注', () => {
  let draw: Draw | null = null

  afterEach(() => {
    draw?.destroy()
    draw = null
    document.body.innerHTML = ''
  })

  it('序列化保留引用与正文并应用默认字号', () => {
    draw = createDraw([
      { value: 'body' },
      {
        type: ElementType.FOOTNOTE,
        value: '',
        footnoteId: 'note-1',
        valueList: [{ value: 'note', bold: true }]
      }
    ]).draw
    const footnote = draw
      .getOriginalMainElementList()
      .find(element => element.type === ElementType.FOOTNOTE)!
    const zipped = zipElementList([footnote])[0]

    expect(zipped.footnoteId).toBe('note-1')
    expect(getFootnoteText(zipped)).toBe('note')
    expect(zipped.valueList).toHaveLength(1)
    expect(zipped.valueList?.[0].value).toBe('note')
    expect(
      zipped.valueList?.every(
        element => element.value === ZERO || element.size === 10
      )
    ).toBe(true)
    expect(zipped.valueList?.find(element => element.bold)?.bold).toBe(true)
  })

  it('插入多个脚注后自动编号且不会重复补偿零宽字符', () => {
    const context = createDraw([{ value: 'body' }])
    draw = context.draw
    draw.getRange().setRange(0, 0)
    const firstId = context.command.executeInsertFootnote({
      value: [{ value: 'first' }]
    })
    const lastIndex = draw.getOriginalMainElementList().length - 1
    draw.getRange().setRange(lastIndex, lastIndex)
    const secondId = context.command.executeInsertFootnote({
      value: [{ value: 'second' }]
    })
    const references = draw
      .getOriginalMainElementList()
      .filter(element => element.type === ElementType.FOOTNOTE)

    expect(references.map(element => element.value)).toEqual(['1', '2'])
    expect(references.map(element => element.footnoteId)).toEqual([
      firstId,
      secondId
    ])
    expect(
      references.map(
        element => element.valueList?.filter(item => item.value === ZERO).length
      )
    ).toEqual([1, 1])
    expect(getFootnoteText(references[0])).toBe('first')
    expect(getFootnoteText(references[1])).toBe('second')
  })

  it('支持更新、读取和双向定位', () => {
    const context = createDraw([
      { value: 'body' },
      {
        type: ElementType.FOOTNOTE,
        value: '',
        footnoteId: 'note-1',
        valueList: [{ value: 'before' }]
      }
    ])
    draw = context.draw
    context.command.executeSetFootnoteValue({
      id: 'note-1',
      value: [{ value: 'after', italic: true }]
    })

    const result = context.command.getFootnoteValue({ id: 'note-1' })
    expect(result?.id).toBe('note-1')
    expect(getFootnoteText({ value: '', valueList: result?.value })).toBe(
      'after'
    )
    expect(result?.value.find(element => element.italic)?.italic).toBe(true)

    context.command.executeLocationFootnote('note-1')
    expect(draw.getPosition().getPositionContext().isFootnote).toBe(true)
    expect(draw.getPosition().getPositionContext().footnoteId).toBe('note-1')
    expect(
      draw
        .getElementList()
        .map(element => element.value)
        .join('')
    ).toBe(`${ZERO}after`)

    context.command.executeLocationFootnote('note-1', {
      position: LocationPosition.BEFORE
    })
    expect(draw.getPosition().getPositionContext().isFootnote).toBe(false)
    expect(draw.getRange().getRange().startIndex).toBe(5)
  })

  it('页底位置命中后编辑的是脚注正文', () => {
    draw = createDraw([
      { value: 'body' },
      {
        type: ElementType.FOOTNOTE,
        value: '',
        footnoteId: 'note-1',
        valueList: [{ value: 'note' }]
      }
    ]).draw
    const layout = draw.getFootnote().getPageLayoutById('note-1')!
    const target = layout.positionList.find(position => position.value === 'o')!
    const { leftTop, rightTop, leftBottom } = target.coordinate
    const result = draw.getPosition().adjustPositionContext({
      x: (leftTop[0] + rightTop[0]) / 2,
      y: (leftTop[1] + leftBottom[1]) / 2,
      pageNo: layout.pageNo
    })!

    expect(result.isFootnote).toBe(true)
    expect(result.footnoteId).toBe('note-1')
    expect(result.index).toBe(layout.referenceIndex)
    draw
      .getRange()
      .setRange(result.footnoteValueIndex!, result.footnoteValueIndex!)
    draw.insertElementList([{ value: 'X' }], { isSubmitHistory: false })

    const reference = draw.getOriginalMainElementList()[layout.referenceIndex]
    expect(getFootnoteText(reference)).toContain('X')
    expect(
      draw
        .getOriginalMainElementList()
        .filter(element => element.type !== ElementType.FOOTNOTE)
        .some(element => element.value === 'X')
    ).toBe(false)
  })

  it('引用与页底布局同页并为脚注预留正文空间', () => {
    draw = createDraw([
      { value: 'first\nsecond\nthird' },
      {
        type: ElementType.FOOTNOTE,
        value: '',
        footnoteId: 'note-1',
        valueList: [{ value: 'a long footnote '.repeat(20) }]
      },
      { value: Array.from({ length: 80 }, () => 'body line').join('\n') }
    ]).draw
    const layout = draw.getFootnote().getPageLayoutById('note-1')!
    const referencePosition = draw.getPosition().getOriginalMainPositionList()[
      layout.referenceIndex
    ]
    const page = draw.getPageSize(layout.pageNo)
    const bodyBottom = Math.max(
      ...draw
        .getPosition()
        .getOriginalMainPositionList()
        .filter(position => position.pageNo === layout.pageNo)
        .map(position => position.coordinate.leftBottom[1])
    )

    expect(referencePosition.pageNo).toBe(layout.pageNo)
    expect(layout.height).toBeGreaterThan(0)
    expect(bodyBottom).toBeLessThanOrEqual(page.height - page.margins[2])
    expect(draw.getFootnote().getPageLayoutList(layout.pageNo)).toHaveLength(1)
  })

  it('复制产生重复 ID 时保留两个独立脚注', () => {
    draw = createDraw([
      {
        type: ElementType.FOOTNOTE,
        value: '',
        footnoteId: 'duplicated',
        valueList: [{ value: 'first' }]
      },
      {
        type: ElementType.FOOTNOTE,
        value: '',
        footnoteId: 'duplicated',
        valueList: [{ value: 'second' }]
      }
    ]).draw
    const references = draw
      .getOriginalMainElementList()
      .filter(element => element.type === ElementType.FOOTNOTE)

    expect(references.map(element => element.value)).toEqual(['1', '2'])
    expect(new Set(references.map(element => element.footnoteId)).size).toBe(2)
    expect(references.map(getFootnoteText)).toEqual(['first', 'second'])
  })

  it('Ctrl 点击在正文引用与页底正文之间跳转', () => {
    draw = createDraw([
      { value: 'body' },
      {
        type: ElementType.FOOTNOTE,
        value: '',
        footnoteId: 'note-1',
        valueList: [{ value: 'note' }]
      }
    ]).draw
    const layout = draw.getFootnote().getPageLayoutById('note-1')!
    const referencePosition = draw.getPosition().getOriginalMainPositionList()[
      layout.referenceIndex
    ]
    const page = draw.getPageList()[layout.pageNo]
    const clickPosition = (x: number, y: number) => {
      page.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          clientX: x,
          clientY: y,
          ctrlKey: true
        })
      )
    }
    const referenceRect = referencePosition.coordinate
    clickPosition(
      (referenceRect.leftTop[0] + referenceRect.rightTop[0]) / 2,
      referenceRect.leftTop[1] + 1
    )
    expect(draw.getPosition().getPositionContext().isFootnote).toBe(true)

    const notePosition = layout.positionList.find(
      position => position.value === 'n'
    )!
    clickPosition(
      (notePosition.coordinate.leftTop[0] +
        notePosition.coordinate.rightTop[0]) /
        2,
      notePosition.coordinate.leftTop[1] + 1
    )
    expect(draw.getPosition().getPositionContext().isFootnote).toBe(false)
    expect(draw.getRange().getRange().startIndex).toBe(layout.referenceIndex)
  })

  it('长脚注截断显示且不会无限分页', () => {
    draw = createDraw(
      [
        { value: 'body' },
        {
          type: ElementType.FOOTNOTE,
          value: '',
          footnoteId: 'note-1',
          valueList: [{ value: 'long footnote '.repeat(300) }]
        }
      ],
      { height: 400 }
    ).draw
    const layout = draw.getFootnote().getPageLayoutById('note-1')!

    expect(layout.visibleRowList.length).toBeGreaterThan(0)
    expect(layout.visibleRowList.length).toBeLessThan(layout.rowList.length)
    expect(draw.getPageRowList().length).toBeLessThan(10)
  })
})
