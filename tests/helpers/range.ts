import type Editor from '@/editor'

export function setRange(editor: Editor, start: number, end: number = start): void {
  editor.command.executeSetRange(start, end)
}

export function clearMain(editor: Editor): void {
  editor.command.executeSelectAll()
  editor.command.executeBackspace()
}
