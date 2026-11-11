import * as Y from 'yjs'
import type Editor from '@canvas-editor'
import type { IRange } from '@canvas-editor'
import type { WebSocketProvider } from './WebSocketProvider'
import {
  createRelativeSelection,
  getSharedElements,
  readSharedElements,
  resolveRelativeSelection,
  serializeRelativeSelection,
  writeLocalElements,
  type RelativeSelection
} from './document'

export class CanvasEditorCollaboration {
  public readonly undoManager: Y.UndoManager

  private readonly editor: Editor
  private readonly provider: WebSocketProvider
  private readonly localOrigin = {}
  private readonly originalContentChange: (() => void) | null
  private localSelection: RelativeSelection | null = null
  private tableContext: Pick<
    IRange,
    | 'tableId'
    | 'startTrIndex'
    | 'startTdIndex'
    | 'endTrIndex'
    | 'endTdIndex'
  > | null = null
  private lastCursorJSON = ''
  private applyingRemote = false
  private lastRenderedSnapshot = ''
  private applyScheduled = false
  private awarenessScheduled = false
  private destroyed = false
  private ready = false

  public onRemoteUpdate: (() => void) | null = null
  public onLocalUpdate: (() => void) | null = null
  public onReady: (() => void) | null = null
  public onUndoStackChange: (() => void) | null = null

  constructor(editor: Editor, provider: WebSocketProvider) {
    this.editor = editor
    this.provider = provider
    this.originalContentChange = editor.listener.contentChange
    this.editor.listener.contentChange = this.handleContentChange
    this.editor.eventBus.on('input', this.handleInput)
    this.editor.eventBus.on('rangeChange', this.handleRangeChange)
    this.editor.eventBus.on(
      'positionContextChange',
      this.handlePositionContextChange
    )
    const shared = getSharedElements(provider.doc)
    shared.observeDeep(this.handleSharedUpdate)
    this.undoManager = new Y.UndoManager(shared, {
      trackedOrigins: new Set([this.localOrigin]),
      captureTimeout: 500
    })
    this.undoManager.on('stack-item-added', this.handleUndoStackChange)
    this.undoManager.on('stack-item-popped', this.handleUndoStackChange)
    this.provider.on('sync', this.handleSync)
  }

  private handleSync = () => {
    this.ready = true
    this.applyRemoteDocument()
    this.onReady?.()
  }

  private handleSharedUpdate = (
    _events: Y.YEvent<Y.Map<unknown>>[],
    transaction: Y.Transaction
  ) => {
    if (transaction.origin === this.localOrigin) {
      this.updateLocalAwareness()
      this.onLocalUpdate?.()
      return
    }
    if (this.applyScheduled) return
    this.applyScheduled = true
    queueMicrotask(() => {
      this.applyScheduled = false
      this.applyRemoteDocument()
    })
  }

  private handleInput = (event: Event) => {
    // 输入法合成期间的临时文本不上屏，提交时立即同步最终文字
    if ((event as InputEvent).isComposing) return
    this.syncLocalDocument()
  }

  private handleContentChange = () => {
    this.originalContentChange?.()
    this.syncLocalDocument()
  }

  private syncLocalDocument() {
    if (this.applyingRemote || !this.ready) return
    const elements = this.editor.command.getValue({
      extraPickAttrs: ['id']
    }).data.main
    const snapshot = JSON.stringify(elements)
    if (snapshot === this.lastRenderedSnapshot) return
    writeLocalElements(this.provider.doc, elements, this.localOrigin)
    this.lastRenderedSnapshot = snapshot
    this.undoManager.stopCapturing()
    this.updateLocalAwareness()
    this.onLocalUpdate?.()
  }

  private handleRangeChange = () => {
    this.updateLocalAwareness()
  }

  private handlePositionContextChange = ({
    value
  }: {
    value: {
      isTable: boolean
      tableId?: string
      trIndex?: number
      tdIndex?: number
    }
  }) => {
    if (
      value.isTable &&
      value.tableId &&
      value.trIndex !== undefined &&
      value.tdIndex !== undefined
    ) {
      this.tableContext = {
        tableId: value.tableId,
        startTrIndex: value.trIndex,
        startTdIndex: value.tdIndex,
        endTrIndex: value.trIndex,
        endTdIndex: value.tdIndex
      }
    } else {
      this.tableContext = null
    }
    this.updateLocalAwareness()
  }

  private updateLocalAwareness() {
    if (this.awarenessScheduled || this.destroyed) return
    this.awarenessScheduled = true
    queueMicrotask(() => {
      this.awarenessScheduled = false
      if (this.destroyed) return
      const currentRange = this.editor.command.getRange()
      const range =
        !currentRange.tableId && this.tableContext
          ? { ...currentRange, ...this.tableContext }
          : currentRange
      this.localSelection = createRelativeSelection(this.provider.doc, range)
      const cursor = serializeRelativeSelection(this.localSelection, range)
      const cursorJSON = JSON.stringify(cursor)
      if (cursorJSON === this.lastCursorJSON) return
      this.lastCursorJSON = cursorJSON
      this.provider.awareness.setLocalStateField('cursor', cursor)
    })
  }

  private applyRemoteDocument() {
    const elements = readSharedElements(this.provider.doc)
    const range = this.localSelection
      ? resolveRelativeSelection(this.provider.doc, this.localSelection)
      : null
    this.applyingRemote = true
    try {
      this.editor.command.executeSetValue({ main: elements })
      this.lastRenderedSnapshot = JSON.stringify(
        this.editor.command.getValue({ extraPickAttrs: ['id'] }).data.main
      )
      if (range) this.restoreRange(range, elements.length)
    } finally {
      this.applyingRemote = false
    }
    this.updateLocalAwareness()
    this.onRemoteUpdate?.()
  }

  private restoreRange(range: IRange, elementCount: number) {
    if (range.startIndex < 0 || (!range.tableId && !elementCount)) return
    const startIndex = range.tableId
      ? range.startIndex
      : Math.min(range.startIndex, elementCount - 1)
    const endIndex = range.tableId
      ? range.endIndex
      : Math.min(range.endIndex, elementCount - 1)
    const restoredRange = {
      ...range,
      startIndex,
      endIndex: Math.max(startIndex, endIndex)
    }
    this.editor.command.executeSetPositionContext(restoredRange)
    this.editor.command.executeReplaceRange(restoredRange)
  }

  private handleUndoStackChange = () => {
    this.onUndoStackChange?.()
  }

  public undo() {
    this.undoManager.undo()
    this.editor.command.executeFocus()
  }

  public redo() {
    this.undoManager.redo()
    this.editor.command.executeFocus()
  }

  public canUndo() {
    return this.undoManager.canUndo()
  }

  public canRedo() {
    return this.undoManager.canRedo()
  }

  public destroy() {
    this.destroyed = true
    this.provider.awareness.setLocalStateField('cursor', null)
    getSharedElements(this.provider.doc).unobserveDeep(this.handleSharedUpdate)
    this.editor.eventBus.off('input', this.handleInput)
    this.editor.eventBus.off('rangeChange', this.handleRangeChange)
    this.editor.eventBus.off(
      'positionContextChange',
      this.handlePositionContextChange
    )
    this.editor.listener.contentChange = this.originalContentChange
    this.undoManager.destroy()
  }
}
