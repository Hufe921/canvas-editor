import Editor, {
  ElementType,
  IEditorData,
  IEditorOption,
  IElement,
  ListStyle,
  ListType,
  RowFlex,
  TitleLevel
} from '.'
import { Dialog } from '../components/dialog/Dialog'
import en from '../editor/core/i18n/lang/en.json'
import { IDrawImagePayload } from './interface/Draw'

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
    // if (DOMEventHandlers.instance) {
    //   console.log('tried to register again. Returning')
    //   return
    // }
    DOMEventHandlers.instance = new Editor(container, data, options)
    DOMEventHandlers.instance.command.executeSetLocale('en')
    DOMEventHandlers.instance.register.langMap('en', en)
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

  static setFontColor(payload: string) {
    DOMEventHandlers.getEditorInstance().command.executeColor(payload)
  }

  static highlightText(payload: string) {
    DOMEventHandlers.getEditorInstance().command.executeHighlight(payload)
  }

  static setFont(payload: string) {
    DOMEventHandlers.getEditorInstance().command.executeFont(payload)
  }

  static setSize(payload: number) {
    DOMEventHandlers.getEditorInstance().command.executeSize(payload)
  }

  static increaseFontSize() {
    DOMEventHandlers.getEditorInstance().command.executeSizeAdd()
  }

  static decreaseFontSize() {
    DOMEventHandlers.getEditorInstance().command.executeSizeMinus()
  }
  static getContent() {
    return DOMEventHandlers.getEditorInstance().command.getValue()
  }

  static setContent(payload: Partial<IEditorData>) {
    DOMEventHandlers.getEditorInstance().command.executeSetValue(payload)
  }

  static createTable(payload: { rowIndex: number; colIndex: number }) {
    DOMEventHandlers.getEditorInstance().command.executeInsertTable(
      payload.rowIndex,
      payload.colIndex
    )
  }

  static setTitle(payload: TitleLevel | null) {
    DOMEventHandlers.getEditorInstance().command.executeTitle(payload)
  }

  static getContentStyles() {
    return DOMEventHandlers.getEditorInstance().command.getContentStyles()
  }

  static setImage(payload: IDrawImagePayload) {
    DOMEventHandlers.getEditorInstance().command.executeImage(payload)
  }

  static createHyperLink() {
    new Dialog({
      title: 'Link',
      data: [
        {
          type: 'text',
          label: 'Text',
          name: 'name',
          required: true,
          placeholder: 'Enter text'
        },
        {
          type: 'text',
          label: 'URL',
          name: 'url',
          required: true,
          placeholder: 'Enter URL'
        }
      ],
      onConfirm: payload => {
        const name = payload.find(p => p.name === 'name')?.value
        if (!name) return
        const url = payload.find(p => p.name === 'url')?.value
        if (!url) return
        DOMEventHandlers.getEditorInstance().command.executeHyperlink({
          type: ElementType.HYPERLINK,
          value: '',
          url,
          valueList: name.split('').map(n => ({
            value: n,
            size: 16
          }))
        })
      }
    })
  }

  static setHorizontalLine(payload: number[]) {
    DOMEventHandlers.getEditorInstance().command.executeSeparator(payload)
  }

  static setPaperMargins(payload: number[]) {
    const [topMargin, bottomMargin, leftMargin, rightMargin] = payload
    DOMEventHandlers.getEditorInstance().command.executeSetPaperMargin([
      Number(topMargin),
      Number(rightMargin),
      Number(bottomMargin),
      Number(leftMargin)
    ])
  }

  static getSelectedText() {
    return DOMEventHandlers.getEditorInstance().command.getRangeText()
  }

  static insertElement(payload: string) {
    const updatedPayload: IElement[] = [{ value: payload }]
    DOMEventHandlers.getEditorInstance().command.executeInsertElementList(
      updatedPayload
    )
  }
}