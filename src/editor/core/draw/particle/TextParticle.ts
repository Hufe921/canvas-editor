import { ElementType, IEditorOption, IElement, RenderMode } from '../../..'
import { PUNCTUATION_LIST } from '../../../dataset/constant/Common'
import { TabStopLeader } from '../../../dataset/enum/TabStop'
import { DeepRequired } from '../../../interface/Common'
import { IRowElement } from '../../../interface/Row'
import { ITextMetrics } from '../../../interface/Text'
import { TextMeasurer } from '../../layout/TextMeasurer'
import type { IRenderContext } from '../../render/model/RenderContext'
import { DisplayList } from '../../render/model/DisplayList'
import { buildSourceTextKey } from '../../render/svg/scene/SceneKey'
import { Draw } from '../Draw'
import { TextDirection } from '../../../dataset/enum/TextDirection'
import {
  isControlOptionGap,
  NativeTextShaper
} from '../../bidi/shape/NativeTextShaper'
import { BidiResolver } from '../../bidi/resolver/BidiResolver'
import { getBidiRunDirection } from '../../bidi/resolver/BidiGeometry'
import { ResolvedTextDirection } from '../../bidi/types'

export interface IMeasureWordResult {
  width: number
  endElement: IElement | null
}

interface IDirectionRecord {
  element: IRowElement
  x: number
  y: number
}

export class TextParticle {
  private draw: Draw
  private options: DeepRequired<IEditorOption>

  private ctx: IRenderContext
  private curX: number
  private curY: number
  private text: string
  private curStyle: string
  private curColor?: string
  private curDirection: TextDirection = TextDirection.LTR
  private curSourceElement?: IElement
  private directionRecords: IDirectionRecord[]
  private sourceKeys: WeakMap<IElement, string>
  private sourceKeyId: number
  private textMeasurer: TextMeasurer
  private nativeTextShaper: NativeTextShaper | null = null
  private bidiResolver: BidiResolver | null = null

  constructor(draw: Draw) {
    this.draw = draw
    this.options = draw.getOptions()
    this.ctx = new DisplayList()
    this.curX = -1
    this.curY = -1
    this.text = ''
    this.curStyle = ''
    this.directionRecords = []
    this.sourceKeys = new WeakMap()
    this.sourceKeyId = 0
    this.textMeasurer = draw.getTextMeasurer()
  }

  public measureBasisWord(
    ctx: CanvasRenderingContext2D,
    font: string
  ): ITextMetrics {
    return this.textMeasurer.measureBasis(font, ctx)
  }

  public measureWord(
    ctx: CanvasRenderingContext2D,
    elementList: IElement[],
    curIndex: number
  ): IMeasureWordResult {
    const LETTER_REG = this.draw.getLetterReg()
    let width = 0
    let endElement: IElement | null = null
    let i = curIndex
    while (i < elementList.length) {
      const element = elementList[i]
      if (
        (element.type && element.type !== ElementType.TEXT) ||
        !LETTER_REG.test(element.value)
      ) {
        endElement = element
        break
      }
      const direction =
        element.direction ?? this.options.defaultDirection ?? TextDirection.LTR
      width +=
        direction === TextDirection.LTR
          ? this.measureText(ctx, element).width
          : this.measureTextInContext(ctx, elementList, i, direction)
      i++
    }
    return {
      width,
      endElement
    }
  }

  public measurePunctuationWidth(
    ctx: CanvasRenderingContext2D,
    element: IElement
  ): number {
    if (!element || !PUNCTUATION_LIST.includes(element.value)) return 0
    ctx.font = this.draw.getElementFont(element)
    return this.measureText(ctx, element).width
  }

  public measureText(
    ctx: CanvasRenderingContext2D,
    element: IElement
  ): ITextMetrics {
    return this.textMeasurer.measure(element, ctx.font, ctx)
  }

  public measureTextInContext(
    ctx: CanvasRenderingContext2D,
    elementList: IElement[],
    index: number,
    direction: TextDirection
  ): number {
    this.nativeTextShaper ??= new NativeTextShaper()
    return this.nativeTextShaper.measureElement(
      ctx,
      elementList,
      index,
      element => this.draw.getElementFont(element),
      direction
    )
  }

  public clearNativeTextShaperCache(): void {
    this.nativeTextShaper?.clear()
  }

  public getBasisWordBoundingBoxAscent(
    ctx: CanvasRenderingContext2D,
    font: string
  ): number {
    return this.measureBasisWord(ctx, font).actualBoundingBoxAscent
  }

  public complete() {
    this._render()
    this.text = ''
    // 默认 LTR 高频刷新复用同一数组，避免每次 complete 都产生新分配
    this.directionRecords.length = 0
  }

  // 制表位前导符：TAB 推进空隙的点线/连字符/下划线填充
  public renderTabLeader(
    ctx: IRenderContext,
    element: IRowElement,
    x: number,
    y: number
  ) {
    const leader = element.tabLeader
    const width = element.metrics.width
    if (!width || !leader || leader === TabStopLeader.NONE) return
    const { scale, defaultColor, underlineColor } = this.options
    ctx.save()
    if (leader === TabStopLeader.UNDERLINE) {
      // 与文本下划线同位同粗
      ctx.strokeStyle = element.color || underlineColor
      ctx.lineWidth = scale
      const adjustY = Math.floor(y + 2 * ctx.lineWidth) + 0.5
      ctx.beginPath()
      ctx.moveTo(x, adjustY)
      ctx.lineTo(x + width, adjustY)
      ctx.stroke()
    } else {
      const char = leader === TabStopLeader.DOT ? '.' : '-'
      ctx.font = element.style
      ctx.fillStyle = element.color || defaultColor
      const charWidth =
        this.textMeasurer.measureText(char, ctx.font).width * scale
      if (charWidth > 0) {
        // 整串一次绘制，避免逐字符 fillText 的绘制开销
        const count = Math.floor(width / charWidth)
        if (count > 0) {
          const text = char.repeat(count)
          const textWidth =
            this.textMeasurer.measureText(text, ctx.font).width * scale
          ctx.fillText(text, x + (width - textWidth) / 2, y)
        }
      }
    }
    ctx.restore()
  }

  public record(
    ctx: IRenderContext,
    element: IRowElement,
    x: number,
    y: number
  ) {
    this.ctx = ctx
    const direction =
      element.direction ?? this.options.defaultDirection ?? TextDirection.LTR
    // 普通 LTR 兼容模式保持逐元素立即绘制；方向文本必须保留完整 run
    if (
      this.options.renderMode === RenderMode.COMPATIBILITY &&
      direction === TextDirection.LTR
    ) {
      if (this.directionRecords.length) this.complete()
      this._setCurXY(x, y)
      this.text = element.value
      this.curStyle = element.style
      this.curColor = element.color
      this.curSourceElement = element
      this.complete()
      return
    }
    const isDirectional = direction !== TextDirection.LTR
    if (this.text && isDirectional !== !!this.directionRecords.length) {
      this.complete()
    }
    // 主动完成的重设起始点
    if (!this.text) {
      this._setCurXY(x, y)
      this.curSourceElement = element
      this.curDirection = direction
    }
    if (isDirectional) {
      const hasLayoutBoundary =
        element.left ||
        element.width ||
        (element.letterSpacing && !isControlOptionGap(element))
      if (this.text && hasLayoutBoundary) {
        this.complete()
        this._setCurXY(x, y)
        this.curSourceElement = element
        this.curDirection = direction
      }
      this.directionRecords.push({ element, x, y })
      this.curX = Math.min(this.curX, x)
      this.text += element.value
      this.curStyle = element.style
      this.curColor = element.color
      return
    }
    // 样式发生改变
    if (
      (this.curStyle && element.style !== this.curStyle) ||
      element.color !== this.curColor
    ) {
      this.complete()
      this._setCurXY(x, y)
      this.curSourceElement = element
    }
    this.text += element.value
    this.curStyle = element.style
    this.curColor = element.color
  }

  private _setCurXY(x: number, y: number) {
    this.curX = x
    this.curY = y
  }

  private _getSourceKey(element: IElement): string {
    let key = this.sourceKeys.get(element)
    if (!key) {
      key = buildSourceTextKey(++this.sourceKeyId)
      this.sourceKeys.set(element, key)
    }
    return key
  }

  private _resolveDirection(): ResolvedTextDirection {
    if (this.curDirection === TextDirection.AUTO) {
      return (this.bidiResolver ??= new BidiResolver()).resolveDirection(
        this.text,
        this.curDirection
      )
    }
    return this.curDirection === TextDirection.RTL
      ? TextDirection.RTL
      : TextDirection.LTR
  }

  private _setDirectionState(
    direction: ResolvedTextDirection,
    style: string,
    color?: string
  ): void {
    this.ctx.font = style
    this.ctx.fillStyle = color || this.options.defaultColor
    this.ctx.direction = direction
    this.ctx.textAlign = 'left'
  }

  private _fillText(
    text: string,
    x: number,
    y: number,
    sourceElement = this.curSourceElement
  ): void {
    if (sourceElement && this.ctx.fillTextWithSource) {
      this.ctx.fillTextWithSource(text, x, y, {
        key: this._getSourceKey(sourceElement)
      })
    } else {
      this.ctx.fillText(text, x, y)
    }
  }

  private _renderDirectional(direction: ResolvedTextDirection): void {
    const records = this.directionRecords
    let start = 0
    while (start < records.length) {
      const first = records[start]
      const element = first.element
      let end = start + 1
      while (end < records.length) {
        const previous = records[end - 1]
        const current = records[end]
        if (
          current.element.style !== element.style ||
          current.element.bidiLevel !== previous.element.bidiLevel
        ) {
          break
        }
        if (current.element.bidiLevel === undefined) {
          const previousWidth = previous.element.metrics.width
          const currentWidth = current.element.metrics.width
          const isAdjacent =
            Math.abs(previous.x + previousWidth - current.x) < 0.01 ||
            Math.abs(current.x + currentWidth - previous.x) < 0.01
          if (!isAdjacent) break
        }
        end++
      }
      let text = ''
      let minX = Infinity
      const firstColor = element.color || this.options.defaultColor
      let hasMultipleColors = false
      for (let i = start; i < end; i++) {
        const record = records[i]
        text += record.element.justifyValue ?? record.element.value
        minX = Math.min(minX, record.x)
        const color = record.element.color || this.options.defaultColor
        if (color !== firstColor) hasMultipleColors = true
      }
      const lastElement = records[end - 1].element
      const runDirection = getBidiRunDirection(element.bidiLevel, direction)
      // RTL 选项尾部间距位于视觉左缘，绘制时让出间距但保留完整连写
      const trailingOptionGap =
        direction === TextDirection.RTL && isControlOptionGap(lastElement)
          ? (lastElement.letterSpacing || 0) * this.options.scale
          : 0
      const x = minX + trailingOptionGap
      if (!hasMultipleColors) {
        this.ctx.save()
        this._setDirectionState(runDirection, element.style, element.color)
        // 同一行可能拆成多个 run，每个 run 使用自己的首元素作为稳定来源
        this._fillText(text, x, first.y, element)
        this.ctx.restore()
      } else {
        // 颜色不是字体整形边界：完整 run 重复绘制并裁剪到各颜色元素
        const colorGroups = new Map<string, IDirectionRecord[]>()
        for (let i = start; i < end; i++) {
          const record = records[i]
          const color = record.element.color || this.options.defaultColor
          const colorGroup = colorGroups.get(color) || []
          colorGroup.push(record)
          colorGroups.set(color, colorGroup)
        }
        for (const [color, colorGroup] of colorGroups) {
          this.ctx.save()
          this._setDirectionState(runDirection, element.style, color)
          this.ctx.beginPath()
          for (const record of colorGroup) {
            const { metrics } = record.element
            const height = metrics.height * 2
            this.ctx.rect(
              record.x,
              record.y - metrics.boundingBoxAscent - metrics.height,
              metrics.width,
              height + metrics.height
            )
          }
          this.ctx.clip()
          this.ctx.fillText(text, x, first.y)
          this.ctx.restore()
        }
      }
      start = end
    }
  }

  private _render() {
    if (!this.text || !~this.curX || !~this.curY) return
    if (this.directionRecords.length) {
      this._renderDirectional(this._resolveDirection())
      return
    }
    this.ctx.save()
    this.ctx.font = this.curStyle
    this.ctx.fillStyle = this.curColor || this.options.defaultColor
    this._fillText(this.text, this.curX, this.curY)
    this.ctx.restore()
  }
}
