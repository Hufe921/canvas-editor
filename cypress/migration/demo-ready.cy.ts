const describeSource = Cypress.env('package') ? describe.skip : describe

describeSource('T21 main demo readiness', () => {
  it('exposes a ready instance before toolbar setup and commands', () => {
    // Keep this integration check independent of public font service availability.
    cy.intercept('https://fonts.bunny.net/**', { statusCode: 404 })
    cy.visit('/canvas-editor/')
    cy.window({ timeout: 20000 }).should(win => {
      expect((win as any).editor?.state).to.eq('ready')
    })
    cy.window().then(win => {
      const editor = (win as any).editor
      expect(editor).to.eq((win as any).__CANVAS_EDITOR_INSTANCE__)
      expect(editor.initializationError).to.eq(null)
      editor.command.executeSetRange(0, 1)
      editor.command.executeBold()
      expect(
        editor.command.executeComputeElementListHeight([{ value: 'مرحبا' }])
      ).to.be.greaterThan(0)
    })
    cy.get('.page-scale-add').click()
    cy.window().then(win => {
      expect((win as any).editor.command.getOptions().scale).to.be.greaterThan(
        1
      )
    })
    cy.get('.ce-page-container canvas').should('have.length.greaterThan', 0)
  })
  it('keeps the weekend catalog and everyday form calculations usable', () => {
    cy.intercept('https://fonts.bunny.net/**', { statusCode: 404 })
    cy.visit('/canvas-editor/')
    cy.get('.catalog__main', { timeout: 20000 }).should(
      'contain.text',
      '四、把邀请带给新邻居'
    )
    cy.window().then(win => {
      const editor = (win as any).editor
      const controls = editor.command.getControlList()
      const types = controls.map((item: any) => item.control.type)
      expect(types).to.include.members([
        'text',
        'number',
        'date',
        'select',
        'radio',
        'checkbox'
      ])
      expect(
        editor.command.getControlValue({ conceptId: 'householdBudget' })[0]
          .value
      ).to.eq('60')
      editor.command.executeSetControlValue({
        conceptId: 'participantCount',
        value: '4'
      })
      editor.command.executeSetControlValue({
        conceptId: 'bringPet',
        value: 'yes'
      })
    })
    cy.window().should(win => {
      const editor = (win as any).editor
      expect(
        editor.command.getControlValue({ conceptId: 'householdBudget' })[0]
          .value
      ).to.eq('80')
      const petPlan = editor.command
        .getControlList()
        .find((item: any) => item.control.conceptId === 'petPlan')
      expect(petPlan.control.required).to.eq(true)
    })
  })
})
