import Editor, { ElementType, TitleLevel } from '../../src/editor'

describe('基础功能', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'

  it('编辑保存', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      cy.get('@canvas')
        .type(text)
        .then(() => {
          const data = editor.command.getValue().data.main

          expect(data[0].value).to.eq(text)
        })
    })
  })

  it('模式切换', () => {
    cy.get('@canvas').click()

    cy.get('.ce-cursor').should('have.css', 'display', 'block')

    cy.get('.editor-mode').click().click()

    cy.get('.editor-mode').contains('只读')

    cy.get('@canvas').click()

    cy.get('.ce-cursor').should('have.css', 'display', 'none')
  })

  it('页面缩放', () => {
    cy.get('.page-scale-add').click()

    cy.get('.page-scale-percentage').contains('110%')

    cy.get('.page-scale-minus').click().click()

    cy.get('.page-scale-percentage').contains('90%')
  })

  it('字数统计', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: 'canvas-editor 2022 编辑器'
        }
      ])

      cy.get('.word-count').contains('5')
    })
  })

  it('编辑器模式-通过API', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeMode(<any>'readonly')

      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      const textResult = editor.command.getText()

      expect(textResult.main.length).to.be.greaterThan(0)
    })
  })

  it('获取目录', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: '标题1',
          type: <ElementType>'title',
          level: <TitleLevel>'first'
        },
        {
          value: '\n'
        },
        {
          value: '标题2',
          type: <ElementType>'title',
          level: <TitleLevel>'second'
        }
      ])

      const catalog = editor.command.getCatalog()

      expect(catalog).to.exist
    })
  })

  it('替换选区', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, 6)

      editor.command.executeReplaceRange({
        startIndex: 0,
        endIndex: 6
      })

      const data = editor.command.getValue().data.main
      expect(data).to.be.an('array')
    })
  })

  it('页面缩放恢复', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executePageScaleAdd()
      editor.command.executePageScaleAdd()

      editor.command.executePageScaleRecovery()

      const options = editor.command.getOptions()

      expect(options).to.be.an('object')
    })
  })

  it('获取纸张边距', () => {
    cy.getEditor().then((editor: Editor) => {
      const margin = editor.command.getPaperMargin()

      expect(margin).to.be.an('array')

      expect(margin.length).to.eq(4)
    })
  })

  it('获取剩余内容高度', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      const height = editor.command.getRemainingContentHeight()

      expect(height).to.be.a('number')
    })
  })

  it('获取编辑器配置', () => {
    cy.getEditor().then((editor: Editor) => {
      const options = editor.command.getOptions()

      expect(options).to.be.an('object')

      expect(options).to.have.property('width')
    })
  })

  it('获取容器', () => {
    cy.getEditor().then((editor: Editor) => {
      const container = editor.command.getContainer()

      expect(container).to.exist
    })
  })
})

describe('元素操作', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'

  it('插入元素列表', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: 'hello'
        },
        {
          value: '\n'
        },
        {
          value: 'world'
        }
      ])

      const textResult = editor.command.getText()

      expect(textResult.main).to.include('hello')

      expect(textResult.main).to.include('world')
    })
  })

  it('追加元素列表', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: 'hello'
        }
      ])

      editor.command.executeAppendElementList([
        {
          value: '\n'
        },
        {
          value: 'world'
        }
      ])

      const textResult = editor.command.getText()

      expect(textResult.main).to.include('hello')

      expect(textResult.main).to.include('world')
    })
  })

  it('通过ID更新元素', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text,
          id: 'test-element-id'
        }
      ])

      editor.command.executeUpdateElementById({
        id: 'test-element-id',
        properties: {
          bold: true,
          size: 24
        }
      })

      const data = editor.command.getValue().data.main

      expect(data[0].bold).to.eq(true)

      expect(data[0].size).to.eq(24)
    })
  })

  it('通过ID删除元素', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: 'keep'
        },
        {
          value: '\n'
        },
        {
          value: 'remove',
          id: 'delete-me'
        }
      ])

      editor.command.executeDeleteElementById({
        id: 'delete-me'
      })

      const textResult = editor.command.getText()

      expect(textResult.main).to.not.include('remove')

      expect(textResult.main).to.include('keep')
    })
  })

  it('设置编辑器值', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeSetValue({
        main: [
          {
            value: 'new content'
          },
          {
            value: '\n'
          },
          {
            value: 'second line'
          }
        ]
      })

      const textResult = editor.command.getText()

      expect(textResult.main).to.include('new content')

      expect(textResult.main).to.include('second line')
    })
  })
})

describe('值操作', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  const text = 'canvas-editor'

  it('getValue-获取编辑器数据', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      const value = editor.command.getValue()

      expect(value).to.have.property('data')

      expect(value.data).to.have.property('main')
    })
  })

  it('getText-获取纯文本', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        },
        {
          value: '\n'
        },
        {
          value: 'hello'
        }
      ])

      const textResult = editor.command.getText()

      expect(textResult.main).to.include(text)

      expect(textResult.main).to.include('hello')
    })
  })

  it('getWordCount-获取字数统计', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.getWordCount().then(count => {
        expect(count).to.be.a('number')
      })
    })
  })

  it('getHTML-获取HTML内容', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      const html = editor.command.getHTML()

      expect(html).to.be.an('object')

      expect(html).to.have.property('header')

      expect(html).to.have.property('main')

      expect(html).to.have.property('footer')
    })
  })

  it('getRangeText-获取选中文本', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(0, 6)

      const rangeText = editor.command.getRangeText()

      expect(rangeText).to.eq('canvas')
    })
  })

  it('getOptions-获取编辑器配置', () => {
    cy.getEditor().then((editor: Editor) => {
      const options = editor.command.getOptions()

      expect(options).to.be.an('object')
    })
  })

  it('getCursor-获取光标位置', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: text
        }
      ])

      editor.command.executeSetRange(3, 3)

      const position = editor.command.getCursorPosition()

      expect(position).to.be.an('object')
    })
  })
})
