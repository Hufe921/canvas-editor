import Editor, { ElementType } from '../../../src/editor'

describe('菜单-搜索', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const searchText = 'canvas-editor'
  const replaceText = 'replace'
  const type: ElementType = <ElementType>'table'

  it('搜索', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: searchText
        },
        {
          value: '\n',
          type,
          trList: [
            {
              height: 42,
              tdList: [
                {
                  colspan: 1,
                  rowspan: 1,
                  value: [
                    {
                      value: searchText
                    }
                  ]
                },
                {
                  colspan: 1,
                  rowspan: 1,
                  value: []
                }
              ]
            },
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
                  value: [
                    {
                      value: searchText
                    }
                  ]
                }
              ]
            }
          ],
          colgroup: [
            {
              width: 200
            },
            {
              width: 200
            }
          ]
        }
      ])

      cy.get('.menu-item__search').click()

      cy.get('.menu-item__search__collapse input').eq(0).type(searchText)

      // 搜索导航
      cy.get('.menu-item__search__collapse .arrow-right').click()
      cy.get('.menu-item__search__collapse__search .search-result').should(
        'have.text',
        '1/3'
      )

      cy.get('.menu-item__search__collapse__replace').as('replace')

      cy.get('@replace').find('input').type(replaceText)

      cy.get('@replace')
        .find('button')
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          // 普通文本
          expect(data[0].value).to.be.eq(replaceText)

          // 表格内文本
          expect(data[1].trList![0].tdList[0].value[0].value).to.be.eq(
            replaceText
          )
          expect(data[1].trList![1].tdList[1].value[0].value).to.be.eq(
            replaceText
          )
        })
    })
  })
})
