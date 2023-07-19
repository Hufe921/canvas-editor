interface IPrismKindStyle {
  color?: string
  italic?: boolean
  opacity?: number
  bold?: boolean
}

export function getPrismKindStyle(payload: string): IPrismKindStyle | null {
  switch (payload) {
    case 'comment':
    case 'prolog':
    case 'doctype':
    case 'cdata':
      return { color: '#008000', italic: true }
    case 'namespace':
      return { opacity: 0.7 }
    case 'string':
      return { color: '#A31515' }
    case 'punctuation':
    case 'operator':
      return { color: '#393A34' }
    case 'url':
    case 'symbol':
    case 'number':
    case 'boolean':
    case 'variable':
    case 'constant':
    case 'inserted':
      return { color: '#36acaa' }
    case 'atrule':
    case 'keyword':
    case 'attr-value':
      return { color: '#0000ff' }
    case 'function':
      return { color: '#b9a40a' }
    case 'deleted':
    case 'tag':
      return { color: '#9a050f' }
    case 'selector':
      return { color: '#00009f' }
    case 'important':
      return { color: '#e90', bold: true }
    case 'italic':
      return { italic: true }
    case 'class-name':
    case 'property':
      return { color: '#2B91AF' }
    case 'attr-name':
    case 'regex':
    case 'entity':
      return { color: '#ff0000' }
    default:
      return null
  }
}

type IFormatPrismToken = {
  type?: string
  content: string
} & IPrismKindStyle

export function formatPrismToken(
  payload: (Prism.Token | string)[]
): IFormatPrismToken[] {
  const formatTokenList: IFormatPrismToken[] = []
  function format(tokenList: (Prism.Token | string)[]) {
    for (let i = 0; i < tokenList.length; i++) {
      const element = tokenList[i]
      if (typeof element === 'string') {
        formatTokenList.push({
          content: element
        })
      } else if (Array.isArray(element.content)) {
        format(element.content)
      } else {
        const { type, content } = element
        if (typeof content === 'string') {
          formatTokenList.push({
            type,
            content,
            ...getPrismKindStyle(type)
          })
        }
      }
    }
  }
  format(payload)
  return formatTokenList
}
