for (const rtl of [false, true]) {
  describe(`T17 native interaction ${rtl ? 'RTL' : 'LTR'}`, () => {
    const visit = (query = '') => {
      cy.visit(
        `/canvas-editor/tests/fixtures/migration/native-interaction.html?${rtl ? 'rtl&' : ''}${query}`
      )
      cy.get('#status', { timeout: 30000 }).should('have.text', 'ready')
    }
    it('clicks native caret stops on wrapped/mixed pages and positions cursor/IME at the same box', () => {
      visit()
      cy.window().then(win => {
        const api = (win as any).nativeInteraction,
          { draw, lineCarets, mouse } = api
        const position = draw.getPosition()
        const placed = position
          .getNativeLines()
          .find((p: any) => p.pageNo === 1)
        expect(placed).not.to.eq(undefined)
        const stops = lineCarets(placed)
        const stop = stops[Math.floor(stops.length / 2)]
        mouse('mousedown', stop)
        mouse('mouseup', stop)
        const range = draw.getRange().getRange()
        expect(range.startIndex).to.eq(range.endIndex)
        const caret = position.getNativeCaret(range.startIndex)
        expect(caret.x).to.be.closeTo(stop.x, 0.01)
        const dom = draw.getCursor().getCursorDom(),
          offset = draw.getPageOffset(stop.pageNo)
        expect(parseFloat(dom.style.left)).to.be.closeTo(
          caret.x + offset.x,
          0.01
        )
        expect(parseFloat(dom.style.top)).to.be.closeTo(
          caret.y + offset.y,
          0.01
        )
        expect(parseFloat(dom.style.height)).to.be.closeTo(caret.height, 0.01)
        expect(draw.getCursor().getAgentDom().dir).to.eq(rtl ? 'rtl' : 'ltr')
      })
    })
    it('drags and reverses Shift extension with a fixed anchor, keeping spacing out of selection', () => {
      visit()
      cy.window().then(win => {
        const { draw, lineCarets, mouse, place } = (win as any)
          .nativeInteraction
        const position = draw.getPosition()
        const placed = position.getNativeLines()[0],
          stops = lineCarets(placed)
        const start = stops[2],
          end = stops[Math.min(7, stops.length - 1)]
        mouse('mousedown', start)
        mouse('mousemove', end)
        mouse('mouseup', end)
        const range = draw.getRange().getRange()
        expect(range.startIndex).to.be.lessThan(range.endIndex)
        draw.getOptions().caretMovement = 'logical'
        place(2)
        const agent = draw.getCursor().getAgentDom()
        const press = (key: string) =>
          agent.dispatchEvent(
            new win.KeyboardEvent('keydown', {
              key,
              shiftKey: true,
              bubbles: true,
              cancelable: true
            })
          )
        press('ArrowRight')
        press('ArrowRight')
        press('ArrowLeft')
        expect(draw.getRange().getRange()).to.include({
          startIndex: 2,
          endIndex: 3
        })
        expect(position.getCursorPosition().index).to.eq(2)
        const spaced = position
          .getNativeLines()
          .find((p: any) => p.line.spacingAfter > 0)
        expect(spaced).not.to.eq(undefined)
        draw
          .getRange()
          .setRange(spaced.line.source.start, spaced.line.source.end - 1)
        expect(
          draw
            .getRange()
            .getIsPointInRange(
              spaced.x + spaced.line.rect.x * spaced.scale + 1,
              spaced.y +
                (spaced.line.rect.y + spaced.line.contentHeight) *
                  spaced.scale +
                10
            )
        ).to.eq(false)
      })
    })
    it('commits IME text and handles mobile beforeinput deletion once at grapheme boundaries', () => {
      visit()
      cy.window().then(win => {
        const { draw, place } = (win as any).nativeInteraction
        place(1)
        const agent = draw.getCursor().getAgentDom()
        agent.dispatchEvent(
          new win.CompositionEvent('compositionstart', { bubbles: true })
        )
        agent.dispatchEvent(
          new win.InputEvent('input', {
            data: '字',
            inputType: 'insertCompositionText',
            isComposing: true,
            bubbles: true
          })
        )
        agent.dispatchEvent(
          new win.CompositionEvent('compositionend', {
            data: '字',
            bubbles: true
          })
        )
        expect(
          draw
            .getOriginalMainElementList()
            .map((e: any) => e.value)
            .join('')
        ).to.contain('字')
        expect(
          draw
            .getFontCoverageReport()
            .issues.flatMap((i: any) => i.missingCharacters)
        ).to.include('字')
        const before = draw
          .getOriginalMainElementList()
          .map((e: any) => e.value)
          .join('')
        const first = new win.InputEvent('beforeinput', {
          inputType: 'deleteContentBackward',
          bubbles: true,
          cancelable: true
        })
        agent.dispatchEvent(first)
        expect(first.defaultPrevented).to.eq(true)
        const after = draw
          .getOriginalMainElementList()
          .map((e: any) => e.value)
          .join('')
        expect(after.length).to.be.lessThan(before.length)
        agent.dispatchEvent(
          new win.InputEvent('beforeinput', {
            inputType: 'deleteContentBackward',
            bubbles: true,
            cancelable: true
          })
        )
        expect(
          draw
            .getOriginalMainElementList()
            .map((e: any) => e.value)
            .join('')
        ).to.eq(after)
        const current = draw.getRange().getRange().startIndex
        expect(draw.getPosition().getNativeCaret(current)).not.to.eq(null)
      })
    })
    it('selects across cells and hits clipped text in a continuation table page', () => {
      visit('tables')
      cy.window().then(win => {
        const { draw, lineCarets, mouse, textRangeRects } = (win as any)
          .nativeInteraction
        const position = draw.getPosition()
        const table = draw
          .getOriginalMainElementList()
          .find((e: any) => e.type === 'table')
        const first = table.trList[0].tdList[0],
          second = table.trList[0].tdList[1]
        const a = lineCarets(position.getNativeLines(first.positionList)[0])[2]
        const b = lineCarets(position.getNativeLines(second.positionList)[0])[2]
        mouse('mousedown', a)
        mouse('mousemove', b)
        mouse('mouseup', b)
        expect(draw.getRange().getRange().isCrossRowCol).to.eq(true)
        const td = table.trList
          .flatMap((row: any) => row.tdList)
          .find((cell: any) =>
            position
              .getNativeLines(cell.positionList)
              .some((p: any) => p.pageNo > 0)
          )
        const placed = position
          .getNativeLines(td.positionList)
          .find((p: any) => p.pageNo > 0)
        expect(placed).not.to.eq(undefined)
        const rect = textRangeRects(placed, 0, td.value.length)[0]
        const hit = position.getPositionByXY({
          pageNo: placed.pageNo,
          x: rect.x + 1,
          y: rect.y + rect.height / 2
        })
        expect(hit.isTable).to.eq(true)
        expect(hit.tdId).to.eq(td.id)
        expect(rect.y).to.be.at.least(placed.clip.y)
        expect(rect.y + rect.height).to.be.at.most(
          placed.clip.y + placed.clip.height + 0.01
        )
      })
    })
  })
}
