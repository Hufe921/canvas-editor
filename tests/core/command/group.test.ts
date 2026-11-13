import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor } from '../../factories/editor'

describe('成组命令', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('getGroupRectList 返回组矩形列表', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    ctx.editor.command.executeInsertElementList([{ value: 'hello group' }])
    ctx.editor.command.executeSelectAll()
    const groupId = ctx.editor.command.executeSetGroup()
    expect(groupId).toBeTruthy()

    const rectList = ctx.editor.command.getGroupRectList(groupId!)
    expect(Array.isArray(rectList)).toBe(true)
    expect(rectList!.length).toBeGreaterThan(0)
    for (const rect of rectList!) {
      expect(Number.isFinite(rect.x)).toBe(true)
      expect(Number.isFinite(rect.y)).toBe(true)
      expect(rect.width).toBeGreaterThanOrEqual(0)
      expect(rect.height).toBeGreaterThan(0)
    }
  })

  it('getGroupRectList 组跨行时按行拆分矩形', () => {
    ctx = createTestEditor({
      data: [
        { value: 'a', groupIds: ['g1'] },
        { value: 'b', groupIds: ['g1'] },
        { value: '\n', groupIds: ['g1'] },
        { value: 'c', groupIds: ['g1'] },
        { value: 'd', groupIds: ['g1'] },
        { value: '\n' }
      ]
    })

    const rectList = ctx.editor.command.getGroupRectList('g1')
    expect(rectList).toBeTruthy()
    expect(rectList!.length).toBe(2)
    expect(rectList![1].y).toBeGreaterThan(rectList![0].y)
  })

  it('getGroupRectList 不存在的 groupId 返回 null', () => {
    ctx = createTestEditor()
    expect(ctx.editor.command.getGroupRectList('not-exist')).toBeNull()
  })
})
