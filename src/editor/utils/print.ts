import { PaperDirection } from '../dataset/enum/Editor'

function convertPxToPaperSize(width: number, height: number) {
  if (width === 1125 && height === 1593) {
    return {
      size: 'a3',
      width: '297mm',
      height: '420mm'
    }
  }
  if (width === 794 && height === 1123) {
    return {
      size: 'a4',
      width: '210mm',
      height: '297mm'
    }
  }
  if (width === 565 && height === 796) {
    return {
      size: 'a5',
      width: '148mm',
      height: '210mm'
    }
  }
  // 其他默认不转换
  return {
    size: '',
    width: `${width}px`,
    height: `${height}px`
  }
}

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
  const paperSize = convertPxToPaperSize(width, height)
  base64List.forEach(base64 => {
    const image = document.createElement('img')
    image.style.width =
      direction === PaperDirection.HORIZONTAL
        ? paperSize.height
        : paperSize.width
    image.style.height =
      direction === PaperDirection.HORIZONTAL
        ? paperSize.width
        : paperSize.height
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
    size: ${paperSize.size} ${
    direction === PaperDirection.HORIZONTAL ? `landscape` : `portrait`
  };
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
