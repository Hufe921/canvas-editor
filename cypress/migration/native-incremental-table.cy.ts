it('T18 keeps cell scopes and split table pages equivalent after a cell edit', () => {
  cy.visit(
    '/canvas-editor/tests/fixtures/migration/native-interaction.html?tables&incremental'
  )
  cy.get('#status', { timeout: 30000 }).should('have.text', 'ready')
  cy.window().then(win => {
    const { draw } = (win as any).nativeInteraction
    const table = draw.getOriginalMainElementList().find((el: any) => el.trList)
    const cell = table.trList[1].tdList[0]
    draw.spliceElementList(cell.value, 2, 0, [{ value: 'á' }, { value: 'م' }])
    const render = () =>
      draw.render({
        isLazy: false,
        isSetCursor: false,
        isSubmitHistory: false
      })
    const snapshot = () =>
      JSON.stringify({
        rows: draw.getLayoutRowList(),
        pages: draw.getLayoutPages(),
        cells: table.trList.flatMap((tr: any) =>
          tr.tdList.map((td: any) => ({
            positions: td.positionList,
            native: draw.getPosition().getNativeLines(td.positionList)
          }))
        )
      })
    render()
    const incremental = snapshot()
    expect(draw.getLayoutPages().length).to.be.greaterThan(1)
    draw.getOptions().lab.incrementalCompute = false
    render()
    expect(snapshot()).to.eq(incremental)
    draw.getOptions().lab.incrementalCompute = true
    render()
    expect(snapshot()).to.eq(incremental)
  })
})
