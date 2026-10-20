import { INTERNAL_CONTEXT_MENU_KEY } from '../../../dataset/constant/ContextMenu'
import { ImageDisplay } from '../../../dataset/enum/Common'
import { ElementType } from '../../../dataset/enum/Element'
import { VerticalAlign } from '../../../dataset/enum/VerticalAlign'
import {
  IContextMenuContext,
  IRegisterContextMenu
} from '../../../interface/contextmenu/ContextMenu'
import { Command } from '../../command/Command'
const {
  IMAGE: {
    CHANGE,
    SAVE_AS,
    TEXT_WRAP,
    TEXT_WRAP_EMBED,
    TEXT_WRAP_UP_DOWN,
    TEXT_WRAP_SURROUND,
    TEXT_WRAP_FLOAT_TOP,
    TEXT_WRAP_FLOAT_BOTTOM,
    VERTICAL_ALIGN,
    VERTICAL_ALIGN_TOP,
    VERTICAL_ALIGN_MIDDLE,
    VERTICAL_ALIGN_BOTTOM
  }
} = INTERNAL_CONTEXT_MENU_KEY

export const imageMenus: IRegisterContextMenu[] = [
  {
    key: CHANGE,
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
    key: SAVE_AS,
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
    key: TEXT_WRAP,
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
        key: TEXT_WRAP_EMBED,
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
        key: TEXT_WRAP_UP_DOWN,
        i18nPath: 'contextmenu.image.textWrapType.upDown',
        when: () => true,
        callback: (command: Command, context: IContextMenuContext) => {
          command.executeChangeImageDisplay(
            context.startElement!,
            ImageDisplay.INLINE
          )
        }
      },
      {
        key: TEXT_WRAP_SURROUND,
        i18nPath: 'contextmenu.image.textWrapType.surround',
        when: () => true,
        callback: (command: Command, context: IContextMenuContext) => {
          command.executeChangeImageDisplay(
            context.startElement!,
            ImageDisplay.SURROUND
          )
        }
      },
      {
        key: TEXT_WRAP_FLOAT_TOP,
        i18nPath: 'contextmenu.image.textWrapType.floatTop',
        when: () => true,
        callback: (command: Command, context: IContextMenuContext) => {
          command.executeChangeImageDisplay(
            context.startElement!,
            ImageDisplay.FLOAT_TOP
          )
        }
      },
      {
        key: TEXT_WRAP_FLOAT_BOTTOM,
        i18nPath: 'contextmenu.image.textWrapType.floatBottom',
        when: () => true,
        callback: (command: Command, context: IContextMenuContext) => {
          command.executeChangeImageDisplay(
            context.startElement!,
            ImageDisplay.FLOAT_BOTTOM
          )
        }
      }
    ]
  },
  {
    key: VERTICAL_ALIGN,
    i18nPath: 'contextmenu.image.verticalAlign',
    when: payload => {
      const startElement = payload.startElement
      // 嵌入型图片或公式
      const isEmbedImage =
        startElement?.type === ElementType.IMAGE &&
        (!startElement.imgDisplay ||
          startElement.imgDisplay === ImageDisplay.BLOCK)
      return (
        !payload.isReadonly &&
        !payload.editorHasSelection &&
        (isEmbedImage || startElement?.type === ElementType.LATEX)
      )
    },
    childMenus: [
      {
        key: VERTICAL_ALIGN_TOP,
        i18nPath: 'contextmenu.image.verticalAlignType.top',
        when: () => true,
        callback: (command: Command, context: IContextMenuContext) => {
          command.executeChangeImageVerticalAlign(
            context.startElement!,
            VerticalAlign.TOP
          )
        }
      },
      {
        key: VERTICAL_ALIGN_MIDDLE,
        i18nPath: 'contextmenu.image.verticalAlignType.middle',
        when: () => true,
        callback: (command: Command, context: IContextMenuContext) => {
          command.executeChangeImageVerticalAlign(
            context.startElement!,
            VerticalAlign.MIDDLE
          )
        }
      },
      {
        key: VERTICAL_ALIGN_BOTTOM,
        i18nPath: 'contextmenu.image.verticalAlignType.bottom',
        when: () => true,
        callback: (command: Command, context: IContextMenuContext) => {
          command.executeChangeImageVerticalAlign(
            context.startElement!,
            VerticalAlign.BOTTOM
          )
        }
      }
    ]
  }
]
