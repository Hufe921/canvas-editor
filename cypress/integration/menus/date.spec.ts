import Editor from '../../../src/editor'

describe('菜单-日期选择器', () => {

  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  it('LaTeX', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.listener.saved = function (payload) {
        const data = payload.data

        expect(data[0].type).to.eq('date')
      }

      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      cy.get('.menu-item__date').click()

      cy.get('.menu-item__date li').first().click()

      cy.get('@canvas').type('{ctrl}s')
    })
  })

})
