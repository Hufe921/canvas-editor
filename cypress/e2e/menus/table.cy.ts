import Editor, { ElementType } from '../../../src/editor'

describe('菜单-表格', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  it('表格', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertTable(8, 8)

      const data = editor.command.getValue().data.main

      expect(data[0].type).to.eq('table')

      expect(data[0].trList?.length).to.eq(8)
    })
  })
})

describe('菜单-表格操作', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  it('插入表格-不同行列数', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertTable(3, 5)

      const data = editor.command.getValue().data.main[0] as any

      expect(data.type).to.eq(<ElementType>'table')

      expect(data.trList.length).to.eq(3)

      expect(data.trList[0].tdList.length).to.eq(5)
    })
  })

  it('插入表格-1x1', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertTable(1, 1)

      const data = editor.command.getValue().data.main[0] as any

      expect(data.type).to.eq(<ElementType>'table')

      expect(data.trList.length).to.eq(1)

      expect(data.trList[0].tdList.length).to.eq(1)
    })
  })

  it('插入表格-10x10', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertTable(10, 10)

      const data = editor.command.getValue().data.main[0] as any

      expect(data.type).to.eq(<ElementType>'table')

      expect(data.trList.length).to.eq(10)

      expect(data.trList[0].tdList.length).to.eq(10)
    })
  })

  it('表格带内容-通过元素列表', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: '\n',
          type: <ElementType>'table',
          trList: [
            {
              height: 42,
              tdList: [
                {
                  colspan: 1,
                  rowspan: 1,
                  value: [{ value: '单元格A' }]
                },
                {
                  colspan: 1,
                  rowspan: 1,
                  value: [{ value: '单元格B' }]
                }
              ]
            }
          ],
          colgroup: [
            { width: 200 },
            { width: 200 }
          ]
        }
      ])

      const data = editor.command.getValue().data.main[0] as any

      expect(data.type).to.eq(<ElementType>'table')

      expect(data.trList[0].tdList[0].value[0].value).to.eq('单元格A')

      expect(data.trList[0].tdList[1].value[0].value).to.eq('单元格B')
    })
  })

  it('插入多个表格', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertTable(2, 2)

      const data1 = editor.command.getValue().data.main
      expect(data1[0].type).to.eq(<ElementType>'table')

      editor.command.executeAppendElementList([
        {
          value: '\n'
        },
        {
          value: '\n',
          type: <ElementType>'table',
          trList: [
            {
              height: 42,
              tdList: [
                {
                  colspan: 1,
                  rowspan: 1,
                  value: []
                }
              ]
            }
          ],
          colgroup: [{ width: 200 }]
        }
      ])

      const data2 = editor.command.getValue().data.main
      const tables = data2.filter((d: any) => d.type === 'table')
      expect(tables.length).to.eq(2)
    })
  })

  it('表格列宽设置', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: '\n',
          type: <ElementType>'table',
          trList: [
            {
              height: 42,
              tdList: [
                {
                  colspan: 1,
                  rowspan: 1,
                  value: []
                },
                {
                  colspan: 1,
                  rowspan: 1,
                  value: []
                }
              ]
            }
          ],
          colgroup: [
            { width: 100 },
            { width: 300 }
          ]
        }
      ])

      const data = editor.command.getValue().data.main[0] as any

      expect(data.colgroup[0].width).to.eq(100)

      expect(data.colgroup[1].width).to.eq(300)
    })
  })

  it('表格行高设置', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: '\n',
          type: <ElementType>'table',
          trList: [
            {
              height: 60,
              tdList: [
                {
                  colspan: 1,
                  rowspan: 1,
                  value: []
                }
              ]
            },
            {
              height: 80,
              tdList: [
                {
                  colspan: 1,
                  rowspan: 1,
                  value: []
                }
              ]
            }
          ],
          colgroup: [{ width: 200 }]
        }
      ])

      const data = editor.command.getValue().data.main[0] as any

      expect(data.trList[0].height).to.be.greaterThan(0)

      expect(data.trList[1].height).to.be.greaterThan(0)
    })
  })

  it('表格全选-通过API', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertTable(2, 2)

      const data = editor.command.getValue().data.main
      expect(data[0].type).to.eq(<ElementType>'table')
    })
  })
})
