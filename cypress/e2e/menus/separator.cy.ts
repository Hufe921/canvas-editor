import Editor from '../../../src/editor'

describe('菜单-分割线', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  it('分割线', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      cy.get('.menu-item__separator').click()

      cy.get('.menu-item__separator li')
        .eq(1)
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].type).to.eq('separator')

          expect(data[0]?.dashArray?.[0]).to.eq(1)

          expect(data[0]?.dashArray?.[1]).to.eq(1)
        })
    })
  })
})
