import { printImageBase64 } from "../../utils/print"
import { Draw } from "../draw/Draw"

export class Command {

  private static undo: Function
  private static redo: Function
  private static getDataURL: Function

  constructor(draw: Draw) {
    const historyManager = draw.getHistoryManager()
    Command.undo = historyManager.undo.bind(historyManager)
    Command.redo = historyManager.redo.bind(historyManager)
    Command.getDataURL = draw.getDataURL.bind(draw)
  }

  // 撤销、重做、格式刷、清除格式
  public executeUndo() {
    return Command.undo()
  }

  public executeRedo() {
    return Command.redo()
  }

  // 字体变大、字体变小、加粗、斜体、下划线、删除线、字体颜色、背景色

  // 搜索、打印
  public executePrint() {
    return printImageBase64(Command.getDataURL())
  }

}