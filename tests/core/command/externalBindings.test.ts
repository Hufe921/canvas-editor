import { describe, it, expect } from 'vitest'
import { createTestEditor } from '../../factories/editor'
import { EditorZone } from '@/editor/dataset/enum/Editor'

describe('external runtime binding commands', () => {
  it('replacement content and bindings commit together and invalid bindings leave text and selection unchanged', () => {
    const context = createTestEditor({
      data: { main: [{ value: 'retained' }], header: [], footer: [] }
    })
    try {
      const command = context.editor.command
      const before = command.getValue()
      const range = command.getRange()
      const binding = {
        container: { zone: EditorZone.MAIN },
        startIndex: 1,
        count: 3,
        expectedText: 'wrong',
        externalId: 'application-run',
        extension: { paragraph: 'application-paragraph' }
      }
      expect(() =>
        command.executeSetValue(
          { main: [{ value: 'abc' }] },
          { externalBindings: [binding] }
        )
      ).toThrow(/source text/)
      expect(command.getValue()).toEqual(before)
      expect(command.getRange()).toEqual(range)
      command.executeSetValue(
        { main: [{ value: 'abc' }] },
        { externalBindings: [{ ...binding, expectedText: 'abc' }] }
      )
      const elements = command.getRuntimeElementList()
      expect(
        elements
          .slice(1)
          .map(element => element.value)
          .join('')
      ).toBe('abc')
      expect(
        elements
          .slice(1)
          .every(element => element.externalId === 'application-run')
      ).toBe(true)
    } finally {
      context.destroy()
    }
  })
  it('returns expanded cloned elements and changes metadata without changing text or range', () => {
    const context = createTestEditor({
      data: { main: [{ value: '🔔 é' }], header: [], footer: [] }
    })
    try {
      const command = context.editor.command
      const elements = command.getRuntimeElementList()
      const before = command.getValue().data.main
      const range = command.getRange()
      const start = elements.findIndex(element => element.value === '🔔')
      const extension = { label: 'Independent metadata' }
      command.setExternalElementBindings([
        {
          container: { zone: EditorZone.MAIN },
          startIndex: start,
          count: 1,
          expectedText: '🔔',
          externalId: 'external',
          extension
        }
      ])
      extension.label = 'Caller mutation'
      const cloned = command.getRuntimeElementList()
      expect(cloned[start].extension).toEqual({ label: 'Independent metadata' })
      cloned[start].value = 'Changed clone'
      expect(command.getRuntimeElementList()[start].value).toBe('🔔')
      expect(command.getRange()).toEqual(range)
      expect(
        command
          .getValue()
          .data.main?.map(element => element.value)
          .join('')
      ).toEqual(before?.map(element => element.value).join(''))
    } finally {
      context.destroy()
    }
  })
})
