export function printImageBase64(base64: string) {
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const doc = iframe.contentWindow!.document
  doc.open()
  const image = doc.createElement('img')
  image.style.width = '794px'
  image.style.height = '1123px'
  image.src = base64
  const style = document.createElement('style')
  const stylesheet = `*{margin:0;padding:0;}`
  style.append(document.createTextNode(stylesheet))
  setTimeout(() => {
    doc.write(`${style.outerHTML}${image.outerHTML}`)
    iframe.contentWindow?.print()
    doc.close()
    iframe.remove()
  })
}