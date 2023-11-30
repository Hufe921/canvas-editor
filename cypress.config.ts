import { defineConfig } from 'cypress'

export default defineConfig({
  video: false,
  viewportWidth: 1366,
  viewportHeight: 720,
  e2e: {
    experimentalRunAllSpecs: true
  }
})
