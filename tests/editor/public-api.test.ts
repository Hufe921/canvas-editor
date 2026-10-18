import Editor, { type IEditorOption, type IUpdateOption } from '@/editor'
import { afterEach, describe, expect, it, vi } from 'vitest'

let editor: Editor | undefined
afterEach(() => {
  editor?.destroy()
  editor = undefined
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('public options migration', () => {
  it.each(['textEngine', 'renderMode'])(
    'rejects persisted %s before mounting or fetching',
    name => {
      const fetch = vi.spyOn(globalThis, 'fetch')
      const container = document.createElement('div')
      const persisted = { [name]: undefined } as IEditorOption
      expect(() => new Editor(container, [], persisted)).toThrow(
        `${name} has been removed`
      )
      expect(container.childElementCount).toBe(0)
      expect(fetch).not.toHaveBeenCalled()
    }
  )
  it.each(['textEngine', 'renderMode'])(
    'rejects runtime %s without changing valid options or lifecycle',
    async name => {
      const container = document.createElement('div')
      document.body.append(container)
      editor = await Editor.create(container, [], {
        autoDownloadFonts: false
      })
      const previous = editor.command.getOptions()
      const fontRevision = editor.register.getFontRevision()
      const persisted = {
        [name]: 'legacy',
        autoDownloadFonts: true
      } as IUpdateOption
      expect(() => editor!.command.executeUpdateOptions(persisted)).toThrow(
        `${name} has been removed`
      )
      expect(editor.command.getOptions()).toBe(previous)
      expect(editor.command.getOptions().autoDownloadFonts).toBe(false)
      expect(editor.register.getFontRevision()).toBe(fontRevision)
      expect(editor.state).toBe('ready')
    }
  )
})
