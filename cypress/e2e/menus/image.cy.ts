import Editor from '../../../src/editor'

describe('菜单-图片', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  it('图片', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      cy.get('#image').attachFile('test.png')

      cy.wait(200).then(() => {
        const data = editor.command.getValue().data.main

        expect(data[0].type).to.eq('image')
      })
    })
  })
})
