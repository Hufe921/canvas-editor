// External-network check is opt-in; it is not part of the deferred broad regression.
const suite = Cypress.env('BUNNY_LIVE') ? describe : describe.skip
suite('Bunny provider browser integration', () => {
  it('fetches cross-origin CSS/binary and reads real shaping tables and outlines', () => {
    cy.visit('/canvas-editor/tests/fixtures/fonts/bunny-smoke.html')
    cy.get('#run').click()
    cy.get('#result', { timeout: 120000 })
      .should('have.attr', 'data-status', 'passed')
      .invoke('text')
      .then(text => {
        const results = JSON.parse(text)
        expect(results).to.have.length(5)
        expect(
          results.find(result => result.script === 'hani').faceCount
        ).to.eq(2)
        expect(
          results
            .find(result => result.script === 'arab')
            .resources.some(resource => resource.sourceFormat === 'woff')
        ).to.eq(true)
        for (const result of results) {
          expect(result.covered).to.eq(true)
          expect(result.resources.length).to.be.greaterThan(0)
          for (const resource of result.resources) {
            expect(['woff', 'woff2']).to.include(resource.sourceFormat)
            expect(resource.bytes).to.be.greaterThan(0)
          }
        }
        cy.writeFile('cypress/results/bunny-font-provider.json', results)
      })
  })
  it('automatically resolves Arabic in the editor against real Bunny resources', () => {
    cy.visit('/canvas-editor/tests/fixtures/fonts/font-download-smoke.html')
    cy.window().should('have.property', 'fontSmoke')
    cy.window().then(win => (win as any).fontSmoke.create())
    cy.window({ timeout: 60000 }).should(win => {
      const editor = (win as any).fontSmoke.editors[0]
      expect(editor.getFontCoverageReport().autoDownloadFonts).to.eq(true)
      expect(editor.getFontCoverageReport().issues).to.deep.eq([])
      expect(editor.register.getFontFaces()[0].family).to.eq(
        'Noto Naskh Arabic'
      )
      expect(win.document.fonts.check('20px "Noto Naskh Arabic"')).to.eq(true)
    })
    cy.window().then(win => (win as any).fontSmoke.editors[0].destroy())
    cy.window().then(win =>
      (win as any).fontSmoke.create(undefined, true, true)
    )
    cy.window({ timeout: 60000 }).should(win => {
      const editor = (win as any).fontSmoke.editors[1]
      expect(editor.getFontCoverageReport().issues).to.deep.eq([])
      expect(
        editor.register
          .getFontFaces()
          .some(
            face => face.family === 'Noto Naskh Arabic' && face.weight === 700
          )
      ).to.eq(true)
      expect(win.document.fonts.check('700 20px "Noto Naskh Arabic"')).to.eq(
        true
      )
    })
    cy.window().then(win => (win as any).fontSmoke.editors[1].destroy())
  })
})
