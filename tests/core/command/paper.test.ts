import { describe, it, expect, afterEach } from 'vitest'
import { PaperDirection } from '../../../src/editor/dataset/enum/Editor'
import { createTestEditor } from '../../factories/editor'

describe('纸张与页面命令', () => {
  let ctx: ReturnType<typeof createTestEditor>
  afterEach(() => ctx?.destroy())

  it('executePaperSize 改变纸张尺寸', () => {
    ctx = createTestEditor()
    ctx.editor.command.executePaperSize(500, 700)
    expect(ctx.editor.command.getOptions().width).toBe(500)
    expect(ctx.editor.command.getOptions().height).toBe(700)
  })

  it('executePaperDirection 切换方向', () => {
    ctx = createTestEditor()
    ctx.editor.command.executePaperDirection(PaperDirection.HORIZONTAL)
    expect(ctx.editor.command.getOptions().paperDirection).toBe('horizontal')
  })

  it('executeSetPaperMargin 设置页边距', () => {
    ctx = createTestEditor()
    ctx.editor.command.executeSetPaperMargin([60, 60, 60, 60])
    const margins = ctx.editor.command.getOptions().margins
    expect(margins).toEqual([60, 60, 60, 60])
  })
})
