import Editor from '../../../src/editor'

describe('菜单-分页符', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('.ce-page-container canvas')
      .first()
      .as('canvas')
      .should('have.length', 1)
  })

  it('分页符', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      cy.get('.menu-item__page-break').click().click()

      cy.get('.ce-page-container canvas').should('have.length', 2)
    })
  })
})
