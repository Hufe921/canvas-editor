// 复制内容时带入版权信息，代码仅为参考
import Editor from '../../editor'

export interface ICopyWithCopyrightOption {
  copyrightText: string
}

export function copyWithCopyrightPlugin(
  editor: Editor,
  options?: ICopyWithCopyrightOption
) {
  const copy = editor.command.executeCopy

  editor.command.executeCopy = () => {
    const { copyrightText } = options || {}
    if (copyrightText) {
      const rangeText = editor.command.getRangeText()
      if (!rangeText) return
      const text = `${rangeText}${copyrightText}`
      const plainText = new Blob([text], { type: 'text/plain' })
      // @ts-ignore
      const item = new ClipboardItem({
        [plainText.type]: plainText
      })
      window.navigator.clipboard.write([item])
    } else {
      copy()
    }
  }
}
