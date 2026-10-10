import Editor, { ElementType, type IElement } from '../../src/editor'

const target = document.querySelector('#editor')
if (!(target instanceof HTMLDivElement)) throw new Error('Missing canvas')
const container = target
const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMfcAAAAASUVORK5CYII='
const source: IElement[] = [{
  value: '', type: ElementType.TABLE, id: 'table-owned',
  colgroup: [{ width: 200 }],
  trList: [{ id: 'row-owned', height: 50, tdList: [{
    id: 'cell-owned', colspan: 1, rowspan: 1,
    value: [{ value: 'Bell 🔔 clue', externalId: 'run-owned' }]
  }] }]
}, { value: image, type: ElementType.IMAGE, id: 'image-owned', width: 80, height: 80 }]
const editor = new Editor(container, { main: source })
function check() {
  const value = editor.command.getValue()
  const table = value.data.main.find(element => element.type === ElementType.TABLE)
  const picture = value.data.main.find(element => element.type === ElementType.IMAGE)
  if (table?.id !== 'table-owned' || table.trList?.[0]?.id !== 'row-owned' || table.trList[0]?.tdList[0]?.id !== 'cell-owned' || picture?.id !== 'image-owned') throw new Error('Native canvas lost an object identity')
  return value
}
async function run() {
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
  const initial = check()
  editor.command.executeSetRange(0, 0)
  editor.command.executeInsertElementList([{ value: 'Inserted prose' }])
  check()
  editor.command.executeUndo()
  check()
  editor.command.executeRedo()
  const edited = check()
  editor.command.executeSetValue(initial.data)
  check()
  return { nativeCanvas: container.querySelectorAll('canvas').length > 0, initialData: initial.data, editedData: edited.data, checks: ['serialize', 'insert', 'undo', 'redo', 'reopen'] }
}
declare global { interface Window { identityAcceptance: { run: typeof run; destroy: () => void } } }
window.identityAcceptance = { run, destroy: () => editor.destroy() }
