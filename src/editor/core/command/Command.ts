import { CommandAdapt } from "./CommandAdapt"

export class Command {

  private static undo: Function
  private static redo: Function
  private static format: Function
  private static bold: Function
  private static print: Function

  constructor(adapt: CommandAdapt) {
    Command.undo = adapt.undo.bind(adapt)
    Command.redo = adapt.redo.bind(adapt)
    Command.print = adapt.print.bind(adapt)
    Command.format = adapt.format.bind(adapt)
    Command.bold = adapt.bold.bind(adapt)
  }

  // 撤销、重做、格式刷、清除格式
  public executeUndo() {
    return Command.undo()
  }

  public executeRedo() {
    return Command.redo()
  }

  public executeFormat() {
    return Command.format()
  }

  // 字体变大、字体变小、加粗、斜体、下划线、删除线、字体颜色、背景色
  public executeBold() {
    return Command.bold()
  }

  // 搜索、打印
  public executePrint() {
    return Command.print()
  }

}