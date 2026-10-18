describe('HarfBuzz outline rendering', () => {
  it('matches the actual font glyph ink for every script and wrapped mixed colors', () => {
    cy.visit('/canvas-editor/tests/fixtures/fonts/glyph-renderer-smoke.html')
    cy.window().should('have.property', 'glyphReady')
    cy.window().then(async win => {
      const result = await (win as any).glyphReady
      expect(result.cases).to.have.length(6)
      for (const sample of result.cases) {
        expect(sample.paints, sample.family).to.eq(sample.expectedPaints)
        expect(sample.ink, sample.family).to.be.greaterThan(30)
        expect(sample.different / sample.ink, sample.family).to.be.lessThan(
          0.01
        )
        sample.actualBounds.forEach((value, i) =>
          expect(
            Math.abs(value - sample.expectedBounds[i]),
            sample.family
          ).to.be.at.most(1)
        )
        expect(sample.widths.every(width => width > 0)).to.eq(true)
      }
      expect(result.reason).to.eq('unsupportedGlyphFormat')
    })
    cy.get('.ce-font-diagnostics [role=status]')
      .should('contain.text', '支持的轮廓字体')
      .and('not.contain.text', '请安装')
  })
})
