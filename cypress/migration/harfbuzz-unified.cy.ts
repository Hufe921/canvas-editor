describe('unified HarfBuzz shaping in the browser', () => {
  it('uses actual HB metrics for every script, combining marks and mixed-color text', () => {
    cy.visit('/canvas-editor/tests/fixtures/fonts/harfbuzz-unified-smoke.html')
    cy.window().should('have.property', 'unifiedReady')
    cy.window().then(async win => {
      const result = await (win as any).unifiedReady
      expect(result.cases).to.have.length(6)
      for (const sample of result.cases) {
        expect(sample.actual, sample.script).to.deep.eq(sample.expected)
        expect(sample.actual.every(g => g[0] > 0)).to.eq(true)
      }
      expect(
        result.glyphs.every(g => !g.missing && g.font && g.glyphId > 0)
      ).to.eq(true)
      expect(new Set(result.glyphs.map(g => g.font.family)).size).to.eq(4)
      expect(result.glyphs.some(g => g.charEnd - g.charStart === 3)).to.eq(true)
      expect(result.width).to.be.greaterThan(100)
    })
  })
})
