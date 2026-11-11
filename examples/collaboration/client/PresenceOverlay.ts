import type Editor from '@canvas-editor'
import type { IRange } from '@canvas-editor'
import type * as Y from 'yjs'
import type * as awarenessProtocol from 'y-protocols/awareness'
import {
  deserializeRelativeSelection,
  resolveRelativeSelection,
  type RelativeSelectionJSON
} from './document'

type PresenceUser = {
  name: string
  color: string
}

type PresenceState = {
  user?: PresenceUser
  cursor?: RelativeSelectionJSON | null
}

export class PresenceOverlay {
  private readonly editor: Editor
  private readonly awareness: awarenessProtocol.Awareness
  private readonly doc: Y.Doc
  private readonly layer: HTMLDivElement
  private frame = 0

  constructor(
    editor: Editor,
    doc: Y.Doc,
    awareness: awarenessProtocol.Awareness
  ) {
    this.editor = editor
    this.doc = doc
    this.awareness = awareness
    this.layer = document.createElement('div')
    this.layer.className = 'collab-presence-layer'
    this.editor.command.getContainer().append(this.layer)
    this.awareness.on('change', this.scheduleRender)
    this.editor.eventBus.on('renderChange', this.scheduleRender)
    window.addEventListener('resize', this.scheduleRender)
    this.scheduleRender()
  }

  private scheduleRender = () => {
    if (this.frame) return
    this.frame = requestAnimationFrame(() => {
      this.frame = 0
      this.render()
    })
  }

  private render() {
    this.layer.replaceChildren()
    for (const [clientId, state] of this.awareness.getStates()) {
      if (clientId === this.doc.clientID || !state.cursor || !state.user) continue
      const presence = state as PresenceState
      const selection = deserializeRelativeSelection(presence.cursor!)
      // 正文坐标查询不支持表格内部路径，避免把单元格光标画到正文
      if (selection.scope || presence.cursor!.range?.tableId) continue
      const relativeRange = resolveRelativeSelection(this.doc, selection)
      const fallbackRange = presence.cursor!.range
      const range = relativeRange || fallbackRange
      if (!range || !presence.user) continue
      const elementCount = this.doc.getArray('elements').length
      if (!elementCount) continue
      this.renderPresence(
        {
          startIndex: Math.min(Math.max(range.startIndex, -1), elementCount - 1),
          endIndex: Math.min(Math.max(range.endIndex, -1), elementCount - 1)
        },
        presence.user
      )
    }
  }

  private renderPresence(range: IRange, user: PresenceUser) {
    const color = /^#[\da-f]{6}$/i.test(user.color) ? user.color : '#5b5bd6'
    if (range.startIndex !== range.endIndex) {
      for (const rect of this.editor.command.getRangeRects(range)) {
        const selection = document.createElement('div')
        selection.className = 'collab-remote-selection'
        selection.style.left = `${rect.x}px`
        selection.style.top = `${rect.y}px`
        selection.style.width = `${rect.width}px`
        selection.style.height = `${rect.height}px`
        selection.style.backgroundColor = `${color}26`
        this.layer.append(selection)
      }
    }
    const caretRange: IRange = {
      startIndex: range.endIndex,
      endIndex: range.endIndex
    }
    const [caretRect] = this.editor.command.getRangeRects(caretRange)
    if (!caretRect) return
    const caret = document.createElement('div')
    caret.className = 'collab-remote-caret'
    caret.style.left = `${caretRect.x}px`
    caret.style.top = `${caretRect.y}px`
    caret.style.height = `${caretRect.height}px`
    caret.style.backgroundColor = color
    const label = document.createElement('span')
    label.className = 'collab-remote-caret__label'
    label.style.backgroundColor = color
    label.textContent = user.name
    caret.append(label)
    this.layer.append(caret)
  }

  public destroy() {
    if (this.frame) cancelAnimationFrame(this.frame)
    this.awareness.off('change', this.scheduleRender)
    this.editor.eventBus.off('renderChange', this.scheduleRender)
    window.removeEventListener('resize', this.scheduleRender)
    this.layer.remove()
  }
}
