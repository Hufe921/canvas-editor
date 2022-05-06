import { IEditorResult } from '../editor'
import { jsPDF } from 'jspdf'

export const buildPdf = (payload: IEditorResult) => {
  const { width, height, data } = payload
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'px',
    format: [width, height],
    hotfixes: ['px_scaling'],
    compress: true
  })
  // 添加字体
  doc.addFont('/src/assets/font/msyh.ttf', 'Yahei', 'normal')
  doc.setFont('Yahei')

  // 上下文
  const ctx = doc.context2d

  // 渲染
  for (let d = 0; d < data.length; d++) {
    const element = data[d]
    ctx.fillText(element.value, 0, 0)
  }

  // 新页面显示
  const uri = doc.output('bloburi')
  window.open(uri, '_blank')
}