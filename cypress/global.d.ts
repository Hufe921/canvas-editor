/// <reference types="cypress" />

declare namespace Editor {
  import('../src/editor/index')
  import Editor from '../src/editor/index'
}

declare namespace Cypress {

  interface Chainable {

    getEditor(): Chainable<Editor>

  }
}
