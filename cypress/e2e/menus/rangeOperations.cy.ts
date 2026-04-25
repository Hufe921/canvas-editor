import Editor from '../../../src/editor'

describe('菜单-选区操作', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'

  it('getRange-获取选区信息', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      // 设置选区
      editor.command.executeSetRange(0, 6)

      const range = editor.command.getRange()

      expect(range).to.have.property('startIndex')

      expect(range).to.have.property('endIndex')

      expect(range.startIndex).to.eq(0)

      expect(range.endIndex).to.eq(6)
    })
  })

  it('getRange-全文选区', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      // 全选
      editor.command.executeSelectAll()

      const range = editor.command.getRange()

      expect(range.startIndex).to.eq(0)

      expect(range.endIndex).to.eq(text.length)
    })
  })

  it('setRange-折叠选区(光标)', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      // 折叠选区
      editor.command.executeSetRange(5, 5)

      const range = editor.command.getRange()

      expect(range.startIndex).to.eq(5)

      expect(range.endIndex).to.eq(5)
    })
  })

  it('getRangeRow-获取选区所在行', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: 'line1'
        },
        {
          value: '\n'
        },
        {
          value: 'line2'
        }
      ])

      // 选中文本
      editor.command.executeSetRange(6, 11)

      const rangeRow = editor.command.getRangeRow()

      // getRangeRow 返回 IElement[] 或 null
      expect(rangeRow).to.not.eq(null)

      expect(Array.isArray(rangeRow)).to.eq(true)

      // 包含line2
      const values = (rangeRow as any[]).map(r => r.value).filter(Boolean)
      expect(values.join('')).to.include('line2')
    })
  })

  it('getRangeParagraph-获取选区所在段落', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, text.length)

      const paragraph = editor.command.getRangeParagraph()

      // getRangeParagraph 返回 IElement[] 或 null
      expect(paragraph).to.not.eq(null)

      expect(Array.isArray(paragraph)).to.eq(true)
    })
  })
})
