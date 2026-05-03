import Editor, { RowFlex } from '../../../src/editor'

describe('菜单-清除格式', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'
  const textLength = text.length

  it('清除格式', () => {
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

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__format')
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].italic).to.eq(undefined)

          expect(data[0].bold).to.eq(undefined)
        })
    })
  })
})

describe('菜单-高级格式', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'

  it('两端对齐', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, text.length)

      editor.command.executeRowFlex(<RowFlex>'alignment')

      const data = editor.command.getValue().data.main

      expect(data[0].rowFlex).to.eq('alignment')
    })
  })

  it('分散对齐', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, text.length)

      editor.command.executeRowFlex(<RowFlex>'justify')

      const data = editor.command.getValue().data.main

      expect(data[0].rowFlex).to.eq('justify')
    })
  })

  it('通过API设置字体', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, text.length)

      editor.command.executeFont('Microsoft YaHei')

      const data = editor.command.getValue().data.main

      expect(data[0].font).to.eq('Microsoft YaHei')
    })
  })

  it('通过API设置字号', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, text.length)

      editor.command.executeSize(24)

      const data = editor.command.getValue().data.main

      expect(data[0].size).to.eq(24)
    })
  })

  it('通过API设置加粗', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, text.length)

      editor.command.executeBold()

      const data = editor.command.getValue().data.main

      expect(data[0].bold).to.eq(true)
    })
  })

  it('通过API设置斜体', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, text.length)

      editor.command.executeItalic()

      const data = editor.command.getValue().data.main

      expect(data[0].italic).to.eq(true)
    })
  })

  it('通过API设置行间距', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, text.length)

      editor.command.executeRowMargin(2.0)

      const data = editor.command.getValue().data.main

      expect(data[0].rowMargin).to.eq(2.0)
    })
  })

  it('清除格式-斜体加粗下划线', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text,
          bold: true,
          italic: true,
          underline: true,
          strikeout: true
        }
      ])

      editor.command.executeSetRange(0, text.length)

      editor.command.executeFormat()

      const data = editor.command.getValue().data.main

      expect(data[0].italic).to.eq(undefined)

      expect(data[0].bold).to.eq(undefined)

      expect(data[0].underline).to.eq(undefined)

      expect(data[0].strikeout).to.eq(undefined)
    })
  })

  it('上标切换-恢复', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, text.length)

      editor.command.executeSuperscript()

      const dataSup = editor.command.getValue().data.main
      expect(dataSup[0].type).to.eq('superscript')

      editor.command.executeSetRange(0, text.length)

      editor.command.executeSuperscript()

      const dataNormal = editor.command.getValue().data.main
      expect(dataNormal[0].type).to.eq('text')
    })
  })

  it('下标切换-恢复', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, text.length)

      editor.command.executeSubscript()

      const dataSub = editor.command.getValue().data.main
      expect(dataSub[0].type).to.eq('subscript')

      editor.command.executeSetRange(0, text.length)

      editor.command.executeSubscript()

      const dataNormal = editor.command.getValue().data.main
      expect(dataNormal[0].type).to.eq('text')
    })
  })
})
