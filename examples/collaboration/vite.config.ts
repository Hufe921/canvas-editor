import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: {
    alias: {
      '@canvas-editor': fileURLToPath(
        new URL('../../src/editor/index.ts', import.meta.url)
      )
    }
  },
  server: {
    host: '0.0.0.0',
    port: 7100
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
