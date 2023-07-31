import { ImageDisplay } from '../../../dataset/enum/Control'
import { ElementType } from '../../../dataset/enum/Element'
import {
  IContextMenuContext,
  IRegisterContextMenu
} from '../../../interface/contextmenu/ContextMenu'
import { Command } from '../../command/Command'

export const imageMenus: IRegisterContextMenu[] = [
  {
    i18nPath: 'contextmenu.image.change',
    icon: 'image-change',
    when: payload => {
      return (
        !payload.isReadonly &&
        !payload.editorHasSelection &&
        payload.startElement?.type === ElementType.IMAGE
      )
    },
    callback: (command: Command) => {
      // 创建代理元素
      const proxyInputFile = document.createElement('input')
      proxyInputFile.type = 'file'
      proxyInputFile.accept = '.png, .jpg, .jpeg'
      // 监听上传
      proxyInputFile.onchange = () => {
        const file = proxyInputFile.files![0]!
        const fileReader = new FileReader()
        fileReader.readAsDataURL(file)
        fileReader.onload = () => {
          const value = fileReader.result as string
          command.executeReplaceImageElement(value)
        }
      }
      proxyInputFile.click()
    }
  },
  {
    i18nPath: 'contextmenu.image.saveAs',
    icon: 'image',
    when: payload => {
      return (
        !payload.editorHasSelection &&
        payload.startElement?.type === ElementType.IMAGE
      )
    },
    callback: (command: Command) => {
      command.executeSaveAsImageElement()
    }
  },
  {
    i18nPath: 'contextmenu.image.textWrap',
    when: payload => {
      return (
        !payload.isReadonly &&
        !payload.editorHasSelection &&
        payload.startElement?.type === ElementType.IMAGE
      )
    },
    childMenus: [
      {
        i18nPath: 'contextmenu.image.textWrapType.embed',
        when: () => true,
        callback: (command: Command, context: IContextMenuContext) => {
          command.executeChangeImageDisplay(
            context.startElement!,
            ImageDisplay.BLOCK
          )
        }
      },
      {
        i18nPath: 'contextmenu.image.textWrapType.upDown',
        when: () => true,
        callback: (command: Command, context: IContextMenuContext) => {
          command.executeChangeImageDisplay(
            context.startElement!,
            ImageDisplay.INLINE
          )
        }
      }
    ]
  }
]
