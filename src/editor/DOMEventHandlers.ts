import Editor, {
  IEditorData,
  IEditorOption,
  IElement,
  ListStyle,
  ListType,
  RowFlex
} from '.'

export class DOMEventHandlers {
  private static instance: Editor

  static getEditorInstance(): Editor {
    if (!DOMEventHandlers.instance) {
      throw new Error(
        `Editor is not yet registered. Make sure initialization registers editor prior to usage.`
      )
    }
    return DOMEventHandlers.instance
  }

  static register(
    container: HTMLDivElement,
    data: IEditorData | IElement[],
    options: IEditorOption = {}
  ) {
    if (DOMEventHandlers.instance) {
      console.log('tried to register again. Returning')
      return
    }
    DOMEventHandlers.instance = new Editor(container, data, options)
  }

  static handleUndo() {
    DOMEventHandlers.getEditorInstance().command.executeUndo()
  }

  static handleRedo() {
    DOMEventHandlers.getEditorInstance().command.executeRedo()
  }

  static handleBold() {
    DOMEventHandlers.getEditorInstance().command.executeBold()
  }

  static handleItalic() {
    DOMEventHandlers.getEditorInstance().command.executeItalic()
  }

  static handleUnderline() {
    DOMEventHandlers.getEditorInstance().command.executeUnderline()
  }

  static handleStrikeout() {
    DOMEventHandlers.getEditorInstance().command.executeStrikeout()
  }

  static handleSuperscript() {
    DOMEventHandlers.getEditorInstance().command.executeSuperscript()
  }
  static handleSubscript() {
    DOMEventHandlers.getEditorInstance().command.executeSubscript()
  }

  static handleFontFamily(fontFamily: string) {
    DOMEventHandlers.getEditorInstance().command.executeFont(fontFamily)
  }

  static handleFontSize(size: number) {
    DOMEventHandlers.getEditorInstance().command.executeSize(size)
  }

  static handleFontSizeAdd() {
    DOMEventHandlers.getEditorInstance().command.executeSizeAdd()
  }

  static handleFontSizeMinus() {
    DOMEventHandlers.getEditorInstance().command.executeSizeMinus()
  }

  static handleAlign(alignment: RowFlex) {
    switch (alignment) {
      case RowFlex.LEFT: {
        DOMEventHandlers.getEditorInstance().command.executeRowFlex(
          RowFlex.LEFT
        )
        break
      }
      case RowFlex.RIGHT: {
        DOMEventHandlers.getEditorInstance().command.executeRowFlex(
          RowFlex.RIGHT
        )
        break
      }
      case RowFlex.CENTER: {
        DOMEventHandlers.getEditorInstance().command.executeRowFlex(
          RowFlex.CENTER
        )
        break
      }
      case RowFlex.ALIGNMENT: {
        DOMEventHandlers.getEditorInstance().command.executeRowFlex(
          RowFlex.ALIGNMENT
        )
        break
      }
      default:
        DOMEventHandlers.getEditorInstance().command.executeRowFlex(
          RowFlex.LEFT
        )
    }
  }

  static handleList(listType: ListType, listStyle: ListStyle) {
    DOMEventHandlers.getEditorInstance().command.executeList(
      listType,
      listStyle
    )
  }
}
