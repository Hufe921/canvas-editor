import { describe, expect, it, vi } from 'vitest'
import { SceneReconciler } from '@/editor/core/render/svg/scene/SceneReconciler'
import type { SceneNode } from '@/editor/core/render/svg/scene/SceneNode'
import {
  SvgNodeFactory,
  SVG_NAMESPACE
} from '@/editor/core/render/svg/scene/SvgNodeFactory'

function createScene(canvas: HTMLCanvasElement): SceneNode {
  return {
    key: 'root',
    kind: 'group',
    attributes: {},
    children: [
      {
        key: 'page:0',
        kind: 'page',
        attributes: {},
        defs: [
          {
            key: 'pattern-watermark',
            kind: 'pattern',
            cacheKey: 'watermark-v1',
            attributes: {
              href: canvas,
              width: 20,
              height: 20,
              repetition: 'repeat'
            },
            children: []
          }
        ],
        children: []
      }
    ]
  }
}

describe('Pattern serialization', () => {
  it('相同 definition 后续帧不重复读取临时 Canvas', () => {
    const host = document.createElementNS(SVG_NAMESPACE, 'svg') as SVGSVGElement
    const reconciler = new SceneReconciler()
    const toDataURL = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL')

    reconciler.reconcile(host, createScene(document.createElement('canvas')))
    expect(toDataURL).toHaveBeenCalledTimes(1)
    toDataURL.mockClear()

    reconciler.reconcile(host, createScene(document.createElement('canvas')))
    reconciler.reconcile(host, createScene(document.createElement('canvas')))

    expect(toDataURL).not.toHaveBeenCalled()
  })

  it('限制 pattern href 缓存容量并淘汰最旧资源', () => {
    const factory = new SvgNodeFactory()

    for (let index = 0; index < 40; index++) {
      const definition = {
        key: `pattern-${index}`,
        kind: 'pattern' as const,
        cacheKey: `pattern-${index}`,
        attributes: {
          href: document.createElement('canvas'),
          width: 20,
          height: 20
        },
        children: []
      }
      factory.create(definition)
      factory.getChildren(definition)
    }

    const cache = (factory as any).patternHrefs as Map<string, string>
    expect(cache.size).toBe(32)
    expect(cache.has('pattern-0')).toBe(false)
    expect(cache.has('pattern-39')).toBe(true)
  })
})
