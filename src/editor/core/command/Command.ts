import { CommandAdapt } from "./CommandAdapt"

export class Command {

  private static undo: Function
  private static redo: Function
  private static painter: Function
  private static format: Function
  private static font: Function
  private static sizeAdd: Function
  private static sizeMinus: Function
  private static bold: Function
  private static italic: Function
  private static underline: Function
  private static strikeout: Function
  private static color: Function
  private static highlight: Function
  private static search: Function
  private static print: Function

  constructor(adapt: CommandAdapt) {
    Command.undo = adapt.undo.bind(adapt)
    Command.redo = adapt.redo.bind(adapt)
    Command.painter = adapt.painter.bind(adapt)
    Command.format = adapt.format.bind(adapt)
    Command.font = adapt.font.bind(adapt)
    Command.sizeAdd = adapt.sizeAdd.bind(adapt)
    Command.sizeMinus = adapt.sizeMinus.bind(adapt)
    Command.bold = adapt.bold.bind(adapt)
    Command.italic = adapt.italic.bind(adapt)
    Command.underline = adapt.underline.bind(adapt)
    Command.strikeout = adapt.strikeout.bind(adapt)
    Command.color = adapt.color.bind(adapt)
    Command.highlight = adapt.highlight.bind(adapt)
    Command.search = adapt.search.bind(adapt)
    Command.print = adapt.print.bind(adapt)
  }

  // 撤销、重做、格式刷、清除格式
  public executeUndo() {
    return Command.undo()
  }

  public executeRedo() {
    return Command.redo()
  }

  public executePainter() {
    return Command.painter()
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

  public executeColor(payload: string) {
    return Command.color(payload)
  }

  public executeHighlight(payload: string) {
    return Command.highlight(payload)
  }

  // 搜索、打印
  public executeSearch(payload: string | null) {
    return Command.search(payload)
  }

  public executePrint() {
    return Command.print()
  }

}