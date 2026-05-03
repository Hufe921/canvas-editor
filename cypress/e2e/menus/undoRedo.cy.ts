import Editor from '../../../src/editor'

describe('菜单-撤销&重做', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'

  it('撤销', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      cy.get('@canvas').type(`${text}1`)

      cy.get('.menu-item__undo')
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].value).to.eq(text)
        })
    })
  })

  it('重做', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      cy.get('@canvas').type(`${text}1`)

      cy.get('.menu-item__undo').click()

      cy.get('.menu-item__redo')
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].value).to.eq(`${text}1`)
        })
    })
  })
})

describe('菜单-撤销重做-高级', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  it('多次撤销', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([{ value: 'a' }])
      editor.command.executeSetRange(1, 1)
      editor.command.executeInsertElementList([{ value: 'b' }])
      editor.command.executeSetRange(2, 2)
      editor.command.executeInsertElementList([{ value: 'c' }])

      editor.command.executeUndo()
      editor.command.executeUndo()

      const textResult = editor.command.getText()
      expect(textResult.main).to.eq('a')
    })
  })

  it('多次重做', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([{ value: 'a' }])
      editor.command.executeSetRange(1, 1)
      editor.command.executeInsertElementList([{ value: 'b' }])
      editor.command.executeSetRange(2, 2)
      editor.command.executeInsertElementList([{ value: 'c' }])

      editor.command.executeUndo()
      editor.command.executeUndo()

      editor.command.executeRedo()
      editor.command.executeRedo()

      const textResult = editor.command.getText()
      expect(textResult.main).to.eq('abc')
    })
  })

  it('撤销后新操作-清空重做栈', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([{ value: 'a' }])
      editor.command.executeSetRange(1, 1)
      editor.command.executeInsertElementList([{ value: 'b' }])

      editor.command.executeUndo()

      editor.command.executeSetRange(1, 1)
      editor.command.executeInsertElementList([{ value: 'x' }])

      editor.command.executeRedo()

      const textResult = editor.command.getText()
      expect(textResult.main).to.eq('ax')
    })
  })

  it('撤销格式设置', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: 'canvas-editor'
        }
      ])

      editor.command.executeSetRange(0, 13)

      editor.command.executeBold()

      const dataBold = editor.command.getValue().data.main
      expect(dataBold[0].bold).to.eq(true)

      editor.command.executeUndo()

      const dataUndo = editor.command.getValue().data.main
      expect(dataUndo[0].bold).to.eq(undefined)
    })
  })

  it('通过API多次撤销重做', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([{ value: 'a' }])
      editor.command.executeSetRange(1, 1)
      editor.command.executeInsertElementList([{ value: 'b' }])
      editor.command.executeSetRange(2, 2)
      editor.command.executeInsertElementList([{ value: 'c' }])

      editor.command.executeUndo()
      editor.command.executeUndo()

      const textAfterUndo = editor.command.getText()
      expect(textAfterUndo.main).to.eq('a')

      editor.command.executeRedo()
      editor.command.executeRedo()

      const textAfterRedo = editor.command.getText()
      expect(textAfterRedo.main).to.eq('abc')
    })
  })
})
