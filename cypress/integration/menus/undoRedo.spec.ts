import Editor from '../../../src/editor'

describe('菜单-撤销&重做', () => {

  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)

    cy.get('@canvas').type(`{ctrl}a{backspace}`)
  })

  const text = 'canvas-editor'

  it('撤销', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.listener.saved = function (payload) {
        expect(payload.data[0].value).to.eq(text)
      }
    })

    cy.get('@canvas').type(`${text}1`)

    cy.get('.menu-item__undo').click()

    cy.get('@canvas').type(`{ctrl}s`)
  })

  it('重做', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.listener.saved = function (payload) {
        expect(payload.data[0].value).to.eq(`${text}1`)
      }
    })

    cy.get('@canvas').type(`${text}1`)

    cy.get('.menu-item__undo').click()

    cy.get('.menu-item__redo').click()

    cy.get('@canvas').type(`{ctrl}s`)
  })

})
