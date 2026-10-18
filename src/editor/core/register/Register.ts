import type {
  FontRegistrationResult,
  IEditorFontFace,
  RegisteredFontFace
} from '../../interface/TextEngine'
import { IRegisterContextMenu } from '../../interface/contextmenu/ContextMenu'
import { IRegisterShortcut } from '../../interface/shortcut/Shortcut'
import { ContextMenu } from '../contextmenu/ContextMenu'
import { Shortcut } from '../shortcut/Shortcut'
import { I18n } from '../i18n/I18n'
import { ILang } from '../../interface/i18n/I18n'
import { DeepPartial } from '../../interface/Common'

interface IRegisterPayload {
  contextMenu: ContextMenu
  shortcut: Shortcut
  i18n: I18n
  fonts: (faces: IEditorFontFace[]) => Promise<FontRegistrationResult[]>
  getFontFaces: () => RegisteredFontFace[]
  getFontRevision: () => number
}

export class Register {
  /** Waits for ready, registers binaries/URLs and refreshes coverage/layout. */
  public fonts: IRegisterPayload['fonts']
  /** Metadata snapshots of successfully registered faces. */
  public getFontFaces: IRegisterPayload['getFontFaces']
  /** Current font revision; unchanged for failed or duplicate registrations. */
  public getFontRevision: IRegisterPayload['getFontRevision']
  public contextMenuList: (payload: IRegisterContextMenu[]) => void
  public getContextMenuList: () => IRegisterContextMenu[]
  public shortcutList: (payload: IRegisterShortcut[]) => void
  public langMap: (locale: string, lang: DeepPartial<ILang>) => void

  constructor(payload: IRegisterPayload) {
    this.fonts = payload.fonts
    this.getFontFaces = payload.getFontFaces
    this.getFontRevision = payload.getFontRevision
    const { contextMenu, shortcut, i18n } = payload
    this.contextMenuList = contextMenu.registerContextMenuList.bind(contextMenu)
    this.getContextMenuList = contextMenu.getContextMenuList.bind(contextMenu)
    this.shortcutList = shortcut.registerShortcutList.bind(shortcut)
    this.langMap = i18n.registerLangMap.bind(i18n)
  }
}
