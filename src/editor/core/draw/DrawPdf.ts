import { Draw } from './Draw'
import { IDrawPagePayload, IGetPdfOption } from '../../interface/Draw'
import { PdfCERenderingContext } from '../../pdf/PdfCERenderingContext'
import { EditorMode, EditorZone, PageMode } from '../../dataset/enum/Editor'
import { ImageDisplay } from '../../dataset/enum/Common'
import { ImageParticle } from './particle/ImageParticle'
import jsPDF from 'jspdf'

export class DrawPdf {
  private ctxList: PdfCERenderingContext[]
  private draw: Draw
  private doc: jsPDF

  constructor(draw: Draw, private option: IGetPdfOption = {}) {
    this.ctxList = []
    this.draw = draw
    const options = this.draw.getOptions()
    const { width, height } = options
    this.doc = new window.jspdf.jsPDF({
      orientation: 'p',
      unit: 'px',
      format: [width, height],
      hotfixes: ['px_scaling'],
      compress: true
    })
    const pageList = this.draw.getPageList()
    if (pageList && pageList.length) {
      for (let i = 0; i < pageList.length; i++) {
        if (i !=0) {
          this.doc.addPage([width, height])
        }
        this.ctxList.push(new PdfCERenderingContext(i+1, this.doc))
      }
      this.doc.setPage(1)
    }
  }

  public genPdf(): Promise<Blob> {

    if (typeof this.option.beforeExport === 'function') {
      this.option.beforeExport(this.doc)
    }
    const mode = this.draw.getMode()
    if (mode != EditorMode.PRINT) {
      this.draw.setMode(EditorMode.PRINT)
    }
    const positionList = this.draw.getPosition().getOriginalMainPositionList()
    const elementList = this.draw.getOriginalMainElementList()
    const pageRowList = this.draw.getPageRowList()
    try {
      for (let i = 0; i < pageRowList.length; i++) {
        this._drawPage({
          elementList,
          positionList,
          rowList: pageRowList[i],
          pageNo: i
        })
      }
      if (mode != EditorMode.PRINT) {
        this.draw.setMode(mode)
      }
    } catch (e) {
      console.error(e)
      if (mode != EditorMode.PRINT) {
        this.draw.setMode(mode)
      }
    }
    const promises: Promise<any>[] = []
    for (let i = 0; i < this.ctxList.length; i++) {
      promises.push(this.ctxList[i].loadOver())
    }
    return Promise.all(promises).then(() => {
      return this.doc.output('blob')
    })
  }

  private _drawPage(payload: IDrawPagePayload) {
    const { elementList, positionList, rowList, pageNo } = payload
    const {
      pageMode,
      header,
      footer,
      pageNumber,
      pageBorder
    } = this.draw.getOptions()
    const innerWidth = this.draw.getInnerWidth()
    const ctx = this.ctxList[pageNo]
    // 判断当前激活区域-非正文区域时元素透明度降低
    // 绘制背景
    this.draw.getBackground().render(ctx, pageNo)
    // 渲染衬于文字下方元素
    ImageParticle.drawFloat(ctx, {
      pageNo,
      imgDisplays: [ImageDisplay.FLOAT_BOTTOM]
    }, 1, this.draw.getPosition().getFloatPositionList(), this.draw.getImageParticle())
    // 渲染元素
    const index = rowList[0]?.startIndex

    this.draw.drawRow(ctx, {
      elementList,
      positionList,
      rowList,
      pageNo,
      startIndex: index,
      innerWidth,
      zone: EditorZone.MAIN
    })
    if (this.draw.getIsPagingMode()) {
      // 绘制页眉
      if (!header.disabled) {
        this.draw.getHeader().render(ctx, pageNo)
      }
      // 绘制页码
      if (!pageNumber.disabled) {
        this.draw.getPageNumber().render(ctx, pageNo)
      }
      // 绘制页脚
      if (!footer.disabled) {
        this.draw.getFooter().render(ctx, pageNo)
      }
    }
    // 渲染浮于文字上方元素
    ImageParticle.drawFloat(ctx, {
      pageNo,
      imgDisplays: [ImageDisplay.FLOAT_TOP, ImageDisplay.SURROUND]
    }, 1, this.draw.getPosition().getFloatPositionList(), this.draw.getImageParticle())

    // 绘制水印
    if (pageMode !== PageMode.CONTINUITY && this.draw.getOptions().watermark.data) {
      this.draw.getWaterMark().render(ctx)
    }

    // 绘制页面边框
    if (!pageBorder.disabled) {
      this.draw.getPageBorder().render(ctx)
    }
  }
}
