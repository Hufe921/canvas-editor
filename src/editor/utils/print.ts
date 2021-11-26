export function printImageBase64(base64List: string[], width: number, height: number) {
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const doc = iframe.contentWindow!.document
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
  const stylesheet = `*{margin:0;padding:0;}`
  style.append(document.createTextNode(stylesheet))
  setTimeout(() => {
    doc.write(`${style.outerHTML}${container.innerHTML}`)
    iframe.contentWindow?.print()
    doc.close()
    iframe.remove()
  })
}