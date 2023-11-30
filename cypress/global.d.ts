/// <reference types="cypress" />

declare namespace Editor {
  import('../src/editor/index')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  import Editor from '../src/editor/index'
}

declare namespace Cypress {
  interface Chainable {
    getEditor(): Chainable<Editor>
  }
}
