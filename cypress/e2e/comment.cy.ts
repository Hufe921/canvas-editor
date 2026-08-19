describe('批注连接线', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/canvas-editor/')

    cy.get('canvas').first().should('have.length', 1)
  })

  it('连接线默认关闭，打开开关后绘制', () => {
    cy.get('.comment-item').should('exist')

    // 默认不绘制
    cy.get('svg.comment-line path').should('not.exist')

    // 打开开关
    cy.get('#comment-line-switch').check({ force: true })

    cy.get('svg.comment-line path').should('have.length.greaterThan', 0)
  })

  it('打开开关后点击批注，连接线高亮', () => {
    cy.get('#comment-line-switch').check({ force: true })

    cy.get('.comment-item').first().click()

    cy.get('.comment-item.active').should('have.length', 1)
    cy.get('svg.comment-line path.active').should('have.length', 1)
  })
})
