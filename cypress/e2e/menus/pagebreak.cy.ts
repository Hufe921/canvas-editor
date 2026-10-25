import Editor from '../../../src/editor'

describe('菜单-分页符', () => {
  beforeEach(() => {
    cy.visitEditor()

    cy.getEditorPage().as('canvas').should('have.length', 1)
  })

  it('分页符', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      cy.get('.menu-item__page-break').click().click()

      cy.getEditorPages().should('have.length', 2)
    })
  })
})
