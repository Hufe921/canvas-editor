import { writeFile } from 'node:fs/promises'
import { createServer } from 'vite'

// Explicit live check, deliberately excluded from default/offline test runs.
const server = await createServer({ server: { middlewareMode: true } })
try {
  const { verifyBunnyFonts } = await server.ssrLoadModule(
    '/tests/fixtures/fonts/bunny-smoke.ts'
  )
  const report = JSON.stringify(await verifyBunnyFonts(), null, 2)
  if (process.argv[2]) await writeFile(process.argv[2], `${report}\n`)
  else console.log(report)
} finally {
  await server.close()
}
