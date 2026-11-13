import { afterEach, describe, expect, it } from 'vitest'
import { createTestEditor } from '../../factories/editor'

const formats = [
  ['bold', 'executeBold'],
  ['italic', 'executeItalic'],
  ['underline', 'executeUnderline'],
  ['strikeout', 'executeStrikeout']
] as const

describe('caret insertion formatting', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  for (const [property, command] of formats) {
    for (const initial of [false, true]) {
      for (const toggles of [0, 1, 2, 3]) {
        it(property + ' initially ' + initial + ', toggled ' + toggles + ' times', () => {
          ctx = createTestEditor({ data: [{ value: 'ABC', [property]: initial }] })
          ctx.editor.command.executeSetRange(1, 1)
          ctx.editor.command.executeFocus({ range: { startIndex: 1, endIndex: 1 } })
          for (let i = 0; i < toggles; i++) ctx.editor.command[command]()
          ctx.container.querySelector('textarea')!.dispatchEvent(
            new InputEvent('input', { data: 'Z', inputType: 'insertText', bubbles: true })
          )
          const glyphs = ctx.editor.command.getValue().data.main.flatMap(element =>
            Array.from(element.value, character => ({
              character,
              formatted: Boolean(element[property])
            }))
          ).filter(glyph => glyph.character !== '\n')
          expect(glyphs.map(glyph => glyph.character).join('')).toBe('AZBC')
          const expected = toggles % 2 === 0 ? initial : !initial
          expect(glyphs.find(glyph => glyph.character === 'Z')?.formatted).toBe(expected)
          expect(glyphs.filter(glyph => glyph.character !== 'Z').every(glyph => glyph.formatted === initial)).toBe(true)
        })
      }
    }
  }
})
