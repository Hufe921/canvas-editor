import { IRegisterContextMenu } from '../../../interface/contextmenu/ContextMenu'
import { Command } from '../../command/Command'

export const globalMenus: IRegisterContextMenu[] = [
  {
    name: '剪切',
    shortCut: 'Ctrl + X',
    when: (payload) => {
      return !payload.isReadonly && payload.editorHasSelection
    },
    callback: (command: Command) => {
      command.executeCut()
    }
  },
  {
    name: '复制',
    shortCut: 'Ctrl + C',
    when: (payload) => {
      return payload.editorHasSelection
    },
    callback: (command: Command) => {
      command.executeCopy()
    }
  },
  {
    name: '粘贴',
    shortCut: 'Ctrl + V',
    when: (payload) => {
      return !payload.isReadonly && payload.editorTextFocus
    },
    callback: (command: Command) => {
      command.executePaste()
    }
  },
  {
    name: '全选',
    shortCut: 'Ctrl + A',
    when: (payload) => {
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
    icon: 'print',
    name: '打印',
    when: () => true,
    callback: (command: Command) => {
      command.executePrint()
    }
  }
]