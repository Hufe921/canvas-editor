import './commands'

import './native-text-guard'

// Public Bunny availability is covered by the opt-in smoke suite.
beforeEach(() => {
  cy.intercept('https://fonts.bunny.net/**', { statusCode: 404 })
})
