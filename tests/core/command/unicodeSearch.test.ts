import { describe, it, expect } from 'vitest'
import { createTestEditor } from '../../factories/editor'
import { ElementType } from '@/editor/dataset/enum/Element'

function withoutSegmenter(check: () => void): void {
  const descriptor = Object.getOwnPropertyDescriptor(Intl, 'Segmenter')
  Object.defineProperty(Intl, 'Segmenter', {
    configurable: true,
    value: undefined
  })
  try {
    check()
  } finally {
    if (descriptor) Object.defineProperty(Intl, 'Segmenter', descriptor)
  }
}

describe('exact Unicode search and replacement', () => {
  it('ASCII search and direct/tracked replacement work without Segmenter', () => {
    withoutSegmenter(() => {
      for (const disabled of [true, false]) {
        const context = createTestEditor({
          data: {
            main: [{ value: 'target and target beside 🔔' }],
            header: [],
            footer: []
          },
          options: { trace: { disabled } }
        })
        try {
          const command = context.editor.command
          expect(command.getKeywordRangeList('target')).toHaveLength(2)
          command.executeSearch('target')
          command.executeReplace('clue 🔔')
          expect(command.getKeywordRangeList('target')).toHaveLength(0)
          const text = command.getValue().data.main
            ?.map(element => element.value)
            .join('')
          expect(text).toContain('beside 🔔')
          expect(command.getRuntimeElementList().some(
            element => element.value === '🔔'
          )).toBe(true)
        } finally {
          context.destroy()
        }
      }
    })
  })
  it('fallback boundaries reject partial Unicode but allow a whole container', () => {
    withoutSegmenter(() => {
      for (const value of ['é', '👩‍🚀', '🇺🇸', 'क्‍ष', '가']) {
        const context = createTestEditor({
          data: { main: [{ value }], header: [], footer: [] }
        })
        try {
          const command = context.editor.command
          const before = command.getValue()
          expect(command.getKeywordRangeList(value)).toHaveLength(1)
          expect(command.getKeywordRangeList(value.slice(0, 1)))
            .toHaveLength(0)
          expect(command.getValue()).toEqual(before)
        } finally {
          context.destroy()
        }
      }
    })
  })
  it('fallback cannot split combining text across formatting boundaries', () => {
    withoutSegmenter(() => {
      const context = createTestEditor({
        data: {
          main: [{ value: 'e' }, { value: '́', bold: true }],
          header: [],
          footer: []
        }
      })
      try {
        const command = context.editor.command
        expect(command.getKeywordRangeList('e')).toHaveLength(0)
        expect(command.getKeywordRangeList('́')).toHaveLength(0)
        const range = command.getKeywordRangeList('é')[0]
        expect(range).toBeDefined()
        if (!range) throw new Error('Missing whole-container match')
        command.executeReplaceRange(range)
        expect(command.getRangeText()).toBe('é')
      } finally {
        context.destroy()
      }
    })
  })
  it('formatting boundaries cannot authorize partial combined graphemes', () => {
    const context = createTestEditor({
      data: {
        main: [{ value: 'e' }, { value: '́', bold: true }],
        header: [],
        footer: []
      }
    })
    try {
      expect(context.editor.command.getKeywordRangeList('e')).toHaveLength(0)
      expect(context.editor.command.getKeywordRangeList('́')).toHaveLength(0)
      const range = context.editor.command.getKeywordRangeList('é')[0]
      expect(range).toBeDefined()
      if (!range) throw new Error('Missing complete grapheme range')
      context.editor.command.executeReplaceRange(range)
      expect(context.editor.command.getRangeText()).toBe('é')
    } finally {
      context.destroy()
    }
  })
  it('keyword ranges use complete graphemes and the cursor-before-selection convention', () => {
    const context = createTestEditor({
      data: {
        main: [{ value: 'Quote 🔔 é Quote 🔔 é ΟΣ İ' }],
        header: [],
        footer: []
      }
    })
    try {
      const command = context.editor.command
      const matches = command.getKeywordRangeList('🔔 é')
      expect(matches).toHaveLength(2)
      for (const range of matches) {
        command.executeSetPositionContext(range)
        command.executeReplaceRange(range)
        expect(command.getRangeText()).toBe('🔔 é')
      }
      expect(command.getKeywordRangeList('e')).toHaveLength(2) // Only the ordinary e in each "Quote".
      expect(command.getKeywordRangeList('\ud83d')).toHaveLength(0)
      expect(command.getKeywordRangeList('ος')).toHaveLength(1)
      expect(command.getKeywordRangeList('i')).toHaveLength(0) // No partial match of İ's folded i + dot.
    } finally {
      context.destroy()
    }
  })
  it('text after the final table remains searchable and neighboring cells keep their ownership', () => {
    const context = createTestEditor({
      data: {
        main: [
          { value: 'before' },
          {
            type: ElementType.TABLE,
            value: '',
            colgroup: [{ width: 200 }, { width: 200 }],
            trList: [
              {
                height: 40,
                tdList: [
                  { colspan: 1, rowspan: 1, value: [{ value: '🔔 é' }] },
                  {
                    colspan: 1,
                    rowspan: 1,
                    value: [{ value: 'same neighbor' }]
                  }
                ]
              }
            ]
          },
          { value: 'after' }
        ],
        header: [],
        footer: []
      }
    })
    try {
      const command = context.editor.command
      expect(command.getKeywordRangeList('after')).toHaveLength(1)
      const match = command.getKeywordRangeList('🔔 é')[0]
      expect(match).toBeDefined()
      if (!match) throw new Error('Missing exact cell range')
      command.executeSetPositionContext(match)
      command.executeReplaceRange(match)
      expect(command.getRangeText()).toBe('🔔 é')
      expect(
        command
          .getValue()
          .data.main?.find(element => element.type === ElementType.TABLE)
          ?.trList?.[0].tdList[1].value.map(element => element.value)
          .join('')
      ).toContain('same neighbor')
    } finally {
      context.destroy()
    }
  })
  it('both direct and tracked replacement insert complete Unicode graphemes', () => {
    for (const disabled of [true, false]) {
      const context = createTestEditor({
        data: {
          main: [{ value: 'before target after' }],
          header: [],
          footer: []
        },
        options: { trace: { disabled } }
      })
      try {
        const command = context.editor.command
        command.executeSearch('target')
        command.executeReplace('🔔 é')
        const elements = command.getRuntimeElementList()
        expect(elements.some(element => element.value === '🔔')).toBe(true)
        expect(elements.some(element => element.value === 'é')).toBe(true)
        expect(elements.some(element => element.value === '\ud83d')).toBe(false)
        expect(
          command
            .getValue()
            .data.main?.map(element => element.value)
            .join('')
        ).toContain('after')
      } finally {
        context.destroy()
      }
    }
  })
})
