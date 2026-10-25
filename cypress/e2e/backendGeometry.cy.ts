interface ITextCall {
  text: string
  x: number
  y: number
  font: string
  baseline: string
  ascent?: number
  page?: string
}

describe('双后端页面与几何一致性', () => {
  it('页面具有相同悬浮阴影', () => {
    const shadows: string[] = []
    cy.visit('http://localhost:3000/canvas-editor/?backend=canvas')
    cy.get('.ce-page-container > canvas[data-index="0"]').then(page => {
      shadows.push(getComputedStyle(page[0]).boxShadow)
      cy.visit('http://localhost:3000/canvas-editor/?backend=svg')
      cy.get('.ce-page-container > svg[data-index="0"]').then(svgPage => {
        shadows.push(getComputedStyle(svgPage[0]).boxShadow)
        expect(shadows[0]).not.to.eq('none')
        expect(shadows[1]).to.eq(shadows[0])
      })
    })
  })

  it('页眉和正文的文本坐标、字体、基线与 Canvas 一致', () => {
    const canvasTextCalls: ITextCall[] = []
    const canvasPageSize: number[] = []
    cy.visit('http://localhost:3000/canvas-editor/?backend=canvas')
    cy.get('.ce-page-container > canvas[data-index="0"]').then(page => {
      canvasPageSize.push(
        parseFloat(page[0].style.width),
        parseFloat(page[0].style.height)
      )
    })
    cy.getEditor().then(async (editor: any) => {
      const win = editor.command.getContainer().ownerDocument.defaultView!
      const fillText = win.CanvasRenderingContext2D.prototype.fillText
      win.CanvasRenderingContext2D.prototype.fillText = function (
        this: CanvasRenderingContext2D,
        text: string,
        x: number,
        y: number,
        maxWidth?: number
      ) {
        canvasTextCalls.push({
          text,
          x,
          y,
          font: this.font,
          baseline: this.textBaseline,
          ascent: this.measureText(text).actualBoundingBoxAscent,
          page: this.canvas.getAttribute('data-index') || ''
        })
        return fillText.call(this, text, x, y, maxWidth)
      }
      await editor.command.getImage()
    })
    cy.wrap(null).then(() => {
      const pageTextCalls = canvasTextCalls
        .filter(call => call.page === '0')
        .map(({ text, x, y, font, baseline }) => ({
          text,
          x,
          y,
          font,
          baseline
        }))
      expect(
        pageTextCalls.length,
        JSON.stringify(canvasTextCalls.slice(0, 5))
      ).to.be.greaterThan(20)
      cy.visit('http://localhost:3000/canvas-editor/?backend=svg')
      cy.get('.ce-page-container > svg[data-index="0"]').should(page => {
        expect(page[0].querySelectorAll('text').length).to.be.greaterThan(20)
      })
      cy.get('.ce-page-container > svg[data-index="0"]').then(page => {
        const svgTextCalls: ITextCall[] = Array.from(
          page[0].querySelectorAll('text')
        ).map(text => ({
          text: text.textContent || '',
          x: Number(text.getAttribute('x')),
          y: Number(text.getAttribute('y')),
          font: text.style.font,
          baseline: text.getAttribute('dominant-baseline') || ''
        }))
        expect(svgTextCalls).to.deep.equal(pageTextCalls)
        expect(page[0].getAttribute('viewBox')).to.eq(
          `0 0 ${canvasPageSize[0]} ${canvasPageSize[1]}`
        )
      })
    })
  })

  it('页眉分隔线的路径和线宽与 Canvas 一致', () => {
    const canvasLines: {
      x: number
      y: number
      endX: number
      endY: number
      width: number
    }[] = []
    cy.visit('http://localhost:3000/canvas-editor/?backend=canvas')
    cy.getEditor()
      .then((editor: any) => {
        const win = editor.command.getContainer().ownerDocument.defaultView!
        const moveTo = win.CanvasRenderingContext2D.prototype.moveTo
        const lineTo = win.CanvasRenderingContext2D.prototype.lineTo
        const startPoints = new WeakMap<
          CanvasRenderingContext2D,
          { x: number; y: number }
        >()
        win.CanvasRenderingContext2D.prototype.moveTo = function (
          this: CanvasRenderingContext2D,
          x: number,
          y: number
        ) {
          startPoints.set(this, { x, y })
          return moveTo.call(this, x, y)
        }
        win.CanvasRenderingContext2D.prototype.lineTo = function (
          this: CanvasRenderingContext2D,
          x: number,
          y: number
        ) {
          const start = startPoints.get(this)
          if (this.canvas.getAttribute('data-index') === '0' && start) {
            canvasLines.push({
              x: start.x,
              y: start.y,
              endX: x,
              endY: y,
              width: this.lineWidth
            })
          }
          startPoints.set(this, { x, y })
          return lineTo.call(this, x, y)
        }
        const image = editor.command.getImage()
        const exportLines = canvasLines.slice()
        const { width, margins } = editor.command.getOptions()
        const canvasLine = exportLines.find(
          line =>
            line.x === margins[3] &&
            line.endX === width - margins[1] &&
            line.endY === line.y
        )
        return image.then(() => ({ canvasLine, exportLines }))
      })
      .then(({ canvasLine, exportLines }) => {
        expect(canvasLine, JSON.stringify(exportLines)).not.to.eq(undefined)
        cy.visit('http://localhost:3000/canvas-editor/?backend=svg')
        cy.get('.ce-page-container > svg[data-index="0"]').should(page => {
          expect(page[0].querySelectorAll('path').length).to.be.greaterThan(0)
        })
        cy.get('.ce-page-container > svg[data-index="0"]').then(page => {
          const line = canvasLine!
          const expectedPath = `M ${line.x} ${line.y} L ${line.endX} ${line.endY}`
          const path = Array.from(page[0].querySelectorAll('path')).find(
            item => item.getAttribute('d') === expectedPath
          )
          const actualPaths = Array.from(page[0].querySelectorAll('path')).map(
            item => item.getAttribute('d')
          )
          expect(
            path,
            `${expectedPath}: ${JSON.stringify(actualPaths)}`
          ).not.to.eq(undefined)
          expect(Number(path!.getAttribute('stroke-width'))).to.eq(line.width)
        })
      })
  })

})
