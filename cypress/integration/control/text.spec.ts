import Editor, { ControlType, ElementType } from '../../../src/editor'

describe('控件-文本型', () => {

  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = `canvas-editor`
  const elementType: ElementType = <ElementType>'control'
  const controlType: ControlType = <ControlType>'text'

  it('文本型', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.listener.saved = function (payload) {
        const data = payload.data[0]

        expect(data.control!.value![0].value).to.be.eq(text)
      }

      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([{
        type: elementType,
        value: '',
        control: {
          type: controlType,
          value: null,
          placeholder: '文本型'
        }
      }])

      cy.get('@canvas').type(`{leftArrow}`)

      cy.get('.ce-inputarea').type(text)

      cy.get('@canvas').type('{ctrl}s')
    })
  })

})
