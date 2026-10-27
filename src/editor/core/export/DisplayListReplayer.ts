import type { DisplayList } from '../render/model/DisplayList'
import type { IRenderPattern } from '../render/model/RenderContext'
import type { IPdfCanvas } from './PdfCanvas'

function isRenderPattern(value: unknown): value is IRenderPattern {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as IRenderPattern).type === 'pattern'
  )
}

// 将源区域绘制到临时画布（drawImage 九参形式的等价转换）
function drawSourceRegion(
  image: CanvasImageSource,
  sx: number,
  sy: number,
  sWidth: number,
  sHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = sWidth
  canvas.height = sHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight)
  return canvas
}

// 把 DisplayList 指令流重放到 PDF 画布目标上
export class DisplayListReplayer {
  public replay(canvas: IPdfCanvas, displayList: DisplayList): void {
    // 活动的 pattern 填充（水印平铺），save/restore 语义下视作临时状态
    let fillPattern: IRenderPattern | null = null
    const operations = displayList.getOperations()
    for (const operation of operations) {
      if (operation.type === 'beginGroup' || operation.type === 'endGroup') {
        continue
      }
      if (operation.type === 'set') {
        const { property, value } = operation
        if (property === 'fillStyle') {
          if (isRenderPattern(value)) {
            fillPattern = value
            // 纯路径填充禁用 pattern，避免输出异常色块
            canvas.fillStyle = 'rgba(0,0,0,0)'
          } else {
            fillPattern = null
            canvas.fillStyle = value as string
          }
        } else {
          ;(canvas as unknown as Record<string, unknown>)[property] = value
        }
        continue
      }
      const { type, args } = operation
      switch (type) {
        case 'fillRect': {
          const [x, y, width, height] = args as number[]
          if (fillPattern) {
            canvas.fillPatternRect(
              fillPattern.image,
              fillPattern.repetition,
              x,
              y,
              width,
              height
            )
          } else {
            canvas.fillRect(x, y, width, height)
          }
          break
        }
        case 'rect': {
          // rect 在部分底层实现中存在缺陷，拆解为路径指令
          const [x, y, width, height] = args as number[]
          canvas.moveTo(x, y)
          canvas.lineTo(x + width, y)
          canvas.lineTo(x + width, y + height)
          canvas.lineTo(x, y + height)
          canvas.closePath()
          break
        }
        case 'fillText': {
          // 第四个参数为元素来源标识，供后续扩展超链接/可搜索文本
          const [text, x, y] = args as [string, number, number]
          canvas.fillText(text, x, y)
          break
        }
        case 'drawImage': {
          const [image, ...rest] = args as [CanvasImageSource, ...number[]]
          if (rest.length === 4) {
            canvas.drawImage(image, rest[0], rest[1], rest[2], rest[3])
          } else if (rest.length === 8) {
            const source = drawSourceRegion(
              image,
              rest[0],
              rest[1],
              rest[2],
              rest[3]
            )
            canvas.drawImage(source, rest[4], rest[5], rest[6], rest[7])
          }
          break
        }
        case 'restore':
          fillPattern = null
          canvas.restore()
          break
        case 'save':
          canvas.save()
          break
        case 'beginPath':
          canvas.beginPath()
          break
        case 'closePath':
          canvas.closePath()
          break
        case 'moveTo':
          canvas.moveTo(args[0] as number, args[1] as number)
          break
        case 'lineTo':
          canvas.lineTo(args[0] as number, args[1] as number)
          break
        case 'arc':
          canvas.arc(
            args[0] as number,
            args[1] as number,
            args[2] as number,
            args[3] as number,
            args[4] as number,
            args[5] as boolean
          )
          break
        case 'quadraticCurveTo':
          canvas.quadraticCurveTo(
            args[0] as number,
            args[1] as number,
            args[2] as number,
            args[3] as number
          )
          break
        case 'bezierCurveTo':
          canvas.bezierCurveTo(
            args[0] as number,
            args[1] as number,
            args[2] as number,
            args[3] as number,
            args[4] as number,
            args[5] as number
          )
          break
        case 'fill':
          canvas.fill()
          break
        case 'stroke':
          canvas.stroke()
          break
        case 'strokeRect':
          canvas.strokeRect(
            args[0] as number,
            args[1] as number,
            args[2] as number,
            args[3] as number
          )
          break
        case 'clip':
          canvas.clip()
          break
        case 'translate':
          canvas.translate(args[0] as number, args[1] as number)
          break
        case 'scale':
          canvas.scale(args[0] as number, args[1] as number)
          break
        case 'rotate':
          canvas.rotate(args[0] as number)
          break
        case 'setLineDash':
          canvas.setLineDash(args[0] as number[])
          break
      }
    }
  }
}
