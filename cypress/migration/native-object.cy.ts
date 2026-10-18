describe('T13 native objects', () => {
  beforeEach(() => {
    cy.visit('/canvas-editor/tests/fixtures/migration/native-object.html')
    cy.get('#status', { timeout: 20000 }).should('have.text', 'ready')
  })
  it('paints inline media and caption in their reserved boxes and preserves formula ink', () => {
    cy.window().then(win => {
      const { draw, image, formula } = (win as any).nativeObject
      const elements = draw.getOriginalMainElementList()
      const positions = draw.getPosition().getOriginalMainPositionList()
      const position = positions[elements.indexOf(image)]
      const row = draw
        .getLayoutRows()
        .find((r: any) => r.elementList.includes(image))
      expect(position.ascent + position.metrics.height).to.be.closeTo(
        row.ascent,
        0.001
      )
      const hit = draw.getPosition().getPositionByXY({
        x: position.coordinate.leftTop[0] + 10,
        y: position.coordinate.leftTop[1] + position.ascent + 10,
        pageNo: position.pageNo
      })
      expect(hit.index).to.eq(elements.indexOf(image))
      const canvas = draw.getPage()
      const ctx = canvas.getContext('2d')!
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let red = 0,
        blue = 0
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] > 200 && pixels[i + 1] < 50 && pixels[i + 2] < 50) red++
        if (pixels[i + 2] > 200 && pixels[i] < 50 && pixels[i + 1] < 50) blue++
      }
      expect(red).to.be.greaterThan(500)
      expect(blue).to.be.greaterThan(10)
      expect(formula.laTexSVG).to.match(/^data:image\/svg\+xml;base64,/)
      const fp = positions[elements.indexOf(formula)]
      const ratio = canvas.width / draw.getWidth()
      const area = ctx.getImageData(
        Math.round(fp.coordinate.leftTop[0] * ratio),
        Math.round((fp.coordinate.leftTop[1] + fp.ascent) * ratio),
        Math.round(formula.width * 1.5 * ratio),
        Math.round(formula.height * 1.5 * ratio)
      ).data
      let ink = 0
      for (let i = 0; i < area.length; i += 4)
        if (area[i] < 80 && area[i + 1] < 80 && area[i + 2] < 80 && area[i + 3])
          ink++
      expect(ink, 'formula SVG ink').to.be.greaterThan(5)
    })
  })
  it('selects and resizes an inline image using source positions', () => {
    cy.window().then(win => (win as any).nativeObject.select())
    cy.get('.ce-resizer-selection .handle-3')
      .first()
      .then($handle => {
        const rect = $handle[0].getBoundingClientRect()
        cy.wrap($handle).trigger('mousedown', {
          eventConstructor: 'MouseEvent',
          clientX: rect.x + 2,
          clientY: rect.y + 2,
          force: true
        })
        cy.document().trigger('mousemove', {
          eventConstructor: 'MouseEvent',
          clientX: rect.x + 17,
          clientY: rect.y + 2,
          force: true
        })
        cy.document().trigger('mouseup', {
          eventConstructor: 'MouseEvent',
          clientX: rect.x + 17,
          clientY: rect.y + 2,
          force: true
        })
      })
    cy.window().then(win => {
      const { image } = (win as any).nativeObject
      expect(image.width).to.be.closeTo(130, 0.001)
      expect(image.height).to.eq(60)
    })
  })
  it('resizes a nested Block from the rendered width and removes hidden DOM', () => {
    cy.get('.ce-block-item').trigger('mouseenter')
    cy.get('.ce-block-item .handle-3').then($handle => {
      const rect = $handle[0].getBoundingClientRect()
      cy.wrap($handle).trigger('mousedown', {
        eventConstructor: 'MouseEvent',
        clientX: rect.x + 2,
        clientY: rect.y + 2,
        force: true
      })
      cy.document().trigger('mousemove', {
        eventConstructor: 'MouseEvent',
        clientX: rect.x - 28,
        clientY: rect.y + 2,
        force: true
      })
      cy.document().trigger('mouseup', {
        eventConstructor: 'MouseEvent',
        clientX: rect.x - 28,
        clientY: rect.y + 2,
        force: true
      })
    })
    cy.window().then(win => {
      const { draw, block } = (win as any).nativeObject
      expect(block.width).to.be.closeTo(150, 0.001)
      block.hide = true
      draw.render({ isLazy: false, isSetCursor: false })
      expect(draw.getContainer().querySelectorAll('iframe').length).to.eq(0)
      block.hide = false
      draw.render({ isLazy: false, isSetCursor: false })
      expect(draw.getContainer().querySelectorAll('iframe').length).to.eq(1)
    })
  })
  it('prints the nested iframe at the measured size', () => {
    cy.window().then(async win => {
      const { draw, block, table } = (win as any).nativeObject
      let count = 0
      const color =
        'data:image/svg+xml,' +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><rect width="20" height="10" fill="#8800ff"/></svg>'
        )
      const pages = await draw.getDataURL({
        mode: 'print',
        snapDomFunction: async (iframe: HTMLIFrameElement) => {
          count++
          expect(iframe.getAttribute('data-id')).to.eq(block.id)
          expect(parseFloat(iframe.parentElement!.style.width)).to.be.closeTo(
            table.trList[0].tdList[0].positionList[
              table.trList[0].tdList[0].value.indexOf(block)
            ].metrics.width,
            0.001
          )
          return color
        }
      })
      expect(count).to.eq(1)
      const png = new win.Image()
      png.src = pages[0]
      await png.decode()
      const canvas = win.document.createElement('canvas')
      canvas.width = png.width
      canvas.height = png.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(png, 0, 0)
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      let purple = 0
      for (let i = 0; i < pixels.length; i += 4)
        if (
          pixels[i] > 100 &&
          pixels[i] < 160 &&
          pixels[i + 1] < 30 &&
          pixels[i + 2] > 220
        )
          purple++
      expect(purple, 'iframe snapshot ink').to.be.greaterThan(100)
    })
  })
})
