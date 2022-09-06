import { ImageDisplay } from '../../../dataset/enum/Control'
import { ElementType } from '../../../dataset/enum/Element'
import { IContextMenuContext, IRegisterContextMenu } from '../../../interface/contextmenu/ContextMenu'
import { Command } from '../../command/Command'

export const imageMenus: IRegisterContextMenu[] = [
  {
    name: '更改图片',
    icon: 'image-change',
    when: (payload) => {
      return !payload.editorHasSelection && payload.startElement?.type === ElementType.IMAGE
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
    name: '另存为图片',
    icon: 'image',
    when: (payload) => {
      return !payload.editorHasSelection && payload.startElement?.type === ElementType.IMAGE
    },
    callback: (command: Command) => {
      command.executeSaveAsImageElement()
    }
  },
  {
    name: '文字环绕',
    when: (payload) => {
      return !payload.editorHasSelection && payload.startElement?.type === ElementType.IMAGE
    },
    childMenus: [
      {
        name: '嵌入型',
        when: () => true,
        callback: (command: Command, context: IContextMenuContext) => {
          command.executeChangeImageDisplay(context.startElement!, ImageDisplay.BLOCK)
        }
      },
      {
        name: '上下型环绕',
        when: () => true,
        callback: (command: Command, context: IContextMenuContext) => {
          command.executeChangeImageDisplay(context.startElement!, ImageDisplay.INLINE)

        }
      }
    ]
  }
]