import Editor, { ElementType, TitleLevel } from '../../../src/editor'

describe('菜单-标题', () => {
  const url = 'http://localhost:3000/canvas-editor/'

  beforeEach(() => {
    cy.visit(url)

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'
  const elementType = <ElementType>'title'
  const level = <TitleLevel>'first'

  it('标题', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      cy.get('.menu-item__title').as('title').click()

      cy.get('@title')
        .find('li')
        .eq(1)
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].type).to.eq(elementType)

          expect(data[0].level).to.eq(level)
        })
    })
  })
})

describe('菜单-标题级别', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'
  const levels: { label: string; level: TitleLevel; menuIndex: number }[] = [
    { label: '一级标题', level: <TitleLevel>'first', menuIndex: 1 },
    { label: '二级标题', level: <TitleLevel>'second', menuIndex: 2 },
    { label: '三级标题', level: <TitleLevel>'third', menuIndex: 3 },
    { label: '四级标题', level: <TitleLevel>'fourth', menuIndex: 4 },
    { label: '五级标题', level: <TitleLevel>'fifth', menuIndex: 5 },
    { label: '六级标题', level: <TitleLevel>'sixth', menuIndex: 6 }
  ]

  levels.forEach(({ label, level, menuIndex }) => {
    it(label, () => {
      cy.getEditor().then((editor: Editor) => {
        editor.command.executeSelectAll()

        editor.command.executeBackspace()

        editor.command.executeInsertElementList([
          {
            value: text
          }
        ])

        cy.get('.menu-item__title').as('title').click()

        cy.get('@title')
          .find('li')
          .eq(menuIndex)
          .click()
          .then(() => {
            const data = editor.command.getValue().data.main

            expect(data[0].type).to.eq(<ElementType>'title')

            expect(data[0].level).to.eq(level)
          })
      })
    })
  })

  it('取消标题', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      cy.get('.menu-item__title').as('title').click()

      cy.get('@title')
        .find('li')
        .eq(1)
        .click()

      cy.get('@title').click()

      cy.get('@title')
        .find('li')
        .eq(0)
        .click()
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].type).to.eq(undefined)
        })
    })
  })

  it('通过API设置标题', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, text.length)

      editor.command.executeTitle(<TitleLevel>'second')

      const data = editor.command.getValue().data.main

      expect(data[0].type).to.eq(<ElementType>'title')

      expect(data[0].level).to.eq(<TitleLevel>'second')
    })
  })
})
