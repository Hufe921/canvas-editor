import { CollaborationServer } from './CollaborationServer.js'

function readArgument(name) {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const server = new CollaborationServer({
  host: readArgument('host') || process.env.HOST || '0.0.0.0',
  port: Number(readArgument('port') || process.env.PORT) || 7100,
  production: process.env.NODE_ENV === 'production'
})

await server.start()

let stopping = false
const stop = async () => {
  if (stopping) return
  stopping = true
  await server.stop()
  process.exit(0)
}

process.on('SIGINT', () => void stop())
process.on('SIGTERM', () => void stop())
