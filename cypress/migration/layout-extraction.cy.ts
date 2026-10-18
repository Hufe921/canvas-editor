// T10 checks the extracted layout integration using T01 object/flow samples.
// It deliberately does not update the original migration snapshots.
for (const engine of ['harfbuzz']) {
  describe(`T10 object layout: ${engine}`, () => {
    for (const sample of [
      'nested-table',
      'surround-columns',
      'mixed-paper',
      'print'
    ]) {
      it(sample, () => {
        const requests: string[] = []
        cy.intercept('https://fonts.bunny.net/**', req => {
          requests.push(req.url)
          req.reply({ statusCode: 503 })
        })
        cy.visit(
          `/canvas-editor/tests/fixtures/migration/index.html?sample=${sample}`
        )
        cy.get('#status', { timeout: 20000 })
          .should('contain.text', '"status":"passed"')
          .invoke('text')
          .then(text => {
            const result = JSON.parse(text)
            expect(result.sample).to.eq(sample)
            expect(result.pages).to.be.greaterThan(0)
            if (sample === 'mixed-paper') expect(result.pages).to.eq(3)
          })
        cy.window().then(async win => {
          expect(requests).to.deep.eq([])
          for (const src of (win as any).migrationImages) {
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
            for (let i = 0; i < pixels.length; i += 4)
              if (
                pixels[i + 3] &&
                pixels[i] < 100 &&
                pixels[i + 1] < 100 &&
                pixels[i + 2] < 100
              )
                ink++
            expect(ink, 'exported page contains ink').to.be.greaterThan(10)
          }
          ;(win as any).migrationEditor.destroy()
        })
      })
    }
  })
}
