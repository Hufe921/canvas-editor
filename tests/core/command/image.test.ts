import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor } from '../../factories/editor'

describe('图片命令', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('executeImage 插入图片不抛错', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeFocus()
    expect(() => {
      ctx.editor.command.executeImage({
        width: 100,
        height: 100,
        value: 'data:image/png;base64,test'
      })
    }).not.toThrow()
  })

  it('executeReplaceImageElement 空操作不抛错', () => {
    ctx = createTestEditor()
    expect(() => {
      ctx.editor.command.executeReplaceImageElement('data:image/png;base64,new')
    }).not.toThrow()
  })

  it('executeSetImageCaption 空操作不抛错', () => {
    ctx = createTestEditor()
    expect(() => {
      ctx.editor.command.executeSetImageCaption({ value: 'caption' })
    }).not.toThrow()
  })
})
