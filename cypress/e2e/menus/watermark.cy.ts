import Editor from '../../../src/editor'

describe('菜单-水印', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'
  const size = 80

  it('添加水印', () => {
    cy.getEditor().then((editor: Editor) => {
      cy.get('.menu-item__watermark').click()

      cy.get('.menu-item__watermark li').eq(0).click()

      cy.get('.dialog-option [name="data"]').type(text)

      cy.get('.dialog-option [name="size"]').as('size')

      cy.get('@size').clear()

      cy.get('@size').type(`${size}`)

      cy.get('.dialog-menu button')
        .eq(1)
        .click()
        .then(() => {
          const payload = editor.command.getValue()

          const {
            options: { watermark }
          } = payload

          expect(watermark?.data).to.eq(text)

          expect(watermark?.size).to.eq(size)
        })
    })
  })

  it('删除水印', () => {
    cy.getEditor().then((editor: Editor) => {
      cy.get('.menu-item__watermark').click()

      cy.get('.menu-item__watermark li')
        .eq(1)
        .click()
        .then(() => {
          const payload = editor.command.getValue()

          const {
            options: { watermark }
          } = payload

          expect(watermark?.data).to.eq('')

          expect(watermark?.size).to.eq(200)
        })
    })
  })
})
