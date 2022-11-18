export class HistoryManager {

  private readonly MAX_RECORD_COUNT = 1000
  private undoStack: Array<Function> = []
  private redoStack: Array<Function> = []

  /**
   * judge whether undoStack overflows
   * @returns boolean
   */
  private get isOverflow(): boolean {
    return this.undoStack.length > this.MAX_RECORD_COUNT
  }

  /**
   * remove overflow data
   */
  private cutOverflow() {
    while (this.isOverflow) {
      this.undoStack.shift()
    }
  }

  /**
   * undo
   */
  public undo() {
    if (this.isCanRedo) {
      const pop = this.undoStack.pop()!
      this.redoStack.push(pop)
      if (this.undoStack.length) {
        this.undoStack[this.undoStack.length - 1]()
      }
    }
  }

  /**
   * redo
   */
  public redo() {
    if (this.isCanRedo) {
      const pop = this.redoStack.pop()!
      this.undoStack.push(pop)
      pop()
    }
  }

  /**
   * add new undo event
   * @param fn Function undo/redo will execute function
   */
  public execute(fn: Function) {
    this.undoStack.push(fn)
    if (this.isCanRedo) {
      this.redoStack = []
    }
    this.cutOverflow()
  }

  /**
   * Judge whether it can be Undo
   * @returns boolean
   */
  public get isCanUndo(): boolean {
    return this.undoStack.length > 1
  }

  /**
   * Judge whether it can be Redo
   * @returns boolean
   */
  public get isCanRedo(): boolean {
    return !!this.redoStack.length
  }

}
