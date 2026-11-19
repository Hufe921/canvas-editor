import type Editor from '../../../src/editor'
import { TextDirection } from '../../../src/editor'

describe('菜单-文字方向', () => {
  beforeEach(() => {
    cy.visitEditor()
    cy.getEditorPage().should('have.length', 1)
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()
      editor.command.executeBackspace()
      editor.command.executeInsertElementList([{ value: '文字方向测试' }])
    })
  })

  it('通过底部菜单切换方向并回显当前项', () => {
    const directions = [TextDirection.RTL, TextDirection.LTR]

    directions.forEach(direction => {
      cy.get('.text-direction > i').click()
      cy.get('.text-direction .options').should('have.class', 'visible')
      cy.get(`[data-text-direction="${direction}"]`).click()
      cy.get('.text-direction .options').should('not.have.class', 'visible')
      cy.get(`[data-text-direction="${direction}"]`).should(
        'have.class',
        'active'
      )
      cy.get('.text-direction').should('have.attr', 'data-direction', direction)
      cy.getEditor().then((editor: Editor) => {
        expect(editor.command.getDirection()).to.eq(direction)
      })
    })
  })

  it('通过命令修改方向时同步菜单状态', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeDirection(TextDirection.RTL)
    })
    cy.get('[data-text-direction="rtl"]').should('have.class', 'active')

    cy.getEditor().then((editor: Editor) => {
      editor.command.executeDirection(TextDirection.LTR)
    })
    cy.get('[data-text-direction="ltr"]').should('have.class', 'active')
  })
})
