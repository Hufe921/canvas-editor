import type { SceneDefinition, SceneNode } from './SceneNode'

export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

type SceneElement = SceneNode | SceneDefinition

const GROUP_KINDS = new Set([
  'page',
  'layer',
  'group',
  'row',
  'table-fragment',
  'repeat-header'
])

export class SvgNodeFactory {
  private readonly patternHrefs = new Map<string, string>()

  public create(node: SceneElement): SVGElement {
    const tagName = GROUP_KINDS.has(node.kind) ? 'g' : node.kind
    const element = document.createElementNS(SVG_NAMESPACE, tagName)
    this.patch(element, null, node)
    return element
  }

  public patch(
    element: SVGElement,
    previous: SceneElement | null,
    next: SceneElement
  ): void {
    const previousAttributes = previous ? this._getAttributes(previous) : {}
    const nextAttributes = this._getAttributes(next)
    for (const name of Object.keys(previousAttributes)) {
      if (!(name in nextAttributes)) {
        element.removeAttribute(name)
      }
    }
    for (const [name, value] of Object.entries(nextAttributes)) {
      if (previousAttributes[name] !== value) {
        element.setAttribute(name, value)
      }
    }
    const previousFont = previous?.attributes.font
    const nextFont = next.attributes.font
    if (previousFont !== nextFont) {
      element.style.font = nextFont == null ? '' : String(nextFont)
    }
    if (next.kind === 'text') {
      const previousText =
        previous?.kind === 'text' ? previous.attributes.text : undefined
      const nextText = next.attributes.text
      if (previousText !== nextText) {
        element.textContent = nextText == null ? '' : String(nextText)
      }
    }
    if (next.kind === 'pattern') {
      this._patchPatternImage(element, next)
    }
  }

  public getChildren(node: SceneElement): SceneNode[] {
    return node.children
  }

  private _patchPatternImage(element: SVGElement, node: SceneDefinition): void {
    let image = element.querySelector(':scope > image')
    if (!image) {
      image = document.createElementNS(SVG_NAMESPACE, 'image')
      element.append(image)
    }
    const { href, width, height } = node.attributes
    const attributes = {
      href: this._getPatternImageHref(node, href),
      x: 0,
      y: 0,
      width,
      height,
      preserveAspectRatio: 'none'
    }
    for (const [name, value] of Object.entries(attributes)) {
      if (value == null) {
        image.removeAttribute(name)
      } else {
        const attributeValue = String(value)
        if (image.getAttribute(name) !== attributeValue) {
          image.setAttribute(name, attributeValue)
        }
      }
    }
  }

  private _getAttributes(node: SceneElement): Record<string, string> {
    const attributes: Record<string, string> = {}
    if (node.kind === 'clipPath' || node.kind === 'pattern') {
      attributes.id = node.key
    }
    for (const [name, value] of Object.entries(node.attributes)) {
      if (
        value == null ||
        name === 'text' ||
        name === 'font' ||
        (node.kind === 'pattern' && (name === 'href' || name === 'repetition'))
      ) {
        continue
      }
      const attributeValue =
        name === 'href'
          ? node.kind === 'pattern'
            ? this._getPatternImageHref(node, value)
            : this._getImageHref(value)
          : value
      if (attributeValue != null) {
        attributes[name] = String(attributeValue)
      }
    }
    return attributes
  }

  private _getPatternImageHref(
    node: SceneDefinition,
    value: unknown
  ): string | undefined {
    if (!node.cacheKey) return this._getImageHref(value)
    const cached = this.patternHrefs.get(node.cacheKey)
    if (cached) {
      this.patternHrefs.delete(node.cacheKey)
      this.patternHrefs.set(node.cacheKey, cached)
      return cached
    }
    const href = this._getImageHref(value)
    if (href) {
      if (this.patternHrefs.size >= 32) {
        const oldestKey = this.patternHrefs.keys().next().value
        if (oldestKey) this.patternHrefs.delete(oldestKey)
      }
      this.patternHrefs.set(node.cacheKey, href)
    }
    return href
  }

  private _getImageHref(value: unknown): string | undefined {
    if (typeof value === 'string') return value
    if (
      typeof HTMLImageElement !== 'undefined' &&
      value instanceof HTMLImageElement
    ) {
      return value.currentSrc || value.src
    }
    if (
      typeof HTMLCanvasElement !== 'undefined' &&
      value instanceof HTMLCanvasElement
    ) {
      return value.toDataURL()
    }
    return undefined
  }
}
