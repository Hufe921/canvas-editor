import { INTERNAL_CONTEXT_MENU_KEY } from '../../../dataset/constant/ContextMenu'
import { IRegisterContextMenu } from '../../../interface/contextmenu/ContextMenu'
import { isApple } from '../../../utils/ua'
import { Command } from '../../command/Command'
const {
  GLOBAL: { CUT, COPY, PASTE, SELECT_ALL, PRINT }
} = INTERNAL_CONTEXT_MENU_KEY

export const globalMenus: IRegisterContextMenu[] = [
  {
    key: CUT,
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
    key: COPY,
    i18nPath: 'contextmenu.global.copy',
    shortCut: `${isApple ? '⌘' : 'Ctrl'} + C`,
    when: payload => {
      return payload.editorHasSelection || payload.isCrossRowCol
    },
    callback: (command: Command) => {
      command.executeCopy()
    }
  },
  {
    key: PASTE,
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
    key: SELECT_ALL,
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
    key: PRINT,
    i18nPath: 'contextmenu.global.print',
    icon: 'print',
    when: () => true,
    callback: (command: Command) => {
      command.executePrint()
    }
  }
]
