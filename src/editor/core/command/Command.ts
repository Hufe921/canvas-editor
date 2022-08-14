import { IElement } from '../..'
import { EditorMode, PageMode } from '../../dataset/enum/Editor'
import { RowFlex } from '../../dataset/enum/Row'
import { IDrawImagePayload, IPainterOptions } from '../../interface/Draw'
import { IEditorResult } from '../../interface/Editor'
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
  private static left: CommandAdapt['rowFlex']
  private static center: CommandAdapt['rowFlex']
  private static right: CommandAdapt['rowFlex']
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
  private static replace: CommandAdapt['replace']
  private static print: CommandAdapt['print']
  private static replaceImageElement: CommandAdapt['replaceImageElement']
  private static saveAsImageElement: CommandAdapt['saveAsImageElement']
  private static getImage: CommandAdapt['getImage']
  private static getValue: CommandAdapt['getValue']
  private static getWordCount: CommandAdapt['getWordCount']
  private static pageMode: CommandAdapt['pageMode']
  private static pageScaleRecovery: CommandAdapt['pageScaleRecovery']
  private static pageScaleMinus: CommandAdapt['pageScaleMinus']
  private static pageScaleAdd: CommandAdapt['pageScaleAdd']
  private static insertElementList: CommandAdapt['insertElementList']
  private static removeControl: CommandAdapt['removeControl']

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
    Command.left = adapt.rowFlex.bind(adapt)
    Command.center = adapt.rowFlex.bind(adapt)
    Command.right = adapt.rowFlex.bind(adapt)
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
    Command.replace = adapt.replace.bind(adapt)
    Command.print = adapt.print.bind(adapt)
    Command.replaceImageElement = adapt.replaceImageElement.bind(adapt)
    Command.saveAsImageElement = adapt.saveAsImageElement.bind(adapt)
    Command.getImage = adapt.getImage.bind(adapt)
    Command.getValue = adapt.getValue.bind(adapt)
    Command.getWordCount = adapt.getWordCount.bind(adapt)
    Command.pageMode = adapt.pageMode.bind(adapt)
    Command.pageScaleRecovery = adapt.pageScaleRecovery.bind(adapt)
    Command.pageScaleMinus = adapt.pageScaleMinus.bind(adapt)
    Command.pageScaleAdd = adapt.pageScaleAdd.bind(adapt)
    Command.insertElementList = adapt.insertElementList.bind(adapt)
    Command.removeControl = adapt.removeControl.bind(adapt)
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

  // 字体、字体变大、字体变小、加粗、斜体、下划线、删除线、字体颜色、背景色
  public executeFont(payload: string) {
    return Command.font(payload)
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

  public executeLeft() {
    return Command.left(RowFlex.LEFT)
  }

  public executeCenter() {
    return Command.center(RowFlex.CENTER)
  }

  public executeRight() {
    return Command.right(RowFlex.RIGHT)
  }

  public executeRowMargin(payload: number) {
    return Command.rowMargin(payload)
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

  public getImage(): string[] {
    return Command.getImage()
  }

  public getValue(): IEditorResult {
    return Command.getValue()
  }

  public getWordCount(): Promise<number> {
    return Command.getWordCount()
  }

  // 页面模式、页面缩放
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

  // 通用
  public executeInsertElementList(payload: IElement[]) {
    return Command.insertElementList(payload)
  }

  public executeRemoveControl() {
    return Command.removeControl()
  }

}