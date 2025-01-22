import { CERenderingContext, DrawArea, FontProperty, LineDrawer, LineProperty } from '../interface/CERenderingContext'
import { getUUID } from '../utils'
import { ITextMetrics } from '../interface/Text'
import { Draw } from '../core/draw/Draw'
import jsPDF from 'jspdf'


const canvas = document.createElement('canvas')
const canvasCtx = canvas.getContext('2d')!
const svgDataPrefix = 'data:image/svg+xml;base64,'

export class PdfCERenderingContext implements CERenderingContext {

  private textDirection: any = {}
  private promises: Promise<any>[] = []

  constructor(private pageNo: number, private doc: jsPDF) {
  }

  get currentPage() {
    return this.pageNo
  }

  get pdf() {
    return this.doc
  }

  get ctx() {
    return this.doc.context2d
  }

  public loadOver() {
    return Promise.all(this.promises)
  }

  public drawImage(value: HTMLImageElement | string, dx: number, dy: number, width: number, height: number): void {
    if (typeof value === 'string') {
      const pr = this._getSvgCanvasFromStr(value, width, height).then(v => {
        this._execRestore(() => {
          this.doc.setGState(this.doc.GState({ opacity: 1, 'stroke-opacity': 1 }))
          this.doc.addImage(v, '', dx, dy, width, height, '', 'FAST')
        })
      })
      this.promises.push(pr)
    } else {
      if (value.src && value.src.startsWith(svgDataPrefix)) {
        const pr = this._getSvgCanvasFromImgEle(value, width, height).then(v => {
          this._execRestore(() => {
            this.doc.setGState(this.doc.GState({ opacity: 1, 'stroke-opacity': 1 }))
            this.doc.addImage(v, '', dx, dy, width, height, '', 'FAST')
          })
        })
        this.promises.push(pr)
      } else {
        this._execRestore(() => {
          this.doc.setGState(this.doc.GState({ opacity: 1, 'stroke-opacity': 1 }))
          this.doc.addImage(value, '', dx, dy, width, height, '', 'FAST')
        })
      }
    }
  }

  private _getSvgCanvasFromImgEle(img: HTMLImageElement, width: number, height: number): Promise<string|HTMLImageElement> {

    if (img.src.startsWith(svgDataPrefix)) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.clearRect(0,0,width, height)
      if (img.complete) {
        ctx.drawImage(img, 0, 0, width, height)
        return Promise.resolve(canvas.toDataURL('image/png'))
      } else {
        return new Promise(resolve => {
          img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height)
            resolve(canvas.toDataURL('image/png'))
          }
        })
      }
    } else {
      if (img.complete) {
        return Promise.resolve(img)
      } else {
        return  new Promise((resolve) => {
          if (img.complete) {
            resolve(img)
          } else {
            img.onload = () => {
              resolve(img)
            }
          }
        })
      }
    }
  }

  private _getSvgCanvasFromStr(svgData: string, width: number, height: number): Promise<string> {
    const cvs = document.createElement('canvas')
    cvs.width = width
    cvs.height = height
    if (!svgData) {
      return Promise.resolve(cvs.toDataURL('image/png'))
    }

    const img = new Image()
    const ctx = cvs.getContext('2d')!
    ctx.clearRect(0, 0, width, height)
    return new Promise<string>((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height)
        resolve(cvs.toDataURL('image/png'))
      }
      if (svgData.startsWith('<svg')) {
        img.innerHTML = svgData
      }
      if (svgData.startsWith(svgDataPrefix)) {
        img.src = svgData
      }

    })
  }

  fillRect(x: number, y: number, width: number, height: number, prop: LineProperty): void {
    this._execRestore(() => {
      if (prop.translate) {
        this.translate(...prop.translate)
      }
      this.doc.setFillColor(prop.fillColor ?? '#fff')
      this.doc.setGState(this.doc.GState({ opacity: prop.alpha ?? 1 }))
      this.doc.rect(x, y, width, height, 'F')
    })
  }

  strokeRect(x: number, y: number, width: number, height: number, prop: LineProperty): void {
    this._execRestore(() => {
      if (prop.translate) {
        this.translate(...prop.translate)
      }
      this.doc.setDrawColor(prop.fillColor ?? '#000')
      this.doc.setGState(this.doc.GState({ 'stroke-opacity': prop.alpha ?? 1 }))
      this.doc.rect(x, y, width, height, 'S')
    })
  }

  circle(x: number, y: number, r: number, prop: LineProperty): void {

    this._execRestore(() => {

      let style
      if (prop.fillColor && prop.color) {
        style = 'FD'
        this.doc.setFillColor(prop.fillColor)
        this.doc.setDrawColor(prop.color)
      } else {
        if (prop.fillColor) {
          style = 'F'
          this.doc.setFillColor(prop.fillColor)
        }
        if (prop.color) {
          style = 'S'
          this.doc.setDrawColor(prop.color)
        }
      }

      this.doc.circle(x, y, r, style)
    })
  }


  line(prop: LineProperty): LineDrawer {
    return new PdfRenderingContextLineDrawer(this, prop)
  }

  text(text: string, x: number, y: number, prop: FontProperty): void {
    this._execRestore(() => {
      if (prop.font) this.ctx.font = prop.font
      if (prop.size) this.doc.setFontSize(prop.size)
      if (prop.color) this.doc.setTextColor(prop.color)
      if (prop.translate && prop.translate.length === 2) this.translate(...prop.translate)
      if (prop.alpha || prop.alpha === 0) this.doc.setGState(this.doc.GState({ opacity: prop.alpha ?? 1 }))
      this.doc.text(text, x, y, {
        align: prop.textAlign,
        baseline: prop.textBaseline,
        ...this.textDirection
      })
    })
  }

  private _execRestore(exec: () => void): void {
    const pn = this.doc.getCurrentPageInfo().pageNumber
    this.doc.setPage(this.pageNo)
    this.doc.saveGraphicsState()
    try {
      exec()
    } finally {
      this.doc.setPage(pn)
      this.doc.restoreGraphicsState()
    }
  }

  translate(x: number, y: number): void {
    // https://stackoverflow.com/questions/77509324/how-to-use-setcurrenttransformationmatrix-in-jspdf
    // https://github.com/parallax/jsPDF/blob/ddbfc0f0250ca908f8061a72fa057116b7613e78/jspdf.js#L791
    const matrix = this.doc.Matrix(1.0, 0.0, 0.0, 1.0, x / (96 / 72), -y / (96 / 72))
    this.doc.setCurrentTransformationMatrix(matrix)
  }

  scale(scaleWidth: number, scaleHeight: number): void {
    const matrix = this.doc.Matrix(scaleWidth, 0.0, 0.0, scaleHeight, 0.0, 0.0)
    this.doc.setCurrentTransformationMatrix(matrix)
  }

  initPageContext(scale: number, direction: string): void {
    const matrix = this.doc.Matrix(scale, 0.0, 0.0, scale, 0.0, 0.0)
    this.doc.setCurrentTransformationMatrix(matrix)
    if (direction === 'rtl') {
      this.pdf.setR2L(true)
    }
  }

  setGlobalAlpha(alpha: number): void {
    // pdf
    this.ctx.globalAlpha = alpha
  }

  getGlobalAlpha(): number {
    return this.ctx.globalAlpha
  }

  // 这个方法返回值不准确，jspdf 中没有打到对应的接口
  measureText(text: string, prop: FontProperty): ITextMetrics {
    let font
    if (prop && prop.size && prop.font) {
      font = `${prop.fontStyle ?? ''} ${prop.fontWeight ?? ''} ${prop.size ? `${prop.size}px` : ''} ${prop.font ?? ''}`
    }

    if (font && font.trim().length > 0) {
      canvasCtx.save()
      canvasCtx.font = font
    }
    const metrics = canvasCtx.measureText(text)
    if (font && font.trim().length > 0) {
      canvasCtx.restore()
    }
    return metrics
  }

  getFont(): string {
    const font = this.doc.getFont()
    const size = this.doc.getFontSize()
    return `${size}px ${font.fontStyle} ${font.fontName}`
  }

  addWatermark(data: HTMLCanvasElement, area: DrawArea): void {

    this._execRestore(() => {

      const { startX, startY, height, width } = area
      const dataW = data.width
      const dataH = data.height

      const y = Math.ceil(height / dataH)
      const x = Math.ceil(width / dataW)
      if (area.alpha || area.alpha === 0) this.doc.setGState(this.doc.GState({ opacity: area.alpha ?? 1 }))
      const alias = getUUID()
      for (let i = 0; i < y; i++) {
        for (let j = 0; j < x; j++) {
          this.pdf.addImage({
            imageData: data.toDataURL('image/png'), x: startX + j * dataW, y: startY + i * dataH, width: dataW, height: dataH, alias
          })
        }
      }
    })
  }

  addWatermarkSingle(data: string, draw: Draw, prop: FontProperty, metrics: ITextMetrics): void {
    const width = draw.getWidth()
    const height = draw.getHeight()
    const rotatedTextWidth = metrics.width * Math.sin(45)
    const rotatedTextOffset = metrics.actualBoundingBoxAscent * Math.sin(45)
    const tx = (width - rotatedTextWidth) / 2 + (rotatedTextOffset)
    const ty = (height - rotatedTextWidth) / 2 + rotatedTextWidth - (rotatedTextOffset / 2)
    this._execRestore(() => {
      if (prop.font) this.ctx.font = `${prop.size ?? 120}px ${prop.font}`
      if (prop.color) this.doc.setTextColor(prop.color)
      if (prop.alpha || prop.alpha === 0) this.doc.setGState(this.doc.GState({ opacity: prop.alpha ?? 1 }))

      this.doc.text(data, tx, ty, undefined, 45)
    })
  }

  cleanPage(): void {
    this.doc.deletePage(this.pageNo - 1)
    this.doc.insertPage(this.pageNo - 1)
  }
}

export class PdfRenderingContextLineDrawer implements LineDrawer {
  private actions: (() => void)[] = []
  private _beforeDraw: ((ctx: CERenderingContext) => void) | null = null
  private readonly alpha: number
  private readonly lineWidth: number
  private readonly strikeoutColor: string

  constructor(private ctx: PdfCERenderingContext, private prop: LineProperty) {
    this.alpha = this.prop.alpha ?? 1
    this.lineWidth = this.prop.lineWidth ?? 1
    this.strikeoutColor = this.prop.color ?? '#000'
  }

  beforeDraw(action: (ctx: CERenderingContext) => void): LineDrawer {
    this._beforeDraw = action
    return this
  }


  draw(): void {
    if (!this.actions.length) {
      return
    }
    const pn = this.ctx.pdf.getCurrentPageInfo().pageNumber
    const doc = this.ctx.pdf
    doc.setPage(this.ctx.currentPage)
    doc.saveGraphicsState()
    doc.setLineWidth(this.lineWidth)
    doc.setGState(doc.GState({ 'stroke-opacity': this.alpha }))
    doc.setDrawColor(this.strikeoutColor)
    if (this.prop.lineCap) {
      doc.setLineCap(this.prop.lineCap)
    }
    if (this.prop.lineJoin) {
      doc.setLineJoin(this.prop.lineJoin)
    }
    if (this.prop.lineDash) {
      doc.setLineDashPattern(this.prop.lineDash, 0)
    }
    try {
      if (typeof this._beforeDraw === 'function') {
        this._beforeDraw(this.ctx)
      }
      for (let i = 0; i < this.actions.length; i++) {
        this.actions[i]()
      }
    } finally {
      doc.setPage(pn)
      doc.restoreGraphicsState()
    }
  }

  path(x1: number, y1: number, x2?: number, y2?: number): LineDrawer {
    this.actions.push(() => {
      if (!x2 || !y2) {
        // 传两个参数
        this.ctx.pdf.lineTo(x1, y1)
      } else {
        this.ctx.pdf.line(x1, y1, x2, y2, 'S')
      }
    })
    return this
  }

}

