import {
  layoutObject,
  ObjectLayoutInput
} from '@/editor/core/layout/ObjectLayout'
import { translateLayout } from '@/editor/core/layout/translateLayout'
import { getLayoutFlowHeight } from '@/editor/core/text-engine/layout/layoutProtocol'
import { describe, expect, it } from 'vitest'

const input: ObjectLayoutInput = {
  kind: 'iframe',
  source: { scope: 'td:one', nodeId: 'object', start: 2, end: 3 },
  revision: { documentRevision: 2, fontRevision: 1 },
  availableWidth: 140,
  width: 400,
  height: 80,
  margin: 8,
  hidden: false
}
describe('T13 native object boxes', () => {
  it('constrains block width and separates content from flow margins', () => {
    const node = layoutObject(input)
    expect(node.kind).toBe('block')
    expect(node.rect).toEqual({ x: 0, y: 8, width: 140, height: 80 })
    expect(getLayoutFlowHeight(node)).toBe(96)
    expect(node.source).toEqual(input.source)
    expect(node.kind === 'block' && node.anchor?.position).toEqual({
      elementIndex: 2,
      offset: 0
    })
    expect(input.width).toBe(400)
  })
  it('aligns content and preserves zero-width explicit blocks', () => {
    const node = layoutObject({ ...input, width: 40, align: 'right' })
    expect(node.rect.x).toBe(100)
    expect(layoutObject({ ...input, width: 0 }).rect.width).toBe(0)
  })
  it('represents floating media with actual dimensions and zero flow', () => {
    const node = layoutObject({
      ...input,
      kind: 'float',
      objectType: 'latex',
      floatPosition: { x: 20, y: 30, pageNo: 1 }
    })
    expect(node).toMatchObject({
      kind: 'block',
      blockType: 'float',
      outOfFlow: true,
      rect: { width: 400, height: 80 },
      objectType: 'latex'
    })
    expect(getLayoutFlowHeight(node)).toBe(0)
  })
  it('builds explicit breaks and separators without text glyphs', () => {
    const page = layoutObject({
      ...input,
      kind: 'page',
      width: undefined,
      paperDirection: 'horizontal'
    })
    expect(page).toMatchObject({
      kind: 'break',
      breakType: 'page',
      paperDirection: 'horizontal'
    })
    expect(getLayoutFlowHeight(page)).toBe(16)
    const separator = layoutObject({
      ...input,
      kind: 'separator',
      width: undefined,
      height: 2
    })
    expect(separator).toMatchObject({ kind: 'block', blockType: 'separator' })
    expect(getLayoutFlowHeight(separator)).toBe(2)
  })
  it('preserves hidden identities while collapsing all flow and translates area children once', () => {
    const hidden = layoutObject({ ...input, hidden: true })
    expect(getLayoutFlowHeight(hidden)).toBe(0)
    expect(hidden.source.start).toBe(2)
    const child = layoutObject(input)
    if (child.kind !== 'block') throw new Error('Expected block')
    const area = { ...child, blockType: 'area' as const, children: [child] }
    const moved = translateLayout([area], 5, 20)[0]
    expect(moved.rect.y).toBe(28)
    expect(moved.kind === 'block' && moved.children[0].rect.y).toBe(28)
    expect(child.rect.y).toBe(8)
  })
})
