// Every migration page must render through HarfBuzz, including print/export.
Cypress.on('window:before:load', win => {
  for (const method of ['measureText', 'fillText', 'strokeText'] as const) {
    win.CanvasRenderingContext2D.prototype[method] = () => {
      throw new Error(`Browser text API reached: ${method}`)
    }
  }
})
