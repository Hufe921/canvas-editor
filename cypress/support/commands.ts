import 'cypress-file-upload'

Cypress.Commands.add('getEditor', () => {
  return cy.window().its('editor')
})

Cypress.Commands.add('visitEditor', () => {
  const backend = Cypress.env('backend')
  const query = backend === 'svg' ? '?backend=svg' : '?backend=canvas'
  return cy.visit(`http://localhost:3000/canvas-editor/${query}`)
})

Cypress.Commands.add('getEditorPages', () => {
  const backend = Cypress.env('backend') === 'svg' ? 'svg' : 'canvas'
  return cy.get(`.ce-page-container > ${backend}[data-index]`)
})

Cypress.Commands.add('getEditorPage', (index = 0) => {
  const backend = Cypress.env('backend') === 'svg' ? 'svg' : 'canvas'
  return cy.get(`.ce-page-container > ${backend}[data-index="${index}"]`)
})
