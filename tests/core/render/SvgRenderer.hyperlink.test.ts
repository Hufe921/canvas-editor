import { describe, expect, it } from 'vitest'
import { BackendType } from '@/editor/dataset/enum/Editor'
import { createTestEditor } from '../../factories/editor'

function nextFrame() {
  return new Promise<void>(resolve => {
    setTimeout(resolve, 20)
  })
}

describe('SvgRenderer hyperlink', () => {
  it('空文档插入超链接并经过多帧更新不会丢失节点映射', async () => {
    const { editor, destroy } = createTestEditor({
      data: [{ value: '\n' }],
      options: { backend: BackendType.SVG }
    })
    editor.command.executeSelectAll()
    editor.command.executeBackspace()

    editor.command.executeHyperlink({
      url: 'https://example.com',
      valueList: [{ value: 'link' }]
    })
    await nextFrame()
    editor.command.executeSetRange(0, 4)
    await nextFrame()

    expect(editor.command.getValue().data.main[0].type).toBe('hyperlink')
    expect(editor.command.getRangeText()).toBe('link')
    destroy()
  })

  it('普通文本后插入超链接并更新选区不会丢失节点映射', async () => {
    const { editor, destroy } = createTestEditor({
      data: [{ value: 'before ' }, { value: '\n' }],
      options: { backend: BackendType.SVG }
    })
    editor.command.executeSetRange(7, 7)

    editor.command.executeHyperlink({
      url: 'https://example.com',
      valueList: [{ value: 'link' }]
    })
    await nextFrame()
    editor.command.executeSetRange(7, 11)
    await nextFrame()

    expect(editor.command.getRangeText()).toBe('link')
    destroy()
  })
})
