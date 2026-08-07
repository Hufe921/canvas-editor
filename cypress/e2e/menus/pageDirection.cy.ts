import type Editor from '../../../src/editor'
import { PaperDirection } from '../../../src/editor'

describe('菜单-页面布局-指定页面横向', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  it('设置指定页面横向并恢复', () => {
    cy.getEditor().then((editor: Editor) => {
      // 清空文档并构造两页内容
      editor.command.executeSelectAll()
      editor.command.executeBackspace()
      editor.command.executeInsertElementList([{ value: '第一页' }])
      editor.command.executePageBreak()
      editor.command.executeInsertElementList([{ value: '横向页' }])

      // 光标位于第二页，设置当前节为横向
      editor.command.executePageDirection(<PaperDirection>'horizontal')

      const getPageList = () =>
        editor.command
          .getContainer()
          .querySelectorAll<HTMLCanvasElement>('canvas[data-index]')

      expect(getPageList().length).to.be.greaterThan(1)
      // 首页保持纵向
      expect(getPageList()[0].style.width).to.eq('794px')
      expect(getPageList()[0].style.height).to.eq('1123px')
      // 第二页横向（宽高互换）
      expect(getPageList()[1].style.width).to.eq('1123px')
      expect(getPageList()[1].style.height).to.eq('794px')

      // 方向标记随文档序列化
      const pageBreak = editor.command
        .getValue()
        .data.main.find(el => el.type === 'pageBreak')
      expect(pageBreak?.paperDirection).to.eq('horizontal')

      // 恢复全局纵向
      editor.command.executePageDirection(null)
      expect(getPageList()[1].style.width).to.eq('794px')
      expect(getPageList()[1].style.height).to.eq('1123px')
    })
  })

  it('通过界面菜单设置本节横向并恢复', () => {
    cy.getEditor().then((editor: Editor) => {
      // 清空文档并构造两页内容（光标留在第二页）
      editor.command.executeSelectAll()
      editor.command.executeBackspace()
      editor.command.executeInsertElementList([{ value: '第一页' }])
      editor.command.executePageBreak()
      editor.command.executeInsertElementList([{ value: '横向页' }])
    })

    // 底部菜单：纸张方向 -> 本节横向
    cy.get('.paper-direction').click()
    cy.get('.paper-direction li[data-section-direction="horizontal"]').click()

    cy.getEditor().then((editor: Editor) => {
      const pageList = editor.command
        .getContainer()
        .querySelectorAll<HTMLCanvasElement>('canvas[data-index]')
      expect(pageList.length).to.be.greaterThan(1)
      expect(pageList[1].style.width).to.eq('1123px')
      expect(pageList[1].style.height).to.eq('794px')
    })

    // 恢复：跟随全局
    cy.get('.paper-direction').click()
    cy.get('.paper-direction li[data-section-direction="inherit"]').click()

    cy.getEditor().then((editor: Editor) => {
      const pageList = editor.command
        .getContainer()
        .querySelectorAll<HTMLCanvasElement>('canvas[data-index]')
      expect(pageList[1].style.width).to.eq('794px')
      expect(pageList[1].style.height).to.eq('1123px')
    })
  })
})
