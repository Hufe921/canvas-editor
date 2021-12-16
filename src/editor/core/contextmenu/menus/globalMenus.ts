import { IRegisterContextMenu } from "../../../interface/contextmenu/ContextMenu"

export const globalMenus: IRegisterContextMenu[] = [
  {
    icon: 'cut',
    name: '剪切',
    when: (payload) => {
      return payload.editorHasSelection
    },
    callback: () => {
      console.log('cut')
    }
  },
  {
    icon: 'copy',
    name: '复制',
    when: (payload) => {
      return payload.editorHasSelection
    },
    callback: () => {
      console.log('copy')
    }
  }, {
    icon: 'paste',
    name: '粘贴',
    when: (payload) => {
      return payload.editorTextFocus
    },
    callback: () => {
      console.log('paste')
    }
  }, {
    isSeparateLine: true
  }
]