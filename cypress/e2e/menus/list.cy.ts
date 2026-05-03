import Editor, { ElementType, ListType } from '../../../src/editor'

describe('菜单-列表', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'

  it('无序列表', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, text.length)

      editor.command.executeList(<ListType>'ul')

      const data = editor.command.getValue().data.main

      expect(data[0].type).to.eq(<ElementType>'list')

      expect(data[0].listType).to.eq('ul')
    })
  })

  it('有序列表', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, text.length)

      editor.command.executeList(<ListType>'ol')

      const data = editor.command.getValue().data.main

      expect(data[0].type).to.eq(<ElementType>'list')

      expect(data[0].listType).to.eq('ol')
    })
  })

  it('取消列表', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, text.length)

      // 添加列表
      editor.command.executeList(<ListType>'ul')

      const dataList = editor.command.getValue().data.main
      expect(dataList[0].type).to.eq(<ElementType>'list')

      // 取消列表
      editor.command.executeSetRange(0, text.length)

      editor.command.executeList(null)

      const dataPlain = editor.command.getValue().data.main
      expect(dataPlain[0].type).to.eq(undefined)
    })
  })

  it('有序列表-通过菜单交互', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, text.length)

      cy.get('.menu-item__list').click()

      cy.get('.menu-item__list')
        .find('li')
        .eq(1)
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].type).to.eq(<ElementType>'list')

          expect(data[0].listType).to.eq('ol')
        })
    })
  })
})
