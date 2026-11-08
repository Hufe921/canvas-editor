import { describe, expect, it } from 'vitest'
import {
  ElementListSnapshot,
  restoreHistoryElementList
} from '@/editor/core/history/ElementListSnapshot'
import type { IElement } from '@/editor/interface/Element'

function createElements(values: string[]): IElement[] {
  return values.map(value => ({ value }))
}

describe('ElementListSnapshot', () => {
  it('仅克隆脏区间并共享区间外历史副本', () => {
    const cache = new ElementListSnapshot()
    const elements = createElements(['a', 'b', 'd', 'e'])
    const first = cache.capture(elements)
    elements.splice(2, 0, { value: 'c' })

    const second = cache.capture(elements, { startIndex: 2, endIndex: 4 })

    expect(second.map(element => element.value)).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e'
    ])
    expect(second[0]).toBe(first[0])
    expect(second[1]).toBe(first[1])
    expect(second[4]).toBe(first[3])
    expect(second[2]).not.toBe(elements[2])
  })

  it('删除后按新长度映射后缀', () => {
    const cache = new ElementListSnapshot()
    const elements = createElements(['a', 'b', 'c', 'd', 'e'])
    const first = cache.capture(elements)
    elements.splice(1, 2)

    const second = cache.capture(elements, { startIndex: 1, endIndex: 2 })

    expect(second.map(element => element.value)).toEqual(['a', 'd', 'e'])
    expect(second[0]).toBe(first[0])
    expect(second[2]).toBe(first[4])
  })

  it('源元素接缝不一致时退化为完整新快照', () => {
    const cache = new ElementListSnapshot()
    const first = cache.capture(createElements(['a', 'b']))
    const replaced = createElements(['a', 'b'])

    const second = cache.capture(replaced, { startIndex: 0, endIndex: 1 })

    expect(second.map(element => element.value)).toEqual(['a', 'b'])
    expect(second[1]).not.toBe(first[1])
  })

  it('重置后不再复用历史副本', () => {
    const cache = new ElementListSnapshot()
    const elements = createElements(['a'])
    const first = cache.capture(elements)
    cache.reset()

    const second = cache.capture(elements)

    expect(second[0]).not.toBe(first[0])
  })

  it('撤销插入时复用区间外当前元素并克隆目标脏区间', () => {
    const current = createElements(['a', 'x', 'b'])
    const target = createElements(['a', 'b'])

    const restored = restoreHistoryElementList(
      current,
      target,
      { startIndex: 1, endIndex: 3 },
      'undo'
    )

    expect(restored.elementList.map(element => element.value)).toEqual([
      'a',
      'b'
    ])
    expect(restored.elementList[0]).toBe(current[0])
    expect(restored.elementList[1]).not.toBe(target[1])
    expect(restored.deleteCount).toBe(2)
    expect(restored.insertCount).toBe(1)
  })

  it('重做插入时按正向区间恢复长度和文本', () => {
    const current = createElements(['a', 'b'])
    const target = createElements(['a', 'x', 'b'])

    const restored = restoreHistoryElementList(
      current,
      target,
      { startIndex: 1, endIndex: 3 },
      'redo'
    )

    expect(restored.elementList.map(element => element.value)).toEqual([
      'a',
      'x',
      'b'
    ])
    expect(restored.elementList[0]).toBe(current[0])
    expect(restored.elementList[1]).not.toBe(target[1])
    expect(restored.deleteCount).toBe(1)
    expect(restored.insertCount).toBe(2)
  })

  it('历史区间无效时完整克隆且不提供增量提示', () => {
    const current = createElements(['a'])
    const target = createElements(['a', 'b'])

    const restored = restoreHistoryElementList(
      current,
      target,
      { startIndex: 1, endIndex: 3 },
      'undo'
    )

    expect(restored.elementList).toEqual(target)
    expect(restored.elementList).not.toBe(target)
    expect(restored.elementList[0]).not.toBe(target[0])
    expect(restored.deleteCount).toBeUndefined()
    expect(restored.insertCount).toBeUndefined()
  })
})
