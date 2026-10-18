for (const rtl of [false, true]) {
  for (const zoom of [false, true]) {
    it(`T16 draws chrome/captions/tiles and measures without Canvas text ${rtl}/${zoom}`, () => {
      cy.visit(
        `/canvas-editor/tests/fixtures/migration/native-auxiliary.html?${rtl ? 'rtl&' : ''}${zoom ? 'zoom' : ''}`
      )
      cy.get('#status', { timeout: 30000 }).should('have.text', 'ready')
      cy.window().then(async win => {
        const { draw, command, tiles } = (win as any).nativeAuxiliary
        const adapter = draw.getLayoutHostAdapter()
        const body = adapter.findLayoutByElementIndex(1).layout
        const table = draw
          .getOriginalMainElementList()
          .find((e: any) => e.type === 'table')
        const scope = 'td:' + table.trList[0].tdList[0].id
        const cell = adapter.findLayoutByElementIndex(1, scope).layout
        expect(
          command.computeElementListHeight(draw.getOriginalMainElementList())
        ).to.be.greaterThan(0)
        expect(adapter.findLayoutByElementIndex(1).layout).to.eq(body)
        expect(adapter.findLayoutByElementIndex(1, scope).layout).to.eq(cell)
        expect(draw.getPageDirectionList()).to.include('horizontal')
        expect(
          tiles.some((tile: any) =>
            tile.matrix?.every((v: number) => v === 0.5)
          )
        ).to.eq(true)
        const options = draw.getOptions()
        const layout = adapter.layoutPlainText({
          text: options.watermark.data,
          fontFamily: 'Arabic',
          fontSize: 20 * options.scale,
          color: '#000'
        })
        const line = layout.lines[0]
        const expected = Math.ceil(
          (Math.hypot(line.width, line.height) + 24 * options.scale) * 2
        )
        expect(
          tiles.some(
            (tile: any) => tile.width === expected && tile.matrix?.[0] === 0.5
          )
        ).to.eq(true)
        draw.getPosition().setPositionContext({
          isTable: true,
          index: draw.getOriginalMainElementList().indexOf(table),
          trIndex: 0,
          tdIndex: 0,
          tdId: table.trList[0].tdList[0].id,
          tableId: table.id
        })
        draw.getRange().setRange(0, 1)
        draw.getTableOperate().tableAutoFitToContent()
        expect(
          table.colgroup.every(
            (col: any) => Number.isFinite(col.width) && col.width > 0
          )
        ).to.eq(true)
        const pages = await draw.getDataURL({ mode: 'print', pixelRatio: 2 })
        expect(pages.length).to.eq(draw.getPageCount())
        expect(
          pages.every((page: string) => page.startsWith('data:image/png'))
        ).to.eq(true)
      })
      cy.screenshot(`t16-${rtl ? 'rtl' : 'ltr'}-${zoom ? 'zoom' : 'normal'}`)
    })
  }
  it(`T16 keeps placeholder separate from the empty body ${rtl}`, () => {
    cy.visit(
      `/canvas-editor/tests/fixtures/migration/native-auxiliary.html?empty&${rtl ? 'rtl' : ''}`
    )
    cy.get('#status', { timeout: 30000 }).should('have.text', 'ready')
    cy.window().then(win => {
      const { draw } = (win as any).nativeAuxiliary
      const adapter = draw.getLayoutHostAdapter()
      expect(
        adapter.findLayoutByElementIndex(0).layout.paragraphText
      ).not.to.contain('Placeholder')
      expect(
        adapter.findLayoutByElementIndex(1, 'placeholder').layout.paragraphText
      ).to.contain('Placeholder')
      expect(draw.getOriginalMainElementList().length).to.eq(1)
    })
  })
}
