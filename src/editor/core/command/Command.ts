import { CommandAdapt } from './CommandAdapt'

// 通过CommandAdapt中转避免直接暴露编辑器上下文
export class Command {
  public executeMode: CommandAdapt['mode']
  public executeCut: CommandAdapt['cut']
  public executeCopy: CommandAdapt['copy']
  public executePaste: CommandAdapt['paste']
  public executeSelectAll: CommandAdapt['selectAll']
  public executeBackspace: CommandAdapt['backspace']
  public executeSetRange: CommandAdapt['setRange']
  public executeUndo: CommandAdapt['undo']
  public executeRedo: CommandAdapt['redo']
  public executePainter: CommandAdapt['painter']
  public executeApplyPainterStyle: CommandAdapt['applyPainterStyle']
  public executeFormat: CommandAdapt['format']
  public executeFont: CommandAdapt['font']
  public executeSize: CommandAdapt['size']
  public executeSizeAdd: CommandAdapt['sizeAdd']
  public executeSizeMinus: CommandAdapt['sizeMinus']
  public executeBold: CommandAdapt['bold']
  public executeItalic: CommandAdapt['italic']
  public executeUnderline: CommandAdapt['underline']
  public executeStrikeout: CommandAdapt['strikeout']
  public executeSuperscript: CommandAdapt['superscript']
  public executeSubscript: CommandAdapt['subscript']
  public executeColor: CommandAdapt['color']
  public executeHighlight: CommandAdapt['highlight']
  public executeTitle: CommandAdapt['title']
  public executeList: CommandAdapt['list']
  public executeRowFlex: CommandAdapt['rowFlex']
  public executeRowMargin: CommandAdapt['rowMargin']
  public executeInsertTable: CommandAdapt['insertTable']
  public executeInsertTableTopRow: CommandAdapt['insertTableTopRow']
  public executeInsertTableBottomRow: CommandAdapt['insertTableBottomRow']
  public executeInsertTableLeftCol: CommandAdapt['insertTableLeftCol']
  public executeInsertTableRightCol: CommandAdapt['insertTableRightCol']
  public executeDeleteTableRow: CommandAdapt['deleteTableRow']
  public executeDeleteTableCol: CommandAdapt['deleteTableCol']
  public executeDeleteTable: CommandAdapt['deleteTable']
  public executeMergeTableCell: CommandAdapt['mergeTableCell']
  public executeCancelMergeTableCell: CommandAdapt['cancelMergeTableCell']
  public executeTableTdVerticalAlign: CommandAdapt['tableTdVerticalAlign']
  public executeTableBorderType: CommandAdapt['tableBorderType']
  public executeTableTdBackgroundColor: CommandAdapt['tableTdBackgroundColor']
  public executeTableSelectAll: CommandAdapt['tableSelectAll']
  public executeImage: CommandAdapt['image']
  public executeHyperlink: CommandAdapt['hyperlink']
  public executeDeleteHyperlink: CommandAdapt['deleteHyperlink']
  public executeCancelHyperlink: CommandAdapt['cancelHyperlink']
  public executeEditHyperlink: CommandAdapt['editHyperlink']
  public executeSeparator: CommandAdapt['separator']
  public executePageBreak: CommandAdapt['pageBreak']
  public executeAddWatermark: CommandAdapt['addWatermark']
  public executeDeleteWatermark: CommandAdapt['deleteWatermark']
  public executeSearch: CommandAdapt['search']
  public executeSearchNavigatePre: CommandAdapt['searchNavigatePre']
  public executeSearchNavigateNext: CommandAdapt['searchNavigateNext']
  public executeReplace: CommandAdapt['replace']
  public executePrint: CommandAdapt['print']
  public executeReplaceImageElement: CommandAdapt['replaceImageElement']
  public executeSaveAsImageElement: CommandAdapt['saveAsImageElement']
  public executeChangeImageDisplay: CommandAdapt['changeImageDisplay']
  public executePageMode: CommandAdapt['pageMode']
  public executePageScaleRecovery: CommandAdapt['pageScaleRecovery']
  public executePageScaleMinus: CommandAdapt['pageScaleMinus']
  public executePageScaleAdd: CommandAdapt['pageScaleAdd']
  public executePaperSize: CommandAdapt['paperSize']
  public executePaperDirection: CommandAdapt['paperDirection']
  public executeSetPaperMargin: CommandAdapt['setPaperMargin']
  public executeInsertElementList: CommandAdapt['insertElementList']
  public executeAppendElementList: CommandAdapt['appendElementList']
  public executeSetValue: CommandAdapt['setValue']
  public executeRemoveControl: CommandAdapt['removeControl']
  public executeSetLocale: CommandAdapt['setLocale']
  public executeLocationCatalog: CommandAdapt['locationCatalog']
  public executeWordTool: CommandAdapt['wordTool']
  public executeSetHTML: CommandAdapt['setHTML']
  public getCatalog: CommandAdapt['getCatalog']
  public getImage: CommandAdapt['getImage']
  public getValue: CommandAdapt['getValue']
  public getHTML: CommandAdapt['getHTML']
  public getText: CommandAdapt['getText']
  public getWordCount: CommandAdapt['getWordCount']
  public getRangeText: CommandAdapt['getRangeText']
  public getRangeContext: CommandAdapt['getRangeContext']
  public getPaperMargin: CommandAdapt['getPaperMargin']
  public getSearchNavigateInfo: CommandAdapt['getSearchNavigateInfo']
  public getLocale: CommandAdapt['getLocale']

  constructor(adapt: CommandAdapt) {
    // 全局命令
    this.executeMode = adapt.mode.bind(adapt)
    this.executeCut = adapt.cut.bind(adapt)
    this.executeCopy = adapt.copy.bind(adapt)
    this.executePaste = adapt.paste.bind(adapt)
    this.executeSelectAll = adapt.selectAll.bind(adapt)
    this.executeBackspace = adapt.backspace.bind(adapt)
    this.executeSetRange = adapt.setRange.bind(adapt)
    // 撤销、重做、格式刷、清除格式
    this.executeUndo = adapt.undo.bind(adapt)
    this.executeRedo = adapt.redo.bind(adapt)
    this.executePainter = adapt.painter.bind(adapt)
    this.executeApplyPainterStyle = adapt.applyPainterStyle.bind(adapt)
    this.executeFormat = adapt.format.bind(adapt)
    // 字体、字体大小、字体变大、字体变小、加粗、斜体、下划线、删除线、字体颜色、背景色
    this.executeFont = adapt.font.bind(adapt)
    this.executeSize = adapt.size.bind(adapt)
    this.executeSizeAdd = adapt.sizeAdd.bind(adapt)
    this.executeSizeMinus = adapt.sizeMinus.bind(adapt)
    this.executeBold = adapt.bold.bind(adapt)
    this.executeItalic = adapt.italic.bind(adapt)
    this.executeUnderline = adapt.underline.bind(adapt)
    this.executeStrikeout = adapt.strikeout.bind(adapt)
    this.executeSuperscript = adapt.superscript.bind(adapt)
    this.executeSubscript = adapt.subscript.bind(adapt)
    this.executeColor = adapt.color.bind(adapt)
    this.executeHighlight = adapt.highlight.bind(adapt)
    // 标题、对齐方式、列表
    this.executeTitle = adapt.title.bind(adapt)
    this.executeList = adapt.list.bind(adapt)
    this.executeRowFlex = adapt.rowFlex.bind(adapt)
    this.executeRowMargin = adapt.rowMargin.bind(adapt)
    // 表格、图片上传、超链接、搜索、打印、图片操作
    this.executeInsertTable = adapt.insertTable.bind(adapt)
    this.executeInsertTableTopRow = adapt.insertTableTopRow.bind(adapt)
    this.executeInsertTableBottomRow = adapt.insertTableBottomRow.bind(adapt)
    this.executeInsertTableLeftCol = adapt.insertTableLeftCol.bind(adapt)
    this.executeInsertTableRightCol = adapt.insertTableRightCol.bind(adapt)
    this.executeDeleteTableRow = adapt.deleteTableRow.bind(adapt)
    this.executeDeleteTableCol = adapt.deleteTableCol.bind(adapt)
    this.executeDeleteTable = adapt.deleteTable.bind(adapt)
    this.executeMergeTableCell = adapt.mergeTableCell.bind(adapt)
    this.executeCancelMergeTableCell = adapt.cancelMergeTableCell.bind(adapt)
    this.executeTableTdVerticalAlign = adapt.tableTdVerticalAlign.bind(adapt)
    this.executeTableBorderType = adapt.tableBorderType.bind(adapt)
    this.executeTableTdBackgroundColor =
      adapt.tableTdBackgroundColor.bind(adapt)
    this.executeTableSelectAll = adapt.tableSelectAll.bind(adapt)
    this.executeImage = adapt.image.bind(adapt)
    this.executeHyperlink = adapt.hyperlink.bind(adapt)
    this.executeDeleteHyperlink = adapt.deleteHyperlink.bind(adapt)
    this.executeCancelHyperlink = adapt.cancelHyperlink.bind(adapt)
    this.executeEditHyperlink = adapt.editHyperlink.bind(adapt)
    this.executeSeparator = adapt.separator.bind(adapt)
    this.executePageBreak = adapt.pageBreak.bind(adapt)
    this.executeAddWatermark = adapt.addWatermark.bind(adapt)
    this.executeDeleteWatermark = adapt.deleteWatermark.bind(adapt)
    this.executeSearch = adapt.search.bind(adapt)
    this.executeSearchNavigatePre = adapt.searchNavigatePre.bind(adapt)
    this.executeSearchNavigateNext = adapt.searchNavigateNext.bind(adapt)
    this.executeReplace = adapt.replace.bind(adapt)
    this.executePrint = adapt.print.bind(adapt)
    this.executeReplaceImageElement = adapt.replaceImageElement.bind(adapt)
    this.executeSaveAsImageElement = adapt.saveAsImageElement.bind(adapt)
    this.executeChangeImageDisplay = adapt.changeImageDisplay.bind(adapt)
    // 页面模式、页面缩放、纸张大小、纸张方向、页边距
    this.executePageMode = adapt.pageMode.bind(adapt)
    this.executePageScaleRecovery = adapt.pageScaleRecovery.bind(adapt)
    this.executePageScaleMinus = adapt.pageScaleMinus.bind(adapt)
    this.executePageScaleAdd = adapt.pageScaleAdd.bind(adapt)
    this.executePaperSize = adapt.paperSize.bind(adapt)
    this.executePaperDirection = adapt.paperDirection.bind(adapt)
    this.executeSetPaperMargin = adapt.setPaperMargin.bind(adapt)
    // 通用
    this.executeInsertElementList = adapt.insertElementList.bind(adapt)
    this.executeAppendElementList = adapt.appendElementList.bind(adapt)
    this.executeSetValue = adapt.setValue.bind(adapt)
    this.executeRemoveControl = adapt.removeControl.bind(adapt)
    this.executeSetLocale = adapt.setLocale.bind(adapt)
    this.executeLocationCatalog = adapt.locationCatalog.bind(adapt)
    this.executeWordTool = adapt.wordTool.bind(adapt)
    this.executeSetHTML = adapt.setHTML.bind(adapt)

    // 获取
    this.getImage = adapt.getImage.bind(adapt)
    this.getValue = adapt.getValue.bind(adapt)
    this.getHTML = adapt.getHTML.bind(adapt)
    this.getText = adapt.getText.bind(adapt)
    this.getWordCount = adapt.getWordCount.bind(adapt)
    this.getRangeText = adapt.getRangeText.bind(adapt)
    this.getRangeContext = adapt.getRangeContext.bind(adapt)
    this.getCatalog = adapt.getCatalog.bind(adapt)
    this.getPaperMargin = adapt.getPaperMargin.bind(adapt)
    this.getSearchNavigateInfo = adapt.getSearchNavigateInfo.bind(adapt)
    this.getLocale = adapt.getLocale.bind(adapt)
  }
}
