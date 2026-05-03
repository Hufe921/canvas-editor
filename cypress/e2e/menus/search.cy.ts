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

describe('菜单-搜索-高级', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const searchText = 'test'

  it('搜索-普通文本多处匹配', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: `${searchText} hello ${searchText} world ${searchText}`
        }
      ])

      cy.get('.menu-item__search').click()

      cy.get('.menu-item__search__collapse input').eq(0).type(searchText)

      cy.get('.menu-item__search__collapse__search .search-result').should(
        'exist'
      )
    })
  })

  it('搜索-无匹配结果', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: 'no match here'
        }
      ])

      cy.get('.menu-item__search').click()

      cy.get('.menu-item__search__collapse input').eq(0).type(searchText)

      cy.get('.menu-item__search__collapse').should('be.visible')
    })
  })

  it('搜索导航-UI交互', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: `${searchText} hello ${searchText} world ${searchText}`
        }
      ])

      cy.get('.menu-item__search').click()

      cy.get('.menu-item__search__collapse input').eq(0).type(searchText)

      cy.get('.menu-item__search__collapse .arrow-right').should('be.visible')

      cy.get('.menu-item__search__collapse .arrow-left').should('be.visible')

      cy.get('.menu-item__search__collapse .arrow-right').click()

      cy.get('.menu-item__search__collapse__search .search-result').should(
        'exist'
      )
    })
  })

  it('通过API搜索', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: `${searchText} hello ${searchText} world`
        }
      ])

      editor.command.executeSearch(searchText)

      const info = editor.command.getSearchNavigateInfo()

      expect(info).to.exist
    })
  })

  it('通过API搜索导航', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: `${searchText} hello ${searchText} world`
        }
      ])

      editor.command.executeSearch(searchText)

      editor.command.executeSearchNavigateNext()

      editor.command.executeSearchNavigatePre()

      const info = editor.command.getSearchNavigateInfo()

      expect(info).to.exist
    })
  })

  it('搜索-验证UI可见', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: searchText
        }
      ])

      cy.get('.menu-item__search').click()

      cy.get('.menu-item__search__collapse').should('be.visible')

      cy.get('.menu-item__search__collapse input').should(
        'have.length.at.least',
        1
      )
    })
  })

  it('搜索-导航按钮存在', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: searchText
        }
      ])

      cy.get('.menu-item__search').click()

      cy.get('.menu-item__search__collapse__replace').should('be.visible')

      cy.get('.menu-item__search__collapse__replace input').should('be.visible')

      cy.get('.menu-item__search__collapse__replace button').should(
        'have.length.at.least',
        1
      )
    })
  })
})
