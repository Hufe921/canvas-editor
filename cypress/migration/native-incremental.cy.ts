for (const rtl of [false, true]) {
  it(`T18 full/incremental differential in browser (${rtl ? 'RTL' : 'LTR'})`, () => {
    cy.visit(
      `/canvas-editor/tests/fixtures/migration/native-interaction.html?incremental&${rtl ? 'rtl' : ''}`
    )
    cy.get('#status', { timeout: 30000 }).should('have.text', 'ready')
    cy.window().then(win => {
      const { draw, lineCarets, mouse } = (win as any).nativeInteraction
      const render = () =>
        draw.render({
          isLazy: false,
          isSetCursor: false,
          isSubmitHistory: false
        })
      const snapshot = () =>
        JSON.stringify({
          rows: draw.getRawLayoutRows(),
          pages: draw.getLayoutPages(),
          positions: draw.getPosition().getOriginalMainPositionList(),
          native: draw.getPosition().getNativeLines()
        })
      const compare = () => {
        const cached = snapshot()
        draw.getOptions().lab.incrementalCompute = false
        render()
        expect(snapshot()).to.eq(cached)
        draw.getOptions().lab.incrementalCompute = true
        render()
        expect(snapshot()).to.eq(cached)
      }
      compare()
      for (const [start, count, value] of [
        [3, 0, 'abc'],
        [15, 1, '\u200B'],
        [15, 1, 'م'],
        [1, 0, 'á😀'],
        [4, 3, '']
      ] as const) {
        draw.spliceElementList(
          draw.getOriginalMainElementList(),
          start,
          count,
          Array.from(value).map(value => ({ value }))
        )
        render()
        compare()
      }
      const placed = draw
        .getPosition()
        .getNativeLines()
        .find((p: any) => p.pageNo > 0)
      expect(placed).not.to.eq(undefined)
      const stops = lineCarets(placed)
      const stop = stops[Math.floor(stops.length / 2)]
      mouse('mousedown', stop)
      mouse('mouseup', stop)
      const range = draw.getRange().getRange()
      const caret = draw.getPosition().getNativeCaret(range.startIndex)
      expect(caret.x).to.be.closeTo(stop.x, 0.01)
      expect(caret.pageNo).to.eq(stop.pageNo)
    })
  })
}
