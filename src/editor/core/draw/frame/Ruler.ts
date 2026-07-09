import { EDITOR_PREFIX } from '../../../dataset/constant/Editor'
import { EditorMode } from '../../../dataset/enum/Editor'
import { RulerUnit } from '../../../dataset/enum/Ruler'
import { DeepRequired } from '../../../interface/Common'
import { IEditorOption } from '../../../interface/Editor'
import { IMargin } from '../../../interface/Margin'
import { Draw } from '../Draw'

export type RulerDragSide = 'left' | 'right'

const PX_PER_INCH = 96
const PX_PER_CM = PX_PER_INCH / 2.54
const MIN_INNER_WIDTH = 100
const SVG_NS = 'http://www.w3.org/2000/svg'

export class Ruler {
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private rootContainer: HTMLDivElement
  private svg!: SVGSVGElement
  private dragSide: RulerDragSide | null = null
  private dragStartClientX = 0
  private dragOriginMargins: IMargin | null = null
  private lastSignature = ''
  private boundDragMove: (evt: MouseEvent) => void
  private boundDragEnd: (evt: MouseEvent) => void

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.boundDragMove = this._onDragMove.bind(this)
    this.boundDragEnd = this._onDragEnd.bind(this)
    this.rootContainer = this._buildDom()
    draw
      .getContainer()
      .insertBefore(this.rootContainer, draw.getPageContainer())
  }

  public getOptions(): DeepRequired<IEditorOption>['ruler'] {
    return this.options.ruler
  }

  public setOptions(payload: Partial<DeepRequired<IEditorOption>['ruler']>) {
    this.options.ruler = { ...this.options.ruler, ...payload }
    this.renderIfChanged()
  }

  public getHeight(): number {
    const { ruler, scale } = this.options
    return ruler.disabled ? 0 : ruler.size * scale
  }

  public renderIfChanged() {
    const { ruler, scale } = this.options
    const margins = this.draw.getMargins()
    const width = this.draw.getWidth()
    const signature = [
      ruler.disabled,
      ruler.unit,
      scale,
      width,
      margins.join(',')
    ].join('|')
    if (signature === this.lastSignature) return
    this.lastSignature = signature
    this.render()
  }

  public render() {
    const { ruler } = this.options
    const pageContainer = this.draw.getPageContainer()
    if (ruler.disabled) {
      this.rootContainer.style.display = 'none'
      pageContainer.style.marginTop = '0px'
      return
    }
    this.rootContainer.style.display = ''
    const width = this.draw.getWidth()
    const height = this.getHeight()
    this.rootContainer.style.width = `${width}px`
    this.rootContainer.style.height = `${height}px`
    this.svg.setAttribute('width', String(width))
    this.svg.setAttribute('height', String(height))
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    this._renderSvg(width, height)
    // 标尺为绝对定位，需为页面预留顶部空间避免遮挡
    pageContainer.style.marginTop = `${height}px`
  }

  public destroy() {
    document.removeEventListener('mousemove', this.boundDragMove)
    document.removeEventListener('mouseup', this.boundDragEnd)
    this.rootContainer.remove()
  }

  private _buildDom(): HTMLDivElement {
    const { ruler } = this.options
    const root = document.createElement('div')
    root.classList.add(`${EDITOR_PREFIX}-ruler`)
    root.style.backgroundColor = ruler.backgroundColor
    root.style.borderBottom = `1px solid ${ruler.color}`
    // svg 容器
    this.svg = document.createElementNS(SVG_NS, 'svg')
    this.svg.style.display = 'block'
    this.svg.setAttribute('shape-rendering', 'crispEdges')
    root.append(this.svg)
    return root
  }

  private _renderSvg(width: number, height: number) {
    const { ruler, scale } = this.options
    const margins = this.draw.getMargins()
    // 清空旧元素
    while (this.svg.firstChild) {
      this.svg.removeChild(this.svg.firstChild)
    }
    const pxPerCm = PX_PER_CM * scale
    const pxPerInch = PX_PER_INCH * scale
    const outsideBgRect = this._svgEl('rect', {
      x: 0,
      y: 0,
      width,
      height,
      fill: ruler.backgroundColor
    })
    this.svg.append(outsideBgRect)
    // 页边距外区域阴影
    const leftOutside = this._svgEl('rect', {
      x: 0,
      y: 0,
      width: margins[3],
      height,
      fill: ruler.outsideBackgroundColor
    })
    const rightOutside = this._svgEl('rect', {
      x: width - margins[1],
      y: 0,
      width: margins[1],
      height,
      fill: ruler.outsideBackgroundColor
    })
    this.svg.append(leftOutside, rightOutside)
    // 主刻度（cm）：顶部 0~50%，1cm 长 + 1mm 短
    const cmCount = Math.ceil(width / pxPerCm)
    for (let i = 0; i <= cmCount; i++) {
      const x = i * pxPerCm
      if (x > width) break
      this.svg.append(
        this._svgEl('line', {
          x1: x,
          y1: 0,
          x2: x,
          y2: height * 0.55,
          stroke: ruler.color,
          'stroke-width': 1
        })
      )
      if (ruler.unit === RulerUnit.CM) {
        this.svg.append(
          this._svgEl(
            'text',
            {
              x: x + 3,
              y: 2,
              fill: ruler.textColor,
              'font-size': ruler.fontSize * scale,
              'font-family': ruler.font,
              'dominant-baseline': 'hanging'
            },
            `${i}`
          )
        )
      }
      for (let m = 1; m < 10; m++) {
        const mx = x + (m * pxPerCm) / 10
        if (mx > width) break
        this.svg.append(
          this._svgEl('line', {
            x1: mx,
            y1: 0,
            x2: mx,
            y2: height * 0.3,
            stroke: ruler.color,
            'stroke-width': 1
          })
        )
      }
    }
    // 副刻度（inch）：底部 50%~100%
    const inchCount = Math.ceil(width / pxPerInch)
    for (let i = 0; i <= inchCount; i++) {
      const x = i * pxPerInch
      if (x > width) break
      this.svg.append(
        this._svgEl('line', {
          x1: x,
          y1: height,
          x2: x,
          y2: height * 0.5,
          stroke: ruler.color,
          'stroke-width': 1
        })
      )
      if (ruler.unit === RulerUnit.INCH) {
        this.svg.append(
          this._svgEl(
            'text',
            {
              x: x + 3,
              y: height * 0.55,
              fill: ruler.textColor,
              'font-size': ruler.fontSize * scale,
              'font-family': ruler.font,
              'dominant-baseline': 'hanging'
            },
            `${i}`
          )
        )
      }
      for (let m = 1; m < 8; m++) {
        const mx = x + (m * pxPerInch) / 8
        if (mx > width) break
        this.svg.append(
          this._svgEl('line', {
            x1: mx,
            y1: height,
            x2: mx,
            y2: height * 0.75,
            stroke: ruler.color,
            'stroke-width': 1
          })
        )
      }
    }
    this._renderMarginHandles(width, height)
  }

  private _svgEl(
    name: string,
    attrs: Record<string, string | number>,
    text?: string
  ): SVGElement {
    const el = document.createElementNS(SVG_NS, name)
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)))
    if (text !== undefined) el.textContent = text
    return el
  }

  private _renderMarginHandles(width: number, height: number) {
    const { ruler, scale } = this.options
    const margins = this.draw.getMargins()
    const halfW = 5 * scale
    const slopeH = 4 * scale
    const hitW = 14 * scale
    const midY = height / 2
    const fillColor = '#FFFFFF'
    const strokeColor = ruler.marginColor
    const topPoints = (x: number) =>
      `${x - halfW},0 ${x + halfW},0 ${x + halfW},${midY - slopeH} ${x},${midY} ${x - halfW},${midY - slopeH}`
    const bottomPoints = (x: number) =>
      `${x - halfW},${height} ${x + halfW},${height} ${x + halfW},${midY + slopeH} ${x},${midY} ${x - halfW},${midY + slopeH}`
    // 左边距手柄
    const lx = margins[3]
    const leftTop = this._svgEl('polygon', {
      points: topPoints(lx),
      fill: fillColor,
      stroke: strokeColor,
      'stroke-width': 1
    })
    const leftBottom = this._svgEl('polygon', {
      points: bottomPoints(lx),
      fill: fillColor,
      stroke: strokeColor,
      'stroke-width': 1
    })
    const leftHit = this._svgEl('rect', {
      x: lx - hitW / 2,
      y: 0,
      width: hitW,
      height,
      fill: 'transparent',
      cursor: 'col-resize'
    })
    leftHit.addEventListener('mousedown', evt => this._onDragStart('left', evt))
    // 右边距手柄
    const rx = width - margins[1]
    const rightTop = this._svgEl('polygon', {
      points: topPoints(rx),
      fill: fillColor,
      stroke: strokeColor,
      'stroke-width': 1
    })
    const rightBottom = this._svgEl('polygon', {
      points: bottomPoints(rx),
      fill: fillColor,
      stroke: strokeColor,
      'stroke-width': 1
    })
    const rightHit = this._svgEl('rect', {
      x: rx - hitW / 2,
      y: 0,
      width: hitW,
      height,
      fill: 'transparent',
      cursor: 'col-resize'
    })
    rightHit.addEventListener('mousedown', evt =>
      this._onDragStart('right', evt)
    )
    this.svg.append(
      leftTop,
      leftBottom,
      leftHit,
      rightTop,
      rightBottom,
      rightHit
    )
  }

  private _onDragStart(side: RulerDragSide, evt: MouseEvent) {
    const mode = this.draw.getMode()
    if (
      this.draw.isReadonly() ||
      mode === EditorMode.PRINT ||
      mode === EditorMode.FORM
    ) {
      return
    }
    evt.preventDefault()
    evt.stopPropagation()
    this.dragSide = side
    this.dragStartClientX = evt.clientX
    this.dragOriginMargins = [...this.draw.getMargins()] as IMargin
    this.draw.getRange().clearRange()
    this.draw.getCursor().drawCursor({ isShow: false })
    document.addEventListener('mousemove', this.boundDragMove)
    document.addEventListener('mouseup', this.boundDragEnd)
  }

  private _onDragMove(evt: MouseEvent) {
    if (!this.dragSide || !this.dragOriginMargins) return
    const dx = evt.clientX - this.dragStartClientX
    const newMargins = this._computeNewMargins(
      this.dragSide,
      dx,
      this.dragOriginMargins
    )
    if (newMargins) {
      this.draw.setPaperMargin(newMargins)
    }
  }

  private _onDragEnd() {
    this.dragSide = null
    this.dragStartClientX = 0
    this.dragOriginMargins = null
    document.removeEventListener('mousemove', this.boundDragMove)
    document.removeEventListener('mouseup', this.boundDragEnd)
  }

  private _computeNewMargins(
    side: RulerDragSide,
    deltaX: number,
    origin: IMargin
  ): IMargin | null {
    const { enableMarginDrag } = this.options.ruler
    const { scale } = this.options
    if (!enableMarginDrag) return null
    const delta = deltaX / scale
    const width = this.draw.getWidth()
    const [top, right, bottom, left] = origin
    let newLeft = left
    let newRight = right
    if (side === 'left') {
      newLeft = Math.max(
        0,
        Math.min(left + delta, width - right - MIN_INNER_WIDTH)
      )
    } else {
      newRight = Math.max(
        0,
        Math.min(right - delta, width - left - MIN_INNER_WIDTH)
      )
    }
    return [top, newRight, bottom, newLeft]
  }
}
