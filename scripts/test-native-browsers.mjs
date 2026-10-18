import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

// Optional QA runtime: npm install --no-save playwright, or point at an existing
// installation. Does not add a browser/runtime dependency to the editor package.
const runtime = process.env.PLAYWRIGHT_MODULE || 'playwright'
const runtimes = await import(
  runtime.startsWith('/') ? pathToFileURL(runtime).href : runtime
)
const base = process.env.BASE_URL || 'http://127.0.0.1:3000'
const browserName = process.env.BROWSER || 'webkit'
const output = `cypress/results/${browserName}`
await mkdir(output, { recursive: true })
const browser = await runtimes[browserName].launch({
  timeout: 30000,
  headless: true,
  ...(process.env.BROWSER_EXECUTABLE
    ? { executablePath: process.env.BROWSER_EXECUTABLE }
    : {})
})
const results = []
try {
  const context = await browser.newContext({
    viewport: { width: 1366, height: 720 }
  })
  await context.addInitScript(() => {
    for (const name of ['measureText', 'fillText', 'strokeText'])
      CanvasRenderingContext2D.prototype[name] = () => {
        throw new Error(`Browser text API reached: ${name}`)
      }
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const samples = [
    'paragraphs',
    'emr-controls',
    'nested-table',
    'surround-columns',
    'mixed-paper',
    'print'
  ]
  for (const sample of samples) {
    console.log(`${browserName} baseline: ${sample}`)
    await page.goto(
      `${base}/canvas-editor/tests/fixtures/migration/index.html?sample=${sample}`
    )
    await page.waitForFunction(
      () =>
        document
          .querySelector('#status')
          ?.textContent.includes('"status":"passed"'),
      null,
      { timeout: 60000 }
    )
    const report = JSON.parse(await page.locator('#status').textContent())
    assert.equal(report.sample, sample)
    assert.ok(report.pages > 0)
    assert.ok(report.wordCount > 0)
    await page
      .locator('#editor')
      .screenshot({ path: `${output}/${sample}.png` })
    results.push({ sample, ...report })
  }
  for (const name of [
    'native-flow',
    'native-table',
    'native-object',
    'native-chrome',
    'native-auxiliary',
    'native-interaction'
  ]) {
    console.log(`${browserName} native: ${name}`)
    await page.goto(
      `${base}/canvas-editor/tests/fixtures/migration/${name}.html`
    )
    await page.waitForFunction(
      () => document.querySelector('#status')?.textContent === 'ready',
      null,
      { timeout: 60000 }
    )
    results.push({ sample: name, status: 'passed' })
  }
  await page.goto(
    `${base}/canvas-editor/tests/fixtures/fonts/font-download-smoke.html`
  )
  await page.waitForFunction(() => window.fontSmoke)
  let requests = 0
  await context.route('https://fonts.bunny.net/**', route => {
    requests++
    return route.abort()
  })
  await page.evaluate(async () => {
    const editor = await window.fontSmoke.create(false)
    if (!editor.getFontCoverageReport().issues.length)
      throw new Error('Missing-font UI absent')
    const bytes = await fetch(
      '/canvas-editor/fonts/NotoNaskhArabic-Regular.ttf'
    ).then(r => r.arrayBuffer())
    await editor.register.fonts([{ family: 'Manual Arabic', data: bytes }])
    if (editor.getFontCoverageReport().issues.length)
      throw new Error('Font recovery failed')
    const images = await editor.command.getImage({ mode: 'print' })
    if (!images[0]?.startsWith('data:image/png'))
      throw new Error('Print export failed')
    editor.command.executeSetValue({ main: [{ value: 'مرحبا' }] })
    if (!editor.command.getText().main.includes('مرحبا'))
      throw new Error('Edit failed')
    editor.destroy()
    if (document.querySelector('.ce-font-diagnostics'))
      throw new Error('UI cleanup failed')
  })
  await page.goto(
    `${base}/canvas-editor/tests/fixtures/migration/native-multilingual.html`
  )
  await page.waitForFunction(
    () => document.querySelector('#status')?.textContent === 'ready'
  )
  await page.evaluate(async () => {
    const editor = window.nativeMultilingual.editor
    const issues = editor.getFontCoverageReport().issues
    if (!issues.length || issues.some(i => i.script !== 'zsye'))
      throw new Error('Unexpected multilingual coverage gap')
    if (editor.command.getControlList().length !== 2)
      throw new Error('Missing controls')
    if (!(await editor.command.getImage({ mode: 'print' })).length)
      throw new Error('Multilingual print failed')
    editor.command.executeSetValue({ main: [{ value: 'A👨‍👩‍👧B' }] })
    editor.command.executeSetRange(1, 2)
    if (editor.command.getRangeText() !== '👨‍👩‍👧')
      throw new Error('Split emoji selection')
    editor.command.executeBackspace()
    if (editor.command.getText().main !== 'AB')
      throw new Error('Split emoji deletion')
    editor.command.executeUndo()
    if (editor.command.getText().main !== 'A👨‍👩‍👧B')
      throw new Error('Emoji undo failed')
    editor.command.executeRedo()
    if (editor.command.getText().main !== 'AB')
      throw new Error('Emoji redo failed')
    editor.destroy()
  })
  results.push({
    sample: 'multilingual-controls-table-emoji-edit-print',
    status: 'passed'
  })
  assert.equal(
    requests,
    0,
    'disabled auto-download must make zero Bunny requests'
  )
  assert.deepEqual(errors, [])
  results.push({
    sample: 'missing-font-recovery-edit-print',
    status: 'passed',
    requests
  })
  await writeFile(
    `${output}/report.json`,
    JSON.stringify(
      {
        browser: browserName,
        version: browser.version(),
        results
      },
      null,
      2
    )
  )
  console.log(
    `${browserName} ${browser.version()}: ${results.length} scenarios passed`
  )
} finally {
  await browser.close()
}
