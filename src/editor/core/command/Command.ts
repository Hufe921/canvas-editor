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
  public executeReplaceRange: CommandAdapt['replaceRange']
  public executeSetPositionContext: CommandAdapt['setPositionContext']
  public executeForceUpdate: CommandAdapt['forceUpdate']
  public executeBlur: CommandAdapt['blur']
  public executeHideCursor: CommandAdapt['hideCursor']
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
  public executeSplitVerticalTableCell: CommandAdapt['splitVerticalTableCell']
  public executeSplitHorizontalTableCell: CommandAdapt['splitHorizontalTableCell']
  public executeTableTdVerticalAlign: CommandAdapt['tableTdVerticalAlign']
  public executeTableBorderType: CommandAdapt['tableBorderType']
  public executeTableBorderColor: CommandAdapt['tableBorderColor']
  public executeTableTdBorderType: CommandAdapt['tableTdBorderType']
  public executeTableTdSlashType: CommandAdapt['tableTdSlashType']
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
  public executeSetImageCrop: CommandAdapt['setImageCrop']
  public executeSetImageCaption: CommandAdapt['setImageCaption']
  public executeChangeImageDisplay: CommandAdapt['changeImageDisplay']
  public executePageMode: CommandAdapt['pageMode']
  public executeSetColumns: CommandAdapt['setColumns']
  public executePageScale: CommandAdapt['pageScale']
  public executePageScaleRecovery: CommandAdapt['pageScaleRecovery']
  public executePageScaleMinus: CommandAdapt['pageScaleMinus']
  public executePageScaleAdd: CommandAdapt['pageScaleAdd']
  public executePaperSize: CommandAdapt['paperSize']
  public executePaperDirection: CommandAdapt['paperDirection']
  public executeSetPaperMargin: CommandAdapt['setPaperMargin']
  public executeSetMainBadge: CommandAdapt['setMainBadge']
  public executeSetAreaBadge: CommandAdapt['setAreaBadge']
  public executeInsertElementList: CommandAdapt['insertElementList']
  public executeInsertArea: CommandAdapt['insertArea']
  public executeSetAreaValue: CommandAdapt['setAreaValue']
  public executeSetAreaProperties: CommandAdapt['setAreaProperties']
  public executeDeleteArea: CommandAdapt['deleteArea']
  public executeLocationArea: CommandAdapt['locationArea']
  public executeClearGraffiti: CommandAdapt['clearGraffiti']
  public executeAppendElementList: CommandAdapt['appendElementList']
  public executeUpdateElementById: CommandAdapt['updateElementById']
  public executeDeleteElementById: CommandAdapt['deleteElementById']
  public executeSetValue: CommandAdapt['setValue']
  public executeRemoveControl: CommandAdapt['removeControl']
  public executeTranslate: CommandAdapt['translate']
  public executeSetLocale: CommandAdapt['setLocale']
  public executeLocationCatalog: CommandAdapt['locationCatalog']
  public executeWordTool: CommandAdapt['wordTool']
  public executeSetHTML: CommandAdapt['setHTML']
  public executeSetGroup: CommandAdapt['setGroup']
  public executeDeleteGroup: CommandAdapt['deleteGroup']
  public executeLocationGroup: CommandAdapt['locationGroup']
  public executeSetZone: CommandAdapt['setZone']
  public executeSetControlValue: CommandAdapt['setControlValue']
  public executeSetControlValueList: CommandAdapt['setControlValueList']
  public executeSetControlExtension: CommandAdapt['setControlExtension']
  public executeSetControlExtensionList: CommandAdapt['setControlExtensionList']
  public executeSetControlProperties: CommandAdapt['setControlProperties']
  public executeSetControlPropertiesList: CommandAdapt['setControlPropertiesList']
  public executeSetControlHighlight: CommandAdapt['setControlHighlight']
  public executeLocationControl: CommandAdapt['locationControl']
  public executeInsertControl: CommandAdapt['insertControl']
  public executeJumpControl: CommandAdapt['jumpControl']
  public executeUpdateOptions: CommandAdapt['updateOptions']
  public executeInsertTitle: CommandAdapt['insertTitle']
  public executeFocus: CommandAdapt['focus']
  public executeComputeElementListHeight: CommandAdapt['computeElementListHeight']
  public getCatalog: CommandAdapt['getCatalog']
  public getImage: CommandAdapt['getImage']
  public getOptions: CommandAdapt['getOptions']
  public getValue: CommandAdapt['getValue']
  public getValueAsync: CommandAdapt['getValueAsync']
  public getAreaValue: CommandAdapt['getAreaValue']
  public getHTML: CommandAdapt['getHTML']
  public getText: CommandAdapt['getText']
  public getWordCount: CommandAdapt['getWordCount']
  public getCursorPosition: CommandAdapt['getCursorPosition']
  public getRemainingContentHeight: CommandAdapt['getRemainingContentHeight']
  public getRange: CommandAdapt['getRange']
  public getRangeText: CommandAdapt['getRangeText']
  public getRangeContext: CommandAdapt['getRangeContext']
  public getRangeRow: CommandAdapt['getRangeRow']
  public getRangeParagraph: CommandAdapt['getRangeParagraph']
  public getKeywordRangeList: CommandAdapt['getKeywordRangeList']
  public getKeywordContext: CommandAdapt['getKeywordContext']
  public getPaperMargin: CommandAdapt['getPaperMargin']
  public getColumns: CommandAdapt['getColumns']
  public getSearchNavigateInfo: CommandAdapt['getSearchNavigateInfo']
  public getLocale: CommandAdapt['getLocale']
  public getGroupIds: CommandAdapt['getGroupIds']
  public getControlValue: CommandAdapt['getControlValue']
  public getControlList: CommandAdapt['getControlList']
  public getContainer: CommandAdapt['getContainer']
  public getTitleValue: CommandAdapt['getTitleValue']
  public getPositionContextByEvent: CommandAdapt['getPositionContextByEvent']
  public getElementById: CommandAdapt['getElementById']

  private interceptor?: (name: string, args: unknown[]) => void

  public setInterceptor(fn?: (name: string, args: unknown[]) => void) {
    this.interceptor = fn
  }

  private wrap<T extends (...args: any[]) => any>(name: string, fn: T): T {
    return ((...args: any[]) => {
      this.interceptor?.(name, args)
      return fn(...args)
    }) as T
  }

  constructor(adapt: CommandAdapt) {
    // 全局命令
    this.executeMode = this.wrap('executeMode', adapt.mode.bind(adapt))
    this.executeCut = this.wrap('executeCut', adapt.cut.bind(adapt))
    this.executeCopy = this.wrap('executeCopy', adapt.copy.bind(adapt))
    this.executePaste = this.wrap('executePaste', adapt.paste.bind(adapt))
    this.executeSelectAll = this.wrap(
      'executeSelectAll',
      adapt.selectAll.bind(adapt)
    )
    this.executeBackspace = this.wrap(
      'executeBackspace',
      adapt.backspace.bind(adapt)
    )
    this.executeSetRange = this.wrap(
      'executeSetRange',
      adapt.setRange.bind(adapt)
    )
    this.executeReplaceRange = this.wrap(
      'executeReplaceRange',
      adapt.replaceRange.bind(adapt)
    )
    this.executeSetPositionContext = this.wrap(
      'executeSetPositionContext',
      adapt.setPositionContext.bind(adapt)
    )
    this.executeForceUpdate = this.wrap(
      'executeForceUpdate',
      adapt.forceUpdate.bind(adapt)
    )
    this.executeBlur = this.wrap('executeBlur', adapt.blur.bind(adapt))
    this.executeHideCursor = this.wrap(
      'executeHideCursor',
      adapt.hideCursor.bind(adapt)
    )
    // 撤销、重做、格式刷、清除格式
    this.executeUndo = this.wrap('executeUndo', adapt.undo.bind(adapt))
    this.executeRedo = this.wrap('executeRedo', adapt.redo.bind(adapt))
    this.executePainter = this.wrap('executePainter', adapt.painter.bind(adapt))
    this.executeApplyPainterStyle = this.wrap(
      'executeApplyPainterStyle',
      adapt.applyPainterStyle.bind(adapt)
    )
    this.executeFormat = this.wrap('executeFormat', adapt.format.bind(adapt))
    // 字体、字体大小、字体变大、字体变小、加粗、斜体、下划线、删除线、字体颜色、背景色
    this.executeFont = this.wrap('executeFont', adapt.font.bind(adapt))
    this.executeSize = this.wrap('executeSize', adapt.size.bind(adapt))
    this.executeSizeAdd = this.wrap('executeSizeAdd', adapt.sizeAdd.bind(adapt))
    this.executeSizeMinus = this.wrap(
      'executeSizeMinus',
      adapt.sizeMinus.bind(adapt)
    )
    this.executeBold = this.wrap('executeBold', adapt.bold.bind(adapt))
    this.executeItalic = this.wrap('executeItalic', adapt.italic.bind(adapt))
    this.executeUnderline = this.wrap(
      'executeUnderline',
      adapt.underline.bind(adapt)
    )
    this.executeStrikeout = this.wrap(
      'executeStrikeout',
      adapt.strikeout.bind(adapt)
    )
    this.executeSuperscript = this.wrap(
      'executeSuperscript',
      adapt.superscript.bind(adapt)
    )
    this.executeSubscript = this.wrap(
      'executeSubscript',
      adapt.subscript.bind(adapt)
    )
    this.executeColor = this.wrap('executeColor', adapt.color.bind(adapt))
    this.executeHighlight = this.wrap(
      'executeHighlight',
      adapt.highlight.bind(adapt)
    )
    // 标题、对齐方式、列表
    this.executeTitle = this.wrap('executeTitle', adapt.title.bind(adapt))
    this.executeList = this.wrap('executeList', adapt.list.bind(adapt))
    this.executeRowFlex = this.wrap('executeRowFlex', adapt.rowFlex.bind(adapt))
    this.executeRowMargin = this.wrap(
      'executeRowMargin',
      adapt.rowMargin.bind(adapt)
    )
    // 表格、图片上传、超链接、搜索、打印、图片操作
    this.executeInsertTable = this.wrap(
      'executeInsertTable',
      adapt.insertTable.bind(adapt)
    )
    this.executeInsertTableTopRow = this.wrap(
      'executeInsertTableTopRow',
      adapt.insertTableTopRow.bind(adapt)
    )
    this.executeInsertTableBottomRow = this.wrap(
      'executeInsertTableBottomRow',
      adapt.insertTableBottomRow.bind(adapt)
    )
    this.executeInsertTableLeftCol = this.wrap(
      'executeInsertTableLeftCol',
      adapt.insertTableLeftCol.bind(adapt)
    )
    this.executeInsertTableRightCol = this.wrap(
      'executeInsertTableRightCol',
      adapt.insertTableRightCol.bind(adapt)
    )
    this.executeDeleteTableRow = this.wrap(
      'executeDeleteTableRow',
      adapt.deleteTableRow.bind(adapt)
    )
    this.executeDeleteTableCol = this.wrap(
      'executeDeleteTableCol',
      adapt.deleteTableCol.bind(adapt)
    )
    this.executeDeleteTable = this.wrap(
      'executeDeleteTable',
      adapt.deleteTable.bind(adapt)
    )
    this.executeMergeTableCell = this.wrap(
      'executeMergeTableCell',
      adapt.mergeTableCell.bind(adapt)
    )
    this.executeCancelMergeTableCell = this.wrap(
      'executeCancelMergeTableCell',
      adapt.cancelMergeTableCell.bind(adapt)
    )
    this.executeSplitVerticalTableCell = this.wrap(
      'executeSplitVerticalTableCell',
      adapt.splitVerticalTableCell.bind(adapt)
    )
    this.executeSplitHorizontalTableCell = this.wrap(
      'executeSplitHorizontalTableCell',
      adapt.splitHorizontalTableCell.bind(adapt)
    )
    this.executeTableTdVerticalAlign = this.wrap(
      'executeTableTdVerticalAlign',
      adapt.tableTdVerticalAlign.bind(adapt)
    )
    this.executeTableBorderType = this.wrap(
      'executeTableBorderType',
      adapt.tableBorderType.bind(adapt)
    )
    this.executeTableBorderColor = this.wrap(
      'executeTableBorderColor',
      adapt.tableBorderColor.bind(adapt)
    )
    this.executeTableTdBorderType = this.wrap(
      'executeTableTdBorderType',
      adapt.tableTdBorderType.bind(adapt)
    )
    this.executeTableTdSlashType = this.wrap(
      'executeTableTdSlashType',
      adapt.tableTdSlashType.bind(adapt)
    )
    this.executeTableTdBackgroundColor = this.wrap(
      'executeTableTdBackgroundColor',
      adapt.tableTdBackgroundColor.bind(adapt)
    )
    this.executeTableSelectAll = this.wrap(
      'executeTableSelectAll',
      adapt.tableSelectAll.bind(adapt)
    )
    this.executeImage = this.wrap('executeImage', adapt.image.bind(adapt))
    this.executeHyperlink = this.wrap(
      'executeHyperlink',
      adapt.hyperlink.bind(adapt)
    )
    this.executeDeleteHyperlink = this.wrap(
      'executeDeleteHyperlink',
      adapt.deleteHyperlink.bind(adapt)
    )
    this.executeCancelHyperlink = this.wrap(
      'executeCancelHyperlink',
      adapt.cancelHyperlink.bind(adapt)
    )
    this.executeEditHyperlink = this.wrap(
      'executeEditHyperlink',
      adapt.editHyperlink.bind(adapt)
    )
    this.executeSeparator = this.wrap(
      'executeSeparator',
      adapt.separator.bind(adapt)
    )
    this.executePageBreak = this.wrap(
      'executePageBreak',
      adapt.pageBreak.bind(adapt)
    )
    this.executeAddWatermark = this.wrap(
      'executeAddWatermark',
      adapt.addWatermark.bind(adapt)
    )
    this.executeDeleteWatermark = this.wrap(
      'executeDeleteWatermark',
      adapt.deleteWatermark.bind(adapt)
    )
    this.executeSearch = this.wrap('executeSearch', adapt.search.bind(adapt))
    this.executeSearchNavigatePre = this.wrap(
      'executeSearchNavigatePre',
      adapt.searchNavigatePre.bind(adapt)
    )
    this.executeSearchNavigateNext = this.wrap(
      'executeSearchNavigateNext',
      adapt.searchNavigateNext.bind(adapt)
    )
    this.executeReplace = this.wrap('executeReplace', adapt.replace.bind(adapt))
    this.executePrint = this.wrap('executePrint', adapt.print.bind(adapt))
    this.executeReplaceImageElement = this.wrap(
      'executeReplaceImageElement',
      adapt.replaceImageElement.bind(adapt)
    )
    this.executeSaveAsImageElement = this.wrap(
      'executeSaveAsImageElement',
      adapt.saveAsImageElement.bind(adapt)
    )
    this.executeSetImageCrop = this.wrap(
      'executeSetImageCrop',
      adapt.setImageCrop.bind(adapt)
    )
    this.executeSetImageCaption = this.wrap(
      'executeSetImageCaption',
      adapt.setImageCaption.bind(adapt)
    )
    this.executeChangeImageDisplay = this.wrap(
      'executeChangeImageDisplay',
      adapt.changeImageDisplay.bind(adapt)
    )
    // 页面模式、页面缩放、纸张大小、纸张方向、页边距
    this.executePageMode = this.wrap(
      'executePageMode',
      adapt.pageMode.bind(adapt)
    )
    this.executeSetColumns = this.wrap(
      'executeSetColumns',
      adapt.setColumns.bind(adapt)
    )
    this.executePageScale = this.wrap(
      'executePageScale',
      adapt.pageScale.bind(adapt)
    )
    this.executePageScaleRecovery = this.wrap(
      'executePageScaleRecovery',
      adapt.pageScaleRecovery.bind(adapt)
    )
    this.executePageScaleMinus = this.wrap(
      'executePageScaleMinus',
      adapt.pageScaleMinus.bind(adapt)
    )
    this.executePageScaleAdd = this.wrap(
      'executePageScaleAdd',
      adapt.pageScaleAdd.bind(adapt)
    )
    this.executePaperSize = this.wrap(
      'executePaperSize',
      adapt.paperSize.bind(adapt)
    )
    this.executePaperDirection = this.wrap(
      'executePaperDirection',
      adapt.paperDirection.bind(adapt)
    )
    this.executeSetPaperMargin = this.wrap(
      'executeSetPaperMargin',
      adapt.setPaperMargin.bind(adapt)
    )
    // 签章
    this.executeSetMainBadge = this.wrap(
      'executeSetMainBadge',
      adapt.setMainBadge.bind(adapt)
    )
    this.executeSetAreaBadge = this.wrap(
      'executeSetAreaBadge',
      adapt.setAreaBadge.bind(adapt)
    )
    // 区域
    this.getAreaValue = adapt.getAreaValue.bind(adapt)
    this.executeInsertArea = this.wrap(
      'executeInsertArea',
      adapt.insertArea.bind(adapt)
    )
    this.executeSetAreaValue = this.wrap(
      'executeSetAreaValue',
      adapt.setAreaValue.bind(adapt)
    )
    this.executeSetAreaProperties = this.wrap(
      'executeSetAreaProperties',
      adapt.setAreaProperties.bind(adapt)
    )
    this.executeDeleteArea = this.wrap(
      'executeDeleteArea',
      adapt.deleteArea.bind(adapt)
    )
    this.executeLocationArea = this.wrap(
      'executeLocationArea',
      adapt.locationArea.bind(adapt)
    )
    // 涂鸦
    this.executeClearGraffiti = this.wrap(
      'executeClearGraffiti',
      adapt.clearGraffiti.bind(adapt)
    )
    // 通用
    this.executeInsertElementList = this.wrap(
      'executeInsertElementList',
      adapt.insertElementList.bind(adapt)
    )
    this.executeAppendElementList = this.wrap(
      'executeAppendElementList',
      adapt.appendElementList.bind(adapt)
    )
    this.executeUpdateElementById = this.wrap(
      'executeUpdateElementById',
      adapt.updateElementById.bind(adapt)
    )
    this.executeDeleteElementById = this.wrap(
      'executeDeleteElementById',
      adapt.deleteElementById.bind(adapt)
    )
    this.executeSetValue = this.wrap(
      'executeSetValue',
      adapt.setValue.bind(adapt)
    )
    this.executeRemoveControl = this.wrap(
      'executeRemoveControl',
      adapt.removeControl.bind(adapt)
    )
    this.executeTranslate = this.wrap(
      'executeTranslate',
      adapt.translate.bind(adapt)
    )
    this.executeSetLocale = this.wrap(
      'executeSetLocale',
      adapt.setLocale.bind(adapt)
    )
    this.executeLocationCatalog = this.wrap(
      'executeLocationCatalog',
      adapt.locationCatalog.bind(adapt)
    )
    this.executeWordTool = this.wrap(
      'executeWordTool',
      adapt.wordTool.bind(adapt)
    )
    this.executeSetHTML = this.wrap('executeSetHTML', adapt.setHTML.bind(adapt))
    this.executeSetGroup = this.wrap(
      'executeSetGroup',
      adapt.setGroup.bind(adapt)
    )
    this.executeDeleteGroup = this.wrap(
      'executeDeleteGroup',
      adapt.deleteGroup.bind(adapt)
    )
    this.executeLocationGroup = this.wrap(
      'executeLocationGroup',
      adapt.locationGroup.bind(adapt)
    )
    this.executeSetZone = this.wrap('executeSetZone', adapt.setZone.bind(adapt))
    this.executeUpdateOptions = this.wrap(
      'executeUpdateOptions',
      adapt.updateOptions.bind(adapt)
    )
    this.executeInsertTitle = this.wrap(
      'executeInsertTitle',
      adapt.insertTitle.bind(adapt)
    )
    this.executeFocus = this.wrap('executeFocus', adapt.focus.bind(adapt))
    this.executeComputeElementListHeight = this.wrap(
      'executeComputeElementListHeight',
      adapt.computeElementListHeight.bind(adapt)
    )
    // 获取
    this.getImage = adapt.getImage.bind(adapt)
    this.getOptions = adapt.getOptions.bind(adapt)
    this.getValue = adapt.getValue.bind(adapt)
    this.getValueAsync = adapt.getValueAsync.bind(adapt)
    this.getHTML = adapt.getHTML.bind(adapt)
    this.getText = adapt.getText.bind(adapt)
    this.getWordCount = adapt.getWordCount.bind(adapt)
    this.getCursorPosition = adapt.getCursorPosition.bind(adapt)
    this.getRemainingContentHeight = adapt.getRemainingContentHeight.bind(adapt)
    this.getRange = adapt.getRange.bind(adapt)
    this.getRangeText = adapt.getRangeText.bind(adapt)
    this.getRangeContext = adapt.getRangeContext.bind(adapt)
    this.getRangeRow = adapt.getRangeRow.bind(adapt)
    this.getRangeParagraph = adapt.getRangeParagraph.bind(adapt)
    this.getKeywordRangeList = adapt.getKeywordRangeList.bind(adapt)
    this.getKeywordContext = adapt.getKeywordContext.bind(adapt)
    this.getCatalog = adapt.getCatalog.bind(adapt)
    this.getPaperMargin = adapt.getPaperMargin.bind(adapt)
    this.getColumns = adapt.getColumns.bind(adapt)
    this.getSearchNavigateInfo = adapt.getSearchNavigateInfo.bind(adapt)
    this.getLocale = adapt.getLocale.bind(adapt)
    this.getGroupIds = adapt.getGroupIds.bind(adapt)
    this.getContainer = adapt.getContainer.bind(adapt)
    this.getTitleValue = adapt.getTitleValue.bind(adapt)
    this.getPositionContextByEvent = adapt.getPositionContextByEvent.bind(adapt)
    this.getElementById = adapt.getElementById.bind(adapt)
    // 控件
    this.executeSetControlValue = this.wrap(
      'executeSetControlValue',
      adapt.setControlValue.bind(adapt)
    )
    this.executeSetControlValueList = this.wrap(
      'executeSetControlValueList',
      adapt.setControlValueList.bind(adapt)
    )
    this.executeSetControlExtension = this.wrap(
      'executeSetControlExtension',
      adapt.setControlExtension.bind(adapt)
    )
    this.executeSetControlExtensionList = this.wrap(
      'executeSetControlExtensionList',
      adapt.setControlExtensionList.bind(adapt)
    )
    this.executeSetControlProperties = this.wrap(
      'executeSetControlProperties',
      adapt.setControlProperties.bind(adapt)
    )
    this.executeSetControlPropertiesList = this.wrap(
      'executeSetControlPropertiesList',
      adapt.setControlPropertiesList.bind(adapt)
    )
    this.executeSetControlHighlight = this.wrap(
      'executeSetControlHighlight',
      adapt.setControlHighlight.bind(adapt)
    )
    this.getControlValue = adapt.getControlValue.bind(adapt)
    this.getControlList = adapt.getControlList.bind(adapt)
    this.executeLocationControl = this.wrap(
      'executeLocationControl',
      adapt.locationControl.bind(adapt)
    )
    this.executeInsertControl = this.wrap(
      'executeInsertControl',
      adapt.insertControl.bind(adapt)
    )
    this.executeJumpControl = this.wrap(
      'executeJumpControl',
      adapt.jumpControl.bind(adapt)
    )
  }
}
