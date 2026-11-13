interface IOriginalTextCall {
  text: string
  x: number
  y: number
  font: string
  ascent: number
  page: string
}

function collectTextCalls(win: Window, output: IOriginalTextCall[]) {
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
}

describe('原版 Canvas 渲染回归', () => {
  it('导出重绘保留首页全部文本的内容、坐标、字体和字形度量', () => {
    cy.visit('http://localhost:3000/canvas-editor/?backend=canvas')
    cy.getEditor().then((editor: any) => {
      const win = editor.command.getContainer().ownerDocument.defaultView!
      const original: IOriginalTextCall[] = []
      collectTextCalls(win, original)
      const originalImage = editor.command.getImage()
      const originalPage = original.filter(call => call.page === '0')
      return originalImage.then(() => {
        const current: IOriginalTextCall[] = []
        collectTextCalls(win, current)
        const currentImage = editor.command.getImage()
        const currentPage = current.filter(call => call.page === '0')
        expect(currentPage.length).to.be.greaterThan(0)
        expect(originalPage).to.have.length(currentPage.length)
        currentPage.forEach((call, index) => {
          expect(call, `第 ${index} 条 ${call.text}`).to.deep.equal(
            originalPage[index]
          )
        })
        return currentImage
      })
    })
  })
})
