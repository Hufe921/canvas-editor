import Editor, { RowFlex, TitleLevel } from '../../../src/editor'

describe('菜单-格式刷', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'
  const textLength = text.length
  const getTextElements = (data: any[], value: string): any[] => {
    const result: any[] = []
    data.forEach(element => {
      if (element.value === value) {
        result.push(element)
      }
      if (element.valueList) {
        result.push(...getTextElements(element.valueList, value))
      }
    })
    return result
  }
  const getLeafTextElements = (data: any[]): any[] => {
    const result: any[] = []
    data.forEach(element => {
      if (element.valueList) {
        result.push(...getLeafTextElements(element.valueList))
      } else if (element.value) {
        result.push(element)
      }
    })
    return result
  }

  it('格式刷', () => {
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

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__painter')
        .click()
        .wait(300)
        .then(() => {
          editor.command.executeSetRange(textLength, 2 * textLength)

          editor.command.executeApplyPainterStyle()

          const data = editor.command.getValue().data.main

          expect(data.length).to.eq(1)

          expect(data[0].italic).to.eq(true)

          expect(data[0].bold).to.eq(true)
        })
    })
  })

  it('完整选中目标段落时携带段落格式', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      const sourceText = 'source'
      const targetText = 'target'
      const targetStart = sourceText.length + 1
      const targetEnd = targetStart + targetText.length

      editor.command.executeInsertElementList([
        {
          value: sourceText
        },
        {
          value: '\n'
        },
        {
          value: targetText
        }
      ])

      editor.command.executeSetRange(0, sourceText.length)
      editor.command.executeTitle(<TitleLevel>'second')
      editor.command.executeRowFlex(<RowFlex>'center')
      editor.command.executeRowMargin(2)

      editor.command.executeSetRange(0, sourceText.length)
      editor.command.executePainter({
        isDblclick: false
      })

      editor.command.executeSetRange(targetStart, targetEnd)
      editor.command.executeApplyPainterStyle()

      const data = editor.command.getValue().data.main
      const targetElement = data[data.length - 1]
      const targetTextElement = getTextElements(data, targetText)[0]

      expect(targetElement.level).to.eq(<TitleLevel>'second')
      expect(targetTextElement.rowFlex).to.eq(<RowFlex>'center')
      expect(targetTextElement.rowMargin).to.eq(2)
    })
  })

  it('部分选中目标文本时不携带段落格式', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      const sourceText = 'source'
      const targetText = 'target'
      const targetStart = sourceText.length + 1

      editor.command.executeInsertElementList([
        {
          value: sourceText
        },
        {
          value: '\n'
        },
        {
          value: targetText
        }
      ])

      editor.command.executeSetRange(0, sourceText.length)
      editor.command.executeTitle(<TitleLevel>'second')
      editor.command.executeRowFlex(<RowFlex>'center')
      editor.command.executeRowMargin(2)

      editor.command.executeSetRange(0, sourceText.length)
      editor.command.executePainter({
        isDblclick: false
      })

      editor.command.executeSetRange(targetStart, targetStart + 3)
      editor.command.executeApplyPainterStyle()

      const data = editor.command.getValue().data.main
      const targetElements = getLeafTextElements(data).filter(
        d => d.value !== sourceText && d.value !== '\n'
      )

      expect(targetElements.some(d => d.bold)).to.eq(true)
      expect(targetElements.every(d => !d.level)).to.eq(true)
      expect(targetElements.every(d => !d.rowFlex)).to.eq(true)
      expect(targetElements.every(d => d.rowMargin === undefined)).to.eq(true)
    })
  })
})
