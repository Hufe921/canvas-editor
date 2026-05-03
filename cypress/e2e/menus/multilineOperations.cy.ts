import Editor, { ElementType, RowFlex } from '../../../src/editor'

describe('菜单-多段落操作', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  it('多段落文本输入', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: '第一行'
        },
        {
          value: '\n'
        },
        {
          value: '第二行'
        },
        {
          value: '\n'
        },
        {
          value: '第三行'
        }
      ])

      const textResult = editor.command.getText()

      expect(textResult.main).to.include('第一行')

      expect(textResult.main).to.include('第二行')

      expect(textResult.main).to.include('第三行')
    })
  })

  it('多段落统一设置对齐', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: '第一行'
        },
        {
          value: '\n'
        },
        {
          value: '第二行'
        }
      ])

      // 全选
      editor.command.executeSelectAll()

      // 居中对齐
      editor.command.executeRowFlex(<RowFlex>'center')

      const data = editor.command.getValue().data.main

      // 验证文本元素的对齐方式（跳过换行符）
      const nonNewline = data.filter((d: any) => d.value !== '\n')
      expect(nonNewline.every((d: any) => d.rowFlex === 'center')).to.eq(true)
    })
  })

  it('多段落统一设置格式', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: '第一行'
        },
        {
          value: '\n'
        },
        {
          value: '第二行'
        }
      ])

      // 全选
      editor.command.executeSelectAll()

      // 加粗
      editor.command.executeBold()

      const data = editor.command.getValue().data.main

      // 验证文本元素的格式（跳过换行符）
      const nonNewline = data.filter((d: any) => d.value !== '\n')
      expect(nonNewline.every((d: any) => d.bold === true)).to.eq(true)
    })
  })

  it('多段落统一设置颜色', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: '第一行'
        },
        {
          value: '\n'
        },
        {
          value: '第二行'
        }
      ])

      // 全选
      editor.command.executeSelectAll()

      // 设置颜色
      editor.command.executeColor('#ff0000')

      const data = editor.command.getValue().data.main

      // 验证文本元素的颜色（跳过换行符）
      const nonNewline = data.filter((d: any) => d.value !== '\n')
      expect(nonNewline.every((d: any) => d.color === '#ff0000')).to.eq(true)
    })
  })

  it('分页符-多页文档', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      // 插入分页符创建多页
      editor.command.executeInsertElementList([
        {
          value: '',
          type: <ElementType>'pageBreak'
        }
      ])

      const data = editor.command.getValue().data.main

      expect(data[0].type).to.eq('pageBreak')
    })
  })

  it('分隔符', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()

      editor.command.executeBackspace()

      editor.command.executeInsertElementList([
        {
          value: '分隔线前'
        },
        {
          value: '\n'
        },
        {
          value: '- ',
          type: <ElementType>'separator'
        }
      ])

      const data = editor.command.getValue().data.main

      expect(data[1].type).to.eq('separator')
    })
  })
})
