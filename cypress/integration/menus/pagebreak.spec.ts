describe('菜单-分页符', () => {

  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().as('canvas').should('have.length', 1)
  })

  it('分页符', () => {
    cy.get('@canvas').click()

    cy.get('.menu-item__page-break').click().click()

    cy.get('canvas').should('have.length', 3)
  })

})
