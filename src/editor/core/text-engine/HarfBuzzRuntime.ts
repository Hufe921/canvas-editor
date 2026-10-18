import type * as HarfBuzz from 'harfbuzzjs'

type Module = typeof HarfBuzz

/** WASM is shared; editor teardown only releases its own font/layout state. */
export class HarfBuzzRuntime {
  private module: Module | null = null
  private initialization: Promise<Module> | null = null

  constructor(
    private load: () => Promise<Module> = () => import('harfbuzzjs')
  ) {}

  initialize(): Promise<Module> {
    this.initialization ??= Promise.resolve()
      .then(this.load)
      .then(module => {
        this.module = module
        return module
      })
    return this.initialization
  }

  getModule(): Module {
    if (!this.module) {
      throw new Error('HarfBuzz is not initialized; await editor.ready')
    }
    return this.module
  }
}

export const harfBuzzRuntime = new HarfBuzzRuntime()
