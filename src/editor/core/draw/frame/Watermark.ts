import { IEditorOption } from '../../..'
import { FORMAT_PLACEHOLDER } from '../../../dataset/constant/PageNumber'
import { WatermarkType } from '../../../dataset/enum/Watermark'
import { DeepRequired } from '../../../interface/Common'
import { LayoutResult } from '../../text-engine/types'
import { Draw } from '../Draw'
import { PageNumber } from './PageNumber'

export class Watermark {
  private draw: Draw
  private options: DeepRequired<IEditorOption>
  private imageCache: Map<string, HTMLImageElement>

  constructor(draw: Draw) {
    this.draw = draw
    this.options = <DeepRequired<IEditorOption>>draw.getOptions()
    this.imageCache = new Map()
  }

  public formatText(data: string, pageNo: number): string {
    let text = data
    const pageNoReg = new RegExp(FORMAT_PLACEHOLDER.PAGE_NO)
    if (pageNoReg.test(text)) {
      text = PageNumber.formatNumberPlaceholder(
        text,
        pageNo + 1,
        pageNoReg,
        this.options.watermark.numberType
      )
    }
    const pageCountReg = new RegExp(FORMAT_PLACEHOLDER.PAGE_COUNT)
    if (pageCountReg.test(text)) {
      text = PageNumber.formatNumberPlaceholder(
        text,
        this.draw.getPageCount(),
        pageCountReg,
        this.options.watermark.numberType
      )
    }
    return text
  }

  /** Measure + draw via text-engine (BiDi / script fonts / joining). */
  private renderTextEngine(
    ctx: CanvasRenderingContext2D,
    layout: LayoutResult,
    repeat: boolean,
    gap: [number, number],
    scale: number,
    width: number,
    height: number
  ) {
    const line = layout.lines[0]
    if (!line?.glyphs.length) return
    const renderer = this.draw.getLayoutHostAdapter().getGlyphRenderer()
    const textWidth = line.width
    const textHeight = line.ascent + line.descent
    if (repeat) {
      const dpr = this.draw.getPagePixelRatio()
      const temporaryCanvas = document.createElement('canvas')
      const temporaryCtx = temporaryCanvas.getContext('2d')!
      const diagonalLength = Math.sqrt(
        Math.pow(textWidth, 2) + Math.pow(textHeight, 2)
      )
      const patternWidth = diagonalLength + 2 * gap[0] * scale
      const patternHeight = diagonalLength + 2 * gap[1] * scale
      temporaryCanvas.width = Math.max(1, Math.ceil(patternWidth * dpr))
      temporaryCanvas.height = Math.max(1, Math.ceil(patternHeight * dpr))
      temporaryCanvas.style.width = `${patternWidth}px`
      temporaryCanvas.style.height = `${patternHeight}px`
      temporaryCtx.scale(dpr, dpr)
      temporaryCtx.translate(patternWidth / 2, patternHeight / 2)
      temporaryCtx.rotate((-45 * Math.PI) / 180)
      temporaryCtx.translate(-patternWidth / 2, -patternHeight / 2)
      renderer.drawLine(
        temporaryCtx,
        line,
        (patternWidth - textWidth) / 2,
        (patternHeight - textHeight) / 2 + line.ascent,
        layout.paragraphText
      )
      const pattern = ctx.createPattern(temporaryCanvas, 'repeat')
      if (pattern) {
        pattern.setTransform(new DOMMatrix().scale(1 / dpr))
        ctx.fillStyle = pattern
        ctx.fillRect(0, 0, width, height)
      }
    } else {
      ctx.translate(width / 2, height / 2)
      ctx.rotate((-45 * Math.PI) / 180)
      renderer.drawLine(
        ctx,
        line,
        -textWidth / 2,
        line.ascent - textHeight / 2,
        layout.paragraphText
      )
    }
  }

  public renderText(ctx: CanvasRenderingContext2D, pageNo: number) {
    const {
      watermark: { data, opacity, font, size, color, repeat, gap },
      scale
    } = this.options
    // 混合纸张方向：按页取尺寸
    const { width, height } = this.draw.getPageSize(pageNo)
    const text = this.formatText(data, pageNo)
    ctx.save()
    ctx.globalAlpha = opacity
    const adapter = this.draw.getLayoutHostAdapter()
    const layout = adapter.isReady()
      ? adapter.layoutPlainText({
          text,
          fontFamily: font,
          fontSize: size * scale,
          color
        })
      : null
    if (layout?.lines[0]?.glyphs.length) {
      this.renderTextEngine(ctx, layout, repeat, gap, scale, width, height)
    }
    ctx.restore()
  }

  public renderImage(ctx: CanvasRenderingContext2D, pageNo: number) {
    const {
      watermark: { width, height, data, opacity, repeat, gap },
      scale
    } = this.options
    if (!this.imageCache.has(data)) {
      const img = new Image()
      img.setAttribute('crossOrigin', 'Anonymous')
      img.src = data
      img.onload = () => {
        this.imageCache.set(data, img)
        // 避免层级上浮，触发编辑器二次渲染
        this.draw.render({
          isCompute: false,
          isSubmitHistory: false
        })
      }
      return
    }
    const { width: docWidth, height: docHeight } = this.draw.getPageSize(pageNo)
    const imageWidth = width * scale
    const imageHeight = height * scale
    // 开始绘制
    ctx.save()
    ctx.globalAlpha = opacity
    if (repeat) {
      const dpr = this.draw.getPagePixelRatio()
      const temporaryCanvas = document.createElement('canvas')
      const temporaryCtx = temporaryCanvas.getContext('2d')!
      // 勾股定理计算旋转后的宽高对角线尺寸 a^2 + b^2 = c^2
      const diagonalLength = Math.sqrt(
        Math.pow(imageWidth, 2) + Math.pow(imageHeight, 2)
      )
      // 加上 gap 间距
      const patternWidth = diagonalLength + 2 * gap[0] * scale
      const patternHeight = diagonalLength + 2 * gap[1] * scale
      // 宽高设置
      temporaryCanvas.width = Math.max(1, Math.ceil(patternWidth * dpr))
      temporaryCanvas.height = Math.max(1, Math.ceil(patternHeight * dpr))
      temporaryCanvas.style.width = `${patternWidth}px`
      temporaryCanvas.style.height = `${patternHeight}px`
      // 旋转45度
      temporaryCtx.scale(dpr, dpr)
      temporaryCtx.translate(patternWidth / 2, patternHeight / 2)
      temporaryCtx.rotate((-45 * Math.PI) / 180)
      temporaryCtx.translate(-patternWidth / 2, -patternHeight / 2)
      // 绘制图片
      temporaryCtx.drawImage(
        this.imageCache.get(data)!,
        (patternWidth - imageWidth) / 2,
        (patternHeight - imageHeight) / 2,
        imageWidth,
        imageHeight
      )
      // 创建平铺模式
      const pattern = ctx.createPattern(temporaryCanvas, 'repeat')
      if (pattern) {
        pattern.setTransform(new DOMMatrix().scale(1 / dpr))
        ctx.fillStyle = pattern
        ctx.fillRect(0, 0, docWidth, docHeight)
      }
    } else {
      const x = docWidth / 2
      const y = docHeight / 2
      ctx.translate(x, y)
      ctx.rotate((-45 * Math.PI) / 180)
      ctx.drawImage(
        this.imageCache.get(data)!,
        -imageWidth / 2,
        -imageHeight / 2,
        imageWidth,
        imageHeight
      )
    }
    ctx.restore()
  }

  public render(ctx: CanvasRenderingContext2D, pageNo: number) {
    if (this.options.watermark.type === WatermarkType.IMAGE) {
      this.renderImage(ctx, pageNo)
    } else {
      this.renderText(ctx, pageNo)
    }
  }
}
