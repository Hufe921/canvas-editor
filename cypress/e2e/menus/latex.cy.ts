import Editor from '../../../src/editor'

describe('菜单-LaTeX', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'

  it('LaTeX', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      cy.get('.menu-item__latex').click()

      cy.get('.dialog-option__item [name="value"]').type(text)

      cy.get('.dialog-menu button')
        .eq(1)
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].type).to.eq('latex')

          expect(data[0].value).to.eq(text)
        })
    })
  })
})
