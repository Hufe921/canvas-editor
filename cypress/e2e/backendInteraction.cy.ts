import type Editor from '../../src/editor'

function clearAndInsert(editor: Editor, value = 'pointer-target') {
  editor.command.executeSelectAll()
  editor.command.executeBackspace()
  editor.command.executeInsertElementList([{ value }])
}

describe('双后端真实交互回归', () => {
  beforeEach(() => {
    cy.visitEditor()
    cy.getEditorPage().should('have.length', 1)
  })

  it('根节点和真实 SVG 子节点均支持 pointer 命中、cursor 和输入', () => {
    cy.getEditor().then((editor: Editor) => clearAndInsert(editor))
    cy.getEditorPage().click(140, 300)
    cy.get('.ce-cursor').should('have.css', 'display', 'block')

    cy.getEditorPage()
      .should($page => {
        if ($page[0].tagName.toLowerCase() === 'svg') {
          const text = Array.from($page[0].querySelectorAll('text')).find(
            node => node.textContent?.includes('pointer-target')
          )
          expect(text, '目标文本节点').not.to.eq(undefined)
        }
      })
      .then($page => {
        const page = $page[0]
        if (page.tagName.toLowerCase() === 'svg') {
          const text = Array.from(page.querySelectorAll('text')).find(node =>
            node.textContent?.includes('pointer-target')
          )
          cy.wrap(text!).click({ force: true })
        } else {
          cy.wrap(page).click(150, 120)
        }
      })
    cy.get('.ce-cursor').should('have.css', 'display', 'block')
    cy.getEditorPage().type('X')
    cy.getEditor().then((editor: Editor) => {
      expect(editor.command.getText().main).to.include('X')
      expect(editor.command.getRange()).not.to.eq(null)
    })
  })

  it('ZoneTip 根据真实页面坐标显示页眉提示', () => {
    cy.getEditorPage().then($page => {
      const page = $page[0]
      const rect = page.getBoundingClientRect()
      const pageContainer = page.parentElement!
      const MouseEventConstructor = page.ownerDocument.defaultView!.MouseEvent
      pageContainer.dispatchEvent(new MouseEventConstructor('mouseenter'))
      page.dispatchEvent(
        new MouseEventConstructor('mousemove', {
          clientX: rect.left + 120,
          clientY: rect.top + 20,
          bubbles: true
        })
      )
    })
    cy.get('.ce-zone-tip', { timeout: 2000 }).should('have.class', 'show')
    cy.get('.ce-zone-tip span').should('not.be.empty')
  })

  it('iframe HTML overlay 保持在页面外且尺寸和文档内容正确', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()
      editor.command.executeBackspace()
      editor.command.executeInsertElementList([
        {
          type: 'block',
          value: '',
          width: 320,
          height: 120,
          block: {
            type: 'iframe',
            iframeBlock: {
              srcdoc: '<p id="overlay-content">HTML overlay</p>'
            }
          }
        }
      ])
    })
    cy.get('.ce-block-container .ce-block-item iframe')
      .should('be.visible')
      .and($iframe => {
        const iframe = $iframe[0] as HTMLIFrameElement
        expect(iframe.getBoundingClientRect().width).to.eq(320)
        expect(iframe.getBoundingClientRect().height).to.eq(120)
        expect(iframe.closest('svg')).to.eq(null)
        expect(
          iframe.contentDocument?.querySelector('#overlay-content')?.textContent
        ).to.eq('HTML overlay')
      })
  })

  it('懒页滚动到真实末页后完成渲染并可命中', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()
      editor.command.executeBackspace()
      for (let page = 1; page <= 4; page++) {
        editor.command.executeInsertElementList([{ value: `第${page}页` }])
        if (page < 4) editor.command.executePageBreak()
      }
    })
    cy.getEditorPages().should('have.length', 4)
    cy.getEditorPage(3).scrollIntoView()
    cy.wait(400)
    cy.getEditorPage(3)
      .should($page => {
        expect($page[0].getBoundingClientRect().height).to.be.greaterThan(700)
        if ($page[0].tagName.toLowerCase() === 'svg') {
          expect($page[0].textContent).to.include('第4页')
        } else {
          expect(($page[0] as HTMLCanvasElement).toDataURL().length).to.be
            .greaterThan(10000)
        }
      })
      .click(150, 120)
    cy.get('.ce-cursor').should('have.css', 'display', 'block')
  })

  it('混合横竖页面保留各自几何和第二页 pointer', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()
      editor.command.executeBackspace()
      editor.command.executeInsertElementList([{ value: '纵向页' }])
      editor.command.executePageBreak()
      editor.command.executeInsertElementList([{ value: '横向页' }])
      editor.command.executePageDirection('horizontal')
    })
    cy.getEditorPages().should('have.length', 2)
    cy.getEditorPage(0).should('have.css', 'width', '794px')
    cy.getEditorPage(1)
      .should('have.css', 'width', '1123px')
      .and('have.css', 'height', '794px')
      .scrollIntoView()
    cy.getEditorPage(1)
      .should($page => {
        if ($page[0].tagName.toLowerCase() === 'svg') {
          expect($page[0].textContent).to.include('横向页')
        }
      })
      .click(150, 120)
    cy.get('.ce-cursor').should('have.css', 'display', 'block')
  })

  it('SVG 双击水印不产生浏览器原生选区且保留编辑器扩选', () => {
    cy.visit('http://localhost:3000/canvas-editor/?backend=svg')
    cy.getEditor().then((editor: Editor) => {
      clearAndInsert(editor)
      editor.command.executeAddWatermark({
        data: 'WATERMARK',
        repeat: false
      })
    })
    cy.get('.ce-page-container > svg[data-index="0"] text')
      .filter((_, text) => text.textContent === 'WATERMARK')
      .first()
      .dblclick({ force: true })
    cy.window().then(win => {
      expect(win.getSelection()?.toString()).to.eq('')
    })
    cy.get('.ce-page-container > svg[data-index="0"] text')
      .filter((_, text) => text.textContent?.includes('pointer-target'))
      .first()
      .dblclick({ force: true })
    cy.getEditor().then((editor: Editor) => {
      const range = editor.command.getRange()
      expect(range).not.to.eq(null)
      expect(range!.startIndex).not.to.eq(range!.endIndex)
    })
    cy.window().then(win => {
      expect(win.getSelection()?.toString()).to.eq('')
    })
  })

  it('底部图标可向上选择并切换渲染后端且保留文档', () => {
    cy.getEditor().then((editor: Editor) => {
      clearAndInsert(editor, 'backend-ui')
    })
    cy.get('.backend-switch + span .page-no-list').should('exist')
    cy.get('.backend-switch > i').click()
    cy.get('.backend-switch .options').should('have.class', 'visible')
    cy.get('.backend-switch [data-backend="canvas"]').click()
    cy.get('.ce-page-container > canvas').should('have.length.at.least', 1)
    cy.get('.ce-page-container > svg').should('not.exist')
    cy.get('.backend-switch [data-backend="canvas"]').should(
      'have.class',
      'active'
    )
    cy.get('.backend-switch > i').click()
    cy.get('.backend-switch [data-backend="svg"]').click()
    cy.get('.ce-page-container > svg').should('have.length.at.least', 1)
    cy.get('.ce-page-container > canvas').should('not.exist')
    cy.get('.backend-switch [data-backend="svg"]').should('have.class', 'active')
    cy.getEditor().then((editor: Editor) => {
      expect(editor.command.getText().main).to.include('backend-ui')
    })
  })
})
