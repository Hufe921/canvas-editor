import type { IEditorData, IEditorOption } from './Editor'

export interface IPrintOption {
  offscreen?: boolean
  data?: IEditorData
  options?: IEditorOption
}
