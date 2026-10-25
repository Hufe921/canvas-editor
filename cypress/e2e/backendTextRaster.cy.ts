interface IInkBox {
  left: number
  top: number
  right: number
  bottom: number
}

function getInkBox(ctx: CanvasRenderingContext2D): IInkBox {
  const { width, height } = ctx.canvas
  const { data } = ctx.getImageData(0, 0, width, height)
  let left = width
  let top = height
  let right = -1
  let bottom = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] === 0) continue
      left = Math.min(left, x)
      top = Math.min(top, y)
      right = Math.max(right, x)
      bottom = Math.max(bottom, y)
    }
  }
  return { left, top, right, bottom }
}

async function rasterizeText(
  win: Window,
  source: SVGTextElement,
  transform: string | null
): Promise<IInkBox> {
  const svg = win.document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('width', '200')
  svg.setAttribute('height', '100')
  svg.setAttribute('viewBox', '0 0 200 100')
  const text = source.cloneNode(true) as SVGTextElement
  text.setAttribute('x', '20')
  text.setAttribute('y', '50')
  text.setAttribute('fill', '#000000')
  if (transform === null) {
    text.removeAttribute('transform')
  } else {
    text.setAttribute('transform', transform)
  }
  svg.append(text)
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(svg)], {
      type: 'image/svg+xml'
    })
  )
  try {
    const image = new win.Image()
    image.src = url
    await image.decode()
    const canvas = win.document.createElement('canvas')
    canvas.width = 200
    canvas.height = 100
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(image, 0, 0)
    return getInkBox(ctx)
  } finally {
    URL.revokeObjectURL(url)
  }
}

describe('SVG 文本实际墨迹', () => {
  const targets = ['第一人民医院', '75*', '，', '。', '∆', '9']
  targets.forEach(target => {
    it(`${target} 与 Canvas 的 alphabetic 基线像素位置一致`, () => {
      cy.visit('http://localhost:3000/canvas-editor/?backend=svg')
      cy.get('.ce-page-container > svg[data-index="0"] text')
        .filter((_, text) => text.textContent === target)
        .first()
        .then(async text => {
          const win = text[0].ownerDocument.defaultView!
          const actual = await rasterizeText(
            win,
            text[0],
            text[0].getAttribute('transform')
          )
          const canvas = win.document.createElement('canvas')
          canvas.width = 200
          canvas.height = 100
          const ctx = canvas.getContext('2d')!
          ctx.font = text[0].style.font
          ctx.fillStyle = '#000000'
          ctx.fillText(target, 20, 50)
          const expected = getInkBox(ctx)
          expect(actual, JSON.stringify({ expected, actual })).to.deep.equal(
            expected
          )
        })
    })
  })
})
