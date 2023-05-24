import { IElement, ImageDisplay, INavigateInfo, ListStyle, ListType, TableBorder, TitleLevel, VerticalAlign } from '../..'
import { EditorMode, PageMode, PaperDirection } from '../../dataset/enum/Editor'
import { RowFlex } from '../../dataset/enum/Row'
import { ICatalog } from '../../interface/Catalog'
import { IDrawImagePayload, IPainterOptions } from '../../interface/Draw'
import { IEditorResult } from '../../interface/Editor'
import { IMargin } from '../../interface/Margin'
import { IWatermark } from '../../interface/Watermark'
import { CommandAdapt } from './CommandAdapt'

export class Command {

  private static mode: CommandAdapt['mode']
  private static cut: CommandAdapt['cut']
  private static copy: CommandAdapt['copy']
  private static paste: CommandAdapt['paste']
  private static selectAll: CommandAdapt['selectAll']
  private static backspace: CommandAdapt['backspace']
  private static setRange: CommandAdapt['setRange']
  private static undo: CommandAdapt['undo']
  private static redo: CommandAdapt['redo']
  private static painter: CommandAdapt['painter']
  private static applyPainterStyle: CommandAdapt['applyPainterStyle']
  private static format: CommandAdapt['format']
  private static font: CommandAdapt['font']
  private static size: CommandAdapt['size']
  private static sizeAdd: CommandAdapt['sizeAdd']
  private static sizeMinus: CommandAdapt['sizeMinus']
  private static bold: CommandAdapt['bold']
  private static italic: CommandAdapt['italic']
  private static underline: CommandAdapt['underline']
  private static strikeout: CommandAdapt['strikeout']
  private static superscript: CommandAdapt['superscript']
  private static subscript: CommandAdapt['subscript']
  private static color: CommandAdapt['color']
  private static highlight: CommandAdapt['highlight']
  private static title: CommandAdapt['title']
  private static list: CommandAdapt['list']
  private static left: CommandAdapt['rowFlex']
  private static center: CommandAdapt['rowFlex']
  private static right: CommandAdapt['rowFlex']
  private static alignment: CommandAdapt['rowFlex']
  private static rowMargin: CommandAdapt['rowMargin']
  private static insertTable: CommandAdapt['insertTable']
  private static insertTableTopRow: CommandAdapt['insertTableTopRow']
  private static insertTableBottomRow: CommandAdapt['insertTableBottomRow']
  private static insertTableLeftCol: CommandAdapt['insertTableLeftCol']
  private static insertTableRightCol: CommandAdapt['insertTableRightCol']
  private static deleteTableRow: CommandAdapt['deleteTableRow']
  private static deleteTableCol: CommandAdapt['deleteTableCol']
  private static deleteTable: CommandAdapt['deleteTable']
  private static mergeTableCell: CommandAdapt['mergeTableCell']
  private static cancelMergeTableCell: CommandAdapt['cancelMergeTableCell']
  private static tableTdVerticalAlign: CommandAdapt['tableTdVerticalAlign']
  private static tableBorderType: CommandAdapt['tableBorderType']
  private static tableTdBackgroundColor: CommandAdapt['tableTdBackgroundColor']
  private static image: CommandAdapt['image']
  private static hyperlink: CommandAdapt['hyperlink']
  private static deleteHyperlink: CommandAdapt['deleteHyperlink']
  private static cancelHyperlink: CommandAdapt['cancelHyperlink']
  private static editHyperlink: CommandAdapt['editHyperlink']
  private static separator: CommandAdapt['separator']
  private static pageBreak: CommandAdapt['pageBreak']
  private static addWatermark: CommandAdapt['addWatermark']
  private static deleteWatermark: CommandAdapt['deleteWatermark']
  private static search: CommandAdapt['search']
  private static searchNavigatePre: CommandAdapt['searchNavigatePre']
  private static searchNavigateNext: CommandAdapt['searchNavigateNext']
  private static getSearchNavigateInfo: CommandAdapt['getSearchNavigateInfo']
  private static replace: CommandAdapt['replace']
  private static print: CommandAdapt['print']
  private static replaceImageElement: CommandAdapt['replaceImageElement']
  private static saveAsImageElement: CommandAdapt['saveAsImageElement']
  private static changeImageDisplay: CommandAdapt['changeImageDisplay']
  private static getImage: CommandAdapt['getImage']
  private static getValue: CommandAdapt['getValue']
  private static getWordCount: CommandAdapt['getWordCount']
  private static getRangeText: CommandAdapt['getRangeText']
  private static pageMode: CommandAdapt['pageMode']
  private static pageScaleRecovery: CommandAdapt['pageScaleRecovery']
  private static pageScaleMinus: CommandAdapt['pageScaleMinus']
  private static pageScaleAdd: CommandAdapt['pageScaleAdd']
  private static paperSize: CommandAdapt['paperSize']
  private static paperDirection: CommandAdapt['paperDirection']
  private static getPaperMargin: CommandAdapt['getPaperMargin']
  private static setPaperMargin: CommandAdapt['setPaperMargin']
  private static insertElementList: CommandAdapt['insertElementList']
  private static removeControl: CommandAdapt['removeControl']
  private static setLocale: CommandAdapt['setLocale']
  private static getCatalog: CommandAdapt['getCatalog']
  private static locationCatalog: CommandAdapt['locationCatalog']

  constructor(adapt: CommandAdapt) {
    Command.mode = adapt.mode.bind(adapt)
    Command.cut = adapt.cut.bind(adapt)
    Command.copy = adapt.copy.bind(adapt)
    Command.paste = adapt.paste.bind(adapt)
    Command.selectAll = adapt.selectAll.bind(adapt)
    Command.backspace = adapt.backspace.bind(adapt)
    Command.setRange = adapt.setRange.bind(adapt)
    Command.undo = adapt.undo.bind(adapt)
    Command.redo = adapt.redo.bind(adapt)
    Command.painter = adapt.painter.bind(adapt)
    Command.applyPainterStyle = adapt.applyPainterStyle.bind(adapt)
    Command.format = adapt.format.bind(adapt)
    Command.font = adapt.font.bind(adapt)
    Command.size = adapt.size.bind(adapt)
    Command.sizeAdd = adapt.sizeAdd.bind(adapt)
    Command.sizeMinus = adapt.sizeMinus.bind(adapt)
    Command.bold = adapt.bold.bind(adapt)
    Command.italic = adapt.italic.bind(adapt)
    Command.underline = adapt.underline.bind(adapt)
    Command.strikeout = adapt.strikeout.bind(adapt)
    Command.superscript = adapt.superscript.bind(adapt)
    Command.subscript = adapt.subscript.bind(adapt)
    Command.color = adapt.color.bind(adapt)
    Command.highlight = adapt.highlight.bind(adapt)
    Command.title = adapt.title.bind(adapt)
    Command.list = adapt.list.bind(adapt)
    Command.left = adapt.rowFlex.bind(adapt)
    Command.center = adapt.rowFlex.bind(adapt)
    Command.right = adapt.rowFlex.bind(adapt)
    Command.alignment = adapt.rowFlex.bind(adapt)
    Command.rowMargin = adapt.rowMargin.bind(adapt)
    Command.insertTable = adapt.insertTable.bind(adapt)
    Command.insertTableTopRow = adapt.insertTableTopRow.bind(adapt)
    Command.insertTableBottomRow = adapt.insertTableBottomRow.bind(adapt)
    Command.insertTableLeftCol = adapt.insertTableLeftCol.bind(adapt)
    Command.insertTableRightCol = adapt.insertTableRightCol.bind(adapt)
    Command.deleteTableRow = adapt.deleteTableRow.bind(adapt)
    Command.deleteTableCol = adapt.deleteTableCol.bind(adapt)
    Command.deleteTable = adapt.deleteTable.bind(adapt)
    Command.mergeTableCell = adapt.mergeTableCell.bind(adapt)
    Command.cancelMergeTableCell = adapt.cancelMergeTableCell.bind(adapt)
    Command.tableTdVerticalAlign = adapt.tableTdVerticalAlign.bind(adapt)
    Command.tableBorderType = adapt.tableBorderType.bind(adapt)
    Command.tableTdBackgroundColor = adapt.tableTdBackgroundColor.bind(adapt)
    Command.image = adapt.image.bind(adapt)
    Command.hyperlink = adapt.hyperlink.bind(adapt)
    Command.deleteHyperlink = adapt.deleteHyperlink.bind(adapt)
    Command.cancelHyperlink = adapt.cancelHyperlink.bind(adapt)
    Command.editHyperlink = adapt.editHyperlink.bind(adapt)
    Command.separator = adapt.separator.bind(adapt)
    Command.pageBreak = adapt.pageBreak.bind(adapt)
    Command.addWatermark = adapt.addWatermark.bind(adapt)
    Command.deleteWatermark = adapt.deleteWatermark.bind(adapt)
    Command.search = adapt.search.bind(adapt)
    Command.searchNavigatePre = adapt.searchNavigatePre.bind(adapt)
    Command.searchNavigateNext = adapt.searchNavigateNext.bind(adapt)
    Command.getSearchNavigateInfo = adapt.getSearchNavigateInfo.bind(adapt)
    Command.replace = adapt.replace.bind(adapt)
    Command.print = adapt.print.bind(adapt)
    Command.replaceImageElement = adapt.replaceImageElement.bind(adapt)
    Command.saveAsImageElement = adapt.saveAsImageElement.bind(adapt)
    Command.changeImageDisplay = adapt.changeImageDisplay.bind(adapt)
    Command.getImage = adapt.getImage.bind(adapt)
    Command.getValue = adapt.getValue.bind(adapt)
    Command.getWordCount = adapt.getWordCount.bind(adapt)
    Command.getRangeText = adapt.getRangeText.bind(adapt)
    Command.pageMode = adapt.pageMode.bind(adapt)
    Command.pageScaleRecovery = adapt.pageScaleRecovery.bind(adapt)
    Command.pageScaleMinus = adapt.pageScaleMinus.bind(adapt)
    Command.pageScaleAdd = adapt.pageScaleAdd.bind(adapt)
    Command.paperSize = adapt.paperSize.bind(adapt)
    Command.paperDirection = adapt.paperDirection.bind(adapt)
    Command.getPaperMargin = adapt.getPaperMargin.bind(adapt)
    Command.setPaperMargin = adapt.setPaperMargin.bind(adapt)
    Command.insertElementList = adapt.insertElementList.bind(adapt)
    Command.removeControl = adapt.removeControl.bind(adapt)
    Command.setLocale = adapt.setLocale.bind(adapt)
    Command.getCatalog = adapt.getCatalog.bind(adapt)
    Command.locationCatalog = adapt.locationCatalog.bind(adapt)
  }

  // 全局命令
  public executeMode(payload: EditorMode) {
    return Command.mode(payload)
  }

  public executeCut() {
    return Command.cut()
  }

  public executeCopy() {
    return Command.copy()
  }

  public executePaste() {
    return Command.paste()
  }

  public executeSelectAll() {
    return Command.selectAll()
  }

  public executeBackspace() {
    return Command.backspace()
  }

  public executeSetRange(startIndex: number, endIndex: number) {
    return Command.setRange(startIndex, endIndex)
  }

  // 撤销、重做、格式刷、清除格式
  public executeUndo() {
    return Command.undo()
  }

  public executeRedo() {
    return Command.redo()
  }

  public executePainter(options: IPainterOptions) {
    return Command.painter(options)
  }

  public executeApplyPainterStyle() {
    return Command.applyPainterStyle()
  }

  public executeFormat() {
    return Command.format()
  }

  // 字体、字体大小、字体变大、字体变小、加粗、斜体、下划线、删除线、字体颜色、背景色
  public executeFont(payload: string) {
    return Command.font(payload)
  }

  public executeSize(payload: number) {
    return Command.size(payload)
  }

  public executeSizeAdd() {
    return Command.sizeAdd()
  }

  public executeSizeMinus() {
    return Command.sizeMinus()
  }

  public executeBold() {
    return Command.bold()
  }

  public executeItalic() {
    return Command.italic()
  }

  public executeUnderline() {
    return Command.underline()
  }

  public executeStrikeout() {
    return Command.strikeout()
  }

  public executeSuperscript() {
    return Command.superscript()
  }

  public executeSubscript() {
    return Command.subscript()
  }

  public executeColor(payload: string) {
    return Command.color(payload)
  }

  public executeHighlight(payload: string) {
    return Command.highlight(payload)
  }

  // 标题、对齐方式、列表
  public executeTitle(payload: TitleLevel | null) {
    return Command.title(payload)
  }

  public executeLeft() {
    return Command.left(RowFlex.LEFT)
  }

  public executeCenter() {
    return Command.center(RowFlex.CENTER)
  }

  public executeRight() {
    return Command.right(RowFlex.RIGHT)
  }

  public executeAlignment() {
    return Command.alignment(RowFlex.ALIGNMENT)
  }

  public executeRowMargin(payload: number) {
    return Command.rowMargin(payload)
  }

  public executeList(listType: ListType | null, listStyle?: ListStyle) {
    return Command.list(listType, listStyle)
  }

  // 表格、图片上传、超链接、搜索、打印
  public executeInsertTable(row: number, col: number) {
    return Command.insertTable(row, col)
  }

  public executeInsertTableTopRow() {
    return Command.insertTableTopRow()
  }

  public executeInsertTableBottomRow() {
    return Command.insertTableBottomRow()
  }

  public executeInsertTableLeftCol() {
    return Command.insertTableLeftCol()
  }

  public executeInsertTableRightCol() {
    return Command.insertTableRightCol()
  }

  public executeDeleteTableRow() {
    return Command.deleteTableRow()
  }

  public executeDeleteTableCol() {
    return Command.deleteTableCol()
  }

  public executeDeleteTable() {
    return Command.deleteTable()
  }

  public executeMergeTableCell() {
    return Command.mergeTableCell()
  }

  public executeCancelMergeTableCell() {
    return Command.cancelMergeTableCell()
  }

  public executeTableTdVerticalAlign(payload: VerticalAlign) {
    return Command.tableTdVerticalAlign(payload)
  }

  public executeTableBorderType(payload: TableBorder) {
    return Command.tableBorderType(payload)
  }

  public executeTableTdBackgroundColor(payload: string) {
    return Command.tableTdBackgroundColor(payload)
  }

  public executeHyperlink(payload: IElement) {
    return Command.hyperlink(payload)
  }

  public executeDeleteHyperlink() {
    return Command.deleteHyperlink()
  }

  public executeCancelHyperlink() {
    return Command.cancelHyperlink()
  }

  public executeEditHyperlink(payload: string) {
    return Command.editHyperlink(payload)
  }

  public executeImage(payload: IDrawImagePayload) {
    return Command.image(payload)
  }

  public executeSeparator(payload: number[]) {
    return Command.separator(payload)
  }

  public executePageBreak() {
    return Command.pageBreak()
  }

  public executeAddWatermark(payload: IWatermark) {
    return Command.addWatermark(payload)
  }

  public executeDeleteWatermark() {
    return Command.deleteWatermark()
  }

  public executeSearch(payload: string | null) {
    return Command.search(payload)
  }

  public executeSearchNavigatePre() {
    return Command.searchNavigatePre()
  }

  public executeSearchNavigateNext() {
    return Command.searchNavigateNext()
  }

  public getSearchNavigateInfo(): null | INavigateInfo {
    return Command.getSearchNavigateInfo()
  }

  public executeReplace(payload: string) {
    return Command.replace(payload)
  }

  public executePrint() {
    return Command.print()
  }

  public executeReplaceImageElement(payload: string) {
    return Command.replaceImageElement(payload)
  }

  public executeSaveAsImageElement() {
    return Command.saveAsImageElement()
  }

  public executeChangeImageDisplay(element: IElement, display: ImageDisplay) {
    return Command.changeImageDisplay(element, display)
  }

  public getImage(): Promise<string[]> {
    return Command.getImage()
  }

  public getValue(): IEditorResult {
    return Command.getValue()
  }

  public getWordCount(): Promise<number> {
    return Command.getWordCount()
  }

  public getRangeText(): string {
    return Command.getRangeText()
  }

  // 页面模式、页面缩放、纸张大小、纸张方向、页边距
  public executePageMode(payload: PageMode) {
    return Command.pageMode(payload)
  }

  public executePageScaleRecovery() {
    return Command.pageScaleRecovery()
  }

  public executePageScaleMinus() {
    return Command.pageScaleMinus()
  }

  public executePageScaleAdd() {
    return Command.pageScaleAdd()
  }

  public executePaperSize(width: number, height: number) {
    return Command.paperSize(width, height)
  }

  public executePaperDirection(payload: PaperDirection) {
    return Command.paperDirection(payload)
  }

  public getPaperMargin() {
    return Command.getPaperMargin()
  }

  public executeSetPaperMargin(payload: IMargin) {
    return Command.setPaperMargin(payload)
  }

  // 通用
  public executeInsertElementList(payload: IElement[]) {
    return Command.insertElementList(payload)
  }

  public executeRemoveControl() {
    return Command.removeControl()
  }

  public executeSetLocale(payload: string) {
    return Command.setLocale(payload)
  }

  public getCatalog(): Promise<ICatalog | null> {
    return Command.getCatalog()
  }

  public executeLocationCatalog(titleId: string) {
    return Command.locationCatalog(titleId)
  }

}