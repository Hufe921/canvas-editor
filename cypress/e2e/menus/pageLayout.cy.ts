import Editor, { PaperDirection, PageMode } from '../../../src/editor'

describe('菜单-页面布局', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  it('设置纸张方向-横向', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executePaperDirection(<PaperDirection>'landscape')

      // 验证无异常
      const options = editor.command.getOptions()
      expect(options).to.be.an('object')
    })
  })

  it('设置纸张方向-纵向', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executePaperDirection(<PaperDirection>'portrait')

      // 验证无异常
      const options = editor.command.getOptions()
      expect(options).to.be.an('object')
    })
  })

  it('设置纸张大小', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executePaperSize(148, 210) // A5

      // 验证无异常
      const options = editor.command.getOptions()
      expect(options).to.be.an('object')
    })
  })

  it('获取页边距', () => {
    cy.getEditor().then((editor: Editor) => {
      const margin = editor.command.getPaperMargin()

      expect(margin).to.be.an('array')

      expect(margin.length).to.eq(4)
    })
  })

  it('设置页边距', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSetPaperMargin([50, 50, 50, 50])

      const margin = editor.command.getPaperMargin()

      expect(margin).to.deep.eq([50, 50, 50, 50])
    })
  })

  it('页面模式切换', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executePageMode(<PageMode>'PAGING')

      // 验证无异常
      const options = editor.command.getOptions()

      expect(options).to.be.an('object')
    })
  })

  it('页面缩放-通过API', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executePageScaleAdd()

      editor.command.executePageScaleMinus()

      // 验证无异常
      const options = editor.command.getOptions()

      expect(options).to.be.an('object')
    })
  })
})
