import { ControlComponent, ControlType } from '../../../dataset/enum/Control'
import { ZERO } from '../../../dataset/constant/Common'
import { ElementType } from '../../../dataset/enum/Element'
import { TextDirection } from '../../../dataset/enum/TextDirection'
import { IElement } from '../../../interface/Element'
import { BidiResolver } from '../resolver/BidiResolver'
import { getBidiRunDirection } from '../resolver/BidiGeometry'
import { ResolvedTextDirection } from '../types'

interface IElementMeasure {
  width: number
  font: string
  direction: TextDirection
  value: string
}

// 选项间距只用于布局，不应截断阿拉伯语等连写文本的整形 run
export function isControlOptionGap(element: IElement): boolean {
  return (
    element.controlComponent === ControlComponent.VALUE &&
    (element.control?.type === ControlType.CHECKBOX ||
      element.control?.type === ControlType.RADIO)
  )
}

export class NativeTextShaper {
  private bidiResolver = new BidiResolver()
  private runCache = new Map<string, number[]>()
  private elementCache = new WeakMap<IElement, IElementMeasure>()

  public clear(): void {
    this.elementCache = new WeakMap()
  }

  public measureElement(
    ctx: CanvasRenderingContext2D,
    elementList: IElement[],
    index: number,
    getFont: (element: IElement) => string,
    direction: TextDirection
  ): number {
    const element = elementList[index]
    const font = getFont(element)
    const cached = this.elementCache.get(element)
    if (
      cached &&
      cached.font === font &&
      cached.direction === direction &&
      cached.value === element.value
    ) {
      return cached.width
    }
    const { start, end } = this.getRunRange(
      elementList,
      index,
      font,
      getFont
    )
    const runElements = elementList.slice(start, end)
    const text = runElements.map(item => item.value).join('')
    const resolvedDirection =
      direction === TextDirection.AUTO
        ? this.bidiResolver.resolveDirection(text, direction)
        : direction
    // 文档下标不影响宽度；元素分段必须纳入缓存键，避免相同文本的不同拆法串用字宽
    const segments = runElements.map(item => item.value.length).join(',')
    const key = `${font}:${resolvedDirection}:${segments}:${text}`
    let widths = this.runCache.get(key)
    if (!widths) {
      // 防止同一文档长期编辑时，历史文本对应的 run 度量无限增长
      if (this.runCache.size >= 100) this.runCache.clear()
      widths = this.measureRun(ctx, runElements, font, resolvedDirection)
      this.runCache.set(key, widths)
    }
    // 一次测量缓存整个 run，后续元素不必重复扫描边界、拼接文本和查询缓存
    for (let i = 0; i < runElements.length; i++) {
      const runElement = runElements[i]
      this.elementCache.set(runElement, {
        width: widths[i] || 0,
        font,
        direction,
        value: runElement.value
      })
    }
    return widths[index - start] || 0
  }

  private getRunRange(
    elementList: IElement[],
    index: number,
    font: string,
    getFont: (element: IElement) => string
  ): { start: number; end: number } {
    const element = elementList[index]
    const isSameRun = (candidate: IElement) =>
      (!candidate.type ||
        candidate.type === ElementType.TEXT ||
        candidate.type === ElementType.HYPERLINK ||
        candidate.type === ElementType.DATE ||
        candidate.type === ElementType.CONTROL) &&
      candidate.value !== ZERO &&
      !candidate.width &&
      (!candidate.letterSpacing || isControlOptionGap(candidate)) &&
      candidate.direction === element.direction &&
      getFont(candidate) === font
    let start = index
    let end = index + 1
    while (start > 0 && isSameRun(elementList[start - 1])) start--
    while (end < elementList.length && isSameRun(elementList[end])) end++
    return { start, end }
  }

  private measureRun(
    ctx: CanvasRenderingContext2D,
    elementList: IElement[],
    font: string,
    direction: ResolvedTextDirection
  ): number[] {
    ctx.save()
    ctx.font = font
    ctx.direction = direction
    ctx.textAlign = 'left'
    // 跨方向前缀的宽度差不等于实际字宽，须按绘制使用的嵌入层级分段
    const levels = this.bidiResolver.resolve(
      elementList,
      direction,
      false
    ).levels
    const widths = new Array<number>(elementList.length).fill(0)
    let start = 0
    while (start < elementList.length) {
      let end = start + 1
      while (end < elementList.length && levels[end] === levels[start]) end++
      ctx.direction = getBidiRunDirection(levels[start], direction)
      this.measureLevelRun(ctx, elementList, start, end, widths)
      start = end
    }
    ctx.restore()
    return widths
  }

  private measureLevelRun(
    ctx: CanvasRenderingContext2D,
    elementList: IElement[],
    start: number,
    end: number,
    widths: number[]
  ): void {
    const runElements = elementList.slice(start, end)
    const text = runElements.map(element => element.value).join('')
    const prefixWidths = [0]
    let offset = 0
    for (const element of runElements) {
      offset += element.value.length
      prefixWidths.push(ctx.measureText(text.slice(0, offset)).width)
    }
    let hasNegativeWidth = false
    for (let i = 0; i < runElements.length; i++) {
      const width = prefixWidths[i + 1] - prefixWidths[i]
      widths[start + i] = width
      if (width < 0) hasNegativeWidth = true
    }
    // 阿拉伯连写可能让后一个逻辑前缀比前一个更窄，负差值不能直接作为字宽
    if (!hasNegativeWidth) return
    const fullWidth = Math.max(0, prefixWidths[prefixWidths.length - 1])
    const isolatedWidths = runElements.map(
      element => ctx.measureText(element.value).width
    )
    const isolatedWidth = isolatedWidths.reduce((sum, width) => sum + width, 0)
    if (fullWidth && isolatedWidth) {
      for (let i = 0; i < runElements.length; i++) {
        widths[start + i] =
          (Math.max(0, isolatedWidths[i]) * fullWidth) / isolatedWidth
      }
    } else {
      for (let i = start; i < end; i++) {
        widths[i] = fullWidth ? fullWidth / runElements.length : 0
      }
    }
  }
}
