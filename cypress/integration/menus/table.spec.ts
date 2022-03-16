import Editor from '../../../src/editor'

describe('菜单-表格', () => {

  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  it('表格', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.listener.saved = function (payload) {
        const data = payload.data

        expect(data[0].type).to.eq('table')

        expect(data[0].trList?.length).to.eq(8)
      }

      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertTable(8, 8)

      cy.get('@canvas').type('{ctrl}s')
    })
  })

})
