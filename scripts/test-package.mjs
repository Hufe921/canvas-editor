import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { build, preview } from 'vite'

const root = fileURLToPath(new URL('../', import.meta.url))
const temp = mkdtempSync(join(tmpdir(), 'canvas-editor-esm-'))
const serve = process.argv.includes('--serve')
let keep = false
try {
  const packed = JSON.parse(
    execFileSync(
      'npm',
      ['pack', '--ignore-scripts', '--json', '--pack-destination', temp],
      {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, npm_config_cache: join(temp, 'npm-cache') }
      }
    )
  )
  const files = packed[0].files.map(file => file.path)
  assert.equal(packed[0].name, '@herberthe/canvas-editor')
  assert(files.includes('LICENSE'))
  assert(files.includes('NOTICE'))
  assert(files.includes('dist/canvas-editor.js'))
  assert(files.includes('dist/src/editor/index.d.ts'))
  assert(!files.some(file => /(?:umd|\.cjs(?:\.map)?$)/i.test(file)))
  const consumer = join(temp, 'consumer')
  const pkgDir = join(consumer, 'node_modules/@herberthe/canvas-editor')
  mkdirSync(pkgDir, { recursive: true })
  execFileSync('tar', [
    '-xzf',
    join(temp, packed[0].filename),
    '-C',
    pkgDir,
    '--strip-components=1'
  ])
  const pkg = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
  const sourcePkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  assert.equal(pkg.name, '@herberthe/canvas-editor')
  assert.equal(pkg.version, sourcePkg.version)
  assert.equal(pkg.author, 'Herbert He')
  assert.equal(pkg.license, 'MIT')
  assert.equal(pkg.dependencies['@hufe921/canvas-editor'], undefined)
  const license = readFileSync(join(pkgDir, 'LICENSE'), 'utf8')
  assert(license.includes('Herbert He'))
  assert(license.includes('2021-present, hufe'))
  assert(
    readFileSync(join(pkgDir, 'NOTICE'), 'utf8').includes('independent fork')
  )
  assert.equal(pkg.main, undefined)
  assert.equal(pkg.type, 'module')
  assert.deepEqual(pkg.exports['.'], {
    types: pkg.types,
    import: pkg.module
  })
  for (const entry of [pkg.types, pkg.module]) {
    assert(existsSync(resolve(pkgDir, entry)))
  }
  const require = createRequire(join(consumer, 'consumer.cjs'))
  assert.throws(() => require.resolve(pkg.name), {
    code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'
  })
  assert.throws(() => require.resolve(`${pkg.name}/dist/canvas-editor.js`), {
    code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'
  })
  writeFileSync(join(pkgDir, 'dist/stale.umd.cjs'), '')
  assert.throws(() =>
    execFileSync(process.execPath, [join(root, 'scripts/pre-release.js')], {
      cwd: pkgDir,
      stdio: 'pipe'
    })
  )
  rmSync(join(pkgDir, 'dist/stale.umd.cjs'))
  // Release preprocessing must also accept ESM-only output. Run on the copy.
  execFileSync(process.execPath, [join(root, 'scripts/pre-release.js')], {
    cwd: pkgDir
  })
  // Resolve declared dependencies from the installed lockfile, offline. This
  // does not expose undeclared repository devDependencies to the consumer.
  for (const dependency of Object.keys(pkg.dependencies || {})) {
    const target = join(consumer, 'node_modules', dependency)
    mkdirSync(dirname(target), { recursive: true })
    symlinkSync(realpathSync(join(root, 'node_modules', dependency)), target)
  }
  writeFileSync(join(consumer, 'package.json'), '{"type":"module"}')
  const fixture = join(root, 'tests/fixtures/migration')
  const rewrite = file =>
    readFileSync(join(fixture, file), 'utf8').replaceAll(
      '../../../src/editor',
      pkg.name
    )
  writeFileSync(join(consumer, 'documents.ts'), rewrite('documents.ts'))
  writeFileSync(join(consumer, 'browser.ts'), rewrite('browser.ts'))
  // Compile and build the documented example against the packed public entry,
  // with no repository aliases or internal imports available to the consumer.
  const example = join(consumer, 'font-example')
  mkdirSync(example, { recursive: true })
  for (const file of ['index.html', 'main.ts']) {
    cpSync(join(root, 'examples/esm-fonts', file), join(example, file))
  }
  writeFileSync(
    join(consumer, 'api-contract.ts'),
    `
import type { IEditorOption, IUpdateOption } from '${pkg.name}'
// @ts-expect-error Removed mode selectors are not root exports.
import { TextEngineMode, RenderMode } from '${pkg.name}'
// @ts-expect-error Removed engine configuration cannot be persisted anew.
const oldEngine: IEditorOption = { textEngine: 'legacy' }
// @ts-expect-error SVG rendering is not a public configuration option.
const svgRenderer: IEditorOption = { renderer: 'svg' }
void svgRenderer
// @ts-expect-error Runtime updates cannot select an old renderer.
const oldRender: IUpdateOption = { renderMode: 'speed' }
void oldEngine
void oldRender
`
  )
  writeFileSync(
    join(consumer, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        target: 'ESNext',
        module: 'ESNext',
        moduleResolution: 'bundler',
        lib: ['ESNext', 'DOM'],
        types: []
      },
      files: [
        'browser.ts',
        'documents.ts',
        'font-example/main.ts',
        'api-contract.ts'
      ]
    })
  )
  execFileSync(
    process.execPath,
    [join(root, 'node_modules/typescript/bin/tsc'), '--noEmit'],
    { cwd: consumer, stdio: 'inherit' }
  )
  const html = `<html><head><meta charset="utf-8"></head><body>
    <p id="status">Loading</p><div id="editor"></div>
    <script type="module" src="./browser.ts"></script></body></html>`
  writeFileSync(join(consumer, 'index.html'), html)
  const font = join(root, 'public/fonts/NotoNaskhArabic-Regular.ttf')
  mkdirSync(join(consumer, 'public/fonts'), { recursive: true })
  cpSync(font, join(consumer, 'public/fonts/NotoNaskhArabic-Regular.ttf'))
  cpSync(
    join(root, 'tests/fixtures/fonts/NotoSans-Latin-Regular.woff2'),
    join(consumer, 'public/fonts/NotoSans-Latin-Regular.woff2')
  )
  // Two independent outputs, both hosted under a non-root URL.
  const output = join(temp, 'site')
  await build({
    configFile: false,
    root: consumer,
    base: '/bundled/',
    logLevel: 'warn',
    build: {
      target: 'esnext',
      outDir: join(output, 'bundled'),
      emptyOutDir: true
    }
  })
  await build({
    configFile: false,
    root: example,
    base: '/font-example/',
    logLevel: 'warn',
    build: {
      target: 'esnext',
      outDir: join(output, 'font-example'),
      emptyOutDir: true
    }
  })
  const native = join(output, 'native')
  mkdirSync(native, { recursive: true })
  cpSync(pkgDir, join(native, 'package'), { recursive: true })
  cpSync(join(consumer, 'public/fonts'), join(native, 'fonts'), {
    recursive: true
  })
  // Transpile only: the browser, rather than a bundler, resolves the import map.
  execFileSync(
    process.execPath,
    [
      join(root, 'node_modules/typescript/bin/tsc'),
      '--target',
      'ESNext',
      '--module',
      'ESNext',
      '--moduleResolution',
      'bundler',
      '--project',
      '.',
      '--outDir',
      native
    ],
    { cwd: consumer, stdio: 'inherit' }
  )
  const imports = { [pkg.name]: './package/dist/canvas-editor.js' }
  writeFileSync(
    join(native, 'index.html'),
    html.replace('./browser.ts', './browser.js').replace(
      '<script type="module"',
      `<script type="importmap">${JSON.stringify({ imports })}</script>
      <script type="module"`
    )
  )
  // Native browsers require explicit .js on the local fixture import.
  const browserJs = join(native, 'browser.js')
  writeFileSync(
    browserJs,
    readFileSync(browserJs, 'utf8').replace(
      "from './documents'",
      "from './documents.js'"
    )
  )
  function checkRelativeImports(directory) {
    for (const file of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, file.name)
      if (file.isDirectory()) checkRelativeImports(path)
      else if (file.name.endsWith('.js')) {
        const source = readFileSync(path, 'utf8')
        for (const match of source.matchAll(
          /(?:from|import)\s*[(']?\s*["'](\.\.?\/[^"']+)["']/g
        )) {
          assert(existsSync(resolve(dirname(path), match[1])), match[1])
        }
      }
    }
  }
  checkRelativeImports(join(native, 'package/dist'))
  console.log(
    'PASS: tarball, import-only exports, release preprocessing, ' +
      'strict consumer types, documented font example, bundler build and relative ESM chunks'
  )
  if (serve) {
    const server = await preview({
      configFile: false,
      root: temp,
      base: '/',
      build: { outDir: output },
      preview: { host: '127.0.0.1', port: 4179, strictPort: true }
    })
    keep = true
    console.log(
      'Browser checks: http://127.0.0.1:4179/native/, /bundled/ and /font-example/'
    )
    const stop = () => {
      server.httpServer.close()
      rmSync(temp, { recursive: true, force: true })
      process.exit()
    }
    process.once('SIGINT', stop)
    process.once('SIGTERM', stop)
  }
} finally {
  if (!keep) rmSync(temp, { recursive: true, force: true })
}
