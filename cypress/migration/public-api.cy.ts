// Runs the documented example built from the distribution tarball.
// Start `pnpm run test:package -- --serve` and use baseUrl on port 4179.
const describePackage = Cypress.env('package') ? describe : describe.skip

describePackage('T21 public ESM font example', () => {
  let css = ''
  let cssRequests = 0
  let fontRequests = 0
  const page = '/font-example/'
  before(() => {
    cy.readFile('tests/fixtures/fonts/bunny-basic.css').then(value => {
      css = value
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
          'access-control-allow-origin': '*'
        }
      })
    })
    cy.intercept('https://fonts.bunny.net/noto-naskh-arabic/files/*', req => {
      fontRequests++
      req.reply({
        fixture: '../../public/fonts/NotoNaskhArabic-Regular.ttf,null',
        headers: {
          'content-type': 'font/ttf',
          'access-control-allow-origin': '*'
        }
      })
    })
    cy.visit(`${page}?auto=false`)
    cy.get('#status').should('have.attr', 'data-state', 'ready')
    cy.window().then(
      win =>
        new Promise<void>((resolve, reject) => {
          const request = win.indexedDB.deleteDatabase(
            'canvas-editor-bunny-fonts-v1'
          )
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
    )
  })
  it('uses default downloads and resolves the current report', () => {
    cy.visit(page)
    cy.get('#automatic').should('be.checked')
    cy.get('#status').should('have.attr', 'data-state', 'ready')
    cy.get('#coverage', { timeout: 20000 }).should(
      'have.attr',
      'data-issue-count',
      '0'
    )
    cy.then(() => {
      expect(cssRequests).to.eq(1)
      expect(fontRequests).to.eq(1)
    })
    cy.get('#editor canvas').should('have.length.greaterThan', 0)
  })
  it('makes zero automatic requests while disabled and recovers using a local file', () => {
    cy.get('#automatic').should('not.be.checked')
    cy.get('#coverage').should('contain.text', 'disabled')
    cy.wait(150)
    cy.then(() => {
      expect(cssRequests).to.eq(0)
      expect(fontRequests).to.eq(0)
    })
    cy.get('#font-file').selectFile('public/fonts/NotoNaskhArabic-Regular.ttf')
    cy.get('#registration').should('contain.text', 'registered')
    cy.get('#coverage').should('have.attr', 'data-issue-count', '0')
    cy.get('#font-file').selectFile('public/fonts/NotoNaskhArabic-Regular.ttf')
    cy.get('#registration').should('contain.text', 'duplicate')
    cy.then(() => {
      expect(cssRequests).to.eq(0)
      expect(fontRequests).to.eq(0)
    })
  })
  it('shows a recoverable download failure and retries through the public API', () => {
    cy.intercept('https://fonts.bunny.net/css*', { statusCode: 404 }).as(
      'failedCss'
    )
    cy.get('#automatic').check()
    cy.wait('@failedCss')
    cy.get('#coverage', { timeout: 20000 }).should('contain.text', 'failed')
    cy.get('#status').should('have.attr', 'data-state', 'ready')
    cy.get('.ce-font-diagnostics li').should('contain.text', '下载失败')
    cy.intercept('https://fonts.bunny.net/css*', {
      body: css,
      headers: {
        'content-type': 'text/css',
        'access-control-allow-origin': '*'
      }
    })
    cy.get('#retry').click()
    cy.get('#coverage', { timeout: 20000 }).should(
      'have.attr',
      'data-issue-count',
      '0'
    )
  })
  it('shows a failed file registration without losing the current report', () => {
    cy.get('#font-file').selectFile({
      contents: Cypress.Buffer.from('invalid font'),
      fileName: 'invalid.ttf'
    })
    cy.get('#registration').should('contain.text', '字体注册失败')
    cy.get('#coverage').should('contain.text', 'loadFailed')
    cy.get('#status').should('have.attr', 'data-state', 'ready')
  })
})

describePackage('T23 packed WOFF2 resources', () => {
  for (const page of ['/native/', '/bundled/']) {
    it(`decodes WOFF2 and exercises workers/print at ${page}`, () => {
      cy.intercept('https://fonts.bunny.net/**', () => {
        throw new Error('Offline packaged WOFF2 must not request Bunny')
      })
      cy.visit(`${page}?sample=paragraphs&format=woff2`)
      cy.get('#status', { timeout: 30000 }).should(
        'contain.text',
        '"status":"passed"'
      )
      cy.get('#status')
        .invoke('text')
        .then(text => {
          const report = JSON.parse(text)
          expect(report.format).to.eq('woff2')
          expect(report.pages).to.be.greaterThan(0)
          expect(report.wordCount).to.be.greaterThan(0)
        })
    })
  }
})
