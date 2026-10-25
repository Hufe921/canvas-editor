import type { SceneDefinition, SceneNode } from './SceneNode'
import { SvgNodeFactory, SVG_NAMESPACE } from './SvgNodeFactory'

type SceneElement = SceneNode | SceneDefinition

export class SceneReconciler {
  private readonly factory = new SvgNodeFactory()
  private readonly elements = new WeakMap<SceneElement, SVGElement>()
  private readonly rootScenes = new WeakMap<SVGElement, SceneNode>()
  private readonly definitionElements = new WeakMap<
    SVGElement,
    SVGDefsElement
  >()

  public reconcile(
    host: SVGElement,
    scene: SceneNode,
    previous = this.rootScenes.get(host)
  ): SVGElement {
    this._reconcileChildren(host, previous ? [previous] : [], [scene])
    this.rootScenes.set(host, scene)
    return this.elements.get(scene)!
  }

  private _mount(node: SceneElement): SVGElement {
    const element = this.factory.create(node)
    this.elements.set(node, element)
    this._reconcileDefinitions(element, null, node)
    this._reconcileChildren(element, [], this.factory.getChildren(node))
    return element
  }

  private _patch(
    element: SVGElement,
    previous: SceneElement,
    next: SceneElement
  ): SVGElement {
    this.factory.patch(element, previous, next)
    this._reconcileDefinitions(element, previous, next)
    this._reconcileChildren(
      element,
      this.factory.getChildren(previous),
      this.factory.getChildren(next)
    )
    this.elements.delete(previous)
    this.elements.set(next, element)
    return element
  }

  private _reconcileDefinitions(
    element: SVGElement,
    previous: SceneElement | null,
    next: SceneElement
  ): void {
    const previousDefinitions =
      previous && 'defs' in previous ? previous.defs || [] : []
    const nextDefinitions = 'defs' in next ? next.defs || [] : []
    let definitionsElement = this.definitionElements.get(element)
    if (!nextDefinitions.length) {
      if (definitionsElement) {
        definitionsElement.remove()
        this.definitionElements.delete(element)
      }
      return
    }
    if (!definitionsElement) {
      definitionsElement = document.createElementNS(
        SVG_NAMESPACE,
        'defs'
      ) as SVGDefsElement
      element.insertBefore(definitionsElement, element.firstChild)
      this.definitionElements.set(element, definitionsElement)
    }
    this._reconcileChildren(
      definitionsElement,
      previousDefinitions,
      nextDefinitions
    )
  }

  private _reconcileChildren(
    parent: SVGElement,
    previousChildren: SceneElement[],
    nextChildren: SceneElement[]
  ): void {
    const previousByKey = new Map(
      previousChildren.map(child => [child.key, child])
    )
    const reused = new Set<SceneElement>()
    const elements = nextChildren.map(child => {
      const previous = previousByKey.get(child.key)
      if (previous && previous.kind === child.kind) {
        reused.add(previous)
        const element = this.elements.get(previous)!
        if (previous === child) return element
        return this._patch(element, previous, child)
      }
      return this._mount(child)
    })
    for (const previous of previousChildren) {
      if (!reused.has(previous)) {
        this.elements.get(previous)?.remove()
      }
    }
    const definitionsElement = this.definitionElements.get(parent)
    elements.forEach((element, index) => {
      const reference = index
        ? elements[index - 1].nextSibling
        : definitionsElement
          ? definitionsElement.nextSibling
          : parent.firstChild
      if (reference !== element) {
        parent.insertBefore(element, reference)
      }
    })
  }
}
