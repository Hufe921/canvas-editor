import { afterEach, expect, it } from 'vitest'
import { createTestEditor } from '../../factories/editor'

let context: ReturnType<typeof createTestEditor> | undefined
afterEach(() => context?.destroy())

it('inherits authored paragraph metrics during typing and retains them through undo, redo and setValue', () => {
  context = createTestEditor({
    data: [
      { value: '\n', lineHeight: { rule: 'exact', value: 24 } },
      { value: 'ABC', lineHeight: { rule: 'exact', value: 24 } }
    ],
    options: { preserveLeadingParagraph: true }
  })
  const editor = context.editor
  editor.command.executeSetRange(1, 1)
  editor.command.executeFocus({ range: { startIndex: 1, endIndex: 1 } })
  const input = context.container.querySelector('textarea')
  if (!input) throw new Error('Expected native input')
  input.dispatchEvent(
    new InputEvent('input', {
      data: 'Z',
      inputType: 'insertText',
      bubbles: true
    })
  )
  const text = () =>
    editor.command
      .getValue()
      .data.main.map(element => element.value)
      .join('')
  expect(text()).toBe('\nAZBC')
  editor.command.executeUndo()
  expect(text()).toBe('\nABC')
  editor.command.executeRedo()
  expect(text()).toBe('\nAZBC')
  const saved = editor.command.getValue()
  expect(
    saved.data.main.every(
      element =>
        element.lineHeight?.rule === 'exact' && element.lineHeight.value === 24
    )
  ).toBe(true)
  editor.command.executeSetValue(saved.data)
  expect(text()).toBe('\nAZBC')
  expect(
    editor.command
      .getValue()
      .data.main.every(
        element =>
          element.lineHeight?.rule === 'exact' &&
          element.lineHeight.value === 24
      )
  ).toBe(true)
})
