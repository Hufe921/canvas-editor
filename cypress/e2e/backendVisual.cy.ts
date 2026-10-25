import type Editor from '../../src/editor'

const IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () =>
      reject(new Error(`图片加载失败: ${src.slice(0, 100)}`))
    image.src = src
  })
}

async function rasterizePage(
  page: HTMLCanvasElement | SVGSVGElement,
  referenceUrl: string
) {
  const reference = await loadImage(referenceUrl)
  const canvas = document.createElement('canvas')
  canvas.width = reference.naturalWidth
  canvas.height = reference.naturalHeight
  const context = canvas.getContext('2d')!
  if (page.tagName.toLowerCase() === 'canvas') {
    context.drawImage(
      page as HTMLCanvasElement,
      0,
      0,
      canvas.width,
      canvas.height
    )
  } else {
    const clone = page.cloneNode(true) as SVGSVGElement
    clone.setAttribute('width', String(canvas.width))
    clone.setAttribute('height', String(canvas.height))
    clone.style.margin = '0'
    const source = new XMLSerializer().serializeToString(clone)
    const svgImage = await loadImage(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`
    )
    context.drawImage(svgImage, 0, 0, canvas.width, canvas.height)
  }
  const referenceCanvas = document.createElement('canvas')
  referenceCanvas.width = canvas.width
  referenceCanvas.height = canvas.height
  const referenceContext = referenceCanvas.getContext('2d')!
  referenceContext.drawImage(reference, 0, 0)
  return {
    actual: context.getImageData(0, 0, canvas.width, canvas.height).data,
    expected: referenceContext.getImageData(0, 0, canvas.width, canvas.height)
      .data
  }
}

function comparePixels(actual: Uint8ClampedArray, expected: Uint8ClampedArray) {
  expect(actual.length).to.eq(expected.length)
  let difference = 0
  let mismatch = 0
  let actualInk = 0
  let expectedInk = 0
  for (let i = 0; i < actual.length; i += 4) {
    const delta =
      Math.abs(actual[i] - expected[i]) +
      Math.abs(actual[i + 1] - expected[i + 1]) +
      Math.abs(actual[i + 2] - expected[i + 2])
    difference += delta
    if (delta > 96) mismatch++
    if (actual[i] < 245 || actual[i + 1] < 245 || actual[i + 2] < 245) {
      actualInk++
    }
    if (expected[i] < 245 || expected[i + 1] < 245 || expected[i + 2] < 245) {
      expectedInk++
    }
  }
  const pixels = actual.length / 4
  expect(actualInk).to.be.greaterThan(1000)
  expect(expectedInk).to.be.greaterThan(1000)
  expect(difference / pixels / 3).to.be.lessThan(12)
  expect(mismatch / pixels).to.be.lessThan(0.15)
}

async function getCanvasReferenceUrl(editor: Editor): Promise<string> {
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  document.body.append(container)
  const reference = new (editor.constructor as typeof Editor)(
    container,
    editor.command.getValue().data,
    {
      ...editor.command.getOptions(),
      backend: 'canvas'
    }
  )
  try {
    const [url] = await reference.command.getImage()
    return url
  } finally {
    reference.destroy()
    container.remove()
  }
}

describe('双后端视觉回归', () => {
  beforeEach(() => {
    cy.visitEditor()
    cy.getEditorPage().should('have.length', 1)
  })

  it('复杂文档的文本、表格、控件、浮动图片、页眉页脚和水印像素一致', () => {
    cy.getEditor().then(async (editor: Editor) => {
      editor.command.executeSelectAll()
      editor.command.executeBackspace()
      editor.command.executeInsertElementList([
        { value: 'Dual backend visual regression', bold: true, size: 20 },
        { value: '\n' },
        {
          type: 'table',
          value: '',
          colgroup: [{ width: 180 }, { width: 180 }],
          trList: [
            {
              height: 42,
              minHeight: 42,
              tdList: [
                {
                  colspan: 1,
                  rowspan: 1,
                  value: [{ value: '表格 A' }, { value: '\n' }]
                },
                {
                  colspan: 1,
                  rowspan: 1,
                  value: [{ value: 'Table B' }, { value: '\n' }]
                }
              ]
            }
          ]
        },
        {
          type: 'control',
          value: '',
          control: {
            type: 'checkbox',
            value: [{ value: '同意' }],
            code: 'yes',
            valueSets: [{ value: '同意', code: 'yes' }]
          }
        },
        { value: '\n' },
        {
          type: 'image',
          value: IMAGE,
          width: 120,
          height: 60,
          imgDisplay: 'float-top',
          imgFloatPosition: { x: 360, y: 180 }
        },
        { value: '浮动图片周围的文本\n' }
      ])
      editor.command.executeAddWatermark({
        data: 'SVG Canvas',
        size: 60,
        opacity: 0.18,
        repeat: false
      })
      editor.command.executePageScale(1.1)
      await new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
      await editor.command.getImage()
      const referenceUrl = await getCanvasReferenceUrl(editor)
      const page = editor.command
        .getContainer()
        .querySelector<
          HTMLCanvasElement | SVGSVGElement
        >('.ce-page-container > [data-index="0"]')!
      const { actual, expected } = await rasterizePage(page, referenceUrl)
      comparePixels(actual, expected)

      if (page.tagName.toLowerCase() === 'svg') {
        const texts = Array.from(page.querySelectorAll('text')).map(
          text => text.textContent
        )
        expect(texts).to.include('第一人民医院')
        expect(texts).to.include('canvas-editor')
        expect(texts.some(text => text?.endsWith('表格 A'))).to.eq(true)
        expect(texts.some(text => text?.endsWith('Table B'))).to.eq(true)
        expect(texts).to.include('SVG Canvas')
        expect(
          Array.from(page.querySelectorAll('image')).some(
            image => image.getAttribute('href') === IMAGE
          )
        ).to.eq(true)
        const geometry = Array.from(page.querySelectorAll('rect'))
        expect(
          geometry.some(
            rect =>
              Number(rect.getAttribute('width')) > 100 &&
              Number(rect.getAttribute('height')) >= 40
          )
        ).to.eq(true)
        expect(
          Array.from(page.querySelectorAll('path')).some(path =>
            path.getAttribute('d')?.includes('L')
          )
        ).to.eq(true)
        expect(page.getAttribute('viewBox')).to.match(/^0 0 [\d.]+ [\d.]+$/)
      }

      editor.command.executeSetRange(0, 5)
      await new Promise<void>(resolve =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
      await new Promise(resolve => setTimeout(resolve, 400))
      expect(editor.command.getRangeText()).to.eq('Dual ')
      if (page.tagName.toLowerCase() === 'svg') {
        const rangeRect = editor.command.getRangeContext()!.rangeRects[0]
        const { rangeColor, rangeAlpha } = editor.command.getOptions()
        const selection = Array.from(page.querySelectorAll('rect')).find(
          rect =>
            rect.getAttribute('fill') === rangeColor &&
            Number(rect.getAttribute('opacity')) === rangeAlpha &&
            Number(rect.getAttribute('x')) === rangeRect.x &&
            Number(rect.getAttribute('y')) === rangeRect.y &&
            Number(rect.getAttribute('width')) === rangeRect.width &&
            Number(rect.getAttribute('height')) === rangeRect.height
        )
        expect(selection, '选区矩形与 Range 几何一致').not.to.eq(undefined)
      }
    })
  })
})
