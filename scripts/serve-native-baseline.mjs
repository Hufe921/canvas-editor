import { execFileSync } from 'node:child_process'
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  realpathSync,
  rmSync,
  symlinkSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createServer } from 'vite'

// Read-only historical export. Never checkout/reset the user's working tree.
const source = 'fd11752e'
const port = Number(process.env.BASELINE_PORT || 3001)
const root = realpathSync(mkdtempSync(join(tmpdir(), 'canvas-t01-')))
let server
try {
  const archive = execFileSync('git', ['archive', source], {
    maxBuffer: 64 * 1024 * 1024
  })
  execFileSync('tar', ['-x', '-C', root], { input: archive })
  symlinkSync(realpathSync('node_modules'), join(root, 'node_modules'), 'dir')
  const target = join(root, 'tests/fixtures/migration')
  mkdirSync(target, { recursive: true })
  for (const file of ['performance.html', 'performance.ts', 'documents.ts']) {
    cpSync(join('tests/fixtures/migration', file), join(target, file))
  }
  server = await createServer({
    root,
    configFile: join(root, 'vite.config.ts'),
    cacheDir: join(root, 'qa-vite-cache'),
    server: {
      host: '127.0.0.1',
      port,
      strictPort: true,
      fs: { allow: [root, resolve('.')] }
    }
  })
  await server.listen()
  console.log(
    `T01 ${source}: http://127.0.0.1:${port}/canvas-editor/ (temporary source ${root})`
  )
} catch (error) {
  await server?.close()
  rmSync(root, { recursive: true, force: true })
  throw error
}
async function stop() {
  await server.close()
  rmSync(root, { recursive: true, force: true })
  process.exit()
}
process.once('SIGINT', stop)
process.once('SIGTERM', stop)
