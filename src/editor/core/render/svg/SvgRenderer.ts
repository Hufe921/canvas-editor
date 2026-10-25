import type { DisplayList } from '../model/DisplayList'
import { SceneCompiler } from './scene/SceneCompiler'
import { SceneReconciler } from './scene/SceneReconciler'

let nextSvgHostScopeId = 0

export class SvgRenderer {
  private compiler: SceneCompiler
  private reconciler: SceneReconciler
  private resourceScopes: WeakMap<SVGSVGElement, string>

  constructor() {
    this.compiler = new SceneCompiler()
    this.reconciler = new SceneReconciler()
    this.resourceScopes = new WeakMap()
  }

  public render(host: SVGSVGElement, displayList: DisplayList): void {
    const scene = this.compiler.compile(
      displayList,
      this._getResourceScope(host)
    )
    this.reconciler.reconcile(host, scene)
  }

  private _getResourceScope(host: SVGSVGElement): string {
    let scope = this.resourceScopes.get(host)
    if (!scope) {
      scope = `svg-host-${++nextSvgHostScopeId}`
      this.resourceScopes.set(host, scope)
    }
    return scope
  }
}
