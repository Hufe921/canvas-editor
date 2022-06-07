import { IElement } from '../..'
import { EditorMode, PageMode } from '../../dataset/enum/Editor'
import { RowFlex } from '../../dataset/enum/Row'
import { IDrawImagePayload, IPainterOptions } from '../../interface/Draw'
import { IEditorResult } from '../../interface/Editor'
import { IWatermark } from '../../interface/Watermark'
import { CommandAdapt } from './CommandAdapt'


export class Command {

  private static mode: Function
  private static cut: Function
  private static copy: Function
  private static paste: Function
  private static selectAll: Function
  private static backspace: Function
  private static setRange: Function
  private static undo: Function
  private static redo: Function
  private static painter: Function
  private static applyPainterStyle: Function
  private static format: Function
  private static font: Function
  private static sizeAdd: Function
  private static sizeMinus: Function
  private static bold: Function
  private static italic: Function
  private static underline: Function
  private static strikeout: Function
  private static superscript: Function
  private static subscript: Function
  private static color: Function
  private static highlight: Function
  private static left: Function
  private static center: Function
  private static right: Function
  private static rowMargin: Function
  private static insertTable: Function
  private static insertTableTopRow: Function
  private static insertTableBottomRow: Function
  private static insertTableLeftCol: Function
  private static insertTableRightCol: Function
  private static deleteTableRow: Function
  private static deleteTableCol: Function
  private static deleteTable: Function
  private static mergeTableCell: Function
  private static cancelMergeTableCell: Function
  private static image: Function
  private static hyperlink: Function
  private static separator: Function
  private static pageBreak: Function
  private static addWatermark: Function
  private static deleteWatermark: Function
  private static search: Function
  private static replace: Function
  private static print: Function
  private static getImage: Function
  private static getValue: Function
  private static getWordCount: Function
  private static pageMode: Function
  private static pageScaleRecovery: Function
  private static pageScaleMinus: Function
  private static pageScaleAdd: Function
  private static insertElementList: Function

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
    Command.separator = adapt.separator.bind(adapt)
    Command.pageBreak = adapt.pageBreak.bind(adapt)
    Command.addWatermark = adapt.addWatermark.bind(adapt)
    Command.deleteWatermark = adapt.deleteWatermark.bind(adapt)
    Command.search = adapt.search.bind(adapt)
    Command.replace = adapt.replace.bind(adapt)
    Command.print = adapt.print.bind(adapt)
    Command.getImage = adapt.getImage.bind(adapt)
    Command.getValue = adapt.getValue.bind(adapt)
    Command.getWordCount = adapt.getWordCount.bind(adapt)
    Command.pageMode = adapt.pageMode.bind(adapt)
    Command.pageScaleRecovery = adapt.pageScaleRecovery.bind(adapt)
    Command.pageScaleMinus = adapt.pageScaleMinus.bind(adapt)
    Command.pageScaleAdd = adapt.pageScaleAdd.bind(adapt)
    Command.insertElementList = adapt.insertElementList.bind(adapt)
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

}