import { describe, expect, it } from 'vitest'
import { TextEngineMode } from '../../../src/editor/dataset/enum/TextDirection'
import { WordBreak } from '../../../src/editor/dataset/enum/Editor'
import type { ParagraphSpan } from '../../../src/editor/core/text-engine-host/ElementBridge'
import {
  LayoutHostAdapter,
  layoutLastKey,
  resolveLayoutScope
} from '../../../src/editor/core/text-engine-host/LayoutHostAdapter'
import type { IElement } from '../../../src/editor/interface/Element'
import type { IEditorOption } from '../../../src/editor/interface/Editor'
import type { DeepRequired } from '../../../src/editor/interface/Common'

function mockOptions(): DeepRequired<IEditorOption> {
  return {
    textEngine: TextEngineMode.HARFBUZZ,
    defaultFont: 'sans-serif',
    defaultSize: 16,
    defaultColor: '#000',
    defaultRowMargin: 1,
    defaultDirection: 'ltr',
    scale: 1,
    wordBreak: WordBreak.BREAK_WORD,
    fonts: []
  } as unknown as DeepRequired<IEditorOption>
}

function sampleParagraph(): {
  paragraph: ParagraphSpan
  elementList: IElement[]
} {
  const elementList: IElement[] = [
    { value: '\u200B' },
    { value: 'a' },
    { value: 'b' }
  ]
  const paragraph: ParagraphSpan = {
    startIndex: 1,
    endIndex: 2,
    direction: 'ltr',
    text: 'ab',
    spans: [
      {
        logicalIndex: 1,
        text: 'a',
        style: { fontFamily: 'sans-serif', fontSize: 16 }
      },
      {
        logicalIndex: 2,
        text: 'b',
        style: { fontFamily: 'sans-serif', fontSize: 16 }
      }
    ]
  }
  return { paragraph, elementList }
}

describe('layoutScope isolation', () => {
  it('layoutLastKey and resolveLayoutScope format scopes', () => {
    expect(layoutLastKey('main', 1, 5)).toBe('main|p:1-5')
    expect(layoutLastKey('header', 0, 3)).toBe('header|p:0-3')
    expect(layoutLastKey('td:cell-1', 2, 4)).toBe('td:cell-1|p:2-4')
    expect(resolveLayoutScope({ zone: 'header' })).toBe('header')
    expect(resolveLayoutScope({ zone: 'footer' })).toBe('footer')
    expect(resolveLayoutScope({ zone: 'main' })).toBe('main')
    expect(
      resolveLayoutScope({ zone: 'header', isTable: true, tdId: 'x' })
    ).toBe('td:x')
  })

  it('same p:range in main vs td do not overwrite each other', async () => {
    const adapter = new LayoutHostAdapter(() => mockOptions())
    await adapter.ensureReady()
    expect(adapter.isReady()).toBe(true)

    const { paragraph, elementList } = sampleParagraph()
    const mainRows = adapter.layoutParagraphToRows(
      paragraph,
      elementList,
      500,
      0,
      'main'
    )
    const tdRows = adapter.layoutParagraphToRows(
      {
        ...paragraph,
        spans: paragraph.spans.map(s => ({
          ...s,
          style: { ...s.style, fontSize: 20 }
        }))
      },
      elementList,
      500,
      0,
      'td:cell-a'
    )
    expect(mainRows?.length).toBeGreaterThan(0)
    expect(tdRows?.length).toBeGreaterThan(0)

    const mainFound = adapter.findLayoutByElementIndex(1, 'main')
    const tdFound = adapter.findLayoutByElementIndex(1, 'td:cell-a')
    expect(mainFound).toBeDefined()
    expect(tdFound).toBeDefined()
    expect(mainFound!.layout).not.toBe(tdFound!.layout)

    expect(adapter.getLayout(layoutLastKey('main', 1, 2))).toBe(
      mainFound!.layout
    )
    expect(adapter.getLayout(layoutLastKey('td:cell-a', 1, 2))).toBe(
      tdFound!.layout
    )
    // Cross-scope lookup must miss
    expect(adapter.findLayoutByElementIndex(1, 'header')).toBeUndefined()
    expect(adapter.findLayoutByElementIndex(1, 'td:other')).toBeUndefined()
  })

  it('header and main scopes stay isolated for visualNeighbor lookup', async () => {
    const adapter = new LayoutHostAdapter(() => mockOptions())
    await adapter.ensureReady()
    const { paragraph, elementList } = sampleParagraph()
    adapter.layoutParagraphToRows(paragraph, elementList, 500, 0, 'header')
    adapter.layoutParagraphToRows(
      {
        ...paragraph,
        spans: [
          {
            logicalIndex: 1,
            text: 'x',
            style: { fontFamily: 'sans-serif', fontSize: 16 }
          },
          {
            logicalIndex: 2,
            text: 'y',
            style: { fontFamily: 'sans-serif', fontSize: 16 }
          }
        ],
        text: 'xy'
      },
      elementList,
      500,
      0,
      'main'
    )
    const headerLayout = adapter.findLayoutByElementIndex(2, 'header')
    const mainLayout = adapter.findLayoutByElementIndex(2, 'main')
    expect(headerLayout).toBeDefined()
    expect(mainLayout).toBeDefined()
    expect(headerLayout!.layout).not.toBe(mainLayout!.layout)
  })
})
