import type Editor from '../../src/editor'

function findText(page: HTMLElement | SVGSVGElement, value: string) {
  return Array.from(page.querySelectorAll('text')).find(
    text => text.textContent === value
  )
}

describe('双后端字体视觉语义', () => {
  beforeEach(() => {
    cy.visitEditor()
  })

  it('正文、上下标、页眉页脚和水印使用 Canvas 字号', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeSelectAll()
      editor.command.executeBackspace()
      editor.command.executeInsertElementList([
        { value: 'Typography', size: 20, bold: true },
        { type: 'superscript', value: '2', actualSize: 10 }
      ])
      editor.command.executeAddWatermark({
        data: 'WM',
        size: 60,
        repeat: false
      })
      cy.getEditorPage().should(page => {
        if (page[0].tagName.toLowerCase() === 'svg') {
          expect(findText(page[0], 'Typography')).not.to.eq(undefined)
        }
      })
      cy.getEditorPage().then(page => {
        if (page[0].tagName.toLowerCase() === 'canvas') {
          expect(page[0].tagName.toLowerCase()).to.eq('canvas')
          return
        }
        const cases = [
          ['Typography', 20],
          ['2', 10],
          ['第一人民医院', 32],
          ['canvas-editor', 12],
          ['WM', 60]
        ] as const
        cases.forEach(([value, size]) => {
          const text = findText(page[0], value)
          expect(text, `文本 ${value}`).not.to.eq(undefined)
          expect(
            getComputedStyle(text!).fontSize,
            `${value} 的计算字号`
          ).to.eq(`${size}px`)
        })
        const body = findText(page[0], 'Typography')!
        expect(getComputedStyle(body).fontWeight).to.eq('700')
        expect(getComputedStyle(body).fontFamily).to.contain('Microsoft YaHei')
        const subtitle = Array.from(page[0].querySelectorAll('text')).find(
          text => text.textContent?.includes('门诊病历')
        )!
        expect(getComputedStyle(subtitle).fontSize).to.eq('18px')
      })
    })
  })

  it('重复水印的平铺尺寸与 Canvas 测量一致', () => {
    cy.getEditor().then((editor: Editor) => {
      editor.command.executeAddWatermark({
        data: 'WM',
        size: 60,
        repeat: true,
        gap: [20, 10]
      })
      cy.getEditorPage().should(page => {
        if (page[0].tagName.toLowerCase() === 'svg') {
          expect(page[0].querySelector('pattern image')).not.to.eq(null)
        }
      })
      cy.getEditorPage().then(page => {
        if (page[0].tagName.toLowerCase() === 'canvas') return
        const options = editor.command.getOptions()
        const { scale } = options
        const { font, gap } = options.watermark
        const measureContext = document.createElement('canvas').getContext('2d')!
        measureContext.font = `${60 * scale}px ${font}`
        const metrics = measureContext.measureText('WM')
        const textHeight =
          metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        const diagonal = Math.sqrt(
          Math.pow(metrics.width, 2) + Math.pow(textHeight, 2)
        )
        const expectedWidth = Math.floor(diagonal + 2 * gap[0] * scale)
        const expectedHeight = Math.floor(diagonal + 2 * gap[1] * scale)
        const pattern = page[0].querySelector('pattern')!
        const image = pattern.querySelector('image')!
        expect(Number(pattern.getAttribute('width'))).to.be.closeTo(
          expectedWidth,
          0.001
        )
        expect(Number(pattern.getAttribute('height'))).to.be.closeTo(
          expectedHeight,
          0.001
        )
        expect(Number(image.getAttribute('width'))).to.be.closeTo(
          expectedWidth,
          0.001
        )
        expect(Number(image.getAttribute('height'))).to.be.closeTo(
          expectedHeight,
          0.001
        )
        expect(image.getAttribute('preserveAspectRatio')).to.eq('none')
      })
    })
  })
})
