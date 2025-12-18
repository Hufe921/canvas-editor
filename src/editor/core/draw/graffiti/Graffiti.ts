import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IGraffitiData, IGraffitiStroke } from '../../../interface/Graffiti'
import { Draw } from '../Draw'

export class Graffiti {
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private data: IGraffitiData[]
  private pageContainer: HTMLDivElement
  private isDrawing = false
  private startStroke: IGraffitiStroke | null = null

  constructor(draw: Draw, data?: IGraffitiData[]) {
    this.draw = draw
    this.options = draw.getOptions()
    this.data = data || []
    this.pageContainer = draw.getPageContainer()
    this.register()
  }

  private register() {
    this.pageContainer.addEventListener('mousedown', this.mousedown.bind(this))
    this.pageContainer.addEventListener('mouseup', this.mouseup.bind(this))
    this.pageContainer.addEventListener('mousemove', this.mousemove.bind(this))
  }

  private mousedown(evt: MouseEvent) {
    if (!this.draw.isGraffitiMode()) return
    this.isDrawing = true
    // 缓存起始数据
    this.startStroke = {
      isBegin: true,
      lineWidth: this.options.graffiti.defaultLineWidth,
      lineColor: this.options.graffiti.defaultLineColor,
      linePoints: [evt.offsetX, evt.offsetY]
    }
  }

  private mouseup() {
    this.isDrawing = false
  }

  private mousemove(evt: MouseEvent) {
    if (!this.isDrawing || !this.draw.isGraffitiMode()) return
    // 移动超过至少2个像素后开始绘制
    const { offsetX, offsetY } = evt
    const DISTANCE = 2
    if (
      this.startStroke &&
      Math.abs(this.startStroke.linePoints[0] - offsetX) < DISTANCE &&
      Math.abs(this.startStroke.linePoints[1] - offsetY) < DISTANCE
    ) {
      return
    }
    // 修改数据
    const pageNo = this.draw.getPageNo()
    let currentValue = this.data.find(item => item.pageNo === pageNo)
    if (this.startStroke) {
      if (!currentValue) {
        currentValue = {
          pageNo,
          strokes: []
        }
        this.data.push(currentValue)
      }
      currentValue.strokes.push(this.startStroke)
      // 清空起始数据
      this.startStroke = null
    }
    if (!currentValue?.strokes?.length) return
    currentValue.strokes.push({
      linePoints: [offsetX, offsetY]
    })
    // 重新渲染
    this.draw.render({
      isCompute: false,
      isSetCursor: false,
      isSubmitHistory: false
    })
  }

  public getValue(): IGraffitiData[] {
    return this.data
  }

  // 页面减少时清空对应页面涂鸦信息
  public compute() {
    const pageSize = this.draw.getPageRowList().length
    for (let d = this.data.length - 1; d >= 0; d--) {
      const pageNo = this.data[d].pageNo
      if (pageNo > pageSize - 1) {
        this.data.splice(d, 1)
      }
    }
  }

  public clear() {
    this.data = []
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    const strokes = this.data.find(item => item.pageNo === pageNo)?.strokes
    if (!strokes?.length) return
    const {
      graffiti: { defaultLineColor, defaultLineWidth },
      scale
    } = this.options
    ctx.save()
    for (let s = 0; s < strokes.length; s++) {
      const stroke = strokes[s]
      const { isBegin, lineColor, lineWidth, linePoints } = stroke
      if (isBegin) {
        ctx.strokeStyle = lineColor || defaultLineColor
        ctx.lineWidth = (lineWidth || defaultLineWidth) * scale
        ctx.beginPath()
        ctx.moveTo(linePoints[0] * scale, linePoints[1] * scale)
      } else {
        ctx.lineTo(linePoints[0] * scale, linePoints[1] * scale)
      }
      ctx.stroke()
    }
    ctx.restore()
  }
}
