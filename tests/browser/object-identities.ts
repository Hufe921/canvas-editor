import Editor, { ElementType, type IElement } from '../../src/editor'

const target = document.querySelector('#editor')
if (!(target instanceof HTMLDivElement)) throw new Error('Missing editor')
const container = target
const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMfcAAAAASUVORK5CYII='
function picture(id: string): IElement {
  return { value: image, type: ElementType.IMAGE, id, width: 40, height: 40 }
}
function table(id: string): IElement {
  return {
    value: '', type: ElementType.TABLE, id,
    externalId: `${id}-binding`,
    colgroup: [{ width: 160 }, { width: 160 }],
    trList: [{ id: `${id}-row`, height: 60, tdList: [
      {
        id: `${id}-left`, colspan: 1, rowspan: 1,
        externalId: `${id}-cell-binding`,
        value: [{ value: 'Bell 🔔 é clue', bold: true }, picture(`${id}-image`)]
      },
      {
        id: `${id}-right`, colspan: 1, rowspan: 1,
        value: [{ value: 'Repeated “quotation” “quotation”', italic: true }]
      }
    ] }]
  }
}
const source = {
  main: [
    { value: 'Before\n' }, table('table-owned'),
    { value: '\nAfter\n' }, picture('image-owned'), { value: '\nEnd' }
  ],
  header: [picture('header-image')],
  footer: [table('footer-table')]
}
let editor = new Editor(container, source, { defaultFont: 'Arial' })
const checks: string[] = []
function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
function identities(elements: IElement[]): string[] {
  const result: string[] = []
  for (const element of elements) {
    if (element.id) result.push(element.id)
    for (const row of element.trList || []) {
      if (row.id) result.push(row.id)
      for (const cell of row.tdList) {
        if (cell.id) result.push(cell.id)
        result.push(...identities(cell.value))
      }
    }
  }
  return result
}
function snapshot() {
  return editor.command.getValue({ extraPickAttrs: ['id'] })
}
function bodyIds() { return identities(snapshot().data.main) }
function assertUnique() {
  const value = snapshot().data
  const ids = [
    ...identities(value.main),
    ...identities(value.header || []),
    ...identities(value.footer || [])
  ]
  assert(ids.length === new Set(ids).size, 'Duplicate object identities')
  const defaults = editor.command.getValue().data
  assert([
    ...identities(defaults.main),
    ...identities(defaults.header || []),
    ...identities(defaults.footer || [])
  ].length === 0, 'Default serialization retained object identities')
  return ids
}
async function frame() {
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
}
async function until(predicate: () => boolean, label: string) {
  const deadline = performance.now() + 5000
  while (!predicate()) {
    if (performance.now() > deadline) throw new Error(`Timed out: ${label}`)
    await frame()
  }
  await frame()
}
function end() {
  editor.command.executeSetPositionContext({ startIndex: 0, endIndex: 0 })
  editor.command.executeSelectAll()
  const { endIndex } = editor.command.getRange()
  editor.command.executeSetRange(endIndex, endIndex)
}
async function paste(expectedCount: number) {
  editor.command.executePaste()
  await until(() => bodyIds().length === expectedCount, 'clipboard insertion')
  assertUnique()
}
async function run() {
  checks.length = 0
  await frame()
  assert(container.querySelectorAll('canvas').length > 0, 'No native canvas')
  const initial = snapshot()
  const initialBodyIds = bodyIds()
  assert(initialBodyIds.length === 6, 'Incomplete starting objects')
  assertUnique()
  checks.push('default-strip-and-opt-in-main-header-footer')
  const asynchronous = await editor.command.getValueAsync({ extraPickAttrs: ['id'] })
  for (const zone of ['main', 'header', 'footer'] satisfies
    Array<'main' | 'header' | 'footer'>) {
    assert(JSON.stringify(asynchronous.data[zone]) ===
      JSON.stringify(initial.data[zone]), 'Worker serialization differs')
  }
  const asyncDefaults = await editor.command.getValueAsync()
  assert(identities(asyncDefaults.data.main).length === 0,
    'Default worker serialization retained ids')
  checks.push('worker-serialization')

  editor.command.executeSelectAll()
  await editor.command.executeCopy()
  const clipboardText = await navigator.clipboard.readText()
  assert(clipboardText.includes('Bell 🔔 é'), 'Native clipboard lost Unicode')
  end()
  await paste(12)
  const firstPasteIds = bodyIds().filter(id => !initialBodyIds.includes(id))
  checks.push('real-clipboard-whole-table-and-image')
  editor.command.executeUndo()
  assert(JSON.stringify(bodyIds()) === JSON.stringify(initialBodyIds),
    'Undo did not restore original identities')
  editor.command.executeRedo()
  assert(firstPasteIds.every(id => bodyIds().includes(id)),
    'Redo did not restore pasted identities')
  assertUnique()
  checks.push('paste-undo-redo')
  end()
  await paste(18)
  assert(firstPasteIds.every(id => bodyIds().includes(id)),
    'Repeated paste changed earlier objects')
  checks.push('real-clipboard-repeated-paste')
  assert(snapshot().data.main.filter(element =>
    element.externalId === 'table-owned-binding').length === 3,
  'Paste did not preserve internal clipboard metadata')

  // Select both table cells through public position and range commands.
  editor.command.executeSetPositionContext({
    startIndex: 0, endIndex: 0, tableId: 'table-owned',
    startTrIndex: 0, startTdIndex: 0
  })
  editor.command.executeSetRange(0, 0, 'table-owned', 0, 1, 0, 0)
  assert(editor.command.getRange().isCrossRowCol === true,
    'Cross-cell selection was not established')
  await editor.command.executeCopy()
  end()
  await paste(23)
  checks.push('real-clipboard-cross-cell-table-copy')
  const pastedTables = snapshot().data.main.filter(element =>
    element.type === ElementType.TABLE && element.id !== 'table-owned')
  const pastedTable = pastedTables[pastedTables.length - 1]
  assert(pastedTable?.id !== undefined, 'Missing pasted table')
  const preservedOriginal = snapshot().data.main.find(element =>
    element.id === 'table-owned')
  assert(preservedOriginal !== undefined, 'Missing original table')
  editor.command.executeSetPositionContext({
    startIndex: 0, endIndex: 0, tableId: pastedTable.id,
    startTrIndex: 0, startTdIndex: 0
  })
  editor.command.executeSetRange(0, 0)
  editor.command.executeInsertElementList([{ value: 'Edited pasted cell: ' }])
  const afterCellEdit = snapshot().data.main
  assert(JSON.stringify(afterCellEdit.find(element => element.id === 'table-owned'))
    === JSON.stringify(preservedOriginal), 'Pasted-cell edit changed original')
  const editedTable = afterCellEdit.find(element => element.id === pastedTable.id)
  assert(editedTable?.trList?.[0]?.tdList[0]?.value.some(element =>
    element.value.includes('Edited pasted cell: ')) === true,
  'Pasted-cell edit targeted the wrong cell')
  checks.push('pasted-cell-targeting')
  assertUnique()

  const saved = snapshot()
  const savedIds = assertUnique()
  editor.destroy()
  editor = new Editor(container, saved.data, saved.options)
  await frame()
  assert(JSON.stringify(assertUnique()) === JSON.stringify(savedIds),
    'Destroy/recreate changed saved object identities')
  checks.push('destroy-recreate-saved-data')
  assert(editor.command.getText().main.includes('“quotation” “quotation”'),
    'Repeated quotations lost during reopen')
  checks.push('unicode-and-repeated-quotations')
  return { checks: [...checks], objectCount: savedIds.length, clipboardText,
    nativeCanvasCount: container.querySelectorAll('canvas').length }
}

function reset() {
  editor.destroy()
  editor = new Editor(container, source, { defaultFont: 'Arial' })
  assertUnique()
}
function prepareKeyboardCopy() {
  reset()
  editor.command.executeSetRange(0, 0)
  editor.command.executeSelectAll()
}
function prepareCellCopy() {
  reset()
  editor.command.executeSetPositionContext({
    startIndex: 0, endIndex: 0, tableId: 'table-owned',
    startTrIndex: 0, startTdIndex: 0
  })
  editor.command.executeSetRange(0, 0, 'table-owned', 0, 1, 0, 0)
}
async function verifyPaste(expectedCount: number) {
  await until(() => bodyIds().length === expectedCount, 'native shortcut paste')
  return { objectCount: assertUnique().length, bodyIds: bodyIds() }
}
declare global {
  interface Window {
    identityAcceptance: {
      run: typeof run
      prepareKeyboardCopy: typeof prepareKeyboardCopy
      prepareCellCopy: typeof prepareCellCopy
      preparePaste: typeof end
      verifyPaste: typeof verifyPaste
      destroy: () => void
    }
  }
}
window.identityAcceptance = {
  run, prepareKeyboardCopy, prepareCellCopy, preparePaste: end, verifyPaste,
  destroy: () => editor.destroy()
}
