const samples = [
  'paragraphs',
  'emr-controls',
  'nested-table',
  'surround-columns',
  'mixed-paper',
  'print'
]

// Package runs use --config baseUrl=http://127.0.0.1:4179 and exercise
// both an unbundled import-map consumer and a standalone Vite consumer.
const paths = Cypress.env('package')
  ? ['/native/', '/bundled/']
  : ['/canvas-editor/tests/fixtures/migration/index.html']

for (const path of paths) {
  describe(`migration baseline ${path}`, () => {
    for (const engine of ['harfbuzz']) {
      for (const sample of samples) {
        it(`${engine}: ${sample}`, () => {
          const origin = Cypress.config('baseUrl') || 'http://127.0.0.1:3000'
          const requests: string[] = []
          cy.intercept('GET', '**/*.ttf', req => {
            requests.push(req.url)
          })
          // Apply on every document load, including Vite dependency reloads.
          cy.on('window:before:load', win => {
            Object.defineProperty(win, 'devicePixelRatio', {
              value: 1,
              configurable: true
            })
            const instantiated = () => {
              win.migrationWasmCount = (win.migrationWasmCount || 0) + 1
            }
            const instantiate = win.WebAssembly.instantiate.bind(
              win.WebAssembly
            )
            cy.stub(win.WebAssembly, 'instantiate').callsFake((...args) =>
              instantiate(...args).then(result => {
                instantiated()
                return result
              })
            )
            if (win.WebAssembly.instantiateStreaming) {
              const streaming = win.WebAssembly.instantiateStreaming.bind(
                win.WebAssembly
              )
              cy.stub(win.WebAssembly, 'instantiateStreaming').callsFake(
                (...args) =>
                  streaming(...args).then(result => {
                    instantiated()
                    return result
                  })
              )
            }
          })
          cy.visit(`${origin}${path}?sample=${sample}`)
          cy.get('#status', { timeout: 20000 })
            .should('contain', '"status":"passed"')
            .invoke('text')
            .then(text => {
              const result = JSON.parse(text)
              expect(result.sample).to.equal(sample)
              expect(result.engine).to.equal(engine)
              expect(result.viewport).to.deep.equal([1366, 720])
              expect(result.dpr).to.equal(1)
              expect(result.fontBytes).to.be.greaterThan(10000)
              expect(result.wordCount).to.be.greaterThan(0)
              if (sample === 'mixed-paper') expect(result.pages).to.equal(3)
              if (sample === 'print') expect(result.pages).to.be.greaterThan(1)
              expect(requests).to.have.length(1)
            })
          cy.window().its('migrationWasmCount').should('be.greaterThan', 0)
          cy.window().then(async win => {
            for (const src of win.migrationImages) {
              const image = new win.Image()
              image.src = src
              await image.decode()
              const canvas = win.document.createElement('canvas')
              canvas.width = image.width
              canvas.height = image.height
              const ctx = canvas.getContext('2d')!
              ctx.drawImage(image, 0, 0)
              const pixels = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              ).data
              let ink = 0
              for (let i = 0; i < pixels.length; i += 4) {
                if (
                  pixels[i + 3] &&
                  pixels[i] < 100 &&
                  pixels[i + 1] < 100 &&
                  pixels[i + 2] < 100
                )
                  ink++
              }
              expect(ink, 'print page has visible ink').to.be.greaterThan(10)
            }
          })
          cy.get('#editor canvas').should('have.length.greaterThan', 0)
          cy.screenshot(
            `${
              path.includes('native')
                ? 'native'
                : path.includes('bundled')
                  ? 'bundled'
                  : 'source'
            }-${engine}-${sample}`,
            {
              capture: 'fullPage'
            }
          )
        })
      }
    }
  })
}
