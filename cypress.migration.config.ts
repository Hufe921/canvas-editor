import { defineConfig } from 'cypress'

export default defineConfig({
  video: false,
  viewportWidth: 1366,
  viewportHeight: 720,
  e2e: {
    baseUrl: 'http://127.0.0.1:3000',
    specPattern: 'cypress/migration/**/*.cy.ts',
    supportFile: 'cypress/support/native-text-guard.ts'
  }
})
