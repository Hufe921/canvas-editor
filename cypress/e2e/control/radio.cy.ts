import Editor, { ControlType, ElementType } from '../../../src/editor'

describe('控件-单选框', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const elementType: ElementType = <ElementType>'control'
  const controlType: ControlType = <ControlType>'radio'

  it('单选框-插入', () => {
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
            valueSets: [
              {
                value: '选项A',
                code: 'radio_01'
              },
              {
                value: '选项B',
                code: 'radio_02'
              },
              {
                value: '选项C',
                code: 'radio_03'
              }
            ]
          }
        }
      ])

      const data = editor.command.getValue().data.main[0]

      expect(data.control!.type).to.eq('radio')

      expect(data.control!.valueSets!.length).to.eq(3)
    })
  })

  it('单选框-设置值', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      const controlId = 'test_radio'

      editor.command.executeInsertElementList([
        {
          type: elementType,
          value: '',
          controlId,
          control: {
            code: null,
            type: controlType,
            value: null,
            valueSets: [
              {
                value: '选项A',
                code: 'radio_01'
              },
              {
                value: '选项B',
                code: 'radio_02'
              }
            ]
          }
        }
      ])

      // 通过API设置控件值
      editor.command.executeSetControlValue({
        id: controlId,
        value: 'radio_02'
      })

      const data = editor.command.getValue().data.main[0]

      expect(data.control!.code).to.eq('radio_02')
    })
  })
})
