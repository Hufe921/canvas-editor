import { afterEach, describe, expect, it } from 'vitest'
import { ZERO } from '@/editor/dataset/constant/Common'
import { ElementType } from '@/editor/dataset/enum/Element'
import { EditorMode } from '@/editor/dataset/enum/Editor'
import { ListType } from '@/editor/dataset/enum/List'
import { Draw } from '@/editor/core/draw/Draw'
import {
  getParagraphBlock,
  isParagraphDraggable,
  moveParagraphBlock
} from '@/editor/core/draw/particle/ParagraphDragParticle'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { IElement } from '@/editor/interface/Element'
import { IEditorOption } from '@/editor/interface/Editor'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'

function createDraw(data: IElement[], options: IEditorOption = {}) {
  const container = document.createElement('div')
  document.body.append(container)
  const editorOptions = mergeOption({
    paragraphDrag: { disabled: false },
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
  return draw
}

function dispatchMouse(
  draw: Draw,
  type: 'mousedown' | 'mousemove' | 'mouseup',
  x: number,
  y: number
) {
  const page = draw.getPageList()[0]
  page.dispatchEvent(
    new MouseEvent(type, {
      bubbles: true,
      button: 0,
      clientX: x,
      clientY: y
    })
  )
}

describe('ParagraphDragParticle', () => {
  let draw: Draw | null = null

  afterEach(() => {
    draw?.destroy()
    draw = null
    document.body.innerHTML = ''
  })

  it('默认关闭且不生成拖拽手柄', () => {
    draw = createDraw([{ value: 'first\nsecond' }], {
      paragraphDrag: { disabled: true }
    })

    expect(draw.getParagraphDragParticle().getHandleList(0)).toHaveLength(0)
    const page = draw.getPageList()[0]
    page.style.cursor = 'pointer'
    dispatchMouse(draw, 'mousemove', 0, 0)
    expect(page.style.cursor).toBe('pointer')
  })

  it('不可编辑模式不显示手柄且禁止拖拽', () => {
    draw = createDraw([{ value: 'first\nsecond' }])
    const particle = draw.getParagraphDragParticle()
    expect(particle.getHandleList(0)).toHaveLength(2)
    const nonEditableModes = [
      EditorMode.CLEAN,
      EditorMode.READONLY,
      EditorMode.FORM,
      EditorMode.GRAFFITI,
      EditorMode.TRACE,
      EditorMode.PRINT
    ]
    for (const mode of nonEditableModes) {
      draw.setMode(mode)
      draw.render({
        isCompute: false,
        isLazy: false,
        isSubmitHistory: false,
        isSetCursor: false
      })
      expect(particle.getHandleList(0)).toHaveLength(0)
      expect(particle.getHitParagraph(0, 0, 0)).toBeNull()
    }
  })

  it('只在段落首行的正文左边距外生成手柄', () => {
    draw = createDraw([
      {
        value: 'first\na very long paragraph used to verify wrapped rows\nthird'
      }
    ])
    const particle = draw.getParagraphDragParticle()
    const handles = particle.getHandleList(0)
    const { margins } = draw.getPageSize(0)

    expect(handles).toHaveLength(3)
    expect(handles.every(handle => handle.x + handle.width < margins[3])).toBe(
      true
    )
    expect(new Set(handles.map(handle => handle.startIndex)).size).toBe(3)
    const positionList = draw.getPosition().getOriginalMainPositionList()
    const rowList = draw.getMainRowList()
    handles.forEach(handle => {
      const paragraphRows = rowList.filter(
        item =>
          item.startIndex >= handle.startIndex &&
          item.startIndex < handle.endIndex
      )
      const row = paragraphRows[0]
      const lastRow = paragraphRows[paragraphRows.length - 1]
      const rowTop = positionList[handle.startIndex].coordinate.leftTop[1]
      const lastRowTop = positionList[lastRow.startIndex].coordinate.leftTop[1]
      const rowContentHeight = row.height - (row.spacingAfter || 0)
      expect(handle.y + handle.height / 2).toBeCloseTo(
        rowTop + rowContentHeight / 2
      )
      expect(handle.paragraphTop).toBe(rowTop)
      expect(handle.paragraphBottom).toBe(lastRowTop + lastRow.height)
    })
  })

  it('悬浮段落只显示对应手柄并切换拖拽光标', () => {
    draw = createDraw([{ value: 'first\nsecond' }])
    const particle = draw.getParagraphDragParticle()
    const handles = particle.getHandleList(0)
    const positionList = draw.getPosition().getOriginalMainPositionList()
    const { margins } = draw.getPageSize(0)
    const page = draw.getPageList()[0]

    expect(particle.getHoveredHandle(0)).toBeNull()
    dispatchMouse(
      draw,
      'mousemove',
      margins[3] + 10,
      positionList[handles[0].startIndex].coordinate.leftTop[1] + 2
    )
    expect(particle.getHoveredHandle(0)?.startIndex).toBe(handles[0].startIndex)

    dispatchMouse(
      draw,
      'mousemove',
      margins[3] + 10,
      positionList[handles[1].startIndex].coordinate.leftTop[1] + 2
    )
    expect(particle.getHoveredHandle(0)?.startIndex).toBe(handles[1].startIndex)

    const handle = handles[1]
    dispatchMouse(
      draw,
      'mousemove',
      handle.x + handle.width / 2,
      handle.y + handle.height / 2
    )
    expect(page.style.cursor).toBe('grab')

    dispatchMouse(
      draw,
      'mousedown',
      handle.x + handle.width / 2,
      handle.y + handle.height / 2
    )
    expect(page.style.cursor).toBe('grabbing')
  })

  it('普通混排段落允许拖拽，复杂结构段落不允许拖拽', () => {
    expect(
      isParagraphDraggable([
        { value: ZERO },
        { value: 'text', controlId: 'control' }
      ])
    ).toBe(true)
    expect(
      isParagraphDraggable([{ value: ZERO }, { value: 'text', areaId: 'area' }])
    ).toBe(false)
    expect(
      isParagraphDraggable([
        { value: ZERO },
        { type: ElementType.TABLE, value: '' }
      ])
    ).toBe(false)
    expect(isParagraphDraggable([{ value: ZERO }, { value: 'text' }])).toBe(
      true
    )
  })

  it('按完整段落块移动且保留段落分隔', () => {
    const elementList: IElement[] = [
      { value: ZERO },
      { value: 'A' },
      { value: ZERO },
      { value: 'B' },
      { value: ZERO },
      { value: 'C' }
    ]
    const first = getParagraphBlock(elementList, 0)!
    const last = getParagraphBlock(elementList, 4)!

    expect(first).toEqual({ startIndex: 0, endIndex: 2 })
    expect(last).toEqual({ startIndex: 4, endIndex: 6 })
    expect(moveParagraphBlock(elementList, last, 0)).toBe(0)
    expect(elementList.map(element => element.value)).toEqual([
      ZERO,
      'C',
      ZERO,
      'A',
      ZERO,
      'B'
    ])

    const newFirst = getParagraphBlock(elementList, 0)!
    expect(moveParagraphBlock(elementList, newFirst, elementList.length)).toBe(
      4
    )
    expect(elementList.map(element => element.value)).toEqual([
      ZERO,
      'A',
      ZERO,
      'B',
      ZERO,
      'C'
    ])
  })

  it('拖动手柄移动末段后列表顺序和编号重新计算', () => {
    draw = createDraw([
      {
        type: ElementType.LIST,
        listType: ListType.OL,
        value: '',
        valueList: [{ value: 'one\n' }, { value: 'two\n' }, { value: 'three' }]
      }
    ])
    const particle = draw.getParagraphDragParticle()
    const handles = particle.getHandleList(0)
    const source = handles[2]

    dispatchMouse(
      draw,
      'mousedown',
      source.x + source.width / 2,
      source.y + source.height / 2
    )

    expect(draw.getCanvasEvent().paragraphDrag).toEqual({
      startIndex: source.startIndex,
      endIndex: source.endIndex
    })
    expect(particle.getDropIndex(0, 0)).toBe(0)
    dispatchMouse(draw, 'mousemove', source.x, 0)
    dispatchMouse(draw, 'mouseup', source.x, 0)

    const listRows = draw
      .getMainRowList()
      .filter(
        row =>
          row.isList &&
          row.elementList[0]?.value === ZERO &&
          !row.elementList[0].listWrap
      )
    expect(
      listRows.map(row =>
        row.elementList
          .filter(element => element.value !== ZERO)
          .map(element => element.value)
          .join('')
      )
    ).toEqual(['three', 'one', 'two'])
    expect(listRows.map(row => row.listIndex)).toEqual([0, 1, 2])
  })
})
