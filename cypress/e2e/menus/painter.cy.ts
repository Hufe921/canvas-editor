import Editor from '../../../src/editor'

describe('菜单-格式刷', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'
  const textLength = text.length

  it('格式刷', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text,
          bold: true,
          italic: true
        }
      ])

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__painter')
        .click()
        .wait(300)
        .then(() => {
          editor.command.executeSetRange(textLength, 2 * textLength)

          editor.command.executeApplyPainterStyle()

          const data = editor.command.getValue().data.main

          expect(data.length).to.eq(1)

          expect(data[0].italic).to.eq(true)

          expect(data[0].bold).to.eq(true)
        })
    })
  })
})
