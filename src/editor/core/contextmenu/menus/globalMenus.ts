import { IRegisterContextMenu } from "../../../interface/contextmenu/ContextMenu"

export const globalMenus: IRegisterContextMenu[] = [
  {
    name: '剪切',
    shortCut: 'Ctrl + X',
    when: (payload) => {
      return payload.editorHasSelection
    },
    callback: () => {
      console.log(this)
      console.log('cut')
    }
  },
  {
    name: '复制',
    shortCut: 'Ctrl + C',
    when: (payload) => {
      return payload.editorHasSelection
    },
    callback: () => {
      console.log('copy')
    }
  },
  {
    name: '粘贴',
    shortCut: 'Ctrl + V',
    when: (payload) => {
      return payload.editorTextFocus
    },
    callback: () => {
      console.log('paste')
    }
  },
  {
    name: '全选',
    shortCut: 'Ctrl + A',
    when: (payload) => {
      return payload.editorTextFocus
    },
    callback: () => {
      console.log('all')
    }
  },
  {
    isDivider: true
  },
  {
    icon: 'print',
    name: '打印',
    when: () => true,
    callback: () => {
      console.log('search')
    }
  }
]