import Editor, { ElementType, TitleLevel } from '../../../src/editor'

describe('菜单-标题', () => {
  const url = 'http://localhost:3000/canvas-editor/'

  beforeEach(() => {
    cy.visit(url)

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'
  const elementType = <ElementType>'title'
  const level = <TitleLevel>'first'

  it('标题', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      cy.get('.menu-item__title').as('title').click()

      cy.get('@title')
        .find('li')
        .eq(1)
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].type).to.eq(elementType)

          expect(data[0].level).to.eq(level)
        })
    })
  })
})
