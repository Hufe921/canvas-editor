import { Draw } from "../draw/Draw"

export class Command {

  private undo: Function
  private redo: Function

  constructor(draw: Draw) {
    const historyManager = draw.getHistoryManager()
    this.undo = historyManager.undo.bind(historyManager)
    this.redo = historyManager.redo.bind(historyManager)
  }

  public executeUndo() {
    return this.undo()
  }

  public executeRedo() {
    return this.redo()
  }

}