import { PaperDirection } from '../dataset/enum/Editor'

export interface IPrintImageBase64Option {
  width: number
  height: number
  direction?: PaperDirection
}
export function printImageBase64(
  base64List: string[],
  options: IPrintImageBase64Option
) {
  const { width, height, direction = PaperDirection.VERTICAL } = options
  const iframe = document.createElement('iframe')
  // 离屏渲染
  iframe.style.visibility = 'hidden'
  iframe.style.position = 'absolute'
  iframe.style.left = '0'
  iframe.style.top = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = 'none'
  document.body.append(iframe)
  const contentWindow = iframe.contentWindow!
  const doc = contentWindow.document
  doc.open()
  const container = document.createElement('div')
  base64List.forEach(base64 => {
    const image = document.createElement('img')
    image.style.width = `${width}px`
    image.style.height = `${height}px`
    image.src = base64
    container.append(image)
  })
  const style = document.createElement('style')
  const stylesheet = `
  * {
    margin: 0;
    padding: 0;
  }
  @page {
    margin: 0;
    size: ${direction === PaperDirection.HORIZONTAL ? `landscape` : `portrait`};
  }`
  style.append(document.createTextNode(stylesheet))
  setTimeout(() => {
    doc.write(`${style.outerHTML}${container.innerHTML}`)
    contentWindow.print()
    doc.close()
    // 移除iframe
    window.addEventListener(
      'mouseover',
      () => {
        iframe?.remove()
      },
      {
        once: true
      }
    )
  })
}
