import Editor from '../../../src/editor'

describe('菜单-打印', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').should('have.length', 2)
  })

  it('打印', () => {
    cy.getEditor().then(async (editor: Editor) => {
      const imageList2 = await editor.command.getImage()
      expect(imageList2.length).to.eq(2)

      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      cy.wait(200).then(async () => {
        const imageList1 = await editor.command.getImage()
        expect(imageList1.length).to.eq(1)
      })
    })
  })
})
