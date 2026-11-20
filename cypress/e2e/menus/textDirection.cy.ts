import type Editor from '../../../src/editor'
import { RowFlex } from '../../../src/editor/dataset/enum/Row'
import { TextDirection } from '../../../src/editor/dataset/enum/TextDirection'

async function replaceWithCharacters(editor: Editor, text: string) {
  editor.command.executeSelectAll()
  editor.command.executeBackspace()
  editor.command.executeInsertElementList(
    Array.from(text).map(value => ({
      value,
      direction: TextDirection.RTL,
      font: 'Arial',
      size: 24
    }))
  )
  // 同步段落换行符方向，模拟通过工具栏设置整段 RTL
  editor.command.executeSelectAll()
  editor.command.executeDirection(TextDirection.RTL)
  await document.fonts.ready
  await new Promise<void>(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  )
}

function expectNoOverlap(editor: Editor, text: string) {
  const positions = Array.from(text).map((_, index) => {
    // 单字选区直接读取最终几何，避免 BiDi 光标 affinity 影响位置判断
    editor.command.executeSetRange(index, index + 1)
    const range = editor.command.getRangeContext()
    const rect = range?.rangeRects[0]
    expect(rect, `字符 ${index} 的位置`).not.to.eq(undefined)
    return {
      index,
      x: rect!.x,
      right: rect!.x + rect!.width,
      y: rect!.y
    }
  })
  // 以最终矩形纵坐标分行，避免跨行逻辑索引干扰物理重叠检测
  const rows = new Map<number, typeof positions>()
  positions.forEach(position => {
    const row = rows.get(position.y) || []
    row.push(position)
    rows.set(position.y, row)
  })
  rows.forEach(row => {
    row.sort((a, b) => a.x - b.x)
    for (let i = 1; i < row.length; i++) {
      expect(
        row[i].x,
        `逻辑字符 ${row[i - 1].index} 与 ${row[i].index} 不重叠`
      ).to.be.at.least(row[i - 1].right - 0.5)
    }
  })
  return positions
}

describe('菜单-文字方向', () => {
  beforeEach(() => {
    cy.visitEditor()
    cy.getEditorPage().should('have.length', 1)
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()
      editor.command.executeBackspace()
      editor.command.executeInsertElementList([{ value: '文字方向测试' }])
    })
  })

  it('通过底部菜单切换方向并回显当前项', () => {
    const directions = [TextDirection.RTL, TextDirection.LTR]

    directions.forEach(direction => {
      cy.get('.text-direction > i').click()
      cy.get('.text-direction .options').should('have.class', 'visible')
      cy.get(`[data-text-direction="${direction}"]`).click()
      cy.get('.text-direction .options').should('not.have.class', 'visible')
      cy.get(`[data-text-direction="${direction}"]`).should(
        'have.class',
        'active'
      )
      cy.get('.text-direction').should('have.attr', 'data-direction', direction)
      cy.getEditor().then((editor: Editor) => {
        expect(editor.command.getDirection()).to.eq(direction)
      })
    })
  })

  it('通过命令修改方向时同步菜单状态', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeDirection(TextDirection.RTL)
    })
    cy.get('[data-text-direction="rtl"]').should('have.class', 'active')

    cy.getEditor().then((editor: Editor) => {
      editor.command.executeDirection(TextDirection.LTR)
    })
    cy.get('[data-text-direction="ltr"]').should('have.class', 'active')
  })

  it('真实字体下阿语与英文数字括号混排不重叠，选区保持逻辑文本', () => {
    const text = 'abc مرحبا 123 (test)'
    cy.getEditor().then(async (editor: Editor) => {
      await replaceWithCharacters(editor, text)
      const positions = expectNoOverlap(editor, text)
      // 英文单词内部保持 LTR，阿语单词内部保持 RTL
      expect(positions[1].x).to.be.greaterThan(
        positions[0].x
      )
      expect(positions[5].x).to.be.lessThan(
        positions[4].x
      )
      editor.command.executeSetRange(0, text.length)
      expect(editor.command.getRangeText()).to.eq(text)
      if (Cypress.env('backend') === 'svg') {
        const svgText = Array.from(
          editor.command.getContainer().querySelectorAll('text')
        )
          .map(node => node.textContent)
          .join('')
        expect(svgText).to.include('مرحبا')
      }
    })
  })

  it('真实字体下无空格阿语换行和 Kashida 两端对齐不重叠', () => {
    const text = 'مرحبابالعالمهذاسطرعربيللاختبارمعنصأطولللفحص'.repeat(3)
    cy.getEditor().then(async (editor: Editor) => {
      await replaceWithCharacters(editor, text)
      editor.command.executeSetRange(0, text.length)
      editor.command.executeRowFlex(RowFlex.JUSTIFY)
      await new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
      const positions = expectNoOverlap(editor, text)
      expect(new Set(positions.map(position => position.y)).size).to.be.greaterThan(
        1
      )
      editor.command.executeSetRange(0, text.length)
      expect(editor.command.getRangeText()).to.eq(text)
    })
  })
})
