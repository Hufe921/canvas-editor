Cypress.Commands.add('getEditor', () => {
  return cy.window().its('editor')
})