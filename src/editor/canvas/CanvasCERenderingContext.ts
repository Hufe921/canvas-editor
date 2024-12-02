import {
  CERenderingContext,
  DrawArea,
  FontProperty,
  LineDrawer,
  LineProperty,
  TextDirection
} from '../interface/CERenderingContext'
import { ITextMetrics } from '../interface/Text'
import { Draw } from '../core/draw/Draw'

export class CanvasCERenderingContext implements CERenderingContext {

  constructor(private ctx: CanvasRenderingContext2D) {
  }

  get canvasCtx() {
    return this.ctx
  }

  public drawImage(value: HTMLImageElement | string, dx: number, dy: number, width: number, height: number): void {
    let img
    if (typeof value === 'string') {
      img = document.createElement('img')
      img.src = value
    } else {
      img = value
    }
    this.ctx.drawImage(img, dx, dy, width, height)
  }

  public fillRect(x: number, y: number, width: number, height: number, prop: LineProperty): void {
    this._execDraw(() => {
      if (prop.translate) {
        this.ctx.translate(...prop.translate)
      }
      if (prop.alpha !== undefined) {
        this.ctx.globalAlpha = prop.alpha
      }
      if (prop.fillColor) {
        this.ctx.fillStyle = prop.fillColor ?? '#000'
      }
      this.ctx.fillRect(x, y, width, height)
    })
  }

  strokeRect(x: number, y: number, width: number, height: number, prop: LineProperty): void {
    this._execDraw(() => {
      if (prop.translate) {
        this.ctx.translate(...prop.translate)
      }
      this.ctx.globalAlpha = prop.alpha ?? 1
      if (prop.color) {
        this.ctx.strokeStyle = prop.color ?? '#000'
      }
      this.ctx.strokeRect(x, y, width, height)
    })
  }

  circle(x: number, y: number, r: number, prop: LineProperty): void {
    this._execDraw(() => {
      if (prop.translate) {
        this.ctx.translate(...prop.translate)
      }
      this.ctx.globalAlpha = prop.alpha ?? 1
      if (prop.color) {
        this.ctx.strokeStyle = prop.color ?? '#000'
      }
      if (prop.fillColor) {
        this.ctx.fillStyle = prop.fillColor ?? '#000'
      }
      this.ctx.arc(x, y, r, 0, 2 * Math.PI)
      if (prop.color) {
        this.ctx.stroke()
      }
      if (prop.fillColor) {
        this.ctx.fill()
      }
    })
  }

  private _execDraw(action: () => void) {
    this.ctx.save()
    this.ctx.beginPath()
    try {
      action()
    } finally {
      this.ctx.closePath()
      this.ctx.restore()
    }
  }

  line(prop: LineProperty): LineDrawer {
    return new CanvasRenderingContext2DLineDrawer(this, prop)
  }

  text(text: string, x: number, y: number, prop: FontProperty): void {
    this.ctx.save()
    let font = ''
    if (prop.font) {
      font = prop.font
    }
    if (prop.size) {
      font = [`${prop.size}px`, font ?? ''].join(' ')
    }
    if (font) {
      this.ctx.font = font
    }
    if (prop.color) {
      this.ctx.fillStyle = prop.color
    }
    if (prop.alpha || prop.alpha === 0) {
      this.ctx.globalAlpha = prop.alpha
    }
    if (prop.translate && prop.translate.length == 2) {
      this.ctx.translate(...prop.translate)
    }
    if (prop.rotate) {
      this.ctx.rotate(prop.rotate)
    }
    this.ctx.fillText(text, x, y)
    this.ctx.restore()
  }

  translate(x: number, y: number): void {
    this.ctx.translate(x, y)
  }

  scale(x: number, y: number): void {
    this.ctx.scale(x, y)
  }

  initPageContext(scale: number, direction: TextDirection): void {
    this.ctx.scale(scale, scale)
    // 重置以下属性是因部分浏览器(chrome)会应用css样式
    this.ctx.letterSpacing = '0px'
    this.ctx.wordSpacing = '0px'
    this.ctx.direction = direction
  }

  setGlobalAlpha(alpha: number): void {
    this.ctx.globalAlpha = alpha
  }

  getGlobalAlpha(): number {
    return this.ctx.globalAlpha
  }

  getFont(): string {
    return this.ctx.font
  }

  measureText(text: string, prop: FontProperty): ITextMetrics {
    let font
    if (prop && prop.size && prop.font) {
      font = `${prop.fontStyle ?? ''} ${prop.fontWeight ?? ''} ${prop.size ? `${prop.size}px` : ''} ${prop.font ?? ''}`
    }

    if (font && font.trim().length > 0) {
      this.ctx.save()
      this.ctx.font = font
    }
    const metrics = this.ctx.measureText(text)
    if (font && font.trim().length > 0) {
      this.ctx.restore()
    }
    return metrics
  }

  addWatermark(data: HTMLCanvasElement, area: DrawArea): void {
    // 创建平铺模式
    this.ctx.save()
    if (area.alpha || area.alpha === 0) {
      this.ctx.globalAlpha = area.alpha
    }
    const pattern = this.ctx.createPattern(data, 'repeat')
    if (pattern) {
      this.ctx.fillStyle = pattern
      this.ctx.fillRect(area.startX, area.startY, area.width, area.height)
    }
    this.ctx.restore()

  }

  addWatermarkSingle(data: string, draw: Draw, prop: FontProperty, metrics: ITextMetrics): void {
    const width = draw.getWidth()
    const height = draw.getHeight()
    const {watermark: {size}} = draw.getOptions()
    prop.translate = [width/2, height/2]
    prop.rotate = -45 * Math.PI/180
    this.text(data,  -metrics.width / 2,
      metrics.actualBoundingBoxAscent - size / 2, prop)
  }



  cleanPage(pageWidth: number, pageHeight: number): void {
    this.ctx.clearRect(0, 0, pageWidth, pageHeight)
  }
}

export class CanvasRenderingContext2DLineDrawer implements LineDrawer {
  private actions: (() => void)[] = []
  private _beforeDraw: ((ctx: CERenderingContext) => void) | null = null
  private readonly alpha: number
  private readonly lineWidth: number
  private readonly strikeoutColor: string
  private readonly ctx: CanvasRenderingContext2D

  constructor(private _ctx: CanvasCERenderingContext, private prop: LineProperty) {
    this.alpha = this.prop.alpha ?? 1
    this.lineWidth = this.prop.lineWidth ?? 1
    this.strikeoutColor = this.prop.color ?? '#000'
    this.ctx = _ctx.canvasCtx
  }

  beforeDraw(action: (ctx: CERenderingContext) => void): LineDrawer {
    this._beforeDraw = action
    return this
  }


  path(x1: number, y1: number, x2?: number, y2?: number): LineDrawer {
    this.actions.push(() => {

      if (typeof x2 !== 'number' || typeof y2 !== 'number') {
        this.ctx.lineTo(x1, y1)
      } else {
        this.ctx.moveTo(x1, y1)
        this.ctx.lineTo(x2, y2)
      }
    })
    return this
  }


  public draw() {
    if (!this.actions.length) {
      return
    }
    this.ctx.save()
    this.ctx.globalAlpha = this.alpha
    this.ctx.lineWidth = this.lineWidth
    this.ctx.strokeStyle = this.strikeoutColor
    this.ctx.beginPath()
    if (this.prop.lineCap) {
      this.ctx.lineCap = this.prop.lineCap
    }
    if (this.prop.lineJoin) {
      this.ctx.lineJoin = this.prop.lineJoin
    }
    if (this.prop.lineDash) {
      this.ctx.setLineDash(this.prop.lineDash)
    }
    try {
      if (typeof this._beforeDraw === 'function') {
        this._beforeDraw(this._ctx)
      }
      for (let i = 0; i < this.actions.length; i++) {
        this.actions[i]()
      }
    } finally {
      this.ctx.stroke()
      this.ctx.closePath()
      this.ctx.restore()
    }
  }
}
