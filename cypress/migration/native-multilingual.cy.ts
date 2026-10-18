describe('T22 multilingual weekend form', () => {
  let bunnyRequests = 0
  beforeEach(() => {
    bunnyRequests = 0
    cy.intercept('https://fonts.bunny.net/**', req => {
      bunnyRequests++
      req.reply({ statusCode: 500 })
    })
    cy.visit('/canvas-editor/tests/fixtures/migration/native-multilingual.html')
    cy.get('#status', { timeout: 30000 }).should('have.text', 'ready')
  })
  it('lays out real CJK/Latin/Arabic/Devanagari/Thai with controls and a table, prints emoji diagnostics', () => {
    cy.window().then(async win => {
      const editor = (win as any).nativeMultilingual.editor
      const report = editor.getFontCoverageReport()
      expect(report.issues.length).to.be.greaterThan(0)
      expect(report.issues.every(issue => issue.script === 'zsye')).to.eq(true)
      expect(
        report.issues.flatMap(issue => issue.missingCharacters)
      ).to.include('😀')
      expect(editor.command.getText().main).to.contain(
        '周末野餐 office café مرحبا नमस्ते สวัสดี'
      )
      expect(editor.command.getControlList()).to.have.length(2)
      const pages = await editor.command.getImage({ mode: 'print' })
      expect(pages.length).to.be.greaterThan(0)
      expect(pages[0]).to.match(/^data:image\/png/)
      expect(bunnyRequests).to.eq(0)
    })
    cy.get('.ce-font-diagnostics').should('contain.text', '😀')
    cy.screenshot('native-multilingual-weekend')
  })
  it('deletes a whole emoji family cluster and restores it through undo/redo', () => {
    cy.window().then(win => {
      const editor = (win as any).nativeMultilingual.editor
      editor.command.executeSetValue({ main: [{ value: 'A👨‍👩‍👧B' }] })
      editor.command.executeSetRange(1, 2)
      expect(editor.command.getRangeText()).to.eq('👨‍👩‍👧')
      editor.command.executeBackspace()
      expect(editor.command.getText().main).to.eq('AB')
      editor.command.executeUndo()
      expect(editor.command.getText().main).to.eq('A👨‍👩‍👧B')
      editor.command.executeRedo()
      expect(editor.command.getText().main).to.eq('AB')
      expect(bunnyRequests).to.eq(0)
    })
  })
})
