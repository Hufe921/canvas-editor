import { describe, expect, it, vi } from 'vitest'
import { EditorZone } from '@/editor/dataset/enum/Editor'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { CanvasRenderer } from '@/editor/core/render/canvas/CanvasRenderer'
import { DisplayList } from '@/editor/core/render/model/DisplayList'
import { SceneCompiler } from '@/editor/core/render/svg/scene/SceneCompiler'
import type { SceneNode } from '@/editor/core/render/svg/scene/SceneNode'
import { mergeOption } from '@/editor/utils/option'
import {
  buildLayerKey,
  buildPageKey,
  buildRepeatHeaderKey,
  buildRowKey,
  buildTableFragmentKey,
  buildZoneKey
} from '@/editor/core/render/svg/scene/SceneKey'

describe('SceneCompiler 结构分组', () => {
  it('按 DisplayList 嵌套关系创建 page、layer 和 row 节点', () => {
    const displayList = new DisplayList()
    displayList.beginGroup(buildPageKey(2), 'page')
    displayList.beginGroup(buildLayerKey(2, 'content'), 'layer')
    displayList.beginGroup('main:row:0', 'row')
    displayList.fillStyle = '#000'
    displayList.fillRect(0, 0, 10, 10)
    displayList.endGroup()
    displayList.endGroup()
    displayList.endGroup()

    const scene = new SceneCompiler().compile(displayList)

    expect(scene).toMatchObject({ kind: 'group', key: 'root' })
    expect(scene.children).toHaveLength(1)
    const page = scene.children[0]
    expect(page).toMatchObject({ kind: 'page', key: 'page:2' })
    expect(page.children).toHaveLength(1)
    expect(page.children[0]).toMatchObject({
      kind: 'layer',
      key: 'page:2:layer:content'
    })
    expect(page.children[0].children[0]).toMatchObject({
      kind: 'row',
      key: 'main:row:0'
    })
  })

  it('拒绝未闭合分组', () => {
    const displayList = new DisplayList()
    displayList.beginGroup('unfinished', 'row')

    expect(() => new SceneCompiler().compile(displayList)).toThrow(
      'Unclosed render group: unfinished'
    )
  })

  it('Canvas 重放忽略结构分组且保持绘制顺序', () => {
    const ctx = document.createElement('canvas').getContext('2d')!
    const fillRect = vi.spyOn(ctx, 'fillRect')
    const displayList = new DisplayList()
    displayList.beginGroup('page:0', 'page')
    displayList.fillRect(1, 2, 3, 4)
    displayList.endGroup()

    new CanvasRenderer().render(ctx, displayList)

    expect(fillRect).toHaveBeenCalledOnce()
    expect(fillRect).toHaveBeenCalledWith(1, 2, 3, 4)
  })

  it('真实 Draw 按固定图层包装页面并为三个区域的每行分组', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const draw = new Draw(
      container,
      mergeOption(),
      {
        header: [{ value: 'header' }, { value: '\n' }],
        main: [{ value: 'main' }, { value: '\n' }],
        footer: [{ value: 'footer' }, { value: '\n' }]
      },
      new Listener(),
      new EventBus(),
      new Override()
    )
    const render = vi.spyOn(CanvasRenderer.prototype, 'render')

    try {
      draw.render({ isLazy: false, isSubmitHistory: false })
      const displayList = render.mock.calls[0][1]
      const scene = new SceneCompiler().compile(displayList)
      const page = scene.children[0]
      const collectRows = (node: SceneNode): SceneNode[] => [
        ...(node.kind === 'row' ? [node] : []),
        ...node.children.flatMap(collectRows)
      ]
      const rowKeys = page.children.flatMap(collectRows).map(row => row.key)

      expect(page).toMatchObject({ kind: 'page', key: 'page:0' })
      expect(page.children.map(layer => [layer.kind, layer.key])).toEqual([
        ['layer', 'page:0:layer:background'],
        ['layer', 'page:0:layer:control-highlight'],
        ['layer', 'page:0:layer:content'],
        ['layer', 'page:0:layer:selection'],
        ['layer', 'page:0:layer:foreground'],
        ['layer', 'page:0:layer:search'],
        ['layer', 'page:0:layer:decoration'],
        ['layer', 'page:0:layer:graffiti'],
        ['layer', 'page:0:layer:watermark']
      ])
      expect(rowKeys.some(key => key.includes('zone:0:main'))).toBe(true)
      expect(rowKeys.some(key => key.includes('zone:0:header'))).toBe(true)
      expect(rowKeys.some(key => key.includes('zone:0:footer'))).toBe(true)
    } finally {
      draw.destroy()
      container.remove()
      render.mockRestore()
    }
  })
})

describe('SceneCompiler 绘制状态与基础节点', () => {
  it('在 save/restore 间继承并恢复完整 paint state', () => {
    const displayList = new DisplayList()
    displayList.fillStyle = '#111111'
    displayList.strokeStyle = '#222222'
    displayList.font = '16px serif'
    displayList.globalAlpha = 0.6
    displayList.textAlign = 'right'
    displayList.lineWidth = 3
    displayList.lineCap = 'round'
    displayList.lineJoin = 'bevel'
    displayList.setLineDash([4, 2])
    displayList.save()
    displayList.fillStyle = '#aaaaaa'
    displayList.strokeStyle = '#bbbbbb'
    displayList.font = '20px sans-serif'
    displayList.globalAlpha = 0.2
    displayList.textAlign = 'center'
    displayList.lineWidth = 8
    displayList.lineCap = 'square'
    displayList.lineJoin = 'round'
    displayList.setLineDash([9])
    displayList.fillRect(1, 2, 3, 4)
    displayList.restore()
    displayList.strokeRect(5, 6, 7, 8)
    displayList.fillText('restored', 9, 10)

    const children = new SceneCompiler().compile(displayList).children

    expect(children[0]).toMatchObject({
      kind: 'rect',
      attributes: {
        x: 1,
        y: 2,
        width: 3,
        height: 4,
        fill: '#aaaaaa',
        opacity: 0.2
      }
    })
    expect(children[1]).toMatchObject({
      kind: 'rect',
      attributes: {
        x: 5,
        y: 6,
        width: 7,
        height: 8,
        fill: 'none',
        stroke: '#222222',
        opacity: 0.6,
        'stroke-width': 3,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'bevel',
        'stroke-dasharray': '4 2'
      }
    })
    expect(children[2]).toMatchObject({
      kind: 'text',
      attributes: {
        x: 9,
        y: 10,
        text: 'restored',
        fill: '#111111',
        opacity: 0.6,
        font: '16px serif',
        'text-anchor': 'end'
      }
    })
  })

  it('将 textAlign 映射为 SVG text-anchor', () => {
    const displayList = new DisplayList()
    const alignments = ['start', 'left', 'center', 'right', 'end'] as const
    alignments.forEach((textAlign, index) => {
      displayList.textAlign = textAlign
      displayList.fillText(String(index), index, 0)
    })

    const children = new SceneCompiler().compile(displayList).children

    expect(children.map(node => node.attributes['text-anchor'])).toEqual([
      'start',
      'start',
      'middle',
      'end',
      'end'
    ])
  })

  it('编译图片目标尺寸并用 clipPath 和变换表达源裁切', () => {
    const displayList = new DisplayList()
    const image = document.createElement('img')
    image.width = 300
    image.height = 200
    displayList.globalAlpha = 0.4
    displayList.drawImage(image, 10, 20, 30, 40)
    displayList.drawImage(image, 1, 2, 3, 4, 50, 60, 70, 80)

    const scene = new SceneCompiler().compile(displayList)
    const children = scene.children

    expect(children[0]).toMatchObject({
      kind: 'image',
      attributes: {
        href: image,
        x: 10,
        y: 20,
        width: 30,
        height: 40,
        opacity: 0.4,
        preserveAspectRatio: 'none'
      }
    })
    expect(children[1]).toMatchObject({
      kind: 'image',
      attributes: {
        href: image,
        x: 0,
        y: 0,
        width: 300,
        height: 200,
        opacity: 0.4,
        preserveAspectRatio: 'none',
        transform: `matrix(${70 / 3} 0 0 20 ${50 - 70 / 3} 20)`
      }
    })
    const clipId = String(children[1].attributes['clip-path']).slice(5, -1)
    const clip = scene.defs!.find(definition => definition.key === clipId)!
    expect(clip.children[0].attributes).toMatchObject({
      x: 50,
      y: 60,
      width: 70,
      height: 80
    })
    expect(children[1].attributes).not.toHaveProperty('sourceX')
  })

  it('按 Canvas 后乘顺序组合嵌套 translate、scale、rotate', () => {
    const displayList = new DisplayList()
    displayList.translate(10, 20)
    displayList.scale(2, 3)
    displayList.rotate(Math.PI / 2)
    displayList.translate(5, 7)
    displayList.fillRect(0, 0, 1, 1)

    const rect = new SceneCompiler().compile(displayList).children[0]

    expect(rect.attributes.transform).toBe('matrix(0 3 -2 0 -4 35)')
  })

  it('save/restore 同时保存和恢复当前变换矩阵', () => {
    const displayList = new DisplayList()
    displayList.translate(10, 20)
    displayList.save()
    displayList.scale(2, 4)
    displayList.fillRect(0, 0, 1, 1)
    displayList.restore()
    displayList.fillRect(1, 1, 1, 1)

    const children = new SceneCompiler().compile(displayList).children

    expect(children[0].attributes.transform).toBe('matrix(2 0 0 4 10 20)')
    expect(children[1].attributes.transform).toBe('matrix(1 0 0 1 10 20)')
  })

  it('拒绝未闭合 save 和多余的 restore', () => {
    const unclosedSave = new DisplayList()
    unclosedSave.save()
    expect(() => new SceneCompiler().compile(unclosedSave)).toThrow(
      'Unclosed save operation'
    )

    const unexpectedRestore = new DisplayList()
    unexpectedRestore.restore()
    expect(() => new SceneCompiler().compile(unexpectedRestore)).toThrow(
      'Unexpected restore operation'
    )
  })

  it('叶子 key 按父分组内 kind 和序号生成且不依赖文本', () => {
    const compile = (text: string) => {
      const displayList = new DisplayList()
      displayList.beginGroup('page:0', 'page')
      displayList.fillText(text, 0, 0)
      displayList.fillRect(0, 0, 1, 1)
      displayList.fillText(text, 1, 1)
      displayList.endGroup()
      return new SceneCompiler().compile(displayList).children[0].children
    }

    const first = compile('first')
    const second = compile('changed')

    expect(first.map(node => node.key)).toEqual([
      'page:0:text:0',
      'page:0:rect:0',
      'page:0:text:1'
    ])
    expect(second.map(node => node.key)).toEqual(first.map(node => node.key))
  })

  it('来源文本 key 与普通文本 ordinal key 使用不同命名空间', () => {
    const displayList = new DisplayList()
    displayList.beginGroup('row:0', 'row')
    displayList.fillText('plain', 0, 0)
    displayList.fillTextWithSource('source', 10, 0, { key: 'text:0' })
    displayList.endGroup()

    const children = new SceneCompiler().compile(displayList).children[0].children

    expect(children[0].key).toBe('row:0:text:0')
    expect(children[1].key).not.toBe(children[0].key)
  })

  it('重复 sibling key 在编译阶段抛出明确错误', () => {
    const displayList = new DisplayList()
    displayList.beginGroup('row:0', 'row')
    displayList.fillTextWithSource('first', 0, 0, { key: 'source:0' })
    displayList.fillTextWithSource('second', 10, 0, { key: 'source:0' })
    displayList.endGroup()

    expect(() => new SceneCompiler().compile(displayList)).toThrow(
      'Duplicate sibling scene key: row:0:source:source:0'
    )
  })

  it('重复 sibling group key 同样在编译阶段抛错', () => {
    const displayList = new DisplayList()
    displayList.beginGroup('page:0', 'page')
    displayList.beginGroup('row:0', 'row')
    displayList.endGroup()
    displayList.beginGroup('row:0', 'row')
    displayList.endGroup()
    displayList.endGroup()

    expect(() => new SceneCompiler().compile(displayList)).toThrow(
      'Duplicate sibling scene key: row:0'
    )
  })
})

describe('SceneCompiler 路径、裁剪与图案', () => {
  it('fill 和 stroke 分别生成独立 PathNode，并继承 nonzero、线型和矩阵', () => {
    const displayList = new DisplayList()
    displayList.beginPath()
    displayList.moveTo(1, 2)
    displayList.lineTo(3, 4)
    displayList.rect(10, 20, 30, 40)
    displayList.fillStyle = '#123456'
    displayList.strokeStyle = '#654321'
    displayList.lineWidth = 2
    displayList.lineCap = 'round'
    displayList.lineJoin = 'bevel'
    displayList.setLineDash([3, 1])
    displayList.globalAlpha = 0.5
    displayList.translate(5, 6)
    displayList.fill()
    displayList.stroke()

    const children = new SceneCompiler().compile(displayList).children
    const d = 'M 1 2 L 3 4 M 10 20 H 40 V 60 H 10 Z'

    expect(children).toHaveLength(2)
    expect(children[0]).toMatchObject({
      kind: 'path',
      attributes: {
        d,
        fill: '#123456',
        'fill-rule': 'nonzero',
        opacity: 0.5,
        transform: 'matrix(1 0 0 1 5 6)'
      }
    })
    expect(children[1]).toMatchObject({
      kind: 'path',
      attributes: {
        d,
        fill: 'none',
        stroke: '#654321',
        'fill-rule': 'nonzero',
        opacity: 0.5,
        'stroke-width': 2,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'bevel',
        'stroke-dasharray': '3 1',
        transform: 'matrix(1 0 0 1 5 6)'
      }
    })
    expect(children[0].key).not.toBe(children[1].key)
  })

  it('beginPath 重置路径，但 clip 不消耗当前路径', () => {
    const displayList = new DisplayList()
    displayList.beginPath()
    displayList.rect(0, 0, 10, 10)
    displayList.clip()
    displayList.rect(20, 20, 5, 5)
    displayList.stroke()
    displayList.beginPath()
    displayList.moveTo(1, 1)
    displayList.lineTo(2, 2)
    displayList.stroke()

    const scene = new SceneCompiler().compile(displayList)

    expect(scene.children[0].attributes.d).toBe(
      'M 0 0 H 10 V 10 H 0 Z M 20 20 H 25 V 25 H 20 Z'
    )
    expect(scene.children[1].attributes.d).toBe('M 1 1 L 2 2')
  })

  it('在 page defs 中生成唯一 clipPath，并在 restore 后移除引用', () => {
    const displayList = new DisplayList()
    displayList.beginGroup('page:0', 'page')
    displayList.save()
    displayList.beginPath()
    displayList.rect(0, 0, 10, 10)
    displayList.clip()
    displayList.fillRect(0, 0, 1, 1)
    displayList.beginPath()
    displayList.rect(20, 20, 5, 5)
    displayList.clip()
    displayList.fillRect(0, 0, 2, 2)
    displayList.restore()
    displayList.fillRect(0, 0, 3, 3)
    displayList.endGroup()
    displayList.beginGroup('page:1', 'page')
    displayList.fillRect(0, 0, 4, 4)
    displayList.endGroup()

    const scene = new SceneCompiler().compile(displayList)
    const page = scene.children[0]
    const rects = page.children
    const clipIds = page.defs!.map(definition => definition.key)

    expect(page.defs!.map(definition => definition.kind)).toEqual([
      'clipPath',
      'clipPath'
    ])
    expect(new Set(clipIds).size).toBe(2)
    expect(rects[0].attributes['clip-path']).toBe(`url(#${clipIds[0]})`)
    expect(rects[1].attributes['clip-path']).toBe(`url(#${clipIds[1]})`)
    expect(rects[2].attributes['clip-path']).toBeUndefined()
    expect(page.defs![1].attributes.intersects).toBe(`url(#${clipIds[0]})`)
    expect(page.defs![0].children[0]).toMatchObject({
      kind: 'path',
      attributes: {
        d: 'M 0 0 H 10 V 10 H 0 Z',
        'clip-rule': 'nonzero'
      }
    })
    expect(scene.children[1].defs).toBeUndefined()
    expect(scene.children[1].children[0].attributes['clip-path']).toBeUndefined()
  })

  it('没有 page 时将 clipPath 定义放到当前 group 作用域', () => {
    const displayList = new DisplayList()
    displayList.beginGroup('content', 'group')
    displayList.beginPath()
    displayList.rect(0, 0, 10, 10)
    displayList.translate(2, 3)
    displayList.clip()
    displayList.fillRect(0, 0, 1, 1)
    displayList.endGroup()

    const group = new SceneCompiler().compile(displayList).children[0]

    expect(group.defs).toHaveLength(1)
    expect(group.defs![0].children[0].attributes.transform).toBe(
      'matrix(1 0 0 1 2 3)'
    )
    expect(group.children[0].attributes['clip-path']).toBe(
      `url(#${group.defs![0].key})`
    )
  })

  it('pattern 使用显式 resource/revision 去重定义并保留图片引用', () => {
    const displayList = new DisplayList()
    const image = document.createElement('canvas')
    image.width = 8
    image.height = 6
    displayList.beginGroup('page:0', 'page')
    displayList.fillStyle = displayList.createPattern(image, 'repeat', {
      key: 'watermark',
      revision: 2
    })
    displayList.fillRect(0, 0, 100, 100)
    displayList.fillRect(0, 100, 100, 100)
    displayList.endGroup()

    const page = new SceneCompiler().compile(displayList).children[0]

    expect(page.defs).toHaveLength(1)
    expect(page.defs![0]).toMatchObject({
      kind: 'pattern',
      attributes: {
        href: image,
        width: 8,
        height: 6,
        repetition: 'repeat',
        patternUnits: 'userSpaceOnUse'
      }
    })
    expect(page.children[0].attributes.fill).toBe(
      `url(#${page.defs![0].key})`
    )
    expect(page.children[1].attributes.fill).toBe(
      page.children[0].attributes.fill
    )
  })

  it('resource revision 改变时生成新定义，同内容临时 Canvas 不使用对象地址作 key', () => {
    const displayList = new DisplayList()
    const first = document.createElement('canvas')
    const second = document.createElement('canvas')
    vi.spyOn(first, 'toDataURL').mockReturnValue('data:image/png;base64,same')
    vi.spyOn(second, 'toDataURL').mockReturnValue('data:image/png;base64,same')
    displayList.beginGroup('page:0', 'page')
    displayList.fillStyle = displayList.createPattern(first, 'repeat', {
      key: 'watermark',
      revision: 1
    })
    displayList.fillRect(0, 0, 1, 1)
    displayList.fillStyle = displayList.createPattern(first, 'repeat', {
      key: 'watermark',
      revision: 2
    })
    displayList.fillRect(0, 0, 1, 1)
    displayList.fillStyle = displayList.createPattern(first, 'repeat')
    displayList.fillRect(0, 0, 1, 1)
    displayList.fillStyle = displayList.createPattern(second, 'repeat')
    displayList.fillRect(0, 0, 1, 1)
    displayList.endGroup()

    const page = new SceneCompiler().compile(displayList).children[0]

    expect(page.defs).toHaveLength(3)
    expect(page.children[2].attributes.fill).toBe(
      page.children[3].attributes.fill
    )
    expect(new Set(page.defs!.map(definition => definition.key)).size).toBe(3)
  })
})

describe('SceneKey', () => {
  it('由 zone、page 和容器结构生成稳定 row key', () => {
    const zoneKey = buildZoneKey(EditorZone.HEADER, 4)
    const first = buildRowKey({
      zoneKey,
      containerKey: 'header-body',
      occurrence: 1
    })

    expect(buildPageKey(4)).toBe('page:4')
    expect(buildLayerKey(4, 'content')).toBe('page:4:layer:content')
    expect(zoneKey).toBe('zone:4:header')
    expect(
      buildRowKey({
        zoneKey,
        containerKey: 'header-body',
        occurrence: 1
      })
    ).toBe(first)
    expect(first).not.toBe(
      buildRowKey({
        zoneKey: buildZoneKey(EditorZone.FOOTER, 4),
        containerKey: 'header-body',
        occurrence: 1
      })
    )
  })

  it('occurrence 只在各自容器内作为回退，不产生跨容器冲突', () => {
    const zoneKey = buildZoneKey(EditorZone.MAIN, 0)
    const payload = { zoneKey, occurrence: 0 }

    expect(
      buildRowKey({ ...payload, containerKey: 'table-a/td-0' })
    ).not.toBe(buildRowKey({ ...payload, containerKey: 'table-a/td-1' }))
  })

  it('fragment key 包含表格身份、嵌套路径和拆分边界', () => {
    const payload = {
      containerKey: 'zone:1:main',
      tableId: 'table-1',
      tablePath: ['table-0/tr-0/td-0'],
      startTrIndex: 8,
      endTrIndex: 17,
      startSplitTrOffset: 20,
      endSplitTrHeight: 40
    }
    const key = buildTableFragmentKey(payload)

    expect(buildTableFragmentKey(payload)).toBe(key)
    expect(key).not.toBe(
      buildTableFragmentKey({ ...payload, startTrIndex: 17, endTrIndex: 20 })
    )
    expect(key).not.toBe(
      buildTableFragmentKey({ ...payload, tablePath: ['table-0/tr-1/td-0'] })
    )
  })

  it('repeat key 使用 fragment 和源表头位置，与普通行 key 隔离', () => {
    const fragmentKey = buildTableFragmentKey({
      containerKey: 'zone:1:main',
      tableId: 'table-1',
      tablePath: [],
      startTrIndex: 8,
      endTrIndex: 17
    })
    const payload = {
      fragmentKey,
      trIndex: 0,
      tdIndex: 1,
      tdId: 'td-header'
    }

    expect(buildRepeatHeaderKey(payload)).toBe(
      buildRepeatHeaderKey(payload)
    )
    expect(buildRepeatHeaderKey(payload)).not.toBe(fragmentKey)
    expect(buildRepeatHeaderKey(payload)).not.toBe(
      buildRepeatHeaderKey({ ...payload, trIndex: 1 })
    )
  })
})
