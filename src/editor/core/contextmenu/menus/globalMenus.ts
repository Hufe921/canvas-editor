import { ElementType } from '../../../dataset/enum/Element'
import { IRegisterContextMenu } from '../../../interface/contextmenu/ContextMenu'
import { isApple } from '../../../utils/ua'
import { Command } from '../../command/Command'
import '../../../../style.css'

export const globalMenus: IRegisterContextMenu[] = [
  {
    i18nPath: 'contextmenu.global.cut',
    shortCut: `${isApple ? '⌘' : 'Ctrl'} + X`,
    when: payload => {
      return !payload.isReadonly
    },
    callback: (command: Command) => {
      command.executeCut()
    }
  },
  {
    i18nPath: 'contextmenu.global.copy',
    shortCut: `${isApple ? '⌘' : 'Ctrl'} + C`,
    when: payload => {
      return payload.editorHasSelection
    },
    callback: (command: Command) => {
      command.executeCopy()
    }
  },
  {
    i18nPath: 'contextmenu.global.paste',
    shortCut: `${isApple ? '⌘' : 'Ctrl'} + V`,
    when: payload => {
      return !payload.isReadonly && payload.editorTextFocus
    },
    callback: (command: Command) => {
      command.executePaste()
    }
  },
  {
    i18nPath: 'contextmenu.global.selectAll',
    shortCut: `${isApple ? '⌘' : 'Ctrl'} + A`,
    when: payload => {
      return payload.editorTextFocus
    },
    callback: (command: Command) => {
      command.executeSelectAll()
    }
  },
  {
    isDivider: true
  },
  {
    i18nPath: 'contextmenu.global.hyperlink',
    icon: 'hyperlink',
    when: payload => {
      return (
        !payload.isReadonly &&
        payload.editorTextFocus &&
        payload.startElement?.type !== ElementType.HYPERLINK
      )
    },
    callback: (command: Command) => {
      command.executeGlobalHyperlink()
    }
  },
  {
    i18nPath: 'contextmenu.global.print',
    icon: 'print',
    when: () => true,
    callback: (command: Command) => {
      command.executePrint()
    }
  }
]
