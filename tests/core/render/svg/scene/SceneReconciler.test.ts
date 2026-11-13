import { describe, expect, it, vi } from 'vitest'
import { SceneReconciler } from '@/editor/core/render/svg/scene/SceneReconciler'
import type {
  SceneDefinition,
  SceneNode,
  SceneNodeKind
} from '@/editor/core/render/svg/scene/SceneNode'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const createNode = (
  key: string,
  kind: SceneNodeKind,
  attributes: Record<string, unknown> = {},
  children: SceneNode[] = []
): SceneNode => ({ key, kind, attributes, children })

const createRoot = (
  children: SceneNode[],
  defs?: SceneDefinition[]
): SceneNode => ({
  ...createNode('root', 'group', {}, children),
  defs
})

const createHost = () =>
  document.createElementNS(SVG_NAMESPACE, 'svg') as SVGSVGElement

const recordMutations = (target: Node) => {
  const observer = new MutationObserver(() => {})
  observer.observe(target, {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true
  })
  return () => {
    const records = observer.takeRecords()
    observer.disconnect()
    return records
  }
}

describe('SceneReconciler', () => {
  it('使用 SVG namespace 挂载所有结构节点和绘制节点', () => {
    const host = createHost()
    const scene = createRoot([
      createNode('page', 'page', { 'data-index': 0 }, [
        createNode('layer', 'layer', { id: 'content' }, [
          createNode('group', 'group', { transform: 'matrix(1 0 0 1 2 3)' }, [
            createNode('text', 'text', { x: 1, y: 2, text: 'hello' }),
            createNode('path', 'path', { d: 'M 0 0 L 1 1' }),
            createNode('rect', 'rect', { width: 10, height: 20 }),
            createNode('image', 'image', { href: 'image.png', width: 5 })
          ])
        ])
      ])
    ])

    const root = new SceneReconciler().reconcile(host, scene)
    const page = root.children[0]
    const layer = page.children[0]
    const group = layer.children[0]

    expect(root.tagName).toBe('g')
    expect(page.tagName).toBe('g')
    expect(layer.tagName).toBe('g')
    expect(group.tagName).toBe('g')
    expect(Array.from(group.children).map(child => child.tagName)).toEqual([
      'text',
      'path',
      'rect',
      'image'
    ])
    for (const element of [root, page, layer, group, ...group.children]) {
      expect(element.namespaceURI).toBe(SVG_NAMESPACE)
    }
    expect(group.children[0].textContent).toBe('hello')
    expect(group.children[0].hasAttribute('text')).toBe(false)
    expect(group.children[3].getAttribute('href')).toBe('image.png')
  })

  it('同 key 和 kind 仅 patch 变化属性与文本并保留 DOM 身份', () => {
    const host = createHost()
    const reconciler = new SceneReconciler()
    const first = createRoot([
      createNode('text', 'text', {
        x: 1,
        y: 2,
        fill: 'red',
        text: 'before'
      }),
      createNode('image', 'image', { href: 'before.png' })
    ])
    reconciler.reconcile(host, first)
    const text = host.querySelector('text')!
    const image = host.querySelector('image')!
    const getMutations = recordMutations(host)

    reconciler.reconcile(
      host,
      createRoot([
        createNode('text', 'text', {
          x: 1,
          y: 3,
          text: 'after'
        }),
        createNode('image', 'image', { href: 'after.png' })
      ])
    )

    expect(host.querySelector('text')).toBe(text)
    expect(host.querySelector('image')).toBe(image)
    expect(text.textContent).toBe('after')
    expect(text.getAttribute('x')).toBe('1')
    expect(text.getAttribute('y')).toBe('3')
    expect(text.hasAttribute('fill')).toBe(false)
    expect(image.getAttribute('href')).toBe('after.png')
    const attributeMutations = getMutations().filter(
      record =>
        record.type === 'attributes' &&
        (record.target === text || record.target === image)
    )
    expect(attributeMutations.map(record => record.attributeName)).toEqual(
      expect.arrayContaining(['y', 'fill', 'href'])
    )
    expect(attributeMutations).toHaveLength(3)
  })

  it('按 key 创建、删除和 insertBefore 重排且不重建未变兄弟', () => {
    const host = createHost()
    const reconciler = new SceneReconciler()
    const children = (order: string[]) =>
      createRoot(
        order.map(key => createNode(key, 'rect', { id: key, x: Number(key) }))
      )
    reconciler.reconcile(host, children(['1', '2', '3']))
    const root = host.firstElementChild!
    const first = root.children[0]
    const second = root.children[1]
    const third = root.children[2]
    const insertBefore = vi.spyOn(root, 'insertBefore')

    reconciler.reconcile(host, children(['3', '1', '4']))

    expect(Array.from(root.children).map(child => child.id)).toEqual([
      '3',
      '1',
      '4'
    ])
    expect(root.children[0]).toBe(third)
    expect(root.children[1]).toBe(first)
    expect(root.contains(second)).toBe(false)
    expect(insertBefore).toHaveBeenCalled()
    expect(root.children[2].namespaceURI).toBe(SVG_NAMESPACE)
    expect(first.getAttribute('x')).toBe('1')
    expect(third.getAttribute('x')).toBe('3')
  })

  it('创建、更新并移除 clipPath defs 及其引用', () => {
    const host = createHost()
    const reconciler = new SceneReconciler()
    const clip = (d: string): SceneDefinition => ({
      key: 'clip-1',
      kind: 'clipPath',
      attributes: { clipPathUnits: 'userSpaceOnUse' },
      children: [createNode('clip-path', 'path', { d })]
    })
    const scene = (d: string, withClip = true) =>
      createRoot(
        [
          createNode('rect', 'rect', {
            ...(withClip ? { 'clip-path': 'url(#clip-1)' } : {}),
            width: 10
          })
        ],
        withClip ? [clip(d)] : []
      )
    reconciler.reconcile(host, scene('M 0 0'))
    const defs = host.querySelector('defs')!
    const clipPath = defs.querySelector('clipPath')!
    const path = clipPath.querySelector('path')!
    const rect = host.querySelector('rect')!

    expect(defs.namespaceURI).toBe(SVG_NAMESPACE)
    expect(clipPath.id).toBe('clip-1')
    expect(rect.getAttribute('clip-path')).toBe('url(#clip-1)')

    reconciler.reconcile(host, scene('M 1 1 L 2 2'))

    expect(host.querySelector('defs')).toBe(defs)
    expect(host.querySelector('clipPath')).toBe(clipPath)
    expect(host.querySelector('clipPath path')).toBe(path)
    expect(path.getAttribute('d')).toBe('M 1 1 L 2 2')

    reconciler.reconcile(host, scene('', false))

    expect(host.querySelector('defs')).toBeNull()
    expect(host.querySelector('clipPath')).toBeNull()
    expect(host.querySelector('rect')).toBe(rect)
    expect(rect.hasAttribute('clip-path')).toBe(false)
  })

  it('转换三种图片来源并为 pattern 生成实际 image 和重复平铺属性', () => {
    const host = createHost()
    const reconciler = new SceneReconciler()
    const htmlImage = document.createElement('img')
    htmlImage.src = 'https://example.com/current.png'
    Object.defineProperty(htmlImage, 'currentSrc', {
      configurable: true,
      value: 'https://example.com/current-2x.png'
    })
    const canvas = document.createElement('canvas')
    Object.defineProperty(canvas, 'toDataURL', {
      value: () => 'data:image/png;base64,canvas'
    })
    const pattern: SceneDefinition = {
      key: 'pattern-1',
      kind: 'pattern',
      attributes: {
        href: canvas,
        width: 8,
        height: 6,
        repetition: 'repeat',
        patternUnits: 'userSpaceOnUse'
      },
      children: []
    }

    reconciler.reconcile(
      host,
      createRoot(
        [
          createNode('html-image', 'image', { href: htmlImage }),
          createNode('canvas-image', 'image', { href: canvas }),
          createNode('rect', 'rect', { fill: 'url(#pattern-1)' })
        ],
        [pattern]
      )
    )

    const images = Array.from(host.querySelectorAll('image')).filter(
      image => !image.closest('pattern')
    )
    expect(images[0].getAttribute('href')).toBe(
      'https://example.com/current-2x.png'
    )
    expect(images[1].getAttribute('href')).toBe(
      'data:image/png;base64,canvas'
    )
    const patternElement = host.querySelector('pattern')!
    const patternImage = patternElement.querySelector('image')!
    expect(patternElement.id).toBe('pattern-1')
    expect(patternElement.getAttribute('patternUnits')).toBe('userSpaceOnUse')
    expect(patternElement.getAttribute('width')).toBe('8')
    expect(patternElement.getAttribute('height')).toBe('6')
    expect(patternElement.hasAttribute('href')).toBe(false)
    expect(patternElement.hasAttribute('repetition')).toBe(false)
    expect(patternImage.namespaceURI).toBe(SVG_NAMESPACE)
    expect(patternImage.getAttribute('href')).toBe(
      'data:image/png;base64,canvas'
    )
    expect(patternImage.getAttribute('width')).toBe('8')
    expect(patternImage.getAttribute('height')).toBe('6')
    expect(host.querySelector('rect')!.getAttribute('fill')).toBe(
      'url(#pattern-1)'
    )

    const nextCanvas = document.createElement('canvas')
    Object.defineProperty(nextCanvas, 'toDataURL', {
      value: () => 'data:image/png;base64,updated'
    })
    reconciler.reconcile(
      host,
      createRoot(
        [createNode('rect', 'rect', { fill: 'none' })],
        [
          {
            ...pattern,
            attributes: {
              ...pattern.attributes,
              href: nextCanvas,
              repetition: 'repeat-x'
            }
          }
        ]
      )
    )

    expect(pattern.attributes.href).toBe(canvas)
    expect(canvas.toDataURL()).toBe('data:image/png;base64,canvas')
    expect(host.querySelector('pattern')).toBe(patternElement)
    expect(patternElement.querySelector('image')).toBe(patternImage)
    expect(patternImage.getAttribute('href')).toBe(
      'data:image/png;base64,updated'
    )
  })

  it('重复 reconcile 相同 scene 和等价 scene 均为零 DOM mutation', () => {
    const host = createHost()
    const reconciler = new SceneReconciler()
    const scene = createRoot(
      [
        createNode('page', 'page', {}, [
          createNode('text', 'text', { x: 1, text: 'stable' }),
          createNode('path', 'path', { d: 'M 0 0 L 1 1' })
        ])
      ],
      [
        {
          key: 'clip',
          kind: 'clipPath',
          attributes: {},
          children: [createNode('clip-path', 'path', { d: 'M 0 0' })]
        }
      ]
    )
    reconciler.reconcile(host, scene)
    const root = host.firstElementChild
    const page = host.querySelector('g g')
    const text = host.querySelector('text')
    const getMutations = recordMutations(host)

    reconciler.reconcile(host, scene)
    reconciler.reconcile(
      host,
      createRoot(
        [
          createNode('page', 'page', {}, [
            createNode('text', 'text', { x: 1, text: 'stable' }),
            createNode('path', 'path', { d: 'M 0 0 L 1 1' })
          ])
        ],
        [
          {
            key: 'clip',
            kind: 'clipPath',
            attributes: {},
            children: [createNode('clip-path', 'path', { d: 'M 0 0' })]
          }
        ]
      )
    )

    expect(getMutations()).toEqual([])
    expect(host.firstElementChild).toBe(root)
    expect(host.querySelector('g g')).toBe(page)
    expect(host.querySelector('text')).toBe(text)
  })
})
