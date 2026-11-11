import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import WebSocket from 'ws'
import { CollaborationServer } from '../server/CollaborationServer.js'

const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
].filter(Boolean)
const chromePath = CHROME_CANDIDATES.find(candidate => existsSync(candidate))
if (!chromePath) {
  throw new Error('Chrome not found. Set CHROME_BIN to a Chrome executable.')
}

const sleep = milliseconds =>
  new Promise(resolve => setTimeout(resolve, milliseconds))

async function waitFor(callback, description, timeout = 10000) {
  const startedAt = Date.now()
  let lastError
  while (Date.now() - startedAt < timeout) {
    try {
      if (await callback()) return
    } catch (error) {
      lastError = error
    }
    await sleep(50)
  }
  throw new Error(
    `Timed out waiting for ${description}${lastError ? `: ${lastError}` : ''}`
  )
}

class CdpClient {
  constructor(url) {
    this.socket = new WebSocket(url)
    this.nextId = 1
    this.pending = new Map()
    this.socket.on('message', data => {
      const message = JSON.parse(data.toString())
      if (!message.id) return
      const pending = this.pending.get(message.id)
      if (!pending) return
      this.pending.delete(message.id)
      if (message.error) pending.reject(new Error(message.error.message))
      else pending.resolve(message.result)
    })
  }

  async open() {
    if (this.socket.readyState === WebSocket.OPEN) return
    await new Promise((resolve, reject) => {
      this.socket.once('open', resolve)
      this.socket.once('error', reject)
    })
  }

  send(method, params = {}) {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.socket.send(JSON.stringify({ id, method, params }))
    })
  }

  async evaluate(expression) {
    const response = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    })
    if (response.exceptionDetails) {
      throw new Error(
        response.exceptionDetails.exception?.description ||
          response.exceptionDetails.text
      )
    }
    return response.result.value
  }

  close() {
    this.socket.close()
  }
}

const dataDir = await mkdtemp(join(tmpdir(), 'canvas-editor-browser-data-'))
const server = new CollaborationServer({
  host: '127.0.0.1',
  port: 0,
  dataDir,
  production: process.env.COLLAB_BROWSER_DEV !== '1',
  logger: { log() {}, error: console.error }
})
const profileDir = await mkdtemp(join(tmpdir(), 'canvas-editor-chrome-'))
let chrome
let browser
const pages = []

try {
  await server.start()
  chrome = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--remote-debugging-port=0',
      `--user-data-dir=${profileDir}`,
      'about:blank'
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] }
  )
  let chromeErrors = ''
  chrome.stderr.on('data', data => {
    chromeErrors += data.toString()
  })
  const portFile = join(profileDir, 'DevToolsActivePort')
  await waitFor(() => {
    if (chrome.exitCode !== null) throw new Error(chromeErrors)
    return existsSync(portFile)
  }, 'Chrome debugging port')
  const [debugPort] = (await readFile(portFile, 'utf8')).split('\n')
  const version = await fetch(
    `http://127.0.0.1:${debugPort}/json/version`
  ).then(response => response.json())
  browser = new CdpClient(version.webSocketDebuggerUrl)
  await browser.open()
  const browserHost = process.env.COLLAB_BROWSER_HOST || '127.0.0.1'
  const url = `http://${browserHost}:${server.port}/?room=browser-e2e`
  for (let index = 0; index < 2; index++) {
    const target = await fetch(
      `http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(url)}`,
      { method: 'PUT' }
    ).then(response => response.json())
    const page = new CdpClient(target.webSocketDebuggerUrl)
    await page.open()
    await page.send('Runtime.enable')
    await page.send('Page.enable')
    pages.push(page)
  }
  for (const page of pages) {
    await waitFor(async () => {
      return page.evaluate(`(() => {
        const editor = window.__CANVAS_EDITOR_INSTANCE__
        const status = document.querySelector('#connection-status')
        return document.readyState === 'complete' && editor &&
          status?.dataset.status === 'connected' &&
          editor.command.getText().main.includes('Canvas Editor')
      })()`)
    }, 'both editors to connect and render')
  }

  const insert = (page, value) =>
    page.evaluate(`(() => {
      const editor = window.__CANVAS_EDITOR_INSTANCE__
      editor.command.executeSetRange(0, 0)
      editor.command.executeInsertElementList(
        Array.from(${JSON.stringify(value)}).map(value => ({ value }))
      )
      return true
    })()`)
  await Promise.all([insert(pages[0], '甲乙'), insert(pages[1], '丙丁')])

  const readText = page =>
    page.evaluate(
      `window.__CANVAS_EDITOR_INSTANCE__.command.getText().main`
    )
  await waitFor(async () => {
    const [first, second] = await Promise.all(pages.map(readText))
    return (
      first === second &&
      ['甲', '乙', '丙', '丁'].every(character => first.includes(character))
    )
  }, 'concurrent browser edits to converge')
  const [firstText, secondText] = await Promise.all(pages.map(readText))
  assert.equal(firstText, secondText)
  for (const character of ['甲', '乙', '丙', '丁']) {
    assert.equal(
      Array.from(firstText).filter(value => value === character).length,
      1,
      `${character} must not be duplicated by synchronization feedback`
    )
  }

  const typedToken = `TYPED_${Date.now()}`
  await pages[0].send('Page.bringToFront')
  await pages[0].evaluate(`(() => {
    const editor = window.__CANVAS_EDITOR_INSTANCE__
    editor.command.executeSetRange(0, 0)
  })()`)
  await waitFor(() => {
    return pages[0].evaluate(
      `document.activeElement?.tagName === 'TEXTAREA'`
    )
  }, 'editor input agent to receive focus')
  await pages[0].send('Input.insertText', { text: typedToken })
  const sharedImmediatelyAfterTyping = await pages[0].evaluate(`(() => {
    const collaboration = window.__CANVAS_EDITOR_COLLABORATION__
    const text = collaboration.provider.doc.getArray('elements')
      .toJSON().map(element => element.value).join('')
    return text.includes(${JSON.stringify(typedToken)})
  })()`)
  assert.equal(
    sharedImmediatelyAfterTyping,
    true,
    'native input must reach CRDT without waiting for an idle callback'
  )
  await waitFor(async () => {
    const text = await readText(pages[1])
    return text.includes(typedToken)
  }, 'native browser typing to reach the second editor')

  const keyToken = `key${Date.now()}z`
  for (const character of keyToken) {
    await pages[0].send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: character,
      text: character,
      unmodifiedText: character
    })
    await pages[0].send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: character
    })
  }
  await waitFor(async () => {
    const text = await readText(pages[1])
    return text.includes(keyToken)
  }, 'individual key presses to reach the second editor')

  const imeToken = `协同${Date.now()}`
  await pages[0].send('Input.imeSetComposition', {
    text: imeToken,
    selectionStart: imeToken.length,
    selectionEnd: imeToken.length,
    replacementStart: 0,
    replacementEnd: 0
  })
  await pages[0].send('Input.insertText', { text: imeToken })
  await waitFor(async () => {
    const text = await readText(pages[1])
    return text.includes(imeToken)
  }, 'IME composition to reach the second editor')

  await pages[0].evaluate(`(() => {
    const editor = window.__CANVAS_EDITOR_INSTANCE__
    editor.command.executeSetRange(0, 1)
    editor.command.executeItalic()
  })()`)
  await waitFor(async () => {
    return pages[1].evaluate(`(() => {
      const elements = window.__CANVAS_EDITOR_INSTANCE__.command
        .getValue({ extraPickAttrs: ['id'] }).data.main
      return elements.some(element => element.italic)
    })()`)
  }, 'inline formatting to reach the second editor')

  await pages[0].send('Page.bringToFront')
  await pages[1].evaluate(`(() => {
    const editor = window.__CANVAS_EDITOR_INSTANCE__
    editor.command.executeSetRange(1, 1)
  })()`)
  await waitFor(async () => {
    const memberCounts = await Promise.all(
      pages.map(page =>
        page.evaluate(`document.querySelector('#member-count').textContent`)
      )
    )
    const labels = await pages[0].evaluate(
      `document.querySelector('.collab-remote-caret__label')?.textContent || ''`
    )
    return memberCounts.every(count => count === '2') && labels.length > 0
  }, 'member list and remote cursor')

  const undoToken = `UNDO_${Date.now()}`
  await insert(pages[0], undoToken)
  await waitFor(async () => {
    const text = await readText(pages[1])
    return text.includes(undoToken)
  }, 'edit before undo to reach the second editor')
  await pages[0].evaluate(
    `window.__CANVAS_EDITOR_COLLABORATION__.undo()`
  )
  await waitFor(async () => {
    const text = await readText(pages[1])
    return !text.includes(undoToken)
  }, 'collaborative undo to reach the second editor')

  const imageValue =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
  await pages[0].evaluate(`(() => {
    const editor = window.__CANVAS_EDITOR_INSTANCE__
    editor.command.executeSetRange(0, 0)
    editor.command.executeImage({
      value: ${JSON.stringify(imageValue)},
      width: 24,
      height: 24
    })
    editor.command.executeInsertTable(1, 2)
  })()`)
  await waitFor(async () => {
    return Promise.all(
      pages.map(page =>
        page.evaluate(`(() => {
          const elements = window.__CANVAS_EDITOR_INSTANCE__.command
            .getValue({ extraPickAttrs: ['id'] }).data.main
          const table = elements.find(element => element.type === 'table')
          return elements.some(element =>
            element.type === 'image' && element.value === ${JSON.stringify(imageValue)}
          ) && table?.trList?.length === 1 && table.trList[0].tdList.length === 2
        })()`)
      )
    ).then(results => results.every(Boolean))
  }, 'image and table to reach both editors')
  const tableId = await pages[0].evaluate(`(() => {
    const elements = window.__CANVAS_EDITOR_INSTANCE__.command
      .getValue({ extraPickAttrs: ['id'] }).data.main
    return elements.find(element => element.type === 'table').id
  })()`)
  assert.ok(tableId)

  const cellTokens = [`LEFT_${Date.now()}`, `RIGHT_${Date.now()}`]
  await Promise.all(
    pages.map((page, cellIndex) =>
      page.evaluate(`(() => {
        const editor = window.__CANVAS_EDITOR_INSTANCE__
        const range = {
          startIndex: 0,
          endIndex: 0,
          tableId: ${JSON.stringify(tableId)},
          startTdIndex: ${cellIndex},
          endTdIndex: ${cellIndex},
          startTrIndex: 0,
          endTrIndex: 0
        }
        editor.command.executeSetPositionContext(range)
        editor.command.executeReplaceRange(range)
        editor.command.executeInsertElementList(
          Array.from(${JSON.stringify(cellTokens[cellIndex])})
            .map(value => ({ value }))
        )
      })()`)
    )
  )
  const readCellText = (page, cellIndex) =>
    page.evaluate(`(() => {
      const elements = window.__CANVAS_EDITOR_INSTANCE__.command
        .getValue({ extraPickAttrs: ['id'] }).data.main
      const table = elements.find(element => element.id === ${JSON.stringify(tableId)})
      return table.trList[0].tdList[${cellIndex}].value
        .map(element => element.value).join('')
    })()`)
  await waitFor(async () => {
    const texts = await Promise.all(
      pages.flatMap(page => [readCellText(page, 0), readCellText(page, 1)])
    )
    return (
      texts[0] === texts[2] &&
      texts[1] === texts[3] &&
      texts[0].includes(cellTokens[0]) &&
      texts[1].includes(cellTokens[1])
    )
  }, 'concurrent edits in different table cells to converge')

  const remoteCellToken = `REMOTE_${Date.now()}`
  await pages[1].evaluate(`(() => {
    const editor = window.__CANVAS_EDITOR_INSTANCE__
    editor.command.executeInsertElementList(
      Array.from(${JSON.stringify(remoteCellToken)}).map(value => ({ value }))
    )
  })()`)
  await waitFor(async () => {
    return (await readCellText(pages[0], 1)).includes(remoteCellToken)
  }, 'remote cell update before continuing local input')
  const restoredRange = await pages[0].evaluate(
    `window.__CANVAS_EDITOR_INSTANCE__.command.getRange()`
  )
  assert.equal(restoredRange.tableId, tableId)
  assert.equal(restoredRange.startTrIndex, 0)
  assert.equal(restoredRange.startTdIndex, 0)
  const continuedCellToken = `AFTER_${Date.now()}`
  await pages[0].evaluate(`(() => {
    const editor = window.__CANVAS_EDITOR_INSTANCE__
    editor.command.executeInsertElementList(
      Array.from(${JSON.stringify(continuedCellToken)}).map(value => ({ value }))
    )
  })()`)
  await waitFor(async () => {
    return (await readCellText(pages[1], 0)).includes(continuedCellToken)
  }, 'continued cell input to reach the second editor')
  assert.equal(await readCellText(pages[0], 0), await readCellText(pages[1], 0))

  console.log(
    '✓ Two Chrome pages converged after native typing, key presses, IME, concurrent edits, formatting, presence, undo, images and table-cell editing'
  )
} catch (error) {
  console.error(error)
  for (const [index, page] of pages.entries()) {
    const state = await page
      .evaluate(`(() => {
        const editor = window.__CANVAS_EDITOR_INSTANCE__
        const collaboration = window.__CANVAS_EDITOR_COLLABORATION__
        const pickTables = elements => elements
          .filter(element => element.type === 'table')
          .map(element => ({
            id: element.id,
            rows: element.trList.map(row => ({
              id: row.id,
              cells: row.tdList.map(cell => ({
                id: cell.id,
                value: cell.value.map(item => ({ id: item.id, value: item.value }))
              }))
            }))
          }))
        return {
          range: editor.command.getRange(),
          tables: pickTables(editor.command.getValue({
            extraPickAttrs: ['id']
          }).data.main),
          sharedTables: pickTables(collaboration.provider.doc
            .getArray('elements').toJSON())
        }
      })()`)
      .catch(() => null)
    console.error(`Page ${index} state:`, JSON.stringify(state))
  }
  process.exitCode = 1
} finally {
  const chromeExited =
    chrome && chrome.exitCode === null && chrome.signalCode === null
      ? new Promise(resolve => chrome.once('exit', resolve))
      : null
  for (const page of pages) page.close()
  if (browser) {
    await browser.send('Browser.close').catch(() => {})
    browser.close()
  }
  if (chrome && chrome.exitCode === null && chrome.signalCode === null) {
    chrome.kill('SIGTERM')
  }
  if (chromeExited) await Promise.race([chromeExited, sleep(5000)])
  await server.stop()
  await rm(profileDir, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100
  })
  await rm(dataDir, { recursive: true, force: true })
}
