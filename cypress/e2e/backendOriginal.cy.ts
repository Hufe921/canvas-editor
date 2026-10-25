interface IOriginalTextCall {
  text: string
  x: number
  y: number
  font: string
  ascent: number
  page: string
}

function collectTextCalls(editor: any, output: IOriginalTextCall[]) {
  const win = editor.command.getContainer().ownerDocument.defaultView!
  const fillText = win.CanvasRenderingContext2D.prototype.fillText
  win.CanvasRenderingContext2D.prototype.fillText = function (
    this: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth?: number
  ) {
    output.push({
      text,
      x,
      y,
      font: this.font,
      ascent: this.measureText(text).actualBoundingBoxAscent || 0,
      page: this.canvas.getAttribute('data-index') || ''
    })
    return fillText.call(this, text, x, y, maxWidth)
  }
  return editor.command.getImage()
}

describe('原版 Canvas 渲染回归', () => {
  it('保留原版首页全部文本的内容、坐标、字体和字形度量', () => {
    const current: IOriginalTextCall[] = []
    cy.visit('http://localhost:3000/canvas-editor/?backend=canvas')
    cy.getEditor().then((editor: any) => collectTextCalls(editor, current))
    cy.readFile('cypress/fixtures/original-text.json').then(original => {
      const currentPage = current.filter(call => call.page === '0')
      expect(original).to.have.length(130)
      const finalPage = currentPage.slice(-original.length)
      expect(finalPage).to.have.length(original.length)
      finalPage.forEach((call, index) => {
        expect(call, `第 ${index} 条 ${call.text}`).to.deep.equal(
          original[index]
        )
      })
    })
  })
})
