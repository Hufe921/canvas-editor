import Editor, { ControlType, ElementType } from '../../../src/editor'

describe('控件-列举型', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = `有`
  const elementType: ElementType = <ElementType>'control'
  const controlType: ControlType = <ControlType>'select'

  it('列举型', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          type: elementType,
          value: '',
          control: {
            type: controlType,
            value: null,
            placeholder: '列举型',
            valueSets: [
              {
                value: '有',
                code: '98175'
              },
              {
                value: '无',
                code: '98176'
              }
            ]
          }
        }
      ])

      cy.get('@canvas').type(`{leftArrow}`)

      cy.get('.ce-select-control-popup li')
        .eq(0)
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main[0]

          expect(data.control!.value![0].value).to.be.eq(text)

          expect(data.control!.code).to.be.eq('98175')
        })
    })
  })
})
