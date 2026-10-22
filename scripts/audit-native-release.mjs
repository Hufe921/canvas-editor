import assert from 'node:assert/strict'
import {
  existsSync,
  readFileSync,
  readdirSync,
  mkdirSync,
  writeFileSync
} from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import ts from 'typescript'

const root = resolve('src/editor')
const removed = [
  'core/draw/IncrementalRowComputer.ts',
  'core/text-engine/shape/BrowserTextShaper.ts',
  'core/text-engine-host/mapToLegacyRow.ts',
  'core/draw/particle/TextParticle.ts',
  'core/layout/FlowConstraints.ts',
  'core/layout/BlockMeasure.ts'
]
for (const file of removed)
  assert.equal(existsSync(join(root, file)), false, file)
const banned = new Set([
  'BrowserTextShaper',
  'IncrementalRowComputer',
  'TextEngineMode',
  'RenderMode',
  'forceLegacy',
  'IRowComputeState',
  'IComputeRowListResume',
  'mapToLegacyRow'
])
const files = []
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) walk(path)
    else if (path.endsWith('.ts')) files.push(path)
  }
}
walk(root)
const diagnostics = []
const imports = []
const nativeMeasurements = []
const snapshotConsumers = []
const removedNames = new Set(
  removed.map(file => file.split('/').at(-1).replace('.ts', ''))
)
function checkImport(file, specifier, typeOnly, dynamic = false) {
  imports.push({ file, specifier, typeOnly, dynamic })
  const base = specifier
    .split('/')
    .at(-1)
    .replace(/\.(?:js|ts)$/, '')
  if (removedNames.has(base))
    diagnostics.push(`${file}: removed import ${specifier}`)
}
const snapshotAllowed = new Set([
  'core/draw/Draw.ts',
  'core/draw/frame/Header.ts',
  'core/draw/frame/Footer.ts',
  'core/layout/rowSnapshot.ts',
  'core/text-engine-host/LayoutHostAdapter.ts'
])
for (const file of files) {
  const name = relative(root, file)
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true
  )
  function visit(node) {
    if (ts.isIdentifier(node) && banned.has(node.text))
      diagnostics.push(`${name}: removed identifier ${node.text}`)
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const specifier = node.moduleSpecifier.text
      checkImport(
        name,
        specifier,
        !!node.isTypeOnly || !!node.importClause?.isTypeOnly
      )
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      checkImport(name, node.arguments[0].text, false, true)
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      const method = node.expression.name.text
      const receiver = node.expression.expression.getText(source)
      if (['fillText', 'strokeText'].includes(method))
        diagnostics.push(`${name}: browser text call ${receiver}.${method}`)
      if (method === 'measureText') {
        const native =
          (name === 'core/text-engine/layout/TextLayoutService.ts' &&
            receiver === 'this') ||
          (name === 'core/text-engine-host/LayoutHostAdapter.ts' &&
            receiver === 'this.getTextLayoutService()')
        if (!native)
          diagnostics.push(`${name}: unapproved text measurement ${receiver}`)
        else nativeMeasurements.push({ file: name, receiver })
      }
      if (
        [
          'snapshotRows',
          'getRowList',
          'getRawRowList',
          'getPageRowList',
          'layoutParagraphToRows'
        ].includes(method)
      ) {
        snapshotConsumers.push({ file: name, method })
        if (!snapshotAllowed.has(name))
          diagnostics.push(
            `${name}: compatibility snapshot consumed by production logic`
          )
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
}
assert.deepEqual(diagnostics, [])
const frozen = {
  'tests/core/migration/__snapshots__/baseline.test.ts.snap':
    '148fcc33802b3574b5c624a34d5656cbf0d22876c9b3aff656a864e3876e6157',
  'tests/fixtures/migration/t10-geometry.json':
    '52e9c24736033682b4cc28479f0d746c9f53a774413cf32ed270589c74f1c415'
}
for (const [file, sha] of Object.entries(frozen))
  assert.equal(
    createHash('sha256').update(readFileSync(file)).digest('hex'),
    sha,
    file
  )
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
assert.equal(pkg.name, '@herberthe/canvas-editor')
assert.equal(pkg.type, 'module')
assert.equal(pkg.main, undefined)
assert.deepEqual(Object.keys(pkg.exports['.']).sort(), ['import', 'types'])
assert.equal(pkg.dependencies['@hufe921/canvas-editor'], undefined)
const output = 'cypress/results/t24/source-audit.json'
mkdirSync('cypress/results/t24', { recursive: true })
writeFileSync(
  output,
  JSON.stringify(
    {
      files: files.length,
      removed,
      diagnostics,
      nativeMeasurements,
      snapshotConsumers,
      frozen,
      imports
    },
    null,
    2
  )
)
console.log(
  `PASS: ${files.length} production TypeScript files, ${imports.length} import/export edges, removed implementations absent, browser text calls absent, output snapshots isolated, historical hashes preserved`
)
