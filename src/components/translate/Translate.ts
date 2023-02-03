import Editor, { EditorMode } from '../../editor'
import { langs } from '../../lang/langs'

export interface ITranslateOptions {
  instance?: Editor
  defaultLang: string
  translation: any[]
  translateDialogHyperlink: { title?: any; inputs: any; buttonCancel?: any; buttonConfirm?: any }
  translateWatermarkOption: { inputs?: any; buttonCancel?: any; buttonConfirm?: any; title?: any }
  translateCodeblock: { inputs?: any; buttonCancel?: any; buttonConfirm?: any; title?: any }
  translateControlOptionText: { inputs?: any; buttonCancel?: any; buttonConfirm?: any; title?: any }
  translateControlOptionSelect: { inputs?: any; buttonCancel?: any; buttonConfirm?: any; title?: any }
  translateControlOptionCheckbox: { inputs?: any; buttonCancel?: any; buttonConfirm?: any; title?: any }
  translateLatex: { inputs?: any; buttonCancel?: any; buttonConfirm?: any; title?: any }
  translateBlock: { inputs?: any; buttonCancel?: any; buttonConfirm?: any; title?: any }
  translateTopMargin: { inputs?: any; buttonCancel?: any; buttonConfirm?: any; title?: any }
  translateEditMode: any
  translateCleanMode: any
  translateReadOnlyMode: any
  translateContextMenuList: any[]
  modeList: { name: any; mode: any }[]
  translateContextMenuSignature: { [x: string]: any; title?: any }
  titleDialogSignature: string
  dialogLabelsSignature: any
}

export class Translate {

  public options: ITranslateOptions = {
    defaultLang: 'ch',
    translation: [],
    translateDialogHyperlink: {
      title: undefined,
      inputs: undefined,
      buttonCancel: undefined,
      buttonConfirm: undefined
    },
    translateWatermarkOption: {
      inputs: undefined,
      buttonCancel: undefined,
      buttonConfirm: undefined,
      title: undefined
    },
    translateCodeblock: {
      inputs: undefined,
      buttonCancel: undefined,
      buttonConfirm: undefined,
      title: undefined
    },
    translateControlOptionText: {
      inputs: undefined,
      buttonCancel: undefined,
      buttonConfirm: undefined,
      title: undefined
    },
    translateControlOptionSelect: {
      inputs: undefined,
      buttonCancel: undefined,
      buttonConfirm: undefined,
      title: undefined
    },
    translateControlOptionCheckbox: {
      inputs: undefined,
      buttonCancel: undefined,
      buttonConfirm: undefined,
      title: undefined
    },
    translateLatex: {
      inputs: undefined,
      buttonCancel: undefined,
      buttonConfirm: undefined,
      title: undefined
    },
    translateBlock: {
      inputs: undefined,
      buttonCancel: undefined,
      buttonConfirm: undefined,
      title: undefined
    },
    translateTopMargin: {
      inputs: undefined,
      buttonCancel: undefined,
      buttonConfirm: undefined,
      title: undefined
    },
    translateEditMode: undefined,
    translateCleanMode: undefined,
    translateReadOnlyMode: undefined,
    translateContextMenuList: [],
    modeList: [],
    translateContextMenuSignature: {
      title: undefined
    },
    titleDialogSignature: '',
    dialogLabelsSignature: undefined,
    instance: undefined
  }

  constructor(defaultLang: string, instance: Editor) {
    this.options.defaultLang = defaultLang
    this.options.instance = instance
    this._render(defaultLang, instance)
  }

  private _render(defaultLang: string, instance: Editor) {
    const json = this.getTranslation(defaultLang)
    this.loadVariablesTranslation(json, instance)
  }

  public loadVariablesTranslation(json: any, instance: Editor) {
    this.options.translation = json

    this.options.translation.forEach(function (item: any) {
      const element = document.querySelector<HTMLDivElement>(item.key)
      if (element) {
        const { values: { title, text } } = item
        if (title && title !== '') {
          element.title = title
        }
        if (text && text !== '') {
          element.innerHTML = text
        }
      }
    })
    this.options.translateDialogHyperlink = this.getItemTranslation('dialog-hiperlink')
    this.options.translateWatermarkOption = this.getItemTranslation('dialog-watermark')
    this.options.translateCodeblock = this.getItemTranslation('dialog-codeblock')
    this.options.translateControlOptionText = this.getItemTranslation('dialog-controloptiontext')
    this.options.translateControlOptionSelect = this.getItemTranslation('dialog-controloptionselect')
    this.options.translateControlOptionCheckbox = this.getItemTranslation('dialog-controloptioncheckbox')
    this.options.translateLatex = this.getItemTranslation('dialog-latex')
    this.options.translateBlock = this.getItemTranslation('dialog-block')
    this.options.translateTopMargin = this.getItemTranslation('dialog-topmargin')
    this.options.translateEditMode = this.getItemTranslation('mode-edit')
    this.options.translateCleanMode = this.getItemTranslation('mode-clean')
    this.options.translateReadOnlyMode = this.getItemTranslation('mode-readonly')
    this.options.translateContextMenuList = this.getItemTranslation('contextmenu')
    this.options.modeList = [{
      mode: EditorMode.EDIT,
      name: this.options.translateEditMode ? this.options.translateEditMode : '编辑模式'
    }, {
      mode: EditorMode.CLEAN,
      name: this.options.translateCleanMode ? this.options.translateCleanMode : '清洁模式'
    }, {
      mode: EditorMode.READONLY,
      name: this.options.translateReadOnlyMode ? this.options.translateReadOnlyMode : '只读模式'
    }]
    this.options.translateContextMenuSignature = this.getItemTranslation('contextmenu-signature')
    this.options.titleDialogSignature = this.options.translateContextMenuSignature.title
    this.options.dialogLabelsSignature = this.options.translateContextMenuSignature ? this.options.translateContextMenuSignature['dialog-labels'] : null
    if (instance) {
      this.updateTranslateContextMenus(instance)
    }
  }

  public updateTranslateContextMenus(instance: Editor) {
    const contextMenuList = instance.register.getContextMenuList()
    if (this.options.translateContextMenuList) {
      this.options.translateContextMenuList.forEach((translate: any) => {
        const contextMenu = contextMenuList.find((ctxMenu) => { return ctxMenu.id === translate.id })
        if (contextMenu) {
          contextMenu.name = translate.name
          if (translate.childMenus && contextMenu.childMenus) {
            const { childMenus } = contextMenu
            translate.childMenus.forEach((child: any) => {
              const childMenu = childMenus.find((ctxChildMenu) => { return ctxChildMenu.id === child.id })
              if (childMenu) {
                childMenu.name = child.name
              }
            })
          }
        }
      })
    }
  }

  public getTranslation(lang: string) {
    return langs[lang]
  }

  public getItemTranslation(nameItem: string) {
    return this.options.translation.find((item: any) => {
      if (item[nameItem]) {
        return true
      }
      return false
    })[nameItem]
  }

  public setTranslation(defaultLang: string, instance: Editor) {
    const json = this.getTranslation(defaultLang)
    this.loadVariablesTranslation(json, instance)
  }
}
