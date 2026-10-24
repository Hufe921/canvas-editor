import { describe, expect, it } from 'vitest'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'
import { formatElementList } from '@/editor/utils/element'
import { ElementType } from '@/editor/dataset/enum/Element'
import { EditorZone, PaperDirection } from '@/editor/dataset/enum/Editor'
import type { IElement } from '@/editor/interface/Element'

function table(id: string, nested = true): IElement {
  return {
    id, type: ElementType.TABLE, value: '', colgroup: [{ width: nested ? 180 : 150 }],
    trList: [{ id: id + '-row', height: 30, tdList: [{
      id: id + '-cell', colspan: 1, rowspan: 1,
      value: nested ? [{ value: 'Outer' }, table(id + '-nested', false)] : [{ value: 'Nested text' }]
    }] }]
  }
}
function fixture(): Draw {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const options = mergeOption({ width: 600, height: 900, margins: [70, 80, 90, 100] })
  const data = {
    header: [{ value: 'Wrapped header text '.repeat(18) }, { value: '\n' }, table('header')],
    footer: [{ value: 'Footer text' }, { value: '\n' }, table('footer')],
    main: [{ value: 'Portrait' }, { value: '', type: ElementType.PAGE_BREAK, paperDirection: PaperDirection.HORIZONTAL }, { value: 'Landscape' }]
  }
  for (const elements of Object.values(data)) formatElementList(elements, { editorOptions: options, isForceCompensation: true })
  const draw = new Draw(container, options, data, new Listener(), new EventBus(), new Override())
  draw.render()
  return draw
}
function cellPositions(elements: IElement[]): unknown[] {
  return elements.flatMap(element => element.trList?.flatMap(row => row.tdList.flatMap(cell => [
    { positions: structuredClone(cell.positionList), width: cell.width, height: cell.height },
    ...cellPositions(cell.value)
  ])) ?? [])
}

describe('mixed-direction story table geometry', () => {
  for (const zone of [EditorZone.HEADER, EditorZone.FOOTER]) {
    it(`${zone} retains independent direction caches when there are no tables`, () => {
      const draw = fixture()
      try {
        const story = zone === EditorZone.HEADER ? draw.getHeader() : draw.getFooter()
        story.setElementList([{ value: 'Plain story' }])
        story.compute()
        const portrait = story.getPositionList(PaperDirection.VERTICAL)
        const landscape = story.getPositionList(PaperDirection.HORIZONTAL)
        expect(story.getPositionList(PaperDirection.VERTICAL)).toBe(portrait)
        expect(story.getPositionList(PaperDirection.HORIZONTAL)).toBe(landscape)
      } finally { draw.destroy() }
    })
    it(`${zone} restores root and nested cell geometry after alternating cached directions`, () => {
      const draw = fixture()
      try {
        const story = zone === EditorZone.HEADER ? draw.getHeader() : draw.getFooter()
        story.recovery()
        story.getPositionList(PaperDirection.VERTICAL)
        const portrait = cellPositions(story.getElementList())
        const content = draw.getValue()
        const selection = structuredClone(draw.getRange().getRange())
        story.getPositionList(PaperDirection.HORIZONTAL)
        const landscape = cellPositions(story.getElementList())
        expect(landscape).not.toEqual(portrait)
        for (let iteration = 0; iteration < 3; iteration++) {
          story.getPositionList(PaperDirection.VERTICAL)
          expect(cellPositions(story.getElementList())).toEqual(portrait)
          story.getPositionList(PaperDirection.HORIZONTAL)
          expect(cellPositions(story.getElementList())).toEqual(landscape)
        }
        expect(draw.getValue()).toEqual(content)
        expect(draw.getRange().getRange()).toEqual(selection)
      } finally { draw.destroy() }
    })
    it(`${zone} active nested cell positions agree with the current page after another direction is queried`, () => {
      const draw = fixture()
      try {
        const story = zone === EditorZone.HEADER ? draw.getHeader() : draw.getFooter()
        const rootIndex = story.getElementList().findIndex(element => element.id === zone)
        const root = story.getElementList()[rootIndex]
        const cell = root?.trList?.[0]?.tdList[0]
        const nestedIndex = cell?.value.findIndex(element => element.type === ElementType.TABLE)
        if (!cell || nestedIndex === undefined || nestedIndex < 0) throw new Error('Missing nested story fixture')
        const nested = cell.value[nestedIndex]
        const nestedCell = nested.trList?.[0]?.tdList[0]
        if (!nestedCell) throw new Error('Missing nested cell')
        draw.getZone().setZone(zone)
        draw.setPageNo(0)
        story.recovery()
        story.getPositionList(PaperDirection.VERTICAL)
        const expected = structuredClone(nestedCell.positionList)
        draw.getPosition().setPositionContext({ isTable: true, isControl: false, tablePath: [
          { index: rootIndex, trIndex: 0, tdIndex: 0 },
          { index: nestedIndex, trIndex: 0, tdIndex: 0 }
        ] })
        story.getPositionList(PaperDirection.HORIZONTAL)
        expect(draw.getPosition().getPositionList()).toEqual(expected)
      } finally { draw.destroy() }
    })
  }
})
