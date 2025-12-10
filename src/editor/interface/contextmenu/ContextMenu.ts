import { Command } from '../../core/command/Command'
import { EditorZone } from '../../dataset/enum/Editor'
import { DeepRequired } from '../Common'
import { IEditorOption } from '../Editor'
import { IElement } from '../Element'

export interface IContextMenuContext {
  startElement: IElement | null
  endElement: IElement | null
  isReadonly: boolean
  editorHasSelection: boolean
  editorTextFocus: boolean
  isInTable: boolean
  isCrossRowCol: boolean
  zone: EditorZone
  trIndex: number | null
  tdIndex: number | null
  tableElement: IElement | null
  options: DeepRequired<IEditorOption>
}

export interface IRegisterContextMenu {
  key?: string
  i18nPath?: string
  isDivider?: boolean
  icon?: string
  name?: string
  shortCut?: string
  disable?: boolean
  when?: (payload: IContextMenuContext) => boolean
  callback?: (command: Command, context: IContextMenuContext) => void
  childMenus?: IRegisterContextMenu[]
}

export interface IContextmenuLang {
  global: {
    cut: string
    copy: string
    paste: string
    selectAll: string
    print: string
  }
  control: {
    delete: string
  }
  hyperlink: {
    delete: string
    cancel: string
    edit: string
  }
  image: {
    change: string
    saveAs: string
    textWrap: string
    textWrapType: {
      embed: string
      upDown: string
    }
  }
  table: {
    insertRowCol: string
    insertTopRow: string
    insertBottomRow: string
    insertLeftCol: string
    insertRightCol: string
    deleteRowCol: string
    deleteRow: string
    deleteCol: string
    deleteTable: string
    mergeCell: string
    mergeCancelCell: string
  }
}
