export function printImageBase64(svgList: string[], width: number, height: number) {
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const doc = iframe.contentWindow!.document
  doc.open()
  const container = document.createElement('div')
  svgList.forEach(svg => {
    const div = document.createElement('div')
    div.style.width = `${width}px`
    div.style.height = `${height}px`
    div.innerHTML = svg
    container.append(div)
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