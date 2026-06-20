import { vi } from 'vitest'
import Editor from '@/editor'
import type { IEditorData, IEditorOption } from '@/editor/interface/Editor'
import type { IElement } from '@/editor/interface/Element'
import { createOptions } from './options'

vi.mock('@/editor/core/worker/WorkerManager', () => {
  return {
    WorkerManager: class MockWorkerManager {
      private draw: any
      constructor(draw: any) {
        this.draw = draw
      }
      getWordCount(): Promise<number> {
        return Promise.resolve(0)
      }
      getCatalog(): Promise<null> {
        return Promise.resolve(null)
      }
      getGroupIds(): Promise<string[]> {
        return Promise.resolve([])
      }
      getValue(options?: any): Promise<any> {
        const data = this.draw.getOriginValue ? this.draw.getOriginValue(options) : { main: [] }
        return Promise.resolve({
          version: '0.9.132',
          data,
          options: {}
        })
      }
      destroy(): void {}
    }
  }
})

export interface CreateTestEditorParams {
  data?: IElement[] | IEditorData
  options?: Partial<IEditorOption>
  container?: HTMLDivElement
}

export interface TestEditorContext {
  editor: Editor
  container: HTMLDivElement
  destroy: () => void
}

export function createTestEditor(params: CreateTestEditorParams = {}): TestEditorContext {
  const container = params.container ?? document.createElement('div')
  if (!container.isConnected) document.body.appendChild(container)

  const data = params.data ?? { header: [], main: [{ value: '\n' }], footer: [] }
  const options = createOptions(params.options)
  const editor = new Editor(container, data as any, options as IEditorOption)

  let destroyed = false
  const destroy = () => {
    if (destroyed) return
    destroyed = true
    try {
      editor.destroy()
    } catch {
      /* ignore destroy errors during teardown */
    }
    if (container.parentNode) container.parentNode.removeChild(container)
  }

  return { editor, container, destroy }
}
