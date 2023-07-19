// 简化版markdown转IElement插件示例，代码仅为参考
import Editor, {
  Command,
  ElementType,
  IElement,
  ListType,
  TitleLevel
} from '../../editor'

export type CommandWithMarkdown = Command & {
  executeInsertMarkdown(markdown: string): void
}

export const titleNodeNameMapping: Record<string, TitleLevel> = {
  '1': TitleLevel.FIRST,
  '2': TitleLevel.SECOND,
  '3': TitleLevel.THIRD,
  '4': TitleLevel.FOURTH,
  '5': TitleLevel.FIFTH,
  '6': TitleLevel.SIXTH
}

function convertMarkdownToElement(markdown: string): IElement[] {
  const elementList: IElement[] = []
  const lines = markdown.trim().split('\n')
  for (let l = 0; l < lines.length; l++) {
    const line = lines[l]
    if (line.startsWith('#')) {
      const level = line.indexOf(' ')
      elementList.push({
        type: ElementType.TITLE,
        level: titleNodeNameMapping[level],
        value: '',
        valueList: [
          {
            value: line.slice(level + 1)
          }
        ]
      })
    } else if (line.startsWith('- ')) {
      elementList.push({
        type: ElementType.LIST,
        listType: ListType.UL,
        value: '',
        valueList: [
          {
            value: line.slice(2)
          }
        ]
      })
    } else if (/^\d+\.\s/.test(line)) {
      elementList.push({
        type: ElementType.LIST,
        listType: ListType.OL,
        value: '',
        valueList: [
          {
            value: line.replace(/^\d+\.\s/, '')
          }
        ]
      })
    } else if (/^\[.*?\]\(.*?\)$/.test(line)) {
      const match = line.match(/^\[(.*?)\]\((.*?)\)$/)
      elementList.push({
        type: ElementType.HYPERLINK,
        value: '',
        valueList: [
          {
            value: match![1]
          }
        ],
        url: match![2]
      })
    } else if (/^\*\*(.*?)\*\*$/.test(line)) {
      const match = line.match(/^\*\*(.*?)\*\*$/)
      elementList.push({
        type: ElementType.TEXT,
        value: match![1],
        bold: true
      })
    } else if (/^\*(.*?)\*$/.test(line)) {
      const match = line.match(/^\*(.*?)\*$/)
      elementList.push({
        type: ElementType.TEXT,
        value: match![1],
        italic: true
      })
    } else if (/^__(.*?)__$/.test(line)) {
      const match = line.match(/^__(.*?)__$/)
      elementList.push({
        type: ElementType.TEXT,
        value: match![1],
        underline: true
      })
    } else if (/^~~(.*?)~~$/.test(line)) {
      const match = line.match(/^~~(.*?)~~$/)
      elementList.push({
        type: ElementType.TEXT,
        value: match![1],
        strikeout: true
      })
    } else {
      elementList.push({
        type: ElementType.TEXT,
        value: line
      })
    }
  }
  return elementList
}

export function markdownPlugin(editor: Editor) {
  const command = <CommandWithMarkdown>editor.command
  command.executeInsertMarkdown = (markdown: string) => {
    const elementList = convertMarkdownToElement(markdown)
    command.executeInsertElementList(elementList)
  }
}
