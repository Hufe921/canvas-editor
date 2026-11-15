import Editor from '../../../src/editor'

describe('菜单-代码块', () => {
  beforeEach(() => {
    cy.visitEditor()

    cy.getEditorPage().as('canvas').should('have.length', 1)
  })

  const text = `console.log('canvas-editor')`

  it('代码块', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      cy.get('.menu-item__codeblock').click()

      cy.get('.dialog-option [name="codeblock"]').type(text)

      cy.get('.dialog-menu button')
        .eq(1)
        .click()
        .then(() => {
          const area = editor.command
            .getValue()
            .data.main.find(element => element.areaId)
          const data = area?.valueList?.[2]

          expect(area?.area?.backgroundColor).to.eq('#f5f5f5')

          expect(data?.value).to.eq('log')

          expect(data?.color).to.eq('#b9a40a')
        })
    })
  })
})
