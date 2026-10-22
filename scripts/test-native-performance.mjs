import assert from 'node:assert/strict'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

// Optional QA dependency, never a runtime dependency of the distributed editor.
const runtime = process.env.PLAYWRIGHT_MODULE || 'playwright'
const { chromium } = await import(
  runtime.startsWith('/') ? pathToFileURL(runtime).href : runtime
)
const browser = await chromium.launch({
  headless: true,
  args: ['--js-flags=--expose-gc', '--enable-precise-memory-info'],
  ...(process.env.BROWSER_EXECUTABLE
    ? { executablePath: process.env.BROWSER_EXECUTABLE }
    : {})
})
const output = process.env.OUTPUT || 'cypress/results/t23/performance.json'
const trials = Number(process.env.TRIALS || 3)
assert.ok(Number.isInteger(trials) && trials > 0)
const target = process.env.BASE_URL || 'http://127.0.0.1:3000'
const historical = process.env.HISTORICAL === '1'
const results = []
const errors = []
let requests = 0
try {
  const probe = await browser.newPage()
  const path = '/canvas-editor/tests/fixtures/migration/performance.html'
  await probe.goto(target + path)
  await probe.waitForFunction(() => window.performanceQA)
  const ids = process.env.RESOURCE_ONLY
    ? []
    : process.env.SAMPLES?.split(',') ||
      (await probe.evaluate(() => window.performanceQA.ids))
  await probe.close()
  for (const id of ids) {
    for (const incremental of [false, true]) {
      for (let trial = 0; trial < trials; trial++) {
        const context = await browser.newContext({
          viewport: { width: 1366, height: 720 },
          deviceScaleFactor: 1
        })
        await context.route('https://fonts.bunny.net/**', route => {
          requests++
          return route.abort()
        })
        if (!historical)
          await context.addInitScript(() => {
            for (const method of ['measureText', 'fillText', 'strokeText']) {
              CanvasRenderingContext2D.prototype[method] = () => {
                throw new Error('Browser text API reached: ' + method)
              }
            }
          })
        const page = await context.newPage()
        const navigationStart = Date.now()
        page.on('pageerror', error => errors.push(error.message))
        await page.goto(target + path + (historical ? '?historical' : ''))
        await page.waitForFunction(() => window.performanceQA)
        const moduleReadyMs = Date.now() - navigationStart
        const result = await page.evaluate(
          async ({ id, incremental }) =>
            window.performanceQA.run(id, incremental),
          { id, incremental }
        )
        const disposed = await page.evaluate(() =>
          window.performanceQA.destroy()
        )
        assert.equal(disposed.canvases, 0)
        if (!historical) {
          assert.equal(disposed.diagnostics, 0)
          assert.equal(disposed.documentFonts, 0)
          for (const [key, value] of Object.entries(disposed.cache))
            if (value !== null) assert.equal(value, 0, key)
          assert.ok(result.cache.paragraphs <= 256)
          assert.ok(result.cache.fontInstances <= 256)
          assert.ok(result.cache.coverageEntries <= 2048)
          assert.ok(result.cache.outlineEntries <= 1024)
          assert.ok(result.cache.outlineBytes <= 4 * 1024 * 1024)
        }
        results.push({
          trial,
          moduleReadyMs,
          navigationThroughFirstPaintMs: moduleReadyMs + result.startupMs,
          ...result,
          disposed
        })
        await context.close()
      }
    }
    console.log(`PASS ${historical ? 'T01' : 'native'}: ${id}`)
  }
  const stress = []
  if (!historical && !process.env.SAMPLES) {
    const page = await browser.newPage({
      viewport: { width: 1366, height: 720 },
      deviceScaleFactor: 1
    })
    const cdp = await page.context().newCDPSession(page)
    await page.goto(target + path)
    await page.waitForFunction(() => window.performanceQA)
    await page.evaluate(() => window.performanceQA.run('many-paragraphs', true))
    for (let batch = 0; batch < 6; batch++) {
      const state = await page.evaluate(() => window.performanceQA.stress(30))
      await cdp.send('HeapProfiler.collectGarbage')
      stress.push({
        batch,
        ...state,
        heap: await cdp.send('Runtime.getHeapUsage'),
        dom: await cdp.send('Memory.getDOMCounters')
      })
      assert.ok(state.cache.paragraphs <= 256)
      assert.ok(state.cache.outlineEntries <= 1024)
      assert.ok(state.cache.outlineBytes <= 4 * 1024 * 1024)
      assert.ok(state.cache.coverageEntries <= 2048)
    }
    const disposed = await page.evaluate(() => window.performanceQA.destroy())
    for (const [key, value] of Object.entries(disposed.cache))
      if (value !== null) assert.equal(value, 0, key)
    assert.equal(disposed.canvases, 0)
    assert.equal(disposed.documentFonts, 0)
    stress.push({ disposed })
    const cycles = []
    for (let cycle = 0; cycle < 8; cycle++) {
      await page.evaluate(() => window.performanceQA.run('paragraphs', true))
      const released = await page.evaluate(() => window.performanceQA.destroy())
      assert.equal(released.canvases, 0)
      assert.equal(released.diagnostics, 0)
      assert.equal(released.documentFonts, 0)
      await cdp.send('HeapProfiler.collectGarbage')
      cycles.push({
        cycle,
        heap: await cdp.send('Runtime.getHeapUsage'),
        dom: await cdp.send('Memory.getDOMCounters')
      })
    }
    stress.push({ cycles })
    await page.close()
  }
  assert.equal(requests, 0, 'offline configuration must not request Bunny')
  assert.deepEqual(errors, [])
  await mkdir(output.slice(0, output.lastIndexOf('/')), { recursive: true })
  await writeFile(
    output,
    JSON.stringify(
      {
        date: new Date().toISOString(),
        node: process.version,
        browser: browser.version(),
        source: historical
          ? 'fd11752e'
          : execFileSync('git', ['rev-parse', 'HEAD'], {
              encoding: 'utf8'
            }).trim(),
        fontSHA256: createHash('sha256')
          .update(await readFile('public/fonts/NotoNaskhArabic-Regular.ttf'))
          .digest('hex'),
        viewport: [1366, 720],
        dpr: 1,
        trials,
        historical,
        requests,
        errors,
        results,
        stress
      },
      null,
      2
    )
  )
  console.log(`PASS: ${results.length} trials; report ${output}`)
} finally {
  await browser.close()
}
