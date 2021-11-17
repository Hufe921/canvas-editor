import { CommandAdapt } from "./CommandAdapt"

export class Command {

  private static undo: Function
  private static redo: Function
  private static painter: Function
  private static format: Function
  private static sizeAdd: Function
  private static sizeMinus: Function
  private static bold: Function
  private static italic: Function
  private static search: Function
  private static print: Function

  constructor(adapt: CommandAdapt) {
    Command.undo = adapt.undo.bind(adapt)
    Command.redo = adapt.redo.bind(adapt)
    Command.painter = adapt.painter.bind(adapt)
    Command.format = adapt.format.bind(adapt)
    Command.sizeAdd = adapt.sizeAdd.bind(adapt)
    Command.sizeMinus = adapt.sizeMinus.bind(adapt)
    Command.bold = adapt.bold.bind(adapt)
    Command.italic = adapt.italic.bind(adapt)
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

  // 字体变大、字体变小、加粗、斜体、下划线、删除线、字体颜色、背景色
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

  // 搜索、打印
  public executeSearch(payload: string | null) {
    return Command.search(payload)
  }

  public executePrint() {
    return Command.print()
  }

}