import Editor from '../../../src/editor'

describe('菜单-内容块', () => {
  const url = 'http://localhost:3000/canvas-editor/'

  beforeEach(() => {
    cy.visit(url)

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  it('内容块', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      cy.get('.menu-item__block').click()

      cy.get('.dialog-option__item [name="width"]').type('500')

      cy.get('.dialog-option__item [name="height"]').type('300')

      cy.get('.dialog-option__item [name="src"]').type(url)

      cy.get('.dialog-menu button')
        .eq(1)
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].type).to.eq('block')

          expect(data[0].block?.iframeBlock?.src).to.eq(url)
        })
    })
  })
})
