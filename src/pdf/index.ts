import { ControlComponent, DeepRequired, ElementType, IDrawRowPayload, IDrawRowResult, IEditorOption, IElement, IElementMetrics, IElementPosition, IRow, IRowElement, RowFlex } from '../editor'
import { Context2d, jsPDF } from 'jspdf'
import { IPdfOption } from './interface/Pdf'
import { formatElementList } from './utils/element'
import { TableParticle } from './particle/TableParticle'
import { deepClone } from './utils'
import { TextParticle } from './particle/TextParticle'
import { ImageParticle } from './particle/ImageParticle'
import { PageNumber } from './frame/PageNumber'
import { Watermark } from './frame/Watermark'
import { Header } from './frame/Header'
import { HyperlinkParticle } from './particle/HyperlinkParticle'
import { SeparatorParticle } from './particle/Separator'
import { PageBreakParticle } from './particle/PageBreak'
import { SuperscriptParticle } from './particle/Superscript'
import { SubscriptParticle } from './particle/Subscript'
import { CheckboxParticle } from './particle/CheckboxParticle'
import { Underline } from './richtext/Underline'
import { Strikeout } from './richtext/Strikeout'
import { Highlight } from './richtext/Highlight'

export class Pdf {

  private fakeCanvas: HTMLCanvasElement
  private fakeCtx: CanvasRenderingContext2D
  private elementList: IElement[]
  private editorOptions: DeepRequired<IEditorOption>

  private doc: jsPDF
  private ctx: Context2d
  private rowList: IRow[]
  private positionList: IElementPosition[]

  private underline: Underline
  private strikeout: Strikeout
  private highlight: Highlight
  private tableParticle: TableParticle
  private textParticle: TextParticle
  private imageParticle: ImageParticle
  private pageNumber: PageNumber
  private waterMark: Watermark
  private header: Header
  private hyperlinkParticle: HyperlinkParticle
  private separatorParticle: SeparatorParticle
  private pageBreakParticle: PageBreakParticle
  private superscriptParticle: SuperscriptParticle
  private subscriptParticle: SubscriptParticle
  private checkboxParticle: CheckboxParticle

  constructor(elementList: IElement[], options: IPdfOption) {
    this.fakeCanvas = document.createElement('canvas')
    this.fakeCtx = this.fakeCanvas.getContext('2d')!
    this.elementList = elementList
    this.editorOptions = options.editorOptions
    this.rowList = []
    this.positionList = []

    const { width, height } = this.editorOptions
    this.doc = new jsPDF({
      orientation: 'p',
      unit: 'px',
      format: [width, height],
      hotfixes: ['px_scaling'],
      compress: true
    })
    if (options.documentProperties) {
      this.doc.setDocumentProperties(options.documentProperties)
    }
    this.ctx = this.doc.context2d

    this._init()

    this.underline = new Underline(this)
    this.strikeout = new Strikeout(this)
    this.highlight = new Highlight(this)
    this.tableParticle = new TableParticle(this)
    this.textParticle = new TextParticle(this)
    this.imageParticle = new ImageParticle(this)
    this.pageNumber = new PageNumber(this)
    this.waterMark = new Watermark(this)
    this.header = new Header(this)
    this.hyperlinkParticle = new HyperlinkParticle(this)
    this.separatorParticle = new SeparatorParticle()
    this.pageBreakParticle = new PageBreakParticle(this)
    this.superscriptParticle = new SuperscriptParticle()
    this.subscriptParticle = new SubscriptParticle()
    this.checkboxParticle = new CheckboxParticle(this)
  }

  public getDoc(): jsPDF {
    return this.doc
  }

  public getCtx(): Context2d {
    return this.ctx
  }

  public getFakeCtx() {
    return this.fakeCtx
  }

  public measureText(font: string, text: string): TextMetrics {
    this.fakeCtx.save()
    this.fakeCtx.font = font
    const textMetrics = this.fakeCtx.measureText(text)
    this.fakeCtx.restore()
    return textMetrics
  }

  public getOptions(): DeepRequired<IEditorOption> {
    return this.editorOptions
  }

  public getInnerWidth(): number {
    const { width, margins } = this.editorOptions
    return width - margins[1] - margins[3]
  }

  private _init() {
    this._addFont()
    formatElementList(this.elementList, this.editorOptions)
  }

  private _addFont() {
    this.doc.addFont('/src/assets/font/msyh.ttf', 'Yahei', 'normal')
    this.doc.addFont('/src/assets/font/msyh-bold.ttf', 'Yahei', 'bold')
    this.doc.setFont('Yahei')
  }

  public getFont(el: IElement): string {
    const { defaultSize, defaultFont } = this.editorOptions
    const font = el.font || defaultFont
    const size = el.actualSize || el.size || defaultSize
    return `${el.italic ? 'italic ' : ''}${el.bold ? 'bold ' : ''}${size}px ${font}`
  }

  private _createPage() {
    const { width, height } = this.editorOptions
    this.doc.addPage([width, height], 'p')
  }

  private _computeRowList(innerWidth: number, elementList: IElement[]) {
    const { defaultSize, defaultRowMargin, tdPadding, defaultBasicRowMarginHeight, margins } = this.editorOptions
    const tdGap = tdPadding * 2
    const rowList: IRow[] = []
    if (elementList.length) {
      rowList.push({
        width: 0,
        height: 0,
        ascent: 0,
        elementList: [],
        rowFlex: elementList?.[1]?.rowFlex
      })
    }
    for (let i = 0; i < elementList.length; i++) {
      const curRow: IRow = rowList[rowList.length - 1]
      const element = elementList[i]
      const rowMargin = defaultBasicRowMarginHeight * (element.rowMargin || defaultRowMargin)
      const metrics: IElementMetrics = {
        width: 0,
        height: 0,
        boundingBoxAscent: 0,
        boundingBoxDescent: 0
      }
      if (element.type === ElementType.IMAGE) {
        const elementWidth = element.width!
        const elementHeight = element.height!
        // 图片超出尺寸后自适应
        if (curRow.width + elementWidth > innerWidth) {
          // 计算剩余大小
          const surplusWidth = innerWidth - curRow.width
          element.width = surplusWidth
          element.height = elementHeight * surplusWidth / elementWidth
          metrics.width = element.width
          metrics.height = element.height
          metrics.boundingBoxDescent = element.height
        } else {
          metrics.width = elementWidth
          metrics.height = elementHeight
          metrics.boundingBoxDescent = elementHeight
        }
        metrics.boundingBoxAscent = 0
      } else if (element.type === ElementType.TABLE) {
        // 计算表格行列
        this.tableParticle.computeRowColInfo(element)
        // 计算表格内元素信息
        const trList = element.trList!
        for (let t = 0; t < trList.length; t++) {
          const tr = trList[t]
          let maxTrHeight = 0
          for (let d = 0; d < tr.tdList.length; d++) {
            const td = tr.tdList[d]
            const rowList = this._computeRowList(td.width! - tdGap, td.value)
            const rowHeight = rowList.reduce((pre, cur) => pre + cur.height, 0)
            td.rowList = rowList
            // 移除缩放导致的行高变化-渲染时会进行缩放调整
            const curTrHeight = rowHeight + tdGap
            if (maxTrHeight < curTrHeight) {
              maxTrHeight = curTrHeight
            }
          }
          if (maxTrHeight > tr.height) {
            tr.height = maxTrHeight
          }
        }
        // 需要重新计算表格内值
        this.tableParticle.computeRowColInfo(element)
        // 计算出表格高度
        const tableHeight = trList.reduce((pre, cur) => pre + cur.height, 0)
        const tableWidth = element.colgroup!.reduce((pre, cur) => pre + cur.width, 0)
        element.width = tableWidth
        element.height = tableHeight
        const elementWidth = tableWidth
        const elementHeight = tableHeight
        metrics.width = elementWidth
        metrics.height = elementHeight
        metrics.boundingBoxDescent = elementHeight
        metrics.boundingBoxAscent = 0
        // 表格分页处理(拆分表格)
        const marginHeight = margins[0] + margins[2]
        let curPagePreHeight = marginHeight
        const { height } = this.editorOptions
        for (let r = 0; r < rowList.length; r++) {
          const row = rowList[r]
          if (row.height + curPagePreHeight > height || rowList[r - 1]?.isPageBreak) {
            curPagePreHeight = marginHeight + row.height
          } else {
            curPagePreHeight += row.height
          }
        }
        // 表格高度超过页面高度
        const rowMarginHeight = rowMargin * 2
        if (curPagePreHeight + rowMarginHeight + elementHeight > height) {
          const trList = element.trList!
          // 计算需要移除的行数
          let deleteStart = 0
          let deleteCount = 0
          let preTrHeight = 0
          if (trList.length > 1) {
            for (let r = 0; r < trList.length; r++) {
              const tr = trList[r]
              if (curPagePreHeight + rowMarginHeight + preTrHeight + tr.height > height) {
                // 是否跨列
                if (element.colgroup?.length !== tr.tdList.length) {
                  deleteCount = 0
                }
                break
              } else {
                deleteStart = r + 1
                deleteCount = trList.length - deleteStart
                preTrHeight += tr.height
              }
            }
          }
          if (deleteCount) {
            const cloneTrList = trList.splice(deleteStart, deleteCount)
            const cloneTrHeight = cloneTrList.reduce((pre, cur) => pre + cur.height, 0)
            element.height -= cloneTrHeight
            metrics.height -= cloneTrHeight
            metrics.boundingBoxDescent -= cloneTrHeight
            // 追加拆分表格
            const cloneElement = deepClone(element)
            cloneElement.trList = cloneTrList
            elementList.splice(i + 1, 0, cloneElement)
          }
        }
      } else if (element.type === ElementType.SEPARATOR) {
        element.width = innerWidth
        metrics.width = innerWidth
        metrics.height = this.editorOptions.defaultSize
        metrics.boundingBoxAscent = -rowMargin
        metrics.boundingBoxDescent = -rowMargin
      } else if (element.type === ElementType.PAGE_BREAK) {
        element.width = innerWidth
        metrics.width = innerWidth
        metrics.height = this.editorOptions.defaultSize
      } else if (
        element.type === ElementType.CHECKBOX ||
        element.controlComponent === ControlComponent.CHECKBOX
      ) {
        const { width, height, gap } = this.editorOptions.checkbox
        const elementWidth = width + gap * 2
        element.width = elementWidth
        metrics.width = elementWidth
        metrics.height = height
      } else {
        // 设置上下标真实字体尺寸
        const size = element.size || this.editorOptions.defaultSize
        if (element.type === ElementType.SUPERSCRIPT || element.type === ElementType.SUBSCRIPT) {
          element.actualSize = Math.ceil(size * 0.6)
        }
        metrics.height = element.actualSize || size
        const fontMetrics = this.textParticle.measureText(element)
        metrics.width = fontMetrics.width
        if (element.letterSpacing) {
          metrics.width += element.letterSpacing
        }
        metrics.boundingBoxAscent = element.value === '\n' ? defaultSize : fontMetrics.actualBoundingBoxAscent
        metrics.boundingBoxDescent = fontMetrics.actualBoundingBoxDescent
        if (element.type === ElementType.SUPERSCRIPT) {
          metrics.boundingBoxAscent += metrics.height / 2
        } else if (element.type === ElementType.SUBSCRIPT) {
          metrics.boundingBoxDescent += metrics.height / 2
        }
      }
      const ascent = metrics.boundingBoxAscent + rowMargin
      const descent = metrics.boundingBoxDescent + rowMargin
      const height = ascent + descent
      const rowElement: IRowElement = Object.assign(element, {
        metrics,
        style: this.getFont(element)
      })
      // 超过限定宽度
      const preElement = elementList[i - 1]
      if (
        (preElement && preElement.type === ElementType.TABLE)
        || curRow.width + metrics.width > innerWidth
        || element.value === '\n'
      ) {
        rowList.push({
          width: metrics.width,
          height,
          elementList: [rowElement],
          ascent,
          rowFlex: rowElement.rowFlex,
          isPageBreak: element.type === ElementType.PAGE_BREAK
        })
      } else {
        curRow.width += metrics.width
        if (curRow.height < height) {
          curRow.height = height
          if (element.type === ElementType.IMAGE) {
            curRow.ascent = metrics.height
          } else {
            curRow.ascent = ascent
          }
        }
        curRow.elementList.push(rowElement)
      }
    }
    return rowList
  }

  private _drawRow(ctx: Context2d, payload: IDrawRowPayload): IDrawRowResult {
    const { positionList, rowList, pageNo, startX, startY, startIndex, innerWidth } = payload
    const { tdPadding } = this.editorOptions
    const tdGap = tdPadding * 2
    let x = startX
    let y = startY
    let index = startIndex
    for (let i = 0; i < rowList.length; i++) {
      const curRow = rowList[i]
      // 计算行偏移量（行居左、居中、居右）
      if (curRow.rowFlex && curRow.rowFlex !== RowFlex.LEFT) {
        if (curRow.rowFlex === RowFlex.CENTER) {
          x += (innerWidth - curRow.width) / 2
        } else {
          x += innerWidth - curRow.width
        }
      }
      // 当前td所在位置
      const tablePreX = x
      const tablePreY = y
      for (let j = 0; j < curRow.elementList.length; j++) {
        const element = curRow.elementList[j]
        const metrics = element.metrics
        const offsetY = element.type === ElementType.IMAGE
          ? curRow.ascent - metrics.height
          : curRow.ascent
        const positionItem: IElementPosition = {
          pageNo,
          index,
          value: element.value,
          rowNo: i,
          metrics,
          ascent: offsetY,
          lineHeight: curRow.height,
          isLastLetter: j === curRow.elementList.length - 1,
          coordinate: {
            leftTop: [x, y],
            leftBottom: [x, y + curRow.height],
            rightTop: [x + metrics.width, y],
            rightBottom: [x + metrics.width, y + curRow.height]
          }
        }
        positionList.push(positionItem)
        // 元素绘制
        if (element.type === ElementType.IMAGE) {
          this.textParticle.complete()
          this.imageParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.TABLE) {
          this.tableParticle.render(ctx, element, x, y)
        } else if (element.type === ElementType.HYPERLINK) {
          this.textParticle.complete()
          this.hyperlinkParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.SUPERSCRIPT) {
          this.textParticle.complete()
          this.superscriptParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.SUBSCRIPT) {
          this.textParticle.complete()
          this.subscriptParticle.render(ctx, element, x, y + offsetY)
        } else if (element.type === ElementType.SEPARATOR) {
          this.separatorParticle.render(ctx, element, x, y)
        } else if (element.type === ElementType.PAGE_BREAK) {
          this.pageBreakParticle.render(ctx, element, x, y)
        } else if (
          element.type === ElementType.CHECKBOX ||
          element.controlComponent === ControlComponent.CHECKBOX
        ) {
          this.textParticle.complete()
          this.checkboxParticle.render(ctx, element, x, y + offsetY)
        } else {
          this.textParticle.record(ctx, element, x, y + offsetY)
        }
        // 下划线绘制
        if (element.underline) {
          this.underline.render(ctx, element.color!, x, y + curRow.height, metrics.width)
        }
        // 删除线绘制
        if (element.strikeout) {
          this.strikeout.render(ctx, x, y + curRow.height / 2, metrics.width)
        }
        // 元素高亮
        if (element.highlight) {
          this.highlight.render(ctx, element.highlight, x, y, metrics.width, curRow.height)
        }
        index++
        x += metrics.width
        // 绘制表格内元素
        if (element.type === ElementType.TABLE) {
          for (let t = 0; t < element.trList!.length; t++) {
            const tr = element.trList![t]
            for (let d = 0; d < tr.tdList!.length; d++) {
              const td = tr.tdList[d]
              td.positionList = []
              const drawRowResult = this._drawRow(ctx, {
                positionList: td.positionList,
                rowList: td.rowList!,
                pageNo,
                startIndex: 0,
                startX: td.x! + tdPadding + tablePreX,
                startY: td.y! + tablePreY,
                innerWidth: td.width! - tdGap
              })
              x = drawRowResult.x
              y = drawRowResult.y
            }
          }
          // 恢复初始x、y
          x = tablePreX
          y = tablePreY
        }
      }
      this.textParticle.complete()
      x = startX
      y += curRow.height
    }
    return { x, y, index }
  }

  private _drawPage(positionList: IElementPosition[], rowList: IRow[], pageNo: number) {
    const { width, height, margins } = this.editorOptions
    const innerWidth = this.getInnerWidth()
    this.ctx.clearRect(0, 0, width, height)
    // 绘制水印
    if (this.editorOptions.watermark.data) {
      this.waterMark.render(this.ctx)
    }
    // 绘制页边距
    const leftTopPoint: [number, number] = [margins[3], margins[0]]
    // 渲染元素
    let x = leftTopPoint[0]
    let y = leftTopPoint[1]
    let index = positionList.length
    const drawRowResult = this._drawRow(this.ctx, {
      positionList,
      rowList,
      pageNo,
      startIndex: index,
      startX: x,
      startY: y,
      innerWidth
    })
    x = drawRowResult.x
    y = drawRowResult.y
    index = drawRowResult.index
    // 绘制页眉
    this.header.render(this.ctx)
    // 绘制页码
    this.pageNumber.render(this.ctx, pageNo)
  }

  public render(): URL {
    const { height, margins } = this.editorOptions
    const innerWidth = this.getInnerWidth()
    // 计算行信息
    this.rowList = this._computeRowList(innerWidth, this.elementList)
    // 清除光标等副作用
    this.positionList = []
    // 按页渲染
    const marginHeight = margins[0] + margins[2]
    let pageHeight = marginHeight
    let pageNo = 0
    const pageRowList: IRow[][] = [[]]
    for (let i = 0; i < this.rowList.length; i++) {
      const row = this.rowList[i]
      if (row.height + pageHeight > height || this.rowList[i - 1]?.isPageBreak) {
        pageHeight = marginHeight + row.height
        pageRowList.push([row])
        pageNo++
      } else {
        pageHeight += row.height
        pageRowList[pageNo].push(row)
      }
    }
    // 绘制元素
    for (let i = 0; i < pageRowList.length; i++) {
      if (i !== 0) {
        this._createPage()
      }
      const rowList = pageRowList[i]
      this._drawPage(this.positionList, rowList, i)
    }

    // 新页面显示
    return this.doc.output('bloburi')
  }

}