describe('automatic basic-font lifecycle in a real browser', () => {
  let css = ''
  let cssRequests = 0,
    fontRequests = 0
  const page = '/canvas-editor/tests/fixtures/fonts/font-download-smoke.html'
  function clearCache(win: Window) {
    return new Promise<void>((resolve, reject) => {
      const request = win.indexedDB.deleteDatabase(
        'canvas-editor-bunny-fonts-v1'
      )
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  before(() => {
    cy.readFile('tests/fixtures/fonts/bunny-basic.css').then(text => {
      css = text
    })
  })
  beforeEach(() => {
    cssRequests = fontRequests = 0
    cy.intercept('https://fonts.bunny.net/css*', req => {
      cssRequests++
      req.reply({
        body: css,
        headers: {
          'content-type': 'text/css',
          'access-control-allow-origin': '*',
          'cache-control': 'public, max-age=3600'
        }
      })
    })
    cy.intercept('https://fonts.bunny.net/noto-naskh-arabic/files/*', req => {
      fontRequests++
      req.reply({
        fixture: '../../public/fonts/NotoNaskhArabic-Regular.ttf,null',
        headers: {
          'content-type': 'font/ttf',
          'access-control-allow-origin': '*',
          'cache-control': 'public, max-age=3600'
        }
      })
    })
    cy.visit(page)
    cy.window().should('have.property', 'fontSmoke')
    cy.window().then(clearCache)
  })
  afterEach(() => {
    cy.window().then(async win => {
      ;(win as any).fontSmoke.editors.forEach(editor => editor.destroy())
      await clearCache(win)
    })
  })
  it('shares default-enabled downloads and reuses persistent bytes after reload', () => {
    cy.window().then(async win => {
      const smoke = (win as any).fontSmoke
      await Promise.all([smoke.create(), smoke.create()])
    })
    cy.window().should(win => {
      for (const editor of (win as any).fontSmoke.editors)
        expect(editor.getFontCoverageReport().issues).to.deep.eq([])
      expect(cssRequests).to.eq(1)
      expect(fontRequests).to.eq(1)
      expect(win.document.fonts.check('20px "Noto Naskh Arabic"')).to.eq(true)
    })
    cy.reload()
    cy.window().should('have.property', 'fontSmoke')
    cy.window().then(win => (win as any).fontSmoke.create())
    cy.window().should(win => {
      expect(
        (win as any).fontSmoke.editors[0].getFontCoverageReport().issues
      ).to.deep.eq([])
      expect(cssRequests).to.eq(1)
      expect(fontRequests).to.eq(1)
    })
  })
  it('makes no Bunny requests while disabled and supports runtime enabling', () => {
    cy.window().then(win => (win as any).fontSmoke.create(false))
    cy.wait(200)
    cy.window().then(win => {
      const editor = (win as any).fontSmoke.editors[0]
      expect(editor.getFontCoverageReport().issues[0].downloadStatus).to.eq(
        'disabled'
      )
      expect(cssRequests).to.eq(0)
      expect(fontRequests).to.eq(0)
      editor.command.executeUpdateOptions({ autoDownloadFonts: true })
    })
    cy.window().should(win => {
      expect(
        (win as any).fontSmoke.editors[0].getFontCoverageReport().issues
      ).to.deep.eq([])
      expect(cssRequests).to.eq(1)
      expect(fontRequests).to.eq(1)
    })
  })
  it('keeps diagnostics outside page geometry, updates locale/print and cleans up per instance', () => {
    cy.window().then(async win => {
      const smoke = (win as any).fontSmoke
      const first = await smoke.create(false)
      await smoke.create(false)
      const ui = win.document.querySelector<HTMLElement>(
        '.ce-font-diagnostics'
      )!
      const canvas = ui.parentElement!.querySelector('canvas')!
      const before = canvas.getBoundingClientRect().toJSON()
      expect(win.getComputedStyle(ui).position).to.eq('absolute')
      expect(ui.closest('.ce-page-container')).to.eq(null)
      ui.hidden = true
      expect(canvas.getBoundingClientRect().toJSON()).to.deep.eq(before)
      ui.hidden = false
      ui.querySelector('summary')!.click()
      expect(ui.querySelector('details')!.open).to.eq(true)
      expect(canvas.getBoundingClientRect().toJSON()).to.deep.eq(before)
      first.command.executeSetLocale('en')
      expect(ui.textContent).to.contain('Arabic')
      first.command.executeUpdateOptions({ direction: 'rtl' })
      expect(ui.dir).to.eq('rtl')
      first.command.executeMode('print')
      expect(ui.hidden).to.eq(true)
      first.command.executeMode('edit')
      expect(ui.hidden).to.eq(false)
      first.command.executeSetValue({ main: [] })
      expect(ui.querySelector('details')!.hidden).to.eq(true)
      first.destroy()
      expect(ui.isConnected).to.eq(false)
      expect(
        win.document.querySelectorAll('.ce-font-diagnostics').length
      ).to.eq(1)
      expect(cssRequests).to.eq(0)
    })
  })
  it('shows download failure and deduplicates its warning after document recomputation', () => {
    cy.intercept('https://fonts.bunny.net/css*', { statusCode: 404 })
    cy.window().then(win => {
      cy.stub(win.console, 'warn').as('fontWarn')
      return (win as any).fontSmoke.create()
    })
    cy.get('.ce-font-diagnostics li').should('contain.text', '下载失败')
    cy.get('@fontWarn').should('have.been.calledOnce')
    cy.window().then(win => {
      const editor = (win as any).fontSmoke.editors[0]
      editor.command.executeUpdateOptions({ defaultSize: 24 })
    })
    cy.get('@fontWarn').should('have.been.calledOnce')
  })
})
