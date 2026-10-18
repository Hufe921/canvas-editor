export type EditorRuntimeState =
  | 'initializing'
  | 'ready'
  | 'failed'
  | 'destroyed'

export type EditorRuntimeErrorCode =
  | 'EDITOR_NOT_READY'
  | 'EDITOR_INITIALIZATION_FAILED'
  | 'EDITOR_DESTROYED'
