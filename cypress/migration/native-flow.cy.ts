for (const rtl of [false, true])
  describe(`T15 native flow ${rtl ? 'RTL' : 'LTR'}`, () => {
    const visit = (query = '') => {
      cy.visit(
        `/canvas-editor/tests/fixtures/migration/native-flow.html?${rtl ? 'rtl&' : ''}${query}`
      )
      cy.get('#status', { timeout: 30000 }).should('have.text', 'ready')
    }
    const verify = (draw: any) => {
      const scale = draw.getOptions().scale
      const positions = draw.getPosition().getOriginalMainPositionList()
      expect(positions.filter(Boolean).length).to.eq(
        draw.getOriginalMainElementList().length
      )
      draw.getLayoutPages().forEach((rows: any[], pageNo: number) =>
        rows.forEach(row => {
          expect(row.flow.pageNo).to.eq(pageNo)
          const direction = draw.getPageDirection(pageNo)
          const column = draw.getColumnLayout(direction)
          const width = column?.width || draw.getInnerWidth(direction)
          if (row.nativeLine?.glyphs.length)
            expect(
              (row.nativeLine.rect.x + row.nativeLine.rect.width) * scale +
                (row.offsetX || 0)
            ).to.be.at.most(width + 0.01)
          expect(
            row.flow.y * scale + row.height + (row.offsetY || 0)
          ).to.be.at.most(
            draw.getHeight(direction) - draw.getMargins(direction)[2] + 0.01
          )
        })
      )
    }
    it('rebreaks around multiple floats and uses each section column width for pixels and hit positions', () => {
      visit()
      cy.window().then(win => {
        const { draw } = (win as any).nativeFlow
        verify(draw)
        expect(draw.getPageDirectionList()).to.include('horizontal')
        const rows = draw
          .getLayoutRowList()
          .filter((r: any) => r.nativeLine?.glyphs.length)
        expect(
          rows.some(
            (r: any) =>
              r.flow.pageNo === 0 && r.flow.y >= 160 && r.flow.width > 60
          )
        ).to.eq(true)
        for (const row of rows.filter(
          (r: any) => r.flow.pageNo === 0 && r.flow.y < 110
        )) {
          const index = row.sourceIndices.find(
            (index: number) =>
              draw.getPosition().getOriginalMainPositionList()[index]?.metrics
                .width > 0
          )
          if (index === undefined) continue
          const pos = draw.getPosition().getOriginalMainPositionList()[index]
          expect(pos.coordinate.leftTop[0]).to.be.at.least(
            150 * draw.getOptions().scale - 0.01
          )
        }
        const position = draw
          .getPosition()
          .getOriginalMainPositionList()
          .find((p: any) => p && p.columnIndex === 1 && p.metrics.width > 0)
        expect(position).not.to.eq(undefined)
        const hit = draw.getPosition().getPositionByXY({
          pageNo: position.pageNo,
          x: position.coordinate.leftTop[0] + position.metrics.width / 2,
          y: position.coordinate.leftTop[1] + position.lineHeight / 2
        })
        expect(hit.index).to.be.at.least(0)
        expect(
          draw.getPosition().getOriginalMainPositionList()[
            hit.hitLineStartIndex ?? hit.index
          ].columnIndex,
          JSON.stringify({ hit, clicked: position })
        ).to.eq(1)
      })
    })
    it('replays table headers across pages/columns and prints the shared fragment windows', () => {
      visit('tables')
      cy.window().then(async win => {
        const { draw } = (win as any).nativeFlow
        verify(draw)
        const fragments = draw
          .getLayoutRowList()
          .filter((r: any) => r.tableFragment)
        expect(fragments.length).to.be.greaterThan(2)
        expect(
          fragments
            .slice(1)
            .every((r: any) => r.tableFragment.repeatTrIndexes?.includes(0))
        ).to.eq(true)
        const pages = await draw.getDataURL({ mode: 'print' })
        expect(pages.length).to.eq(draw.getLayoutPages().length)
        expect(
          draw
            .getOriginalMainElementList()
            .filter((e: any) => e.type === 'table').length
        ).to.eq(1)
      })
    })
    it('truncates only the visible table window at maxPageNo and keeps rerenders stable', () => {
      visit('tables&limited')
      cy.window().then(win => {
        const { draw } = (win as any).nativeFlow
        expect(draw.getLayoutPages().length).to.eq(1)
        const values = () =>
          JSON.stringify(
            draw
              .getOriginalMainElementList()
              .map((e: any) =>
                e.trList?.map((tr: any) =>
                  tr.tdList.map((td: any) =>
                    td.value.map((v: any) => v.value).join('')
                  )
                )
              )
          )
        const before = values()
        draw.render({
          isLazy: false,
          isSetCursor: false,
          isSubmitHistory: false
        })
        expect(draw.getLayoutPages().length).to.eq(1)
        expect(values()).to.eq(before)
        verify(draw)
      })
    })
  })
