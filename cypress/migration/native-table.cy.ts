for (const direction of ['ltr', 'rtl']) {
  describe(`T12 native nested table: ${direction}`, () => {
    beforeEach(() => {
      cy.visit(
        `/canvas-editor/tests/fixtures/migration/native-table.html?direction=${direction}`
      )
      cy.get('#status', { timeout: 20000 }).should('have.text', 'ready')
    })

    it('keeps borders and nested text inside the aligned cell', () => {
      cy.window().then(win => {
        const { draw, outer, nested } = (win as any).nativeTable
        expect(nested.width).to.be.closeTo(184, 0.001)
        const td = outer.trList[0].tdList[0]
        const nestedIndex = td.value.indexOf(nested)
        const nestedPosition = td.positionList[nestedIndex]
        const nestedCell = nested.trList[0].tdList[0]
        const text = nestedCell.positionList.find(
          (p: any) => p.value !== '\u200B'
        )
        expect(text.coordinate.leftTop[1]).to.be.closeTo(
          nestedPosition.coordinate.leftTop[1] + nestedCell.y + 4,
          0.001
        )
        const canvas = draw.getPage()
        const pixels = canvas
          .getContext('2d')
          .getImageData(0, 0, canvas.width, canvas.height).data
        let red = 0,
          blue = 0
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i] > 200 && pixels[i + 1] < 50 && pixels[i + 2] < 50) red++
          if (pixels[i + 2] > 200 && pixels[i] < 50 && pixels[i + 1] < 50)
            blue++
        }
        expect(red, 'nested red border ink').to.be.greaterThan(30)
        expect(blue, 'outer blue border ink').to.be.greaterThan(30)
      })
    })

    it('drags the logical first column in the correct direction', () => {
      const dx = direction === 'rtl' ? -12 : 12
      cy.get('.ce-table-tool__col__item .ce-table-tool__anchor')
        .first()
        .then($anchor => {
          const rect = $anchor[0].getBoundingClientRect()
          cy.wrap($anchor).trigger('mousedown', {
            eventConstructor: 'MouseEvent',
            clientX: rect.x + 2,
            clientY: rect.y + 2,
            button: 0,
            force: true
          })
          cy.document().trigger('mousemove', {
            eventConstructor: 'MouseEvent',
            clientX: rect.x + 2 + dx,
            clientY: rect.y + 2,
            force: true
          })
          cy.document().trigger('mouseup', {
            eventConstructor: 'MouseEvent',
            clientX: rect.x + 2 + dx,
            clientY: rect.y + 2,
            force: true
          })
        })
      cy.window().then(win => {
        const { nested, draw } = (win as any).nativeTable
        expect(nested.colgroup[0].width).to.be.closeTo(104, 0.001)
        expect(nested.colgroup[1].width).to.be.closeTo(80, 0.001)
        expect(nested.width).to.be.closeTo(184, 0.001)
        draw.getTableOperate().tableAutoFitToPage()
        expect(nested.width).to.be.closeTo(184, 0.001)
      })
    })
  })
}
