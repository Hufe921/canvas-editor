import { PaperDirection } from '../../dataset/enum/Editor'
import type { IPdfExportFont } from '../../interface/ExportPdf'
import type { DisplayList } from '../render/model/DisplayList'
import { DisplayListReplayer } from './DisplayListReplayer'
import { PdfCanvas } from './PdfCanvas'

export interface IPdfExportPayload {
  displayLists: DisplayList[]
  width: number
  height: number
  pageDirections?: PaperDirection[]
  fonts?: IPdfExportFont[]
  documentProperties?: Record<string, string>
}

function getPageSize(
  width: number,
  height: number,
  direction?: PaperDirection
): { width: number; height: number } {
  if (direction === PaperDirection.HORIZONTAL) {
    return { width: height, height: width }
  }
  return { width, height }
}

// 消费每页 DisplayList 生成 PDF，
// 底层写入器实现 IPdfCanvas，可整体替换
export class PdfExport {
  constructor(private readonly payload: IPdfExportPayload) {}

  public async export(): Promise<ArrayBuffer> {
    const { displayLists, width, height, pageDirections, fonts } = this.payload
    const { jsPDF } = await import('jspdf')
    const firstDirection = pageDirections?.[0]
    const firstSize = getPageSize(width, height, firstDirection)
    const doc = new jsPDF({
      orientation:
        firstDirection === PaperDirection.HORIZONTAL
          ? 'landscape'
          : 'portrait',
      unit: 'px',
      format: [firstSize.width, firstSize.height],
      hotfixes: ['px_scaling'],
      compress: true
    })
    for (const font of fonts ?? []) {
      doc.addFont(font.src, font.family, font.style ?? 'normal')
    }
    if (this.payload.documentProperties) {
      doc.setDocumentProperties(this.payload.documentProperties)
    }
    const canvas = new PdfCanvas(doc)
    const replayer = new DisplayListReplayer()
    displayLists.forEach((displayList, index) => {
      if (index > 0) {
        const direction = pageDirections?.[index]
        const size = getPageSize(width, height, direction)
        doc.addPage(
          [size.width, size.height],
          direction === PaperDirection.HORIZONTAL ? 'landscape' : 'portrait'
        )
      }
      replayer.replay(canvas, displayList)
    })
    const data = doc.output('arraybuffer')
    return data as ArrayBuffer
  }
}
