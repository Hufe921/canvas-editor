import type { IEditorData, IEditorOption } from './Editor'

// PDF 内嵌字体：family 需与编辑器元素使用的字体名一致，
// src 支持 URL 或 base64 dataURL，建议与编辑器 FontFace 加载同一份字体文件以保证度量一致
export interface IPdfExportFont {
  family: string
  src: string
  style?: string
}

export interface IExportPdfOption {
  // 离屏渲染自定义数据（不传则导出当前编辑器内容）
  data?: IEditorData
  options?: IEditorOption
  offscreen?: boolean
  filename?: string
  fonts?: IPdfExportFont[]
  documentProperties?: Record<string, string>
  // 是否自动触发下载，默认 true
  download?: boolean
}
