import Editor from '../../../src/editor'

describe('菜单-文本处理', () => {

  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'
  const textLength = text.length

  it('字体', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.listener.saved = function (payload) {
        const data = payload.data

        expect(data[0].font).to.eq('宋体')
      }

      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([{
        value: text
      }])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__font').as('font').click()

      cy.get('@font').find('li').eq(1).click()

      cy.get('@canvas').type('{ctrl}s')
    })
  })

  it('字体增大', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.listener.saved = function (payload) {
        const data = payload.data

        expect(data[0].size).to.eq(18)
      }

      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([{
        value: text
      }])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__size-add').click()

      cy.get('@canvas').type('{ctrl}s')
    })
  })

  it('字体减小', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.listener.saved = function (payload) {
        const data = payload.data

        expect(data[0].size).to.eq(14)
      }

      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([{
        value: text
      }])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__size-minus').click()

      cy.get('@canvas').type('{ctrl}s')
    })
  })

  it('加粗', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.listener.saved = function (payload) {
        const data = payload.data

        expect(data[0].bold).to.eq(true)
      }

      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([{
        value: text
      }])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__bold').click()

      cy.get('@canvas').type('{ctrl}s')
    })
  })

  it('斜体', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.listener.saved = function (payload) {
        const data = payload.data

        expect(data[0].italic).to.eq(true)
      }

      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([{
        value: text
      }])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__italic').click()

      cy.get('@canvas').type('{ctrl}s')
    })
  })

  it('下划线', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.listener.saved = function (payload) {
        const data = payload.data

        expect(data[0].underline).to.eq(true)
      }

      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([{
        value: text
      }])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__underline').click()

      cy.get('@canvas').type('{ctrl}s')
    })
  })

  it('删除线', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.listener.saved = function (payload) {
        const data = payload.data

        expect(data[0].strikeout).to.eq(true)
      }

      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([{
        value: text
      }])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__strikeout').click()

      cy.get('@canvas').type('{ctrl}s')
    })
  })

  it('上标', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.listener.saved = function (payload) {
        const data = payload.data

        expect(data[0].type).to.eq('superscript')
      }

      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([{
        value: text
      }])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__superscript').click()

      cy.get('@canvas').type('{ctrl}s')
    })
  })

  it('下标', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.listener.saved = function (payload) {
        const data = payload.data

        expect(data[0].type).to.eq('subscript')
      }

      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([{
        value: text
      }])

      editor.command.executeSetRange(0, textLength)

      cy.get('.menu-item__subscript').click()

      cy.get('@canvas').type('{ctrl}s')
    })
  })

  it('字体颜色', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.listener.saved = function (payload) {
        const data = payload.data

        expect(data[0].color).to.eq('red')
      }

      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([{
        value: text
      }])

      editor.command.executeSetRange(0, textLength)

      editor.command.executeColor('red')

      cy.get('@canvas').type('{ctrl}s')
    })
  })

  it('高亮', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.listener.saved = function (payload) {
        const data = payload.data

        expect(data[0].highlight).to.eq('red')
      }

      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([{
        value: text
      }])

      editor.command.executeSetRange(0, textLength)

      editor.command.executeHighlight('red')

      cy.get('@canvas').type('{ctrl}s')
    })
  })

})
