import type { Context2d, jsPDF } from 'jspdf'

// PDF 画布目标：IRenderContext 的可支持子集。
// 重放器只面向该接口编程，底层写入实现可替换
export interface IPdfCanvas {
  fillStyle: string
  strokeStyle: string
  font: string
  globalAlpha: number
  textAlign: 'center' | 'end' | 'left' | 'right' | 'start'
  textBaseline: CanvasTextBaseline
  lineWidth: number
  lineCap: 'butt' | 'round' | 'square'
  lineJoin: 'bevel' | 'miter' | 'round'
  save(): void
  restore(): void
  setLineDash(segments: number[]): void
  fillRect(x: number, y: number, width: number, height: number): void
  strokeRect(x: number, y: number, width: number, height: number): void
  fillPatternRect(
    image: CanvasImageSource,
    repetition: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): void
  beginPath(): void
  closePath(): void
  moveTo(x: number, y: number): void
  lineTo(x: number, y: number): void
  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise?: boolean
  ): void
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void
  bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ): void
  fill(): void
  stroke(): void
  clip(): void
  fillText(text: string, x: number, y: number): void
  translate(x: number, y: number): void
  scale(x: number, y: number): void
  rotate(angle: number): void
  drawImage(
    image: CanvasImageSource,
    x: number,
    y: number,
    width: number,
    height: number
  ): void
}

interface IPdfImage {
  src: string
  width: number
  height: number
}

// 底层 addImage 仅稳定支持 PNG/JPEG 数据源，图像统一经临时画布转码 PNG；
// 跨域污染画布无法转码时回退原始 src
function resolveImage(image: CanvasImageSource): IPdfImage {
  let width = 1
  let height = 1
  const canvas = document.createElement('canvas')
  if (image instanceof HTMLImageElement) {
    width = image.naturalWidth || image.width || 1
    height = image.naturalHeight || image.height || 1
  } else {
    const size = image as unknown as { width: number; height: number }
    width = size.width || 1
    height = size.height || 1
  }
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, 0, 0, width, height)
  try {
    return { src: canvas.toDataURL('image/png'), width, height }
  } catch {
    const fallback = image instanceof HTMLImageElement ? image.src : ''
    return { src: fallback, width, height }
  }
}

// IPdfCanvas 默认实现（内部经 jsPDF context2d 写入）
export class PdfCanvas implements IPdfCanvas {
  private readonly ctx: Context2d

  constructor(doc: jsPDF) {
    this.ctx = doc.context2d
  }

  public set fillStyle(value: string) {
    this.ctx.fillStyle = value
  }

  public set strokeStyle(value: string) {
    this.ctx.strokeStyle = value
  }

  public set font(value: string) {
    // 底层 parseFontFamily 无法解析未加引号的多词字体名（如 Microsoft YaHei），
    // 会回退默认字体导致 CJK 乱码，这里统一给 family 加引号
    const pxIndex = value.indexOf('px ')
    if (~pxIndex) {
      const prefix = value.slice(0, pxIndex + 2)
      let family = value.slice(pxIndex + 3).trim()
      if (
        family.includes(' ') &&
        !family.startsWith('"') &&
        !family.startsWith("'")
      ) {
        family = `"${family}"`
      }
      this.ctx.font = `${prefix} ${family}`
    } else {
      this.ctx.font = value
    }
  }

  public set globalAlpha(value: number) {
    this.ctx.globalAlpha = value
  }

  public set textAlign(value: 'center' | 'end' | 'left' | 'right' | 'start') {
    this.ctx.textAlign = value
  }

  public set textBaseline(value: CanvasTextBaseline) {
    this.ctx.textBaseline = value
  }

  public set lineWidth(value: number) {
    this.ctx.lineWidth = value
  }

  public set lineCap(value: 'butt' | 'round' | 'square') {
    const ctx = this.ctx as unknown as Record<string, unknown>
    if ('lineCap' in ctx) ctx.lineCap = value
  }

  public set lineJoin(value: 'bevel' | 'miter' | 'round') {
    const ctx = this.ctx as unknown as Record<string, unknown>
    if ('lineJoin' in ctx) ctx.lineJoin = value
  }

  public save(): void {
    this.ctx.save()
  }

  public restore(): void {
    this.ctx.restore()
  }

  public setLineDash(segments: number[]): void {
    const ctx = this.ctx as unknown as Record<string, unknown>
    if (typeof ctx.setLineDash === 'function') {
      ;(ctx.setLineDash as (segments: number[]) => void)(segments)
    }
  }

  public fillRect(x: number, y: number, width: number, height: number): void {
    this.ctx.fillRect(x, y, width, height)
  }

  public strokeRect(x: number, y: number, width: number, height: number): void {
    this.ctx.strokeRect(x, y, width, height)
  }

  public fillPatternRect(
    image: CanvasImageSource,
    repetition: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    if (repetition !== 'repeat') {
      console.info('PDF export: unsupported pattern repetition, skipped')
      return
    }
    const source = resolveImage(image)
    if (!source.width || !source.height) return
    // 模拟 canvas pattern：以用户空间原点为锚点平铺瓦片
    const startX = Math.floor(x / source.width) * source.width
    const startY = Math.floor(y / source.height) * source.height
    for (let tileY = startY; tileY < y + height; tileY += source.height) {
      for (let tileX = startX; tileX < x + width; tileX += source.width) {
        this.ctx.drawImage(
          source.src,
          tileX,
          tileY,
          source.width,
          source.height
        )
      }
    }
  }

  public beginPath(): void {
    this.ctx.beginPath()
  }

  public closePath(): void {
    this.ctx.closePath()
  }

  public moveTo(x: number, y: number): void {
    this.ctx.moveTo(x, y)
  }

  public lineTo(x: number, y: number): void {
    this.ctx.lineTo(x, y)
  }

  public arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise?: boolean
  ): void {
    this.ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise ?? false)
  }

  public quadraticCurveTo(
    cpx: number,
    cpy: number,
    x: number,
    y: number
  ): void {
    this.ctx.quadraticCurveTo(cpx, cpy, x, y)
  }

  public bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ): void {
    this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)
  }

  public fill(): void {
    this.ctx.fill()
  }

  public stroke(): void {
    this.ctx.stroke()
  }

  public clip(): void {
    this.ctx.clip()
  }

  public fillText(text: string, x: number, y: number): void {
    this.ctx.fillText(text, x, y)
  }

  public translate(x: number, y: number): void {
    this.ctx.translate(x, y)
  }

  public scale(x: number, y: number): void {
    this.ctx.scale(x, y)
  }

  public rotate(angle: number): void {
    this.ctx.rotate(angle)
  }

  public drawImage(
    image: CanvasImageSource,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const source = resolveImage(image)
    this.ctx.drawImage(source.src, x, y, width, height)
  }
}
