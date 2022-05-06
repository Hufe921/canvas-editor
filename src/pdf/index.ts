import { IEditorResult } from '../editor'
import { jsPDF } from 'jspdf'

export const buildPdf = (payload: IEditorResult) => {
  console.log('payload: ', payload)
  const { width, height } = payload
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'px',
    format: [width, height],
    hotfixes: ['px_scaling'],
  })
  const ctx = doc.context2d

  ctx.fillText('canvas-editor', 100, 100)

  const uri = doc.output('bloburi')
  window.open(uri, '_blank')
}