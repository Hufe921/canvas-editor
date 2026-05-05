import { describe, it, expect, afterEach } from 'vitest'
import { createTestEditor } from '../../factories/editor'

describe('水印命令', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('executeAddWatermark 添加水印', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeAddWatermark({ data: '机密', color: '#000000' })
    const options = ctx.editor.command.getOptions()
    expect(options.watermark?.data).toBe('机密')
  })

  it('executeDeleteWatermark 删除水印', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeAddWatermark({ data: '机密' })
    ctx.editor.command.executeDeleteWatermark()
    const options = ctx.editor.command.getOptions()
    expect(options.watermark?.data).toBeFalsy()
  })
})
