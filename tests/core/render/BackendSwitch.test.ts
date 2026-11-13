import { describe, expect, it } from 'vitest'
import { BackendType } from '@/editor/dataset/enum/Editor'
import { createTestEditor } from '../../factories/editor'

describe('Backend 切换', () => {
  it('切换后端时保留文档并复用 Editor，同后端不重复创建页面', () => {
    const { editor, container, destroy } = createTestEditor({
      data: [{ value: 'backend switch' }],
      options: { backend: BackendType.SVG }
    })
    const originalPage = container.querySelector('svg')

    expect(editor.command.executeSetBackend).toBeTypeOf('function')
    editor.command.executeSetBackend(BackendType.SVG)
    expect(container.querySelector('svg')).toBe(originalPage)
    editor.command.executeSetBackend(BackendType.CANVAS)

    expect(
      container.querySelector('.ce-page-container > canvas')
    ).not.toBeNull()
    expect(container.querySelector('.ce-page-container > svg')).toBeNull()
    expect(editor.command.getOptions().backend).toBe(BackendType.CANVAS)
    expect(editor.command.getText().main).toContain('backend switch')

    editor.command.executeSetBackend(BackendType.SVG)

    expect(container.querySelector('.ce-page-container > svg')).not.toBeNull()
    expect(container.querySelector('.ce-page-container > canvas')).toBeNull()
    expect(editor.command.getOptions().backend).toBe(BackendType.SVG)
    expect(editor.command.getText().main).toContain('backend switch')
    destroy()
  })
})
