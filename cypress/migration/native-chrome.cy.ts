for (const rtl of [false, true])
  describe(`T14 native chrome ${rtl ? 'RTL' : 'LTR'}`, () => {
    beforeEach(() => {
      cy.visit(
        `/canvas-editor/tests/fixtures/migration/native-chrome.html${rtl ? '?rtl' : ''}`
      )
      cy.get('#status', { timeout: 20000 }).should('have.text', 'ready')
    })
    it('assigns/clears/overwrites controls, preserves minimums and avoids persisted fillers', () => {
      cy.window().then(win => {
        const api = (win as any).nativeChrome
        const { draw } = api
        api.forbidLegacyText()
        api.set('Alice')
        api.set('ignored', false)
        const text = () =>
          api.main
            .filter(
              (e: any) =>
                e.controlId === 'text' && e.controlComponent === 'value'
            )
            .map((e: any) => e.value)
            .join('')
        expect(text()).to.eq('Alice')
        api.set('many words '.repeat(25))
        expect(
          draw
            .getRowList()
            .filter((r: any) =>
              r.elementList.some((e: any) => e.controlId === 'text')
            ).length
        ).to.be.greaterThan(2)
        api.set(null)
        expect(text()).to.eq('')
        expect(
          api.main
            .filter(
              (e: any) =>
                e.controlId === 'text' && e.controlComponent === 'placeholder'
            )
            .map((e: any) => e.value)
            .join('')
        ).to.eq('name')
        expect(api.main.some((e: any) => e.isControlMinWidthPlaceholder)).to.eq(
          false
        )
        expect(JSON.stringify(api.persisted())).not.to.contain(
          'isControlMinWidthPlaceholder'
        )
        draw
          .getControl()
          .setValueListById([
            { id: 'check', value: 'b', isSubmitHistory: false }
          ])
        const boxes = api.main.filter(
          (e: any) => e.controlComponent === 'checkbox'
        )
        expect(boxes.map((e: any) => e.checkbox.value)).to.deep.eq([
          false,
          true
        ])
      })
    })
    it('paints label background, list markers and decorations without legacy metrics', () => {
      cy.window().then(win => {
        const api = (win as any).nativeChrome
        api.forbidLegacyText()
        api.draw.render({ isLazy: false, isSetCursor: false })
        const lines = api.native().filter((n: any) => n.kind === 'textLine')
        const markers = lines.filter((n: any) => n.marker)
        expect(markers.length).to.eq(12)
        for (const line of markers) {
          if (rtl)
            expect(line.marker.rect.x).to.be.greaterThan(
              line.rect.x + line.rect.width
            )
          else
            expect(line.marker.rect.x + line.marker.rect.width).to.be.lessThan(
              line.rect.x
            )
        }
        const rows = api.draw.getRowList().filter((r: any) => r.isList)
        expect(rows.map((r: any) => r.listIndex)).to.deep.eq(
          Array.from({ length: 12 }, (_, i) => i)
        )
        const ctx = api.draw.getPage().getContext('2d')
        const pixels = ctx.getImageData(
          0,
          0,
          ctx.canvas.width,
          ctx.canvas.height
        ).data
        let magenta = 0,
          yellow = 0
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i] > 240 && pixels[i + 1] < 20 && pixels[i + 2] > 240)
            magenta++
          if (pixels[i] > 240 && pixels[i + 1] > 240 && pixels[i + 2] < 230)
            yellow++
        }
        expect(magenta).to.be.greaterThan(100)
        expect(yellow).to.be.greaterThan(100)
      })
    })
    it('locates missing value text from the page font diagnostic', () => {
      cy.window().then(win => (win as any).nativeChrome.set('字'))
      cy.get('.ce-font-diagnostics details').invoke('attr', 'open', '')
      cy.get('.ce-font-diagnostics button').first().click()
      cy.window().then(win => {
        const { draw, main } = (win as any).nativeChrome
        const range = draw.getRange().getRange()
        expect(main[range.endIndex].value).to.eq('字')
        expect(main[range.endIndex].controlComponent).to.eq('value')
      })
    })
    it('keeps checkbox label hit positions and readonly interaction rules', () => {
      const clickLabel = () =>
        cy.window().then(win => {
          const { draw, main } = (win as any).nativeChrome
          const index = main.findIndex(
            (e: any) =>
              e.controlId === 'check' && e.controlComponent === 'value'
          )
          const position = draw.getPosition().getOriginalMainPositionList()[
            index
          ]
          const x = position.coordinate.leftTop[0] + position.metrics.width / 2
          const y = position.coordinate.leftTop[1] + position.metrics.height / 2
          cy.wrap(draw.getPage()).click(x, y, { force: true })
        })
      clickLabel()
      cy.window().then(win => {
        const api = (win as any).nativeChrome
        const first = api.main.find(
          (e: any) => e.controlComponent === 'checkbox'
        )
        expect(first.checkbox.value).to.eq(false)
        api.readonly()
      })
      clickLabel()
      cy.window().then(win => {
        const api = (win as any).nativeChrome
        const first = api.main.find(
          (e: any) => e.controlComponent === 'checkbox'
        )
        expect(first.checkbox.value).to.eq(false)
        const before = JSON.stringify(api.persisted())
        api.draw.getListParticle().setList('ul', 'disc')
        expect(JSON.stringify(api.persisted())).to.eq(before)
      })
    })
    it('locates missing placeholder text and prints chrome without diagnostic UI', () => {
      cy.window().then(win => {
        const { draw } = (win as any).nativeChrome
        draw.getControl().setPropertiesListById([
          {
            id: 'text',
            properties: { placeholder: '字' },
            isSubmitHistory: false
          }
        ])
      })
      cy.get('.ce-font-diagnostics details').invoke('attr', 'open', '')
      cy.get('.ce-font-diagnostics button').first().click()
      cy.window().then(async win => {
        const { draw, main, forbidLegacyText } = (win as any).nativeChrome
        const range = draw.getRange().getRange()
        expect(main[range.endIndex].controlComponent).to.eq('placeholder')
        expect(main[range.endIndex].value).to.eq('字')
        forbidLegacyText()
        const pages = await draw.getDataURL({ mode: 'print' })
        expect(pages.length).to.be.greaterThan(0)
        expect(pages[0]).to.match(/^data:image\/png/)
      })
    })
    it('locates missing text inside a table control with its cell context', () => {
      cy.window().then(win => {
        const api = (win as any).nativeChrome
        api.draw
          .getControl()
          .setValueListById([
            { id: 'nested', value: '字', isSubmitHistory: false }
          ])
      })
      cy.get('.ce-font-diagnostics details').invoke('attr', 'open', '')
      cy.get('.ce-font-diagnostics button').first().click()
      cy.window().then(win => {
        const { draw } = (win as any).nativeChrome
        const context = draw.getPosition().getPositionContext()
        expect(context.isTable).to.eq(true)
        expect(context.tablePath.length).to.eq(1)
        const range = draw.getRange().getRange()
        expect(draw.getElementList()[range.endIndex].value).to.eq('字')
      })
    })
  })
