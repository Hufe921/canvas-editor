/// <reference types="cypress" />

declare namespace Editor {
  import('../src/editor/index')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  import Editor from '../src/editor/index'
}

declare namespace Cypress {
  interface Chainable {
    getEditor(): Chainable<Editor>
    visitEditor(): Chainable<AUTWindow>
    getEditorPages(): Chainable<JQuery<HTMLElement | SVGSVGElement>>
    getEditorPage(
      index?: number
    ): Chainable<JQuery<HTMLElement | SVGSVGElement>>
  }
}
